# AGENT ARGON: ALL-IN-ONE MASTER SYSTEM & REPOSITORY CONTEXT
**Project:** nanoCRISPER 3D with integrated immunoshield DRA  
**Author:** Arunabha Ghosh, BSc Biotechnology (1st Year), Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal, India  
**Scope:** Complete, exhaustive, single-file context bundle containing full architecture, scientific equations, domain models, and 100% of all foundational source code files for Agent Argon.

---

## 1. Executive Summary & Sandboxed Agent Directive

You are **Agent Argon**, an autonomous software engineering and computational biology agent operating in a local sandbox. 
This master context file provides you with everything required to understand, debug, optimize, test, and enhance the **nanoCRISPER 3D with integrated immunoshield DRA** platform without needing external internet or external repository access.

### Platform Vision
The platform provides a clinical-grade workbench bridging:
1. **Precision Codon-Aware CRISPR Base Editing:** Dual-strand (+/-) PAM scanning, deaminase activity window (positions 4–8) simulation, bystander missense/nonsense mutation profiling, Golden Gate cloning oligonucleotide design, and South Asian (SAS) population polymorphism collision detection.
2. **Nanotechnology & Lipid Nanoparticle (LNP) Formulation Engineering:** Multi-component lipid stoichiometry balancing (locked strictly at 100%), Henderson-Hasselbalch protonation kinetics, Israelachvili Critical Packing Parameter (CPP) phase transitions, De Gennes polymer brush scaling ("The PEG Dilemma"), ApoE opsonization dynamics, Selective Organ Targeting (SORT) biodistribution, wet-lab microfluidic batch mass calculations, and interactive hardware-accelerated 3D structural cutaway rendering.
3. **ImmunoShield Adaptive De-Immunization:** Structure-guided humanization of SpCas9 against high-frequency South Asian MHC Class I alleles (HLA-A*02:01, HLA-A*24:02, HLA-A*11:01, HLA-B*40:06, HLA-B*15:02) to mitigate pre-existing host cytotoxic T-lymphocyte (CTL) responses.
4. **Pre-IND CMC Regulatory Dossier Export:** One-click generation of comprehensive clinical evaluation reports formatted in Markdown.

---

## 2. System Architecture & Tech Stack

| Domain | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React | ^19.2.8 | Declarative UI, Concurrent Mode, React 19 hooks |
| **Language** | TypeScript | ~6.0.2 | Strict static typing across all bio-engines and domain models |
| **Tooling & Bundler** | Vite | ^8.3.0 | Instant ESM development server and Rollup production builds |
| **Styling** | Tailwind CSS v4 | ^4.3.3 | Modern CSS theme variables and utility-first layout |
| **3D Rendering** | Three.js | ^0.186.1 | WebGL scene graph, shaders, geometry, and lighting |
| **React 3D Bridge** | React Three Fiber | ^9.8.2 | React fiber renderer for Three.js |
| **3D Ecosystem** | @react-three/drei | ^10.7.9 | Camera controls, orbit manipulation, environment helpers |
| **Icons** | Lucide React | ^1.59.0 | Minimalist laboratory and scientific iconography |
| **Linter** | Oxlint | ^1.81.0 | Fast Rust-based linter |

### Architectural Pattern: Hexagonal / Ports & Adapters
- `IBioEngineService` (in `src/engines/types.ts`) defines the port contract.
- `LocalBioEngineService` (in `src/engines/service.ts`) provides client-side, zero-latency execution.
- `RemotePythonBioEngineService` provides the drop-in blueprint for Year 2 remote molecular dynamics / PyTorch backend connectivity.

---

## 3. Mathematical & Biophysical Formalisms

### 3.1 CRISPR Deamination & Heuristic Guide Scoring
- **Deaminase Activity Window:** Positions 4 to 8 (1-indexed from 5' end of spacer).
- **Base Substitutions:**
  - ABE8e: Converts A -> G (Antisense target converts T -> C on sense strand).
  - BE4max: Converts C -> T (Antisense target converts G -> A on sense strand).
- **Composite Score Formula:**
  Score = S_pam + S_gc +/- S_target - S_bystander - S_snp
  - Canonical NGG PAM: 65 pts; Relaxed NAG PAM: 48 pts.
  - GC Sweet Spot (40–60%): +15 pts.
  - Target In Window: +35 pts (Missing Target: -25 pts).
  - Premature Nonsense Stop Codon: -45 pts; Missense Mutation: -25 pts; Silent/Synonymous: +4 pts.
  - South Asian SNP Collision: -20 pts.
  - Clamped to [5, 99].

### 3.2 LNP Formulation Biophysics & CMC
- **Stoichiometric Balance:**
  Cholesterol (mol%) = 100.0 - (Ionizable + DSPC + PEG)
- **Hydrodynamic Diameter (Dh in nm):**
  Dh = round(135 - 24 * ln(max(0.3, X_peg * 2.2)) + (6 - N/P) * 3.5)
- **Henderson-Hasselbalch Ionization:**
  Protonation (%) = 100 / (1 + 10^(pH - pKa))
- **Zeta Potential (zeta in mV at pH 7.4):**
  zeta = (Protonation_pH7.4 * 0.35) - (X_peg * 2.1)
- **De Gennes Polymer Brush Regime (Rf / D):**
  - Flory radius: Rf ~ 3.43 nm
  - Grafting distance: D = sqrt(0.65 / X_peg)
  - Rf / D < 1.0: Mushroom regime (gaps present for ApoE adsorption)
  - Rf / D >= 1.0: Dense brush regime (steric hindrance shields against ApoE)
- **Israelachvili Critical Packing Parameter (CPP at pH 5.5):**
  CPP = 1.08 + (Protonation_pH5.5 / 100) * 0.58
  (CPP >= 1.45 implies transition to inverted hexagonal H_II phase triggering endosomal membrane rupture).
- **SAXS Repeat Spacing:**
  d_saxs = 6.45 - (N/P - 3) * 0.08 nm

### 3.3 Microfluidic Wet-Lab Mass Balance
- Total mRNA: M_mrna = V * C_mrna (mg).
- Phosphate moles: n_phosphate = M_mrna / 330 mmol.
- Ionizable lipid moles: n_ionizable = n_phosphate * (N/P).
- Total lipid moles: n_total = n_ionizable / (X_ionizable / 100).
- Molecular weights: Ionizable (710.2 g/mol), DSPC (790.15 g/mol), Cholesterol (386.65 g/mol), DMG-PEG2000 (2509.2 g/mol).

---

## 4. Complete Source Code Repository

### 4.1 `package.json`
**Description:** Project configuration, dependencies, and script definitions
**Path:** `package.json`

```json
{
  "name": "nanocrisper-3d-with-intigrated-immunoshield-dra",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "license": "Apache-2.0",
  "author": "Arunabha Ghosh",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
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

### 4.2 `vite.config.ts`
**Description:** Vite build tooling configuration with React and Tailwind plugins
**Path:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})

```

---

### 4.3 `tsconfig.app.json`
**Description:** Application TypeScript compiler options and strict rules
**Path:** `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}

```

---

### 4.4 `index.html`
**Description:** Root HTML entry point loading Google fonts and canvas container
**Path:** `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NanoCRISPR-3D | Integrated ImmunoShield DRA</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Grotesk:wght@500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

---

### 4.5 `src/styles/tokens.ts`
**Description:** Centralized scientific design tokens, colors, radius, and typography
**Path:** `src/styles/tokens.ts`

```typescript
// src/styles/tokens.ts
export const tokens = {
  colors: {
    // Warm carbon & dark espresso-ink surfaces (replaces cold blue-greys)
    canvas: '#12110f',
    surface: '#181613',
    surfaceSubtle: '#151310',
    surfaceRaised: '#211e1a',
    surfaceHover: '#2a2621',
    surfaceSelected: '#2c251d',

    // Warm rules & hairlines
    border: '#332e27',
    borderMuted: '#24201b',
    borderFocus: '#b88644',

    // Parchment, warm bone, and sepia-grey typography
    textPrimary: '#e8dfd1',
    textSecondary: '#a69b8d',
    textMuted: '#70675c',
    textInverse: '#12110f',

    // Primary Mineral Accent: Vintage Petrol / Prussian Blue
    accent: '#4d828f',
    accentHover: '#5e96a3',
    accentSubdued: 'rgba(77, 130, 143, 0.16)',
    accentBorder: '#4d828f',

    // Vintage Pigment Status Colors (Verdigris, Raw Ochre, Cinnabar/Terracotta)
    status: {
      success: '#5e946c',       // Oxidized Verdigris / Sage
      successSubtle: 'rgba(94, 148, 108, 0.15)',
      warning: '#c98a3b',       // Raw Sienna / Vintage Ochre
      warningSubtle: 'rgba(201, 138, 59, 0.15)',
      danger: '#bd5142',        // Cinnabar / Terracotta Red
      dangerSubtle: 'rgba(189, 81, 66, 0.15)',
    },

    // Molecular & Nucleotide Pigments (for 3D LNP & Sequence Tracks)
    pigments: {
      ochre: '#cfa052',         // Ionizable amine heads / Guanine
      ivory: '#d9cdb8',         // DSPC phosphocholine heads
      terracotta: '#b85b46',    // Cholesterol sterols / Thymine
      petrol: '#528796',        // PEG-2000 corona / Cytosine
      verdigris: '#639972',     // Protonated mRNA core / Adenine
      mauve: '#9e6778',         // ApoE 4-helix opsonins / Cas9 RNP lobes
      bronze: '#54493b',        // Hydrophobic sn-1/sn-2 acyl tails
    },

    // Sequence track highlights (harmonized with vintage pigment palette)
    sequence: {
      targetBg: 'rgba(189, 81, 66, 0.22)',
      targetText: '#e27b6c',
      snpBg: 'rgba(201, 138, 59, 0.22)',
      snpText: '#df9e51',
      guideWindowBg: 'rgba(77, 130, 143, 0.25)',
      guideWindowText: '#98c2cc',
      protospacerUnderline: '#4d828f',
    },
  },
  radius: '3px',

  // Spacing scale (multiples of 4px)
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
  },

  // Typography scale
  typography: {
    fontSans: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontDisplay: '"Space Grotesk", sans-serif',
    fontMono: '"IBM Plex Mono", "JetBrains Mono", Menlo, Consolas, monospace',
    size: {
      xs: '11px',    // metadata, labels, table data, tags
      sm: '12px',    // body text, controls, inputs
      base: '13px',  // section headers, prominent values
      md: '14px',    // subsection titles, main controls
      lg: '16px',    // page/target header
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.45,
      relaxed: 1.6,
    },
  },
} as const;

export type Tokens = typeof tokens;

```

---

### 4.6 `src/index.css`
**Description:** Tailwind CSS v4 theme variables and global styles
**Path:** `src/index.css`

```css
@import "tailwindcss";

@theme {
  --font-sans: "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "IBM Plex Mono", "JetBrains Mono", Menlo, Consolas, monospace;
}

:root {
  --font-sans: "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "IBM Plex Mono", "JetBrains Mono", Menlo, Consolas, monospace;

  --color-canvas: #12110f;
  --color-surface: #181613;
  --color-surface-subtle: #151310;
  --color-surface-raised: #211e1a;
  --color-surface-hover: #2a2621;
  --color-border: #332e27;
  --color-border-muted: #24201b;
  --color-text-primary: #e8dfd1;
  --color-text-secondary: #a69b8d;
  --color-text-muted: #70675c;
  --color-accent: #4d828f;
  --color-accent-hover: #5e96a3;
  --color-status-success: #5e946c;
  --color-status-warning: #c98a3b;
  --color-status-danger: #bd5142;
  --radius-default: 3px;
}

body {
  background-color: var(--color-canvas);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
}

