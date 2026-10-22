// src/components/NanoViewport3D.tsx
import React, { useMemo, useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  Camera,
  Check,
  Lock,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Scissors,
  CircleDot,
  Globe,
  Activity,
  Play,
  Pause,
  Crosshair,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
} from 'lucide-react';
import {
  calculateAmbientLnpTelemetry,
  type LnpBiophysicsResult,
  type LnpFormulation,
} from '../engines/bioEngines';
import { tokens } from '../styles/tokens';

interface Props {
  formulation: LnpFormulation;
  biophysics: LnpBiophysicsResult;
}

export type CutawayMode = 'quarter' | 'half' | 'full' | 'core';
export type InspectedLayer = 'all' | 'peg' | 'lipids' | 'tails' | 'mrna' | 'apoe';
export type OpticalMode = 'pbr' | 'cryo' | 'electrostatic';
export type ViewportSize = 'standard' | 'expanded' | 'fullscreen';

interface LayerVisibility {
  peg: boolean;
  lipids: boolean;
  tails: boolean;
  mrna: boolean;
  apoe: boolean;
}

// Upper-bound capacities for GPU InstancedMesh buffers
const MAX_LIPID_HEADS = 2400;
const MAX_ACYL_TAILS = 4800;
const MAX_PEG_BEADS = 8400;
const MAX_MICELLES = 480;
const MAX_RNA_RUNGS = 180;

/**
 * Fast spatial cutaway predicate for unit-sphere coordinates.
 * Slices the positive quadrant (x > 0 and z > 0) for 90° wedge or (z > 0) for 180° sagittal.
 */
function isPointCut(x: number, _y: number, z: number, mode: CutawayMode): boolean {
  if (mode === 'full' || mode === 'core') return false;
  if (mode === 'half') {
    return z > 0.0;
  }
  if (mode === 'quarter') {
    return x > 0.0 && z > 0.0;
  }
  return false;
}

/**
 * Procedural 512x512 High-DPI SAXS & Cryo-EM Electron-Density Cross-Section Texture.
 */
function createElectronDensityTexture(
  protonationFraction: number,
  opticalMode: OpticalMode,
  saxsSpacingNm: number = 6.2
): THREE.DataTexture {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  const center = size / 2;
  const maxR = size * 0.485;

  const isHiiPhase = protonationFraction > 0.45;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - center) / maxR;
      const dy = (y - center) / maxR;
      const r = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const idx = (y * size + x) * 4;

      if (r > 1.0) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
        continue;
      }

      let rVal = 0;
      let gVal = 0;
      let bVal = 0;
      let aVal = 255;

      // 1. OUTER POLAR HEADGROUP MONOLAYER RIM (r in [0.89, 1.0]) ~2.5 nm
      if (r >= 0.89) {
        const headModulation = (Math.sin(angle * 72.0) * 0.5 + 0.5) * 0.2;
        const rimIntensity = 0.8 + headModulation;

        if (opticalMode === 'cryo') {
          const gray = Math.round(180 * rimIntensity);
          rVal = gray;
          gVal = gray;
          bVal = gray;
        } else if (opticalMode === 'electrostatic') {
          rVal = Math.round(180 * (1 - protonationFraction * 0.6));
          gVal = Math.round(195 * (0.6 + protonationFraction * 0.4));
          bVal = Math.round(140 + protonationFraction * 80);
        } else {
          rVal = Math.round(215 * rimIntensity);
          gVal = Math.round(175 * rimIntensity);
          bVal = Math.round(105 * rimIntensity);
        }
        aVal = Math.round(250 * Math.min(1.0, (1.0 - r) * 25));
      }
      // 2. HYDROPHOBIC ACYL TAIL ZONE (r in [0.76, 0.89]) ~3.5 nm
      else if (r >= 0.76) {
        const tailStriation = Math.sin(angle * 144.0) * 0.12;
        const tailDepth = (r - 0.76) / 0.13;
        const baseDark = 0.22 + 0.18 * tailDepth + tailStriation;

        if (opticalMode === 'cryo') {
          const gray = Math.round(65 + 45 * baseDark);
          rVal = gray;
          gVal = gray;
          bVal = gray;
        } else if (opticalMode === 'electrostatic') {
          rVal = Math.round(75 + 30 * baseDark);
          gVal = Math.round(65 + 25 * baseDark);
          bVal = Math.round(55 + 20 * baseDark);
        } else {
          rVal = Math.round(92 * baseDark);
          gVal = Math.round(74 * baseDark);
          bVal = Math.round(56 * baseDark);
        }
      }
      // 3. CORE INTERNAL MATRIX (r < 0.76)
      else {
        const saxsFreq = (6.2 / Math.max(4.0, saxsSpacingNm)) * 14.0;
        const braggRing = Math.sin(r * Math.PI * saxsFreq) * 0.5 + 0.5;

        let hexPore = 0;
        if (isHiiPhase) {
          const u = dx * 22.0;
          const v = dy * 22.0;
          const hx = u * 0.866 - v * 0.5;
          const hy = v;
          const distToPore = Math.sqrt(
            Math.pow((Math.abs(hx) % 1.0) - 0.5, 2) + Math.pow((Math.abs(hy) % 1.0) - 0.5, 2)
          );
          hexPore = Math.max(0, 1.0 - distToPore * 3.2) * (protonationFraction - 0.35) * 1.5;
        }

        const isCentralRnp = r < 0.28;
        const rnpMottle = (Math.sin(dx * 45) * Math.cos(dy * 45) * 0.5 + 0.5) * 0.25;

        if (opticalMode === 'cryo') {
          let gray = Math.round(50 + 60 * braggRing + hexPore * 75);
          if (isCentralRnp) gray = Math.round(gray * 1.35 + rnpMottle * 40);
          rVal = gray;
          gVal = gray;
          bVal = gray;
        } else if (opticalMode === 'electrostatic') {
          rVal = Math.round(35 + (1 - braggRing) * 80 + (isCentralRnp ? 50 : 0));
          gVal = Math.round(55 + braggRing * 110 + hexPore * 100);
          bVal = Math.round(75 + braggRing * 90 + hexPore * 80);
        } else {
          const poreGlow = Math.min(1.0, hexPore * 1.2);
          rVal = Math.round(42 + 45 * braggRing + poreGlow * 55 + (isCentralRnp ? 60 : 0));
          gVal = Math.round(36 + 35 * braggRing + poreGlow * 115 + (isCentralRnp ? 35 : 0));
          bVal = Math.round(32 + 30 * braggRing + poreGlow * 120 + (isCentralRnp ? 45 : 0));
        }

        aVal = Math.round(235 + 20 * (1 - r));
      }

      data[idx] = Math.min(255, Math.max(0, rVal));
      data[idx + 1] = Math.min(255, Math.max(0, gVal));
      data[idx + 2] = Math.min(255, Math.max(0, bVal));
      data[idx + 3] = aVal;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function RendererConfig({
  diameter,
  captureRef,
}: {
  diameter: number;
  captureRef: React.RefObject<(() => string | null) | null>;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const targetZ = 4.45 + Math.max(0, (diameter - 50) / 130) * 1.65;
    camera.position.set(0, 0, targetZ);
    camera.updateProjectionMatrix();
  }, [camera, diameter]);

  useEffect(() => {
    captureRef.current = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/png');
    };
    return () => {
      captureRef.current = null;
    };
  }, [gl, scene, camera, captureRef]);

  return null;
}

