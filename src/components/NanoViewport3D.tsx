// src/components/NanoViewport3D.tsx
import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { LnpBiophysicsResult, LnpFormulation } from '../engines/bioEngines';
import { tokens } from '../styles/tokens';

interface Props {
  formulation: LnpFormulation;
  biophysics: LnpBiophysicsResult;
}

export type CutawayMode = 'quarter' | 'half' | 'full' | 'core';
export type InspectedLayer = 'all' | 'peg' | 'lipids' | 'tails' | 'mrna' | 'apoe';
export type OpticalMode = 'pbr' | 'cryo' | 'electrostatic';

interface LayerVisibility {
  peg: boolean;
  lipids: boolean;
  tails: boolean;
  mrna: boolean;
  apoe: boolean;
}

// Fast spatial cutaway predicate for unit-sphere coordinates
function isPointCut(x: number, y: number, z: number, mode: CutawayMode): boolean {
  if (mode === 'full' || mode === 'core') return false;
  if (mode === 'half') {
    return z > 0.02;
  }
  if (mode === 'quarter') {
    return x > -0.02 && z > -0.02 && y > -0.82;
  }
  return false;
}

// Procedural SAXS / Cryo-EM electron-density cross-section texture
function createElectronDensityTexture(protonationFraction: number): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - center) / center;
      const dy = (y - center) / center;
      const r = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;

      if (r > 1.0) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
        continue;
      }

      // Concentric Bragg diffraction / inverted hexagonal H_II water-channel rings (d ~ 6.1 nm)
      const braggWave = Math.sin(r * Math.PI * 14.0) * 0.5 + 0.5;
      const hexModulation = Math.cos(Math.atan2(dy, dx) * 6.0) * 0.18 * protonationFraction;
      const shellPeak = r > 0.78 ? 0.95 : 0.35 + 0.45 * braggWave + hexModulation;

      const baseR = Math.round(28 + shellPeak * (45 + protonationFraction * 22));
      const baseG = Math.round(36 + shellPeak * (75 + protonationFraction * 35));
      const baseB = Math.round(44 + shellPeak * 88);

      data[idx] = Math.min(255, baseR);
      data[idx + 1] = Math.min(255, baseG);
      data[idx + 2] = Math.min(255, baseB);
      data[idx + 3] = r > 0.98 ? 0 : Math.round(165 * (0.45 + 0.55 * r));
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

function RendererConfig({ diameter }: { diameter: number }) {
  const { camera } = useThree();

  useEffect(() => {
    const targetZ = 4.15 + Math.max(0, (diameter - 50) / 130) * 1.55;
    camera.position.set(0, 0, targetZ);
    camera.updateProjectionMatrix();
  }, [camera, diameter]);

  return null;
}

interface SceneProps extends Props {
  autoRotate: boolean;
  cutawayMode: CutawayMode;
  opticalMode: OpticalMode;
  ambientPh: number;
  visibility: LayerVisibility;
  inspectedLayer: InspectedLayer;
}

