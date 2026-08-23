/**
 * SELECT Query Visualizer - Enhanced JOIN Visualization
 * Displays table structure and query results with detailed JOIN visualization
 * Supports 2D/3D view modes and shows matching rows clearly
 */

import * as THREE from "three";
import BaseVisualizer from "./base.js";

export default class SelectVisualizer extends BaseVisualizer {
  constructor(scene, camera) {
    super(scene, camera);
    this.tables = new Map();
    this.rows = new Map();
    this.joinConnections = [];
    this.viewMode = '3d'; // '2d' or '3d'
    this.lastQuery = null;
    this.stages = []; // Ordered SQL logical-execution stages for the current query
    this.activeStageIndex = -1; // Read by index.html to drive the execution-order panel
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (this.lastQuery) {
      this.update(this.lastQuery);
    }
  }

  update(selectQuery) {
    this.clear();

    if (!selectQuery) return;

    this.lastQuery = selectQuery;
    this.stages = this.computeStages(selectQuery);
    this.activeStageIndex = -1;
    const { from, columns, joins, groupBy, orderBy } = selectQuery;

    // GROUP BY pipeline visualization
    if (groupBy && groupBy.length > 0) {
      this.visualizeGroupByPipeline(from, groupBy, columns, orderBy);
    }
    // Enhanced JOIN visualization
    else if (joins && joins.length > 0) {
      this.visualizeJoin(from, joins[0], columns);
    }
    // Simple SELECT without JOIN or GROUP BY - full execution-order pipeline
    else {
      this.visualizePipeline(from, selectQuery);
    }
  }

  /**
   * Ordered list of SQL clauses actually present on this query, in real SQL
   * *logical* execution order (not the order they're typed in):
   * FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT.
   * Read by index.html to drive the on-screen execution-order panel.
   */
  computeStages(q) {
    const stages = [];
    const hasJoin = q.joins && q.joins.length > 0;
    stages.push({
      key: 'FROM',
      label: hasJoin ? `FROM ${q.from} + JOIN ${q.joins[0].table}` : `FROM ${q.from}`,
    });
    if (q.where && q.where.length > 0) stages.push({ key: 'WHERE', label: 'WHERE filter' });
    if (q.groupBy && q.groupBy.length > 0) {
      stages.push({ key: 'GROUP_BY', label: `GROUP BY ${q.groupBy.join(', ')}` });
    }
    if (q.having && q.having.length > 0) stages.push({ key: 'HAVING', label: 'HAVING filter' });
    stages.push({ key: 'SELECT', label: 'SELECT columns' });
    if (q.distinct) stages.push({ key: 'DISTINCT', label: 'DISTINCT dedupe' });
    if (q.orderBy && q.orderBy.length > 0) {
      const dir = q.orderBy[0].direction || 'ASC';
      stages.push({ key: 'ORDER_BY', label: `ORDER BY ${dir}` });
    }
    if (q.limit) stages.push({ key: 'LIMIT', label: `LIMIT ${q.limit.count}` });
    return stages;
  }

  /**
   * Full SQL execution-order pipeline for a plain SELECT (no JOIN, no GROUP
   * BY): FROM -> [WHERE] -> SELECT -> [DISTINCT] -> [ORDER BY] -> [LIMIT],
   * each a real animated transformation of the row set, staged in sync with
   * `this.stages`/`this.activeStageIndex` (read by index.html's execution
   * order panel).
   */
  visualizePipeline(tableName, q) {
    const tableZ = this.viewMode === '2d' ? 0 : -1;
    const tableX = 0;

    this.createTableHeader(tableName, tableX, tableZ);

    const sourceRows = q.sourceRows;
    if (!sourceRows) {
      this.createLabel('Run query to see data flow', tableX, -1, tableZ, 0.2);
      return;
    }
    if (sourceRows.length === 0) {
      this.createLabel('Table is empty', tableX, -1, tableZ, 0.2);
      return;
    }

    const filteredRows = q.filteredRows || sourceRows;
    const resultRows = q.resultRows || [];
    const resultColumns = q.resultColumns || [];
    const hasWhere = q.where && q.where.length > 0;
    const hasDistinct = !!q.distinct;
    const hasOrderBy = q.orderBy && q.orderBy.length > 0;
    const hasLimit = !!q.limit;

    const maxRows = Math.min(sourceRows.length, 8);
    const displayRows = sourceRows.slice(0, maxRows);
    const filteredKeys = new Set(filteredRows.map(r => this.rowKey(r)));
    const SEP = '␟';
    const rowId = (row) => resultColumns.map(c => String(row[c])).join(SEP);

    const timeline = gsap.timeline();
    this.addAnimation(timeline);

    // NOTE: each stage callback below closes over a `const stage = stageIdx++`
    // snapshot, not the mutable `stageIdx` itself - gsap callbacks fire on a
    // later tick, by which point stageIdx would already hold its final value.
    let stageIdx = 0;
    const fromStage = stageIdx++;
    timeline.call(() => { this.activeStageIndex = fromStage; }, null, 0);

    // A row's floating value label is a separate CSS2DObject (not a mesh
    // child - see createDataRow), so every fade/move below must carry it
    // along explicitly or it'll be left behind hovering over nothing.
    const fadeOutRow = (r, t) => {
      timeline.to(r.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.4, ease: "back.in(2)" }, t);
      timeline.to(r.mesh.material, { opacity: 0 }, t);
      if (r.mesh.userData.label) {
        timeline.to(r.mesh.userData.label.element, { opacity: 0, duration: 0.3 }, t);
      }
      r.active = false;
    };