interface SceneProps extends Props {
  autoRotate: boolean;
  cutawayMode: CutawayMode;
  opticalMode: OpticalMode;
  ambientPh: number;
  liveProtonation: number;
  liveCpp: number;
  saxsSpacing: number;
  visibility: LayerVisibility;
  inspectedLayer: InspectedLayer;
  onHoverLayer: (layer: InspectedLayer | null) => void;
  onSelectLayer: (layer: InspectedLayer) => void;
}

function InstancedNanoparticleScene({
  formulation,
  biophysics,
  autoRotate,
  cutawayMode,
  opticalMode,
  ambientPh,
  liveProtonation,
  liveCpp,
  saxsSpacing,
  visibility,
  inspectedLayer,
  onHoverLayer,
  onSelectLayer,
}: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  const headsMeshRef = useRef<THREE.InstancedMesh>(null);
  const tailsMeshRef = useRef<THREE.InstancedMesh>(null);
  const pegMeshRef = useRef<THREE.InstancedMesh>(null);
  const micellesMeshRef = useRef<THREE.InstancedMesh>(null);
  const rungsMeshRef = useRef<THREE.InstancedMesh>(null);

  const bindLayerEvents = useCallback(
    (layer: Exclude<InspectedLayer, 'all'>) => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHoverLayer(layer);
      },
      onPointerOut: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHoverLayer(null);
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelectLayer(layer);
      },
    }),
    [onHoverLayer, onSelectLayer]
  );

  const radius = useMemo(() => {
    return 1.45 + ((biophysics.diameterNm - 50) / 130) * 0.95;
  }, [biophysics.diameterNm]);

  const shellThickness = useMemo(() => radius * 0.22, [radius]);
  const coreRadius = useMemo(() => radius - shellThickness, [radius, shellThickness]);

  const effectiveCholesterol = Math.max(
    0,
    100 - formulation.ionizableLipid - formulation.dspcHelper - formulation.pegLipid
  );
  const pegFrac = formulation.pegLipid / 100;
  const dspcFrac = formulation.dspcHelper / 100;
  const cholFrac = effectiveCholesterol / 100;

  // High-density Fibonacci lattice: 2,400 outer lipids + 4,800 sn-1/sn-2 acyl chains
  const {
    headMatrices,
    headColors,
    tailMatrices,
    tailColors,
    pegBaseData,
    apoeClusters,
  } = useMemo(() => {
    const lipidCount = MAX_LIPID_HEADS;
    const phi = Math.PI * (3 - Math.sqrt(5));

    const hMats: THREE.Matrix4[] = [];
    const hCols: THREE.Color[] = [];
    const tMats: THREE.Matrix4[] = [];
    const tCols: THREE.Color[] = [];
    const pegData: {
      anchor: THREE.Vector3;
      normal: THREE.Vector3;
      tangent: THREE.Vector3;
      bitangent: THREE.Vector3;
      t: number;
      chainIdx: number;
      scale: number;
    }[] = [];
    const apoeList: { pos: THREE.Vector3; quat: THREE.Quaternion }[] = [];

    const dummyObj = new THREE.Object3D();
    const upVec = new THREE.Vector3(0, 1, 0);

    const pegSheddingFactor = ambientPh < 6.2 ? 0.68 : 1.0;
    const isBrush = formulation.pegLipid >= 2.2;
    const chainLength = (isBrush ? radius * 0.30 : radius * 0.16) * pegSheddingFactor;
    const beadsPerChain = isBrush ? 7 : 5;

    const targetApoECount = Math.max(1, Math.min(12, Math.round(biophysics.cellularUptakeScore / 9)));
    let apoeAssigned = 0;
    let dspcCount = 0;

    const splayAngle = 0.10 + (liveCpp - 1.08) * 0.32;

    for (let i = 0; i < lipidCount; i++) {
      const y = 1 - (i / (lipidCount - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const norm = new THREE.Vector3(x, y, z).normalize();
      if (isPointCut(norm.x, norm.y, norm.z, cutawayMode)) continue;

      const seed = (i * 1.618033988749895) % 1.0;
      let type: 'ionizable' | 'dspc' | 'chol' | 'peg' = 'ionizable';
      let headScale = 0.038;
      let tailLen = shellThickness * 0.82;
      const col = new THREE.Color();

      if (seed < pegFrac * pegSheddingFactor) {
        type = 'peg';
        headScale = 0.040;
        col.set(tokens.colors.pigments.petrol);
      } else if (seed < pegFrac * pegSheddingFactor + dspcFrac) {
        type = 'dspc';
        headScale = 0.041;
        col.set(tokens.colors.pigments.ivory);
      } else if (seed < pegFrac * pegSheddingFactor + dspcFrac + cholFrac) {
        type = 'chol';
        headScale = 0.033;
        tailLen = shellThickness * 0.54;
        col.set(tokens.colors.pigments.terracotta);
      } else {
        if (opticalMode === 'electrostatic') {
          col.lerpColors(
            new THREE.Color(tokens.colors.pigments.ochre),
            new THREE.Color(tokens.colors.status.success),
            liveProtonation
          );
        } else if (opticalMode === 'cryo') {
          col.set('#b0a79a');
        } else {
          col.lerpColors(
            new THREE.Color('#cfa052'),
            new THREE.Color(tokens.colors.status.success),
            liveProtonation * 0.65
          );
        }
      }

      const radialOffset = type === 'chol' ? radius - shellThickness * 0.16 : radius;
      dummyObj.position.copy(norm).multiplyScalar(radialOffset);
      dummyObj.scale.setScalar(headScale);
      dummyObj.rotation.set(0, 0, 0);
      dummyObj.updateMatrix();
      hMats.push(dummyObj.matrix.clone());
      hCols.push(col);

      const refAxis = Math.abs(norm.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const tangent = new THREE.Vector3().crossVectors(norm, refAxis).normalize();
      const bitangent = new THREE.Vector3().crossVectors(norm, tangent).normalize();

      const baseQuat = new THREE.Quaternion().setFromUnitVectors(upVec, norm);
      const tailColor = new THREE.Color(
        opticalMode === 'cryo' ? '#4f473e' : type === 'chol' ? '#5c3127' : '#3d3429'
      );

      if (type === 'chol') {
        const center = norm.clone().multiplyScalar(radialOffset - tailLen * 0.5);
        dummyObj.position.copy(center);
        dummyObj.quaternion.copy(baseQuat);
        dummyObj.scale.set(0.014, tailLen, 0.014);
        dummyObj.updateMatrix();
        tMats.push(dummyObj.matrix.clone());
        tCols.push(tailColor);
      } else {
        for (const dir of [-1, 1]) {
          const splayQuat = new THREE.Quaternion().setFromAxisAngle(tangent, dir * splayAngle);
          const finalQuat = baseQuat.clone().premultiply(splayQuat);
          const lateralShift = bitangent.clone().multiplyScalar(dir * 0.013);
          const center = norm
            .clone()
            .multiplyScalar(radius - tailLen * 0.50)
            .add(lateralShift);

          dummyObj.position.copy(center);
          dummyObj.quaternion.copy(finalQuat);
          dummyObj.scale.set(0.010, tailLen, 0.010);
          dummyObj.updateMatrix();
          tMats.push(dummyObj.matrix.clone());
          tCols.push(tailColor);
        }
      }

      if (type === 'peg' && i % 2 === 0 && pegData.length + beadsPerChain <= MAX_PEG_BEADS) {
        const anchorPos = norm.clone().multiplyScalar(radius);
        for (let step = 1; step <= beadsPerChain; step++) {
          const t = step / beadsPerChain;
          const radialDist = radius + t * chainLength;
          pegData.push({
            anchor: anchorPos.clone(),
            normal: norm.clone().multiplyScalar(radialDist),
            tangent: tangent.clone(),
            bitangent: bitangent.clone(),
            t,
            chainIdx: i,
            scale: 0.025 - t * 0.007,
          });
        }
      }

      if (type === 'dspc') {
        dspcCount++;
        const dspcStep = Math.max(1, Math.floor(200 / targetApoECount));
        if (apoeAssigned < targetApoECount && dspcCount % dspcStep === 0) {
          apoeList.push({
            pos: norm.clone().multiplyScalar(radius + 0.048),
            quat: baseQuat.clone(),
          });
          apoeAssigned++;
        }
      }
    }

    return {
      headMatrices: hMats,
      headColors: hCols,
      tailMatrices: tMats,
      tailColors: tCols,
      pegBaseData: pegData,
      apoeClusters: apoeList,
    };
  }, [
    radius,
    shellThickness,
    formulation.ionizableLipid,
    formulation.dspcHelper,
    formulation.pegLipid,
    effectiveCholesterol,
    pegFrac,
    dspcFrac,
    cholFrac,
    cutawayMode,
    opticalMode,
    ambientPh,
    liveProtonation,
    liveCpp,
    biophysics.cellularUptakeScore,
  ]);

  // Double-Stranded mRNA/sgRNA Duplex & Superhelices
  const {
    mrnaStrandAGeo,
    mrnaStrandBGeo,
    sgrnaGeo,
    rungMatrices,
    rungColors,
  } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const upVec = new THREE.Vector3(0, 1, 0);

    const ptsA: THREE.Vector3[] = [];
    const ptsB: THREE.Vector3[] = [];
    const rMats: THREE.Matrix4[] = [];
    const rCols: THREE.Color[] = [];

    const rM = coreRadius * 0.70;
    const stepsM = MAX_RNA_RUNGS;
    const helixRadius = coreRadius * 0.052;

    for (let i = 0; i <= stepsM; i++) {
      const u = i / stepsM;
      const t = u * Math.PI * 10;
      const phiAngle = u * Math.PI * 3;
      const radialMod = rM * (0.55 + 0.35 * Math.sin(phiAngle * 2.5));

      const center = new THREE.Vector3(
        radialMod * Math.sin(t) * Math.cos(phiAngle),
        radialMod * Math.cos(t),
        radialMod * Math.sin(t) * Math.sin(phiAngle)
      );

      const twistAngle = u * Math.PI * 40;
      const offset = new THREE.Vector3(
        Math.cos(twistAngle) * helixRadius,
        Math.sin(twistAngle) * helixRadius * 0.7,
        Math.sin(twistAngle) * helixRadius
      );

      const pA = center.clone().add(offset);
      const pB = center.clone().sub(offset);
      ptsA.push(pA);
      ptsB.push(pB);

      if (i < stepsM) {
        const diff = new THREE.Vector3().subVectors(pB, pA);
        const len = diff.length();
        const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
        dummy.position.copy(mid);
        dummy.quaternion.setFromUnitVectors(upVec, diff.normalize());
        dummy.scale.set(0.010, len * 0.90, 0.010);
        dummy.updateMatrix();
        rMats.push(dummy.matrix.clone());

        const bpSeed = i % 4;
        const rungCol = new THREE.Color(
          bpSeed === 0
            ? tokens.colors.pigments.verdigris
            : bpSeed === 1
            ? tokens.colors.pigments.ochre
            : bpSeed === 2
            ? tokens.colors.pigments.petrol
            : tokens.colors.pigments.terracotta
        );
        rCols.push(rungCol);
      }
    }

    const curveA = new THREE.CatmullRomCurve3(ptsA);
    const curveB = new THREE.CatmullRomCurve3(ptsB);
    const tubeA = new THREE.TubeGeometry(curveA, 120, coreRadius * 0.018, 8, false);
    const tubeB = new THREE.TubeGeometry(curveB, 120, coreRadius * 0.018, 8, false);

    const sgrnaPts: THREE.Vector3[] = [];
    const loopSteps = 70;
    const rLoop = coreRadius * 0.44;
    for (let k = 0; k <= loopSteps; k++) {
      const v = (k / loopSteps) * Math.PI * 2;
      sgrnaPts.push(
        new THREE.Vector3(
          rLoop * Math.cos(v) * (0.8 + 0.2 * Math.cos(v * 3)),
          rLoop * Math.sin(v * 2) * 0.35,
          rLoop * Math.sin(v) * 0.75
        )
      );
    }
    const curveS = new THREE.CatmullRomCurve3(sgrnaPts, true);
    const tubeS = new THREE.TubeGeometry(curveS, 90, coreRadius * 0.025, 8, true);

    return {
      mrnaStrandAGeo: tubeA,
      mrnaStrandBGeo: tubeB,
      sgrnaGeo: tubeS,
      rungMatrices: rMats,
      rungColors: rCols,
    };
  }, [coreRadius]);

  useEffect(() => {
    return () => {
      mrnaStrandAGeo.dispose();
      mrnaStrandBGeo.dispose();
      sgrnaGeo.dispose();
    };
  }, [mrnaStrandAGeo, mrnaStrandBGeo, sgrnaGeo]);

  // Inverted-Micelle (H_II phase) Ionizable Lipid + Aqueous Nanopores
  const { micelleMatrices, micelleColors } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mMats: THREE.Matrix4[] = [];
    const mCols: THREE.Color[] = [];
    const goldenPhi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < MAX_MICELLES; i++) {
      const y = 1 - (i / (MAX_MICELLES - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenPhi * i;
      const norm = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);

      if (isPointCut(norm.x, norm.y, norm.z, cutawayMode) && i % 2 === 0) continue;

      const shellLayer = 0.28 + 0.65 * ((i % 8) / 8);
      const pos = norm.multiplyScalar(coreRadius * shellLayer);
      dummy.position.copy(pos);
      const micelleScale = coreRadius * (0.032 + (i % 3) * 0.010);
      dummy.scale.setScalar(micelleScale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mMats.push(dummy.matrix.clone());

      const isAqueousPore = i % 4 === 0;
      mCols.push(
        new THREE.Color(
          isAqueousPore
            ? liveProtonation > 0.65
              ? tokens.colors.status.success
              : tokens.colors.accent
            : '#2c251d'
        )
      );
    }

    return {
      micelleMatrices: mMats,
      micelleColors: mCols,
    };
  }, [coreRadius, cutawayMode, liveProtonation]);

  // Upload InstancedMesh buffers
  useLayoutEffect(() => {
    if (headsMeshRef.current) {
      headsMeshRef.current.count = headMatrices.length;
      headMatrices.forEach((mat, i) => {
        headsMeshRef.current!.setMatrixAt(i, mat);
        headsMeshRef.current!.setColorAt(i, headColors[i]);
      });
      headsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (headsMeshRef.current.instanceColor) {
        headsMeshRef.current.instanceColor.needsUpdate = true;
      }
      headsMeshRef.current.computeBoundingSphere();
    }

    if (tailsMeshRef.current) {
      tailsMeshRef.current.count = tailMatrices.length;
      tailMatrices.forEach((mat, i) => {
        tailsMeshRef.current!.setMatrixAt(i, mat);
        tailsMeshRef.current!.setColorAt(i, tailColors[i]);
      });
      tailsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (tailsMeshRef.current.instanceColor) {
        tailsMeshRef.current.instanceColor.needsUpdate = true;
      }
      tailsMeshRef.current.computeBoundingSphere();
    }

    if (pegMeshRef.current) {
      pegMeshRef.current.count = pegBaseData.length;
      if (pegBaseData.length > 0) {
        for (let i = 0; i < pegBaseData.length; i++) {
          const b = pegBaseData[i];
          pegDummy.position.copy(b.normal);
          pegDummy.scale.setScalar(b.scale);
          pegDummy.updateMatrix();
          pegMeshRef.current.setMatrixAt(i, pegDummy.matrix);
        }
        pegMeshRef.current.instanceMatrix.needsUpdate = true;
        pegMeshRef.current.computeBoundingSphere();
      }
    }

    if (micellesMeshRef.current) {
      micellesMeshRef.current.count = micelleMatrices.length;
      micelleMatrices.forEach((mat, i) => {
        micellesMeshRef.current!.setMatrixAt(i, mat);
        micellesMeshRef.current!.setColorAt(i, micelleColors[i]);
      });
      micellesMeshRef.current.instanceMatrix.needsUpdate = true;
      if (micellesMeshRef.current.instanceColor) {
        micellesMeshRef.current.instanceColor.needsUpdate = true;
      }
      micellesMeshRef.current.computeBoundingSphere();
    }

    if (rungsMeshRef.current) {
      rungsMeshRef.current.count = rungMatrices.length;
      rungMatrices.forEach((mat, i) => {
        rungsMeshRef.current!.setMatrixAt(i, mat);
        rungsMeshRef.current!.setColorAt(i, rungColors[i]);
      });
      rungsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (rungsMeshRef.current.instanceColor) {
        rungsMeshRef.current.instanceColor.needsUpdate = true;
      }
      rungsMeshRef.current.computeBoundingSphere();
    }
  }, [
    headMatrices,
    headColors,
    tailMatrices,
    tailColors,
    pegBaseData.length,
    micelleMatrices,
    micelleColors,
    rungMatrices,
    rungColors,
  ]);

  // Real-time Brownian PEG polymer dynamics
  const pegDummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.18;
    }

    if (pegMeshRef.current && visibility.peg && cutawayMode !== 'core' && pegBaseData.length > 0) {
      const time = state.clock.elapsedTime;
      const isBrush = formulation.pegLipid >= 2.2;
      const wiggleAmp = isBrush ? 0.030 : 0.058;

      for (let i = 0; i < pegBaseData.length; i++) {
        const b = pegBaseData[i];
        const phase = time * 2.2 + b.chainIdx * 0.35 + b.t * 5.0;
        const mag = b.t * wiggleAmp;

        pegDummy.position
          .copy(b.normal)
          .addScaledVector(b.tangent, Math.sin(phase) * mag)
          .addScaledVector(b.bitangent, Math.cos(phase * 0.85) * mag);
        pegDummy.scale.setScalar(b.scale);
        pegDummy.updateMatrix();
        pegMeshRef.current.setMatrixAt(i, pegDummy.matrix);
      }
      pegMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const electronDensityTex = useMemo(
    () => createElectronDensityTexture(liveProtonation, opticalMode, saxsSpacing),
    [liveProtonation, opticalMode, saxsSpacing]
  );

  useEffect(() => {
    return () => {
      electronDensityTex.dispose();
    };
  }, [electronDensityTex]);

  const coreStatusColor =
    biophysics.endosomalEscapeEfficiency >= 75
      ? tokens.colors.status.success
      : biophysics.endosomalEscapeEfficiency >= 55
      ? tokens.colors.status.warning
      : tokens.colors.status.danger;

  const getLayerOpacity = (layer: InspectedLayer) => {
    if (inspectedLayer === 'all' || inspectedLayer === layer) return 1.0;
    return 0.18;
  };

  const showOuterShell = cutawayMode !== 'core';

  return (
    <group ref={groupRef}>
      {/* Internal Cutaway Cavity Point Light */}
      {(cutawayMode === 'quarter' || cutawayMode === 'half' || cutawayMode === 'core') && (
        <pointLight
          position={[coreRadius * 0.42, coreRadius * 0.38, coreRadius * 0.48]}
          intensity={opticalMode === 'cryo' ? 0.75 : 1.25}
          color={opticalMode === 'cryo' ? '#c8d4dc' : '#f5e8d0'}
          distance={coreRadius * 3.5}
        />
      )}

      {/* 1–4. Core RNP, Base-Paired mRNA/sgRNA Helices & Inverted Micelles */}
      {visibility.mrna && (
        <group {...bindLayerEvents('mrna')}>
          {/* Vitrified Cryo-Aqueous Core Envelope Matrix */}
          <mesh>
            <sphereGeometry
              args={
                cutawayMode === 'quarter'
                  ? [coreRadius * 0.98, 48, 48, Math.PI, Math.PI * 1.5]
                  : cutawayMode === 'half'
                  ? [coreRadius * 0.98, 48, 48, Math.PI, Math.PI]
                  : [coreRadius * 0.98, 48, 48]
              }
            />
            <meshPhysicalMaterial
              color={opticalMode === 'cryo' ? '#1c1915' : '#14120f'}
              transparent
              opacity={0.28 * getLayerOpacity('mrna')}
              transmission={opticalMode === 'pbr' ? 0.78 : 0.35}
              ior={1.34}
              thickness={0.45}
              roughness={0.18}
              metalness={0.02}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Cas9 REC Lobe */}
          <mesh position={[0.06 * coreRadius, 0.12 * coreRadius, 0.08 * coreRadius]} rotation={[0.3, 0.4, 0.2]}>
            <capsuleGeometry args={[coreRadius * 0.13, coreRadius * 0.20, 12, 16]} />
            <meshPhysicalMaterial
              color={tokens.colors.pigments.mauve}
              roughness={0.32}
              clearcoat={0.45}
              transparent
              opacity={0.88 * getLayerOpacity('mrna')}
              emissive={new THREE.Color(tokens.colors.pigments.mauve)}
              emissiveIntensity={inspectedLayer === 'mrna' ? 0.35 : 0.05}
            />
          </mesh>

          {/* Cas9 NUC Lobe */}
          <mesh position={[-0.10 * coreRadius, -0.07 * coreRadius, 0.10 * coreRadius]} rotation={[-0.2, -0.3, 0.4]}>
            <capsuleGeometry args={[coreRadius * 0.12, coreRadius * 0.18, 12, 16]} />
            <meshPhysicalMaterial
              color={coreStatusColor}
              roughness={0.30}
              clearcoat={0.50}
              transparent
              opacity={0.90 * getLayerOpacity('mrna')}
              emissive={new THREE.Color(coreStatusColor)}
              emissiveIntensity={inspectedLayer === 'mrna' ? 0.40 : 0.08}
            />
          </mesh>

          {/* TadA* Deaminase Domain */}
          <mesh position={[0.22 * coreRadius, -0.02 * coreRadius, 0.14 * coreRadius]}>
            <sphereGeometry args={[coreRadius * 0.11, 20, 20]} />
            <meshPhysicalMaterial
              color={tokens.colors.pigments.ochre}
              roughness={0.34}
              clearcoat={0.55}
              transparent
              opacity={0.88 * getLayerOpacity('mrna')}
              emissive={new THREE.Color(tokens.colors.pigments.ochre)}
              emissiveIntensity={inspectedLayer === 'mrna' ? 0.35 : 0.06}
            />
          </mesh>

          {/* mRNA / sgRNA Helices */}
          <mesh geometry={mrnaStrandAGeo}>
            <meshStandardMaterial
              color={coreStatusColor}
              roughness={0.35}
              metalness={0.15}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
              emissive={new THREE.Color(coreStatusColor)}
              emissiveIntensity={inspectedLayer === 'mrna' ? 0.30 : 0.04}
            />
          </mesh>
          <mesh geometry={mrnaStrandBGeo}>
            <meshStandardMaterial
              color={tokens.colors.status.warning}
              roughness={0.38}
              metalness={0.12}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
            />
          </mesh>
          <mesh geometry={sgrnaGeo}>
            <meshStandardMaterial
              color={tokens.colors.pigments.terracotta}
              roughness={0.40}
              metalness={0.12}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
            />
          </mesh>
          <instancedMesh
            ref={rungsMeshRef}
            args={[undefined, undefined, MAX_RNA_RUNGS]}
          >
            <cylinderGeometry args={[1, 1, 1, 8]} />
            <meshStandardMaterial
              roughness={0.45}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
            />
          </instancedMesh>

          {/* Inverted Micelles */}
          <instancedMesh
            ref={micellesMeshRef}
            args={[undefined, undefined, MAX_MICELLES]}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial
              roughness={0.50}
              transparent={inspectedLayer !== 'all'}
              opacity={0.88 * getLayerOpacity('mrna')}
            />
          </instancedMesh>
        </group>
      )}

      {/* 5. Hydrophobic Acyl Tails */}
      {showOuterShell && visibility.tails && (
        <instancedMesh
          ref={tailsMeshRef}
          args={[undefined, undefined, MAX_ACYL_TAILS]}
          {...bindLayerEvents('tails')}
        >
          <cylinderGeometry args={[1, 0.88, 1, 8]} />
          <meshStandardMaterial
            roughness={0.65}
            transparent={inspectedLayer !== 'all'}
            opacity={getLayerOpacity('tails')}
          />
        </instancedMesh>
      )}

      {/* 6. Polar Lipid Headgroups */}
      {showOuterShell && visibility.lipids && (
        <instancedMesh
          ref={headsMeshRef}
          args={[undefined, undefined, MAX_LIPID_HEADS]}
          {...bindLayerEvents('lipids')}
        >
          <sphereGeometry args={[1, 14, 14]} />
          <meshPhysicalMaterial
            roughness={opticalMode === 'cryo' ? 0.60 : 0.26}
            metalness={0.08}
            clearcoat={opticalMode === 'pbr' ? 0.40 : 0.0}
            transparent={inspectedLayer !== 'all'}
            opacity={getLayerOpacity('lipids')}
          />
        </instancedMesh>
      )}

      {/* 7. PEG2000 Polymer Brush Corona */}
      {showOuterShell && visibility.peg && (
        <instancedMesh
          ref={pegMeshRef}
          args={[undefined, undefined, MAX_PEG_BEADS]}
          {...bindLayerEvents('peg')}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshPhysicalMaterial
            color={tokens.colors.pigments.petrol}
            roughness={0.20}
            transmission={0.40}
            transparent
            opacity={0.88 * getLayerOpacity('peg')}
            emissive={new THREE.Color(tokens.colors.pigments.petrol)}
            emissiveIntensity={inspectedLayer === 'peg' ? 0.45 : 0.08}
          />
        </instancedMesh>
      )}

      {/* 8. ApoE Opsonins */}
      {showOuterShell && visibility.apoe && (
        <group {...bindLayerEvents('apoe')}>
          {apoeClusters.map((apoe, idx) => (
            <group
              key={`apoe-${idx}`}
              position={apoe.pos.toArray()}
              quaternion={apoe.quat}
            >
              {[
                [-0.024, 0, -0.013],
                [0.024, 0, -0.013],
                [-0.019, 0.01, 0.019],
                [0.019, 0.01, 0.019],
              ].map((offset, hIdx) => (
                <mesh
                  key={hIdx}
                  position={offset as [number, number, number]}
                  rotation={[0.15, 0, hIdx % 2 === 0 ? 0.12 : -0.12]}
                >
                  <capsuleGeometry args={[0.019, 0.075, 8, 12]} />
                  <meshPhysicalMaterial
                    color={tokens.colors.pigments.mauve}
                    roughness={0.32}
                    clearcoat={0.45}
                    transparent={inspectedLayer !== 'all'}
                    opacity={getLayerOpacity('apoe')}
                    emissive={new THREE.Color(tokens.colors.pigments.mauve)}
                    emissiveIntensity={inspectedLayer === 'apoe' ? 0.45 : 0.06}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* 9. Precision Cross-Section Caps */}
      {cutawayMode === 'half' && (
        <mesh position={[0, 0, 0]} raycast={() => null}>
          <circleGeometry args={[radius * 0.995, 64]} />
          <meshStandardMaterial
            map={electronDensityTex}
            roughness={0.35}
            metalness={0.06}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {cutawayMode === 'quarter' && (
        <group>
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} raycast={() => null}>
            <circleGeometry args={[radius * 0.995, 64, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial
              map={electronDensityTex}
              roughness={0.35}
              metalness={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]} raycast={() => null}>
            <circleGeometry args={[radius * 0.995, 64, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial
              map={electronDensityTex}
              roughness={0.35}
              metalness={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export const NanoViewport3D: React.FC<Props> = ({ formulation, biophysics }) => {
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [cutawayMode, setCutawayMode] = useState<CutawayMode>('quarter');
  const [opticalMode, setOpticalMode] = useState<OpticalMode>('pbr');
  const [ambientPh, setAmbientPh] = useState<number>(7.4);
  const [hoveredLayer, setHoveredLayer] = useState<InspectedLayer | null>(null);
  const [pinnedLayer, setPinnedLayer] = useState<InspectedLayer>('all');
  const [snapshotSaved, setSnapshotSaved] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<LayerVisibility>({
    peg: true,
    lipids: true,
    tails: true,
    mrna: true,
    apoe: true,
  });
  const [viewportSize, setViewportSize] = useState<ViewportSize>('standard');

  const controlsRef = useRef<any>(null);
  const captureFnRef = useRef<(() => string | null) | null>(null);

  const inspectedLayer: InspectedLayer =
    pinnedLayer !== 'all' ? pinnedLayer : hoveredLayer ?? 'all';

  useEffect(() => {
    document.body.style.cursor = hoveredLayer ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hoveredLayer]);

  // Fullscreen Escape key listener and body scroll lock
  useEffect(() => {
    if (viewportSize === 'fullscreen') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setViewportSize('standard');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [viewportSize]);

  const targetCameraZ = useMemo(() => {
    return 4.45 + Math.max(0, (biophysics.diameterNm - 50) / 130) * 1.65;
  }, [biophysics.diameterNm]);

  const resetCamera = () => {
    if (controlsRef.current) {
      if (controlsRef.current.object) {
        controlsRef.current.object.position.set(0, 0, targetCameraZ);
      }
      if (controlsRef.current.target) {
        controlsRef.current.target.set(0, 0, 0);
      }
      controlsRef.current.update();
    }
    setAmbientPh(7.4);
    setCutawayMode('quarter');
    setPinnedLayer('all');
    setHoveredLayer(null);
  };

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleSelectMeshLayer = useCallback((layer: InspectedLayer) => {
    setPinnedLayer((prev) => (prev === layer ? 'all' : layer));
  }, []);

  const handleExportPngSnapshot = () => {
    if (!captureFnRef.current) return;
    const dataUrl = captureFnRef.current();
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nanocrispr_lnp_${opticalMode}_pH${ambientPh.toFixed(1)}_${biophysics.diameterNm}nm.png`;
    a.click();

    setSnapshotSaved(true);
    setTimeout(() => setSnapshotSaved(false), 1800);
  };

  const effectiveCholesterol = Math.max(
    0,
    100 - formulation.ionizableLipid - formulation.dspcHelper - formulation.pegLipid
  );

  const advancedMetrics = useMemo(
    () => calculateAmbientLnpTelemetry(formulation, biophysics, ambientPh),
    [formulation, biophysics, ambientPh]
  );

  const scaleBarPx = useMemo(() => {
    return Math.round(Math.max(28, Math.min(68, (20 / biophysics.diameterNm) * 175)));
  }, [biophysics.diameterNm]);

  const getHudDescription = () => {
    switch (inspectedLayer) {
      case 'peg':
        return {
          title: `PEG2000 Hydrated Polymer Corona (${formulation.pegLipid.toFixed(1)} mol% • RF/D = ${advancedMetrics.deGennesRatio})`,
          detail: `De Gennes ${advancedMetrics.deGennesRatio >= 1.0 ? 'Dense Brush (RF/D > 1.0)' : 'Mushroom Regime'} (Grafting D = ${advancedMetrics.graftingDistanceNm} nm). Diffusivity D0 = ${advancedMetrics.stokesDiffusivity} µm²/s. Provides steric stealth against MPS/RES clearance.`,
          badge: `σ = ${(1 / (parseFloat(advancedMetrics.graftingDistanceNm) ** 2)).toFixed(3)} ch/nm²`,
        };
      case 'lipids':
        return {
          title: `Monolayer Shell: Ionizable (${formulation.ionizableLipid.toFixed(1)}%) • DSPC (${formulation.dspcHelper.toFixed(1)}%) • Chol (${effectiveCholesterol.toFixed(1)}%)`,
          detail: `Henderson-Hasselbalch at pH ${ambientPh.toFixed(1)}: ${advancedMetrics.liveIonizationPct}% protonated • Packing CPP = ${advancedMetrics.cpp} (${advancedMetrics.phaseState}).`,
          badge: `pKa = ${formulation.lipidPka.toFixed(2)}`,
        };
      case 'tails':
        return {
          title: `Dual-Chain (sn-1/sn-2) Hydrophobic Acyl Matrix (~3.2 nm • CPP = ${advancedMetrics.cpp})`,
          detail: `Branched alkyl & stearoyl chains splay from lamellar bilayer (pH 7.4) to inverted hexagonal HII cone (pH 5.5) to lyse endosomal membranes.`,
          badge: `Splay: ${advancedMetrics.phaseState.includes('Hexagonal') ? 'Cone (HII)' : 'Cylinder (Lα)'}`,
        };
      case 'mrna':
        return {
          title: `Catalytic Cas9/ABE8e RNP + Base-Paired mRNA Core (SAXS d ≈ ${advancedMetrics.saxsSpacing} nm)`,
          detail: `Antiparallel mRNA/sgRNA superhelices with bilobed Cas9 enzyme complexed by protonatable tertiary amines at N/P = ${formulation.npRatio.toFixed(1)}.`,
          badge: `N/P = ${formulation.npRatio.toFixed(1)}:1`,
        };
      case 'apoe':
        return {
          title: `Apolipoprotein E (ApoE) 4-Helix Bundle Opsonins (Score: ${biophysics.cellularUptakeScore}/100)`,
          detail: `Amphipathic alpha-helices adsorb to exposed DSPC/cholesterol patches to facilitate hepatic LDLR-mediated endocytosis.`,
          badge: `${Math.round(biophysics.cellularUptakeScore / 9)} Bundles Bound`,
        };
      default:
        return {
          title: `Lipid Nanoparticle Cutaway (Dh = ${biophysics.diameterNm} nm • ${advancedMetrics.phaseState})`,
          detail: `Hover or click any 3D structure to isolate • Ambient pH ${ambientPh.toFixed(1)} (${advancedMetrics.liveIonizationPct}% ionized) • Bragg repeat d = ${advancedMetrics.saxsSpacing} nm.`,
          badge: `SAXS d = ${advancedMetrics.saxsSpacing} nm`,
        };
    }
  };

  const hud = getHudDescription();

  // Layer metadata for the interactive inspection rack
  const layerButtons: {
    id: keyof LayerVisibility;
    label: string;
    sublabel: string;
    dotColor: string;
    ringColor: string;
  }[] = [
    {
      id: 'peg',
      label: 'PEG Corona',
      sublabel: `${formulation.pegLipid.toFixed(1)}%`,
      dotColor: tokens.colors.pigments.petrol,
      ringColor: '#528796',
    },
    {
      id: 'lipids',
      label: 'Polar Heads',
      sublabel: '2.4k',
      dotColor: tokens.colors.pigments.ochre,
      ringColor: '#cfa052',
    },
    {
      id: 'tails',
      label: 'Acyl Tails',
      sublabel: '4.8k',
      dotColor: '#8a7458',
      ringColor: '#8a7458',
    },
    {
      id: 'mrna',
      label: 'Cas9 + mRNA',
      sublabel: 'RNP',
      dotColor: tokens.colors.status.success,
      ringColor: '#5e946c',
    },
    {
      id: 'apoe',
      label: 'ApoE Opsonins',
      sublabel: `${biophysics.cellularUptakeScore}`,
      dotColor: tokens.colors.pigments.mauve,
      ringColor: '#9e6778',
    },
  ];

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surfaceSubtle,
        borderColor: tokens.colors.border,
        borderRadius: tokens.radius,
      }}
      className={
        viewportSize === 'fullscreen'
          ? 'fixed inset-0 z-50 bg-[#12110f]/98 p-3 flex flex-col justify-between select-none overflow-hidden shadow-2xl'
          : `relative w-full ${
              viewportSize === 'expanded' ? 'min-h-[720px] h-[780px]' : 'min-h-[580px] h-[640px]'
            } overflow-hidden border flex flex-col justify-between select-none transition-all duration-200`
      }
    >
      {/* 1. TOP HEADER BAR: Title + Live Readout + Quick Actions */}
      <div className="relative z-10 px-3 py-1.5 flex items-center justify-between border-b border-[#332e27] bg-[#181613]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#a69b8d] tracking-wide">Nanoparticle structural cutaway</span>
          <div
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 border font-mono text-[10px] text-[#e8dfd1] font-semibold flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#5e946c] animate-pulse" />
            <span>Dh: {biophysics.diameterNm} nm</span>
          </div>
          <span className="text-[9px] font-mono text-[#70675c] hidden md:inline">
            PDI {biophysics.pdi.toFixed(2)} · ζ {biophysics.zetaPotentialMv > 0 ? `+${biophysics.zetaPotentialMv}` : biophysics.zetaPotentialMv} mV
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Orbit / Pause */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              backgroundColor: autoRotate ? tokens.colors.surfaceSelected : tokens.colors.surfaceRaised,
              borderColor: autoRotate ? '#4d828f' : tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 text-[10px] text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer flex items-center gap-1"
            title={autoRotate ? 'Pause 3D rotation' : 'Start smooth orbit rotation'}
          >
            {autoRotate ? <Pause className="w-2.5 h-2.5 text-[#e0ad5a]" /> : <Play className="w-2.5 h-2.5 text-[#5e946c]" />}
            <span>{autoRotate ? 'Pause' : 'Orbit'}</span>
          </button>
          {/* Reset */}
          <button
            onClick={resetCamera}
            style={{ backgroundColor: tokens.colors.surfaceRaised, borderColor: tokens.colors.border, borderRadius: tokens.radius }}
            className="px-2 py-0.5 text-[10px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer flex items-center gap-1"
            title="Reset camera and viewport parameters"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
          {/* PNG Snapshot */}
          <button
            onClick={handleExportPngSnapshot}
            style={{
              backgroundColor: snapshotSaved ? tokens.colors.status.successSubtle : tokens.colors.surfaceRaised,
              borderColor: snapshotSaved ? tokens.colors.status.success : tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 text-[10px] text-[#e8dfd1] hover:bg-[#2a2621] border transition cursor-pointer flex items-center gap-1 font-medium"
            title="Export high-resolution 1080p publication PNG of the 3D cutaway"
          >
            {snapshotSaved ? <Check className="w-3 h-3 text-[#5e946c]" /> : <Camera className="w-3 h-3 text-[#4d828f]" />}
            <span>{snapshotSaved ? 'Saved!' : 'PNG'}</span>
          </button>
          {/* Viewport Size */}
          <div className="flex items-center gap-0.5 border-l border-[#332e27] pl-1.5">
            <button
              onClick={() => setViewportSize((prev) => (prev === 'expanded' ? 'standard' : 'expanded'))}
              style={{
                backgroundColor: viewportSize === 'expanded' ? tokens.colors.surfaceSelected : tokens.colors.surfaceRaised,
                borderColor: viewportSize === 'expanded' ? '#4d828f' : tokens.colors.border,
                borderRadius: tokens.radius,
              }}
              className={`p-1 text-[10px] border transition cursor-pointer flex items-center ${viewportSize === 'expanded' ? 'text-[#e8dfd1]' : 'text-[#a69b8d] hover:text-[#e8dfd1] hover:bg-[#2a2621]'}`}
              title={viewportSize === 'expanded' ? 'Standard height (640px)' : 'Expand height (780px)'}
            >
              {viewportSize === 'expanded' ? <Shrink className="w-3 h-3 text-[#4d828f]" /> : <Expand className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setViewportSize((prev) => (prev === 'fullscreen' ? 'standard' : 'fullscreen'))}
              style={{
                backgroundColor: viewportSize === 'fullscreen' ? tokens.colors.surfaceSelected : tokens.colors.surfaceRaised,
                borderColor: viewportSize === 'fullscreen' ? '#5e946c' : tokens.colors.border,
                borderRadius: tokens.radius,
              }}
              className={`p-1 text-[10px] border transition cursor-pointer flex items-center ${viewportSize === 'fullscreen' ? 'text-[#73a880] ring-1 ring-[#5e946c]/50' : 'text-[#a69b8d] hover:text-[#e8dfd1] hover:bg-[#2a2621]'}`}
              title={viewportSize === 'fullscreen' ? 'Exit Fullscreen (Esc)' : 'Fullscreen Theater View'}
            >
              {viewportSize === 'fullscreen' ? <Minimize2 className="w-3 h-3 text-[#5e946c]" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. CONTROL STRIP: Cutaway · Shader · View · pH — grouped with labeled sections */}
      <div className="relative z-10 px-3 py-1.5 flex items-center gap-4 border-b border-[#24201b] bg-[#151310]/90 backdrop-blur-xs text-[10px] overflow-x-auto">
        {/* ── CUTAWAY GROUP ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[#54493b] text-[8px] uppercase tracking-widest font-bold mr-0.5">Cut</span>
          <div
            style={{ borderColor: tokens.colors.border, borderRadius: tokens.radius }}
            className="flex items-center border overflow-hidden bg-[#181613] p-0.5"
          >
            {([
              { id: 'quarter', label: '90°', icon: Scissors },
              { id: 'half', label: '180°', icon: CircleDot },
              { id: 'full', label: 'Surface', icon: Globe },
              { id: 'core', label: 'Core', icon: Crosshair },
            ] as const).map((mode) => {
              const IconComponent = mode.icon;
              const isActive = cutawayMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setCutawayMode(mode.id)}
                  style={{
                    backgroundColor: isActive ? tokens.colors.surfaceSelected : 'transparent',
                    color: isActive ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                  }}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[2px] transition cursor-pointer flex items-center gap-1 ${isActive ? 'border border-[#4d828f]/60 font-semibold shadow-xs' : 'hover:text-[#e8dfd1]'}`}
                  title={`Switch cutaway geometry: ${mode.label}`}
                >
                  <IconComponent className="w-2.5 h-2.5 text-[#4d828f]" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-[#2b2620] shrink-0" />

        {/* ── SHADER GROUP ── */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span className="text-[#54493b] text-[8px] uppercase tracking-widest font-bold mr-0.5">Shader</span>
          <div
            style={{ borderColor: tokens.colors.border, borderRadius: tokens.radius }}
            className="flex items-center border overflow-hidden bg-[#181613] p-0.5"
          >
            {([
              { id: 'pbr', label: 'PBR', icon: Sparkles },
              { id: 'electrostatic', label: 'ζ-Charge', icon: Activity },
              { id: 'cryo', label: 'Cryo-EM', icon: CircleDot },
            ] as const).map((opt) => {
              const IconComp = opt.icon;
              const isActive = opticalMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setOpticalMode(opt.id)}
                  style={{
                    backgroundColor: isActive ? tokens.colors.surfaceSelected : 'transparent',
                    color: isActive ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                  }}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[2px] transition cursor-pointer flex items-center gap-1 ${isActive ? 'border border-[#cfa052]/60 font-semibold shadow-xs' : 'hover:text-[#e8dfd1]'}`}
                  title={`Switch rendering mode: ${opt.label}`}
                >
                  <IconComp className="w-2.5 h-2.5 text-[#cfa052]" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-4 bg-[#2b2620] shrink-0" />

        {/* ── pH GROUP ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[#54493b] text-[8px] uppercase tracking-widest font-bold">pH</span>
          <input
            type="range"
            min="5.0"
            max="7.4"
            step="0.1"
            value={ambientPh}
            onChange={(e) => setAmbientPh(parseFloat(e.target.value))}
            style={{ accentColor: tokens.colors.accent }}
            className="w-16 h-1 cursor-pointer"
          />
          <span
            className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-[2px] ${
              ambientPh <= 5.8
                ? 'bg-[#5e946c]/20 text-[#73a880] border border-[#5e946c]/40'
                : ambientPh <= 6.5
                ? 'bg-[#c98a3b]/20 text-[#df9e51] border border-[#c98a3b]/40'
                : 'bg-[#211e1a] text-[#e8dfd1] border border-[#332e27]'
            }`}
          >
            {ambientPh.toFixed(1)}
          </span>
        </div>
      </div>

      {/* 3. LAYER BAR: Visibility Toggles + Solo/Pinning */}
      <div className="relative z-10 px-3 py-1 flex items-center justify-between text-[10px] text-[#a69b8d] border-b border-[#24201b] bg-[#151310]/90 backdrop-blur-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[#54493b] text-[8px] uppercase tracking-widest font-bold mr-1">Layers</span>

          {layerButtons.map((layer) => {
            const isVisible = visibility[layer.id];
            const isIsolated = inspectedLayer === layer.id;
            const isPinned = pinnedLayer === layer.id;

            return (
              <div
                key={layer.id}
                style={{
                  borderColor: isPinned ? layer.ringColor : isIsolated ? '#4d828f' : '#2b2620',
                  backgroundColor: isPinned ? `${layer.ringColor}18` : isIsolated ? '#26221c' : '#1c1a16',
                }}
                className={`flex items-center rounded-[3px] border overflow-hidden transition-all shadow-xs ${isPinned ? 'ring-1' : ''}`}
              >
                {/* Visibility Eye Toggle */}
                <button
                  onClick={() => toggleLayer(layer.id)}
                  className={`px-1 py-0.5 hover:bg-[#2f2a23] transition cursor-pointer border-r border-[#2b2620] ${
                    isVisible ? 'text-[#a69b8d] hover:text-[#e8dfd1]' : 'text-[#54493b] hover:text-[#70675c]'
                  }`}
                  title={`${isVisible ? 'Hide' : 'Show'} ${layer.label}`}
                >
                  {isVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                </button>

                {/* Layer Focus / Solo Click Button */}
                <button
                  onClick={() => handleSelectMeshLayer(layer.id)}
                  onMouseEnter={() => setHoveredLayer(layer.id)}
                  onMouseLeave={() => setHoveredLayer(null)}
                  className={`px-1.5 py-0.5 flex items-center gap-1 hover:bg-[#2f2a23] transition cursor-pointer ${!isVisible ? 'opacity-40 line-through' : ''}`}
                  title={`Click to focus / pin ${layer.label} in 3D`}
                >
                  <span
                    style={{ backgroundColor: layer.dotColor }}
                    className={`w-1.5 h-1.5 rounded-full inline-block ${isPinned ? 'ring-2 ring-white/50' : ''}`}
                  />
                  <span className={`font-medium ${isPinned ? 'text-[#e8dfd1] font-semibold' : 'text-[#c7bcb0]'}`}>
                    {layer.label}
                  </span>
                  <span className="text-[8px] font-mono text-[#70675c] bg-[#12110f]/70 px-0.5 rounded">
                    {layer.sublabel}
                  </span>
                </button>
              </div>
            );
          })}

          {/* Pinned badge inline */}
          {pinnedLayer !== 'all' && (
            <button
              onClick={() => setPinnedLayer('all')}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#4d828f]/20 border border-[#4d828f]/60 text-[#98c2cc] hover:text-[#e8dfd1] hover:bg-[#4d828f]/30 cursor-pointer font-sans text-[9px] font-semibold transition ml-1"
              title="Click to unlock and show all layers together"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>PINNED: {pinnedLayer.toUpperCase()}</span>
              <span className="text-[#e27b6c] font-bold">✕</span>
            </button>
          )}
        </div>

        {/* N/P Ratio Badge */}
        <div className="text-[9px] font-mono text-[#70675c] shrink-0">
          N/P = <strong className="text-[#e8dfd1]">{formulation.npRatio.toFixed(1)}:1</strong>
        </div>
      </div>

      {/* 3. THREE.JS INSTANCED WEBGL VIEWPORT */}
      <div className="flex-1 w-full relative min-h-[380px]">
        <Canvas
          camera={{ position: [0, 0, targetCameraZ], fov: 40 }}
          dpr={[1, 2]}
          gl={{ localClippingEnabled: true, preserveDrawingBuffer: true }}
          onPointerMissed={() => setPinnedLayer('all')}
          onCreated={({ gl }) => {
            gl.localClippingEnabled = true;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.12;
          }}
        >
          {/* Studio Balanced 3-Point Lighting */}
          <ambientLight intensity={opticalMode === 'cryo' ? 0.60 : 0.85} />
          <directionalLight position={[5, 8, 5]} intensity={opticalMode === 'cryo' ? 0.95 : 1.35} color="#fffcf5" />
          <directionalLight position={[-6, 2, 4]} intensity={0.55} color="#8a9ba8" />
          <directionalLight position={[-3, -5, -6]} intensity={0.75} color="#7baab8" />

          <RendererConfig diameter={biophysics.diameterNm} captureRef={captureFnRef} />
          <InstancedNanoparticleScene
            formulation={formulation}
            biophysics={biophysics}
            autoRotate={autoRotate}
            cutawayMode={cutawayMode}
            opticalMode={opticalMode}
            ambientPh={ambientPh}
            liveProtonation={advancedMetrics.liveProtonationFraction}
            liveCpp={advancedMetrics.cpp}
            saxsSpacing={advancedMetrics.saxsSpacing}
            visibility={visibility}
            inspectedLayer={inspectedLayer}
            onHoverLayer={setHoveredLayer}
            onSelectLayer={handleSelectMeshLayer}
          />
          <OrbitControls ref={controlsRef} enableZoom={true} autoRotate={false} enableDamping dampingFactor={0.05} />
        </Canvas>

        {/* Calibrated Cryo-TEM Physical Scale Bar (Bottom-Left) */}
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none flex flex-col gap-0.5 text-[9px] font-mono text-[#a69b8d] bg-[#12110f]/80 px-2 py-1 rounded-[2px] border border-[#2b2620] backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <div
              style={{ width: `${scaleBarPx}px` }}
              className="h-[2px] bg-[#a69b8d] relative transition-all"
            >
              <span className="absolute left-0 -top-1 w-[1px] h-[4px] bg-[#a69b8d]" />
              <span className="absolute right-0 -top-1 w-[1px] h-[4px] bg-[#a69b8d]" />
            </div>
            <span>20 nm</span>
          </div>
          <span className="text-[8px] text-[#70675c]">
            Cryo-TEM calibrated • SAXS d = {advancedMetrics.saxsSpacing} nm
          </span>
        </div>

      </div>

      {/* 4. BOTTOM CONTEXTUAL BIOPHYSICAL HUD INSPECTOR */}
      <div className="relative z-10 px-3 py-1.5 border-t border-[#332e27] bg-[#181613]/95 text-[10px] text-[#a69b8d] truncate">
        <span className="font-medium text-[#e8dfd1]">{hud.title}</span>
      </div>
    </div>
  );
};
