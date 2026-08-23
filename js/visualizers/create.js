/**
 * CREATE TABLE Visualizer
 * Animates table creation with column structure
 */

import * as THREE from "three";
import BaseVisualizer from "./base.js";

export default class CreateTableVisualizer extends BaseVisualizer {
  constructor(scene, camera) {
    super(scene, camera);
    this.tableGroup = null;
  }

  update(createQuery) {
    this.clear();
    
    if (!createQuery) return;

    const { table, columns } = createQuery;
    
    // Animate table creation
    this.createTable(table, columns);
  }

  createTable(tableName, columns) {
    this.tableGroup = new THREE.Group();
    this.tableGroup.position.set(0, 0, 0);

    // Table base (foundation)
    const baseGeom = new THREE.CylinderGeometry(0.5, 0.8, 0.3, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1A3A5C,
      metalness: 0.6,
      roughness: 0.4
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0;
    this.tableGroup.add(base);

    // Animate base appearance
    base.scale.set(0, 0, 0);
    const anim1 = gsap.to(base.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.5,
      ease: "back.out(2)"
    });
    this.addAnimation(anim1);

    // Table header
    const headerGeom = new THREE.BoxGeometry(5, 0.5, 2.5);
    const headerMat = new THREE.MeshStandardMaterial({
      color: 0x00ADD8,
      metalness: 0.4,
      roughness: 0.6,
      emissive: 0x00ADD8,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.82
    });
    const header = new THREE.Mesh(headerGeom, headerMat);
    header.position.y = 1;
    this.tableGroup.add(header);

    // Animate header appearance
    header.position.y = 5;
    header.scale.y = 0;
    const anim2 = gsap.to(header.position, {
      y: 1,
      duration: 0.8,
      delay: 0.5,
      ease: "bounce.out"
    });
    const anim3 = gsap.to(header.scale, {
      y: 1,
      duration: 0.6,
      delay: 0.5,
      ease: "back.out(2)"
    });
    this.addAnimation(anim2);
    this.addAnimation(anim3);

    // Table name label
    this.createLabel(tableName, 0, 2, 0, 0.4);

    // Create columns
    if (columns && columns.length > 0) {
      columns.forEach((col, i) => {
        this.createColumn(col, i, columns.length);
      });
    }

    this.addObject(this.tableGroup);
  }

  createColumn(columnDef, index, total) {
    const { name, type, constraint } = columnDef;
    
    // Column visualization (vertical bars)
    const colGeom = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    const isPrimaryKey = constraint && constraint.includes('PRIMARY');
    const colMat = new THREE.MeshStandardMaterial({
      color: isPrimaryKey ? 0xFFD700 : 0x4A9EFF,
      metalness: 0.5,
      roughness: 0.5,
      emissive: isPrimaryKey ? 0xFFD700 : 0x4A9EFF,
      emissiveIntensity: isPrimaryKey ? 0.4 : 0.2
    });
    const column = new THREE.Mesh(colGeom, colMat);
    
    // Position columns in a row
    const spacing = Math.min(1.2, 5 / total);
    const startX = -(total - 1) * spacing / 2;
    column.position.set(startX + index * spacing, 0.3, 0);
    
    // Animate column appearance
    column.scale.y = 0;
    column.position.y = -0.5;
    const anim1 = gsap.to(column.scale, {
      y: 1,
      duration: 0.5,
      delay: 1 + index * 0.1,
      ease: "elastic.out(1, 0.5)"
    });
    const anim2 = gsap.to(column.position, {
      y: 0.3,
      duration: 0.5,
      delay: 1 + index * 0.1,
      ease: "power2.out"
    });
    this.addAnimation(anim1);
    this.addAnimation(anim2);

    this.tableGroup.add(column);

    // Column label
    const labelText = `${name}\n${type}`;
    this.createLabel(labelText, startX + index * spacing, -0.5, 0, 0.12, index);
  }

  createLabel(text, x, y, z, scale = 0.2, delay = 0) {
    return this.makeTag(text, x, y, z, {
      color: '#00ADD8', size: scale >= 0.3 ? 'lg' : 'sm', fade: true, fadeDelay: 0.8 + delay * 0.1,
    });
  }

  clear() {
    super.clear();
    this.tableGroup = null;
  }

  tick(delta) {
    // Rotate table slowly
    if (this.tableGroup) {
      this.tableGroup.rotation.y += delta * 0.2;
    }
  }

  reset() {
    this.clear();
    super.reset();
  }

  dispose() {
    this.clear();
  }
}