    // ---- Stage: FROM ----
    const rows = displayRows.map((row, i) => {
      const y = 0.8 - i * 0.4;
      const mesh = this.createDataRow(row, tableX, y, tableZ, 0x00ADD8, i, true);
      return { key: this.rowKey(row), row, mesh, y, active: true };
    });

    let cursor = 0.3 + maxRows * 0.1 + 0.5;

    // ---- Stage: WHERE ----
    if (hasWhere) {
      const stage = stageIdx++;
      timeline.call(() => { this.activeStageIndex = stage; }, null, cursor);
      rows.forEach((r, i) => {
        const t = cursor + i * 0.06;
        if (filteredKeys.has(r.key)) {
          timeline.to(r.mesh.material.color, { r: 0, g: 1, b: 0.53 }, t);
          timeline.to(r.mesh.material, { emissiveIntensity: 0.7 }, t);
          timeline.to(r.mesh.material, { emissiveIntensity: 0.3 }, t + 0.3);
        } else {
          fadeOutRow(r, t);
        }
      });
      cursor += maxRows * 0.06 + 0.5;
    }

    // ---- Stage: SELECT ----
    {
      const stage = stageIdx++;
      timeline.call(() => { this.activeStageIndex = stage; }, null, cursor);
      rows.filter(r => r.active).forEach((r, i) => {
        timeline.to(r.mesh.scale, { y: 1.3, duration: 0.15, yoyo: true, repeat: 1 }, cursor + i * 0.04);
      });
      cursor += 0.45;
    }

    // ---- Stage: DISTINCT ----
    if (hasDistinct) {
      const stage = stageIdx++;
      timeline.call(() => { this.activeStageIndex = stage; }, null, cursor);
      const seen = new Set();
      const activeBefore = rows.filter(r => r.active);
      activeBefore.forEach((r, i) => {
        const id = rowId(r.row);
        if (seen.has(id)) {
          fadeOutRow(r, cursor + i * 0.05);
        } else {
          seen.add(id);
        }
      });
      timeline.call(() => {
        this.createLabel(`${activeBefore.length} → ${resultRows.length} distinct`, tableX, -2.6, tableZ, 0.15);
      }, null, cursor);
      cursor += 0.5 + activeBefore.length * 0.05;
    }

    // ---- Stage: ORDER BY ----
    if (hasOrderBy && resultRows.length > 0) {
      const stage = stageIdx++;
      timeline.call(() => { this.activeStageIndex = stage; }, null, cursor);
      const finalOrder = resultRows.map(r => r.map(String).join(SEP));
      rows.filter(r => r.active).forEach(r => {
        const newIdx = finalOrder.indexOf(rowId(r.row));
        if (newIdx !== -1) {
          const newY = 0.8 - newIdx * 0.4;
          timeline.to(r.mesh.position, { y: newY, duration: 0.8, ease: "power2.inOut" }, cursor);
          if (r.mesh.userData.label) {
            timeline.to(r.mesh.userData.label.position, { y: newY, duration: 0.8, ease: "power2.inOut" }, cursor);
          }
          r.y = newY;
        }
      });
      cursor += 0.9;
    }

    // ---- Stage: LIMIT ----
    if (hasLimit) {
      const stage = stageIdx++;
      timeline.call(() => { this.activeStageIndex = stage; }, null, cursor);
      const keepCount = q.limit.count;
      const activeSorted = rows.filter(r => r.active).sort((a, b) => b.y - a.y);
      activeSorted.forEach((r, i) => {
        if (i >= keepCount) {
          fadeOutRow(r, cursor + i * 0.05);
        }
      });
      cursor += 0.5;
    }

