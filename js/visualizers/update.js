/**
 * UPDATE Query Visualizer
 * Highlights and animates row updates. When the query has actually been run,
 * uses the real affected rows (fetched by the Run handler before the
 * mutation executes) so the count and highlighted rows match reality;
 * otherwise falls back to a generic preview while the user is just typing.
 */

import * as THREE from "three";
import BaseVisualizer from "./base.js";

export default class UpdateVisualizer extends BaseVisualizer {
  constructor(scene, camera) {
    super(scene, camera);
    this.tableGroup = null;
    this.updatedRows = [];
  }

  update(updateQuery) {
    this.clear();

    if (!updateQuery) return;

    const { table, set, where, allRows, affectedRows } = updateQuery;

    if (allRows && allRows.length > 0) {
      this.renderReal(table, set, allRows, affectedRows || []);
    } else {
      this.renderPreview(table, set, where);
    }
  }

  createHeader(tableName) {
    const headerGeom = new THREE.BoxGeometry(5, 0.4, 2);
    const headerMat = new THREE.MeshStandardMaterial({
      color: 0x00ADD8,
      metalness: 0.3,
      roughness: 0.7,
      emissive: 0x00ADD8,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.82
    });
    const header = new THREE.Mesh(headerGeom, headerMat);
    header.position.y = 1.5;
    this.tableGroup.add(header);

    this.createLabel(tableName, 0, 2.2, 0, 0.35);
  }

  /**
   * Real data path: draw every row from the table; rows that match the
   * WHERE clause get the update pulse plus a value label so it's clear
   * exactly what's changing.
   */
  renderReal(tableName, setClause, allRows, affectedRows) {
    this.tableGroup = new THREE.Group();
    this.createHeader(tableName);

    const affectedKeys = new Set(affectedRows.map(r => this.rowKey(r)));
    const rows = allRows.slice(0, 8);
    let affectedIndex = 0;

    rows.forEach((row, i) => {
      const y = 1 - i * 0.35;
      const preview = this.rowPreview(row);

      if (affectedKeys.has(this.rowKey(row))) {
        this.animateUpdatedRow(y, preview, affectedIndex * 0.15);
        affectedIndex++;
      } else {
        const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
        const rowMat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x2A4A6C : 0x1A3A5C,
          metalness: 0.2,
          roughness: 0.8
        });
        const rowMesh = new THREE.Mesh(rowGeom, rowMat);
        rowMesh.position.set(0, y, 0);
        this.tableGroup.add(rowMesh);
        this.createLabel(preview, 2.2, y, 0.3, 0.09);
      }
    });

    this.addObject(this.tableGroup);

    const countText = affectedRows.length === 0
      ? 'No rows match WHERE'
      : `${affectedRows.length} row(s) updated`;
    this.createLabel(countText, 0, -1, 1.5, 0.16);

    if (setClause && setClause.length > 0) {
      setClause.forEach((assignment, i) => {
        const text = `SET ${assignment.column} = ${assignment.value}`;
        this.createLabel(text, 0, -1.4 - i * 0.3, 1.5, 0.16);
      });
    }
  }

  /**
   * Preview path (query hasn't been run yet): same generic 5-row skeleton
   * the visualizer has always shown while the user is just typing.
   */
  renderPreview(tableName, setClause, whereConditions) {
    this.tableGroup = new THREE.Group();
    this.createHeader(tableName);

    for (let i = 0; i < 5; i++) {
      const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
      const rowMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x2A4A6C : 0x1A3A5C,
        metalness: 0.2,
        roughness: 0.8
      });
      const row = new THREE.Mesh(rowGeom, rowMat);
      row.position.set(0, 1 - i * 0.35, 0);
      this.tableGroup.add(row);
    }

    this.addObject(this.tableGroup);

    const rowsToUpdate = whereConditions ? 2 : 5;
    for (let i = 0; i < rowsToUpdate; i++) {
      this.animateUpdatedRow(1 - i * 0.35, null, i * 0.15);
    }

    if (setClause && setClause.length > 0) {
      setClause.forEach((assignment, i) => {
        const text = `SET ${assignment.column} = ${assignment.value}`;
        this.createLabel(text, 0, -1 - i * 0.3, 1.5, 0.18);
      });
    }
  }

  /**
   * Pop in, then pulse orange -> fade -> settle green, matching an
   * "updated" state. Shared by both the real-data and preview paths.
   */
  animateUpdatedRow(y, preview, indexDelay) {
    const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
    const rowMat = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      metalness: 0.5,
      roughness: 0.5,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.8
    });
    const row = new THREE.Mesh(rowGeom, rowMat);
    row.position.set(0, y, 0);
    row.scale.set(0.1, 0.1, 0.1);

    this.addObject(row);
    this.updatedRows.push(row);

    const popAnim = gsap.to(row.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.35,
      delay: indexDelay,
      ease: "back.out(2)"
    });
    this.addAnimation(popAnim);

    const timeline = gsap.timeline({ repeat: 2, delay: indexDelay + 0.35 });
    this.addAnimation(timeline);
    timeline
      .to(row.scale, {
        x: 1.1,
        duration: 0.3,
        ease: "power2.inOut"
      })
      .to(row.scale, {
        x: 1,
        duration: 0.3,
        ease: "power2.inOut"
      });

    const anim1 = gsap.to(row.material, {
      emissiveIntensity: 0,
      duration: 1.5,
      delay: indexDelay + 0.9,
      ease: "power2.out"
    });
    this.addAnimation(anim1);

    const anim2 = gsap.to(row.material.color, {
      r: 0, g: 0.8, b: 0.4,
      duration: 0.5,
      delay: indexDelay + 2.1
    });
    this.addAnimation(anim2);

    if (preview) {
      this.createLabel(preview, 2.2, y, 0.4, 0.1);
    }
  }

  createLabel(text, x, y, z, scale = 0.2) {
    return this.makeTag(text, x, y, z, {
      color: '#FFAA00', size: scale >= 0.3 ? 'lg' : 'md', fade: true, fadeDelay: 0.8,
    });
  }

  clear() {
    super.clear();
    this.tableGroup = null;
    this.updatedRows = [];
  }

  tick(delta) {
    // Slight wave effect on updated rows
    this.updatedRows.forEach((row, i) => {
      row.rotation.z = Math.sin(Date.now() * 0.002 + i * 0.5) * 0.02;
    });
  }

  reset() {
    this.clear();
    super.reset();
  }

  dispose() {
    this.clear();
  }
}
