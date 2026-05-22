/**
 * UPDATE Query Visualizer
 * Highlights and animates row updates
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

    const { table, set, where } = updateQuery;
    
    // Create table structure
    this.createTable(table);
    
    // Animate row updates
    this.animateUpdate(set, where);
  }

  createTable(tableName) {
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

    // Create rows
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
  }

  animateUpdate(setClause, whereConditions) {
    // Select 2-3 rows to update (simulate WHERE filter)
    const rowsToUpdate = whereConditions ? 2 : 5;
    
    for (let i = 0; i < rowsToUpdate; i++) {
      const rowGeom = new THREE.BoxGeometry(5, 0.25, 0.4);
      const rowMat = new THREE.MeshStandardMaterial({
        color: 0xFFAA00,
        metalness: 0.5,
        roughness: 0.5,
        emissive: 0xFFAA00,
        emissiveIntensity: 0.8
      });
      const row = new THREE.Mesh(rowGeom, rowMat);
      row.position.set(0, 1 - i * 0.35, 0);

      this.addObject(row);
      this.updatedRows.push(row);

      // Pulse animation
      const timeline = gsap.timeline({ repeat: 2 });
      this.addAnimation(timeline);
      timeline
        .to(row.scale, {
          x: 1.1,
          duration: 0.3,
          delay: i * 0.15,
          ease: "power2.inOut"
        })
        .to(row.scale, {
          x: 1,
          duration: 0.3,
          ease: "power2.inOut"
        });

      // Fade emissive
      const anim1 = gsap.to(row.material, {
        emissiveIntensity: 0,
        duration: 1.5,
        delay: i * 0.15 + 0.6,
        ease: "power2.out"
      });
      this.addAnimation(anim1);

      // Final color change
      const anim2 = gsap.to(row.material.color, {
        r: 0,
        g: 0.8,
        b: 0.4,
        duration: 0.5,
        delay: i * 0.15 + 1.8
      });
      this.addAnimation(anim2);
    }

    // Show SET clause info
    if (setClause && setClause.length > 0) {
      setClause.forEach((assignment, i) => {
        const text = `SET ${assignment.column} = ${assignment.value}`;
        this.createLabel(text, 0, -1 - i * 0.3, 1.5, 0.18);
      });
    }
  }

  createLabel(text, x, y, z, scale = 0.2) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    context.fillStyle = '#FFAA00';
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
      delay: 0.8
    });
    this.addAnimation(anim);
    
    this.addObject(sprite);
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