    timeline.call(() => {
      this.createLabel(`${resultRows.length} row(s) returned`, tableX, -2.2, tableZ, 0.15);
    }, null, cursor);
  }

  /**
   * Enhanced JOIN visualization
   */
  visualizeJoin(leftTable, join, columns) {
    const rightTable = join.table;
    const joinType = (join.type || 'INNER').toUpperCase();
    const joinColor = joinType.includes('INNER') ? '#00FF88' :
      joinType.includes('LEFT') ? '#FFAA44' :
      joinType.includes('RIGHT') ? '#4ECDC4' : '#FFFFFF';

    // Table positions
    const leftX = this.viewMode === '2d' ? -4 : -5;
    const rightX = this.viewMode === '2d' ? 4 : 5;
    const tableZ = this.viewMode === '2d' ? 0 : -2;

    // Stage 0 (FROM+JOIN) starts immediately; none of this app's JOIN
    // examples combine WHERE/ORDER BY/LIMIT with a JOIN (that needs
    // row-level filtering across two tables, out of scope here), so once
    // matches are revealed we jump straight to the final stage (SELECT).
    this.activeStageIndex = 0;

    // Create headers
    this.createTableHeader(leftTable, leftX, tableZ);
    this.createTableHeader(rightTable, rightX, tableZ);
    // join.type already includes the JOIN keyword (e.g. "LEFT_JOIN") - just
    // make it readable, don't append JOIN again
    this.createColoredLabel(joinType.replace(/_/g, ' '), 0, 3, 0, 0.4, joinColor);

    const leftData = this.lastQuery && this.lastQuery.leftRows;
    const rightData = this.lastQuery && this.lastQuery.rightRows;

    // No real data yet (query hasn't been run) - show a lightweight preview
    if (!leftData || !rightData) {
      this.createLabel('Run query to see matched rows', 0, 0, 0, 0.22);
      return;
    }

    this.addAnimation(gsap.delayedCall(1.2, () => {
      this.activeStageIndex = this.stages.length - 1;
    }));

    const cond = this.parseJoinCondition(join.on, leftTable, rightTable);
    const matches = cond
      ? this.findMatches(leftData, rightData, cond.leftCol, cond.rightCol)
      : [];

    if (joinType.includes('LEFT')) {
      this.visualizeLeftJoin(leftData, rightData, matches, leftX, rightX, tableZ);
    } else if (joinType.includes('RIGHT')) {
      this.visualizeRightJoin(leftData, rightData, matches, leftX, rightX, tableZ);
    } else {
      this.visualizeInnerJoin(leftData, rightData, matches, leftX, rightX, tableZ);
    }
  }

  /**
   * Parse an equi-join ON clause (e.g. "users.id = orders.user_id") into
   * the column name on each side, regardless of which side is written first.
   */
  parseJoinCondition(onStr, leftTable, rightTable) {
    if (!onStr) return null;

    const qualified = onStr.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
    if (qualified) {
      const [, t1, c1, t2, c2] = qualified;
      if (t1.toLowerCase() === leftTable.toLowerCase()) return { leftCol: c1, rightCol: c2 };
      if (t1.toLowerCase() === rightTable.toLowerCase()) return { leftCol: c2, rightCol: c1 };
      // Unrecognized prefixes - fall back to positional order
      return { leftCol: c1, rightCol: c2 };
    }

    const bare = onStr.match(/(\w+)\s*=\s*(\w+)/);
    if (bare) return { leftCol: bare[1], rightCol: bare[2] };

    return null;
  }

  /**
   * Find matching rows between two real row-object arrays using the
   * parsed equi-join columns.
   */
  findMatches(leftData, rightData, leftCol, rightCol) {
    const matches = [];
    leftData.forEach((leftRow, leftIdx) => {
      rightData.forEach((rightRow, rightIdx) => {
        if (
          leftRow[leftCol] !== undefined &&
          rightRow[rightCol] !== undefined &&
          String(leftRow[leftCol]) === String(rightRow[rightCol])
        ) {
          matches.push({ leftIdx, rightIdx, leftRow, rightRow });
        }
      });
    });
    return matches;
  }

  /**
   * INNER JOIN: Only matching rows (GREEN)
   */
  visualizeInnerJoin(leftData, rightData, matches, leftX, rightX, tableZ) {
    const matchedLeftIndices = new Set(matches.map(m => m.leftIdx));
    const matchedRightIndices = new Set(matches.map(m => m.rightIdx));
    
    const leftRowPositions = new Map();
    let displayIdx = 0;
    
    // Show only matched left rows
    matchedLeftIndices.forEach((idx) => {
      const row = leftData[idx];
      const y = 0.8 - displayIdx * 0.4;
      leftRowPositions.set(idx, y);
      this.createDataRow(row, leftX, y, tableZ, 0x00FF88, displayIdx, true);
      displayIdx++;
    });
    
    const rightRowPositions = new Map();
    displayIdx = 0;
    
    // Show only matched right rows
    matchedRightIndices.forEach((idx) => {
      const row = rightData[idx];
      const y = 0.8 - displayIdx * 0.4;
      rightRowPositions.set(idx, y);
      this.createDataRow(row, rightX, y, tableZ, 0x00FF88, displayIdx, true);
      displayIdx++;
    });
    
    // Draw connections
    matches.forEach((match, idx) => {
      const leftY = leftRowPositions.get(match.leftIdx);
      const rightY = rightRowPositions.get(match.rightIdx);
      if (leftY !== undefined && rightY !== undefined) {
        this.createConnectionLine(leftX, leftY, tableZ, rightX, rightY, tableZ, 0x00FF88, idx);
      }
    });
    
    this.createLabel(`✓ ${matches.length} matching rows`, 0, -2.2, 0, 0.2);
  }

  /**
   * LEFT JOIN: All left rows + matched right rows
   */
  visualizeLeftJoin(leftData, rightData, matches, leftX, rightX, tableZ) {
    // Show ALL left rows
    leftData.forEach((row, idx) => {
      const y = 0.8 - idx * 0.4;
      const isMatched = matches.some(m => m.leftIdx === idx);
      const color = isMatched ? 0x00FF88 : 0xFFAA44; // Green if matched, orange if not
      this.createDataRow(row, leftX, y, tableZ, color, idx, isMatched);
    });
    
    // Show only matched right rows (aligned with left matches)
    matches.forEach((match, idx) => {
      const row = rightData[match.rightIdx];
      const y = 0.8 - match.leftIdx * 0.4;
      this.createDataRow(row, rightX, y, tableZ, 0x00FF88, idx, true);
      this.createConnectionLine(leftX, y, tableZ, rightX, y, tableZ, 0x00FF88, idx);
    });
    
    this.createLabel(`${leftData.length} left rows (all)`, leftX, -2.8, 0, 0.15);
    this.createLabel(`${matches.length} matched`, rightX, -2.8, 0, 0.15);
  }

  /**
   * RIGHT JOIN: Matched left rows + all right rows
   */
  visualizeRightJoin(leftData, rightData, matches, leftX, rightX, tableZ) {
    // Show only matched left rows (aligned with right matches)
    matches.forEach((match, idx) => {
      const row = leftData[match.leftIdx];
      const y = 0.8 - match.rightIdx * 0.4;
      this.createDataRow(row, leftX, y, tableZ, 0x00FF88, idx, true);
      this.createConnectionLine(leftX, y, tableZ, rightX, y, tableZ, 0x00FF88, idx);
    });
    
    // Show ALL right rows
    rightData.forEach((row, idx) => {
      const y = 0.8 - idx * 0.4;
      const isMatched = matches.some(m => m.rightIdx === idx);
      const color = isMatched ? 0x00FF88 : 0x4ECDC4; // Green if matched, cyan if not
      this.createDataRow(row, rightX, y, tableZ, color, idx, isMatched);
    });
    
    this.createLabel(`${matches.length} matched`, leftX, -2.8, 0, 0.15);
    this.createLabel(`${rightData.length} right rows (all)`, rightX, -2.8, 0, 0.15);
  }

  /**
   * Create table header
   */
  createTableHeader(tableName, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const depth = this.viewMode === '2d' ? 0.1 : 1.5;
    const headerGeom = new THREE.BoxGeometry(3.5, 0.4, depth);
    const headerMat = new THREE.MeshStandardMaterial({
      color: 0x00ADD8,
      metalness: 0.4,
      roughness: 0.6,
      emissive: 0x00ADD8,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.82
    });
    const header = new THREE.Mesh(headerGeom, headerMat);
    header.position.y = 1.5;
    group.add(header);

    // Entrance: drop into place and scale up, matching the other visualizers
    header.scale.y = 0;
    header.position.y = 3.5;
    const dropAnim = gsap.to(header.position, {
      y: 1.5,
      duration: 0.6,
      ease: "bounce.out"
    });
    const growAnim = gsap.to(header.scale, {
      y: 1,
      duration: 0.5,
      ease: "back.out(2)"
    });
    this.addAnimation(dropAnim);
    this.addAnimation(growAnim);

    this.tables.set(tableName, group);
    this.addObject(group);

    this.createLabel(tableName, x, 2.2, z, 0.35);
  }

  /**
   * Create data row
   */
  createDataRow(data, x, y, z, color, index, isMatched) {
    const depth = this.viewMode === '2d' ? 0.1 : 0.4;
    const rowGeom = new THREE.BoxGeometry(3.5, 0.3, depth);
    const rowMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.7,
      emissive: color,
      emissiveIntensity: isMatched ? 0.3 : 0.1,
      transparent: true,
      opacity: isMatched ? 1.0 : 0.6
    });
    const row = new THREE.Mesh(rowGeom, rowMat);
    row.position.set(x, y, z);

    row.scale.x = 0;
    const anim = gsap.to(row.scale, {
      x: 1,
      duration: 0.5,
      delay: index * 0.08,
      ease: "back.out(1.7)"
    });
    this.addAnimation(anim);

    this.addObject(row);

    // Show data value - stashed on userData so callers that move/fade this
    // row (e.g. the execution-order pipeline) can keep the label in sync,
    // since a CSS2DObject label doesn't inherit the mesh's transform/opacity.
    const firstValue = Object.values(data)[1] || Object.values(data)[0];
    row.userData.label = this.createSmallLabel(String(firstValue), x, y, z + 0.3, 0.12);

    return row;
  }

  /**
   * Create curved connection line
   */
  createConnectionLine(x1, y1, z1, x2, y2, z2, color, index) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(x1 + 1.75, y1, z1),
      new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2 + 0.5, (z1 + z2) / 2),
      new THREE.Vector3(x2 - 1.75, y2, z2)
    );

    const points = curve.getPoints(20);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0
    });

    const line = new THREE.Line(geometry, material);
    this.addObject(line);
    this.joinConnections.push(line);

    const anim = gsap.to(material, {
      opacity: 0.8,
      duration: 0.6,
      delay: 0.3 + index * 0.1,
      ease: "power2.out"
    });
    this.addAnimation(anim);

    this.createArrow(x2 - 1.75, y2, z2, color, index);
  }

  /**
   * Create arrow indicator
   */
  createArrow(x, y, z, color, index) {
    const arrowGeom = new THREE.ConeGeometry(0.1, 0.2, 8);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5
    });
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.position.set(x, y, z);
    arrow.rotation.z = -Math.PI / 2;

    arrow.scale.set(0, 0, 0);
    const anim = gsap.to(arrow.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.3,
      delay: 0.5 + index * 0.1,
      ease: "back.out(2)"
    });
    this.addAnimation(anim);

    this.addObject(arrow);
  }

  createLabel(text, x, y, z, scale = 0.2) {
    return this.makeTag(text, x, y, z, {
      color: '#00ADD8', size: scale >= 0.3 ? 'lg' : scale <= 0.15 ? 'sm' : 'md',
    });
  }

  createSmallLabel(text, x, y, z, scale) {
    return this.makeTag(text, x, y, z, { color: '#E8F4FD', size: 'sm' });
  }

  createColoredLabel(text, x, y, z, scale, color) {
    return this.makeTag(text, x, y, z, { color, size: 'lg' });
  }

  clear() {
    // Call parent clear to remove all tracked objects
    super.clear();
    
    // Clear local collections
    this.tables.clear();
    this.rows.clear();
    this.joinConnections = [];
  }

  /**
   * GROUP BY Pipeline Visualization
   * Orchestrates the (already-written) FROM -> GROUP BY -> AGGREGATE -> ORDER BY
   * stage animations in sequence, using real data fetched by the Run handler.
   */
  visualizeGroupByPipeline(tableName, groupByColumns, selectColumns, orderBy) {
    const rawGroupCol = (groupByColumns && groupByColumns[0]) || 'column';
    const groupColumn = rawGroupCol.includes('.') ? rawGroupCol.split('.').pop() : rawGroupCol;

    this.createColoredLabel('GROUP BY Pipeline', 0, 5, 0, 0.4, '#FFD700');

    const sourceRows = this.lastQuery && this.lastQuery.sourceRows;
    const resultRows = this.lastQuery && this.lastQuery.resultRows;
    const resultColumns = this.lastQuery && this.lastQuery.resultColumns;
    const stageIndex = (key) => this.stages.findIndex(s => s.key === key);
    const setStage = (delay, key) => {
      const i = stageIndex(key);
      this.addAnimation(gsap.delayedCall(delay, () => { this.activeStageIndex = i; }));
    };

    // Pure GROUP BY (no JOIN): animate the full 4-stage pipeline from raw rows
    if (sourceRows && sourceRows.length > 0) {
      const aggregates = this.parseAggregates(selectColumns);
      let groups = this.groupDataByColumn(sourceRows, groupColumn);
      let aggregatedData = this.calculateAggregates(groups, aggregates);

      // If a HAVING clause dropped groups, SQL.js's real result already
      // reflects that - mirror it here so the animated bars match reality
      // instead of showing every raw group.
      if (resultRows && resultRows.length > 0 && resultColumns && resultColumns.includes(groupColumn)) {
        const groupColIdx = resultColumns.indexOf(groupColumn);
        const passingGroups = new Set(resultRows.map(r => String(r[groupColIdx])));
        aggregatedData = aggregatedData.filter(d => passingGroups.has(String(d.group)));
        const filteredGroups = {};
        Object.keys(groups).forEach(k => { if (passingGroups.has(String(k))) filteredGroups[k] = groups[k]; });
        groups = filteredGroups;
      }

      const clusterPositions = this.calculateClusterPositions(groups);

      setStage(0, 'FROM');
      const fromDuration = 0.5 + sourceRows.length * 0.1 + 1.0;
      this.animateFromStage(tableName, sourceRows, 0);

      const groupDelay = fromDuration;
      const groupDuration = 1.2 + sourceRows.length * 0.05;
      setStage(groupDelay, 'GROUP_BY');
      this.animateGroupByStage(sourceRows, groupColumn, clusterPositions, groupDelay);

      const aggDelay = groupDelay + groupDuration;
      setStage(aggDelay, stageIndex('HAVING') !== -1 ? 'HAVING' : 'SELECT');
      this.animateAggregateStage(groups, clusterPositions, aggregatedData, groupColumn, aggDelay);

      if (orderBy && orderBy.length > 0) {
        const orderDelay = aggDelay + 0.8 + 0.3;
        setStage(orderDelay, 'ORDER_BY');
        this.animateOrderByStage(aggregatedData, orderBy, clusterPositions, orderDelay);
      }
      return;
    }

    // JOIN + GROUP BY combo (raw source rows aren't enough to reconstruct the
    // join client-side): jump straight to a bar chart driven by the real,
    // already-aggregated query results SQL.js computed.
    if (resultRows && resultRows.length > 0 && resultColumns) {
      this.activeStageIndex = this.stages.length - 1;
      this.visualizeResultBarChart(resultColumns, resultRows);
      return;
    }

    // Nothing run yet - lightweight preview
    this.createTableHeader(tableName, 0, 0);
    this.createLabel('Run query to see pipeline', 0, 0, 0, 0.22);
  }

  /**
   * Bar chart built directly from real, already-computed result rows.
   * Assumes the last column is the aggregate value and the first is the label
   * (true for every GROUP BY example in this app).
   */
  visualizeResultBarChart(resultColumns, resultRows) {
    const labelIdx = 0;
    const valueIdx = resultColumns.length - 1;
    const spacing = 3;
    const startX = -((resultRows.length - 1) * spacing) / 2;
    const maxValue = Math.max(...resultRows.map(r => Number(r[valueIdx]) || 0), 1);

    resultRows.forEach((row, idx) => {
      const label = String(row[labelIdx]);
      const value = Number(row[valueIdx]) || 0;
      const x = startX + idx * spacing;
      const barHeight = 0.4 + (value / maxValue) * 3.2;

      const barGeom = new THREE.BoxGeometry(0.8, barHeight, 0.8);
      const barMat = new THREE.MeshStandardMaterial({
        color: 0x00FF88,
        emissive: 0x00FF88,
        emissiveIntensity: 0.4,
        metalness: 0.4,
        roughness: 0.6,
        transparent: true,
        opacity: 0.82
      });
      const bar = new THREE.Mesh(barGeom, barMat);
      bar.position.set(x, barHeight / 2, 0);
      bar.scale.y = 0;
      this.addObject(bar);

      const growAnim = gsap.to(bar.scale, {
        y: 1,
        duration: 0.8,
        delay: idx * 0.12,
        ease: "elastic.out(1, 0.5)"
      });
      this.addAnimation(growAnim);

      this.createLabel(label, x, -0.4, 0.9, 0.14);
      this.createLabel(`${resultColumns[valueIdx]}: ${row[valueIdx]}`, x, barHeight + 0.4, 0, 0.13);
    });
  }

  /**
   * Parse aggregate functions from SELECT columns
   */
  parseAggregates(columns) {
    const aggregates = [];
    
    // Handle empty, wildcard, or missing columns
    if (!columns || columns.length === 0) {
      return [{ func: 'COUNT', column: '*', alias: 'count' }];
    }
    
    // Check for wildcard (either string '*' or object with expr '*')
    const firstCol = columns[0];
    const isWildcard = firstCol === '*' || 
                      (typeof firstCol === 'object' && (firstCol.expr === '*' || firstCol.raw === '*'));
    
    if (isWildcard) {
      return [{ func: 'COUNT', column: '*', alias: 'count' }];
    }
    
    columns.forEach(col => {
      // Handle both string and object column formats
      const colStr = typeof col === 'string' ? col : (col.expr || col.raw || col);
      
      // Check if it's a wildcard
      if (colStr === '*') {
        return;
      }
      
      const aggMatch = String(colStr).match(/(COUNT|SUM|AVG|MAX|MIN)\s*\(\s*([^)]+)\s*\)(?:\s+as\s+(\w+))?/i);
      if (aggMatch) {
        aggregates.push({
          func: aggMatch[1].toUpperCase(),
          column: aggMatch[2].trim(),
          alias: aggMatch[3] || (typeof col === 'object' && col.alias) || aggMatch[1].toLowerCase()
        });
      }
    });
    
    if (aggregates.length === 0) {
      aggregates.push({ func: 'COUNT', column: '*', alias: 'count' });
    }
    
    return aggregates;
  }

  /**
   * Group data by column value
   */
  groupDataByColumn(data, column) {
    const groups = {};
    data.forEach(row => {
      const key = row[column];
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    return groups;
  }

  /**
   * Calculate cluster positions in 3D space
   */
  calculateClusterPositions(groups) {
    const positions = {};
    const groupKeys = Object.keys(groups);
    const spacing = 4;
    const startX = -((groupKeys.length - 1) * spacing) / 2;
    
    groupKeys.forEach((key, idx) => {
      positions[key] = {
        x: startX + idx * spacing,
        y: 2,
        z: 0
      };
    });
    
    return positions;
  }

  /**
   * Calculate aggregate values for each group
   */
  calculateAggregates(groups, aggregates) {
    const results = [];
    
    Object.entries(groups).forEach(([key, rows]) => {
      const result = { group: key };
      
      aggregates.forEach(agg => {
        if (agg.func === 'COUNT') {
          result[agg.alias] = rows.length;
        } else if (agg.func === 'SUM') {
          result[agg.alias] = rows.reduce((sum, row) => sum + (row[agg.column] || 0), 0);
        } else if (agg.func === 'AVG') {
          result[agg.alias] = rows.reduce((sum, row) => sum + (row[agg.column] || 0), 0) / rows.length;
        } else if (agg.func === 'MAX') {
          result[agg.alias] = Math.max(...rows.map(row => row[agg.column] || 0));
        } else if (agg.func === 'MIN') {
          result[agg.alias] = Math.min(...rows.map(row => row[agg.column] || 0));
        }
      });
      
      results.push(result);
    });
    
    return results;
  }

  /**
   * Stage 1: FROM - Table sparkles and emits data particles
   */
  animateFromStage(tableName, data, delay) {
    // Create table block at origin
    const tableGeom = new THREE.BoxGeometry(3, 0.5, 2);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x00ADD8,
      emissive: 0x00ADD8,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.4,
      transparent: true,
      opacity: 0.82
    });
    const table = new THREE.Mesh(tableGeom, tableMat);
    table.position.set(0, -2, 0);
    this.addObject(table);
    
    // Table label
    this.createLabel(`FROM ${tableName}`, 0, -1.2, 0, 0.25);
    
    // Sparkle animation
    const sparkleAnim = gsap.to(tableMat, {
      emissiveIntensity: 1.2,
      duration: 0.4,
      repeat: 3,
      yoyo: true,
      delay: delay
    });
    this.addAnimation(sparkleAnim);
    
    // Emit particle for each row
    data.forEach((row, idx) => {
      const particle = this.createDataParticle(row, 0, -2, 0, idx);
      
      // Rise up animation
      const riseAnim = gsap.to(particle.position, {
        y: 0,
        duration: 1.0,
        delay: delay + 0.5 + idx * 0.1,
        ease: "power2.out"
      });
      this.addAnimation(riseAnim);
    });
  }

  /**
   * Create a data particle (small sphere representing a row)
   */
  createDataParticle(rowData, x, y, z, index) {
    const geom = new THREE.SphereGeometry(0.15, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4A9EFF,
      emissive: 0x4A9EFF,
      emissiveIntensity: 0.4,
      metalness: 0.5,
      roughness: 0.5
    });
    const particle = new THREE.Mesh(geom, mat);
    particle.position.set(x, y, z);
    particle.userData.rowData = rowData;
    particle.userData.index = index;
    
    this.addObject(particle);
    return particle;
  }

  /**
   * Stage 2: GROUP BY - Particles fly to cluster positions
   */
  animateGroupByStage(data, groupColumn, clusterPositions, delay) {
    // Find all particles in the scene
    const particles = this.scene.children.filter(
      obj => obj.geometry && obj.geometry.type === 'SphereGeometry' && obj.userData.rowData
    );
    
    // Create cluster labels
    Object.entries(clusterPositions).forEach(([key, pos]) => {
      this.createLabel(key, pos.x, pos.y + 1.5, pos.z, 0.3);
    });
    
    // Animate each particle to its cluster
    particles.forEach((particle, idx) => {
      const rowData = particle.userData.rowData;
      const groupValue = rowData[groupColumn];
      const targetPos = clusterPositions[groupValue];
      
      if (targetPos) {
        // Add slight offset within cluster
        const offset = {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 0.5
        };
        
        const flyAnim = gsap.to(particle.position, {
          x: targetPos.x + offset.x,
          y: targetPos.y + offset.y,
          z: targetPos.z + offset.z,
          duration: 1.2,
          delay: delay + idx * 0.05,
          ease: "power2.inOut"
        });
        this.addAnimation(flyAnim);
        
        // Particle trail effect
        const pulseAnim = gsap.to(particle.material, {
          emissiveIntensity: 0.8,
          duration: 0.3,
          repeat: 3,
          yoyo: true,
          delay: delay + idx * 0.05
        });
        this.addAnimation(pulseAnim);
      }
    });
    
    // Add "GROUP BY" stage label
    this.createColoredLabel(`GROUP BY ${groupColumn}`, 0, 4, 0, 0.35, '#FFD700');
  }

  /**
   * Stage 3: Aggregate - Clusters merge into bar charts
   */
  animateAggregateStage(groups, clusterPositions, aggregatedData, groupColumn, delay) {
    // Find particles and merge them into bars
    const particles = this.scene.children.filter(
      obj => obj.geometry && obj.geometry.type === 'SphereGeometry' && obj.userData.rowData
    );
    
    Object.entries(groups).forEach(([key, rows]) => {
      const pos = clusterPositions[key];
      const aggData = aggregatedData.find(d => d.group === key);
      const count = aggData[Object.keys(aggData).find(k => k !== 'group')] || rows.length;
      
      // Create bar chart column
      const barHeight = count * 0.5; // Scale height by count
      const barGeom = new THREE.BoxGeometry(0.8, barHeight, 0.8);
      const barMat = new THREE.MeshStandardMaterial({
        color: 0x00FF88,
        emissive: 0x00FF88,
        emissiveIntensity: 0.4,
        metalness: 0.4,
        roughness: 0.6,
        transparent: true,
        opacity: 0.82
      });
      const bar = new THREE.Mesh(barGeom, barMat);
      bar.position.set(pos.x, barHeight / 2, pos.z);
      bar.scale.y = 0;
      bar.userData.groupKey = key;
      bar.userData.value = count;
      bar.userData.finalY = barHeight / 2;
      
      this.addObject(bar);
      
      // Animate bar growth
      const growAnim = gsap.to(bar.scale, {
        y: 1,
        duration: 0.8,
        delay: delay,
        ease: "elastic.out(1, 0.5)"
      });
      this.addAnimation(growAnim);
      
      // Fade out particles in this cluster
      const clusterParticles = particles.filter(
        p => p.userData.rowData && String(p.userData.rowData[groupColumn]) === String(key)
      );
      
      clusterParticles.forEach((particle, idx) => {
        const fadeAnim = gsap.to(particle.material, {
          opacity: 0,
          transparent: true,
          duration: 0.5,
          delay: delay - 0.3 + idx * 0.02,
          onComplete: () => {
            this.scene.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
          }
        });
        this.addAnimation(fadeAnim);
      });
      
      // Add value label on bar
      setTimeout(() => {
        this.createLabel(`${count}`, pos.x, barHeight + 0.3, pos.z, 0.25);
      }, (delay + 0.8) * 1000);
    });
    
    // Add "COUNT(*)" stage label
    this.createColoredLabel('COUNT(*) & Aggregate', 0, 4, 0, 0.35, '#00FF88');
  }

  /**
   * Stage 4: ORDER BY - Bars reposition by value
   */
  animateOrderByStage(aggregatedData, orderBy, currentPositions, delay) {
    // Sort data by ORDER BY clause
    const sorted = [...aggregatedData].sort((a, b) => {
      const orderCol = orderBy[0];
      const valueKey = Object.keys(a).find(k => k !== 'group');
      const aVal = a[valueKey];
      const bVal = b[valueKey];
      
      return orderCol.direction === 'DESC' ? bVal - aVal : aVal - bVal;
    });
    
    // Find all bar meshes
    const bars = this.scene.children.filter(
      obj => obj.geometry && obj.geometry.type === 'BoxGeometry' && obj.userData.groupKey
    );
    
    // Calculate new positions
    const spacing = 3;
    const startX = -((sorted.length - 1) * spacing) / 2;
    
    sorted.forEach((item, idx) => {
      const bar = bars.find(b => b.userData.groupKey === item.group);
      if (bar) {
        const newX = startX + idx * spacing;
        
        // Animate to new position
        const moveAnim = gsap.to(bar.position, {
          x: newX,
          duration: 1.0,
          delay: delay,
          ease: "power2.inOut"
        });
        this.addAnimation(moveAnim);
        
        // Also move the labels
        const labels = this.scene.children.filter(
          obj => obj.isCSS2DObject &&
          Math.abs(obj.position.x - currentPositions[item.group].x) < 0.5
        );
        
        labels.forEach(label => {
          const labelAnim = gsap.to(label.position, {
            x: newX,
            duration: 1.0,
            delay: delay,
            ease: "power2.inOut"
          });
          this.addAnimation(labelAnim);
        });
      }
    });
    
    // Add "ORDER BY" stage label
    const orderDir = orderBy[0].direction || 'ASC';
    this.createColoredLabel(`ORDER BY ${orderDir}`, 0, 4, 0, 0.35, '#FF6B35');
  }

  reset() {
    this.clear();
    this.lastQuery = null;
    this.stages = [];
    this.activeStageIndex = -1;
    super.reset();
  }

  tick(delta) {
    const pulse = 0.25 + Math.sin(Date.now() * 0.002) * 0.15;
    for (const table of this.tables.values()) {
      if (this.viewMode === '3d') {
        table.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;
      }
      const header = table.children[0];
      if (header && header.material) {
        header.material.emissiveIntensity = pulse;
      }
    }
  }
}
