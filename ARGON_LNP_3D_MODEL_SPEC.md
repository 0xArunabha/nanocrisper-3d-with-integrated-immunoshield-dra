# AGENT ARGON SPECIFICATION: LIPID NANOPARTICLE (LNP) 3D MODEL & BIOPHYSICS ENGINE
**Target System:** `nanoCRISPER 3D with integrated immunoshield DRA`  
**Purpose:** Comprehensive architectural, mathematical, and implementation dossier for Agent Argon to analyze, optimize, and advance the 3D Lipid Nanoparticle structural cutaway model.

---

## 1. Executive Summary & Objective

You are tasked with upgrading and optimizing the **Lipid Nanoparticle (LNP) Structural Cutaway 3D Engine**.
The model visualizes a multicomponent mRNA/sgRNA base editor carrier (Dh ≈ 60–140 nm) comprising:
1. **Outer Monolayer Shell:** Ionizable tertiary amine lipid (SM-102 proxy), helper phospholipid (DSPC), structural cholesterol, and stealth DMG-PEG2000 anchors distributed via a Fibonacci sphere lattice.
2. **Inward Acyl Tails:** Directed along normal vectors into the core cavity.
3. **PEG Polymer Brush Corona:** Kinematically simulating polymer chains transitioning between mushroom regime (<2.5 mol%) and dense brush regime (≥2.5 mol%).
4. **Surface Apolipoprotein E (ApoE) Opsonins:** Endogenous liver-targeting protein complexes whose adsorption density is determined by the "PEG Dilemma" biophysical equation.
5. **Condensed Core Payload:** Translucent cavity envelope, primary Cas9/ABE8e base editor mRNA coiled ribbon (~4.5 kb), secondary sgRNA hairpin ribbon, and inverted-micellar lipid nanoclusters.
6. **Multi-Mode Cutaways:** 90° wedge cutaway, 180° sagittal cutaway, full surface, and core-only modes.
7. **Biophysical Real-Time HUD & Cryo-TEM Scale Bar:** Calibrated physical scale bar (20 nm) and dynamic DLS / zeta potential readouts.

---

## 2. Technology Stack & Dependencies

The project runs on **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4**, and **Three.js** via React Three Fiber:

```json
{
  "dependencies": {
    "@react-three/drei": "^10.7.9",
    "@react-three/fiber": "^9.8.2",
    "@types/three": "^0.186.0",
    "lucide-react": "^1.59.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "three": "^0.186.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@vitejs/plugin-react": "^6.1.1",
    "oxlint": "^1.81.0",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.2",
    "vite": "^8.3.0"
  }
}
```

---

## 3. Complete Source Code: `src/components/NanoViewport3D.tsx`

