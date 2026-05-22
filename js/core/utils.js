/**
 * Core Utilities
 * Shared helper functions used across the application
 */

import * as THREE from 'three';

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last call. Perfect for code editor input handling.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a random color from a predefined palette
 * @param {number} index - Optional index to get consistent color
 * @returns {number} Three.js color hex value
 */
export function getGoroutineColor(index) {
  const colors = [
    0x00E5FF, // Cyan
    0x69FF47, // Green
    0xFF6D00, // Orange
    0xD500F9, // Purple
    0xFFEA00, // Yellow
  ];
  return colors[index % colors.length];
}

/**
 * Type colors mapping (from spec)
 * @returns {Object} Map of Go types to Three.js color hex values
 */
export const TYPE_COLORS = {
  int:     0x4FC3F7, // Blue
  float:   0x4FC3F7, // Blue
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

/**
 * Goroutine state colors (from spec)
 * @returns {Object} Map of states to Three.js color hex values
 */
export const GOROUTINE_STATES = {
  running: 0x69FF47, // Green
  blocked: 0xFF1744, // Red
  waiting: 0xFFD600, // Yellow
  done:    0x546E7A, // Gray
};

/**
 * Clamp a value between min and max
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Time (0 to 1)
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Create a text sprite for labels (Three.js canvas texture)
 * @param {string} text - Text to display
 * @param {Object} options - Styling options
 * @returns {THREE.Sprite}
 */
export function createTextSprite(text, options = {}) {
  const {
    fontSize = 48,
    fontFamily = 'monospace',
    color = '#FFFFFF',
    backgroundColor = 'transparent',
  } = options;

  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px ${fontFamily}`;
  
  // Measure text
  const metrics = context.measureText(text);
  const textWidth = metrics.width;
  
  // Set canvas size
  canvas.width = textWidth + 20;
  canvas.height = fontSize + 20;
  
  // Draw background
  if (backgroundColor !== 'transparent') {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw text
  context.font = `${fontSize}px ${fontFamily}`;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create sprite
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  
  // Scale sprite appropriately
  sprite.scale.set(canvas.width / 100, canvas.height / 100, 1);
  
  return sprite;
}

/**
 * Parse simple Go type from string
 * @param {string} typeStr - Go type string (e.g., "int", "string", "[]int")
 * @returns {string} Base type
 */
export function parseGoType(typeStr) {
  if (!typeStr) return 'unknown';
  
  // Strip brackets for slices/arrays
  if (typeStr.startsWith('[]')) {
    return 'slice';
  }
  
  // Check for map
  if (typeStr.startsWith('map[')) {
    return 'map';
  }
  
  // Check for chan
  if (typeStr.startsWith('chan ')) {
    return 'chan';
  }
  
  // Check for pointer
  if (typeStr.startsWith('*')) {
    return 'pointer';
  }
  
  // Return base type
  return typeStr;
}