/* Distinctive scientific display font for headings, badges & metrics */
.font-display {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

/* Monospace font for genomic sequences and numerical telemetry */
.font-mono-seq {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

/* Flat scientific sliders */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: #211e1a;
  height: 4px;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: #4d828f;
  cursor: pointer;
  border: 1px solid #5e96a3;
  transition: background 0.1s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #5e96a3;
}

input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: #4d828f;
  cursor: pointer;
  border: 1px solid #5e96a3;
}

/* Subtle flat scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #12110f;
}

::-webkit-scrollbar-thumb {
  background: #2a2621;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #332e27;
}

```

---

### 4.7 `src/App.css`
**Description:** Auxiliary styling, hero effects, and interactive animations
**Path:** `src/App.css`

```css
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}

```

---

### 4.8 `src/engines/types.ts`
**Description:** Domain models, interfaces, and service contracts for the bio-engines
**Path:** `src/engines/types.ts`

```typescript
// src/engines/types.ts
// Domain Types and Contracts for NanoCRISPR-3D

export interface GenePreset {
  id: string;
  symbol: string;
  name: string;
  disease: string;
  targetOrgan: 'Liver' | 'Bone Marrow (HSPC)' | 'Lung';
  editorType: 'ABE8e (A→G)' | 'BE4max (C→T)';
  sequence: string; // Coding sequence (CDS) snippet aligned to reading frame (0-indexed)
  mutationIndex: number; // 0-based nucleotide index of pathogenic mutation
  sasSnpIndex: number; // Common South Asian (IndiGen/1000G SAS) polymorphism index
  sasSnpId: string;
  sasAlleleFreq: number;
  clinicalNote: string;
}

export interface BystanderEdit {
  guidePos: number; // 1-20
  genomicIndex: number;
  originalCodon: string;
  editedCodon: string;
  originalAA: string;
  editedAA: string;
  classification: 'Target Edit' | 'Silent (Synonymous)' | 'Missense (Pathogenic Risk)' | 'Nonsense (Premature Stop)';
}

export interface GuideCandidate {
  id: string;
  spacer: string;
  pam: string;
  strand: '+' | '-';
  startIndex: number;
  gcContent: number;
  targetInWindow: boolean;
  bystanders: BystanderEdit[];
  hasSasSnpCollision: boolean;
  CompositeScore: number;
  verdict: 'Optimal Clinical Guide' | 'Safe (Silent Bystander)' | 'High Risk (Bystander/SNP)' | 'Low Efficiency';
}

export interface CloningOligos {
  forwardOligo: string; // 5'-CACC-[G?]-spacer-3'
  reverseOligo: string; // 5'-AAAC-[spacerRC]-[C?]-3'
  overhangSystem: string;
}

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
  deGennesRfOverD?: number;        // Flory radius / grafting distance (>1.0 = Dense Brush)
  criticalPackingParam?: number;   // Israelachvili CPP at pH 5.5 (>1.45 = H_II hexagonal phase)
  saxsBraggSpacingNm?: number;     // Core RNA-lipid lamellar/H_II repeat distance (~5.8-6.4 nm)
  organTropism: {
    liver: number;
    spleen: number;
    lungs: number;
  };
  stabilityStatus: 'Optimal Clinical LNP' | 'PEG Stealth Dilemma (Low Uptake)' | 'Aggregation Risk (Too Large)' | 'Poor Endosomal Escape';
}

export interface BatchMassCalculation {
  targetVolumeMl: number;
  mrnaConcMgMl: number;
  totalMrnaMassMg: number;
  totalLipidMassMg: number;
  components: {
    name: string;
    role: string;
    molarPct: number;
    mw: number;
    massMg: number;
    molarConcMm: number;
  }[];
}

export interface EpitopeHotspot {
  peptide: string;
  residueRange: string;
  domain: string;
  hlaAllele: string;
  bindingScore: number; // IC50 proxy (0-100 risk)
  stealthMutation: string;
  catalyticSafe: boolean;
}

/**
 * Universal Bio-Engine Service Contract (Port in Hexagonal Architecture).
 * Enables drop-in replacement with a Python/FastAPI or WebAssembly service in Year 2.
 */
export interface IBioEngineService {
  scanGuides(preset: GenePreset): GuideCandidate[];
  generateCloningOligos(spacer: string): CloningOligos;
  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult;
  calculateBatchMasses(form: LnpFormulation, targetVolumeMl?: number, mrnaConcMgMl?: number): BatchMassCalculation;
  translateSequence(seq: string): string;
  reverseComplement(seq: string): string;
  getEpitopeHotspots(): EpitopeHotspot[];
}

```

---

### 4.9 `src/engines/presets.ts`
**Description:** Curated disease loci (HBB, PCSK9, TTR) with SAS genomic polymorphism metadata
**Path:** `src/engines/presets.ts`

```typescript
// src/engines/presets.ts
import type { GenePreset } from './types';

export const GENE_PRESETS: GenePreset[] = [
  {
    id: 'HBB',
    symbol: 'HBB (Exon 1)',
    name: 'Hemoglobin Subunit Beta',
    disease: 'Beta-Thalassemia / Sickle Cell Disease (HbS E6V)',
    targetOrgan: 'Bone Marrow (HSPC)',
    editorType: 'ABE8e (A→G)',
    // Codon-aligned sequence around HBB Glu6Val (GTG -> GAG via antisense or Makassar GCG)
    sequence: 'ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAG',
    mutationIndex: 19,
    sasSnpIndex: 32,
    sasSnpId: 'rs10768683 (SAS Variant)',
    sasAlleleFreq: 0.142,
    clinicalNote: 'High prevalence in West Bengal & Eastern India. Converts pathogenic HbS (GTG) to benign HbG-Makassar (GCG) via Adenine Base Editing.'
  },
  {
    id: 'PCSK9',
    symbol: 'PCSK9 (Exon 1 Splice Donor)',
    name: 'Proprotein Convertase Subtilisin/Kexin Type 9',
    disease: 'Familial Hypercholesterolemia (VERVE-101 Benchmark)',
    targetOrgan: 'Liver',
    editorType: 'ABE8e (A→G)',
    sequence: 'ATGGGCACCGTCAGCTCCAGGCAGTCCTGGTGGCCGGGGCCACTGCTGCTGCTGCTGCTGCTGCTCCTGGGTCCCGCGGGCGCCCGTGCGC',
    mutationIndex: 22,
    sasSnpIndex: 45,
    sasSnpId: 'rs505151 (SAS G670E proxy)',
    sasAlleleFreq: 0.089,
    clinicalNote: 'Disrupts PCSK9 hepatic expression via LNP-delivered mRNA base editor to permanently lower LDL cholesterol.'
  },
  {
    id: 'TTR',
    symbol: 'TTR (Exon 2)',
    name: 'Transthyretin (V30M)',
    disease: 'Hereditary ATTR Amyloidosis (NTLA-2001 Benchmark)',
    targetOrgan: 'Liver',
    editorType: 'BE4max (C→T)',
    sequence: 'ATGGCTTCTCATCGTCTGCTCCTCCTCTGCCTTGCTGGACTGGTATTTGTGTCTGAGGCTGGCCCTACGGGCACCGGTGAATCCAAGTGTCCT',
    mutationIndex: 43,
    sasSnpIndex: 52,
    sasSnpId: 'rs76992529 (SAS TTR Variant)',
    sasAlleleFreq: 0.054,
    clinicalNote: 'Hepatic LNP delivery silences misfolded transthyretin protein production in serum.'
  }
];

```

---

### 4.10 `src/engines/crispr/guideScanner.ts`
**Description:** Dual-strand protospacer discovery, window 4-8 deamination, and codon audit
**Path:** `src/engines/crispr/guideScanner.ts`

```typescript
// src/engines/crispr/guideScanner.ts
import type { GenePreset, GuideCandidate, BystanderEdit } from '../types';

export const CODON_TABLE: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L', CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M', GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S', CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T', GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*', CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K', GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W', CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R', GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G'
};

export function translateSequence(seq: string): string {
  let protein = '';
  for (let i = 0; i <= seq.length - 3; i += 3) {
    const codon = seq.slice(i, i + 3);
    protein += CODON_TABLE[codon] || '?';
  }
  return protein;
}

export function reverseComplement(seq: string): string {
  const map: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C', N: 'N' };
  return seq
    .toUpperCase()
    .split('')
    .reverse()
    .map((c) => map[c] || c)
    .join('');
}

/**
 * Dual-Strand Codon-Aware CRISPR & Base Editor Discovery Engine.
 * Scans both sense (+) and antisense (-) strands for 20nt protospacers with NGG/NAG PAMs,
 * maps deamination activity inside the 4-8 window, assesses bystander codon consequences,
 * and prioritizes guides covering the pathogenic target mutation.
 */
