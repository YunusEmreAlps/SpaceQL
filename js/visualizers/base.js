/**
 * BaseVisualizer
 * Foundation class that all visualizers extend
 * 
 * Every visualizer must implement:
 * - update(parsedAST) - Called when code changes
 * - tick(delta) - Called every frame (optional)
 */

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

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
   * Clean up all scene objects when switching modes
   */
  dispose() {
    this.clear();
  }

  /**
   * Reset visualizer to initial state
   * Override this in subclass for custom reset behavior
   */
  reset() {
    this.dispose();
    this.paused = false;
    this.speed = 1.0;
  }

  /**
   * Stable identity key for a fetched row object. Uses the first column,
   * which is the primary key for every table in this app's schema - good
   * enough to correlate "all rows" against a separately-fetched "matching
   * WHERE" subset without a real join key.
   * @param {Object} row
   * @returns {string}
   */
  rowKey(row) {
    const firstKey = Object.keys(row)[0];
    return String(row[firstKey]);
  }

  /**
   * Short "col: value  col: value" preview string for a row object, skipping
   * the leading id-like column when there's more informative data to show.
   * @param {Object} row
   * @param {number} count - max columns to include
   * @returns {string}
   */
  rowPreview(row, count = 2) {
    const keys = Object.keys(row);
    const parts = keys.length > 1 ? keys.slice(1, 1 + count) : keys.slice(0, count);
    return parts.map(k => `${k}: ${row[k]}`).join('  ');
  }

  /**
   * Shared canvas-sprite label builder used by every visualizer's
   * createLabel/createSmallLabel/createColoredLabel wrappers.
   * Kept flexible via options so each visualizer keeps its existing look.
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {Object} opts
   * @returns {THREE.Sprite}
   */
  makeLabelSprite(text, x, y, z, opts = {}) {
    const {
      scale = 0.2,
      color = '#00ADD8',
      fontSize = 28,
      canvasWidth = 512,
      canvasHeight = 128,
      scaleMultX = 6,
      scaleMultY = 1.5,
      fade = false,
      fadeDelay = 0.8,
      fadeDuration = 0.5,
    } = opts;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context.fillStyle = color;
    context.font = `bold ${fontSize}px monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Support multi-line labels (split on \n)
    const lines = String(text).split('\n');
    const lineHeight = fontSize + 8;
    const startY = canvasHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      context.fillText(line, canvasWidth / 2, startY + i * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale * scaleMultX, scale * scaleMultY, 1);

    if (fade) {
      sprite.material.opacity = 0;
      const anim = gsap.to(sprite.material, {
        opacity: 1,
        duration: fadeDuration,
        delay: fadeDelay,
      });
      this.addAnimation(anim);
    }

    this.addObject(sprite);
    return sprite;
  }

  /**
   * Crisp HTML label via CSS2DObject - constant screen size, never blurry or
   * distance-scaled, unlike the canvas-sprite labels above. Preferred for
   * all new label call sites; `clear()`/`removeObject()` already dispose it
   * correctly since CSS2DObject removes its own DOM element when detached
   * from the scene (three.js handles this internally on the 'removed' event).
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {Object} opts
   * @returns {CSS2DObject}
   */
  makeTag(text, x, y, z, opts = {}) {
    const {
      color = '#00ADD8',
      size = 'md', // 'sm' | 'md' | 'lg'
      fade = false,
      fadeDelay = 0.3,
      fadeDuration = 0.4,
    } = opts;

    const el = document.createElement('div');
    el.className = `viz-tag viz-tag--${size}`;
    el.style.setProperty('--tag-color', color);
    el.textContent = text;

    const tag = new CSS2DObject(el);
    tag.position.set(x, y, z);

    if (fade) {
      el.style.opacity = '0';
      const anim = gsap.to(el, {
        opacity: 1,
        duration: fadeDuration,
        delay: fadeDelay,
      });
      this.addAnimation(anim);
    }

    this.addObject(tag);
    return tag;
  }
}
