import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PLANETS } from '../engine/worldData';
import { PlanetId } from '../types/universe';

interface GalaxyCanvasProps {
  selectedPlanetId: PlanetId;
  onSelectPlanet: (planetId: PlanetId) => void;
  shipColor: string;
  reducedMotion: boolean;
  isPlayingGame: boolean;
}

// Pre-allocated scratch vectors outside render loop to guarantee zero GC in tick
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 0, 0);
const _shipTargetPos = new THREE.Vector3();
const _planetWorldPos = new THREE.Vector3();
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();
const _dummyColor = new THREE.Color();

/**
 * Generates an authentic Kurzgesagt ("In a Nutshell") style vector planet texture:
 * Flat hyper-saturated stripes, rounded pill-shaped clouds/continents, bold craters,
 * and crisp graphic contrast with zero muddy gradients.
 */
function createKurzgesagtPlanetTexture(
  primaryHex: string,
  secondaryHex: string,
  accentHex: string,
  anisotropy: number
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base flat saturated color
  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Kurzgesagt bold horizontal latitude stripes & wavy ribbons
  const stripeBands = [
    { y: 28, h: 26, color: secondaryHex },
    { y: 76, h: 34, color: accentHex },
    { y: 136, h: 42, color: secondaryHex },
    { y: 202, h: 28, color: accentHex },
  ];

  stripeBands.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.fillRect(0, b.y, canvas.width, b.h);
    // Bold dark comic ink divider lines on stripe edges
    ctx.fillStyle = '#0B0719';
    ctx.fillRect(0, b.y, canvas.width, 3);
    ctx.fillRect(0, b.y + b.h - 3, canvas.width, 3);
  });

  // Rounded pill-shaped Kurzgesagt clouds / landmass blobs
  const drawPill = (x: number, y: number, w: number, h: number, fill: string) => {
    const r = h / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0B0719';
    ctx.stroke();
  };

  for (let i = 0; i < 14; i++) {
    const px = (i * 73) % 440;
    const py = 18 + ((i * 41) % 210);
    const pw = 48 + (i % 3) * 26;
    const ph = 16 + (i % 2) * 8;
    drawPill(
      px,
      py,
      pw,
      ph,
      i % 3 === 0 ? '#FFFDF7' : i % 2 === 0 ? accentHex : secondaryHex
    );
  }

  // Pop-Art Craters & Halftone Dots
  for (let i = 0; i < 16; i++) {
    const cx = 24 + ((i * 59) % 460);
    const cy = 24 + ((i * 37) % 208);
    const cr = 8 + (i % 4) * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? secondaryHex : '#160B30';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0B0719';
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = anisotropy;

  // Subtle grayscale bump map for surface relief
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 128;
  bumpCanvas.height = 64;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 24; i++) {
    bCtx.fillStyle = i % 2 === 0 ? '#b0b0b0' : '#505050';
    bCtx.fillRect((i * 19) % 128, (i * 11) % 64, 18, 4);
  }
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = anisotropy;

  return { map, bumpMap };
}