export function scanForGuides(preset: GenePreset): GuideCandidate[] {
  const seq = preset.sequence.toUpperCase();
  const candidates: GuideCandidate[] = [];
  const targetBase = preset.editorType.startsWith('ABE') ? 'A' : 'C';
  const replacementBase = preset.editorType.startsWith('ABE') ? 'G' : 'T';

  // 1. Scan Sense (+) Strand
  for (let i = 0; i <= seq.length - 23; i++) {
    const spacer = seq.slice(i, i + 20);
    const pam = seq.slice(i + 20, i + 23);

    const isCanonicalPam = pam[1] === 'G' && pam[2] === 'G';
    const isRelaxedPam = pam[1] === 'G';
    if (!isCanonicalPam && !isRelaxedPam) continue;

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;

    // Base editor deaminase window is positions 4 to 8 (1-indexed from 5' end of spacer)
    for (let pos = 4; pos <= 8; pos++) {
      const genomicIdx = i + (pos - 1);
      if (genomicIdx < 0 || genomicIdx >= seq.length) continue;

      const currentBaseOnStrand = seq[genomicIdx];
      if (currentBaseOnStrand === targetBase) {
        const codonStart = Math.floor(genomicIdx / 3) * 3;
        const offsetInCodon = genomicIdx - codonStart;
        const originalCodon = seq.slice(codonStart, codonStart + 3);
        if (originalCodon.length < 3) continue;

        const editedCodon =
          originalCodon.slice(0, offsetInCodon) +
          replacementBase +
          originalCodon.slice(offsetInCodon + 1);

        const origAA = CODON_TABLE[originalCodon] || '?';
        const editAA = CODON_TABLE[editedCodon] || '?';

        const isTarget = genomicIdx === preset.mutationIndex;
        if (isTarget) targetInWindow = true;

        let classification: BystanderEdit['classification'] = 'Missense (Pathogenic Risk)';
        if (isTarget) {
          classification = 'Target Edit';
        } else if (editAA === '*') {
          classification = 'Nonsense (Premature Stop)';
        } else if (origAA === editAA) {
          classification = 'Silent (Synonymous)';
        }

        edits.push({
          guidePos: pos,
          genomicIndex: genomicIdx,
          originalCodon,
          editedCodon,
          originalAA: origAA,
          editedAA: editAA,
          classification,
        });
      }
    }

    const hasSasSnpCollision = preset.sasSnpIndex >= i && preset.sasSnpIndex <= i + 22;

    let score = isCanonicalPam ? 65 : 48;
    if (gcContent >= 40 && gcContent <= 60) score += 15;

    // Prioritize guides that actually cover the pathogenic target (+35 boost / -25 miss penalty)
    if (targetInWindow) {
      score += 35;
    } else {
      score -= 25;
    }

    let hasHarmfulBystander = false;
    let hasSilentBystander = false;

    for (const e of edits) {
      if (e.classification === 'Nonsense (Premature Stop)') {
        score -= 45;
        hasHarmfulBystander = true;
      } else if (e.classification === 'Missense (Pathogenic Risk)') {
        score -= 25;
        hasHarmfulBystander = true;
      } else if (e.classification === 'Silent (Synonymous)') {
        score += 4;
        hasSilentBystander = true;
      }
    }

    if (hasSasSnpCollision) score -= 20;
    score = Math.max(5, Math.min(99, score));

    let verdict: GuideCandidate['verdict'] = 'Low Efficiency';
    if (targetInWindow && !hasHarmfulBystander && !hasSasSnpCollision) {
      verdict = hasSilentBystander ? 'Safe (Silent Bystander)' : 'Optimal Clinical Guide';
    } else if (hasHarmfulBystander || hasSasSnpCollision) {
      verdict = 'High Risk (Bystander/SNP)';
    }

    candidates.push({
      id: `sgRNA-f${i + 1}`,
      spacer,
      pam,
      strand: '+',
      startIndex: i,
      gcContent,
      targetInWindow,
      bystanders: edits,
      hasSasSnpCollision,
      CompositeScore: score,
      verdict,
    });
  }

  // 2. Scan Antisense (-) Strand (Spanning sense indices i to i + 19, 5' at i + 19 counting backwards toward i)
  for (let i = 0; i <= seq.length - 20; i++) {
    const spacer = reverseComplement(seq.slice(i, i + 20));

    // Determine PAM: check 3' on antisense (sense i-3..i) or downstream sense (i+20..i+23)
    let pam = '';
    let isCanonicalPam = false;
    let isRelaxedPam = false;

    if (i >= 3) {
      const p1 = reverseComplement(seq.slice(i - 3, i));
      if (p1[1] === 'G') {
        pam = p1;
        isCanonicalPam = p1[1] === 'G' && p1[2] === 'G';
        isRelaxedPam = true;
      }
    }

    if (!pam && i <= seq.length - 23) {
      const p2 = reverseComplement(seq.slice(i + 20, i + 23));
      if (p2[1] === 'G') {
        pam = p2;
        isCanonicalPam = p2[1] === 'G' && p2[2] === 'G';
        isRelaxedPam = true;
      }
    }

    if (!isCanonicalPam && !isRelaxedPam) continue;

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;

    // Antisense deaminase window positions 4 to 8:
    // Positions 4..8 from 5' end correspond to sense indices (i + 19) - 3 down to (i + 19) - 7
    for (let pos = 4; pos <= 8; pos++) {
      const genomicIdx = (i + 19) - (pos - 1);
      if (genomicIdx < 0 || genomicIdx >= seq.length) continue;

      const senseBase = seq[genomicIdx];
      const currentBaseOnStrand = reverseComplement(senseBase);

      if (currentBaseOnStrand === targetBase) {
        const codonStart = Math.floor(genomicIdx / 3) * 3;
        const offsetInCodon = genomicIdx - codonStart;
        const originalCodon = seq.slice(codonStart, codonStart + 3);
        if (originalCodon.length < 3) continue;

        // Antisense A->G produces sense T->C; Antisense C->T produces sense G->A
        const senseReplacement = targetBase === 'A' ? 'C' : 'A';
        const editedCodon =
          originalCodon.slice(0, offsetInCodon) +
          senseReplacement +
          originalCodon.slice(offsetInCodon + 1);

        const origAA = CODON_TABLE[originalCodon] || '?';
        const editAA = CODON_TABLE[editedCodon] || '?';

        const isTarget = genomicIdx === preset.mutationIndex;
        if (isTarget) targetInWindow = true;

        let classification: BystanderEdit['classification'] = 'Missense (Pathogenic Risk)';
        if (isTarget) {
          classification = 'Target Edit';
        } else if (editAA === '*') {
          classification = 'Nonsense (Premature Stop)';
        } else if (origAA === editAA) {
          classification = 'Silent (Synonymous)';
        }

        edits.push({
          guidePos: pos,
          genomicIndex: genomicIdx,
          originalCodon,
          editedCodon,
          originalAA: origAA,
          editedAA: editAA,
          classification,
        });
      }
    }

    const hasSasSnpCollision = preset.sasSnpIndex >= i && preset.sasSnpIndex < i + 19;

    let score = isCanonicalPam ? 65 : 48;
    if (gcContent >= 40 && gcContent <= 60) score += 15;

    // Prioritize guides that actually cover the pathogenic target (+35 boost / -25 miss penalty)
    if (targetInWindow) {
      score += 35;
    } else {
      score -= 25;
    }

    let hasHarmfulBystander = false;
    let hasSilentBystander = false;

    for (const e of edits) {
      if (e.classification === 'Nonsense (Premature Stop)') {
        score -= 45;
        hasHarmfulBystander = true;
      } else if (e.classification === 'Missense (Pathogenic Risk)') {
        score -= 25;
        hasHarmfulBystander = true;
      } else if (e.classification === 'Silent (Synonymous)') {
        score += 4;
        hasSilentBystander = true;
      }
    }

    if (hasSasSnpCollision) score -= 20;
    score = Math.max(5, Math.min(99, score));

    let verdict: GuideCandidate['verdict'] = 'Low Efficiency';
    if (targetInWindow && !hasHarmfulBystander && !hasSasSnpCollision) {
      verdict = hasSilentBystander ? 'Safe (Silent Bystander)' : 'Optimal Clinical Guide';
    } else if (hasHarmfulBystander || hasSasSnpCollision) {
      verdict = 'High Risk (Bystander/SNP)';
    }

    candidates.push({
      id: `sgRNA-r${i + 1}`,
      spacer,
      pam,
      strand: '-',
      startIndex: i,
      gcContent,
      targetInWindow,
      bystanders: edits,
      hasSasSnpCollision,
      CompositeScore: score,
      verdict,
    });
  }

  return candidates.sort((a, b) => b.CompositeScore - a.CompositeScore).slice(0, 10);
}

```

---

### 4.11 `src/engines/crispr/oligoGenerator.ts`
**Description:** BsmBI / Esp3I Type IIS Golden Gate cloning oligonucleotide generator
**Path:** `src/engines/crispr/oligoGenerator.ts`

```typescript
// src/engines/crispr/oligoGenerator.ts
import type { CloningOligos } from '../types';
import { reverseComplement } from './guideScanner';

/**
 * Oligo synthesis order generator for BsmBI / BpiI (Esp3I) Golden Gate cloning.
 * Appends 5'-CACC overhang to forward strand (ensuring a 5'-G for human U6 promoter transcription initiation),
 * and complementary 5'-AAAC overhang to reverse strand.
 */
export function generateCloningOligos(spacer: string): CloningOligos {
  const needsG = spacer[0] !== 'G';
  const fwdCore = (needsG ? 'G' : '') + spacer;
  const forwardOligo = `CACC${fwdCore}`;
  const reverseOligo = `AAAC${reverseComplement(fwdCore)}`;

  return {
    forwardOligo: `5'-${forwardOligo}-3'`,
    reverseOligo: `5'-${reverseOligo}-3'`,
    overhangSystem: 'BsmBI / BpiI (Esp3I)'
  };
}

```

---

### 4.12 `src/engines/immunology/hlaScanner.ts`
**Description:** ImmunoShield South Asian HLA epitope catalog and de-immunization mutations
**Path:** `src/engines/immunology/hlaScanner.ts`

```typescript
// src/engines/immunology/hlaScanner.ts
import type { EpitopeHotspot } from '../types';

/**
 * ImmunoShield MHC-I (South Asian HLA Panel) Epitope Catalog.
 * Curates pre-existing immunogenic Cas9 peptides against high-frequency
 * HLA-A and HLA-B alleles in South Asian (SAS) populations, along with
 * structure-guided de-immunization mutations that preserve catalytic activity.
 */
export const CAS9_EPITOPE_HOTSPOTS: EpitopeHotspot[] = [
  {
    peptide: 'NLIALSLGL',
    residueRange: 'aa 236–244',
    domain: 'REC2 Domain',
    hlaAllele: 'HLA-A*02:01 / HLA-A*24:02 (Common Indian)',
    bindingScore: 92,
    stealthMutation: 'L240T (Disrupts MHC-I anchor pocket B without touching DNA groove)',
    catalyticSafe: true
  },
  {
    peptide: 'KTYAHLFDD',
    residueRange: 'aa 836–844',
    domain: 'HNH Catalytic Core (Contains H840)',
    hlaAllele: 'HLA-A*11:01 (High South Asian Frequency ~21%)',
    bindingScore: 84,
    stealthMutation: 'K836R (Preserves H840 active-site histidine required for strand nicking)',
    catalyticSafe: true
  },
  {
    peptide: 'IYLAAANRL',
    residueRange: 'aa 1012–1020',
    domain: 'RuvC-III Domain',
    hlaAllele: 'HLA-A*24:02 (South Asian Frequency ~18%)',
    bindingScore: 88,
    stealthMutation: 'L1020G (Eliminates C-terminal anchor binding to HLA groove)',
    catalyticSafe: true
  },
  {
    peptide: 'FEDFLKNRM',
    residueRange: 'aa 418–426',
    domain: 'Bridge Helix (Structural Stability)',
    hlaAllele: 'HLA-B*40:06 (High Dravidian / SAS Frequency ~14%)',
    bindingScore: 81,
    stealthMutation: 'F421A (Masks hydrophobic anchor while preserving alpha-helical backbone)',
    catalyticSafe: true
  },
  {
    peptide: 'TLYETRRDL',
    residueRange: 'aa 674–682',
    domain: 'REC3 Domain (Target RNA Alignment)',
    hlaAllele: 'HLA-B*15:02 (High Indo-Aryan SAS Frequency ~12%)',
    bindingScore: 78,
    stealthMutation: 'L675S (Ablates C-terminal peptide binding to MHC cleft)',
    catalyticSafe: true
  }
];

/**
 * Calculates composite residual HLA immunogenicity risk score.
 * An un-engineered Cas9 starts at ~85/100 risk.
 * Each active stealth mutation reduces the epitope risk score.
 */
export function calculateHlaRiskScore(activeEpitopes: EpitopeHotspot[] = CAS9_EPITOPE_HOTSPOTS): number {
  if (activeEpitopes.length === 0) return 0;
  const avg = activeEpitopes.reduce((acc, ep) => acc + ep.bindingScore, 0) / activeEpitopes.length;
  return Math.round(avg);
}

```

---

### 4.13 `src/engines/nanotech/lnpSimulator.ts`
**Description:** LNP biophysics simulation: Dh, PDI, Henderson-Hasselbalch, de Gennes, and SORT
**Path:** `src/engines/nanotech/lnpSimulator.ts`

```typescript
// src/engines/nanotech/lnpSimulator.ts
import type { LnpFormulation, LnpBiophysicsResult } from '../types';

/**
 * Nanotech LNP Biophysical & CMC Simulation Engine.
 * Models multi-component lipid nanoparticle assembly:
 * - Hydrodynamic diameter ($D_h$) from PEG-lipid surface curvature constraints
 * - Polydispersity index (PDI)
 * - Henderson-Hasselbalch protonation at systemic pH 7.4 vs. endosomal pH 5.5
 * - Zeta potential ($\zeta$) in mV
 * - De Gennes polymer brush regime ($R_F / D$)
 * - Israelachvili Critical Packing Parameter (CPP) for lamellar-to-inverted-hexagonal ($H_{\text{II}}$) transition
 * - SAXS core Bragg diffraction repeat distance ($d_{\text{SAXS}}$)
 * - Cellular uptake score (modelling the "PEG Dilemma" & ApoE adsorption)
 * - SORT (Selective Organ Targeting) biodistribution
 */
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

  // De Gennes PEG2000 Brush Ratio: R_F (3.43 nm) / D (sqrt(0.65 / X_peg))
  const pegMolFraction = Math.max(0.002, normPeg / 100);
  const graftingDist = Math.sqrt(0.65 / pegMolFraction);
  const deGennesRfOverD = Number((3.43 / graftingDist).toFixed(2));

  // Israelachvili Critical Packing Parameter (CPP) in late endosome (pH 5.5)
  const criticalPackingParam = Number((1.08 + (endosomalProtonationPct / 100) * 0.58).toFixed(2));

  // SAXS q_1 Bragg Peak Repeat Spacing (nm)
  const saxsBraggSpacingNm = Number((6.45 - (form.npRatio - 3) * 0.08).toFixed(2));

  return {
    diameterNm,
    pdi,
    zetaPotentialMv,
    endosomalProtonationPct,
    bloodProtonationPct,
    endosomalEscapeEfficiency,
    cellularUptakeScore,
    deGennesRfOverD,
    criticalPackingParam,
    saxsBraggSpacingNm,
    organTropism: { liver, spleen, lungs },
    stabilityStatus
  };
}