```tsx
// src/components/NanoViewport3D.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
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

interface LayerVisibility {
  peg: boolean;
  lipids: boolean;
  tails: boolean;
  mrna: boolean;
  apoe: boolean;
}

// Check if a 3D unit coordinate falls inside the cutaway volume
function isPointCut(x: number, y: number, z: number, mode: CutawayMode): boolean {
  if (mode === 'full') return false;
  if (mode === 'core') return false;
  if (mode === 'half') {
    // Sagittal cut: remove front hemisphere (z > 0)
    return z > 0.04;
  }
  if (mode === 'quarter') {
    // 90° wedge cut: remove octant (x > 0 && z > 0)
    return x > -0.04 && z > -0.04 && y > -0.75;
  }
  return false;
}

function ResponsiveCamera({ diameter }: { diameter: number }) {
  const { camera } = useThree();
  useEffect(() => {
    // Dynamic distance calibrated so nanoparticles from 60 nm to 140 nm fit comfortably
    const targetZ = 4.2 + Math.max(0, (diameter - 50) / 130) * 1.6;
    camera.position.set(0, 0, targetZ);
    camera.updateProjectionMatrix();
  }, [camera, diameter]);
  return null;
}

interface MeshProps extends Props {
  autoRotate: boolean;
  cutawayMode: CutawayMode;
  visibility: LayerVisibility;
  inspectedLayer: InspectedLayer;
  onHoverLayer: (layer: InspectedLayer) => void;
}

function DetailedNanoparticleScene({
  formulation,
  biophysics,
  autoRotate,
  cutawayMode,
  visibility,
  inspectedLayer,
}: MeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Scaled outer radius proportional to hydrodynamic diameter
  const radius = useMemo(() => {
    return 1.45 + ((biophysics.diameterNm - 50) / 130) * 0.95;
  }, [biophysics.diameterNm]);

  // Monolayer shell thickness: ~2.8 - 3.2 nm scaled equivalent
  const shellThickness = useMemo(() => radius * 0.22, [radius]);
  const coreRadius = useMemo(() => radius - shellThickness, [radius, shellThickness]);

  // Derived stoichiometric fractions (cholesterol balances to 100%)
  const effectiveCholesterol = Math.max(
    0,
    100 - formulation.ionizableLipid - formulation.dspcHelper - formulation.pegLipid
  );
  const totalMol = 100;
  const pegFrac = formulation.pegLipid / totalMol;
  const dspcFrac = formulation.dspcHelper / totalMol;
  const cholFrac = effectiveCholesterol / totalMol;

  // 1. Fibonacci Sphere Lattice for Outer Monolayer Lipids
  const {
    lipidHeads,
    lipidTails,
    pegAnchors,
    apoePositions,
  } = useMemo(() => {
    const count = 750;
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    const heads: {
      pos: [number, number, number];
      type: 'ionizable' | 'dspc' | 'chol' | 'peg';
      color: string;
      scale: number;
    }[] = [];

    const tails: {
      pos: [number, number, number];
      rot: [number, number, number];
      length: number;
      color: string;
    }[] = [];

    const pegAnchorsList: {
      pos: THREE.Vector3;
      normal: THREE.Vector3;
    }[] = [];

    const apoePosList: {
      pos: THREE.Vector3;
      normal: THREE.Vector3;
    }[] = [];

    // Number of ApoE opsonins based on cellular uptake / ApoE adsorption score (PEG dilemma)
    const targetApoECount = Math.max(1, Math.min(8, Math.round(biophysics.cellularUptakeScore / 13)));
    let apoeAssigned = 0;

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const norm = new THREE.Vector3(x, y, z).normalize();

      // Check if point is inside cutaway volume
      const isCut = isPointCut(norm.x, norm.y, norm.z, cutawayMode);
      if (isCut && cutawayMode !== 'core') continue;

      // Deterministic lipid identity from molar ratio
      const lipidSeed = (i * 1.6180339887) % 1.0;
      let type: 'ionizable' | 'dspc' | 'chol' | 'peg' = 'ionizable';
      let color = '#627280'; // Tertiary amine ionizable lipid (slate neutral)
      let headScale = 0.040;
      let tailLength = shellThickness * 0.85;

      if (lipidSeed < pegFrac) {
        type = 'peg';
        color = tokens.colors.accent; // Accent slate-blue for PEG anchors
        headScale = 0.046;
        if (!isCut) {
          pegAnchorsList.push({ pos: norm.clone().multiplyScalar(radius), normal: norm.clone() });
        }
      } else if (lipidSeed < pegFrac + dspcFrac) {
        type = 'dspc';
        color = '#8ea4b4'; // DSPC phosphocholine headgroup (cool silver-blue)
        headScale = 0.042;
      } else if (lipidSeed < pegFrac + dspcFrac + cholFrac) {
        type = 'chol';
        color = '#50565e'; // Compact planar cholesterol sterol (darker neutral)
        headScale = 0.034;
        tailLength = shellThickness * 0.55; // Shorter rigid sterol tail
      }

      // Candidate for ApoE protein binding on surface (only on uncut regions)
      if (!isCut && type === 'dspc' && apoeAssigned < targetApoECount && (i % 25 === 0)) {
        apoePosList.push({ pos: norm.clone().multiplyScalar(radius + 0.04), normal: norm.clone() });
        apoeAssigned++;
      }

      // Head position on outer sphere
      const headPos: [number, number, number] = [
        norm.x * radius,
        norm.y * radius,
        norm.z * radius,
      ];

      heads.push({
        pos: headPos,
        type,
        color,
        scale: headScale,
      });

      // Tail orientation pointing inward along -norm
      const tailCenter = norm.clone().multiplyScalar(radius - tailLength / 2);
      const euler = new THREE.Euler();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
      euler.setFromQuaternion(quat);

      tails.push({
        pos: [tailCenter.x, tailCenter.y, tailCenter.z],
        rot: [euler.x, euler.y, euler.z],
        length: tailLength,
        color: '#343a41', // Hydrophobic acyl tail neutral
      });
    }

    return {
      lipidHeads: heads,
      lipidTails: tails,
      pegAnchors: pegAnchorsList,
      apoePositions: apoePosList,
    };
  }, [radius, shellThickness, formulation.pegLipid, formulation.dspcHelper, effectiveCholesterol, cutawayMode, biophysics.cellularUptakeScore]);

  // 2. PEG Polymer Brush Corona Beads
  const pegBeads = useMemo(() => {
    const beads: { pos: [number, number, number]; scale: number }[] = [];
    // PEG extension length: mushroom regime (<1.5%) vs brush regime (>2.5%)
    const isBrush = formulation.pegLipid >= 2.5;
    const chainLength = isBrush ? radius * 0.28 : radius * 0.14;
    const beadsPerChain = isBrush ? 6 : 4;

    pegAnchors.forEach((anchor, anchorIdx) => {
      const tangent = new THREE.Vector3(
        -anchor.normal.y,
        anchor.normal.x,
        0
      ).normalize();
      const bitangent = anchor.normal.clone().cross(tangent).normalize();

      for (let step = 1; step <= beadsPerChain; step++) {
        const t = step / beadsPerChain;
        const radialDist = radius + t * chainLength;
        // Wavy coiled polymer fluctuation
        const freq = 4.5 + (anchorIdx % 3);
        const wiggleMag = (1 - t) * (isBrush ? 0.035 : 0.065);
        const offset = tangent.clone().multiplyScalar(Math.sin(t * Math.PI * freq) * wiggleMag)
          .add(bitangent.clone().multiplyScalar(Math.cos(t * Math.PI * freq) * wiggleMag));

        const beadPos = anchor.normal.clone().multiplyScalar(radialDist).add(offset);
        beads.push({
          pos: [beadPos.x, beadPos.y, beadPos.z],
          scale: 0.024 - t * 0.006, // Slight tapering towards outer brush edge
        });
      }
    });

    return beads;
  }, [pegAnchors, radius, formulation.pegLipid]);

  // 3. Continuous 3D Coiled Nucleic Acid (mRNA & sgRNA) Strands in Core
  const { mrnaTubeGeo, sgrnaTubeGeo } = useMemo(() => {
    // Primary Cas9 / ABE8e base editor mRNA strand (~4.5 kb coiled ribbon)
    const mrnaPoints: THREE.Vector3[] = [];
    const rM = coreRadius * 0.72;
    const stepsM = 120;
    for (let i = 0; i <= stepsM; i++) {
      const t = (i / stepsM) * Math.PI * 10;
      const phi = (i / stepsM) * Math.PI * 3;
      const r = rM * (0.55 + 0.38 * Math.sin(phi * 2.5));
      const x = r * Math.sin(t) * Math.cos(phi);
      const y = r * Math.cos(t);
      const z = r * Math.sin(t) * Math.sin(phi);
      mrnaPoints.push(new THREE.Vector3(x, y, z));
    }
    const curveM = new THREE.CatmullRomCurve3(mrnaPoints, true);
    const tubeM = new THREE.TubeGeometry(curveM, 110, coreRadius * 0.042, 8, true);

    // Secondary guide RNA (sgRNA) hairpin coil
    const sgrnaPoints: THREE.Vector3[] = [];
    const rS = coreRadius * 0.52;
    const stepsS = 80;
    for (let i = 0; i <= stepsS; i++) {
      const t = (i / stepsS) * Math.PI * 6;
      const phi = (i / stepsS) * Math.PI * 2;
      const r = rS * (0.6 + 0.3 * Math.cos(phi * 3));
      const x = r * Math.cos(t);
      const y = r * Math.sin(t) * Math.sin(phi);
      const z = r * Math.sin(t) * Math.cos(phi);
      sgrnaPoints.push(new THREE.Vector3(x, y, z));
    }
    const curveS = new THREE.CatmullRomCurve3(sgrnaPoints, true);
    const tubeS = new THREE.TubeGeometry(curveS, 70, coreRadius * 0.032, 6, true);

    return { mrnaTubeGeo: tubeM, sgrnaTubeGeo: tubeS };
  }, [coreRadius]);

  // 4. Inverted-Micelle Ionizable Lipid Nanoclusters within Core
  const coreMicelles = useMemo(() => {
    const micelles: [number, number, number][] = [];
    const count = 130;
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      // Staggered shell inside core radius
      const radialScale = coreRadius * (0.35 + 0.55 * ((i % 5) / 5));
      const x = Math.cos(theta) * r * radialScale;
      const z = Math.sin(theta) * r * radialScale;
      micelles.push([x, y * radialScale, z]);
    }
    return micelles;
  }, [coreRadius]);

  // Smooth rotation
  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.22;
    }
  });

  // Functional status-based core coloration
  const coreStatusColor =
    biophysics.endosomalEscapeEfficiency >= 75
      ? tokens.colors.status.success
      : biophysics.endosomalEscapeEfficiency >= 55
      ? tokens.colors.status.warning
      : tokens.colors.status.danger;

  // Active layer highlight opacity
  const getLayerOpacity = (layer: InspectedLayer) => {
    if (inspectedLayer === 'all' || inspectedLayer === layer) return 1.0;
    return 0.35;
  };

  const showOuterShell = cutawayMode !== 'core';

  return (
    <group ref={groupRef}>
      {/* 1. Translucent Core Cavity Envelope */}
      {visibility.mrna && (
        <mesh>
          <sphereGeometry args={[coreRadius * 0.98, 32, 32]} />
          <meshStandardMaterial
            color="#1c2126"
            transparent
            opacity={0.38 * getLayerOpacity('mrna')}
            roughness={0.7}
            metalness={0.0}
          />
        </mesh>
      )}

      {/* 2. Primary mRNA Ribbon (Base Editor Coding Strand) */}
      {visibility.mrna && (
        <mesh geometry={mrnaTubeGeo}>
          <meshStandardMaterial
            color={coreStatusColor}
            roughness={0.45}
            metalness={0.1}
            wireframe={false}
          />
        </mesh>
      )}

      {/* 3. Secondary sgRNA Ribbon */}
      {visibility.mrna && (
        <mesh geometry={sgrnaTubeGeo}>
          <meshStandardMaterial
            color="#9e6e4e" // Subdued nucleic acid amber
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* 4. Core Inverted Micelle Lipid Nanoclusters */}
      {visibility.mrna && (
        <group>
          {coreMicelles.map((pos, idx) => (
            <mesh key={`micelle-${idx}`} position={pos}>
              <sphereGeometry args={[coreRadius * 0.05, 8, 8]} />
              <meshStandardMaterial
                color="#2f373f"
                roughness={0.6}
                metalness={0.0}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 5. Hydrophobic Acyl Tails (Monolayer Inner Matrix) */}
      {showOuterShell && visibility.tails && (
        <group>
          {lipidTails.map((tail, idx) => (
            <mesh
              key={`tail-${idx}`}
              position={tail.pos}
              rotation={tail.rot}
            >
              <cylinderGeometry args={[0.010, 0.010, tail.length, 6]} />
              <meshStandardMaterial
                color={tail.color}
                roughness={0.7}
                opacity={getLayerOpacity('tails')}
                transparent={inspectedLayer !== 'all'}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 6. Polar Surface Lipid Headgroups (DSPC, Cholesterol, Ionizable, PEG Anchors) */}
      {showOuterShell && visibility.lipids && (
        <group>
          {lipidHeads.map((head, idx) => (
            <mesh key={`head-${idx}`} position={head.pos}>
              <sphereGeometry args={[head.scale, 10, 10]} />
              <meshStandardMaterial
                color={head.color}
                roughness={0.38}
                metalness={0.05}
                opacity={getLayerOpacity('lipids')}
                transparent={inspectedLayer !== 'all'}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 7. PEG Stealth Polymer Corona */}
      {showOuterShell && visibility.peg && (
        <group>
          {pegBeads.map((bead, idx) => (
            <mesh key={`peg-bead-${idx}`} position={bead.pos}>
              <sphereGeometry args={[bead.scale, 8, 8]} />
              <meshStandardMaterial
                color={tokens.colors.accent}
                roughness={0.3}
                metalness={0.1}
                opacity={0.88 * getLayerOpacity('peg')}
                transparent
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 8. Apolipoprotein E (ApoE) Opsonins Bound to Outer Monolayer */}
      {showOuterShell && visibility.apoe && (
        <group>
          {apoePositions.map((apoe, idx) => (
            <group key={`apoe-${idx}`} position={apoe.pos.toArray()}>
              {/* Multi-lobed helical bundle structure */}
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.056, 10, 10]} />
                <meshStandardMaterial
                  color="#4f7285"
                  roughness={0.4}
                  opacity={getLayerOpacity('apoe')}
                  transparent={inspectedLayer !== 'all'}
                />
              </mesh>
              <mesh position={[0.042, 0.032, 0]}>
                <sphereGeometry args={[0.046, 8, 8]} />
                <meshStandardMaterial
                  color="#4f7285"
                  roughness={0.4}
                  opacity={getLayerOpacity('apoe')}
                  transparent={inspectedLayer !== 'all'}
                />
              </mesh>
              <mesh position={[-0.038, 0.028, 0.015]}>
                <sphereGeometry args={[0.042, 8, 8]} />
                <meshStandardMaterial
                  color="#4f7285"
                  roughness={0.4}
                  opacity={getLayerOpacity('apoe')}
                  transparent={inspectedLayer !== 'all'}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 9. Cross-Section Cut Surface Rims (Structural Drafting Guides) */}
      {cutawayMode === 'quarter' && (
        <group>
          {/* Inner core boundary rim in X-Z cut plane */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array(
                    Array.from({ length: 48 }, (_, i) => {
                      const angle = (i / 48) * (Math.PI / 2);
                      return [coreRadius * Math.cos(angle), 0, coreRadius * Math.sin(angle)];
                    }).flat()
                  ),
                  3,
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#38424d" linewidth={1} />
          </lineLoop>
          {/* Outer shell boundary rim in X-Z cut plane */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array(
                    Array.from({ length: 48 }, (_, i) => {
                      const angle = (i / 48) * (Math.PI / 2);
                      return [radius * Math.cos(angle), 0, radius * Math.sin(angle)];
                    }).flat()
                  ),
                  3,
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#475360" linewidth={1} />
          </lineLoop>
        </group>
      )}
    </group>
  );
}

export const NanoViewport3D: React.FC<Props> = ({ formulation, biophysics }) => {
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [cutawayMode, setCutawayMode] = useState<CutawayMode>('quarter');
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
  };

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const effectiveCholesterol = Math.max(
    0,
    100 - formulation.ionizableLipid - formulation.dspcHelper - formulation.pegLipid
  );

  // Informative biophysical HUD descriptions
  const getHudDescription = () => {
    switch (inspectedLayer) {
      case 'peg':
        return {
          title: `PEG Stealth Corona (DMG-PEG2000 • ${formulation.pegLipid.toFixed(1)} mol%)`,
          detail: `Conformation: ${formulation.pegLipid >= 2.5 ? 'Dense Brush Regime' : 'Mushroom Regime'} (~${(formulation.pegLipid >= 2.5 ? 4.2 : 2.5).toFixed(1)} nm). Steric barrier prolongs systemic circulation (t½ ~${(1.2 + formulation.pegLipid * 4.8).toFixed(1)} h) while modulating ApoE clearance.`,
        };
      case 'lipids':
        return {
          title: `Surface Monolayer: DSPC (${formulation.dspcHelper.toFixed(1)}%) + Cholesterol (${effectiveCholesterol.toFixed(1)}%)`,
          detail: `Bilayer fluidity Tm ~55°C. Rigid sterol intercalation maintains spherical integrity under hydrodynamic shear in bloodstream.`,
        };
      case 'tails':
        return {
          title: `Hydrophobic Lipid Matrix (~2.8 nm thickness)`,
          detail: `Inward-oriented saturated stearoyl and alkyl acyl chains packaging internal core and stabilizing lipid-nucleic acid interface.`,
        };
      case 'mrna':
        return {
          title: `Condensed mRNA-Lipid Core (Ø ~${(biophysics.diameterNm * 0.78).toFixed(0)} nm)`,
          detail: `Cas9/ABE8e mRNA + sgRNA cargo organized into inverted micellar / hexagonal (HII) phases with protonatable ionizable lipids at N/P = 6.0.`,
        };
      case 'apoe':
        return {
          title: `Apolipoprotein E Opsonins (Score: ${biophysics.cellularUptakeScore}/100)`,
          detail: `Endogenous ApoE adsorption mediates LDLR-dependent endocytosis in hepatocytes. High PEG content (>3.0 mol%) sterically suppresses binding.`,
        };
      default:
        return {
          title: `Lipid Nanoparticle Structural Cutaway (Dh = ${biophysics.diameterNm} nm)`,
          detail: `4-Component multicomponent carrier with condensed mRNA inverted-micelle core, stabilizing lipid monolayer, and PEGylated stealth corona.`,
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
      className="relative w-full h-[340px] overflow-hidden border flex flex-col justify-between"
    >
      {/* 1. Top HUD Control Header */}
      <div className="relative z-10 p-2 flex items-center justify-between gap-2 border-b border-[#222529] bg-[#141618]/85 backdrop-blur-xs">
        {/* Left: Hydrodynamic Diameter & Cutaway Selector */}
        <div className="flex items-center gap-2">
          <span
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 border font-mono-seq text-[11px] text-[#e1e4e8] font-medium"
            title="Calculated Z-average Hydrodynamic Diameter via Dynamic Light Scattering (DLS) model"
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
                { id: 'quarter', label: '90° cutaway' },
                { id: 'half', label: '180° sagittal' },
                { id: 'full', label: 'Full surface' },
                { id: 'core', label: 'Core only' },
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
                className="px-2 py-0.5 text-[10px] font-medium border-r last:border-r-0 hover:text-[#e1e4e8] transition cursor-pointer"
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Camera Actions */}
        <div className="flex items-center gap-1">
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
      <div className="relative z-10 px-2 py-1 flex items-center justify-between text-[10px] text-[#9aa0a6] border-b border-[#1f2226] bg-[#17191b]/70">
        <div className="flex items-center gap-3">
          <span className="text-[#686e74]">Layers:</span>

          {/* PEG Brush */}
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

          {/* Lipid Heads */}
          <button
            onClick={() => toggleLayer('lipids')}
            onMouseEnter={() => setInspectedLayer('lipids')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.lipids ? 'text-[#e1e4e8]' : 'text-[#585e66] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8ea4b4] inline-block" />
            Lipid heads (DSPC/Chol)
          </button>

          {/* Acyl Tails */}
          <button
            onClick={() => toggleLayer('tails')}
            onMouseEnter={() => setInspectedLayer('tails')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.tails ? 'text-[#e1e4e8]' : 'text-[#585e66] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#343a41] border border-[#50565e] inline-block" />
            Hydrophobic tails
          </button>

          {/* mRNA Core */}
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
            mRNA payload core
          </button>

          {/* ApoE */}
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

        {/* Viewport Hint */}
        <div className="text-[10px] text-[#585e66]">
          Rotate: drag • Zoom: scroll
        </div>
      </div>

      {/* 3. Three.js Canvas */}
      <div className="flex-1 w-full relative">
        <Canvas camera={{ position: [0, 0, 4.6], fov: 40 }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[6, 9, 6]} intensity={1.1} />
          <directionalLight position={[-6, -4, -5]} intensity={0.35} color="#8a9ba8" />
          <ResponsiveCamera diameter={biophysics.diameterNm} />
          <DetailedNanoparticleScene
            formulation={formulation}
            biophysics={biophysics}
            autoRotate={autoRotate}
            cutawayMode={cutawayMode}
            visibility={visibility}
            inspectedLayer={inspectedLayer}
            onHoverLayer={setInspectedLayer}
          />
          <OrbitControls ref={controlsRef} enableZoom={true} autoRotate={false} />
        </Canvas>

        {/* Dynamic Physical Scale Bar (Lower Left Overlay) */}
        <div className="absolute bottom-2 left-2 pointer-events-none flex flex-col gap-0.5 text-[9px] font-mono-seq text-[#80868b]">
          <div className="flex items-center gap-1">
            <div className="w-[38px] h-[2px] bg-[#686e74] relative">
              <span className="absolute left-0 -top-1 w-[1px] h-[4px] bg-[#686e74]" />
              <span className="absolute right-0 -top-1 w-[1px] h-[4px] bg-[#686e74]" />
            </div>
            <span>20 nm</span>
          </div>
          <span className="text-[8px] text-[#585e66]">Cryo-TEM scale bar</span>
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
        <div className="text-right text-[10px] font-mono-seq text-[#686e74] shrink-0 ml-3">
          Zeta: {biophysics.zetaPotentialMv > 0 ? `+${biophysics.zetaPotentialMv}` : biophysics.zetaPotentialMv} mV • PDI: {biophysics.pdi.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
```

