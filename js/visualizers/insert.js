/**
 * INSERT Query Visualizer
 * Animates new row insertion into a table
 */

import * as THREE from "three";
import BaseVisualizer from "./base.js";

export default class InsertVisualizer extends BaseVisualizer {
  constructor(scene, camera) {
    super(scene, camera);
    this.tableGroup = null;
    this.insertedRows = [];
  }

  update(insertQuery) {
    this.clear();
    
    if (!insertQuery) return;

    const { table, columns, values } = insertQuery;
    
    // Create table structure
    this.createTable(table);
    
    // Animate new row insertion
    this.animateInsert(columns, values);
  }

  createTable(tableName) {
    this.tableGroup = new THREE.Group();

    // Table header
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

    // Table name label
    this.createLabel(tableName, 0, 2.2, 0, 0.35);

    // Existing rows (placeholder)
    for (let i = 0; i < 3; i++) {
      const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
      const rowMat = new THREE.MeshStandardMaterial({
        color: 0x2A4A6C,
        metalness: 0.2,
        roughness: 0.8
      });
      const row = new THREE.Mesh(rowGeom, rowMat);
      row.position.set(0, 1 - i * 0.35, 0);
      this.tableGroup.add(row);
    }

    this.addObject(this.tableGroup);
  }

  animateInsert(columns, values) {
    // Create new row
    const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
    const rowMat = new THREE.MeshStandardMaterial({
      color: 0x00FF88,
      metalness: 0.4,
      roughness: 0.6,
      emissive: 0x00FF88,
      emissiveIntensity: 0.5
    });
    const newRow = new THREE.Mesh(rowGeom, rowMat);

    // Start position: above the table
    newRow.position.set(0, 4, 0);
    newRow.scale.set(0.1, 0.1, 0.1);

    this.addObject(newRow);
    this.insertedRows.push(newRow);

    // Animate: scale up and drop into place
    const timeline = gsap.timeline();
    this.addAnimation(timeline);
    
    timeline.to(newRow.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.4,
      ease: "back.out(2)"
    });

    timeline.to(newRow.position, {
      y: -0.05,
      duration: 0.6,
      ease: "bounce.out"
    }, "-=0.2");

    // Flash effect
    timeline.to(newRow.material, {
      emissiveIntensity: 0,
      duration: 0.8,
      ease: "power2.out"
    });

    // Show column values as labels
    if (columns && values) {
      columns.forEach((col, i) => {
        if (i < 3) { // Show max 3 column values
          const value = values[i] || '';
          this.createLabel(`${col}: ${value}`, -2 + i * 2, -0.05, 0.8, 0.15);
        }
      });
    }
  }

  createLabel(text, x, y, z, scale = 0.2) {
    return this.makeTag(text, x, y, z, {
      color: '#00FF88', size: scale >= 0.3 ? 'lg' : 'md', fade: true, fadeDelay: 0.8,
    });
  }

  clear() {
    super.clear();
    this.tableGroup = null;
    this.insertedRows = [];
  }

  tick(delta) {
    // Subtle floating animation for inserted rows
    this.insertedRows.forEach((row, i) => {
      row.position.y = -0.05 + Math.sin(Date.now() * 0.001 + i) * 0.02;
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