```

---

### 4.14 `src/engines/nanotech/batchCalculator.ts`
**Description:** Microfluidic wet-lab batch mass and molarity calculation engine
**Path:** `src/engines/nanotech/batchCalculator.ts`

```typescript
// src/engines/nanotech/batchCalculator.ts
import type { LnpFormulation, BatchMassCalculation } from '../types';

/**
 * Wet-lab mass & batch preparation calculator for microfluidic hydrodynamic focusing.
 * Translates target mRNA concentration and N/P charge ratio into exact milligram quantities
 * and millimolar concentrations for organic ethanol and aqueous phases.
 */
export function calculateBatchMasses(
  form: LnpFormulation,
  targetVolumeMl: number = 10,
  mrnaConcMgMl: number = 1.0
): BatchMassCalculation {
  const totalMrnaMassMg = Number((targetVolumeMl * mrnaConcMgMl).toFixed(2));
  // Moles of phosphate (avg nucleotide MW in mRNA is ~330 g/mol)
  const mmolesPhosphate = totalMrnaMassMg / 330;
  // Required moles of ionizable nitrogen based on N/P ratio
  const mmolesIonizable = mmolesPhosphate * form.npRatio;
  const totalLipidMmoles = mmolesIonizable / (form.ionizableLipid / 100);

  const MW_IONIZABLE = 710.2;
  const MW_DSPC = 790.15;
  const MW_CHOL = 386.65;
  const MW_PEG = 2509.2; // DMG-PEG2000

  const mmolesDspc = totalLipidMmoles * (form.dspcHelper / 100);
  const mmolesChol = totalLipidMmoles * (form.cholesterol / 100);
  const mmolesPeg = totalLipidMmoles * (form.pegLipid / 100);

  const massIonizable = Number((mmolesIonizable * MW_IONIZABLE).toFixed(2));
  const massDspc = Number((mmolesDspc * MW_DSPC).toFixed(2));
  const massChol = Number((mmolesChol * MW_CHOL).toFixed(2));
  const massPeg = Number((mmolesPeg * MW_PEG).toFixed(2));
  const totalLipidMassMg = Number((massIonizable + massDspc + massChol + massPeg).toFixed(2));

  const volLiters = targetVolumeMl / 1000;

  return {
    targetVolumeMl,
    mrnaConcMgMl,
    totalMrnaMassMg,
    totalLipidMassMg,
    components: [
      {
        name: 'Ionizable Lipid (SM-102 proxy)',
        role: 'mRNA complexation & endosomal escape',
        molarPct: form.ionizableLipid,
        mw: MW_IONIZABLE,
        massMg: massIonizable,
        molarConcMm: Number((mmolesIonizable / volLiters).toFixed(2))
      },
      {
        name: 'DSPC (Helper Lipid)',
        role: 'Bilayer structural support',
        molarPct: form.dspcHelper,
        mw: MW_DSPC,
        massMg: massDspc,
        molarConcMm: Number((mmolesDspc / volLiters).toFixed(2))
      },
      {
        name: 'Cholesterol',
        role: 'Membrane fluidity & particle rigidity',
        molarPct: form.cholesterol,
        mw: MW_CHOL,
        massMg: massChol,
        molarConcMm: Number((mmolesChol / volLiters).toFixed(2))
      },
      {
        name: 'DMG-PEG2000 (Stealth Lipid)',
        role: 'Colloidal stability & steric hindrance',
        molarPct: form.pegLipid,
        mw: MW_PEG,
        massMg: massPeg,
        molarConcMm: Number((mmolesPeg / volLiters).toFixed(2))
      }
    ]
  };
}

```

---

### 4.15 `src/engines/service.ts`
**Description:** Hexagonal service layer: Local in-browser service and Remote Python service stub
**Path:** `src/engines/service.ts`

```typescript
// src/engines/service.ts
import type {
  IBioEngineService,
  GenePreset,
  GuideCandidate,
  CloningOligos,
  LnpFormulation,
  LnpBiophysicsResult,
  BatchMassCalculation,
  EpitopeHotspot
} from './types';
import { scanForGuides, translateSequence, reverseComplement } from './crispr/guideScanner';
import { generateCloningOligos } from './crispr/oligoGenerator';
import { simulateLnpBiophysics } from './nanotech/lnpSimulator';
import { calculateBatchMasses } from './nanotech/batchCalculator';
import { CAS9_EPITOPE_HOTSPOTS } from './immunology/hlaScanner';

/**
 * Default In-Browser Implementation of IBioEngineService.
 * Executes analytical heuristics in real time (< 1 ms latency) on the client.
 */
export class LocalBioEngineService implements IBioEngineService {
  scanGuides(preset: GenePreset): GuideCandidate[] {
    return scanForGuides(preset);
  }

  generateCloningOligos(spacer: string): CloningOligos {
    return generateCloningOligos(spacer);
  }

  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
    return simulateLnpBiophysics(form);
  }

  calculateBatchMasses(
    form: LnpFormulation,
    targetVolumeMl: number = 10,
    mrnaConcMgMl: number = 1.0
  ): BatchMassCalculation {
    return calculateBatchMasses(form, targetVolumeMl, mrnaConcMgMl);
  }

  translateSequence(seq: string): string {
    return translateSequence(seq);
  }

  reverseComplement(seq: string): string {
    return reverseComplement(seq);
  }

  getEpitopeHotspots(): EpitopeHotspot[] {
    return CAS9_EPITOPE_HOTSPOTS;
  }
}

/**
 * Blueprint for Year 2: Remote Python / PyTorch / BioPython Backend Service.
 * In Year 2, simply change the active service provider to an instance of this class!
 * The React UI will not require a single line of change.
 *
 * Example:
 * ```ts
 * export const activeEngine: IBioEngineService = new RemotePythonBioEngineService('http://localhost:8000/api/v1');
 * ```
 */
export class RemotePythonBioEngineService implements IBioEngineService {
  private baseUrl: string;
  private localFallback: LocalBioEngineService;

  constructor(baseUrl: string = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
    this.localFallback = new LocalBioEngineService();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  scanGuides(preset: GenePreset): GuideCandidate[] {
    // In Year 2: return await fetch(`${this.baseUrl}/crispr/scan`, { method: 'POST', body: JSON.stringify(preset) }).then(r => r.json());
    // Fallback to local heuristic if offline
    return this.localFallback.scanGuides(preset);
  }

  generateCloningOligos(spacer: string): CloningOligos {
    return this.localFallback.generateCloningOligos(spacer);
  }

  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
    // In Year 2: calls Python GROMACS / PyTorch surrogate model
    return this.localFallback.simulateLnpBiophysics(form);
  }

  calculateBatchMasses(form: LnpFormulation, targetVolumeMl?: number, mrnaConcMgMl?: number): BatchMassCalculation {
    return this.localFallback.calculateBatchMasses(form, targetVolumeMl, mrnaConcMgMl);
  }

  translateSequence(seq: string): string {
    return this.localFallback.translateSequence(seq);
  }

  reverseComplement(seq: string): string {
    return this.localFallback.reverseComplement(seq);
  }

  getEpitopeHotspots(): EpitopeHotspot[] {
    return this.localFallback.getEpitopeHotspots();
  }
}

// Export default singleton instance
export const bioEngineService: IBioEngineService = new LocalBioEngineService();

```

---

### 4.16 `src/engines/index.ts`
**Description:** Barrel export for all engines and domain models
**Path:** `src/engines/index.ts`

```typescript
// src/engines/index.ts
// Central barrel export for all NanoCRISPR-3D engines and domain types

export * from './types';
export * from './presets';
export * from './service';

// CRISPR & Genetics
export * from './crispr/guideScanner';
export * from './crispr/oligoGenerator';

// Nanotechnology & CMC
export * from './nanotech/lnpSimulator';
export * from './nanotech/batchCalculator';

// ImmunoShield HLA Engineering
export * from './immunology/hlaScanner';

```

---

### 4.17 `src/engines/bioEngines.ts`
**Description:** Backward-compatibility re-export barrel
**Path:** `src/engines/bioEngines.ts`

```typescript
// src/engines/bioEngines.ts
/**
 * Backward-compatibility re-export barrel.
 * Re-exports all domain types, CRISPR scanners, LNP biophysics engines,
 * CMC calculators, HLA catalogs, and service providers from the modular engine architecture.
 */
export * from './index';

```

---

### 4.18 `src/main.tsx`
**Description:** React 19 entry point mounting the root App component in StrictMode
**Path:** `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