---

## 4. Biophysics & CMC Mathematical Engine (`src/engines/bioEngines.ts`)

```typescript
// src/engines/bioEngines.ts

export interface LnpFormulation {
  ionizableLipid: number; // e.g., 50.0 mol%
  dspcHelper: number;     // e.g., 10.0 mol%
  cholesterol: number;    // e.g., 38.5 mol%
  pegLipid: number;       // e.g., 1.5 mol%
  lipidPka: number;       // Optimal: 6.2 - 6.5
  npRatio: number;        // Amine-to-Phosphate ratio (Optimal: 6)
}

export interface LnpBiophysicsResult {
  diameterNm: number;
  pdi: number;
  zetaPotentialMv: number;
  endosomalProtonationPct: number; // at pH 5.5
  bloodProtonationPct: number;     // at pH 7.4
  endosomalEscapeEfficiency: number;
  cellularUptakeScore: number;     // Models the "PEG Dilemma"
  organTropism: {
    liver: number;
    spleen: number;
    lungs: number;
  };
  stabilityStatus: 'Optimal Clinical LNP' | 'PEG Stealth Dilemma (Low Uptake)' | 'Aggregation Risk (Too Large)' | 'Poor Endosomal Escape';
}

export function simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
  const total = form.ionizableLipid + form.dspcHelper + form.cholesterol + form.pegLipid;
  const normPeg = (form.pegLipid / total) * 100;
  const normChol = (form.cholesterol / total) * 100;

  // 1. Hydrodynamic diameter (Dh in nm): Higher PEG-lipid increases surface curvature -> smaller particle
  const rawDiameter = 135 - 24 * Math.log(Math.max(0.3, normPeg * 2.2)) + (6 - form.npRatio) * 3.5;
  const diameterNm = Math.round(Math.max(42, Math.min(210, rawDiameter)));

  // 2. Polydispersity Index (PDI)
  const pdi = Number((0.06 + Math.abs(normChol - 38.5) * 0.004 + (normPeg < 1.0 ? 0.12 : 0)).toFixed(2));

  // 3. Henderson-Hasselbalch Ionization: % = 100 / (1 + 10^(pH - pKa))
  const endosomalProtonationPct = Math.round(100 / (1 + Math.pow(10, 5.5 - form.lipidPka)));
  const bloodProtonationPct = Math.round(100 / (1 + Math.pow(10, 7.4 - form.lipidPka)));

  // 4. Zeta Potential at physiological pH 7.4 (mV)
  const zetaPotentialMv = Number(((bloodProtonationPct * 0.35) - (normPeg * 2.1)).toFixed(1));

  // 5. The "PEG Dilemma" & Cellular Uptake
  const pegPenalty = normPeg > 2.2 ? Math.max(10, 100 - Math.pow(normPeg - 2.0, 1.8) * 18) : 95;
  const cellularUptakeScore = Math.round(Math.min(98, Math.max(8, pegPenalty)));

  // 6. Endosomal Escape combines protonation at pH 5.5 + neutral charge at pH 7.4 + low PEG barrier
  const pkaSweetSpotBonus = Math.max(0, 100 - Math.abs(form.lipidPka - 6.35) * 55);
  const endosomalEscapeEfficiency = Math.round(
    (endosomalProtonationPct * 0.4 + pkaSweetSpotBonus * 0.35 + cellularUptakeScore * 0.25)
  );

  // 7. Organ Tropism (SORT - Selective Organ Targeting model)
  let liver = 78;
  let spleen = 15;
  let lungs = 7;

  if (form.lipidPka > 6.7 || zetaPotentialMv > 8) {
    lungs = Math.min(68, Math.round(15 + (form.lipidPka - 6.5) * 45));
    liver = Math.max(20, 90 - lungs - 12);
    spleen = 100 - liver - lungs;
  } else if (form.lipidPka < 6.0 || zetaPotentialMv < -5) {
    spleen = Math.min(62, Math.round(20 + (6.2 - form.lipidPka) * 50));
    liver = Math.max(25, 90 - spleen - 8);
    lungs = 100 - liver - spleen;
  }

  let stabilityStatus: LnpBiophysicsResult['stabilityStatus'] = 'Optimal Clinical LNP';
  if (normPeg > 3.2) {
    stabilityStatus = 'PEG Stealth Dilemma (Low Uptake)';
  } else if (diameterNm > 140 || normPeg < 0.8) {
    stabilityStatus = 'Aggregation Risk (Too Large)';
  } else if (endosomalEscapeEfficiency < 58) {
    stabilityStatus = 'Poor Endosomal Escape';
  }

  return {
    diameterNm,
    pdi,
    zetaPotentialMv,
    endosomalProtonationPct,
    bloodProtonationPct,
    endosomalEscapeEfficiency,
    cellularUptakeScore,
    organTropism: { liver, spleen, lungs },
    stabilityStatus
  };
}
```

