/**
 * DELETE Query Visualizer
 * Animates row deletion from a table. When the query has actually been run,
 * uses the real affected rows (fetched by the Run handler before the
 * mutation executes) so the count and highlighted rows match reality;
 * otherwise falls back to a generic preview while the user is just typing.
 */

import * as THREE from "three";
import BaseVisualizer from "./base.js";

export default class DeleteVisualizer extends BaseVisualizer {
  constructor(scene, camera) {
    super(scene, camera);
    this.tableGroup = null;
  }

  update(deleteQuery) {
    this.clear();

    if (!deleteQuery) return;

    const { table, where, allRows, affectedRows } = deleteQuery;

    if (allRows && allRows.length > 0) {
      this.renderReal(table, allRows, affectedRows || []);
    } else {
      this.renderPreview(table, where);
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
   * WHERE clause (computed by the Run handler) flash red and shrink away.
   */
  renderReal(tableName, allRows, affectedRows) {
    this.tableGroup = new THREE.Group();
    this.createHeader(tableName);

    const affectedKeys = new Set(affectedRows.map(r => this.rowKey(r)));
    const rows = allRows.slice(0, 8);

    rows.forEach((row, i) => {
      const willDelete = affectedKeys.has(this.rowKey(row));
      const preview = this.rowPreview(row);
      const y = 1 - i * 0.35;

      const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
      const rowMat = new THREE.MeshStandardMaterial({
        color: willDelete ? 0xFF4444 : (i % 2 === 0 ? 0x2A4A6C : 0x1A3A5C),
        metalness: 0.3,
        roughness: 0.7,
        emissive: willDelete ? 0xFF0000 : 0x000000,
        emissiveIntensity: willDelete ? 0.5 : 0,
        transparent: true
      });
      const row3d = new THREE.Mesh(rowGeom, rowMat);
      row3d.position.set(0, y, 0);
      this.tableGroup.add(row3d);
      const label = this.createLabel(preview, 2.2, y, 0.3, 0.09);

      if (willDelete) {
        this.animateDelete(row3d, i, label);
      }
    });

    this.addObject(this.tableGroup);

    const countText = affectedRows.length === 0
      ? 'No rows match WHERE'
      : `${affectedRows.length} row(s) deleted`;
    this.createLabel(countText, 0, -1, 1.5, 0.16);
  }

  /**
   * Preview path (query hasn't been run yet): same generic 5-row skeleton
   * the visualizer has always shown while the user is just typing.
   */
  renderPreview(tableName, whereConditions) {
    this.tableGroup = new THREE.Group();
    this.createHeader(tableName);

    const rowsToDelete = whereConditions ? [1, 3] : [0, 1, 2, 3, 4];

    for (let i = 0; i < 5; i++) {
      const willDelete = rowsToDelete.includes(i);

      const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
      const rowMat = new THREE.MeshStandardMaterial({
        color: willDelete ? 0xFF4444 : (i % 2 === 0 ? 0x2A4A6C : 0x1A3A5C),
        metalness: 0.3,
        roughness: 0.7,
        emissive: willDelete ? 0xFF0000 : 0x000000,
        emissiveIntensity: willDelete ? 0.5 : 0,
        transparent: true
      });
      const row = new THREE.Mesh(rowGeom, rowMat);
      row.position.set(0, 1 - i * 0.35, 0);
      this.tableGroup.add(row);

      if (willDelete) {
        this.animateDelete(row, i);
      }
    }

    this.addObject(this.tableGroup);

    if (whereConditions && whereConditions.length > 0) {
      const condition = whereConditions[0];
      const text = `WHERE ${condition.left} ${condition.operator} ${condition.right || ''}`;
      this.createLabel(text, 0, -1, 1.5, 0.18);
    }
  }

  animateDelete(row, index, label) {
    const timeline = gsap.timeline({ delay: index * 0.2 });
    this.addAnimation(timeline);

    // Flash red
    timeline.to(row.material, {
      emissiveIntensity: 1,
      duration: 0.2,
      repeat: 3,
      yoyo: true
    });

    // Shrink and fade
    timeline.to(row.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.5,
      ease: "back.in(2)"
    }, "+=0.2");

    timeline.to(row.material, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        if (row.parent) row.parent.remove(row);
        if (row.geometry) row.geometry.dispose();
        if (row.material) row.material.dispose();
      }
    }, "-=0.5");

    if (label) {
      timeline.to(label.element, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          if (label.parent) label.parent.remove(label);
        }
      }, "<");
    }
  }

  createLabel(text, x, y, z, scale = 0.2) {
    return this.makeTag(text, x, y, z, {
      color: '#FF4444', size: scale >= 0.3 ? 'lg' : 'md', fade: true, fadeDelay: 0.5,
    });
  }

  clear() {
    super.clear();
    this.tableGroup = null;
  }

  tick(delta) {
    // No continuous animation needed
  }

  reset() {
    this.clear();
    super.reset();
  }

  dispose() {
    this.clear();
  }
}