```

---

### 4.19 `src/components/NanoViewport3D.tsx`
**Description:** Complete 3D Lipid Nanoparticle cutaway viewport with Three.js and R3F
**Path:** `src/components/NanoViewport3D.tsx`

```tsx
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
        col.set('#528796'); // Vintage Petrol Blue (PEG Anchor)
      } else if (seed < pegFrac + dspcFrac) {
        type = 'dspc';
        headScale = 0.031;
        col.set('#d9cdb8'); // Warm Bone Ivory (DSPC Phosphocholine)
      } else if (seed < pegFrac + dspcFrac + cholFrac) {
        type = 'chol';
        headScale = 0.024;
        tailLen = shellThickness * 0.52;
        col.set('#b85b46'); // Terracotta / Burnt Sienna (Planar Cholesterol Sterol)
      } else {
        // Ionizable tertiary amine lipid: Warm Brass/Ochre at pH 7.4 -> Verdigris at pH 5.5
        if (opticalMode === 'electrostatic') {
          col.lerpColors(new THREE.Color('#cfa052'), new THREE.Color('#5e946c'), liveProtonation);
        } else if (opticalMode === 'cryo') {
          col.set('#a89f91');
        } else {
          col.lerpColors(new THREE.Color('#c49245'), new THREE.Color('#5e946c'), liveProtonation * 0.65);
        }
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
      // Warm Bronze / Umber for the dual sn-1/sn-2 hydrophobic acyl chains
      const tailColor = new THREE.Color(
        opticalMode === 'cryo' ? '#575046' : type === 'chol' ? '#6e3d32' : '#4a4033'
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
        rCols.push(new THREE.Color(isGC ? '#cfa052' : '#b85b46')); // Ochre (G-C) & Terracotta (A-U)
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
              ? tokens.colors.accent
              : '#2c251d'
            : '#211e1a'
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
            color={opticalMode === 'cryo' ? '#211e1a' : '#181613'}
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
              color="#9e6778"
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
              color="#c98a3b"
              roughness={0.42}
              metalness={0.1}
              transparent={inspectedLayer !== 'all'}
              opacity={getLayerOpacity('mrna')}
            />
          </mesh>
          <mesh geometry={sgrnaGeo}>
            <meshStandardMaterial
              color={tokens.colors.pigments.terracotta}
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
            color={tokens.colors.pigments.petrol}
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
                    color={tokens.colors.pigments.mauve}
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
      <div className="relative z-10 px-2 py-1.5 flex items-center justify-between gap-2 border-b border-[#332e27] bg-[#181613]/90 backdrop-blur-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <span
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 border font-mono text-[11px] text-[#e8dfd1] font-medium"
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
                className="px-1.5 py-0.5 text-[10px] font-medium border-r last:border-r-0 hover:text-[#e8dfd1] transition cursor-pointer"
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
                className="px-1.5 py-0.5 text-[10px] font-medium border-r last:border-r-0 hover:text-[#e8dfd1] transition cursor-pointer"
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
              style={{ accentColor: tokens.colors.accent }}
              className="w-14 h-1 cursor-pointer"
            />
            <span
              className={`font-mono font-semibold ${
                ambientPh <= 5.8 ? 'text-[#5e946c]' : 'text-[#e8dfd1]'
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
      <div className="relative z-10 px-2 py-1 flex items-center justify-between text-[10px] text-[#9aa0a6] border-b border-[#24201b] bg-[#151310]/80">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[#70675c]">Layers:</span>

          <button
            onClick={() => toggleLayer('peg')}
            onMouseEnter={() => setInspectedLayer('peg')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.peg ? 'text-[#e8dfd1]' : 'text-[#70675c] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#528796] inline-block" />
            PEG corona ({formulation.pegLipid.toFixed(1)}%)
          </button>

          <button
            onClick={() => toggleLayer('lipids')}
            onMouseEnter={() => setInspectedLayer('lipids')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.lipids ? 'text-[#e8dfd1]' : 'text-[#70675c] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#cfa052] inline-block" />
            Lipid heads (2.4k)
          </button>

          <button
            onClick={() => toggleLayer('tails')}
            onMouseEnter={() => setInspectedLayer('tails')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.tails ? 'text-[#e8dfd1]' : 'text-[#70675c] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#6e5d49] inline-block" />
            sn-1/sn-2 tails (4.8k)
          </button>

          <button
            onClick={() => toggleLayer('mrna')}
            onMouseEnter={() => setInspectedLayer('mrna')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.mrna ? 'text-[#e8dfd1]' : 'text-[#70675c] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#5e946c] inline-block" />
            RNP + dsRNA core
          </button>

          <button
            onClick={() => toggleLayer('apoe')}
            onMouseEnter={() => setInspectedLayer('apoe')}
            onMouseLeave={() => setInspectedLayer('all')}
            className={`flex items-center gap-1 transition cursor-pointer ${
              visibility.apoe ? 'text-[#e8dfd1]' : 'text-[#70675c] line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#9e6778] inline-block" />
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
        <div className="absolute bottom-2 left-2.5 pointer-events-none flex flex-col gap-0.5 text-[9px] font-mono text-[#a69b8d]">
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
            Cryo-TEM calibrated • SAXS d = 6.1 nm
          </span>
        </div>

        {/* Live Endosomal Compartment Badge (Lower Right Overlay) */}
        <div className="absolute bottom-2 right-2.5 pointer-events-none text-[9px] font-mono px-2 py-0.5 rounded border border-[#332e27] bg-[#181613]/85 text-[#a69b8d]">
          {ambientPh >= 7.1
            ? 'Systemic Blood (pH 7.4)'
            : ambientPh >= 6.0
            ? 'Early Endosome (Acidifying)'
            : 'Late Endosome (HII Membrane Disruption)'}
        </div>
      </div>

      {/* 4. Bottom Contextual Biophysical HUD Inspector */}
      <div className="relative z-10 px-2.5 py-1.5 border-t border-[#332e27] bg-[#181613]/92 flex items-center justify-between text-[11px]">
        <div className="flex flex-col gap-0.5 leading-tight">
          <div className="font-medium text-[#e8dfd1] flex items-center gap-2">
            <span>{hud.title}</span>
          </div>
          <span className="text-[10px] text-[#a69b8d]">{hud.detail}</span>
        </div>
        <div className="text-right text-[10px] font-mono text-[#70675c] shrink-0 ml-3">
          Zeta: {biophysics.zetaPotentialMv > 0 ? `+${biophysics.zetaPotentialMv}` : biophysics.zetaPotentialMv} mV • PDI: {biophysics.pdi.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

```

---

### 4.20 `src/App.tsx`
**Description:** Main dual-workstation application interface connecting all engines and UI
**Path:** `src/App.tsx`

```tsx
// src/App.tsx
import { useState, useMemo } from 'react';
import {
  GENE_PRESETS,
  scanForGuides,
  simulateLnpBiophysics,
  translateSequence,
  generateCloningOligos,
  calculateBatchMasses,
  CAS9_EPITOPE_HOTSPOTS,
  type LnpFormulation,
  type GuideCandidate,
  type GenePreset
} from './engines/bioEngines';
import { NanoViewport3D } from './components/NanoViewport3D';
import { tokens } from './styles/tokens';

type SortField = 'id' | 'strand' | 'gcContent' | 'CompositeScore' | 'pam';
type SortOrder = 'asc' | 'desc';

// Helper for classic pigment-coded nucleotides (Adenine, Thymine, Guanine, Cytosine)
const getBaseColorClass = (base: string) => {
  switch (base.toUpperCase()) {
    case 'A':
      return 'text-[#73a880]'; // Vintage Verdigris / Sage
    case 'T':
      return 'text-[#cc6b5a]'; // Terracotta / Vermilion
    case 'G':
      return 'text-[#d4a359]'; // Raw Ochre / Gold
    case 'C':
      return 'text-[#6699a8]'; // Petrol Blue
    default:
      return 'text-[#e8dfd1]';
  }
};

export default function App() {
  // Preset or Custom Mode
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('HBB');
  const [customPreset, setCustomPreset] = useState<GenePreset>({
    id: 'CUSTOM',
    symbol: 'Custom Target',
    name: 'User-Defined Sequence',
    disease: 'Investigational Gene Target',
    targetOrgan: 'Liver',
    editorType: 'ABE8e (A→G)',
    sequence: 'ATGGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTC',
    mutationIndex: 18,
    sasSnpIndex: 40,
    sasSnpId: 'Novel / Unmapped Variant',
    sasAlleleFreq: 0.05,
    clinicalNote: 'Custom sequence evaluation for protospacer discovery and bystander deamination.'
  });

  const [selectedGuideIdx, setSelectedGuideIdx] = useState<number>(0);
  const [deimmunized, setDeimmunized] = useState<boolean>(true);

  // Table filtering and sorting
  const [sortField, setSortField] = useState<SortField>('CompositeScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStrand, setFilterStrand] = useState<'all' | '+' | '-'>('all');
  const [hideSnpCollisions, setHideSnpCollisions] = useState<boolean>(false);
  const [canonicalPamOnly, setCanonicalPamOnly] = useState<boolean>(false);

  // Copy feedback state for oligos
  const [copiedOligo, setCopiedOligo] = useState<'fwd' | 'rev' | null>(null);

  // Formulation parameters
  const [lnpForm, setLnpForm] = useState<LnpFormulation>({
    ionizableLipid: 50.0,
    dspcHelper: 10.0,
    cholesterol: 38.5,
    pegLipid: 1.5,
    lipidPka: 6.35,
    npRatio: 6.0
  });

  // Wet-lab batch calculator parameters
  const [batchVolumeMl, setBatchVolumeMl] = useState<number>(10.0);
  const [batchMrnaConcMgMl, setBatchMrnaConcMgMl] = useState<number>(1.0);
  const [showBatchCalc, setShowBatchCalc] = useState<boolean>(false);

  // Active target preset
  const activePreset: GenePreset = useMemo(() => {
    if (isCustomMode) return customPreset;
    return GENE_PRESETS.find((p) => p.id === selectedPresetId) || GENE_PRESETS[0];
  }, [isCustomMode, customPreset, selectedPresetId]);

  // Dual-strand guide candidates
  const allGuides = useMemo(() => scanForGuides(activePreset), [activePreset]);

  // Filtered and sorted guides
  const processedGuides = useMemo(() => {
    return allGuides
      .filter((g) => {
        if (filterStrand !== 'all' && g.strand !== filterStrand) return false;
        if (hideSnpCollisions && g.hasSasSnpCollision) return false;
        if (canonicalPamOnly && !(g.pam[1] === 'G' && g.pam[2] === 'G')) return false;
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [allGuides, filterStrand, hideSnpCollisions, canonicalPamOnly, sortField, sortOrder]);

  const selectedGuide: GuideCandidate | undefined =
    processedGuides[selectedGuideIdx] || processedGuides[0] || allGuides[0];

  // Cloning oligos for selected guide
  const cloningOligos = useMemo(() => {
    if (!selectedGuide) return null;
    return generateCloningOligos(selectedGuide.spacer);
  }, [selectedGuide]);

  // Dynamic Cholesterol balancing to strictly lock stoichiometry at 100.0%
  const effectiveCholesterol = useMemo(() => {
    return Math.max(0, Number((100 - lnpForm.ionizableLipid - lnpForm.dspcHelper - lnpForm.pegLipid).toFixed(1)));
  }, [lnpForm.ionizableLipid, lnpForm.dspcHelper, lnpForm.pegLipid]);

  const activeFormulation = useMemo<LnpFormulation>(() => ({
    ...lnpForm,
    cholesterol: effectiveCholesterol
  }), [lnpForm, effectiveCholesterol]);

  const biophysics = useMemo(() => simulateLnpBiophysics(activeFormulation), [activeFormulation]);
  const batchCalculation = useMemo(
    () => calculateBatchMasses(activeFormulation, batchVolumeMl, batchMrnaConcMgMl),
    [activeFormulation, batchVolumeMl, batchMrnaConcMgMl]
  );

  const wildTypeProtein = useMemo(
    () => translateSequence(activePreset.sequence),
    [activePreset.sequence]
  );

  // Sort toggle handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Copy oligo to clipboard
  const handleCopyOligo = (text: string, type: 'fwd' | 'rev') => {
    navigator.clipboard.writeText(text);
    setCopiedOligo(type);
    setTimeout(() => setCopiedOligo(null), 1800);
  };

  // Formulation presets
  const applyClinicalLnp = (name: 'Onpattro' | 'Moderna' | 'LungSORT') => {
    if (name === 'Onpattro') {
      setLnpForm({ ionizableLipid: 50.0, dspcHelper: 10.0, cholesterol: 38.5, pegLipid: 1.5, lipidPka: 6.4, npRatio: 6.0 });
    } else if (name === 'Moderna') {
      setLnpForm({ ionizableLipid: 50.0, dspcHelper: 10.0, cholesterol: 38.5, pegLipid: 1.5, lipidPka: 6.55, npRatio: 6.0 });
    } else {
      setLnpForm({ ionizableLipid: 55.0, dspcHelper: 12.0, cholesterol: 31.5, pegLipid: 1.5, lipidPka: 7.1, npRatio: 8.0 });
    }
  };

  // Export regulatory pre-IND summary in Markdown format
  const downloadDraDossier = () => {
    const content = `# Pre-IND CMC and Preclinical Evaluation Report
Generated by NanoCRISPR-3D Evaluation Workbench

## 1. Target Locus and Genome Editing Strategy
- Gene symbol: ${activePreset.symbol}
- Gene name: ${activePreset.name}
- Clinical indication: ${activePreset.disease}
- Target tissue: ${activePreset.targetOrgan}
- Base editor architecture: ${activePreset.editorType}
- Selected protospacer: ${selectedGuide?.id || 'sgRNA-1'} (5'-${selectedGuide?.spacer || ''}-3')
- Target strand: ${selectedGuide?.strand === '+' ? 'Sense (+)' : 'Antisense (-)'}
- PAM: ${selectedGuide?.pam || ''}
- Protospacer on-target score: ${selectedGuide?.CompositeScore || 0} / 100
- Assessment verdict: ${selectedGuide?.verdict || 'N/A'}
- South Asian population variant: ${selectedGuide?.hasSasSnpCollision ? 'Collision flagged with ' + activePreset.sasSnpId : 'Clear of common SAS polymorphisms (' + activePreset.sasSnpId + ', MAF: ' + (activePreset.sasAlleleFreq * 100).toFixed(1) + '%)'}

### Golden Gate Oligonucleotide Synthesis Order Sheet
- Enzyme overhang standard: ${cloningOligos?.overhangSystem || 'BsmBI / BpiI'}
- Forward cloning oligo: ${cloningOligos?.forwardOligo || ''}
- Reverse cloning oligo: ${cloningOligos?.reverseOligo || ''}

## 2. Lipid Nanoparticle Formulation and Biophysics
- Molar composition: ${activeFormulation.ionizableLipid}% ionizable lipid : ${activeFormulation.dspcHelper}% DSPC : ${activeFormulation.cholesterol}% cholesterol : ${activeFormulation.pegLipid}% PEG-lipid
- Ionizable lipid apparent pKa: ${activeFormulation.lipidPka}
- Amine-to-phosphate (N/P) ratio: ${activeFormulation.npRatio}
- Hydrodynamic diameter (Dh): ${biophysics.diameterNm} nm
- Polydispersity index (PDI): ${biophysics.pdi}
- Zeta potential (pH 7.4): ${biophysics.zetaPotentialMv} mV
- Protonation fraction (endosomal pH 5.5): ${biophysics.endosomalProtonationPct}%
- Protonation fraction (blood pH 7.4): ${biophysics.bloodProtonationPct}%
- Endosomal escape efficiency: ${biophysics.endosomalEscapeEfficiency}%
- De Gennes polymer brush ratio (RF/D): ${biophysics.deGennesRfOverD ? `${biophysics.deGennesRfOverD} (${biophysics.deGennesRfOverD >= 1.0 ? 'Dense Brush' : 'Mushroom'})` : 'N/A'}
- Critical Packing Parameter (CPP at pH 5.5): ${biophysics.criticalPackingParam ? `${biophysics.criticalPackingParam} (${biophysics.criticalPackingParam >= 1.45 ? 'Inverted Hexagonal HII' : 'Lamellar La'})` : 'N/A'}
- SAXS Bragg q1 repeat spacing (dSAXS): ${biophysics.saxsBraggSpacingNm ? `${biophysics.saxsBraggSpacingNm} nm` : 'N/A'}
- Predicted organ biodistribution: Liver ${biophysics.organTropism.liver}% | Spleen ${biophysics.organTropism.spleen}% | Lungs ${biophysics.organTropism.lungs}%
- Formulation classification: ${biophysics.stabilityStatus}

## 3. Wet-Lab Batch Preparation Mass Scale (${batchVolumeMl} mL at ${batchMrnaConcMgMl} mg/mL mRNA)
- Total mRNA to weigh: ${batchCalculation.totalMrnaMassMg} mg
- Total lipids to weigh: ${batchCalculation.totalLipidMassMg} mg (Lipid:mRNA ratio ${(batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg).toFixed(1)}:1 w/w)
${batchCalculation.components.map((c) => `- ${c.name}: ${c.massMg} mg (${c.molarConcMm} mM)`).join('\n')}

## 4. Immunogenicity and De-immunization Profile
- Backbone status: ${deimmunized ? 'De-immunized (L240T, K836R, L1020G, F421A, L675S active)' : 'Wild-type SpCas9 sequence'}
- Catalytic residue integrity (D10 / H840): Intact
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre_ind_evaluation_${activePreset.id.toLowerCase()}.md`;
    a.click();
  };

  const getVerdictStatusColor = (verdict: GuideCandidate['verdict']) => {
    if (verdict.includes('Optimal') || verdict.includes('Safe')) {
      return tokens.colors.status.success;
    }
    if (verdict.includes('Risk')) {
      return tokens.colors.status.danger;
    }
    return tokens.colors.status.warning;
  };

  return (
    <div
      style={{
        backgroundColor: tokens.colors.canvas,
        color: tokens.colors.textPrimary,
        fontFamily: tokens.typography.fontSans,
      }}
      className="min-h-screen flex flex-col text-xs antialiased selection:bg-[#3f6d8c]/30 selection:text-white"
    >
      {/* Top Application Header / Menu Bar */}
      <header
        style={{
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
        }}
        className="border-b px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: tokens.colors.accent,
                borderRadius: tokens.radius,
              }}
              className="w-2 h-3.5 inline-block"
            />
            <span className="font-display font-bold text-sm tracking-tight text-[#e1e4e8]">
              NanoCRISPR-3D
            </span>
            <span className="text-[#686e74] text-xs">/</span>
            <span className="text-[#9aa0a6] text-xs hidden sm:inline">
              Base editor & lipid nanoparticle evaluation workbench
            </span>
          </div>

          {/* Target Gene Selector Tabs */}
          <div
            style={{
              backgroundColor: tokens.colors.canvas,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="flex items-center p-0.5 border"
          >
            {GENE_PRESETS.map((preset) => {
              const active = !isCustomMode && preset.id === activePreset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setIsCustomMode(false);
                    setSelectedPresetId(preset.id);
                    setSelectedGuideIdx(0);
                  }}
                  style={{
                    backgroundColor: active ? tokens.colors.surfaceRaised : 'transparent',
                    color: active ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                    borderRadius: tokens.radius,
                  }}
                  className={`px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    active ? 'border border-[#383d44]' : 'border border-transparent hover:text-[#e1e4e8]'
                  }`}
                >
                  {preset.symbol}
                </button>
              );
            })}

            {/* Custom Sequence Mode Toggle */}
            <button
              onClick={() => {
                setIsCustomMode(true);
                setSelectedGuideIdx(0);
              }}
              style={{
                backgroundColor: isCustomMode ? tokens.colors.surfaceRaised : 'transparent',
                color: isCustomMode ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                borderRadius: tokens.radius,
              }}
              className={`px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                isCustomMode ? 'border border-[#383d44]' : 'border border-transparent hover:text-[#e1e4e8]'
              }`}
            >
              + Custom sequence
            </button>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchCalc(!showBatchCalc)}
            style={{
              backgroundColor: showBatchCalc ? tokens.colors.accentSubdued : tokens.colors.surfaceRaised,
              borderColor: showBatchCalc ? tokens.colors.accentBorder : tokens.colors.border,
              borderRadius: tokens.radius,
              color: showBatchCalc ? '#e1e4e8' : tokens.colors.textSecondary,
            }}
            className="px-2.5 py-1 text-xs font-medium border hover:text-[#e1e4e8] hover:border-[#383d44] transition cursor-pointer"
          >
            {showBatchCalc ? 'Hide mass calculator' : 'Batch mass calculator'}
          </button>

          <button
            onClick={downloadDraDossier}
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
              color: tokens.colors.textPrimary,
            }}
            className="px-3 py-1 text-xs font-medium border hover:bg-[#282b2f] hover:border-[#383d44] transition cursor-pointer"
          >
            Export pre-IND report (.md)
          </button>
        </div>
      </header>

      {/* Custom Sequence Input Drawer (when active) */}
      {isCustomMode && (
        <div
          style={{
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
          }}
          className="border-b px-4 py-3 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-xs tracking-tight text-[#e1e4e8]">
              Custom target sequence configuration
            </span>
            <span className="text-[11px] text-[#686e74]">
              Dual-strand scanning will search both (+) and (-) orientations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-[11px] text-[#9aa0a6] block mb-1">
                Coding DNA sequence (5' → 3')
              </label>
              <textarea
                rows={2}
                value={customPreset.sequence}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    sequence: e.target.value.toUpperCase().replace(/[^ATCGN]/g, '')
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-2 border font-mono-seq text-[11px] text-[#e1e4e8] outline-none focus:border-[#3f6d8c]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#9aa0a6] block mb-1">
                Target nucleotide (1-based index)
              </label>
              <input
                type="number"
                min={1}
                max={customPreset.sequence.length}
                value={customPreset.mutationIndex + 1}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    mutationIndex: Math.max(0, parseInt(e.target.value || '1', 10) - 1)
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border font-mono-seq text-xs text-[#e1e4e8] outline-none"
              />

              <label className="text-[11px] text-[#9aa0a6] block mt-2 mb-1">
                Base editor architecture
              </label>
              <select
                value={customPreset.editorType}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    editorType: e.target.value as 'ABE8e (A→G)' | 'BE4max (C→T)'
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e1e4e8] outline-none"
              >
                <option value="ABE8e (A→G)">ABE8e (A→G deaminase)</option>
                <option value="BE4max (C→T)">BE4max (C→T deaminase)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#9aa0a6] block mb-1">
                Target organ / tissue
              </label>
              <select
                value={customPreset.targetOrgan}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    targetOrgan: e.target.value as 'Liver' | 'Bone Marrow (HSPC)' | 'Lung'
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e1e4e8] outline-none"
              >
                <option value="Liver">Liver (Hepatocytes)</option>
                <option value="Bone Marrow (HSPC)">Bone Marrow (HSPC)</option>
                <option value="Lung">Lung (Endothelium)</option>
              </select>

              <label className="text-[11px] text-[#9aa0a6] block mt-2 mb-1">
                Optional SAS SNP marker (1-based)
              </label>
              <input
                type="number"
                min={0}
                max={customPreset.sequence.length}
                value={customPreset.sasSnpIndex + 1}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    sasSnpIndex: Math.max(0, parseInt(e.target.value || '0', 10) - 1)
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border font-mono-seq text-xs text-[#e1e4e8] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Workstation Layout */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT WORKSTATION: GENOMICS & BASE EDITING EVALUATION */}
        <section className="lg:col-span-7 flex flex-col gap-3">
          {/* Target Locus Metadata Bar */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24272a] pb-2 mb-2">
              <div>
                <span className="font-semibold text-sm text-[#e1e4e8] mr-2">
                  {activePreset.symbol}
                </span>
                <span className="text-[#9aa0a6] text-xs">
                  {activePreset.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9aa0a6]">
                <span>
                  Target tissue: <strong className="text-[#e1e4e8] font-medium">{activePreset.targetOrgan}</strong>
                </span>
                <span>•</span>
                <span>
                  Editor: <strong className="text-[#e1e4e8] font-medium">{activePreset.editorType}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[#686e74] block text-[11px]">Indication</span>
                <span className="text-[#e1e4e8]">{activePreset.disease}</span>
              </div>
              <div>
                <span className="text-[#686e74] block text-[11px]">Pathogenic target position</span>
                <span className="font-mono-seq text-[#e1e4e8]">
                  bp {activePreset.mutationIndex + 1} (CDS frame offset: {activePreset.mutationIndex % 3})
                </span>
              </div>
              <div>
                <span className="text-[#686e74] block text-[11px]">South Asian population variant</span>
                <span className="font-mono-seq text-[#e1e4e8]">
                  {activePreset.sasSnpId} (MAF: {(activePreset.sasAlleleFreq * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Sequence & Reading Frame Track */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Coding sequence (5' → 3') and reading frame
              </h2>
              <div className="flex items-center gap-4 text-[11px] text-[#9aa0a6]">
                <span className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: tokens.colors.status.danger }}
                    className="w-2 h-2 rounded-full inline-block"
                  />
                  Target nucleotide (bp {activePreset.mutationIndex + 1})
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: tokens.colors.status.warning }}
                    className="w-2 h-2 rounded-full inline-block"
                  />
                  SAS SNP (bp {activePreset.sasSnpIndex + 1})
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: tokens.colors.accent }}
                    className="w-2 h-2 rounded-full inline-block"
                  />
                  Active spacer ({selectedGuide?.strand === '+' ? 'sense' : 'antisense'})
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: tokens.colors.canvas,
                borderColor: tokens.colors.borderMuted,
                borderRadius: tokens.radius,
              }}
              className="p-2.5 border font-mono-seq text-xs overflow-x-auto leading-relaxed select-all"
            >
              <div className="text-[10px] text-[#686e74] mb-1 font-mono-seq">
                Translated protein: {wildTypeProtein.slice(0, 31)}
              </div>
              <div className="tracking-[0.14em]">
                {activePreset.sequence.split('').map((base, idx) => {
                  const isTarget = idx === activePreset.mutationIndex;
                  const isSnp = idx === activePreset.sasSnpIndex;
                  const inActiveGuide =
                    selectedGuide &&
                    idx >= selectedGuide.startIndex &&
                    idx < selectedGuide.startIndex + 20;

                  let bg = 'transparent';
                  let color: string | undefined = undefined;
                  let border = 'transparent';

                  if (isTarget) {
                    bg = '#bd5142'; // Solid Cinnabar Red
                    color = '#ffffff';
                  } else if (isSnp) {
                    bg = '#c98a3b'; // Solid Ochre
                    color = '#12110f';
                  } else if (inActiveGuide) {
                    bg = 'rgba(77, 130, 143, 0.18)';
                    border = '#4d828f';
                  }

                  return (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: bg,
                        color: color,
                        borderBottom: border !== 'transparent' ? `2px solid ${border}` : 'none',
                        borderRadius: tokens.radius,
                      }}
                      className={`px-0.5 inline-block ${!isTarget && !isSnp ? getBaseColorClass(base) : 'font-bold'}`}
                      title={`Position ${idx + 1}`}
                    >
                      {base}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Protospacer Candidates Table with Sorting & Filters */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Protospacer candidates (dual-strand discovery)
              </h2>

              {/* Table Filters */}
              <div className="flex items-center gap-2 text-[11px] text-[#9aa0a6]">
                <div className="flex items-center border border-[#2c3035] rounded-[3px] p-0.5 bg-[#141618]">
                  <button
                    onClick={() => setFilterStrand('all')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition ${
                      filterStrand === 'all' ? 'bg-[#212427] text-[#e1e4e8]' : 'hover:text-[#e1e4e8]'
                    }`}
                  >
                    All strands
                  </button>
                  <button
                    onClick={() => setFilterStrand('+')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition ${
                      filterStrand === '+' ? 'bg-[#212427] text-[#e1e4e8]' : 'hover:text-[#e1e4e8]'
                    }`}
                  >
                    Sense (+)
                  </button>
                  <button
                    onClick={() => setFilterStrand('-')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition ${
                      filterStrand === '-' ? 'bg-[#212427] text-[#e1e4e8]' : 'hover:text-[#e1e4e8]'
                    }`}
                  >
                    Antisense (-)
                  </button>
                </div>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideSnpCollisions}
                    onChange={(e) => setHideSnpCollisions(e.target.checked)}
                    className="accent-[#3f6d8c]"
                  />
                  <span>Clear of SNP</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canonicalPamOnly}
                    onChange={(e) => setCanonicalPamOnly(e.target.checked)}
                    className="accent-[#3f6d8c]"
                  />
                  <span>NGG only</span>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr
                    style={{ borderColor: tokens.colors.border }}
                    className="border-b text-[#9aa0a6] text-[11px]"
                  >
                    <th
                      onClick={() => handleSort('id')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e1e4e8]"
                    >
                      ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('strand')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e1e4e8]"
                    >
                      Strand {sortField === 'strand' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">Spacer sequence (positions 4–8 underlined)</th>
                    <th
                      onClick={() => handleSort('pam')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e1e4e8]"
                    >
                      PAM {sortField === 'pam' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('gcContent')}
                      className="py-1 px-2 font-medium text-right font-mono-seq cursor-pointer hover:text-[#e1e4e8]"
                    >
                      GC% {sortField === 'gcContent' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">Population SNP</th>
                    <th
                      onClick={() => handleSort('CompositeScore')}
                      className="py-1 px-2 font-medium text-right font-mono-seq cursor-pointer hover:text-[#e1e4e8]"
                    >
                      Score {sortField === 'CompositeScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">Evaluation verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {processedGuides.map((g, idx) => {
                    const isSelected = idx === selectedGuideIdx;
                    const verdictColor = getVerdictStatusColor(g.verdict);
                    const isCanonicalPam = g.pam[1] === 'G' && g.pam[2] === 'G';

                    return (
                      <tr
                        key={g.id}
                        onClick={() => setSelectedGuideIdx(idx)}
                        style={{
                          backgroundColor: isSelected ? tokens.colors.surfaceSelected : 'transparent',
                          borderLeftWidth: '2px',
                          borderLeftStyle: 'solid',
                          borderLeftColor: isSelected ? tokens.colors.accent : 'transparent',
                          borderBottomWidth: '1px',
                          borderBottomStyle: 'solid',
                          borderBottomColor: tokens.colors.borderMuted,
                        }}
                        className="hover:bg-[#2a2621] cursor-pointer transition"
                      >
                        <td className="py-1 px-2 font-medium text-[#e8dfd1]">
                          {g.id}
                        </td>
                        <td className="py-1 px-2 font-mono-seq text-[11px] font-semibold">
                          <span className={g.strand === '-' ? 'text-[#6699a8]' : 'text-[#a69b8d]'}>
                            {g.strand === '+' ? '+' : '-'}
                          </span>
                        </td>
                        <td className="py-1 px-2 font-mono-seq text-[11px]">
                          <span>
                            {g.spacer.slice(0, 3).split('').map((b, i) => (
                              <span key={i} className={getBaseColorClass(b)}>{b}</span>
                            ))}
                          </span>
                          <span
                            style={{ borderRadius: tokens.radius }}
                            className="px-1 font-semibold text-[#e0ad5a] bg-[#c98a3b]/15 border-b border-[#c98a3b]"
                          >
                            {g.spacer.slice(3, 8)}
                          </span>
                          <span>
                            {g.spacer.slice(8).split('').map((b, i) => (
                              <span key={i} className={getBaseColorClass(b)}>{b}</span>
                            ))}
                          </span>
                        </td>
                        <td className="py-1 px-2 font-mono-seq font-semibold">
                          <span className={isCanonicalPam ? 'text-[#d4a359]' : 'text-[#cc6b5a]'}>
                            {g.pam}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-right font-mono-seq text-[#a69b8d]">
                          {g.gcContent}%
                        </td>
                        <td className="py-1 px-2">
                          <span className="flex items-center gap-1.5">
                            <span
                              style={{
                                backgroundColor: g.hasSasSnpCollision
                                  ? tokens.colors.status.warning
                                  : tokens.colors.status.success,
                              }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            <span className="text-[11px] text-[#a69b8d]">
                              {g.hasSasSnpCollision ? 'Collision' : 'Clear'}
                            </span>
                          </span>
                        </td>
                        <td className="py-1 px-2 text-right font-mono-seq font-semibold text-[#e8dfd1]">
                          {g.CompositeScore}
                        </td>
                        <td className="py-1 px-2">
                          <span className="flex items-center gap-1.5">
                            <span
                              style={{ backgroundColor: verdictColor }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            <span className="text-[11px] text-[#a69b8d] truncate">
                              {g.verdict}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Oligonucleotide Synthesis Generator Card */}
          {selectedGuide && cloningOligos && (
            <div
              style={{
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius,
              }}
              className="border p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                  Oligonucleotide cloning order sheet ({cloningOligos.overhangSystem})
                </h2>
                <span className="text-[11px] text-[#686e74]">
                  Lead guide: {selectedGuide.id} (strand {selectedGuide.strand})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderColor: tokens.colors.borderMuted,
                    borderRadius: tokens.radius,
                  }}
                  className="p-2 border flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#a69b8d]">Top oligo (CACC-G-spacer)</span>
                    <button
                      onClick={() => handleCopyOligo(cloningOligos.forwardOligo, 'fwd')}
                      className="text-[10px] text-[#4d828f] hover:text-[#5e96a3] cursor-pointer"
                    >
                      {copiedOligo === 'fwd' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <span className="font-mono-seq text-[11px] select-all break-all tracking-wider">
                    {cloningOligos.forwardOligo.split('').map((b, i) => (
                      <span key={i} className={getBaseColorClass(b)}>{b}</span>
                    ))}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderColor: tokens.colors.borderMuted,
                    borderRadius: tokens.radius,
                  }}
                  className="p-2 border flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#a69b8d]">Bottom oligo (AAAC-spacerRC)</span>
                    <button
                      onClick={() => handleCopyOligo(cloningOligos.reverseOligo, 'rev')}
                      className="text-[10px] text-[#4d828f] hover:text-[#5e96a3] cursor-pointer"
                    >
                      {copiedOligo === 'rev' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <span className="font-mono-seq text-[11px] select-all break-all tracking-wider">
                    {cloningOligos.reverseOligo.split('').map((b, i) => (
                      <span key={i} className={getBaseColorClass(b)}>{b}</span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Deaminase Codon Audit Table */}
          {selectedGuide && (
            <div
              style={{
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius,
              }}
              className="border p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Deaminase window (positions 4–8) codon translation for {selectedGuide.id}
                </h2>
                <span className="text-[11px] text-[#70675c]">
                  Base conversion: {activePreset.editorType}
                </span>
              </div>

              {selectedGuide.bystanders.length === 0 ? (
                <p className="text-xs text-[#70675c] py-1">
                  No editable target base detected within deaminase positions 4–8.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr
                        style={{ borderColor: tokens.colors.border }}
                        className="border-b text-[#a69b8d] text-[11px]"
                      >
                        <th className="py-1 px-2 font-medium">Spacer pos</th>
                        <th className="py-1 px-2 font-medium">Genomic idx</th>
                        <th className="py-1 px-2 font-medium">Original codon</th>
                        <th className="py-1 px-2 font-medium">Original residue</th>
                        <th className="py-1 px-2 font-medium">Edited codon</th>
                        <th className="py-1 px-2 font-medium">Edited residue</th>
                        <th className="py-1 px-2 font-medium">Consequence classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGuide.bystanders.map((b, i) => {
                        const isSafe =
                          b.classification === 'Target Edit' ||
                          b.classification === 'Silent (Synonymous)';
                        const statusColor = isSafe
                          ? tokens.colors.status.success
                          : tokens.colors.status.danger;

                        return (
                          <tr
                            key={i}
                            style={{ borderColor: tokens.colors.borderMuted }}
                            className="border-b text-[11px]"
                          >
                            <td className="py-1 px-2 font-mono-seq text-[#a69b8d]">
                              {b.guidePos}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#a69b8d]">
                              bp {b.genomicIndex + 1}
                            </td>
                            <td className="py-1 px-2 font-mono-seq tracking-wider">
                              {b.originalCodon.split('').map((ch, cIdx) => (
                                <span key={cIdx} className={getBaseColorClass(ch)}>{ch}</span>
                              ))}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#e8dfd1]">
                              {b.originalAA}
                            </td>
                            <td className="py-1 px-2 font-mono-seq tracking-wider">
                              {b.editedCodon.split('').map((ch, cIdx) => (
                                <span key={cIdx} className={getBaseColorClass(ch)}>{ch}</span>
                              ))}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#e8dfd1]">
                              {b.editedAA}
                            </td>
                            <td className="py-1 px-2">
                              <span className="flex items-center gap-1.5">
                                <span
                                  style={{ backgroundColor: statusColor }}
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                />
                                <span className="text-[#c5c8cc]">{b.classification}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Cas9 Epitope Immunogenicity Section (Expanded 5 South Asian Alleles) */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Cas9 surface epitope immunogenicity (South Asian HLA alleles)
              </h2>
              <button
                onClick={() => setDeimmunized(!deimmunized)}
                style={{
                  backgroundColor: tokens.colors.surfaceRaised,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="px-2.5 py-0.5 text-xs font-medium border hover:bg-[#282b2f] transition cursor-pointer flex items-center gap-1.5"
              >
                <span
                  style={{
                    backgroundColor: deimmunized
                      ? tokens.colors.status.success
                      : tokens.colors.status.danger,
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                />
                <span className="text-[#e1e4e8]">
                  {deimmunized ? 'Stealth mutations: Enabled' : 'Wild-type Cas9 backbone'}
                </span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr
                    style={{ borderColor: tokens.colors.border }}
                    className="border-b text-[#9aa0a6] text-[11px]"
                  >
                    <th className="py-1 px-2 font-medium">Epitope peptide</th>
                    <th className="py-1 px-2 font-medium">Residues</th>
                    <th className="py-1 px-2 font-medium">Protein domain</th>
                    <th className="py-1 px-2 font-medium">South Asian HLA allele</th>
                    <th className="py-1 px-2 font-medium text-right font-mono-seq">Risk score</th>
                    <th className="py-1 px-2 font-medium">De-immunization mutation</th>
                  </tr>
                </thead>
                <tbody>
                  {CAS9_EPITOPE_HOTSPOTS.map((ep, i) => (
                    <tr
                      key={i}
                      style={{ borderColor: tokens.colors.borderMuted }}
                      className="border-b text-[11px]"
                    >
                      <td className="py-1 px-2 font-mono-seq font-semibold text-[#e1e4e8]">
                        {ep.peptide}
                      </td>
                      <td className="py-1 px-2 font-mono-seq text-[#9aa0a6]">
                        {ep.residueRange}
                      </td>
                      <td className="py-1 px-2 text-[#9aa0a6]">
                        {ep.domain}
                      </td>
                      <td className="py-1 px-2 text-[#9aa0a6]">
                        {ep.hlaAllele}
                      </td>
                      <td className="py-1 px-2 text-right font-mono-seq">
                        {deimmunized ? (
                          <span className="text-[#686e74]">&lt;10</span>
                        ) : (
                          <span style={{ color: tokens.colors.status.danger }} className="font-semibold">
                            {ep.bindingScore} / 100
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {deimmunized ? (
                          <span className="flex items-center gap-1.5 text-[#c5c8cc]">
                            <span
                              style={{ backgroundColor: tokens.colors.status.success }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            {ep.stealthMutation}
                          </span>
                        ) : (
                          <span className="text-[#686e74]">Unmodified wild-type</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* RIGHT WORKSTATION: LIPID NANOPARTICLE FORMULATION & BIOPHYSICS */}
        <section className="lg:col-span-5 flex flex-col gap-3">
          {/* 3D Nanoparticle Cross-Section Viewport */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Nanoparticle structural cutaway
              </h2>
              <span className="text-[11px] text-[#686e74]">
                Interactive 3D representation
              </span>
            </div>
            <NanoViewport3D formulation={activeFormulation} biophysics={biophysics} />
          </div>

          {/* Formulation Controls with 4-Component Auto-Balancing */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Lipid formulation parameters
              </h2>
              {/* Preset Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => applyClinicalLnp('Onpattro')}
                  style={{
                    backgroundColor: tokens.colors.surfaceRaised,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2 py-0.5 text-[11px] text-[#9aa0a6] hover:text-[#e1e4e8] border hover:bg-[#282b2f] transition cursor-pointer"
                >
                  Onpattro
                </button>
                <button
                  onClick={() => applyClinicalLnp('Moderna')}
                  style={{
                    backgroundColor: tokens.colors.surfaceRaised,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2 py-0.5 text-[11px] text-[#9aa0a6] hover:text-[#e1e4e8] border hover:bg-[#282b2f] transition cursor-pointer"
                >
                  SM-102
                </button>
                <button
                  onClick={() => applyClinicalLnp('LungSORT')}
                  style={{
                    backgroundColor: tokens.colors.surfaceRaised,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2 py-0.5 text-[11px] text-[#9aa0a6] hover:text-[#e1e4e8] border hover:bg-[#282b2f] transition cursor-pointer"
                >
                  Lung-SORT
                </button>
              </div>
            </div>

            {/* 4-Component Auto-Balancing Sliders */}
            <div className="flex flex-col gap-2.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">Ionizable lipid molar ratio</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.ionizableLipid.toFixed(1)} mol%</span>
                </div>
                <input
                  type="range"
                  min="35.0"
                  max="65.0"
                  step="0.5"
                  value={lnpForm.ionizableLipid}
                  onChange={(e) => setLnpForm({ ...lnpForm, ionizableLipid: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">Helper lipid (DSPC) molar ratio</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.dspcHelper.toFixed(1)} mol%</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="20.0"
                  step="0.5"
                  value={lnpForm.dspcHelper}
                  onChange={(e) => setLnpForm({ ...lnpForm, dspcHelper: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">PEG-lipid molar ratio</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.pegLipid.toFixed(1)} mol%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="6.0"
                  step="0.1"
                  value={lnpForm.pegLipid}
                  onChange={(e) => setLnpForm({ ...lnpForm, pegLipid: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">Ionizable lipid apparent pKa</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.lipidPka.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="5.4"
                  max="7.4"
                  step="0.05"
                  value={lnpForm.lipidPka}
                  onChange={(e) => setLnpForm({ ...lnpForm, lipidPka: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">Amine-to-phosphate (N/P) charge ratio</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.npRatio.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.5"
                  value={lnpForm.npRatio}
                  onChange={(e) => setLnpForm({ ...lnpForm, npRatio: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Molar Composition Summary (Guaranteed 100.0%) */}
            <div
              style={{
                backgroundColor: tokens.colors.canvas,
                borderColor: tokens.colors.borderMuted,
                borderRadius: tokens.radius,
              }}
              className="p-2 border font-mono-seq text-[11px] text-[#9aa0a6] flex justify-between"
            >
              <span>Molar sum: 100.0%</span>
              <span className="text-[#c5c8cc]">
                {lnpForm.ionizableLipid.toFixed(1)}% ionizable • {lnpForm.dspcHelper.toFixed(1)}% DSPC • {effectiveCholesterol.toFixed(1)}% chol • {lnpForm.pegLipid.toFixed(1)}% PEG
              </span>
            </div>
          </div>

          {/* Wet-Lab Batch Preparation Mass Calculator (Collapsible / Toggleable) */}
          {showBatchCalc && (
            <div
              style={{
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius,
              }}
              className="border p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                  Wet-lab batch preparation calculator
                </h2>
                <span className="text-[11px] text-[#686e74]">
                  Microfluidic mixing protocol
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-[#9aa0a6] block mb-0.5">
                    Target batch volume (mL)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    value={batchVolumeMl}
                    onChange={(e) => setBatchVolumeMl(Math.max(0.1, parseFloat(e.target.value) || 10))}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="w-full p-1 border font-mono-seq text-xs text-[#e1e4e8] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#9aa0a6] block mb-0.5">
                    mRNA concentration (mg/mL)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={batchMrnaConcMgMl}
                    onChange={(e) => setBatchMrnaConcMgMl(Math.max(0.05, parseFloat(e.target.value) || 1))}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="w-full p-1 border font-mono-seq text-xs text-[#e1e4e8] outline-none"
                  />
                </div>
              </div>

              {/* Mass Table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr
                      style={{ borderColor: tokens.colors.border }}
                      className="border-b text-[#9aa0a6] text-[11px]"
                    >
                      <th className="py-1 px-1.5 font-medium">Component</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Molar %</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Mass to weigh</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Conc (mM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style={{ borderColor: tokens.colors.borderMuted }}
                      className="border-b text-[11px]"
                    >
                      <td className="py-1 px-1.5 font-semibold text-[#e1e4e8]">mRNA payload</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">—</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq font-semibold text-[#e1e4e8]">
                        {batchCalculation.totalMrnaMassMg} mg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">
                        {batchMrnaConcMgMl.toFixed(2)} mg/mL
                      </td>
                    </tr>
                    {batchCalculation.components.map((c, i) => (
                      <tr
                        key={i}
                        style={{ borderColor: tokens.colors.borderMuted }}
                        className="border-b text-[11px]"
                      >
                        <td className="py-1 px-1.5 text-[#c5c8cc]">{c.name}</td>
                        <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">
                          {c.molarPct.toFixed(1)}%
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono-seq font-medium text-[#e1e4e8]">
                          {c.massMg} mg
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">
                          {c.molarConcMm} mM
                        </td>
                      </tr>
                    ))}
                    <tr className="text-[11px] font-semibold text-[#e1e4e8]">
                      <td className="py-1 px-1.5">Total Lipids</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq">100.0%</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq">
                        {batchCalculation.totalLipidMassMg} mg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">
                        Ratio: {(batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg).toFixed(1)}:1 w/w
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calculated Biophysical Properties */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Calculated biophysical properties
              </h2>
              {/* Stability status indicator */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  style={{
                    backgroundColor:
                      biophysics.stabilityStatus === 'Optimal Clinical LNP'
                        ? tokens.colors.status.success
                        : tokens.colors.status.warning,
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                />
                <span className="text-[#c5c8cc]">{biophysics.stabilityStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#686e74] text-[11px]">Hydrodynamic diameter (Dh)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e1e4e8]">
                  {biophysics.diameterNm} nm
                </div>
                <div className="text-[10px] text-[#9aa0a6] font-mono-seq">
                  PDI: {biophysics.pdi}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#686e74] text-[11px]">Zeta potential (pH 7.4)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e1e4e8]">
                  {biophysics.zetaPotentialMv} mV
                </div>
                <div className="text-[10px] text-[#9aa0a6] font-mono-seq">
                  Blood ionization: {biophysics.bloodProtonationPct}%
                </div>
              </div>

              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#686e74] text-[11px]">Endosomal ionization (pH 5.5)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e1e4e8]">
                  {biophysics.endosomalProtonationPct}%
                </div>
                <div className="text-[10px] text-[#9aa0a6] font-mono-seq">
                  Henderson-Hasselbalch model
                </div>
              </div>

              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#686e74] text-[11px]">ApoE cellular uptake score</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e1e4e8]">
                  {biophysics.cellularUptakeScore} / 100
                </div>
                <div className="text-[10px] text-[#9aa0a6] font-mono-seq">
                  Endosomal escape: {biophysics.endosomalEscapeEfficiency}%
                </div>
              </div>
            </div>
          </div>

          {/* Predicted Biodistribution */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Predicted organ biodistribution (SORT model)
              </h2>
              <span className="text-[11px] text-[#686e74]">
                Apparent charge partitioning
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1 text-xs">
              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#9aa0a6]">Liver (hepatocytes)</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{biophysics.organTropism.liver}%</span>
                </div>
                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderRadius: '2px',
                  }}
                  className="w-full h-1.5 overflow-hidden"
                >
                  <div
                    style={{
                      width: `${biophysics.organTropism.liver}%`,
                      backgroundColor: tokens.colors.accent,
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#9aa0a6]">Spleen (lymphoid / immune cells)</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{biophysics.organTropism.spleen}%</span>
                </div>
                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderRadius: '2px',
                  }}
                  className="w-full h-1.5 overflow-hidden"
                >
                  <div
                    style={{
                      width: `${biophysics.organTropism.spleen}%`,
                      backgroundColor: '#526371',
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#9aa0a6]">Lungs (endothelial beds)</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{biophysics.organTropism.lungs}%</span>
                </div>
                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderRadius: '2px',
                  }}
                  className="w-full h-1.5 overflow-hidden"
                >
                  <div
                    style={{
                      width: `${biophysics.organTropism.lungs}%`,
                      backgroundColor: '#6b7280',
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

```

---

## 5. Developer Protocols & Operating Directives for Agent Argon

When editing or extending this codebase, adhere strictly to these principles:
1. **Zero Stoichiometric Drift:** The 4 lipid components must sum to exactly 100.0% at all times.
2. **Preserve Type Safety:** Keep all interfaces in `src/engines/types.ts` in sync with any engine enhancements.
3. **Engine-UI Separation:** Keep computational biochemistry decoupled inside `src/engines/`. Do not inline biological equations directly into React UI event listeners.
4. **Build & Lint Verification:** Always verify that `npm run build` and `npm run lint` pass without errors or type regressions.
5. **Attribution:** Preserve academic attribution to Arunabha Ghosh (MAKAUT) under the Apache License 2.0.