---

## 5. Design System Tokens (`src/styles/tokens.ts`)

```typescript
// src/styles/tokens.ts
export const tokens = {
  colors: {
    canvas: '#141618',
    surface: '#1a1c1e',
    surfaceSubtle: '#17191b',
    surfaceRaised: '#212427',
    surfaceHover: '#282b2f',
    surfaceSelected: '#242a30',
    border: '#2c3035',
    borderMuted: '#222529',
    borderFocus: '#3f6d8c',
    textPrimary: '#e1e4e8',
    textSecondary: '#9aa0a6',
    textMuted: '#686e74',
    textInverse: '#141618',
    accent: '#3f6d8c',
    accentHover: '#4b7f9f',
    accentSubdued: 'rgba(63, 109, 140, 0.14)',
    accentBorder: '#3f6d8c',
    status: {
      success: '#439268',
      successSubtle: 'rgba(67, 146, 104, 0.12)',
      warning: '#b88636',
      warningSubtle: 'rgba(184, 134, 54, 0.12)',
      danger: '#b54a4a',
      dangerSubtle: 'rgba(181, 74, 74, 0.12)',
    },
  },
  radius: '3px',
} as const;
```

---

## 6. Actionable Enhancement Missions for Agent Argon

Argon can take this model to research/production tier across these prioritized missions:

