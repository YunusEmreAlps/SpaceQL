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
    const { from, columns, where, joins, limit, groupBy, orderBy, resultRows } = selectQuery;
    
    // GROUP BY pipeline visualization
    if (groupBy && groupBy.length > 0) {
      this.visualizeGroupByPipeline(from, groupBy, columns, orderBy);
    }
    // Enhanced JOIN visualization
    else if (joins && joins.length > 0) {
      this.visualizeJoin(from, joins[0], columns);
    } 
    // Simple SELECT without JOIN or GROUP BY
    else {
      this.createSimpleTable(from, columns, resultRows);
    }
  }

  /**
   * Simple table visualization (no JOINs)
   */
  createSimpleTable(tableName, columns, resultRows) {
    // Apply viewMode: in 2D, flatten the table
    const tableZ = this.viewMode === '2d' ? 0 : -1;
    const tableX = 0;
    
    this.createTableHeader(tableName, tableX, tableZ);
    
    const data = resultRows || [];
    const maxRows = Math.min(data.length, 5);
    
    if (maxRows === 0) {
      this.createLabel('No data - Run query to see results', tableX, -1, tableZ, 0.2);
      return;
    }
    
    for (let i = 0; i < maxRows; i++) {
      const row = data[i];
      const y = 0.8 - i * 0.4;
      this.createDataRow(row, tableX, y, tableZ, 0x00ADD8, i, true);
    }
    
    this.createLabel(`${maxRows} rows shown`, tableX, -2, tableZ, 0.15);
  }

  /**
   * Enhanced JOIN visualization
   */
  visualizeJoin(leftTable, join, columns) {
    const rightTable = join.table;
    const joinType = (join.type || 'INNER').toUpperCase();
    
    // Table positions
    const leftX = this.viewMode === '2d' ? -4 : -5;
    const rightX = this.viewMode === '2d' ? 4 : 5;
    const tableZ = this.viewMode === '2d' ? 0 : -2;
    
    // Create headers
    this.createTableHeader(leftTable, leftX, tableZ);
    this.createTableHeader(rightTable, rightX, tableZ);
    
    // Show placeholder - user needs to run real SQL query
    this.createLabel('Run JOIN query to see results', 0, 0, 0, 0.25);
    this.createColoredLabel(`${joinType} JOIN`, 0, 3, 0, 0.4, 
      joinType.includes('INNER') ? '#00FF88' :
      joinType.includes('LEFT') ? '#FFAA44' :
      joinType.includes('RIGHT') ? '#4ECDC4' : '#FFFFFF');
  }

  /**
   * Find matching rows (simple ID matching)
   */
  findMatches(leftData, rightData) {
    const matches = [];
    leftData.forEach((leftRow, leftIdx) => {
      rightData.forEach((rightRow, rightIdx) => {
        if (leftRow.id === rightRow.user_id) {
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
      roughness: 0.6
    });
    const header = new THREE.Mesh(headerGeom, headerMat);
    header.position.y = 1.5;
    group.add(header);

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
    
    // Show data value
    const firstValue = Object.values(data)[1] || Object.values(data)[0];
    this.createSmallLabel(String(firstValue), x, y, z + 0.3, 0.12);
    
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

  /**
   * Create JOIN type label
   */
  createJoinLabel(joinType, x, y, z) {
    const labelText = `${joinType} JOIN`;
    const color = joinType.includes('INNER') ? '#00FF88' :
                  joinType.includes('LEFT') ? '#FFAA44' :
                  joinType.includes('RIGHT') ? '#4ECDC4' : '#FFFFFF';
    
    this.createColoredLabel(labelText, x, y, z, 0.4, color);
  }

  createLabel(text, x, y, z, scale = 0.2) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = '#00ADD8';
    context.font = 'bold 32px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale * 4, scale, 1);
    
    this.addObject(sprite);
  }

  createSmallLabel(text, x, y, z, scale) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = '#E8F4FD';
    context.font = 'bold 24px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale * 4, scale, 1);
    
    this.addObject(sprite);
  }

  createColoredLabel(text, x, y, z, scale, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    context.fillStyle = color;
    context.font = 'bold 48px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale * 6, scale * 1.5, 1);
    
    this.addObject(sprite);
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
   * Shows the data transformation pipeline with animations
   */
  visualizeGroupByPipeline(tableName, groupByColumns, selectColumns, orderBy) {
    // Show placeholder - user needs to run real SQL query
    this.createTableHeader(tableName, 0, 0);
    this.createLabel('Run GROUP BY query to see pipeline', 0, 0, 0, 0.25);
    this.createColoredLabel('GROUP BY Pipeline', 0, 3, 0, 0.4, '#FFD700');
    
    // Show stage labels
    this.createStageLabels(groupByColumns[0] || 'column', []);
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
      roughness: 0.4
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
        emissiveIntensity: 0.3,
        metalness: 0.4,
        roughness: 0.6
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
          obj => obj.type === 'Sprite' && 
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

  /**
   * Create stage labels showing the pipeline
   */
  createStageLabels(groupColumn, aggregates) {
    const pipeline = [
      { text: '1. FROM', y: -3, color: '#00ADD8' },
      { text: '2. GROUP BY', y: -3.4, color: '#FFD700' },
      { text: '3. AGGREGATE', y: -3.8, color: '#00FF88' },
      { text: '4. ORDER BY', y: -4.2, color: '#FF6B35' }
    ];
    
    pipeline.forEach(stage => {
      this.createColoredLabel(stage.text, -6, stage.y, 0, 0.18, stage.color);
    });
  }

  reset() {
    this.clear();
    this.lastQuery = null;
    super.reset();
  }

  tick(delta) {
    if (this.viewMode === '3d') {
      for (const table of this.tables.values()) {
        table.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;
      }
    }
  }
}