export const GalaxyCanvas: React.FC<GalaxyCanvasProps> = ({
  selectedPlanetId,
  onSelectPlanet,
  shipColor,
  reducedMotion,
  isPlayingGame,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef({
    selectedPlanetId,
    onSelectPlanet,
    shipColor,
    reducedMotion,
    isPlayingGame,
  });

  useEffect(() => {
    propsRef.current = {
      selectedPlanetId,
      onSelectPlanet,
      shipColor,
      reducedMotion,
      isPlayingGame,
    };
  }, [selectedPlanetId, onSelectPlanet, shipColor, reducedMotion, isPlayingGame]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Kurzgesagt deep cosmic indigo-violet sky
    scene.background = new THREE.Color(0x160b30);
    scene.fog = new THREE.FogExp2(0x160b30, 0.0065);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 300);
    camera.position.set(0, 26, 48);
    camera.lookAt(0, 0, 0);

    // High-contrast Kurzgesagt Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffd600, 0x7c4dff, 1.15);
    scene.add(hemiLight);

    const sunKeyLight = new THREE.DirectionalLight(0xfffdf5, 2.5);
    sunKeyLight.position.set(20, 36, 26);
    if (!isSoftwareGl) {
      sunKeyLight.castShadow = true;
      sunKeyLight.shadow.mapSize.set(1024, 1024);
      sunKeyLight.shadow.bias = -0.0005;
      sunKeyLight.shadow.normalBias = 0.02;
    }
    scene.add(sunKeyLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 1.3);
    rimLight.position.set(-28, 15, -22);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // Shared Comic Ink Outline Material (BackSide shell gives authentic cartoon/comic ink border)
    const inkOutlineMat = new THREE.MeshBasicMaterial({
      color: 0x0b0719,
      side: THREE.BackSide,
    });

    // Central Kurzgesagt Golden Sun Core (Composite 5-part Group with Comic Outline)
    const centralStarGroup = new THREE.Group();
    const coreGeo = new THREE.SphereGeometry(3.5, 28, 28);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd600,
      emissive: 0xff9100,
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.1,
    });
    centralStarGroup.add(new THREE.Mesh(coreGeo, coreMat));

    const sunOutline = new THREE.Mesh(coreGeo, inkOutlineMat);
    sunOutline.scale.setScalar(1.06);
    centralStarGroup.add(sunOutline);

    const coronaRingGeo = new THREE.TorusGeometry(4.8, 0.18, 12, 48);
    const coronaMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.2,
    });
    const coronaRing1 = new THREE.Mesh(coronaRingGeo, coronaMat);
    coronaRing1.rotation.x = Math.PI / 2.2;
    centralStarGroup.add(coronaRing1);

    const coronaMatPink = new THREE.MeshStandardMaterial({
      color: 0xff2a85,
      emissive: 0xff2a85,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.2,
    });
    const coronaRing2 = new THREE.Mesh(coronaRingGeo, coronaMatPink);
    coronaRing2.rotation.y = Math.PI / 3;
    coronaRing2.scale.setScalar(1.22);
    centralStarGroup.add(coronaRing2);
    scene.add(centralStarGroup);

    // Instanced Pop-Art Starfield (500 vibrant stars across the galaxy)
    const starCount = 500;
    const starGeo = new THREE.OctahedronGeometry(0.24, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starField = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const palette = [0xffd600, 0x00e5ff, 0xff2a85, 0x00e676, 0xff9100, 0xfffdf7];

    for (let i = 0; i < starCount; i++) {
      const r = 46 + ((i * 73) % 75);
      const theta = i * 1.6180339 * Math.PI * 2;
      const phi = Math.acos(2 * ((i % 97) / 97) - 1);
      _dummyPos.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.45,
        r * Math.sin(phi) * Math.sin(theta)
      );
      _dummyQuat.identity();
      const s = 0.7 + ((i * 13) % 14) * 0.12;
      _dummyScale.set(s, s, s);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      starField.setMatrixAt(i, _dummyMatrix);
      _dummyColor.setHex(palette[i % palette.length]);
      starField.setColorAt(i, _dummyColor);
    }
    starField.instanceMatrix.needsUpdate = true;
    if (starField.instanceColor) starField.instanceColor.needsUpdate = true;
    starField.computeBoundingSphere();
    scene.add(starField);

    // Build the 8 Multi-Part Kurzgesagt Planets + Comic Outlines + Orbit Tracks
    const planetGroups = new Map<PlanetId, THREE.Group>();
    const interactableMeshes: THREE.Mesh[] = [];

    PLANETS.forEach((pConfig) => {
      // Pop-Art Orbit Track
      const orbitTrackGeo = new THREE.RingGeometry(
        pConfig.orbitRadius - 0.08,
        pConfig.orbitRadius + 0.08,
        72
      );
      const orbitTrackMat = new THREE.MeshBasicMaterial({
        color: pConfig.primaryColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      });
      const orbitTrack = new THREE.Mesh(orbitTrackGeo, orbitTrackMat);
      orbitTrack.rotation.x = Math.PI / 2;
      scene.add(orbitTrack);

      // Composite Planet Group (6-9 distinct parts per planet)
      const group = new THREE.Group();
      const px = Math.cos(pConfig.orbitAngle) * pConfig.orbitRadius;
      const pz = Math.sin(pConfig.orbitAngle) * pConfig.orbitRadius;
      group.position.set(px, 0, pz);

      const { map, bumpMap } = createKurzgesagtPlanetTexture(
        pConfig.primaryColor,
        pConfig.secondaryColor,
        pConfig.emissiveColor,
        maxAnisotropy
      );

      // Part 1: Primary planetary globe with Kurzgesagt vector stripe texture
      const globeGeo = new THREE.SphereGeometry(pConfig.size, 28, 28);
      const globeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map,
        bumpMap,
        bumpScale: 0.02,
        roughness: 0.55,
        metalness: 0.08,
      });
      const globeMesh = new THREE.Mesh(globeGeo, globeMat);
      globeMesh.userData = { planetId: pConfig.id };
      interactableMeshes.push(globeMesh);
      group.add(globeMesh);

      // Part 2: Bold Black Comic Ink Outline Shell around the planet!
      const globeOutline = new THREE.Mesh(globeGeo, inkOutlineMat);
      globeOutline.scale.setScalar(1.055);
      group.add(globeOutline);

      // Part 3: Polar Pop-Art Citadel Spire + Ink Outline
      const spireGeo = new THREE.ConeGeometry(pConfig.size * 0.3, pConfig.size * 0.7, 8);
      const spireMat = new THREE.MeshStandardMaterial({
        color: pConfig.emissiveColor,
        emissive: pConfig.emissiveColor,
        emissiveIntensity: 0.5,
        roughness: 0.25,
        metalness: 0.3,
      });
      const northSpire = new THREE.Mesh(spireGeo, spireMat);
      northSpire.position.y = pConfig.size + pConfig.size * 0.22;
      group.add(northSpire);

      const spireOutline = new THREE.Mesh(spireGeo, inkOutlineMat);
      spireOutline.position.copy(northSpire.position);
      spireOutline.scale.setScalar(1.12);
      group.add(spireOutline);

      // Part 4: Equatorial Comic Ring Collar
      const collarGeo = new THREE.TorusGeometry(pConfig.size * 1.08, 0.07, 8, 32);
      const collarMat = new THREE.MeshStandardMaterial({
        color: pConfig.emissiveColor,
        emissive: pConfig.emissiveColor,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.4,
      });
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.rotation.x = Math.PI / 2;
      group.add(collarMesh);

      // Part 5 & 6: Kurzgesagt Flat Graphic Planetary Rings
      if (pConfig.ringStyle && pConfig.ringStyle !== 'none') {
        const ringGeo = new THREE.RingGeometry(
          pConfig.size * 1.4,
          pConfig.size * 2.15,
          48
        );
        const ringMat = new THREE.MeshStandardMaterial({
          color: pConfig.secondaryColor,
          emissive: pConfig.primaryColor,
          emissiveIntensity: 0.35,
          roughness: 0.4,
          metalness: 0.2,
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = pConfig.ringStyle === 'tilted' ? Math.PI / 3 : Math.PI / 2.2;
        group.add(ringMesh);

        if (pConfig.ringStyle === 'double' || pConfig.ringStyle === 'quantum') {
          const outerRingGeo = new THREE.TorusGeometry(pConfig.size * 2.38, 0.09, 10, 48);
          const outerRingMesh = new THREE.Mesh(outerRingGeo, spireMat);
          outerRingMesh.rotation.x =
            pConfig.ringStyle === 'quantum' ? -Math.PI / 3.2 : Math.PI / 2.2;
          group.add(outerRingMesh);
        }
      }

      // Part 7+: Orbiting Moons with Comic Ink Outlines
      const moonPivot = new THREE.Group();
      moonPivot.name = 'moonPivot';
      const moonColors = [0xffd600, 0x00e5ff, 0xff2a85, 0x00e676];
      for (let m = 0; m < pConfig.moons; m++) {
        const moonSubGroup = new THREE.Group();
        const moonGeo = new THREE.SphereGeometry(0.28 + m * 0.05, 14, 14);
        const moonMat = new THREE.MeshStandardMaterial({
          color: moonColors[(pConfig.number + m) % moonColors.length],
          roughness: 0.5,
          metalness: 0.1,
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        const moonOutline = new THREE.Mesh(moonGeo, inkOutlineMat);
        moonOutline.scale.setScalar(1.12);
        moonSubGroup.add(moon);
        moonSubGroup.add(moonOutline);

        const angle = (m / pConfig.moons) * Math.PI * 2;
        const dist = pConfig.size * 2.5 + m * 0.6;
        moonSubGroup.position.set(
          Math.cos(angle) * dist,
          0.25 * (m % 2 === 0 ? 1 : -1),
          Math.sin(angle) * dist
        );
        moonPivot.add(moonSubGroup);
      }
      group.add(moonPivot);

      // Contact shadow / pop-art aura disc beneath planet
      const wellGeo = new THREE.CircleGeometry(pConfig.size * 1.9, 32);
      const wellMat = new THREE.MeshBasicMaterial({
        color: pConfig.primaryColor,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      const wellDisc = new THREE.Mesh(wellGeo, wellMat);
      wellDisc.rotation.x = -Math.PI / 2;
      wellDisc.position.y = -pConfig.size - 0.15;
      group.add(wellDisc);

      scene.add(group);
      planetGroups.set(pConfig.id, group);
    });

    // Kurzgesagt Explorer Rocket Ship (7-Part Composite THREE.Group with Comic Ink Outline)
    const shipGroup = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(propsRef.current.shipColor),
      roughness: 0.3,
      metalness: 0.3,
    });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xffd600,
      emissive: 0xff9100,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.2,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xff2a85,
      roughness: 0.4,
      metalness: 0.2,
    });
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

    const fuselageGeo = new THREE.ConeGeometry(0.4, 1.5, 12);
    const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
    fuselage.rotation.x = Math.PI / 2;
    shipGroup.add(fuselage);

    const fuselageOutline = new THREE.Mesh(fuselageGeo, inkOutlineMat);
    fuselageOutline.rotation.x = Math.PI / 2;
    fuselageOutline.scale.setScalar(1.08);
    shipGroup.add(fuselageOutline);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), canopyMat);
    canopy.position.set(0, 0.18, 0.1);
    canopy.scale.set(0.9, 0.7, 1.5);
    shipGroup.add(canopy);

    const wingGeo = new THREE.BoxGeometry(1.4, 0.08, 0.6);
    const wings = new THREE.Mesh(wingGeo, trimMat);
    wings.position.set(0, 0, -0.2);
    shipGroup.add(wings);

    const podGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.55, 8);
    const leftPod = new THREE.Mesh(podGeo, hullMat);
    leftPod.rotation.x = Math.PI / 2;
    leftPod.position.set(-0.45, 0, -0.35);
    shipGroup.add(leftPod);
    const rightPod = new THREE.Mesh(podGeo, hullMat);
    rightPod.rotation.x = Math.PI / 2;
    rightPod.position.set(0.45, 0, -0.35);
    shipGroup.add(rightPod);

    const exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), thrusterMat);
    exhaust.rotation.x = -Math.PI / 2;
    exhaust.position.set(0, 0, -0.95);
    shipGroup.add(exhaust);

    shipGroup.position.set(0, 3.5, 14);
    scene.add(shipGroup);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      if (propsRef.current.isPlayingGame) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactableMeshes, false);
      if (hits.length > 0) {
        const hitPlanetId = hits[0].object.userData?.planetId as PlanetId | undefined;
        if (hitPlanetId) {
          propsRef.current.onSelectPlanet(hitPlanetId);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    const startTime = lastTime;
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const elapsed = (now - startTime) / 1000;
      const { selectedPlanetId: activePlanet, reducedMotion: rm, shipColor: sc } = propsRef.current;

      hullMat.color.set(sc);
      const motionScale = rm ? 0.08 : 1.0;

      centralStarGroup.rotation.y += dt * 0.25 * motionScale;
      coronaRing1.rotation.z += dt * 0.4 * motionScale;
      coronaRing2.rotation.x -= dt * 0.3 * motionScale;

      PLANETS.forEach((pConfig) => {
        const grp = planetGroups.get(pConfig.id);
        if (!grp) return;
        const angle = pConfig.orbitAngle + elapsed * pConfig.orbitSpeed * 0.15 * motionScale;
        grp.position.set(
          Math.cos(angle) * pConfig.orbitRadius,
          Math.sin(elapsed * 0.8 + pConfig.number) * 0.35 * motionScale,
          Math.sin(angle) * pConfig.orbitRadius
        );
        grp.rotation.y += dt * 0.45 * motionScale;
        const mp = grp.getObjectByName('moonPivot');
        if (mp) mp.rotation.y += dt * 1.1 * motionScale;
      });

      const targetGroup = planetGroups.get(activePlanet);
      if (targetGroup) {
        targetGroup.getWorldPosition(_planetWorldPos);
        const dirToPlanet = _planetWorldPos.clone().normalize();
        const pCfg = PLANETS.find((p) => p.id === activePlanet)!;
        const camOffsetDist = pCfg.size * 5.0 + 5.2;

        _targetCamPos.set(
          _planetWorldPos.x + dirToPlanet.x * camOffsetDist + 3.5,
          _planetWorldPos.y + pCfg.size * 2.5 + 3.0,
          _planetWorldPos.z + dirToPlanet.z * camOffsetDist + 4.5
        );
        _targetLookAt.copy(_planetWorldPos);

        const shipOrbitAngle = elapsed * 0.95 * motionScale;
        const shipRadius = pCfg.size * 2.3;
        _shipTargetPos.set(
          _planetWorldPos.x + Math.cos(shipOrbitAngle) * shipRadius,
          _planetWorldPos.y + 1.1,
          _planetWorldPos.z + Math.sin(shipOrbitAngle) * shipRadius
        );
      } else {
        _targetCamPos.set(0, 26, 48);
        _targetLookAt.set(0, 0, 0);
        _shipTargetPos.set(0, 4, 12);
      }

      const dampFactor = rm ? 1 : 1 - Math.exp(-3.5 * dt);
      camera.position.lerp(_targetCamPos, dampFactor);
      _currentLookAt.lerp(_targetLookAt, dampFactor);
      camera.lookAt(_currentLookAt);

      shipGroup.position.lerp(_shipTargetPos, dampFactor);
      shipGroup.lookAt(_targetLookAt);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="galaxy-webgl-canvas"
      className="fixed inset-0 w-full h-full pointer-events-auto z-0"
      aria-label="LearnFun 3D Kurzgesagt Pop-Art Galaxy Viewport"
    />
  );
};
