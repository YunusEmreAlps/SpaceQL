/**
 * For Loop Visualizer
 * Renders for loops as boxes lighting up sequentially
 * 
 * From spec Level 4:
 * - N boxes appear side by side, numbered
 * - Each iteration lights up the corresponding box
 * - Counter variable shown in separate box, incrementing
 */

import * as THREE from 'three';
import BaseVisualizer from './base.js';
import { createTextSprite } from '../core/utils.js';

export default class ForLoopVisualizer extends BaseVisualizer {
  constructor(scene, camera) {
    super(scene, camera);
    this.loops = new Map();
  }

  /**
   * Update visualization based on parsed for loops
   * @param {Array} forLoops - Array of {clause, count, line}
   */
  update(forLoops) {
    if (!Array.isArray(forLoops)) return;

    const currentIds = new Set();

    forLoops.forEach((loopData, index) => {
      const id = `for-${loopData.line}`;
      currentIds.add(id);

      if (!this.loops.has(id)) {
        this.createForLoop(id, loopData, index);
      }
    });

    for (const [id, loopObj] of this.loops.entries()) {
      if (!currentIds.has(id)) {
        this.removeForLoop(id);
      }
    }
  }

  createForLoop(id, loopData, index) {
    const { count, clause } = loopData;
    const group = new THREE.Group();
    
    const iterations = count || 5; // Default 5 if count not detected
    const yPos = 3 + index * 2;
    const xPos = -4;
    
    // Create iteration boxes
    const boxes = [];
    for (let i = 0; i < iterations; i++) {
      const boxGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      const boxMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A3A5C, // Dark initially
        roughness: 0.6,
        metalness: 0.3,
        emissive: 0x1A3A5C,
        emissiveIntensity: 0,
      });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.x = i * 0.8;
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
      
      // Number label
      const numLabel = createTextSprite(String(i), {
        fontSize: 20,
        color: '#FFFFFF',
      });
      numLabel.position.set(0, 0, 0.35);
      box.add(numLabel);
      
      boxes.push({ mesh: box, active: false });
    }
    
    // Label
    const label = createTextSprite(`for ${clause}`, {
      fontSize: 18,
      color: '#7EC8E3',
    });
    label.position.set((iterations - 1) * 0.4, 0.8, 0);
    label.scale.multiplyScalar(0.8);
    group.add(label);
    
    group.position.set(xPos, yPos, 0);
    this.addObject(group);
    
    this.loops.set(id, {
      id,
      group,
      boxes,
      iterations,
      currentIteration: 0,
      animating: false,
    });
    
    // Entrance animation
    if (typeof gsap !== 'undefined') {
      boxes.forEach((boxObj, i) => {
        boxObj.mesh.position.y = -2;
        boxObj.mesh.material.opacity = 0;
        boxObj.mesh.material.transparent = true;
        
        const anim = gsap.timeline({ delay: i * 0.1 });
        anim.to(boxObj.mesh.position, { y: 0, duration: 0.5, ease: 'bounce.out' });
        anim.to(boxObj.mesh.material, { opacity: 1, duration: 0.3 }, '<');
        
        this.addAnimation(anim);
      });
    }
    
    // Start iteration animation
    this.animateIterations(id);
  }

  animateIterations(id) {
    const loopObj = this.loops.get(id);
    if (!loopObj || loopObj.animating) return;

    loopObj.animating = true;
    
    const animate = () => {
      if (!this.loops.has(id) || this.paused) {
        setTimeout(animate, 100);
        return;
      }
      
      const box = loopObj.boxes[loopObj.currentIteration];
      if (!box) {
        // Reset to start
        loopObj.currentIteration = 0;
        loopObj.boxes.forEach(b => {
          b.active = false;
          b.mesh.material.color.setHex(0x1A3A5C);
          b.mesh.material.emissiveIntensity = 0;
        });
        setTimeout(animate, 500);
        return;
      }
      
      // Light up current box
      box.active = true;
      if (typeof gsap !== 'undefined') {
        gsap.to(box.mesh.material.color, {
          r: 0.27, g: 1.0, b: 0.28, // Green
          duration: 0.3,
        });
        gsap.to(box.mesh.material, {
          emissiveIntensity: 0.5,
          duration: 0.3,
        });
        gsap.to(box.mesh.scale, {
          x: 1.2, y: 1.2, z: 1.2,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
        });
      } else {
        box.mesh.material.color.setHex(0x45FF47);
        box.mesh.material.emissiveIntensity = 0.5;
      }
      
      loopObj.currentIteration++;
      setTimeout(animate, 1000 / this.speed);
    };
    
    animate();
  }

  removeForLoop(id) {
    const loopObj = this.loops.get(id);
    if (!loopObj) return;

    loopObj.animating = false;

    if (typeof gsap !== 'undefined') {
      const anim = gsap.timeline({
        onComplete: () => this.removeObject(loopObj.group),
      });
      anim.to(loopObj.group.position, { y: -5, duration: 0.5, ease: 'power2.in' });
      this.addAnimation(anim);
    } else {
      this.removeObject(loopObj.group);
    }

    this.loops.delete(id);
  }

  tick(delta) {
    if (this.paused) return;
  }

  dispose() {
    for (const loopObj of this.loops.values()) {
      loopObj.animating = false;
    }
    this.loops.clear();
    super.dispose();
  }
}
