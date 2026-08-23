/**
 * Three.js Scene Infrastructure
 * Sets up camera, lights, renderer, orbit controls, and animation loop
 * Includes post-processing (bloom), CSS2D labels, and neon grid
 *
 * Note: Import Three.js and OrbitControls from CDN in your HTML:
 * <script type="importmap">
 * {
 *   "imports": {
 *     "three": "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js",
 *     "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/"
 *   }
 * }
 * </script>
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Pure black for space feel
scene.fog = new THREE.FogExp2(0x000000, 0.02); // Subtle depth fog

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75, // FOV
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near plane
  1000, // Far plane
);
camera.position.set(5, 5, 8);
camera.lookAt(0, 0, 0);

// Main WebGL Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// CSS2D Renderer for HTML labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.left = "0";
labelRenderer.domElement.style.pointerEvents = "none";

// Orbit Controls (mouse drag to rotate, scroll to zoom)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.dampingFactor = 0.05;
controls.minDistance = 3; // Zoom limits
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI / 2; // Don't go below ground
controls.target.set(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(10, 15, 10);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Neon accent lights
const neonLight1 = new THREE.PointLight(0x00add8, 0.5, 20);
neonLight1.position.set(5, 3, 5);
scene.add(neonLight1);

const neonLight2 = new THREE.PointLight(0x4a9eff, 0.5, 20);
neonLight2.position.set(-5, 3, -5);
scene.add(neonLight2);

// Neon Grid Floor (bright, glowing)
const gridSize = 40;
const gridDivisions = 40;
const gridHelper = new THREE.GridHelper(
  gridSize,
  gridDivisions,
  0x00add8, // Center line (SQL teal - bright)
  0x1a3a5c, // Grid lines (brighter border color)
);
gridHelper.material.opacity = 0.6;
gridHelper.material.transparent = true;
gridHelper.position.y = -0.01; // Slight offset to prevent z-fighting
scene.add(gridHelper);

// Add glowing plane underneath grid for extra neon effect
const gridGlowGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
const gridGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0x00add8,
  transparent: true,
  opacity: 0.05,
  side: THREE.DoubleSide,
});
const gridGlow = new THREE.Mesh(gridGlowGeometry, gridGlowMaterial);
gridGlow.rotation.x = -Math.PI / 2;
gridGlow.position.y = -0.02;
scene.add(gridGlow);

// Starfield - gives the "Space"QL name an actual space backdrop instead of
// flat black. Two layers (dim distant + brighter near) for a bit of depth.
function createStarfield(count, radius, size, opacity) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.5 + Math.random() * 0.5);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 4; // keep above the floor grid
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

const stars = createStarfield(1600, 90, 0.5, 0.7);
scene.add(stars);

const starsNear = createStarfield(500, 45, 0.9, 0.9);
starsNear.material.color.set(0x9fdcff);
scene.add(starsNear);

// Post-processing: Bloom Effect
const composer = new EffectComposer(renderer);

// Add render pass (renders the scene)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom pass (glowing neon effect)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2, // Strength
  0.4, // Radius
  0.85, // Threshold
);
composer.addPass(bloomPass);

// Window resize handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

// Animation loop
let animationFrameId = null;
const clock = new THREE.Clock();

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Update controls
  controls.update();

  // Render with post-processing (bloom)
  composer.render();

  // Render HTML labels
  labelRenderer.render(scene, camera);
}

// Don't start animation automatically - let the main app control it

// Export API
export { scene, camera, renderer, labelRenderer, composer, controls, animate, stars, starsNear };

// Helper function to get canvas element (for mounting)
export function getCanvas() {
  return renderer.domElement;
}

// Helper function to get label renderer element (for mounting)
export function getLabelRenderer() {
  return labelRenderer.domElement;
}

// Cleanup function
export function dispose() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener("resize", onWindowResize);
  controls.dispose();
  renderer.dispose();
  composer.dispose();
}

// Camera view mode switching
let currentCameraMode = '3d';

export function setCameraMode(mode) {
  currentCameraMode = mode;
  
  if (mode === '2d') {
    // 2D top-down view
    camera.position.set(0, 12, 0);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    
    // Restrict orbit controls for 2D view
    controls.enableRotate = false;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = 0.01; // Almost top-down
    controls.minDistance = 8;
    controls.maxDistance = 20;
  } else {
    // 3D perspective view
    camera.position.set(5, 5, 8);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    
    // Enable full orbit controls
    controls.enableRotate = true;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 3;
    controls.maxDistance = 30;
  }
  
  controls.update();
}

export function getCameraMode() {
  return currentCameraMode;
}