function InstancedNanoparticleScene({
  formulation,
  biophysics,
  autoRotate,
  cutawayMode,
  opticalMode,
  ambientPh,
  visibility,
  inspectedLayer,
}: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  // InstancedMesh refs (Mission 1: <8 GPU draw calls total)
  const headsMeshRef = useRef<THREE.InstancedMesh>(null);
  const tailsMeshRef = useRef<THREE.InstancedMesh>(null);
  const pegMeshRef = useRef<THREE.InstancedMesh>(null);
  const micellesMeshRef = useRef<THREE.InstancedMesh>(null);
  const rungsMeshRef = useRef<THREE.InstancedMesh>(null);

  // Outer radius scaled to DLS hydrodynamic diameter
  const radius = useMemo(() => {
    return 1.45 + ((biophysics.diameterNm - 50) / 130) * 0.95;
  }, [biophysics.diameterNm]);

  const shellThickness = useMemo(() => radius * 0.21, [radius]);
  const coreRadius = useMemo(() => radius - shellThickness, [radius, shellThickness]);

  // Live Henderson-Hasselbalch ionization at user-selected ambient pH
  const liveProtonation = useMemo(() => {
    return 1 / (1 + Math.pow(10, ambientPh - formulation.lipidPka));
  }, [ambientPh, formulation.lipidPka]);

  // Israelachvili Critical Packing Parameter (CPP = v / (a0 * lc))
  // Neutral ionizable lipid ~ 1.15; protonated ionizable + anionic endosomal lipid pair -> ~1.65 (H_II cone)
  const liveCpp = useMemo(() => {
    return 1.08 + liveProtonation * 0.58;
  }, [liveProtonation]);

  // Derived stoichiometric molar fractions (Cholesterol balances to 100%)
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
    const lipidCount = 2400;
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

    // PEG brush physics: De Gennes mushroom (<2.2 mol%) vs dense brush (>=2.2 mol%)
    // Lower endosomal pH also induces partial DMG-PEG2000 desorption/shedding
    const pegSheddingFactor = ambientPh < 6.2 ? 0.68 : 1.0;
    const isBrush = formulation.pegLipid >= 2.2;
    const chainLength = (isBrush ? radius * 0.29 : radius * 0.15) * pegSheddingFactor;
    const beadsPerChain = isBrush ? 7 : 5;

    const targetApoECount = Math.max(1, Math.min(12, Math.round(biophysics.cellularUptakeScore / 9)));
    let apoeAssigned = 0;

    // Splay angle for dual sn-1 / sn-2 hydrophobic tails driven by CPP (H_II transition at pH 5.5)
    const splayAngle = 0.09 + (liveCpp - 1.08) * 0.28;

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
      let headScale = 0.028;
      let tailLen = shellThickness * 0.84;
      const col = new THREE.Color();

      if (seed < pegFrac * pegSheddingFactor) {
        type = 'peg';
        headScale = 0.032;
        col.set(tokens.colors.accent);
      } else if (seed < pegFrac + dspcFrac) {
        type = 'dspc';
        headScale = 0.030;
        col.set('#8ea4b4');
      } else if (seed < pegFrac + dspcFrac + cholFrac) {
        type = 'chol';
        headScale = 0.023;
        tailLen = shellThickness * 0.52; // Planar sterol ring sits deeper in hydrophobic matrix
        col.set('#50565e');
      } else {
        // Ionizable tertiary amine lipid: shifts color under electrostatic/pH protonation
        if (opticalMode === 'electrostatic') {
          col.lerpColors(new THREE.Color('#4a6984'), new THREE.Color('#439268'), liveProtonation);
        } else if (opticalMode === 'cryo') {
          col.set('#9aa4ae');
        } else {
          col.lerpColors(new THREE.Color('#627280'), new THREE.Color('#4c8567'), liveProtonation * 0.55);
        }
      }

      if (opticalMode === 'cryo' && type !== 'ionizable') {
        col.set(type === 'chol' ? '#586068' : '#adb8c2');
      }

      // Radial position of headgroup (cholesterol recessed slightly into acyl layer)
      const radialOffset = type === 'chol' ? radius - shellThickness * 0.18 : radius;
      dummyObj.position.copy(norm).multiplyScalar(radialOffset);
      dummyObj.scale.setScalar(headScale);
      dummyObj.rotation.set(0, 0, 0);
      dummyObj.updateMatrix();
      hMats.push(dummyObj.matrix.clone());
      hCols.push(col);

      // Build tangent basis for dual acyl chain splay & PEG coil
      const refAxis = Math.abs(norm.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const tangent = new THREE.Vector3().crossVectors(norm, refAxis).normalize();
      const bitangent = new THREE.Vector3().crossVectors(norm, tangent).normalize();

      // Dual-chain (sn-1 and sn-2) hydrophobic tails for phospholipids & ionizable lipids
      const baseQuat = new THREE.Quaternion().setFromUnitVectors(upVec, norm);
      const tailColor = new THREE.Color(
        opticalMode === 'cryo' ? '#495159' : type === 'chol' ? '#3f464e' : '#32383f'
      );

      if (type === 'chol') {
        // Single rigid sterol body
        const center = norm.clone().multiplyScalar(radialOffset - tailLen * 0.5);
        dummyObj.position.copy(center);
        dummyObj.quaternion.copy(baseQuat);
        dummyObj.scale.set(0.011, tailLen, 0.011);
        dummyObj.updateMatrix();
        tMats.push(dummyObj.matrix.clone());
        tCols.push(tailColor);
      } else {
        // Dual splayed acyl chains (sn-1 & sn-2)
        for (const dir of [-1, 1]) {
          const splayQuat = new THREE.Quaternion().setFromAxisAngle(tangent, dir * splayAngle);
          const finalQuat = baseQuat.clone().multiply(splayQuat);
          const lateralShift = bitangent.clone().multiplyScalar(dir * 0.011);
          const center = norm
            .clone()
            .multiplyScalar(radius - tailLen * 0.52)
            .add(lateralShift);

          dummyObj.position.copy(center);
          dummyObj.quaternion.copy(finalQuat);
          dummyObj.scale.set(0.0072, tailLen, 0.0072);
          dummyObj.updateMatrix();
          tMats.push(dummyObj.matrix.clone());
          tCols.push(tailColor);
        }
      }

      // Populate PEG2000 polymer brush segments (every 2nd PEG anchor for clean visual density)
      if (type === 'peg' && i % 2 === 0) {
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
            scale: 0.021 - t * 0.006,
          });
        }
      }

      // Surface ApoE3/ApoE4 lipoprotein four-helix bundle opsonins
      if (type === 'dspc' && apoeAssigned < targetApoECount && i % 165 === 0) {
        apoeList.push({
          pos: norm.clone().multiplyScalar(radius + 0.048),
          quat: baseQuat.clone(),
        });
        apoeAssigned++;
      }
    }

    return {
      headMatrices: hMats,
      headColors: hCols,
      tailMatrices: tMats,
      tailColors: tCols,
      pegBaseData: pegData,
      apoePositions: apoeList,
      apoeClusters: apoeList,
    };
  }, [
    radius,
    shellThickness,
    pegFrac,
    dspcFrac,
    cholFrac,
    cutawayMode,
    opticalMode,
    ambientPh,
    liveProtonation,
    liveCpp,
    biophysics.cellularUptakeScore,
    formulation.pegLipid,
  ]);

  // Mission 3: Double-stranded base-paired mRNA & sgRNA structures + Inverted H_II Micelles
  const {
    mrnaStrandAGeo,
    mrnaStrandBGeo,
    sgrnaGeo,
    rungMatrices,
    rungColors,
    micelleMatrices,
    micelleColors,
  } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const upVec = new THREE.Vector3(0, 1, 0);

    // 1. Primary Cas9/ABE8e mRNA duplex/secondary structure coil with base-pair rungs
    const ptsA: THREE.Vector3[] = [];
    const ptsB: THREE.Vector3[] = [];
    const rMats: THREE.Matrix4[] = [];
    const rCols: THREE.Color[] = [];

    const rM = coreRadius * 0.68;
    const stepsM = 180;
    const helixRadius = coreRadius * 0.048;

    for (let i = 0; i <= stepsM; i++) {
      const u = i / stepsM;
      const t = u * Math.PI * 10;
      const phi = u * Math.PI * 3;
      const radialMod = rM * (0.52 + 0.36 * Math.sin(phi * 2.5));

      const center = new THREE.Vector3(
        radialMod * Math.sin(t) * Math.cos(phi),
        radialMod * Math.cos(t),
        radialMod * Math.sin(t) * Math.sin(phi)
      );

      // Local helical twist vector
      const twistAngle = u * Math.PI * 38;
      const offset = new THREE.Vector3(
        Math.cos(twistAngle) * helixRadius,
        Math.sin(twistAngle) * helixRadius * 0.7,
        Math.sin(twistAngle) * helixRadius
      );

      const pA = center.clone().add(offset);
      const pB = center.clone().sub(offset);
      ptsA.push(pA);
      ptsB.push(pB);

      // Base-pair rung connecting the antiparallel strands
      if (i < stepsM) {
        const diff = new THREE.Vector3().subVectors(pB, pA);
        const len = diff.length();
        const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
        dummy.position.copy(mid);
        dummy.quaternion.setFromUnitVectors(upVec, diff.normalize());
        dummy.scale.set(0.008, len * 0.88, 0.008);
        dummy.updateMatrix();
        rMats.push(dummy.matrix.clone());

        // Color code purine/pyrimidine Watson-Crick pairs (G-C vs A-U)
        const isGC = i % 3 !== 0;
        rCols.push(new THREE.Color(isGC ? '#4b7f9f' : '#9e6e4e'));
      }
    }

    const curveA = new THREE.CatmullRomCurve3(ptsA, true);
    const curveB = new THREE.CatmullRomCurve3(ptsB, true);
    const tubeA = new THREE.TubeGeometry(curveA, 150, coreRadius * 0.022, 7, true);
    const tubeB = new THREE.TubeGeometry(curveB, 150, coreRadius * 0.018, 7, true);

    // 2. Secondary sgRNA Hairpin + Tetraloop Scaffold
    const sgrnaPts: THREE.Vector3[] = [];
    const rS = coreRadius * 0.46;
    const stepsS = 90;
    for (let i = 0; i <= stepsS; i++) {
      const t = (i / stepsS) * Math.PI * 6;
      const phi = (i / stepsS) * Math.PI * 2;
      const r = rS * (0.58 + 0.32 * Math.cos(phi * 3));
      sgrnaPts.push(
        new THREE.Vector3(
          r * Math.cos(t),
          r * Math.sin(t) * Math.sin(phi),
          r * Math.sin(t) * Math.cos(phi)
        )
      );
    }
    const curveS = new THREE.CatmullRomCurve3(sgrnaPts, true);
    const tubeS = new THREE.TubeGeometry(curveS, 85, coreRadius * 0.024, 6, true);

    // 3. Inverted-Micelle (H_II phase) Ionizable Lipid + Aqueous Pore Nanoclusters
    const mMats: THREE.Matrix4[] = [];
    const mCols: THREE.Color[] = [];
    const micelleCount = 420;
    const goldenPhi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < micelleCount; i++) {
      const y = 1 - (i / (micelleCount - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenPhi * i;
      const norm = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);

      if (isPointCut(norm.x, norm.y, norm.z, cutawayMode) && i % 2 === 0) continue;

      const shellLayer = 0.28 + 0.64 * ((i % 7) / 7);
      const pos = norm.multiplyScalar(coreRadius * shellLayer);
      dummy.position.copy(pos);
      const micelleScale = coreRadius * (0.028 + (i % 3) * 0.008);
      dummy.scale.setScalar(micelleScale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mMats.push(dummy.matrix.clone());

      const isAqueousPore = i % 4 === 0;
      mCols.push(
        new THREE.Color(
          isAqueousPore
            ? liveProtonation > 0.7
              ? '#3f6d8c'
              : '#2b3b47'
            : '#2c333a'
        )
      );
    }

    return {
      mrnaStrandAGeo: tubeA,
      mrnaStrandBGeo: tubeB,
      sgrnaGeo: tubeS,
      rungMatrices: rMats,
      rungColors: rCols,
      micelleMatrices: mMats,
      micelleColors: mCols,
    };
  }, [coreRadius, cutawayMode, liveProtonation]);

  // Upload static InstancedMesh matrices & color buffers to GPU
  useLayoutEffect(() => {
    if (headsMeshRef.current) {
      headMatrices.forEach((mat, i) => {
        headsMeshRef.current!.setMatrixAt(i, mat);
        headsMeshRef.current!.setColorAt(i, headColors[i]);
      });
      headsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (headsMeshRef.current.instanceColor) headsMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (tailsMeshRef.current) {
      tailMatrices.forEach((mat, i) => {
        tailsMeshRef.current!.setMatrixAt(i, mat);
        tailsMeshRef.current!.setColorAt(i, tailColors[i]);
      });
      tailsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (tailsMeshRef.current.instanceColor) tailsMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (micellesMeshRef.current) {
      micelleMatrices.forEach((mat, i) => {
        micellesMeshRef.current!.setMatrixAt(i, mat);
        micellesMeshRef.current!.setColorAt(i, micelleColors[i]);
      });
      micellesMeshRef.current.instanceMatrix.needsUpdate = true;
      if (micellesMeshRef.current.instanceColor)
        micellesMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (rungsMeshRef.current) {
      rungMatrices.forEach((mat, i) => {
        rungsMeshRef.current!.setMatrixAt(i, mat);
        rungsMeshRef.current!.setColorAt(i, rungColors[i]);
      });
      rungsMeshRef.current.instanceMatrix.needsUpdate = true;
      if (rungsMeshRef.current.instanceColor) rungsMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [
    headMatrices,
    headColors,
    tailMatrices,
    tailColors,
    micelleMatrices,
    micelleColors,
    rungMatrices,
    rungColors,
  ]);

  // Mission 4: Real-time Brownian PEG polymer brush dynamics in useFrame
  const pegDummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.2;
    }

    if (pegMeshRef.current && visibility.peg && cutawayMode !== 'core') {
      const time = state.clock.elapsedTime;
      const isBrush = formulation.pegLipid >= 2.2;
      const wiggleAmp = isBrush ? 0.028 : 0.056;

      for (let i = 0; i < pegBaseData.length; i++) {
        const b = pegBaseData[i];
        const phase = time * 2.4 + b.chainIdx * 0.37 + b.t * 5.2;
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

  // Electron-density cross-section texture for Mission 2 cut caps
  const electronDensityTex = useMemo(
    () => createElectronDensityTexture(liveProtonation),
    [liveProtonation]
  );

  const coreStatusColor =
    biophysics.endosomalEscapeEfficiency >= 75
      ? tokens.colors.status.success
      : biophysics.endosomalEscapeEfficiency >= 55
      ? tokens.colors.status.warning
      : tokens.colors.status.danger;

  const getLayerOpacity = (layer: InspectedLayer) => {
    if (inspectedLayer === 'all' || inspectedLayer === layer) return 1.0;
    return 0.25;
  };

  const showOuterShell = cutawayMode !== 'core';

  return (
    <group ref={groupRef}>
      {/* 1. Subsurface Scattering (SSS) Core Aqueous/Lipid Envelope (Mission 4) */}
      {visibility.mrna && (
        <mesh>
          <sphereGeometry args={[coreRadius * 0.98, 48, 48]} />
          <meshPhysicalMaterial
            color={opticalMode === 'cryo' ? '#22282e' : '#182026'}
            transparent
            opacity={0.44 * getLayerOpacity('mrna')}
            transmission={opticalMode === 'pbr' ? 0.45 : 0.15}
            ior={1.48}
            thickness={0.85}
            roughness={0.28}
            metalness={0.05}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 2. Bilobed Cas9 / ABE8e TadA* Ribonucleoprotein (RNP) Catalytic Core */}
      {visibility.mrna && (
        <group>
          {/* REC Recognition Lobe */}
          <mesh position={[0.14 * coreRadius, 0.06 * coreRadius, 0]}>
            <sphereGeometry args={[coreRadius * 0.22, 24, 24]} />
            <meshPhysicalMaterial
              color="#39556b"
              roughness={0.35}
              clearcoat={0.4}
              transparent
              opacity={0.82 * getLayerOpacity('mrna')}
            />
          </mesh>
          {/* NUC (HNH / RuvC / TadA* Deaminase) Catalytic Lobe */}
          <mesh position={[-0.12 * coreRadius, -0.05 * coreRadius, 0.08 * coreRadius]}>
            <sphereGeometry args={[coreRadius * 0.2, 24, 24]} />
            <meshPhysicalMaterial
              color={coreStatusColor}
              roughness={0.32}
              clearcoat={0.5}
              transparent
              opacity={0.85 * getLayerOpacity('mrna')}
            />
          </mesh>
        </group>
      )}

      {/* 3. Double-Stranded Base-Paired mRNA Helix & sgRNA Scaffold (Mission 3) */}
      {visibility.mrna && (
        <group>
          <mesh geometry={mrnaStrandAGeo}>
            <meshStandardMaterial
              color={coreStatusColor}
              roughness={0.38}
              metalness={0.12}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
            />
          </mesh>
          <mesh geometry={mrnaStrandBGeo}>
            <meshStandardMaterial
              color="#587b91"
              roughness={0.42}
              metalness={0.1}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
            />
          </mesh>
          <mesh geometry={sgrnaGeo}>
            <meshStandardMaterial
              color="#9e6e4e"
              roughness={0.45}
              metalness={0.1}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
            />
          </mesh>
          {/* Instanced Watson-Crick Base-Pair Rungs */}
          <instancedMesh
            ref={rungsMeshRef}
            args={[undefined, undefined, rungMatrices.length]}
          >
            <cylinderGeometry args={[1, 1, 1, 6]} />
            <meshStandardMaterial
              roughness={0.5}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
            />
          </instancedMesh>
        </group>
      )}

      {/* 4. Instanced Inverted-Micelle (H_II) Lipid & Aqueous Pore Clusters */}
      {visibility.mrna && (
        <instancedMesh
          ref={micellesMeshRef}
          args={[undefined, undefined, micelleMatrices.length]}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial
            roughness={0.55}
            transparent={inspectedLayer !== 'all'}
            opacity={0.85 * getLayerOpacity('mrna')}
          />
        </instancedMesh>
      )}

      {/* 5. Instanced Dual-Chain (sn-1 / sn-2) Hydrophobic Acyl Tails (Mission 1) */}
      {showOuterShell && visibility.tails && (
        <instancedMesh
          ref={tailsMeshRef}
          args={[undefined, undefined, tailMatrices.length]}
        >
          <cylinderGeometry args={[1, 0.85, 1, 6]} />
          <meshStandardMaterial
            roughness={0.68}
            transparent={inspectedLayer !== 'all'}
            opacity={getLayerOpacity('tails')}
          />
        </instancedMesh>
      )}

      {/* 6. Instanced Outer Monolayer Polar Lipid Headgroups (Mission 1 & 4) */}
      {showOuterShell && visibility.lipids && (
        <instancedMesh
          ref={headsMeshRef}
          args={[undefined, undefined, headMatrices.length]}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshPhysicalMaterial
            roughness={opticalMode === 'cryo' ? 0.65 : 0.28}
            metalness={0.06}
            clearcoat={opticalMode === 'pbr' ? 0.35 : 0.0}
            transparent={inspectedLayer !== 'all'}
            opacity={getLayerOpacity('lipids')}
          />
        </instancedMesh>
      )}

      {/* 7. Instanced Dynamic PEG2000 Polymer Brush Corona (Mission 1 & 4) */}
      {showOuterShell && visibility.peg && pegBaseData.length > 0 && (
        <instancedMesh
          ref={pegMeshRef}
          args={[undefined, undefined, pegBaseData.length]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshPhysicalMaterial
            color={tokens.colors.accent}
            roughness={0.25}
            transmission={0.3}
            transparent
            opacity={0.86 * getLayerOpacity('peg')}
          />
        </instancedMesh>
      )}

      {/* 8. Four-Helix Bundle Apolipoprotein E (ApoE) Opsonins */}
      {showOuterShell && visibility.apoe && (
        <group>
          {apoeClusters.map((apoe, idx) => (
            <group
              key={`apoe-${idx}`}
              position={apoe.pos.toArray()}
              quaternion={apoe.quat}
            >
              {[
                [-0.022, 0, -0.012],
                [0.022, 0, -0.012],
                [-0.018, 0.01, 0.018],
                [0.018, 0.01, 0.018],
              ].map((offset, hIdx) => (
                <mesh
                  key={hIdx}
                  position={offset as [number, number, number]}
                  rotation={[0.15, 0, hIdx % 2 === 0 ? 0.12 : -0.12]}
                >
                  <capsuleGeometry args={[0.018, 0.065, 6, 10]} />
                  <meshPhysicalMaterial
                    color="#4f7285"
                    roughness={0.35}
                    clearcoat={0.3}
                    transparent={inspectedLayer !== 'all'}
                    opacity={getLayerOpacity('apoe')}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* 9. Hardware Cross-Section Electron-Density Stencil/Slice Caps (Mission 2) */}
      {cutawayMode === 'half' && (
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[radius * 0.99, 64]} />
          <meshBasicMaterial
            map={electronDensityTex}
            transparent
            opacity={0.72}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {cutawayMode === 'quarter' && (
        <group>
          {/* X-Z Wedge Electron Density Cap */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <ringGeometry args={[coreRadius * 0.15, radius * 0.99, 48, 1, 0, Math.PI / 2]} />
            <meshBasicMaterial
              map={electronDensityTex}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <ringGeometry args={[coreRadius * 0.15, radius * 0.99, 48, 1, 0, Math.PI / 2]} />
            <meshBasicMaterial
              map={electronDensityTex}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
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
  const [inspectedLayer, setInspectedLayer] = useState<InspectedLayer>('all');
  const [visibility, setVisibility] = useState<LayerVisibility>({
    peg: true,
    lipids: true,
    tails: true,
    mrna: true,
    apoe: true,
  });

  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setAmbientPh(7.4);
  };

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const effectiveCholesterol = Math.max(
    0,
    100 - formulation.ionizableLipid - formulation.dspcHelper - formulation.pegLipid
  );

  // Advanced De Gennes Polymer Brush & Biophysical Telemetry
  const advancedMetrics = useMemo(() => {
    // Flory radius of PEG-2000 (N ≈ 45 monomers, monomer length a ≈ 0.35 nm): R_F = a * N^(3/5) ≈ 3.43 nm
    const floryRadiusNm = 3.43;
    // Average grafting distance D = sqrt(A_lipid / X_peg), where A_lipid ≈ 0.65 nm^2
    const pegMolFraction = Math.max(0.002, formulation.pegLipid / 100);
    const graftingDistanceNm = Math.sqrt(0.65 / pegMolFraction);
    const deGennesRatio = Number((floryRadiusNm / graftingDistanceNm).toFixed(2));

    // Live protonation at current ambient pH slider
    const liveIonizationPct = Math.round(
      100 / (1 + Math.pow(10, ambientPh - formulation.lipidPka))
    );

    // Israelachvili Critical Packing Parameter (CPP)
    const cpp = Number((1.08 + (liveIonizationPct / 100) * 0.58).toFixed(2));

    // Stokes-Einstein diffusivity in blood at 37°C (D = kB*T / (3*pi*eta*Dh))
    const stokesDiffusivity = Number((458 / biophysics.diameterNm).toFixed(1));

    return {
      deGennesRatio,
      graftingDistanceNm: graftingDistanceNm.toFixed(1),
      liveIonizationPct,
      cpp,
      stokesDiffusivity,
      phaseState: cpp >= 1.45 ? 'Inverted Hexagonal (HII Fusion)' : 'Lamellar / Micellar (Lα)',
    };
  }, [formulation.pegLipid, formulation.lipidPka, ambientPh, biophysics.diameterNm]);

  // Dynamic Scale Bar Width (calibrates 20 nm against particle diameter)
  const scaleBarPx = useMemo(() => {
    return Math.round(Math.max(26, Math.min(62, (20 / biophysics.diameterNm) * 165)));
  }, [biophysics.diameterNm]);

  const getHudDescription = () => {
    switch (inspectedLayer) {
      case 'peg':
        return {
          title: `PEG2000 Brush Corona (${formulation.pegLipid.toFixed(1)} mol% • RF/D = ${advancedMetrics.deGennesRatio})`,
          detail: `De Gennes ${advancedMetrics.deGennesRatio >= 1.0 ? 'Dense Brush (RF/D > 1.0)' : 'Mushroom Regime'} (D = ${advancedMetrics.graftingDistanceNm} nm). D0 = ${advancedMetrics.stokesDiffusivity} µm²/s.`,
        };
      case 'lipids':
        return {
          title: `Monolayer: Ionizable (${formulation.ionizableLipid.toFixed(1)}%) • DSPC (${formulation.dspcHelper.toFixed(1)}%) • Chol (${effectiveCholesterol.toFixed(1)}%)`,
          detail: `At pH ${ambientPh.toFixed(1)}: ${advancedMetrics.liveIonizationPct}% protonated • CPP = ${advancedMetrics.cpp} (${advancedMetrics.phaseState}).`,
        };
      case 'tails':
        return {
          title: `Dual-Chain (sn-1/sn-2) Hydrophobic Matrix (~2.8 nm • CPP = ${advancedMetrics.cpp})`,
          detail: `Branched alkyl & stearoyl chains splay from lamellar (pH 7.4) to cone-shaped HII phase (pH 5.5) to disrupt endosomal membranes.`,
        };
      case 'mrna':
        return {
          title: `Quaternary Cas9/ABE8e RNP + Base-Paired mRNA Core (SAXS d ≈ 6.1 nm)`,
          detail: `Antiparallel base-paired mRNA/sgRNA helices complexed with protonatable tertiary amines at N/P = ${formulation.npRatio.toFixed(1)}.`,
        };
      case 'apoe':
        return {
          title: `Apolipoprotein E Four-Helix Bundle Opsonins (Uptake: ${biophysics.cellularUptakeScore}/100)`,
          detail: `Binds exposed DSPC/cholesterol patches to trigger hepatic LDLR endocytosis; sterically blocked when RF/D > 1.15.`,
        };
      default:
        return {
          title: `Lipid Nanoparticle Cutaway (Dh = ${biophysics.diameterNm} nm • ${advancedMetrics.phaseState})`,
          detail: `GPU-instanced (2,400 lipids / 4,800 acyl chains) • Ambient pH ${ambientPh.toFixed(1)} (${advancedMetrics.liveIonizationPct}% ionized) • RF/D = ${advancedMetrics.deGennesRatio}.`,
        };
    }
  };

  const hud = getHudDescription();

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surfaceSubtle,
        borderColor: tokens.colors.border,
        borderRadius: tokens.radius,
      }}
      className="relative w-full h-[360px] overflow-hidden border flex flex-col justify-between"
    >
      {/* 1. Top HUD Control Header */}
      <div className="relative z-10 px-2 py-1.5 flex items-center justify-between gap-2 border-b border-[#222529] bg-[#141618]/90 backdrop-blur-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <span
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 border font-mono text-[11px] text-[#e1e4e8] font-medium"
          >
            Dh: {biophysics.diameterNm} nm
          </span>

          {/* Cutaway Mode Segmented Selector */}
          <div
            style={{
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="flex items-center border overflow-hidden"
          >
            {(
              [
                { id: 'quarter', label: '90° wedge' },
                { id: 'half', label: '180° sagittal' },
                { id: 'full', label: 'Surface' },
                { id: 'core', label: 'Core' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setCutawayMode(mode.id)}
                style={{
                  backgroundColor:
                    cutawayMode === mode.id
                      ? tokens.colors.surfaceSelected
                      : tokens.colors.surfaceRaised,
                  color:
                    cutawayMode === mode.id
                      ? tokens.colors.textPrimary
                      : tokens.colors.textSecondary,
                  borderRightColor: tokens.colors.borderMuted,
                }}
                className="px-1.5 py-0.5 text-[10px] font-medium border-r last:border-r-0 hover:text-[#e1e4e8] transition cursor-pointer"
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Optical Shader Mode Selector */}
          <div
            style={{
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="hidden sm:flex items-center border overflow-hidden"
          >
            {(
              [
                { id: 'pbr', label: 'PBR' },
                { id: 'electrostatic', label: 'ζ-Charge' },
                { id: 'cryo', label: 'Cryo-EM' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setOpticalMode(opt.id)}
                style={{
                  backgroundColor:
                    opticalMode === opt.id
                      ? tokens.colors.surfaceSelected
                      : tokens.colors.surfaceRaised,
                  color:
                    opticalMode === opt.id
                      ? tokens.colors.textPrimary
                      : tokens.colors.textSecondary,
                  borderRightColor: tokens.colors.borderMuted,
                }}
                className="px-1.5 py-0.5 text-[10px] font-medium border-r last:border-r-0 hover:text-[#e1e4e8] transition cursor-pointer"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Interactive Endosomal pH Titration Scrubber + Camera Controls */}
        <div className="flex items-center gap-2">
          <div
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 border text-[10px]"
            title="Scrub ambient pH from systemic blood (7.4) to late endosome (5.5) to observe H_II phase transition"
          >
            <span className="text-[#9aa0a6]">pH:</span>
            <input
              type="range"
              min="5.0"
              max="7.4"
              step="0.1"
              value={ambientPh}
              onChange={(e) => setAmbientPh(parseFloat(e.target.value))}
              className="w-14 h-1 accent-[#3f6d8c] cursor-pointer"
            />
            <span
              className={`font-mono font-semibold ${
                ambientPh <= 5.8 ? 'text-[#439268]' : 'text-[#e1e4e8]'
              }`}
            >
              {ambientPh.toFixed(1)}
            </span>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 text-[10px] text-[#9aa0a6] hover:text-[#e1e4e8] border hover:bg-[#282b2f] transition cursor-pointer"
          >
            {autoRotate ? 'Pause' : 'Rotate'}
          </button>
          <button
            onClick={resetCamera}
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 text-[10px] text-[#9aa0a6] hover:text-[#e1e4e8] border hover:bg-[#282b2f] transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 2. Interactive Layer Selector Bar */}
      <div className="relative z-10 px-2 py-1 flex items-center justify-between text-[10px] text-[#9aa0a6] border-b border-[#1f2226] bg-[#17191b]/75">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[#686e74]">Layers:</span>

          <button
            onClick={() => toggleLayer('peg')}
            onMouseEnter={() => setInspectedLayer('peg')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.peg ? 'text-[#e1e4e8]' : 'text-[#585e66] line-through'
            }`}
          >
            <span
              style={{ backgroundColor: tokens.colors.accent }}
              className="w-1.5 h-1.5 rounded-full inline-block"
            />
            PEG corona ({formulation.pegLipid.toFixed(1)}%)
          </button>

          <button
            onClick={() => toggleLayer('lipids')}
            onMouseEnter={() => setInspectedLayer('lipids')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.lipids ? 'text-[#e1e4e8]' : 'text-[#585e66] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8ea4b4] inline-block" />
            Lipid heads (2.4k)
          </button>

          <button
            onClick={() => toggleLayer('tails')}
            onMouseEnter={() => setInspectedLayer('tails')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.tails ? 'text-[#e1e4e8]' : 'text-[#585e66] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#343a41] border border-[#50565e] inline-block" />
            sn-1/sn-2 tails (4.8k)
          </button>

          <button
            onClick={() => toggleLayer('mrna')}
            onMouseEnter={() => setInspectedLayer('mrna')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.mrna ? 'text-[#e1e4e8]' : 'text-[#585e66] line-through'
            }`}
          >
            <span
              style={{
                backgroundColor:
                  biophysics.endosomalEscapeEfficiency >= 75
                    ? tokens.colors.status.success
                    : tokens.colors.status.warning,
              }}
              className="w-1.5 h-1.5 rounded-full inline-block"
            />
            RNP + dsRNA core
          </button>

          <button
            onClick={() => toggleLayer('apoe')}
            onMouseEnter={() => setInspectedLayer('apoe')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.apoe ? 'text-[#e1e4e8]' : 'text-[#585e66] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f7285] inline-block" />
            ApoE ({biophysics.cellularUptakeScore})
          </button>
        </div>

        <div className="text-[10px] font-mono text-[#686e74] hidden md:block">
          CPP: {advancedMetrics.cpp} • RF/D: {advancedMetrics.deGennesRatio}
        </div>
      </div>

      {/* 3. Three.js Instanced WebGL Viewport */}
      <div className="flex-1 w-full relative">
        <Canvas
          camera={{ position: [0, 0, 4.6], fov: 40 }}
          dpr={[1, 2]}
          gl={{ localClippingEnabled: true }}
          onCreated={({ gl }) => {
            gl.localClippingEnabled = true;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.08;
          }}
        >
          <ambientLight intensity={opticalMode === 'cryo' ? 0.55 : 0.8} />
          <directionalLight position={[6, 9, 6]} intensity={opticalMode === 'cryo' ? 0.85 : 1.25} />
          <directionalLight position={[-6, -4, -5]} intensity={0.4} color="#8a9ba8" />
          <RendererConfig diameter={biophysics.diameterNm} />
          <InstancedNanoparticleScene
            formulation={formulation}
            biophysics={biophysics}
            autoRotate={autoRotate}
            cutawayMode={cutawayMode}
            opticalMode={opticalMode}
            ambientPh={ambientPh}
            visibility={visibility}
            inspectedLayer={inspectedLayer}
          />
          <OrbitControls ref={controlsRef} enableZoom={true} autoRotate={false} enableDamping />
        </Canvas>

        {/* Calibrated Cryo-TEM Physical Scale Bar (Lower Left Overlay) */}
        <div className="absolute bottom-2 left-2.5 pointer-events-none flex flex-col gap-0.5 text-[9px] font-mono text-[#80868b]">
          <div className="flex items-center gap-1.5">
            <div
              style={{ width: `${scaleBarPx}px` }}
              className="h-[2px] bg-[#8ea4b4] relative transition-all"
            >
              <span className="absolute left-0 -top-1 w-[1px] h-[4px] bg-[#8ea4b4]" />
              <span className="absolute right-0 -top-1 w-[1px] h-[4px] bg-[#8ea4b4]" />
            </div>
            <span>20 nm</span>
          </div>
          <span className="text-[8px] text-[#585e66]">
            Cryo-TEM calibrated • SAXS d = 6.1 nm
          </span>
        </div>

        {/* Live Endosomal Compartment Badge (Lower Right Overlay) */}
        <div className="absolute bottom-2 right-2.5 pointer-events-none text-[9px] font-mono px-2 py-0.5 rounded border border-[#2c3035] bg-[#141618]/85 text-[#9aa0a6]">
          {ambientPh >= 7.1
            ? 'Systemic Blood (pH 7.4)'
            : ambientPh >= 6.0
            ? 'Early Endosome (Acidifying)'
            : 'Late Endosome (HII Membrane Disruption)'}
        </div>
      </div>

      {/* 4. Bottom Contextual Biophysical HUD Inspector */}
      <div className="relative z-10 px-2.5 py-1.5 border-t border-[#222529] bg-[#141618]/92 flex items-center justify-between text-[11px]">
        <div className="flex flex-col gap-0.5 leading-tight">
          <div className="font-medium text-[#e1e4e8] flex items-center gap-2">
            <span>{hud.title}</span>
          </div>
          <span className="text-[10px] text-[#80868b]">{hud.detail}</span>
        </div>
        <div className="text-right text-[10px] font-mono text-[#686e74] shrink-0 ml-3">
          Zeta: {biophysics.zetaPotentialMv > 0 ? `+${biophysics.zetaPotentialMv}` : biophysics.zetaPotentialMv} mV • PDI: {biophysics.pdi.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
