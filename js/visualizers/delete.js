/**
 * DELETE Query Visualizer
 * Animates row deletion from a table
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

    const { table, where } = deleteQuery;
    
    // Create table structure with rows
    this.createTable(table, where);
  }

  createTable(tableName, whereConditions) {
    this.tableGroup = new THREE.Group();

    // Table header
    const headerGeom = new THREE.BoxGeometry(5, 0.4, 2);
    const headerMat = new THREE.MeshStandardMaterial({
      color: 0x00ADD8,
      metalness: 0.3,
      roughness: 0.7
    });
    const header = new THREE.Mesh(headerGeom, headerMat);
    header.position.y = 1.5;
    this.tableGroup.add(header);

    // Table name label
    this.createLabel(tableName, 0, 2.2, 0, 0.35);

    // Create rows and mark some for deletion
    const rowsToDelete = whereConditions ? [1, 3] : [0, 1, 2, 3, 4]; // Simulate WHERE filter
    
    for (let i = 0; i < 5; i++) {
      const willDelete = rowsToDelete.includes(i);
      
      const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
      const rowMat = new THREE.MeshStandardMaterial({
        color: willDelete ? 0xFF4444 : (i % 2 === 0 ? 0x2A4A6C : 0x1A3A5C),
        metalness: 0.3,
        roughness: 0.7,
        emissive: willDelete ? 0xFF0000 : 0x000000,
        emissiveIntensity: willDelete ? 0.5 : 0
      });
      const row = new THREE.Mesh(rowGeom, rowMat);
      row.position.set(0, 1 - i * 0.35, 0);
      this.tableGroup.add(row);

      if (willDelete) {
        this.animateDelete(row, i);
      }
    }

    this.addObject(this.tableGroup);

    // Show WHERE condition
    if (whereConditions && whereConditions.length > 0) {
      const condition = whereConditions[0];
      const text = `WHERE ${condition.left} ${condition.operator} ${condition.right || ''}`;
      this.createLabel(text, 0, -1, 1.5, 0.18);
    }
  }

  animateDelete(row, index) {
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
  }

  createLabel(text, x, y, z, scale = 0.2) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    context.fillStyle = '#FF4444';
    context.font = 'bold 28px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale * 6, scale * 1.5, 1);
    
    sprite.material.opacity = 0;
    const anim = gsap.to(sprite.material, {
      opacity: 1,
      duration: 0.5,
      delay: 0.5
    });
    this.addAnimation(anim);
    
    this.addObject(sprite);
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
