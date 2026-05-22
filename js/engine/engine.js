/**
 * SQL Visualization Engine
 * Dispatches parsed SQL queries to the correct visualizer(s)
 * and manages the active visualization state.
 */

import SelectVisualizer from "../visualizers/select.js";
import InsertVisualizer from "../visualizers/insert.js";
import UpdateVisualizer from "../visualizers/update.js";
import DeleteVisualizer from "../visualizers/delete.js";
import CreateTableVisualizer from "../visualizers/create.js";

export default class SQLEngine {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Instantiate all SQL visualizers
    this.visualizers = {
      select: new SelectVisualizer(scene, camera),
      insert: new InsertVisualizer(scene, camera),
      update: new UpdateVisualizer(scene, camera),
      delete: new DeleteVisualizer(scene, camera),
      create: new CreateTableVisualizer(scene, camera),
    };

    this.lastParsed = null;
    this.activeVisualizer = null;
  }

  /**
   * Main dispatch method — called every time the SQL code changes (debounced)
   * @param {Object} parsed - ParseResult from parser.js
   */
  update(parsed) {
    if (!parsed) return;
    this.lastParsed = parsed;

    // Clear all visualizers first
    this.clearAll();

    // Dispatch based on query type
    switch (parsed.type) {
      case 'SELECT':
        if (parsed.selects && parsed.selects.length > 0) {
          this.visualizers.select.update(parsed.selects[0]);
          this.activeVisualizer = 'select';
        }
        break;

      case 'INSERT':
        if (parsed.inserts && parsed.inserts.length > 0) {
          this.visualizers.insert.update(parsed.inserts[0]);
          this.activeVisualizer = 'insert';
        }
        break;

      case 'UPDATE':
        if (parsed.updates && parsed.updates.length > 0) {
          this.visualizers.update.update(parsed.updates[0]);
          this.activeVisualizer = 'update';
        }
        break;

      case 'DELETE':
        if (parsed.deletes && parsed.deletes.length > 0) {
          this.visualizers.delete.update(parsed.deletes[0]);
          this.activeVisualizer = 'delete';
        }
        break;

      case 'CREATE':
        if (parsed.creates && parsed.creates.length > 0) {
          this.visualizers.create.update(parsed.creates[0]);
          this.activeVisualizer = 'create';
        }
        break;

      default:
        console.warn('[Engine] Unknown query type:', parsed.type);
    }
  }

  /**
   * Clear all visualizers
   */
  clearAll() {
    for (const viz of Object.values(this.visualizers)) {
      viz.clear();
    }
  }

  /**
   * Tick all active visualizers (called every animation frame)
   * @param {number} delta
   */
  tick(delta) {
    for (const viz of Object.values(this.visualizers)) {
      viz.tick(delta);
    }
  }

  /** Pause all animations */
  pause() {
    for (const viz of Object.values(this.visualizers)) viz.pause();
  }

  /** Resume all animations */
  resume() {
    for (const viz of Object.values(this.visualizers)) viz.resume();
  }

  /** Set playback speed for all visualizers */
  setSpeed(n) {
    for (const viz of Object.values(this.visualizers)) viz.setSpeed(n);
  }

  /** Reset the entire scene */
  reset() {
    for (const viz of Object.values(this.visualizers)) viz.reset();
    this.lastParsed = null;
    this.activeVisualizer = null;
  }

  /** Dispose everything (e.g. switching modes) */
  dispose() {
    for (const viz of Object.values(this.visualizers)) viz.dispose();
  }
}

// Export as both names for compatibility
export { SQLEngine as OpenWorldEngine };
