/**
 * BaseVisualizer
 * Foundation class that all visualizers extend
 * 
 * Every visualizer must implement:
 * - update(parsedAST) - Called when code changes
 * - tick(delta) - Called every frame (optional)
 */

import * as THREE from 'three';

export default class BaseVisualizer {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.speed = 1.0;
    this.paused = false;
    this.objects = []; // Track all Three.js objects for cleanup
    this.animations = []; // Track GSAP animations
  }

  /**
   * Called when parser produces new parsed output
   * Override this in your visualizer
   * @param {Object} parsedAST - Parsed code structure
   */
  update(parsedAST) {
    // Override in subclass
    console.warn('BaseVisualizer.update() not implemented');
  }

  /**
   * Called every frame via requestAnimationFrame
   * Override this for continuous animations
   * @param {number} delta - Time since last frame (seconds)
   */
  tick(delta) {
    // Override in subclass if needed
  }

  /**
   * Add a Three.js object to the scene and track it
   * @param {THREE.Object3D} object 
   */
  addObject(object) {
    this.scene.add(object);
    this.objects.push(object);
    return object;
  }

  /**
   * Remove a specific object from the scene
   * @param {THREE.Object3D} object 
   */
  removeObject(object) {
    this.scene.remove(object);
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
    
    // Dispose geometry and material
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => mat.dispose());
      } else {
        object.material.dispose();
      }
    }
  }

  /**
   * Track a GSAP animation
   * @param {gsap.core.Tween} animation 
   */
  addAnimation(animation) {
    this.animations.push(animation);
    // Apply current speed to new animation
    if (animation && animation.timeScale) {
      animation.timeScale(this.speed);
    }
    return animation;
  }

  /**
   * Pause all animations
   */
  pause() {
    this.paused = true;
    this.animations.forEach(anim => {
      if (anim && anim.pause) anim.pause();
    });
  }

  /**
   * Resume all animations
   */
  resume() {
    this.paused = false;
    this.animations.forEach(anim => {
      if (anim && anim.resume) anim.resume();
    });
  }

  /**
   * Set animation speed multiplier
   * @param {number} multiplier - 0.5 = half speed, 2.0 = double speed
   */
  setSpeed(multiplier) {
    this.speed = multiplier;
    this.animations.forEach(anim => {
      if (anim && anim.timeScale) {
        anim.timeScale(multiplier);
      }
    });
  }

  /**
   * Clear all objects and animations from this visualizer
   * Override this in subclass for custom cleanup
   */
  clear() {
    // Kill all animations
    this.animations.forEach(anim => {
      if (anim && anim.kill) anim.kill();
    });
    this.animations = [];

    // Remove and dispose all objects
    this.objects.forEach(obj => {
      this.scene.remove(obj);
      
      // Dispose geometry
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      
      // Dispose material(s)
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
      
      // Dispose texture if it exists
      if (obj.material && obj.material.map) {
        obj.material.map.dispose();
      }
    });
    
    this.objects = [];
  }

  /**
   * Reset visualizer to initial state
   * Override this in subclass for custom reset behavior
   */
  reset() {
    this.clear();
    this.paused = false;
    this.speed = 1.0;
  }

  /**
   * Clean up all scene objects when switching modes
   */
  dispose() {
    this.clear();
  }

  /**
   * Reset the visualizer to initial state
   */
  reset() {
    this.dispose();
    this.paused = false;
    this.speed = 1.0;
  }

  /**
   * Helper: Create a basic box mesh with Go type color
   * @param {string} goType - Go type (int, string, bool, etc.)
   * @param {number} width 
   * @param {number} height 
   * @param {number} depth 
   * @returns {THREE.Mesh}
   */
  createTypeBox(goType, width = 1, height = 1, depth = 0.3) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const color = this.getTypeColor(goType);
    const material = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.7,
      metalness: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Get color for a Go type
   * @param {string} goType 
   * @returns {number} Three.js color hex
   */
  getTypeColor(goType) {
    const TYPE_COLORS = {
      int:     0x4FC3F7, // Blue
      float:   0x4FC3F7,
      string:  0xFFD54F, // Yellow
      bool:    0x81C784, // Green
      func:    0xCE93D8, // Purple
      struct:  0xFF8A65, // Orange
      chan:    0x00E5FF, // Cyan
      pointer: 0xEF9A9A, // Pink
      error:   0xEF5350, // Red
      map:     0xA5D6A7, // Light green
      slice:   0x80DEEA, // Light cyan
    };
    return TYPE_COLORS[goType] || 0x888888; // Gray fallback
  }
}