### Mission 1: GPU Draw Call Collapse (`InstancedMesh`)
* **Problem:** Currently, ~750 lipid heads, ~750 tails, ~130 core micelles, and ~400 PEG beads are separate `<mesh>` components, resulting in >2,000 draw calls per frame.
* **Goal:** Refactor each lipid layer into `THREE.InstancedMesh`. Populate transformation matrices using `setMatrixAt` and per-instance colors using `setColorAt`.
* **Impact:** Reduces draw calls to under 8, allowing increasing lipid count from 750 to 5,000+ at 120 FPS.

### Mission 2: Hardware-Accelerated Boolean Stencil Clipping
* **Problem:** `isPointCut(x, y, z)` filters out coordinates at generation time, leaving an unnatural hollow edge.
* **Goal:** Enable `gl.localClippingEnabled = true` with `THREE.Plane` clipping on materials. Implement a 2-pass stencil buffer cap (`stencilWrite`, `stencilRef`, `stencilFunc`) that creates a solid shaded cross-section face showing internal electron-density.

### Mission 3: Quaternary RNP / RNA Helix Realism
* **Problem:** mRNA is currently a single CatmullRom spline tube.
* **Goal:** Upgrade the nucleic acid generator to a double-stranded or hairpin ribbon with base-pair rungs, or integrate a direct PDB surface loader for the Cas9 ribonucleoprotein complex (e.g., PDB ID: 6O0Y or 7K3F).

### Mission 4: Subsurface Scattering (SSS) & PBR Shaders
* **Problem:** Standard Lambertian/Standard shading looks flat.
* **Goal:** Use `THREE.MeshPhysicalMaterial` with transmission (`0.4`), roughness (`0.25`), and thickness (`0.8`) to simulate the cryo-EM optical transmission through the lipid monolayer.
