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
1. **Precision Codon-Aware CRISPR Base Editing:** Dual-strand (+/-) PAM scanning (SpCas9 NGG, SpCas9-NG NG, SpRY NNN), deaminase activity window simulation (standard ABE8e/BE4max pos 4–8; narrow-window ABE9 pos 5–6), bystander missense/nonsense mutation profiling, Golden Gate cloning oligonucleotide design, and South Asian (SAS) population polymorphism collision detection.
2. **Nanotechnology & Lipid Nanoparticle (LNP) Formulation Engineering:** Multi-component lipid stoichiometry balancing (locked strictly at 100%), Henderson-Hasselbalch protonation kinetics, Israelachvili Critical Packing Parameter ($CPP$) phase transitions, De Gennes polymer brush scaling ("The PEG Dilemma"), ApoE opsonization dynamics, Selective Organ Targeting (SORT) biodistribution, wet-lab microfluidic batch mass calculations, and interactive hardware-accelerated 3D structural cutaway rendering.
3. **ImmunoShield Adaptive De-Immunization:** Structure-guided humanization of *Sp*Cas9 against high-frequency South Asian MHC Class I alleles (HLA-A*02:01, HLA-A*24:02, HLA-A*11:01, HLA-B*40:06, HLA-B*15:02) to mitigate pre-existing host cytotoxic T-lymphocyte (CTL) responses while preserving catalytic active-site residues.
4. **Hexagonal Service Architecture with Python FastAPI Backend:** Browser-native TypeScript execution via `LocalBioEngineService` with transparent, auto-falling back remote microservice connectivity via `RemotePythonBioEngineService` and `backend/main.py`.
5. **Pre-IND CMC Regulatory Dossier Export:** One-click generation of comprehensive clinical evaluation reports formatted in Markdown and structured JSON protocols.

---

## 2. System Architecture & Tech Stack

| Domain | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | ^19.2.8 | Declarative UI, Concurrent Mode, React 19 hooks |
| **Language** | TypeScript | ~6.0.2 | Strict static typing across all bio-engines and domain models |
| **Tooling & Bundler** | Vite | ^8.3.0 | Instant ESM development server and Rollup production builds |
| **Styling** | Tailwind CSS v4 | ^4.3.3 | Modern CSS theme variables and utility-first layout |
| **3D Rendering** | Three.js | ^0.186.1 | WebGL scene graph, shaders, geometry, and lighting |
| **React 3D Bridge** | React Three Fiber | ^9.8.2 | React fiber renderer for Three.js |
| **3D Ecosystem** | @react-three/drei | ^10.7.9 | Camera controls, orbit manipulation, environment helpers |
| **Icons** | Lucide React | ^1.59.0 | Minimalist laboratory and scientific iconography |
| **Linter** | Oxlint | ^1.81.0 | Fast Rust-based linter |
| **Backend Framework** | FastAPI | ^0.115.0 | High-performance Python computational biology REST microservice |
| **ASGI Server** | Uvicorn | ^0.32.0 | Async production server hosting `backend/main.py` |
| **Data Validation** | Pydantic v2 | ^2.9.0 | Strict schema models mirrored between TypeScript and Python |
| **Numerical Engine** | NumPy | ^2.1.0 | Vectorized thermodynamic nearest-neighbor matrix operations |

### Architectural Pattern: Hexagonal / Ports & Adapters
- `IBioEngineService` (in `src/engines/types.ts`) defines the universal port contract.
- `LocalBioEngineService` (in `src/engines/service.ts`) provides in-browser, sub-millisecond heuristic execution.
- `RemotePythonBioEngineService` (in `src/engines/service.ts`) provides asynchronous HTTP communication with `backend/main.py` at `http://localhost:8000/api/v1` with zero-latency memory caching and seamless offline local fallback.

---

## 3. Mathematical & Biophysical Formalisms

### 3.1 CRISPR Deamination & Heuristic Guide Scoring
- **Deaminase Activity Windows:**
  - Standard (ABE8e / BE4max): Positions 4 to 8 (1-indexed from 5' end of spacer). Peak catalytic deamination at positions 5–7.
  - Narrow-Window (ABE9): Positions 5 to 6, drastically reducing bystander deamination of flanking adenosines.
- **PAM Variants:**
  - `SpCas9`: Canonical NGG PAM (65 pts base score), Relaxed NAG PAM (48 pts base score).
  - `SpCas9-NG`: Relaxed NG PAM (58 pts base score).
  - `SpRY`: Near-PAMless NNN PAM (50 pts base score).
- **Base Substitutions:**
  - ABE8e / ABE9: Converts A -> G (Antisense target converts T -> C on sense strand).
  - BE4max: Converts C -> T (Antisense target converts G -> A on sense strand).
- **Composite Score Formula:**
  $$\text{Score} = S_{pam} + S_{gc} \pm S_{target} - S_{bystander} - S_{snp}$$
  - GC Sweet Spot (40–60%): +15 pts (GC < 30% or > 75%: -10 pts).
  - Target In Window: +35 pts (Target missing: -25 pts; Target at peak center: +4 pts).
  - Premature Nonsense Stop Codon (`*`): -45 pts; Missense Mutation: -25 pts; Silent/Synonymous: +4 pts.
  - South Asian (SAS) SNP Collision: -20 pts.
  - Clamped to $[5, 99]$.

### 3.2 LNP Formulation Biophysics & CMC
- **Stoichiometric Balance:**
  $$\text{Cholesterol (mol\%)} = 100.0 - (\text{Ionizable} + \text{DSPC} + \text{PEG})$$
- **Hydrodynamic Diameter ($D_h$ in nm):**
  $$D_h = \text{round}(135 - 24 \cdot \ln(\max(0.3, X_{peg} \cdot 2.2)) + (6 - N/P) \cdot 3.5 + (X_{dspc} - 10) \cdot 0.45)$$
- **Henderson-Hasselbalch Ionization:**
  $$\%\text{ Protonation} = \frac{100}{1 + 10^{(\text{pH} - pK_a)}}$$
- **Zeta Potential ($\zeta$ in mV at physiological pH 7.4):**
  $$\zeta = (\%\text{Protonation}_{\text{pH 7.4}} \cdot 0.35) - (X_{peg} \cdot 2.1)$$
- **The "PEG Dilemma" & Cellular Uptake Score:**
  $$\text{PEG Penalty} = 100 - (X_{peg} - 2.0)^{1.8} \cdot 18 \quad (\text{if } X_{peg} > 2.2)$$
- **Endosomal Escape Efficiency Index:**
  $$\text{Efficiency} = 0.40 \cdot (\%\text{Protonation}_{\text{pH 5.5}}) + 0.35 \cdot \max(0, 100 - |pK_a - 6.35| \cdot 55) + 0.25 \cdot \text{Uptake}$$
- **De Gennes Polymer Brush Regime ($R_F / D$):**
  - Flory radius: $R_F \approx 3.43 \text{ nm}$ for PEG2000.
  - Grafting distance: $D = \sqrt{0.65 / X_{peg}}$.
  - $R_F / D < 1.0$: **Mushroom Regime** (Intermittent gaps permit ApoE adsorption).
  - $R_F / D \ge 1.0$: **Dense Brush Regime** (Steric brush suppresses ApoE clearance).
- **Israelachvili Critical Packing Parameter ($CPP$ at pH 5.5):**
  $$CPP = 1.08 + (\%\text{Protonation}_{\text{pH 5.5}} / 100) \cdot 0.58$$
  ($CPP \ge 1.45$ implies transition to non-bilayer inverted hexagonal $H_{II}$ phase driving endosomal membrane destabilization).
- **SAXS Bragg Repeat Spacing:**
  $$d_{\text{saxs}} = 6.45 - (N/P - 3) \cdot 0.08 \text{ nm}$$
- **SORT (Selective Organ Targeting) Biodistribution:**
  - $pK_a \sim 6.2 - 6.5$: Liver tropism ($>75\%$).
  - $pK_a > 6.7$ or $\zeta > +8 \text{ mV}$: Lung tropism ($>60\%$).
  - $pK_a < 6.0$ or $\zeta < -5 \text{ mV}$: Spleen HSPC tropism ($>55\%$).

### 3.3 Microfluidic Wet-Lab Mass Balance
- Total mRNA mass: $M_{\text{mrna}} = V \cdot C_{\text{mrna}}$ (mg).
- Phosphate moles: $n_{\text{phosphate}} = M_{\text{mrna}} / 330 \text{ mmol}$ (using avg ribonucleotide MW $\sim 330 \text{ g/mol}$).
- Ionizable amine moles: $n_{\text{ionizable}} = n_{\text{phosphate}} \cdot (N/P)$.
- Total lipid moles: $n_{\text{total}} = n_{\text{ionizable}} / (X_{\text{ionizable}} / 100)$.
- Molecular weights:
  - Ionizable Lipid: $710.2 \text{ g/mol}$ (SM-102 proxy)
  - DSPC: $790.15 \text{ g/mol}$
  - Cholesterol: $386.65 \text{ g/mol}$
  - DMG-PEG2000: $2509.2 \text{ g/mol}$
- Flow Rate Ratio (FRR): Standard 3:1 aqueous-to-ethanol ratio at Total Flow Rate (TFR) $12 \text{ mL/min}$.

### 3.4 ImmunoShield South Asian HLA Class I De-Immunization
- High-frequency South Asian HLA alleles: `HLA-A*02:01`, `HLA-A*24:02`, `HLA-A*11:01`, `HLA-B*40:06`, `HLA-B*15:02`.
- Structure-guided catalytically safe mutations:
  1. `L240T` in REC2 domain (aa 236–244 `NLIALSLGL`): Ablates pocket B anchor.
  2. `K836R` in HNH catalytic core (aa 836–844 `KTYAHLFDD`): Preserves catalytic `H840` for strand nicking.
  3. `L1020G` in RuvC-III domain (aa 1012–1020 `IYLAAANRL`): Disrupts C-terminal anchor.
  4. `F421A` in Bridge Helix (aa 418–426 `FEDFLKNRM`): Masks hydrophobic anchor.
  5. `L675S` in REC3 domain (aa 674–682 `TLYETRRDL`): Prevents MHC cleft accommodation.

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
**Description:** TypeScript compiler options for client application  
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
**Description:** HTML5 entry point and shell mounting root  
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
**Description:** Scientific workstation design tokens and color palette  
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
      targetBorder: '#bd5142',
      targetText: '#e27b6c',
      snpBg: 'rgba(201, 138, 59, 0.22)',
      snpBorder: '#c98a3b',
      snpText: '#df9e51',
      guideWindowBg: 'rgba(77, 130, 143, 0.16)',
      guideWindowBorder: 'rgba(77, 130, 143, 0.45)',
      guideWindowText: '#98c2cc',
      deaminaseWindowBg: 'rgba(201, 138, 59, 0.22)',
      deaminaseWindowBorder: 'rgba(201, 138, 59, 0.55)',
      deaminaseWindowText: '#e0ad5a',
      pamBg: 'rgba(207, 160, 82, 0.14)',
      pamBorder: 'rgba(207, 160, 82, 0.50)',
      pamText: '#d4a359',
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
**Description:** Global Tailwind v4 stylesheet and monospace font imports  
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
**Description:** Application UI shell styling and scrollbar primitives  
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
**Description:** Core domain models, biophysical interfaces, and service contracts  
**Path:** `src/engines/types.ts`

```typescript
// src/engines/types.ts
// Domain Types and Contracts for NanoCRISPER-3D

/**
 * Base-editor options modeled by the local guide scanner. These labels are
 * intentionally human-readable because they are also shown in the workbench
 * UI and exported reports.
 */
export type BaseEditorType =
  | 'ABE8e (A→G)'
  | 'ABE9 (A→G; window 5–6)'
  | 'BE4max (C→T)';

export interface BaseEditorDefinition {
  targetBase: 'A' | 'C';
  replacementBase: 'G' | 'T';
  editingWindow: readonly [start: number, end: number];
  peakPositions: readonly number[];
}

/**
 * PAM-recognition variants represented by the guide scanner. SpRY is modeled
 * as near-PAMless (NNN), ranked by its NRN/NYN preference.
 */
export type PamVariant = 'SpCas9' | 'SpCas9-NG' | 'SpRY';

export interface PamVariantDefinition {
  label: string;
  recognition: string;
  preferredPamLabel: string;
}

export const BASE_EDITOR_DEFINITIONS: Record<BaseEditorType, BaseEditorDefinition> = {
  'ABE8e (A→G)': {
    targetBase: 'A',
    replacementBase: 'G',
    editingWindow: [4, 8],
    peakPositions: [5, 6, 7],
  },
  'ABE9 (A→G; window 5–6)': {
    targetBase: 'A',
    replacementBase: 'G',
    editingWindow: [5, 6],
    peakPositions: [5, 6],
  },
  'BE4max (C→T)': {
    targetBase: 'C',
    replacementBase: 'T',
    editingWindow: [4, 8],
    peakPositions: [5, 6, 7],
  },
};

export const PAM_VARIANT_DEFINITIONS: Record<PamVariant, PamVariantDefinition> = {
  SpCas9: {
    label: 'SpCas9',
    recognition: 'NGG (preferred), NAG (relaxed)',
    preferredPamLabel: 'NGG only',
  },
  'SpCas9-NG': {
    label: 'SpCas9-NG',
    recognition: 'NGN',
    preferredPamLabel: 'NGG only (preferred)',
  },
  SpRY: {
    label: 'SpRY',
    recognition: 'NNN (NRN preferred; NYN relaxed)',
    preferredPamLabel: 'NRN only (preferred)',
  },
};

export interface GenePreset {
  id: string;
  symbol: string;
  name: string;
  disease: string;
  targetOrgan: 'Liver' | 'Bone Marrow (HSPC)' | 'Lung';
  editorType: BaseEditorType;
  /** Defaults to wild-type SpCas9 when omitted, preserving existing presets. */
  pamVariant?: PamVariant;
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
  /** Machine-readable HLA alleles used for patient-specific filtering. */
  hlaAlleles: string[];
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
**Description:** Curated clinical therapeutic gene benchmarks (HBB, PCSK9, TTR)  
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
    pamVariant: 'SpCas9',
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
    pamVariant: 'SpCas9',
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
    pamVariant: 'SpCas9',
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
**Description:** Dual-strand codon-aware base editing discovery & bystander scoring  
**Path:** `src/engines/crispr/guideScanner.ts`

```typescript
// src/engines/crispr/guideScanner.ts
import {
  BASE_EDITOR_DEFINITIONS,
  type BystanderEdit,
  type GenePreset,
  type GuideCandidate,
  type PamVariant,
} from '../types';

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
  const clean = seq.toUpperCase();
  let protein = '';
  for (let i = 0; i <= clean.length - 3; i += 3) {
    const codon = clean.slice(i, i + 3);
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

export type PamClassification = 'preferred' | 'relaxed';

/**
 * Classifies a concrete three-base PAM for the selected Cas9 variant.
 * Standard SpCas9 accepts NGG preferentially and NAG as a relaxed motif;
 * SpCas9-NG expands recognition to NGN; SpRY is modeled as NNN with an
 * NRN-over-NYN preference for ranking.
 */
export function classifyPam(
  pam: string,
  pamVariant: PamVariant = 'SpCas9'
): PamClassification | null {
  const normalizedPam = pam.toUpperCase();
  if (!/^[ACGT]{3}$/.test(normalizedPam)) return null;

  const [, secondBase, thirdBase] = normalizedPam;

  switch (pamVariant) {
    case 'SpCas9':
      if (secondBase === 'G' && thirdBase === 'G') return 'preferred';
      // NAG is 5'-N-A-G-3', not NGA.
      if (secondBase === 'A' && thirdBase === 'G') return 'relaxed';
      return null;
    case 'SpCas9-NG':
      if (secondBase !== 'G') return null;
      return thirdBase === 'G' ? 'preferred' : 'relaxed';
    case 'SpRY':
      return secondBase === 'A' || secondBase === 'G' ? 'preferred' : 'relaxed';
  }
}

export function isPreferredPam(pam: string, pamVariant: PamVariant = 'SpCas9'): boolean {
  return classifyPam(pam, pamVariant) === 'preferred';
}

function scoreGuideCandidate(
  hasPreferredPam: boolean,
  gcContent: number,
  targetInWindow: boolean,
  targetAtPeakCenter: boolean,
  hasPolIIITerminator: boolean,
  edits: BystanderEdit[],
  hasSasSnpCollision: boolean
): { score: number; verdict: GuideCandidate['verdict'] } {
  let score = hasPreferredPam ? 65 : 48;

  if (gcContent >= 40 && gcContent <= 60) {
    score += 15;
  } else if (gcContent < 30 || gcContent > 75) {
    score -= 10;
  }

  if (targetInWindow) {
    score += 35;
    if (targetAtPeakCenter) score += 4;
  } else {
    score -= 25;
  }

  if (hasPolIIITerminator) {
    score -= 30;
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
  if (targetInWindow && !hasHarmfulBystander && !hasSasSnpCollision && !hasPolIIITerminator) {
    verdict = hasSilentBystander ? 'Safe (Silent Bystander)' : 'Optimal Clinical Guide';
  } else if (hasHarmfulBystander || hasSasSnpCollision) {
    verdict = 'High Risk (Bystander/SNP)';
  }

  return { score, verdict };
}

/**
 * Dual-Strand Codon-Aware CRISPR & Base Editor Discovery Engine.
 * Scans both sense (+) and antisense (-) strands for 20nt protospacers with a
 * selected nuclease's valid 3' PAM, simulates co-editing across the selected
 * deaminase window, audits codon consequences,
 * and flags South Asian (SAS) polymorphism collisions across the full 23-nt target + PAM span.
 */
export function scanForGuides(preset: GenePreset): GuideCandidate[] {
  const seq = preset.sequence.toUpperCase();
  const candidates: GuideCandidate[] = [];
  const editor = BASE_EDITOR_DEFINITIONS[preset.editorType];
  const pamVariant = preset.pamVariant ?? 'SpCas9';
  const { targetBase, replacementBase } = editor;
  const [windowStart, windowEnd] = editor.editingWindow;

  // 1. Scan Sense (+) Strand (5'-[20nt spacer]-[3nt PAM]-3' covering sense indices i .. i+22)
  for (let i = 0; i <= seq.length - 23; i++) {
    const spacer = seq.slice(i, i + 20);
    const pam = seq.slice(i + 20, i + 23);

    const pamClassification = classifyPam(pam, pamVariant);
    if (!pamClassification) continue;
    const hasPreferredPam = pamClassification === 'preferred';

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);
    const hasPolIIITerminator = spacer.includes('TTTT');

    // Pre-compute co-editing across the selected editor's window on the sense strand.
    const editedSeqChars = seq.split('');
    for (let pos = windowStart; pos <= windowEnd; pos++) {
      const gIdx = i + (pos - 1);
      if (gIdx >= 0 && gIdx < seq.length && seq[gIdx] === targetBase) {
        editedSeqChars[gIdx] = replacementBase;
      }
    }
    const coEditedSeq = editedSeqChars.join('');

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;
    let targetAtPeakCenter = false;

    for (let pos = windowStart; pos <= windowEnd; pos++) {
      const genomicIdx = i + (pos - 1);
      if (genomicIdx < 0 || genomicIdx >= seq.length) continue;

      if (seq[genomicIdx] === targetBase) {
        const codonStart = Math.floor(genomicIdx / 3) * 3;
        const originalCodon = seq.slice(codonStart, codonStart + 3);
        if (originalCodon.length < 3) continue;

        const editedCodon = coEditedSeq.slice(codonStart, codonStart + 3);
        const origAA = CODON_TABLE[originalCodon] || '?';
        const editAA = CODON_TABLE[editedCodon] || '?';

        const isTarget = genomicIdx === preset.mutationIndex;
        if (isTarget) {
          targetInWindow = true;
          if (editor.peakPositions.includes(pos)) targetAtPeakCenter = true;
        }

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
    const { score, verdict } = scoreGuideCandidate(
      hasPreferredPam,
      gcContent,
      targetInWindow,
      targetAtPeakCenter,
      hasPolIIITerminator,
      edits,
      hasSasSnpCollision
    );

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

  // 2. Scan Antisense (-) Strand
  // Spacer spans sense indices i .. i+19 (5' at i+19 running toward 3' at i).
  // The 3' downstream antisense PAM strictly sits at sense indices i-3 .. i-1.
  for (let i = 3; i <= seq.length - 20; i++) {
    const spacer = reverseComplement(seq.slice(i, i + 20));
    const pam = reverseComplement(seq.slice(i - 3, i));

    const pamClassification = classifyPam(pam, pamVariant);
    if (!pamClassification) continue;
    const hasPreferredPam = pamClassification === 'preferred';

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);
    const hasPolIIITerminator = spacer.includes('TTTT');

    // Antisense A->G produces sense T->C; Antisense C->T produces sense G->A
    const senseReplacement = targetBase === 'A' ? 'C' : 'A';
    const editedSeqChars = seq.split('');
    for (let pos = windowStart; pos <= windowEnd; pos++) {
      const gIdx = (i + 19) - (pos - 1);
      if (gIdx >= 0 && gIdx < seq.length && reverseComplement(seq[gIdx]) === targetBase) {
        editedSeqChars[gIdx] = senseReplacement;
      }
    }
    const coEditedSeq = editedSeqChars.join('');

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;
    let targetAtPeakCenter = false;

    for (let pos = windowStart; pos <= windowEnd; pos++) {
      const genomicIdx = (i + 19) - (pos - 1);
      if (genomicIdx < 0 || genomicIdx >= seq.length) continue;

      const currentBaseOnStrand = reverseComplement(seq[genomicIdx]);
      if (currentBaseOnStrand === targetBase) {
        const codonStart = Math.floor(genomicIdx / 3) * 3;
        const originalCodon = seq.slice(codonStart, codonStart + 3);
        if (originalCodon.length < 3) continue;

        const editedCodon = coEditedSeq.slice(codonStart, codonStart + 3);
        const origAA = CODON_TABLE[originalCodon] || '?';
        const editAA = CODON_TABLE[editedCodon] || '?';

        const isTarget = genomicIdx === preset.mutationIndex;
        if (isTarget) {
          targetInWindow = true;
          if (editor.peakPositions.includes(pos)) targetAtPeakCenter = true;
        }

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

    // Full 23-nt antisense footprint spans PAM (i-3 .. i-1) + spacer (i .. i+19)
    const hasSasSnpCollision = preset.sasSnpIndex >= i - 3 && preset.sasSnpIndex <= i + 19;
    const { score, verdict } = scoreGuideCandidate(
      hasPreferredPam,
      gcContent,
      targetInWindow,
      targetAtPeakCenter,
      hasPolIIITerminator,
      edits,
      hasSasSnpCollision
    );

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
**Description:** Golden Gate BsmBI / BpiI (Esp3I) cloning oligo synthesis designer  
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
  const cleanSpacer = spacer.trim().toUpperCase();
  const needsG = cleanSpacer[0] !== 'G';
  const fwdCore = (needsG ? 'G' : '') + cleanSpacer;
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
**Description:** ImmunoShield Cas9 de-immunization catalog for South Asian HLA alleles  
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
    hlaAlleles: ['HLA-A*02:01', 'HLA-A*24:02'],
    bindingScore: 92,
    stealthMutation: 'L240T (Disrupts MHC-I anchor pocket B without touching DNA groove)',
    catalyticSafe: true
  },
  {
    peptide: 'KTYAHLFDD',
    residueRange: 'aa 836–844',
    domain: 'HNH Catalytic Core (Contains H840)',
    hlaAllele: 'HLA-A*11:01 (High South Asian Frequency ~21%)',
    hlaAlleles: ['HLA-A*11:01'],
    bindingScore: 84,
    stealthMutation: 'K836R (Preserves H840 active-site histidine required for strand nicking)',
    catalyticSafe: true
  },
  {
    peptide: 'IYLAAANRL',
    residueRange: 'aa 1012–1020',
    domain: 'RuvC-III Domain',
    hlaAllele: 'HLA-A*24:02 (South Asian Frequency ~18%)',
    hlaAlleles: ['HLA-A*24:02'],
    bindingScore: 88,
    stealthMutation: 'L1020G (Eliminates C-terminal anchor binding to HLA groove)',
    catalyticSafe: true
  },
  {
    peptide: 'FEDFLKNRM',
    residueRange: 'aa 418–426',
    domain: 'Bridge Helix (Structural Stability)',
    hlaAllele: 'HLA-B*40:06 (High Dravidian / SAS Frequency ~14%)',
    hlaAlleles: ['HLA-B*40:06'],
    bindingScore: 81,
    stealthMutation: 'F421A (Masks hydrophobic anchor while preserving alpha-helical backbone)',
    catalyticSafe: true
  },
  {
    peptide: 'TLYETRRDL',
    residueRange: 'aa 674–682',
    domain: 'REC3 Domain (Target RNA Alignment)',
    hlaAllele: 'HLA-B*15:02 (High Indo-Aryan SAS Frequency ~12%)',
    hlaAlleles: ['HLA-B*15:02'],
    bindingScore: 78,
    stealthMutation: 'L675S (Ablates C-terminal peptide binding to MHC cleft)',
    catalyticSafe: true
  }
];

/** Alleles represented by the curated South Asian panel. */
export const SOUTH_ASIAN_HLA_ALLELES = Array.from(
  new Set(CAS9_EPITOPE_HOTSPOTS.flatMap((epitope) => epitope.hlaAlleles))
).sort();

/**
 * Returns the curated epitopes relevant to at least one patient-selected HLA
 * allele. An empty selection intentionally returns no result: callers should
 * present that state as "not assessed", rather than as zero risk.
 */
export function filterEpitopesByHlaAlleles(
  selectedAlleles: readonly string[],
  epitopes: readonly EpitopeHotspot[] = CAS9_EPITOPE_HOTSPOTS
): EpitopeHotspot[] {
  const selected = new Set(selectedAlleles.map((allele) => allele.toUpperCase()));
  if (selected.size === 0) return [];

  return epitopes.filter((epitope) =>
    epitope.hlaAlleles.some((allele) => selected.has(allele.toUpperCase()))
  );
}

/**
 * Calculates the average illustrative residual HLA risk for the supplied
 * patient-relevant epitopes. Active stealth mutations reduce an epitope to an
 * explicitly bounded residual score; this is a UI heuristic, not an HLA
 * binding or clinical immunogenicity predictor.
 */
export function calculateHlaRiskScore(
  activeEpitopes: readonly EpitopeHotspot[] = CAS9_EPITOPE_HOTSPOTS,
  activeStealthMutations: Readonly<Record<string, boolean>> = {}
): number {
  if (activeEpitopes.length === 0) return 0;
  const avg =
    activeEpitopes.reduce(
      (acc, epitope) =>
        acc + (activeStealthMutations[epitope.peptide] ? Math.min(8, epitope.bindingScore) : epitope.bindingScore),
      0
    ) / activeEpitopes.length;
  return Math.round(avg);
}
```

---

### 4.13 `src/engines/nanotech/lnpSimulator.ts`
**Description:** LNP biophysics, Henderson-Hasselbalch, CPP, and SORT organ biodistribution  
**Path:** `src/engines/nanotech/lnpSimulator.ts`

```typescript
// src/engines/nanotech/lnpSimulator.ts
import type { LnpFormulation, LnpBiophysicsResult } from '../types';

/**
 * Nanotech LNP Biophysical & CMC Simulation Engine.
 * Models 4-component lipid nanoparticle assembly, Henderson-Hasselbalch ionization,
 * De Gennes polymer brush scaling, Israelachvili Critical Packing Parameter (CPP),
 * SAXS Bragg repeat distance, and SORT organ biodistribution.
 */
export function simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
  const rawTotal = form.ionizableLipid + form.dspcHelper + form.cholesterol + form.pegLipid;
  const total = rawTotal > 0 ? rawTotal : 100;

  const normDspc = (form.dspcHelper / total) * 100;
  const normChol = (form.cholesterol / total) * 100;
  const normPeg = Math.max(0.1, (form.pegLipid / total) * 100);

  // 1. Hydrodynamic diameter (Dh in nm): Higher PEG-lipid increases surface curvature -> smaller particle
  const rawDiameter =
    135 -
    24 * Math.log(Math.max(0.3, normPeg * 2.2)) +
    (6 - form.npRatio) * 3.5 +
    (normDspc - 10) * 0.45;
  const diameterNm = Math.round(Math.max(42, Math.min(210, rawDiameter)));

  // 2. Polydispersity Index (PDI)
  const cholDeviation = Math.abs(normChol - 38.5) * 0.004;
  const dspcDeviation = Math.abs(normDspc - 10.0) * 0.0025;
  const lowPegPenalty = normPeg < 1.0 ? 0.12 : 0;
  const pdi = Number(Math.min(0.45, 0.06 + cholDeviation + dspcDeviation + lowPegPenalty).toFixed(2));

  // 3. Henderson-Hasselbalch Ionization: % = 100 / (1 + 10^(pH - pKa))
  const endosomalProtonationPct = Math.round(100 / (1 + Math.pow(10, 5.5 - form.lipidPka)));
  const bloodProtonationPct = Math.round(100 / (1 + Math.pow(10, 7.4 - form.lipidPka)));

  // 4. Zeta Potential at physiological pH 7.4 (mV)
  const zetaPotentialMv = Number(((bloodProtonationPct * 0.35) - (normPeg * 2.1)).toFixed(1));

  // 5. The "PEG Dilemma" & Cellular Uptake
  const pegPenalty = normPeg > 2.2 ? Math.max(10, 100 - Math.pow(normPeg - 2.0, 1.8) * 18) : 95;
  const cellularUptakeScore = Math.round(Math.min(98, Math.max(8, pegPenalty)));

  // 6. Endosomal Escape combines protonation at pH 5.5 + pKa sweet spot + low PEG barrier
  const pkaSweetSpotBonus = Math.max(0, 100 - Math.abs(form.lipidPka - 6.35) * 55);
  const endosomalEscapeEfficiency = Math.round(
    Math.min(
      99,
      Math.max(5, endosomalProtonationPct * 0.4 + pkaSweetSpotBonus * 0.35 + cellularUptakeScore * 0.25)
    )
  );

  // 7. Organ Tropism (SORT - Selective Organ Targeting model with strict non-negative conservation)
  let liver = 78;
  let spleen = 15;
  let lungs = 7;

  if (form.lipidPka > 6.7 || zetaPotentialMv > 8) {
    const pkaShift = Math.max(0, (form.lipidPka - 6.5) * 45);
    const zetaShift = Math.max(0, (zetaPotentialMv - 5) * 2.2);
    lungs = Math.min(68, Math.max(12, Math.round(15 + pkaShift + zetaShift)));
    liver = Math.max(20, 78 - lungs);
    spleen = Math.max(4, 100 - liver - lungs);
    liver = 100 - lungs - spleen;
  } else if (form.lipidPka < 6.0 || zetaPotentialMv < -5) {
    const pkaShift = Math.max(0, (6.2 - form.lipidPka) * 50);
    const anionicShift = Math.max(0, (-4 - zetaPotentialMv) * 3.5);
    spleen = Math.min(62, Math.max(18, Math.round(20 + pkaShift + anionicShift)));
    liver = Math.max(25, 82 - spleen);
    lungs = Math.max(4, 100 - liver - spleen);
    liver = 100 - spleen - lungs;
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
**Description:** Microfluidic wet-lab stoichiometry and CMC phase mass preparation calculator  
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
  const safeVolumeMl = Math.max(0.1, targetVolumeMl);
  const safeMrnaConc = Math.max(0.01, mrnaConcMgMl);
  const safeIonizablePct = Math.max(1.0, form.ionizableLipid);

  const totalMrnaMassMg = Number((safeVolumeMl * safeMrnaConc).toFixed(2));
  // Moles of phosphate (avg nucleotide MW in mRNA is ~330 g/mol)
  const mmolesPhosphate = totalMrnaMassMg / 330;
  // Required moles of ionizable nitrogen based on N/P ratio
  const mmolesIonizable = mmolesPhosphate * form.npRatio;
  const totalLipidMmoles = mmolesIonizable / (safeIonizablePct / 100);

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

  const volLiters = safeVolumeMl / 1000;

  return {
    targetVolumeMl: safeVolumeMl,
    mrnaConcMgMl: safeMrnaConc,
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
**Description:** Hexagonal service layer with Local in-browser and Remote Python fallback adapters  
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
 * Hybrid Remote Python / FastAPI Adapter with Instant Local Fallback Cache.
 * Communicates with http://localhost:8000/api/v1 while maintaining zero-latency
 * synchronous compatibility for React concurrent rendering.
 */
export class RemotePythonBioEngineService implements IBioEngineService {
  private baseUrl: string;
  private localFallback: LocalBioEngineService;
  private guideCache: Map<string, GuideCandidate[]>;
  private lnpCache: Map<string, LnpBiophysicsResult>;

  constructor(baseUrl: string = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
    this.localFallback = new LocalBioEngineService();
    this.guideCache = new Map();
    this.lnpCache = new Map();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchScanGuides(preset: GenePreset): Promise<GuideCandidate[]> {
    const cacheKey = `${preset.id}:${preset.editorType}:${preset.pamVariant ?? 'SpCas9'}:${preset.mutationIndex}:${preset.sequence}`;
    try {
      const res = await fetch(`${this.baseUrl}/crispr/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
      if (res.ok) {
        const data = (await res.json()) as GuideCandidate[];
        this.guideCache.set(cacheKey, data);
        return data;
      }
    } catch {
      // Offline fallback to local engine
    }
    return this.localFallback.scanGuides(preset);
  }

  async fetchLnpBiophysics(form: LnpFormulation): Promise<LnpBiophysicsResult> {
    const cacheKey = JSON.stringify(form);
    try {
      const res = await fetch(`${this.baseUrl}/nanotech/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = (await res.json()) as LnpBiophysicsResult;
        this.lnpCache.set(cacheKey, data);
        return data;
      }
    } catch {
      // Offline fallback to local engine
    }
    return this.localFallback.simulateLnpBiophysics(form);
  }

  scanGuides(preset: GenePreset): GuideCandidate[] {
    const cacheKey = `${preset.id}:${preset.editorType}:${preset.pamVariant ?? 'SpCas9'}:${preset.mutationIndex}:${preset.sequence}`;
    const cached = this.guideCache.get(cacheKey);
    if (cached) return cached;
    return this.localFallback.scanGuides(preset);
  }

  generateCloningOligos(spacer: string): CloningOligos {
    return this.localFallback.generateCloningOligos(spacer);
  }

  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
    const cacheKey = JSON.stringify(form);
    const cached = this.lnpCache.get(cacheKey);
    if (cached) return cached;
    return this.localFallback.simulateLnpBiophysics(form);
  }

  calculateBatchMasses(
    form: LnpFormulation,
    targetVolumeMl?: number,
    mrnaConcMgMl?: number
  ): BatchMassCalculation {
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
export const remoteBioEngineService = new RemotePythonBioEngineService('http://localhost:8000/api/v1');
export const bioEngineService: IBioEngineService = remoteBioEngineService;
```

---

### 4.16 `src/engines/index.ts`
**Description:** Engines module public API re-exports  
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
**Description:** Legacy facade re-exporting all modular bio-engines  
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
**Description:** React 19 concurrent root initialization  
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
**Description:** Interactive WebGL Three.js cutaway model with Fibonacci lattice and Cryo-TEM scale bar  
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

// Fixed upper-bound capacities for zero-reallocation GPU InstancedMesh buffers
const MAX_LIPID_HEADS = 2400;
const MAX_ACYL_TAILS = 4800;
const MAX_PEG_BEADS = 8400;
const MAX_MICELLES = 420;
const MAX_RNA_RUNGS = 180;

// Fast spatial cutaway predicate for unit-sphere coordinates
function isPointCut(x: number, _y: number, z: number, mode: CutawayMode): boolean {
  if (mode === 'full' || mode === 'core') return false;
  if (mode === 'half') {
    return z > 0.0;
  }
  if (mode === 'quarter') {
    // Clean front-right quadrant cutaway (x > 0 and z > 0) matching orthogonal half-disk caps
    return x > 0.0 && z > 0.0;
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

  // Pre-allocated InstancedMesh refs (<8 GPU draw calls total)
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

  // Quantized protonation (2% steps) for electron-density texture caching
  const quantizedProtonation = useMemo(() => {
    return Math.round(liveProtonation * 50) / 50;
  }, [liveProtonation]);

  // Israelachvili Critical Packing Parameter (CPP = v / (a0 * lc))
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

  // 1. High-density Fibonacci lattice: 2,400 outer lipids + 4,800 sn-1/sn-2 acyl chains
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

    // PEG brush physics: De Gennes mushroom (<2.2 mol%) vs dense brush (>=2.2 mol%)
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
        col.set(tokens.colors.pigments.petrol);
      } else if (seed < pegFrac + dspcFrac) {
        type = 'dspc';
        headScale = 0.031;
        col.set(tokens.colors.pigments.ivory);
      } else if (seed < pegFrac + dspcFrac + cholFrac) {
        type = 'chol';
        headScale = 0.024;
        tailLen = shellThickness * 0.52;
        col.set(tokens.colors.pigments.terracotta);
      } else {
        if (opticalMode === 'electrostatic') {
          col.lerpColors(
            new THREE.Color(tokens.colors.pigments.ochre),
            new THREE.Color(tokens.colors.status.success),
            liveProtonation
          );
        } else if (opticalMode === 'cryo') {
          col.set('#a89f91');
        } else {
          col.lerpColors(
            new THREE.Color('#c49245'),
            new THREE.Color(tokens.colors.status.success),
            liveProtonation * 0.65
          );
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

      // Build orthonormal tangent basis on sphere surface
      const refAxis = Math.abs(norm.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const tangent = new THREE.Vector3().crossVectors(norm, refAxis).normalize();
      const bitangent = new THREE.Vector3().crossVectors(norm, tangent).normalize();

      const baseQuat = new THREE.Quaternion().setFromUnitVectors(upVec, norm);
      const tailColor = new THREE.Color(
        opticalMode === 'cryo' ? '#575046' : type === 'chol' ? '#6e3d32' : '#4a4033'
      );

      if (type === 'chol') {
        const center = norm.clone().multiplyScalar(radialOffset - tailLen * 0.5);
        dummyObj.position.copy(center);
        dummyObj.quaternion.copy(baseQuat);
        dummyObj.scale.set(0.011, tailLen, 0.011);
        dummyObj.updateMatrix();
        tMats.push(dummyObj.matrix.clone());
        tCols.push(tailColor);
      } else {
        // Dual splayed acyl chains (sn-1 & sn-2): premultiply world-space tangent rotation
        for (const dir of [-1, 1]) {
          const splayQuat = new THREE.Quaternion().setFromAxisAngle(tangent, dir * splayAngle);
          const finalQuat = baseQuat.clone().premultiply(splayQuat);
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

      // Populate PEG2000 polymer brush segments
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

  // 2. Decoupled RNA Helices & Watson-Crick Rungs (depends ONLY on coreRadius, never rebuilt on pH scrub)
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

    const rM = coreRadius * 0.68;
    const stepsM = MAX_RNA_RUNGS;
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

      if (i < stepsM) {
        const diff = new THREE.Vector3().subVectors(pB, pA);
        const len = diff.length();
        const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
        dummy.position.copy(mid);
        dummy.quaternion.setFromUnitVectors(upVec, diff.normalize());
        dummy.scale.set(0.008, len * 0.88, 0.008);
        dummy.updateMatrix();
        rMats.push(dummy.matrix.clone());

        const isGC = i % 3 !== 0;
        rCols.push(
          new THREE.Color(isGC ? tokens.colors.pigments.ochre : tokens.colors.pigments.terracotta)
        );
      }
    }

    const curveA = new THREE.CatmullRomCurve3(ptsA, true);
    const curveB = new THREE.CatmullRomCurve3(ptsB, true);
    const tubeA = new THREE.TubeGeometry(curveA, 150, coreRadius * 0.022, 7, true);
    const tubeB = new THREE.TubeGeometry(curveB, 150, coreRadius * 0.018, 7, true);

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

    return {
      mrnaStrandAGeo: tubeA,
      mrnaStrandBGeo: tubeB,
      sgrnaGeo: tubeS,
      rungMatrices: rMats,
      rungColors: rCols,
    };
  }, [coreRadius]);

  // Dispose TubeGeometries cleanly when coreRadius changes or component unmounts
  useEffect(() => {
    return () => {
      mrnaStrandAGeo.dispose();
      mrnaStrandBGeo.dispose();
      sgrnaGeo.dispose();
    };
  }, [mrnaStrandAGeo, mrnaStrandBGeo, sgrnaGeo]);

  // 3. Inverted-Micelle (H_II phase) Ionizable Lipid + Aqueous Pore Nanoclusters
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
      micelleMatrices: mMats,
      micelleColors: mCols,
    };
  }, [coreRadius, cutawayMode, liveProtonation]);

  // Upload InstancedMesh matrices, colors, and active instance counts to GPU in place
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
    }

    if (pegMeshRef.current) {
      pegMeshRef.current.count = pegBaseData.length;
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

  // Real-time Brownian PEG polymer brush dynamics in useFrame
  const pegDummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.2;
    }

    if (pegMeshRef.current && visibility.peg && cutawayMode !== 'core' && pegBaseData.length > 0) {
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

  // Quantized electron-density cross-section texture with explicit WebGL disposal
  const electronDensityTex = useMemo(
    () => createElectronDensityTexture(quantizedProtonation),
    [quantizedProtonation]
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
    return 0.25;
  };

  const showOuterShell = cutawayMode !== 'core';

  return (
    <group ref={groupRef}>
      {/* 1. Subsurface Scattering (SSS) Core Aqueous/Lipid Envelope */}
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
          <mesh position={[0.14 * coreRadius, 0.06 * coreRadius, 0]}>
            <sphereGeometry args={[coreRadius * 0.22, 24, 24]} />
            <meshPhysicalMaterial
              color={tokens.colors.pigments.mauve}
              roughness={0.35}
              clearcoat={0.4}
              transparent
              opacity={0.82 * getLayerOpacity('mrna')}
            />
          </mesh>
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

      {/* 3. Double-Stranded Base-Paired mRNA Helix & sgRNA Scaffold */}
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
              color={tokens.colors.status.warning}
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
          <instancedMesh
            ref={rungsMeshRef}
            args={[undefined, undefined, MAX_RNA_RUNGS]}
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
          args={[undefined, undefined, MAX_MICELLES]}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial
            roughness={0.55}
            transparent={inspectedLayer !== 'all'}
            opacity={0.85 * getLayerOpacity('mrna')}
          />
        </instancedMesh>
      )}

      {/* 5. Instanced Dual-Chain (sn-1 / sn-2) Hydrophobic Acyl Tails */}
      {showOuterShell && visibility.tails && (
        <instancedMesh
          ref={tailsMeshRef}
          args={[undefined, undefined, MAX_ACYL_TAILS]}
        >
          <cylinderGeometry args={[1, 0.85, 1, 6]} />
          <meshStandardMaterial
            roughness={0.68}
            transparent={inspectedLayer !== 'all'}
            opacity={getLayerOpacity('tails')}
          />
        </instancedMesh>
      )}

      {/* 6. Instanced Outer Monolayer Polar Lipid Headgroups */}
      {showOuterShell && visibility.lipids && (
        <instancedMesh
          ref={headsMeshRef}
          args={[undefined, undefined, MAX_LIPID_HEADS]}
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

      {/* 7. Instanced Dynamic PEG2000 Polymer Brush Corona */}
      {showOuterShell && visibility.peg && (
        <instancedMesh
          ref={pegMeshRef}
          args={[undefined, undefined, MAX_PEG_BEADS]}
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

      {/* 9. Hardware Cross-Section Electron-Density Slice Caps */}
      {cutawayMode === 'half' && (
        <mesh position={[0, 0, 0]}>
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
          {/* Z = 0 half-disk cap spanning X >= 0 across full vertical axis */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <ringGeometry args={[coreRadius * 0.15, radius * 0.99, 48, 1, -Math.PI / 2, Math.PI]} />
            <meshBasicMaterial
              map={electronDensityTex}
              transparent
              opacity={0.58}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* X = 0 half-disk cap spanning Z >= 0 across full vertical axis */}
          <mesh position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <ringGeometry args={[coreRadius * 0.15, radius * 0.99, 48, 1, -Math.PI / 2, Math.PI]} />
            <meshBasicMaterial
              map={electronDensityTex}
              transparent
              opacity={0.58}
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

  // Live De Gennes Polymer Brush & Biophysical Telemetry synchronized with engine
  const advancedMetrics = useMemo(() => {
    const pegMolFraction = Math.max(0.002, formulation.pegLipid / 100);
    const graftingDistanceNm = Math.sqrt(0.65 / pegMolFraction);
    const deGennesRatio = biophysics.deGennesRfOverD ?? Number((3.43 / graftingDistanceNm).toFixed(2));

    const liveIonizationPct = Math.round(
      100 / (1 + Math.pow(10, ambientPh - formulation.lipidPka))
    );

    const cpp = Number((1.08 + (liveIonizationPct / 100) * 0.58).toFixed(2));
    const stokesDiffusivity = Number((458 / biophysics.diameterNm).toFixed(1));
    const saxsSpacing = biophysics.saxsBraggSpacingNm ?? 6.1;

    return {
      deGennesRatio,
      graftingDistanceNm: graftingDistanceNm.toFixed(1),
      liveIonizationPct,
      cpp,
      stokesDiffusivity,
      saxsSpacing,
      phaseState: cpp >= 1.45 ? 'Inverted Hexagonal (HII Fusion)' : 'Lamellar / Micellar (Lα)',
    };
  }, [
    formulation.pegLipid,
    formulation.lipidPka,
    ambientPh,
    biophysics.diameterNm,
    biophysics.deGennesRfOverD,
    biophysics.saxsBraggSpacingNm,
  ]);

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
          title: `Quaternary Cas9/ABE8e RNP + Base-Paired mRNA Core (SAXS d ≈ ${advancedMetrics.saxsSpacing} nm)`,
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
            <span className="text-[#a69b8d]">pH:</span>
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
            className="px-2 py-0.5 text-[10px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer"
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
            className="px-2 py-0.5 text-[10px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 2. Interactive Layer Selector Bar */}
      <div className="relative z-10 px-2 py-1 flex items-center justify-between text-[10px] text-[#a69b8d] border-b border-[#24201b] bg-[#151310]/80">
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

        <div className="text-[10px] font-mono text-[#70675c] hidden md:block">
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
            Cryo-TEM calibrated • SAXS d = {advancedMetrics.saxsSpacing} nm
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

### 4.20 `src/components/GenomicSequenceViewer.tsx`
**Description:** Multi-track monospace genomic ruler, reading frame codons, and telemetry inspector  
**Path:** `src/components/GenomicSequenceViewer.tsx`

```tsx
// src/components/GenomicSequenceViewer.tsx
import { useState, useMemo } from 'react';
import {
  BASE_EDITOR_DEFINITIONS,
  type BystanderEdit,
  type GenePreset,
  type GuideCandidate,
} from '../engines/types';
import { tokens } from '../styles/tokens';
import { Copy, Check, Info, Crosshair, ArrowRight, ArrowLeft } from 'lucide-react';

interface GenomicSequenceViewerProps {
  preset: GenePreset;
  selectedGuide?: GuideCandidate;
  wildTypeProtein: string;
  onSelectGuideIdx?: (idx: number) => void;
}

// 3-letter and full name amino acid dictionary
const AA_DICTIONARY: Record<string, { code3: string; name: string }> = {
  A: { code3: 'Ala', name: 'Alanine' },
  R: { code3: 'Arg', name: 'Arginine' },
  N: { code3: 'Asn', name: 'Asparagine' },
  D: { code3: 'Asp', name: 'Aspartic Acid' },
  C: { code3: 'Cys', name: 'Cysteine' },
  E: { code3: 'Glu', name: 'Glutamic Acid' },
  Q: { code3: 'Gln', name: 'Glutamine' },
  G: { code3: 'Gly', name: 'Glycine' },
  H: { code3: 'His', name: 'Histidine' },
  I: { code3: 'Ile', name: 'Isoleucine' },
  L: { code3: 'Leu', name: 'Leucine' },
  K: { code3: 'Lys', name: 'Lysine' },
  M: { code3: 'Met', name: 'Methionine' },
  F: { code3: 'Phe', name: 'Phenylalanine' },
  P: { code3: 'Pro', name: 'Proline' },
  S: { code3: 'Ser', name: 'Serine' },
  T: { code3: 'Thr', name: 'Threonine' },
  W: { code3: 'Trp', name: 'Tryptophan' },
  Y: { code3: 'Tyr', name: 'Tyrosine' },
  V: { code3: 'Val', name: 'Valine' },
  '*': { code3: 'Stop', name: 'Stop Codon' },
  '?': { code3: 'Unk', name: 'Unknown' },
};

// Base color styling (vintage scientific pigment scheme)
const getBaseLetterColor = (base: string): string => {
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

const BASE_WIDTH_PX = 22; // Exact cell width for monospace character grid
const CODON_WIDTH_PX = BASE_WIDTH_PX * 3; // 66px per 3-base codon triad

export function GenomicSequenceViewer({
  preset,
  selectedGuide,
  wildTypeProtein,
}: GenomicSequenceViewerProps) {
  const [hoveredBaseIdx, setHoveredBaseIdx] = useState<number | null>(null);
  const [copiedType, setCopiedType] = useState<'cds' | 'protein' | null>(null);

  const sequence = preset.sequence.toUpperCase();
  const seqLength = sequence.length;
  const numCodons = Math.ceil(seqLength / 3);
  const totalTrackWidth = seqLength * BASE_WIDTH_PX;
  const editorDefinition = BASE_EDITOR_DEFINITIONS[preset.editorType];
  const [windowStartPosition, windowEndPosition] = editorDefinition.editingWindow;
  const editorWindowLabel = `${windowStartPosition}–${windowEndPosition}`;
  const editorWindowWidth = windowEndPosition - windowStartPosition + 1;

  // Active guide geometry calculations
  const guideMetrics = useMemo(() => {
    if (!selectedGuide) return null;

    const isSense = selectedGuide.strand === '+';
    const spacerStart = selectedGuide.startIndex;
    const spacerEnd = selectedGuide.startIndex + 19;

    // Deaminase window from the selected editor's 5' spacer positions.
    const windowStart = isSense
      ? spacerStart + (windowStartPosition - 1)
      : spacerStart + (20 - windowEndPosition);
    const windowEnd = isSense
      ? spacerStart + (windowEndPosition - 1)
      : spacerStart + (20 - windowStartPosition);

    // 3' PAM motif coordinates for the selected guide.
    const pamStart = isSense ? spacerStart + 20 : spacerStart - 3;
    const pamEnd = isSense ? spacerStart + 22 : spacerStart - 1;

    return {
      isSense,
      spacerStart,
      spacerEnd,
      windowStart,
      windowEnd,
      pamStart,
      pamEnd,
    };
  }, [selectedGuide, windowStartPosition, windowEndPosition]);

  // Copy sequence handlers
  const handleCopy = (text: string, type: 'cds' | 'protein') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Hover telemetry resolution
  const hoverTelemetry = useMemo(() => {
    const idx = hoveredBaseIdx !== null ? hoveredBaseIdx : preset.mutationIndex;
    if (idx < 0 || idx >= seqLength) return null;

    const base = sequence[idx];
    const codonIdx = Math.floor(idx / 3);
    const codonStart = codonIdx * 3;
    const codonTriad = sequence.slice(codonStart, codonStart + 3);
    const aaLetter = wildTypeProtein[codonIdx] || '?';
    const aaInfo = AA_DICTIONARY[aaLetter] || { code3: '???', name: 'Unknown' };

    const isTarget = idx === preset.mutationIndex;
    const isSnp = idx === preset.sasSnpIndex;

    let guideContext = 'Flanking Reference Sequence';
    let inWindow = false;
    let guidePos: number | null = null;

    if (selectedGuide && guideMetrics) {
      if (idx >= guideMetrics.spacerStart && idx <= guideMetrics.spacerEnd) {
        guidePos = guideMetrics.isSense
          ? idx - guideMetrics.spacerStart + 1
          : guideMetrics.spacerEnd - idx + 1;

        inWindow = idx >= guideMetrics.windowStart && idx <= guideMetrics.windowEnd;
        guideContext = `${selectedGuide.id} • Spacer pos ${guidePos} (Strand ${selectedGuide.strand})${
          inWindow ? ` • Deaminase Catalytic Window (pos ${editorWindowLabel})` : ''
        }`;
      } else if (idx >= guideMetrics.pamStart && idx <= guideMetrics.pamEnd) {
        guideContext = `${selectedGuide.id} • PAM Binding Motif (${selectedGuide.pam})`;
      }
    }

    // Bystander lookup
    const bystander = selectedGuide?.bystanders.find(
      (b: BystanderEdit) => b.genomicIndex === idx
    );

    return {
      idx,
      base,
      codonIdx,
      codonTriad,
      aaLetter,
      aaInfo,
      isTarget,
      isSnp,
      guideContext,
      inWindow,
      bystander,
    };
  }, [
    hoveredBaseIdx,
    preset,
    sequence,
    seqLength,
    wildTypeProtein,
    selectedGuide,
    guideMetrics,
    editorWindowLabel,
  ]);

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surface,
        borderColor: tokens.colors.border,
        borderRadius: tokens.radius,
      }}
      className="border p-3 flex flex-col gap-2.5 shadow-sm"
    >
      {/* Header Bar: Title, Clinical Context & Action Utilities */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#24201b]">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1] flex items-center gap-1.5">
            Coding sequence (5&apos; → 3&apos;) & reading frame architecture
          </h2>
          {selectedGuide && (
            <span className="text-[10px] font-mono-seq px-1.5 py-0.5 rounded-[2px] bg-[#4d828f]/15 border border-[#4d828f]/40 text-[#98c2cc]">
              {selectedGuide.id} ({selectedGuide.strand === '+' ? 'Sense +' : 'Antisense -'})
            </span>
          )}
        </div>

        {/* Legend: Publication-grade editorial indicators */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#a69b8d]">
          <span className="flex items-center gap-1.5" title="Pathogenic base edit target">
            <span className="w-2 h-2 rounded-full bg-[#bd5142] ring-1 ring-[#e27b6c]/60" />
            Target (bp {preset.mutationIndex + 1})
          </span>
          <span className="flex items-center gap-1.5" title="South Asian polymorphism marker">
            <span className="w-2 h-2 rotate-45 bg-[#c98a3b] ring-1 ring-[#df9e51]/60" />
            SAS SNP (bp {preset.sasSnpIndex + 1})
          </span>
          <span
            className="flex items-center gap-1.5"
            title={`Deaminase processive editing window (positions ${editorWindowLabel})`}
          >
            <span className="w-2.5 h-1.5 rounded-[1px] bg-[#c98a3b]/40 border border-[#c98a3b]" />
            Deaminase window ({editorWindowLabel})
          </span>
          <span className="flex items-center gap-1.5" title="Active 20-nt protospacer guide">
            <span className="w-2.5 h-1.5 rounded-[1px] bg-[#4d828f]/30 border border-[#4d828f]" />
            Protospacer (20 nt)
          </span>
          <span className="flex items-center gap-1.5" title="3' Adjacent Protospacer Adjacent Motif">
            <span className="w-2.5 h-1.5 rounded-[1px] bg-[#cfa052]/20 border border-[#cfa052]/60" />
            PAM ({selectedGuide?.pam ?? '—'})
          </span>

          {/* Quick Copy Buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-[#24201b]">
            <button
              onClick={() => handleCopy(sequence, 'cds')}
              className="px-1.5 py-0.5 text-[10px] rounded-[2px] bg-[#1c1a16] hover:bg-[#25221c] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] transition flex items-center gap-1 cursor-pointer"
              title="Copy 5' to 3' CDS sequence"
            >
              {copiedType === 'cds' ? <Check className="w-2.5 h-2.5 text-[#5e946c]" /> : <Copy className="w-2.5 h-2.5" />}
              {copiedType === 'cds' ? 'Copied' : 'CDS'}
            </button>
            <button
              onClick={() => handleCopy(wildTypeProtein, 'protein')}
              className="px-1.5 py-0.5 text-[10px] rounded-[2px] bg-[#1c1a16] hover:bg-[#25221c] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] transition flex items-center gap-1 cursor-pointer"
              title="Copy translated polypeptide sequence"
            >
              {copiedType === 'protein' ? <Check className="w-2.5 h-2.5 text-[#5e946c]" /> : <Copy className="w-2.5 h-2.5" />}
              {copiedType === 'protein' ? 'Copied' : 'Protein'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Multi-Track Horizontal Scroll Canvas */}
      <div
        style={{
          backgroundColor: tokens.colors.canvas,
          borderColor: tokens.colors.borderMuted,
          borderRadius: tokens.radius,
        }}
        className="p-3 border font-mono-seq text-xs overflow-x-auto select-none transition-colors"
      >
        <div style={{ width: `${totalTrackWidth}px`, minWidth: '100%' }} className="relative flex flex-col">
          
          {/* TRACK 1: GENOMIC COORDINATE RULER (Scale ticks every 5 bp, labels every 10 bp) */}
          <div className="flex items-end h-5 text-[9px] text-[#70675c] border-b border-[#24201b]/80 pb-0.5">
            {Array.from({ length: seqLength }).map((_, idx) => {
              const isTen = (idx + 1) % 10 === 0 || idx === 0;
              const isFive = (idx + 1) % 5 === 0 && !isTen;
              return (
                <div
                  key={idx}
                  style={{ width: `${BASE_WIDTH_PX}px` }}
                  className="shrink-0 flex flex-col items-center justify-end relative"
                >
                  {isTen && (
                    <span className="absolute -top-1 font-mono-seq text-[9px] text-[#a69b8d] tracking-tighter">
                      {idx + 1}
                    </span>
                  )}
                  <div
                    className={`w-[1px] ${
                      isTen ? 'h-2.5 bg-[#54493b]' : isFive ? 'h-1.5 bg-[#332e27]' : 'h-0.5 bg-[#24201b]'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* TRACK 2: AMINO ACID TRANSLATION RIBBON (Codon-aligned reading frame) */}
          <div className="flex items-center h-6 my-1">
            {Array.from({ length: numCodons }).map((_, codonIdx) => {
              const codonStart = codonIdx * 3;
              const aa = wildTypeProtein[codonIdx] || '?';
              const hasTarget = Math.floor(preset.mutationIndex / 3) === codonIdx;
              const hasSnp = Math.floor(preset.sasSnpIndex / 3) === codonIdx;
              const codonSeq = sequence.slice(codonStart, codonStart + 3);
              const isEven = codonIdx % 2 === 0;

              return (
                <div
                  key={codonIdx}
                  style={{ width: `${CODON_WIDTH_PX}px` }}
                  className={`shrink-0 h-full flex items-center justify-center relative transition-colors ${
                    isEven ? 'bg-[#181613]/40' : 'bg-transparent'
                  }`}
                  title={`Codon ${codonIdx + 1}: ${codonSeq} (${AA_DICTIONARY[aa]?.name || aa})`}
                >
                  {/* Subtle codon boundary tick mark at top */}
                  <div className="absolute top-0 right-0 w-[1px] h-1.5 bg-[#24201b]" />

                  {/* Amino acid 1-letter and index display */}
                  <div className="flex items-baseline gap-0.5 select-none">
                    <span
                      className={`text-[11px] font-semibold tracking-tight ${
                        hasTarget
                          ? 'text-[#e27b6c]'
                          : hasSnp
                          ? 'text-[#df9e51]'
                          : 'text-[#a69b8d]'
                      }`}
                    >
                      {aa}
                    </span>
                    <span className="text-[8px] text-[#54493b] font-mono-seq">
                      {codonIdx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 3: NUCLEOTIDE SEQUENCE (Continuous Highlight Architecture) */}
          <div className="flex items-center h-7 py-0.5">
            {sequence.split('').map((base, idx) => {
              const codonIdx = Math.floor(idx / 3);
              const isTarget = idx === preset.mutationIndex;
              const isSnp = idx === preset.sasSnpIndex;

              const inSpacer =
                guideMetrics &&
                idx >= guideMetrics.spacerStart &&
                idx <= guideMetrics.spacerEnd;

              const isSpacerStart = guideMetrics && idx === guideMetrics.spacerStart;
              const isSpacerEnd = guideMetrics && idx === guideMetrics.spacerEnd;

              const inWindow =
                guideMetrics &&
                idx >= guideMetrics.windowStart &&
                idx <= guideMetrics.windowEnd;

              const isWindowStart = guideMetrics && idx === guideMetrics.windowStart;
              const isWindowEnd = guideMetrics && idx === guideMetrics.windowEnd;

              const inPam =
                guideMetrics &&
                idx >= guideMetrics.pamStart &&
                idx <= guideMetrics.pamEnd;

              const isPamStart = guideMetrics && idx === guideMetrics.pamStart;
              const isPamEnd = guideMetrics && idx === guideMetrics.pamEnd;

              // CONTINUOUS SEAMLESS UNDERLAY LOGIC
              let bg = 'transparent';
              let borderTop = '1px solid transparent';
              let borderBottom = '1px solid transparent';
              let borderLeft = 'none';
              let borderRight = 'none';
              let roundedClass = 'rounded-none';
              let cellBoxShadow: string | undefined = undefined;

              if (inWindow) {
                bg = tokens.colors.sequence.deaminaseWindowBg;
                borderTop = `1.5px solid ${tokens.colors.sequence.deaminaseWindowBorder}`;
                borderBottom = `1.5px solid ${tokens.colors.sequence.deaminaseWindowBorder}`;
                if (isWindowStart) {
                  borderLeft = `1.5px solid ${tokens.colors.sequence.deaminaseWindowBorder}`;
                  roundedClass = 'rounded-l-[2px]';
                }
                if (isWindowEnd) {
                  borderRight = `1.5px solid ${tokens.colors.sequence.deaminaseWindowBorder}`;
                  roundedClass = isWindowStart ? 'rounded-[2px]' : 'rounded-r-[2px]';
                }
              } else if (inSpacer) {
                bg = tokens.colors.sequence.guideWindowBg;
                borderTop = `1px solid ${tokens.colors.sequence.guideWindowBorder}`;
                borderBottom = `1px solid ${tokens.colors.sequence.guideWindowBorder}`;
                if (isSpacerStart) {
                  borderLeft = `1px solid ${tokens.colors.sequence.guideWindowBorder}`;
                  roundedClass = 'rounded-l-[2px]';
                }
                if (isSpacerEnd) {
                  borderRight = `1px solid ${tokens.colors.sequence.guideWindowBorder}`;
                  roundedClass = isSpacerStart ? 'rounded-[2px]' : 'rounded-r-[2px]';
                }
              } else if (inPam) {
                bg = tokens.colors.sequence.pamBg;
                borderTop = `1px dashed ${tokens.colors.sequence.pamBorder}`;
                borderBottom = `1px dashed ${tokens.colors.sequence.pamBorder}`;
                if (isPamStart) {
                  borderLeft = `1px dashed ${tokens.colors.sequence.pamBorder}`;
                  roundedClass = 'rounded-l-[2px]';
                }
                if (isPamEnd) {
                  borderRight = `1px dashed ${tokens.colors.sequence.pamBorder}`;
                  roundedClass = isPamStart ? 'rounded-[2px]' : 'rounded-r-[2px]';
                }
              }

              // High-precision precision indicators for variants
              if (isTarget) {
                cellBoxShadow = 'inset 0 0 0 1.5px #bd5142, 0 0 8px rgba(189, 81, 66, 0.4)';
                bg = 'rgba(189, 81, 66, 0.28)';
              } else if (isSnp) {
                cellBoxShadow = 'inset 0 0 0 1.5px #c98a3b, 0 0 6px rgba(201, 138, 59, 0.35)';
                bg = 'rgba(201, 138, 59, 0.24)';
              }

              const isHovered = hoveredBaseIdx === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredBaseIdx(idx)}
                  onMouseLeave={() => setHoveredBaseIdx(null)}
                  style={{
                    width: `${BASE_WIDTH_PX}px`,
                    backgroundColor: bg,
                    borderTop,
                    borderBottom,
                    borderLeft,
                    borderRight,
                    boxShadow: cellBoxShadow,
                  }}
                  className={`h-full shrink-0 flex items-center justify-center relative cursor-pointer transition-all ${roundedClass} ${
                    isHovered ? 'ring-1 ring-[#e8dfd1]/80 z-20' : ''
                  }`}
                  title={`bp ${idx + 1} (${base}) • Codon ${codonIdx + 1}`}
                >
                  {/* Subtle target caret above character */}
                  {isTarget && (
                    <div className="absolute -top-1 text-[7px] text-[#e27b6c] select-none leading-none">
                      ▼
                    </div>
                  )}

                  {/* Subtle SNP diamond above character */}
                  {isSnp && !isTarget && (
                    <div className="absolute -top-1 text-[6px] text-[#df9e51] select-none leading-none">
                      ◆
                    </div>
                  )}

                  {/* Monospace Nucleotide Character */}
                  <span
                    className={`font-mono-seq text-xs font-semibold ${
                      isTarget
                        ? 'text-[#ffc7be] font-bold'
                        : isSnp
                        ? 'text-[#ffe2b8] font-bold'
                        : getBaseLetterColor(base)
                    }`}
                  >
                    {base}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRACK 4: DEDICATED CRISPR FEATURE ARCHITECTURE RIBBON */}
          <div className="relative h-11 mt-1.5 border-t border-[#24201b]/80 pt-1">
            {guideMetrics && selectedGuide && (
              <>
                {/* 20-nt Protospacer Directional Vector Banner */}
                <div
                  style={{
                    left: `${guideMetrics.spacerStart * BASE_WIDTH_PX}px`,
                    width: `${20 * BASE_WIDTH_PX}px`,
                  }}
                  className="absolute top-1 h-5 rounded-[2px] bg-[#4d828f]/20 border border-[#4d828f]/60 flex items-center justify-between px-1.5 text-[9px] text-[#98c2cc] select-none shadow-xs"
                >
                  {guideMetrics.isSense ? (
                    <>
                      <span className="font-mono-seq text-[8px] text-[#5e96a3]">5&apos;</span>
                      <span className="font-mono-seq truncate font-medium text-center flex-1 px-1">
                        {selectedGuide.id} (20 nt spacer)
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#98c2cc] shrink-0" />
                      <span className="font-mono-seq text-[8px] text-[#5e96a3] ml-0.5">3&apos;</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono-seq text-[8px] text-[#5e96a3] mr-0.5">3&apos;</span>
                      <ArrowLeft className="w-2.5 h-2.5 text-[#98c2cc] shrink-0" />
                      <span className="font-mono-seq truncate font-medium text-center flex-1 px-1">
                        {selectedGuide.id} (20 nt antisense)
                      </span>
                      <span className="font-mono-seq text-[8px] text-[#5e96a3]">5&apos;</span>
                    </>
                  )}
                </div>

                {/* Nested deaminase catalytic-window overlay */}
                <div
                  style={{
                    left: `${guideMetrics.windowStart * BASE_WIDTH_PX}px`,
                    width: `${editorWindowWidth * BASE_WIDTH_PX}px`,
                  }}
                  className="absolute top-1 h-5 rounded-[2px] bg-[#c98a3b]/30 border border-[#c98a3b]/90 flex items-center justify-center text-[8px] font-mono-seq font-semibold text-[#f0ba65] select-none shadow-xs pointer-events-none"
                  title={`Deaminase Catalytic Window (spacer positions ${editorWindowLabel})`}
                >
                  Window {editorWindowLabel}
                </div>

                {/* 3-nt Adjacent PAM Motif Tag */}
                {guideMetrics.pamStart >= 0 && guideMetrics.pamEnd < seqLength && (
                  <div
                    style={{
                      left: `${guideMetrics.pamStart * BASE_WIDTH_PX}px`,
                      width: `${3 * BASE_WIDTH_PX}px`,
                    }}
                    className="absolute top-1 h-5 rounded-[2px] bg-[#cfa052]/20 border border-[#cfa052]/70 flex items-center justify-center text-[9px] font-mono-seq font-semibold text-[#e0ad5a] select-none shadow-xs"
                    title={`PAM Motif: ${selectedGuide.pam} (positions ${guideMetrics.pamStart + 1}–${guideMetrics.pamEnd + 1})`}
                  >
                    PAM
                  </div>
                )}
              </>
            )}

            {/* Target Mutation Landmark Pin (Layer 2) */}
            <div
              style={{
                left: `${preset.mutationIndex * BASE_WIDTH_PX}px`,
                width: `${BASE_WIDTH_PX}px`,
              }}
              className="absolute top-6.5 flex flex-col items-center select-none"
              title={`Pathogenic Mutation Target: bp ${preset.mutationIndex + 1}`}
            >
              <span className="text-[8px] text-[#e27b6c] leading-none">▲</span>
              <span className="text-[7.5px] font-mono-seq text-[#e27b6c] font-semibold tracking-tighter whitespace-nowrap mt-0.5">
                Target
              </span>
            </div>

            {/* SAS Population SNP Landmark Pin (Layer 2) */}
            {preset.sasSnpIndex >= 0 && preset.sasSnpIndex < seqLength && (
              <div
                style={{
                  left: `${preset.sasSnpIndex * BASE_WIDTH_PX}px`,
                  width: `${BASE_WIDTH_PX}px`,
                }}
                className="absolute top-6.5 flex flex-col items-center select-none"
                title={`SAS Polymorphism: ${preset.sasSnpId} (bp ${preset.sasSnpIndex + 1})`}
              >
                <span className="text-[7px] text-[#df9e51] leading-none">◆</span>
                <span className="text-[7.5px] font-mono-seq text-[#df9e51] font-semibold tracking-tighter whitespace-nowrap mt-0.5">
                  SNP
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRACK 5: REAL-TIME INTERACTIVE TELEMETRY BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-[3px] bg-[#151310] border border-[#24201b] text-[11px] font-mono-seq">
        {hoverTelemetry ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#a69b8d]">
            <span className="flex items-center gap-1.5 text-[#e8dfd1]">
              <Crosshair className="w-3 h-3 text-[#4d828f]" />
              <span>
                bp <strong className="text-[#e8dfd1]">{hoverTelemetry.idx + 1}</strong> of {seqLength}
              </span>
              <span className="px-1 py-0.2 rounded-[2px] bg-[#211e1a] text-[10px] font-bold text-[#e8dfd1]">
                {hoverTelemetry.base}
              </span>
            </span>

            <span>
              Codon <strong className="text-[#e8dfd1]">#{hoverTelemetry.codonIdx + 1}</strong> ({hoverTelemetry.codonTriad} →{' '}
              <span className="text-[#e8dfd1] font-semibold">{hoverTelemetry.aaInfo.code3}</span> / {hoverTelemetry.aaLetter})
            </span>

            <span className="text-[#98c2cc]">{hoverTelemetry.guideContext}</span>

            {hoverTelemetry.isTarget && (
              <span className="text-[#e27b6c] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#bd5142]" />
                Pathogenic target nucleotide
              </span>
            )}

            {hoverTelemetry.isSnp && (
              <span className="text-[#df9e51] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rotate-45 bg-[#c98a3b]" />
                {preset.sasSnpId} (MAF: {(preset.sasAlleleFreq * 100).toFixed(1)}%)
              </span>
            )}

            {hoverTelemetry.bystander && (
              <span className="text-[#e0ad5a] flex items-center gap-1">
                <Info className="w-3 h-3" />
                Co-edit: {hoverTelemetry.bystander.originalCodon} ({hoverTelemetry.bystander.originalAA}) →{' '}
                {hoverTelemetry.bystander.editedCodon} ({hoverTelemetry.bystander.editedAA}) [
                {hoverTelemetry.bystander.classification}]
              </span>
            )}
          </div>
        ) : (
          <div className="text-[#70675c] flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>Hover over any nucleotide to inspect genomic coordinates, codon translation, and guide positions.</span>
          </div>
        )}

        <div className="text-[10px] text-[#70675c] ml-auto">
          {preset.editorType} • CDS {seqLength} bp • Frame +1
        </div>
      </div>
    </div>
  );
}
```

---

### 4.21 `src/App.tsx`
**Description:** Main dual-workstation application interface connecting all engines, 3D viewport, and UI  
**Path:** `src/App.tsx`

```tsx
// src/App.tsx
import { useState, useMemo } from 'react';
import {
  GENE_PRESETS,
  BASE_EDITOR_DEFINITIONS,
  PAM_VARIANT_DEFINITIONS,
  bioEngineService,
  calculateHlaRiskScore,
  filterEpitopesByHlaAlleles,
  isPreferredPam,
  SOUTH_ASIAN_HLA_ALLELES,
  type BaseEditorType,
  type LnpFormulation,
  type GuideCandidate,
  type GenePreset,
  type PamVariant,
} from './engines/bioEngines';
import { NanoViewport3D } from './components/NanoViewport3D';
import { GenomicSequenceViewer } from './components/GenomicSequenceViewer';
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
    pamVariant: 'SpCas9',
    sequence:
      'ATGGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTC',
    mutationIndex: 18,
    sasSnpIndex: 40,
    sasSnpId: 'Novel / Unmapped Variant',
    sasAlleleFreq: 0.05,
    clinicalNote: 'Custom sequence evaluation for protospacer discovery and bystander deamination.',
  });

  const [selectedGuideIdx, setSelectedGuideIdx] = useState<number>(0);

  // Per-epitope stealth mutation state (indices 0..4 active by default)
  const epitopeCatalog = useMemo(() => bioEngineService.getEpitopeHotspots(), []);
  const [activeStealthMutations, setActiveStealthMutations] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(epitopeCatalog.map((ep) => [ep.peptide, true]))
  );
  const [selectedHlaAlleles, setSelectedHlaAlleles] = useState<string[]>(
    () => [...SOUTH_ASIAN_HLA_ALLELES]
  );

  // Table filtering and sorting
  const [sortField, setSortField] = useState<SortField>('CompositeScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStrand, setFilterStrand] = useState<'all' | '+' | '-'>('all');
  const [hideSnpCollisions, setHideSnpCollisions] = useState<boolean>(false);
  const [preferredPamOnly, setPreferredPamOnly] = useState<boolean>(false);

  // Copy feedback state for oligos
  const [copiedOligo, setCopiedOligo] = useState<'fwd' | 'rev' | null>(null);

  // Formulation parameters
  const [lnpForm, setLnpForm] = useState<LnpFormulation>({
    ionizableLipid: 50.0,
    dspcHelper: 10.0,
    cholesterol: 38.5,
    pegLipid: 1.5,
    lipidPka: 6.35,
    npRatio: 6.0,
  });

  // Wet-lab batch calculator parameters
  const [batchVolumeMl, setBatchVolumeMl] = useState<number>(10.0);
  const [batchMrnaConcMgMl, setBatchMrnaConcMgMl] = useState<number>(1.0);
  const [showBatchCalc, setShowBatchCalc] = useState<boolean>(false);

  // Editor and PAM variant overrides (allows switching architecture for presets)
  const [editorOverride, setEditorOverride] = useState<BaseEditorType | null>(null);
  const [pamOverride, setPamOverride] = useState<PamVariant | null>(null);

  // Active target preset
  const basePreset = useMemo(() => {
    if (isCustomMode) return customPreset;
    return GENE_PRESETS.find((p) => p.id === selectedPresetId) || GENE_PRESETS[0];
  }, [isCustomMode, customPreset, selectedPresetId]);

  const activePreset: GenePreset = useMemo(() => {
    return {
      ...basePreset,
      editorType: editorOverride ?? basePreset.editorType,
      pamVariant: pamOverride ?? basePreset.pamVariant ?? 'SpCas9',
    };
  }, [basePreset, editorOverride, pamOverride]);

  const activeEditorDefinition = BASE_EDITOR_DEFINITIONS[activePreset.editorType];
  const activePamVariant = activePreset.pamVariant ?? 'SpCas9';
  const activePamDefinition = PAM_VARIANT_DEFINITIONS[activePamVariant];
  const editorWindowLabel = `${activeEditorDefinition.editingWindow[0]}–${activeEditorDefinition.editingWindow[1]}`;

  // Dual-strand guide candidates via hexagonal bioEngineService
  const allGuides = useMemo(() => bioEngineService.scanGuides(activePreset), [activePreset]);

  // Filtered and sorted guides
  const processedGuides = useMemo(() => {
    return allGuides
      .filter((g) => {
        if (filterStrand !== 'all' && g.strand !== filterStrand) return false;
        if (hideSnpCollisions && g.hasSasSnpCollision) return false;
        if (preferredPamOnly && !isPreferredPam(g.pam, activePamVariant)) return false;
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB as string)
            : (valB as string).localeCompare(valA);
        }
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [allGuides, filterStrand, hideSnpCollisions, preferredPamOnly, activePamVariant, sortField, sortOrder]);

  const selectedGuide: GuideCandidate | undefined =
    processedGuides[selectedGuideIdx] || processedGuides[0] || allGuides[0];

  // Cloning oligos for selected guide
  const cloningOligos = useMemo(() => {
    if (!selectedGuide) return null;
    return bioEngineService.generateCloningOligos(selectedGuide.spacer);
  }, [selectedGuide]);

  // Dynamic Cholesterol balancing to strictly lock stoichiometry at 100.0%
  const effectiveCholesterol = useMemo(() => {
    return Math.max(
      0,
      Number((100 - lnpForm.ionizableLipid - lnpForm.dspcHelper - lnpForm.pegLipid).toFixed(1))
    );
  }, [lnpForm.ionizableLipid, lnpForm.dspcHelper, lnpForm.pegLipid]);

  const activeFormulation = useMemo<LnpFormulation>(
    () => ({
      ...lnpForm,
      cholesterol: effectiveCholesterol,
    }),
    [lnpForm, effectiveCholesterol]
  );

  const biophysics = useMemo(
    () => bioEngineService.simulateLnpBiophysics(activeFormulation),
    [activeFormulation]
  );
  const batchCalculation = useMemo(
    () =>
      bioEngineService.calculateBatchMasses(
        activeFormulation,
        batchVolumeMl,
        batchMrnaConcMgMl
      ),
    [activeFormulation, batchVolumeMl, batchMrnaConcMgMl]
  );

  const wildTypeProtein = useMemo(
    () => bioEngineService.translateSequence(activePreset.sequence),
    [activePreset.sequence]
  );

  // ImmunoShield residual HLA risk calculation, scoped to patient-selected alleles.
  const patientRelevantEpitopes = useMemo(
    () => filterEpitopesByHlaAlleles(selectedHlaAlleles, epitopeCatalog),
    [selectedHlaAlleles, epitopeCatalog]
  );
  const hasPatientHlaSelection = selectedHlaAlleles.length > 0;
  const allStealthEnabled = useMemo(
    () =>
      patientRelevantEpitopes.length > 0 &&
      patientRelevantEpitopes.every((ep) => activeStealthMutations[ep.peptide]),
    [patientRelevantEpitopes, activeStealthMutations]
  );

  const residualHlaRisk = useMemo(() => {
    if (!hasPatientHlaSelection) return null;
    return calculateHlaRiskScore(patientRelevantEpitopes, activeStealthMutations);
  }, [hasPatientHlaSelection, patientRelevantEpitopes, activeStealthMutations]);

  const toggleAllStealth = () => {
    if (patientRelevantEpitopes.length === 0) return;
    const nextState = !allStealthEnabled;
    setActiveStealthMutations((previous) => ({
      ...previous,
      ...Object.fromEntries(patientRelevantEpitopes.map((ep) => [ep.peptide, nextState])),
    }));
  };

  const toggleSingleEpitope = (peptide: string) => {
    setActiveStealthMutations((prev) => ({
      ...prev,
      [peptide]: !prev[peptide],
    }));
  };

  const togglePatientHlaAllele = (allele: string) => {
    setSelectedHlaAlleles((previous) =>
      previous.includes(allele)
        ? previous.filter((selected) => selected !== allele)
        : [...previous, allele]
    );
  };

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
      setLnpForm({
        ionizableLipid: 50.0,
        dspcHelper: 10.0,
        cholesterol: 38.5,
        pegLipid: 1.5,
        lipidPka: 6.4,
        npRatio: 6.0,
      });
    } else if (name === 'Moderna') {
      setLnpForm({
        ionizableLipid: 50.0,
        dspcHelper: 10.0,
        cholesterol: 38.5,
        pegLipid: 1.5,
        lipidPka: 6.55,
        npRatio: 6.0,
      });
    } else {
      setLnpForm({
        ionizableLipid: 55.0,
        dspcHelper: 12.0,
        cholesterol: 31.5,
        pegLipid: 1.5,
        lipidPka: 7.1,
        npRatio: 8.0,
      });
    }
  };

  // Export regulatory pre-IND summary in Markdown format
  const downloadDraDossier = () => {
    const codonAuditRows =
      selectedGuide && selectedGuide.bystanders.length > 0
        ? selectedGuide.bystanders
            .map(
              (b) =>
                `| Pos ${b.guidePos} | bp ${b.genomicIndex + 1} | \`${b.originalCodon}\` (${b.originalAA}) | \`${b.editedCodon}\` (${b.editedAA}) | ${b.classification} |`
            )
            .join('\n')
        : `| — | — | — | — | No editable bases in window ${editorWindowLabel} |`;

    const epitopeRows = hasPatientHlaSelection
      ? patientRelevantEpitopes
          .map((ep) => {
            const isShielded = activeStealthMutations[ep.peptide];
            return `| \`${ep.peptide}\` | ${ep.residueRange} | ${ep.domain} | ${ep.hlaAllele} | ${
              isShielded ? '<10 / 100' : `${ep.bindingScore} / 100`
            } | ${isShielded ? ep.stealthMutation : 'Wild-type (Unmodified)'} |`;
          })
          .join('\n')
      : '| — | — | — | No patient HLA alleles selected | Not assessed | — |';

    const content = `# Pre-IND CMC and Preclinical Evaluation Report
Generated by NanoCRISPR-3D Evaluation Workbench

## 1. Target Locus and Genome Editing Strategy
- Gene symbol: ${activePreset.symbol}
- Gene name: ${activePreset.name}
- Clinical indication: ${activePreset.disease}
- Target tissue: ${activePreset.targetOrgan}
- Base editor architecture: ${activePreset.editorType}
- Deaminase activity window: positions ${editorWindowLabel}
- Cas9 PAM-recognition variant: ${activePamDefinition.label} (${activePamDefinition.recognition})
- Clinical rationale: ${activePreset.clinicalNote}
- Selected protospacer: ${selectedGuide?.id || 'sgRNA-1'} (5'-${selectedGuide?.spacer || ''}-3')
- Target strand: ${selectedGuide?.strand === '+' ? 'Sense (+)' : 'Antisense (-)'}
- PAM: ${selectedGuide?.pam || ''}
- Protospacer on-target score: ${selectedGuide?.CompositeScore || 0} / 100
- Assessment verdict: ${selectedGuide?.verdict || 'N/A'}
- South Asian population variant: ${
      selectedGuide?.hasSasSnpCollision
        ? 'Collision flagged with ' + activePreset.sasSnpId
        : 'Clear of common SAS polymorphisms (' +
          activePreset.sasSnpId +
          ', MAF: ' +
          (activePreset.sasAlleleFreq * 100).toFixed(1) +
          '%)'
    }

### Deaminase Window (Positions ${editorWindowLabel}) Codon Consequence Audit
| Guide Pos | Genomic Index | Original Codon | Edited Codon | Consequence Classification |
| :--- | :--- | :--- | :--- | :--- |
${codonAuditRows}

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
- De Gennes polymer brush ratio (RF/D): ${
      biophysics.deGennesRfOverD
        ? `${biophysics.deGennesRfOverD} (${biophysics.deGennesRfOverD >= 1.0 ? 'Dense Brush' : 'Mushroom'})`
        : 'N/A'
    }
- Critical Packing Parameter (CPP at pH 5.5): ${
      biophysics.criticalPackingParam
        ? `${biophysics.criticalPackingParam} (${biophysics.criticalPackingParam >= 1.45 ? 'Inverted Hexagonal HII' : 'Lamellar La'})`
        : 'N/A'
    }
- SAXS Bragg q1 repeat spacing (dSAXS): ${
      biophysics.saxsBraggSpacingNm ? `${biophysics.saxsBraggSpacingNm} nm` : 'N/A'
    }
- Predicted organ biodistribution: Liver ${biophysics.organTropism.liver}% | Spleen ${biophysics.organTropism.spleen}% | Lungs ${biophysics.organTropism.lungs}%
- Formulation classification: ${biophysics.stabilityStatus}

## 3. Wet-Lab Batch Preparation Mass Scale (${batchVolumeMl} mL at ${batchMrnaConcMgMl} mg/mL mRNA)
- Total mRNA to weigh: ${batchCalculation.totalMrnaMassMg} mg
- Total lipids to weigh: ${batchCalculation.totalLipidMassMg} mg (Lipid:mRNA ratio ${(
      batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg
    ).toFixed(1)}:1 w/w)
${batchCalculation.components.map((c) => `- ${c.name}: ${c.massMg} mg (${c.molarConcMm} mM)`).join('\n')}

## 4. Immunogenicity and De-immunization Profile (ImmunoShield-DRA)
- Patient-selected HLA alleles: ${
      hasPatientHlaSelection ? selectedHlaAlleles.join(', ') : 'Not selected (risk not assessed)'
    }
- Composite residual HLA risk score: ${residualHlaRisk === null ? 'Not assessed' : `${residualHlaRisk} / 100`}
- Catalytic residue integrity (D10 / H840): Intact
- Interpretation: illustrative curated-panel heuristic; not a clinical HLA-binding prediction.

| Epitope Peptide | Residues | Domain | South Asian HLA Allele | Residual Risk | Active Engineering Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
${epitopeRows}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre_ind_evaluation_${activePreset.id.toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
      className="min-h-screen flex flex-col text-xs antialiased selection:bg-[#4d828f]/30 selection:text-[#e8dfd1]"
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
            <span className="font-display font-bold text-sm tracking-tight text-[#e8dfd1]">
              NanoCRISPR-3D
            </span>
            <span className="text-[#70675c] text-xs">/</span>
            <span className="text-[#a69b8d] text-xs hidden sm:inline">
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
                    setEditorOverride(null);
                    setPamOverride(null);
                    setSelectedGuideIdx(0);
                  }}
                  style={{
                    backgroundColor: active ? tokens.colors.surfaceRaised : 'transparent',
                    color: active ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                    borderRadius: tokens.radius,
                  }}
                  className={`px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'border border-[#332e27]'
                      : 'border border-transparent hover:text-[#e8dfd1]'
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
                setEditorOverride(null);
                setPamOverride(null);
                setSelectedGuideIdx(0);
              }}
              style={{
                backgroundColor: isCustomMode ? tokens.colors.surfaceRaised : 'transparent',
                color: isCustomMode ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                borderRadius: tokens.radius,
              }}
              className={`px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                isCustomMode
                  ? 'border border-[#332e27]'
                  : 'border border-transparent hover:text-[#e8dfd1]'
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
              backgroundColor: showBatchCalc
                ? tokens.colors.accentSubdued
                : tokens.colors.surfaceRaised,
              borderColor: showBatchCalc ? tokens.colors.accentBorder : tokens.colors.border,
              borderRadius: tokens.radius,
              color: showBatchCalc ? tokens.colors.textPrimary : tokens.colors.textSecondary,
            }}
            className="px-2.5 py-1 text-xs font-medium border hover:text-[#e8dfd1] hover:border-[#4d828f] transition cursor-pointer"
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
            className="px-3 py-1 text-xs font-medium border hover:bg-[#2a2621] hover:border-[#4d828f] transition cursor-pointer"
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
            <span className="font-display font-semibold text-xs tracking-tight text-[#e8dfd1]">
              Custom target sequence configuration
            </span>
            <span className="text-[11px] text-[#70675c]">
              Dual-strand scanning will search both (+) and (-) orientations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-[11px] text-[#a69b8d] block mb-1">
                Coding DNA sequence (5&apos; → 3&apos;)
              </label>
              <textarea
                rows={2}
                value={customPreset.sequence}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    sequence: e.target.value.toUpperCase().replace(/[^ATCGN]/g, ''),
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-2 border font-mono-seq text-[11px] text-[#e8dfd1] outline-none focus:border-[#4d828f]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#a69b8d] block mb-1">
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
                    mutationIndex: Math.max(0, parseInt(e.target.value || '1', 10) - 1),
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border font-mono-seq text-xs text-[#e8dfd1] outline-none"
              />

              <label className="text-[11px] text-[#a69b8d] block mt-2 mb-1">
                Base editor architecture
              </label>
              <select
                value={activePreset.editorType}
                onChange={(e) => {
                  const val = e.target.value as BaseEditorType;
                  setEditorOverride(val);
                  setCustomPreset((prev) => ({
                    ...prev,
                    editorType: val,
                  }));
                }}
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e8dfd1] outline-none"
              >
                {Object.entries(BASE_EDITOR_DEFINITIONS).map(([editorType, definition]) => (
                  <option key={editorType} value={editorType}>
                    {editorType} — positions {definition.editingWindow[0]}–{definition.editingWindow[1]}
                  </option>
                ))}
              </select>

              <label className="text-[11px] text-[#a69b8d] block mt-2 mb-1">
                Cas9 PAM-recognition variant
              </label>
              <select
                value={activePamVariant}
                onChange={(e) => {
                  const val = e.target.value as PamVariant;
                  setPamOverride(val);
                  setCustomPreset((prev) => ({
                    ...prev,
                    pamVariant: val,
                  }));
                }}
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e8dfd1] outline-none"
              >
                {Object.entries(PAM_VARIANT_DEFINITIONS).map(([pamVariant, definition]) => (
                  <option key={pamVariant} value={pamVariant}>
                    {definition.label} — {definition.recognition}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#a69b8d] block mb-1">
                Target organ / tissue
              </label>
              <select
                value={customPreset.targetOrgan}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    targetOrgan: e.target.value as 'Liver' | 'Bone Marrow (HSPC)' | 'Lung',
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e8dfd1] outline-none"
              >
                <option value="Liver">Liver (Hepatocytes)</option>
                <option value="Bone Marrow (HSPC)">Bone Marrow (HSPC)</option>
                <option value="Lung">Lung (Endothelium)</option>
              </select>

              <label className="text-[11px] text-[#a69b8d] block mt-2 mb-1">
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
                    sasSnpIndex: Math.max(0, parseInt(e.target.value || '0', 10) - 1),
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border font-mono-seq text-xs text-[#e8dfd1] outline-none"
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24201b] pb-2 mb-2">
              <div>
                <span className="font-semibold text-sm text-[#e8dfd1] mr-2">
                  {activePreset.symbol}
                </span>
                <span className="text-[#a69b8d] text-xs">{activePreset.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#a69b8d]">
                <span>
                  Target tissue:{' '}
                  <strong className="text-[#e8dfd1] font-medium">
                    {activePreset.targetOrgan}
                  </strong>
                </span>
                <span>•</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span>Editor:</span>
                  <select
                    value={activePreset.editorType}
                    onChange={(e) => {
                      const val = e.target.value as BaseEditorType;
                      setEditorOverride(val);
                      if (isCustomMode) {
                        setCustomPreset((prev) => ({ ...prev, editorType: val }));
                      }
                      setSelectedGuideIdx(0);
                    }}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="px-2 py-0.5 border text-xs text-[#e8dfd1] outline-none cursor-pointer hover:border-[#4d828f] focus:border-[#4d828f]"
                    title="Switch base editor architecture (ABE8e, ABE9 narrow window, BE4max)"
                  >
                    {Object.entries(BASE_EDITOR_DEFINITIONS).map(([editorType, definition]) => (
                      <option key={editorType} value={editorType}>
                        {editorType} (pos {definition.editingWindow[0]}–{definition.editingWindow[1]})
                      </option>
                    ))}
                  </select>
                </label>
                <span>•</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span>PAM:</span>
                  <select
                    value={activePamVariant}
                    onChange={(e) => {
                      const val = e.target.value as PamVariant;
                      setPamOverride(val);
                      if (isCustomMode) {
                        setCustomPreset((prev) => ({ ...prev, pamVariant: val }));
                      }
                      setSelectedGuideIdx(0);
                    }}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="px-2 py-0.5 border text-xs text-[#e8dfd1] outline-none cursor-pointer hover:border-[#4d828f] focus:border-[#4d828f]"
                    title="Switch Cas9 PAM-recognition variant (SpCas9, SpCas9-NG, SpRY)"
                  >
                    {Object.entries(PAM_VARIANT_DEFINITIONS).map(([variant, definition]) => (
                      <option key={variant} value={variant}>
                        {definition.label} ({definition.recognition})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[#70675c] block text-[11px]">Indication</span>
                <span className="text-[#e8dfd1]">{activePreset.disease}</span>
              </div>
              <div>
                <span className="text-[#70675c] block text-[11px]">Pathogenic target position</span>
                <span className="font-mono-seq text-[#e8dfd1]">
                  bp {activePreset.mutationIndex + 1} (Codon{' '}
                  {Math.floor(activePreset.mutationIndex / 3) + 1}, frame offset:{' '}
                  {activePreset.mutationIndex % 3})
                </span>
              </div>
              <div>
                <span className="text-[#70675c] block text-[11px]">
                  South Asian population variant
                </span>
                <span className="font-mono-seq text-[#e8dfd1]">
                  {activePreset.sasSnpId} (MAF: {(activePreset.sasAlleleFreq * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Sequence & Reading Frame Track (Humanistic Multi-Track Viewer) */}
          <GenomicSequenceViewer
            preset={activePreset}
            selectedGuide={selectedGuide}
            wildTypeProtein={wildTypeProtein}
          />

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
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                Protospacer candidates (dual-strand discovery)
              </h2>

              {/* Table Filters */}
              <div className="flex items-center gap-2 text-[11px] text-[#a69b8d]">
                <div className="flex items-center border border-[#332e27] rounded-[3px] p-0.5 bg-[#12110f]">
                  <button
                    onClick={() => setFilterStrand('all')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition cursor-pointer ${
                      filterStrand === 'all'
                        ? 'bg-[#211e1a] text-[#e8dfd1]'
                        : 'hover:text-[#e8dfd1]'
                    }`}
                  >
                    All strands
                  </button>
                  <button
                    onClick={() => setFilterStrand('+')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition cursor-pointer ${
                      filterStrand === '+'
                        ? 'bg-[#211e1a] text-[#e8dfd1]'
                        : 'hover:text-[#e8dfd1]'
                    }`}
                  >
                    Sense (+)
                  </button>
                  <button
                    onClick={() => setFilterStrand('-')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition cursor-pointer ${
                      filterStrand === '-'
                        ? 'bg-[#211e1a] text-[#e8dfd1]'
                        : 'hover:text-[#e8dfd1]'
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
                    className="accent-[#4d828f]"
                  />
                  <span>Clear of SNP</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferredPamOnly}
                    onChange={(e) => setPreferredPamOnly(e.target.checked)}
                    className="accent-[#4d828f]"
                  />
                  <span>{activePamDefinition.preferredPamLabel}</span>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr
                    style={{ borderColor: tokens.colors.border }}
                    className="border-b text-[#a69b8d] text-[11px]"
                  >
                    <th
                      onClick={() => handleSort('id')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                    >
                      ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('strand')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                    >
                      Strand {sortField === 'strand' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">
                      Spacer sequence (positions {editorWindowLabel} underlined)
                    </th>
                    <th
                      onClick={() => handleSort('pam')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                    >
                      PAM {sortField === 'pam' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('gcContent')}
                      className="py-1 px-2 font-medium text-right font-mono-seq cursor-pointer hover:text-[#e8dfd1]"
                    >
                      GC% {sortField === 'gcContent' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">Population SNP</th>
                    <th
                      onClick={() => handleSort('CompositeScore')}
                      className="py-1 px-2 font-medium text-right font-mono-seq cursor-pointer hover:text-[#e8dfd1]"
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
                    const hasPreferredPam = isPreferredPam(g.pam, activePamVariant);

                    return (
                      <tr
                        key={g.id}
                        onClick={() => setSelectedGuideIdx(idx)}
                        style={{
                          backgroundColor: isSelected
                            ? tokens.colors.surfaceSelected
                            : 'transparent',
                          borderLeftWidth: '2px',
                          borderLeftStyle: 'solid',
                          borderLeftColor: isSelected ? tokens.colors.accent : 'transparent',
                          borderBottomWidth: '1px',
                          borderBottomStyle: 'solid',
                          borderBottomColor: tokens.colors.borderMuted,
                        }}
                        className="hover:bg-[#2a2621] cursor-pointer transition"
                      >
                        <td className="py-1 px-2 font-medium text-[#e8dfd1]">{g.id}</td>
                        <td className="py-1 px-2 font-mono-seq text-[11px] font-semibold">
                          <span className={g.strand === '-' ? 'text-[#6699a8]' : 'text-[#a69b8d]'}>
                            {g.strand === '+' ? '+' : '-'}
                          </span>
                        </td>
                        <td className="py-1 px-2 font-mono-seq text-[11px]">
                          <span>
                            {g.spacer
                              .slice(0, activeEditorDefinition.editingWindow[0] - 1)
                              .split('')
                              .map((b, i) => (
                                <span key={i} className={getBaseColorClass(b)}>
                                  {b}
                                </span>
                              ))}
                          </span>
                          <span
                            style={{ borderRadius: tokens.radius }}
                            className="px-1 font-semibold text-[#e0ad5a] bg-[#c98a3b]/15 border-b border-[#c98a3b]"
                          >
                            {g.spacer.slice(
                              activeEditorDefinition.editingWindow[0] - 1,
                              activeEditorDefinition.editingWindow[1]
                            )}
                          </span>
                          <span>
                            {g.spacer
                              .slice(activeEditorDefinition.editingWindow[1])
                              .split('')
                              .map((b, i) => (
                                <span key={i} className={getBaseColorClass(b)}>
                                  {b}
                                </span>
                              ))}
                          </span>
                        </td>
                        <td className="py-1 px-2 font-mono-seq font-semibold">
                          <span className={hasPreferredPam ? 'text-[#d4a359]' : 'text-[#cc6b5a]'}>
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
                            <span className="text-[11px] text-[#a69b8d] truncate">{g.verdict}</span>
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
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Oligonucleotide cloning order sheet ({cloningOligos.overhangSystem})
                </h2>
                <span className="text-[11px] text-[#70675c]">
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
                      <span key={i} className={getBaseColorClass(b)}>
                        {b}
                      </span>
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
                      <span key={i} className={getBaseColorClass(b)}>
                        {b}
                      </span>
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
                  Deaminase window (positions {editorWindowLabel}) codon translation for {selectedGuide.id}
                </h2>
                <span className="text-[11px] text-[#70675c]">
                  Base conversion: {activePreset.editorType}
                </span>
              </div>

              {selectedGuide.bystanders.length === 0 ? (
                <p className="text-xs text-[#70675c] py-1">
                  No editable target base detected within deaminase positions {editorWindowLabel}.
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
                            <td className="py-1 px-2 font-mono-seq text-[#a69b8d]">{b.guidePos}</td>
                            <td className="py-1 px-2 font-mono-seq text-[#a69b8d]">
                              bp {b.genomicIndex + 1}
                            </td>
                            <td className="py-1 px-2 font-mono-seq tracking-wider">
                              {b.originalCodon.split('').map((ch, cIdx) => (
                                <span key={cIdx} className={getBaseColorClass(ch)}>
                                  {ch}
                                </span>
                              ))}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#e8dfd1]">
                              {b.originalAA}
                            </td>
                            <td className="py-1 px-2 font-mono-seq tracking-wider">
                              {b.editedCodon.split('').map((ch, cIdx) => (
                                <span key={cIdx} className={getBaseColorClass(ch)}>
                                  {ch}
                                </span>
                              ))}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#e8dfd1]">{b.editedAA}</td>
                            <td className="py-1 px-2">
                              <span className="flex items-center gap-1.5">
                                <span
                                  style={{ backgroundColor: statusColor }}
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                />
                                <span className="text-[#e8dfd1]">{b.classification}</span>
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

          {/* Cas9 Epitope Immunogenicity Section (Interactive 5 South Asian Alleles) */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  ImmunoShield-DRA: Cas9 surface epitope immunogenicity (South Asian HLA panel)
                </h2>
                <span
                  style={{
                    backgroundColor:
                      residualHlaRisk === null
                        ? tokens.colors.surfaceRaised
                        : residualHlaRisk <= 20
                        ? tokens.colors.status.successSubtle
                        : residualHlaRisk <= 55
                        ? tokens.colors.status.warningSubtle
                        : tokens.colors.status.dangerSubtle,
                    color:
                      residualHlaRisk === null
                        ? tokens.colors.textMuted
                        : residualHlaRisk <= 20
                        ? tokens.colors.status.success
                        : residualHlaRisk <= 55
                        ? tokens.colors.status.warning
                        : tokens.colors.status.danger,
                    borderRadius: tokens.radius,
                  }}
                  className="px-1.5 py-0.5 font-mono-seq text-[10px] font-semibold"
                >
                  CTL Risk: {residualHlaRisk === null ? 'Not assessed' : `${residualHlaRisk} / 100`}
                </span>
              </div>

              <button
                onClick={toggleAllStealth}
                disabled={!hasPatientHlaSelection || patientRelevantEpitopes.length === 0}
                style={{
                  backgroundColor: tokens.colors.surfaceRaised,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="px-2.5 py-0.5 text-xs font-medium border hover:bg-[#2a2621] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
              >
                <span
                  style={{
                    backgroundColor: allStealthEnabled
                      ? tokens.colors.status.success
                      : tokens.colors.status.warning,
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                />
                <span className="text-[#e8dfd1]">
                  {!hasPatientHlaSelection
                    ? 'Select patient HLA alleles'
                    : allStealthEnabled
                    ? `All ${patientRelevantEpitopes.length} selected stealth mutations: Active`
                    : 'Restore selected stealth mutations'}
                </span>
              </button>
            </div>

            <fieldset
              style={{
                backgroundColor: tokens.colors.canvas,
                borderColor: tokens.colors.borderMuted,
                borderRadius: tokens.radius,
              }}
              className="border px-2.5 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <legend className="text-[11px] font-medium text-[#e8dfd1]">
                  Patient HLA haplotype / allele set
                </legend>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedHlaAlleles([...SOUTH_ASIAN_HLA_ALLELES])}
                    className="text-[#4d828f] hover:text-[#5e96a3] cursor-pointer"
                  >
                    Select panel
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedHlaAlleles([])}
                    className="text-[#a69b8d] hover:text-[#e8dfd1] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {SOUTH_ASIAN_HLA_ALLELES.map((allele) => (
                  <label key={allele} className="flex items-center gap-1 cursor-pointer text-[11px] text-[#a69b8d]">
                    <input
                      type="checkbox"
                      checked={selectedHlaAlleles.includes(allele)}
                      onChange={() => togglePatientHlaAllele(allele)}
                      className="accent-[#4d828f]"
                    />
                    {allele}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-[#70675c]">
                Only epitopes associated with a selected allele contribute to the illustrative residual-risk score.
              </p>
            </fieldset>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr
                    style={{ borderColor: tokens.colors.border }}
                    className="border-b text-[#a69b8d] text-[11px]"
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
                  {!hasPatientHlaSelection ? (
                    <tr>
                      <td colSpan={6} className="py-3 px-2 text-center text-[11px] text-[#70675c]">
                        Select one or more patient HLA alleles to assess the curated epitope panel.
                      </td>
                    </tr>
                  ) : patientRelevantEpitopes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-3 px-2 text-center text-[11px] text-[#70675c]">
                        No curated panel epitopes match the selected HLA alleles.
                      </td>
                    </tr>
                  ) : (
                    patientRelevantEpitopes.map((ep) => {
                      const isShielded = activeStealthMutations[ep.peptide];
                      return (
                        <tr
                          key={ep.peptide}
                          style={{ borderColor: tokens.colors.borderMuted }}
                          className="border-b text-[11px] hover:bg-[#2a2621] transition"
                        >
                          <td className="py-1 px-2 font-mono-seq font-semibold text-[#e8dfd1]">
                            {ep.peptide}
                          </td>
                          <td className="py-1 px-2 font-mono-seq text-[#a69b8d]">
                            {ep.residueRange}
                          </td>
                          <td className="py-1 px-2 text-[#a69b8d]">{ep.domain}</td>
                          <td className="py-1 px-2 text-[#a69b8d]">{ep.hlaAllele}</td>
                          <td className="py-1 px-2 text-right font-mono-seq">
                            {isShielded ? (
                              <span className="text-[#5e946c] font-medium">&lt;10</span>
                            ) : (
                              <span
                                style={{ color: tokens.colors.status.danger }}
                                className="font-semibold"
                              >
                                {ep.bindingScore} / 100
                              </span>
                            )}
                          </td>
                          <td className="py-1 px-2">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[#e8dfd1]">
                              <input
                                type="checkbox"
                                checked={isShielded}
                                onChange={() => toggleSingleEpitope(ep.peptide)}
                                className="accent-[#5e946c]"
                                aria-label={`Enable ${ep.stealthMutation}`}
                              />
                              <span
                                style={{
                                  backgroundColor: isShielded
                                    ? tokens.colors.status.success
                                    : tokens.colors.status.danger,
                                }}
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                              />
                              {isShielded ? ep.stealthMutation : 'Wild-type (unmodified anchor residue)'}
                            </label>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                Nanoparticle structural cutaway
              </h2>
              <span className="text-[11px] text-[#70675c]">
                Interactive WebGL instanced model
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
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
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
                  className="px-2 py-0.5 text-[11px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer"
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
                  className="px-2 py-0.5 text-[11px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer"
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
                  className="px-2 py-0.5 text-[11px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer"
                >
                  Lung-SORT
                </button>
              </div>
            </div>

            {/* 4-Component Auto-Balancing Sliders */}
            <div className="flex flex-col gap-2.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">Ionizable lipid molar ratio</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.ionizableLipid.toFixed(1)} mol%
                  </span>
                </div>
                <input
                  type="range"
                  min="35.0"
                  max="65.0"
                  step="0.5"
                  value={lnpForm.ionizableLipid}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, ionizableLipid: parseFloat(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">Helper lipid (DSPC) molar ratio</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.dspcHelper.toFixed(1)} mol%
                  </span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="20.0"
                  step="0.5"
                  value={lnpForm.dspcHelper}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, dspcHelper: parseFloat(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">PEG-lipid molar ratio</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.pegLipid.toFixed(1)} mol%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="6.0"
                  step="0.1"
                  value={lnpForm.pegLipid}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, pegLipid: parseFloat(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">Ionizable lipid apparent pKa</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.lipidPka.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="5.4"
                  max="7.4"
                  step="0.05"
                  value={lnpForm.lipidPka}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, lipidPka: parseFloat(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">Amine-to-phosphate (N/P) charge ratio</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.npRatio.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.5"
                  value={lnpForm.npRatio}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, npRatio: parseFloat(e.target.value) })
                  }
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
              className="p-2 border font-mono-seq text-[11px] text-[#a69b8d] flex justify-between"
            >
              <span>Molar sum: 100.0%</span>
              <span className="text-[#e8dfd1]">
                {lnpForm.ionizableLipid.toFixed(1)}% ionizable • {lnpForm.dspcHelper.toFixed(1)}%
                DSPC • {effectiveCholesterol.toFixed(1)}% chol • {lnpForm.pegLipid.toFixed(1)}% PEG
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
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Wet-lab batch preparation calculator
                </h2>
                <span className="text-[11px] text-[#70675c]">Microfluidic mixing protocol</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-[#a69b8d] block mb-0.5">
                    Target batch volume (mL)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    value={batchVolumeMl}
                    onChange={(e) =>
                      setBatchVolumeMl(Math.max(0.1, parseFloat(e.target.value) || 10))
                    }
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="w-full p-1 border font-mono-seq text-xs text-[#e8dfd1] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#a69b8d] block mb-0.5">
                    mRNA concentration (mg/mL)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={batchMrnaConcMgMl}
                    onChange={(e) =>
                      setBatchMrnaConcMgMl(Math.max(0.05, parseFloat(e.target.value) || 1))
                    }
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="w-full p-1 border font-mono-seq text-xs text-[#e8dfd1] outline-none"
                  />
                </div>
              </div>

              {/* Mass Table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr
                      style={{ borderColor: tokens.colors.border }}
                      className="border-b text-[#a69b8d] text-[11px]"
                    >
                      <th className="py-1 px-1.5 font-medium">Component</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Molar %</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">
                        Mass to weigh
                      </th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">
                        Conc (mM)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style={{ borderColor: tokens.colors.borderMuted }}
                      className="border-b text-[11px]"
                    >
                      <td className="py-1 px-1.5 font-semibold text-[#e8dfd1]">mRNA payload</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">—</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq font-semibold text-[#e8dfd1]">
                        {batchCalculation.totalMrnaMassMg} mg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">
                        {batchMrnaConcMgMl.toFixed(2)} mg/mL
                      </td>
                    </tr>
                    {batchCalculation.components.map((c, i) => (
                      <tr
                        key={i}
                        style={{ borderColor: tokens.colors.borderMuted }}
                        className="border-b text-[11px]"
                      >
                        <td className="py-1 px-1.5 text-[#e8dfd1]">{c.name}</td>
                        <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">
                          {c.molarPct.toFixed(1)}%
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono-seq font-medium text-[#e8dfd1]">
                          {c.massMg} mg
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">
                          {c.molarConcMm} mM
                        </td>
                      </tr>
                    ))}
                    <tr className="text-[11px] font-semibold text-[#e8dfd1]">
                      <td className="py-1 px-1.5">Total Lipids</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq">100.0%</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq">
                        {batchCalculation.totalLipidMassMg} mg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">
                        Ratio:{' '}
                        {(
                          batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg
                        ).toFixed(1)}
                        :1 w/w
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calculated Biophysical Properties (Expanded 6-Card Grid) */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                Calculated biophysical properties
              </h2>
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
                <span className="text-[#e8dfd1]">{biophysics.stabilityStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#70675c] text-[11px]">Hydrodynamic diameter</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.diameterNm} nm
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  PDI: {biophysics.pdi.toFixed(2)}
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
                <div className="text-[#70675c] text-[11px]">Zeta potential (pH 7.4)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.zetaPotentialMv > 0
                    ? `+${biophysics.zetaPotentialMv}`
                    : biophysics.zetaPotentialMv}{' '}
                  mV
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  Blood ionized: {biophysics.bloodProtonationPct}%
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
                <div className="text-[#70675c] text-[11px]">Endosomal ionization</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.endosomalProtonationPct}%
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  At late endosome pH 5.5
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
                <div className="text-[#70675c] text-[11px]">ApoE uptake score</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.cellularUptakeScore} / 100
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  Escape eff: {biophysics.endosomalEscapeEfficiency}%
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
                <div className="text-[#70675c] text-[11px]">De Gennes brush (RF/D)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.deGennesRfOverD?.toFixed(2) ?? '—'}
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  {(biophysics.deGennesRfOverD ?? 0) >= 1.0 ? 'Dense Brush' : 'Mushroom Regime'}
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
                <div className="text-[#70675c] text-[11px]">Packing param (CPP)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.criticalPackingParam?.toFixed(2) ?? '—'}
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  SAXS d: {biophysics.saxsBraggSpacingNm ?? 6.1} nm
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
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                Predicted organ biodistribution (SORT model)
              </h2>
              <span className="text-[11px] text-[#70675c]">Apparent charge partitioning</span>
            </div>

            <div className="flex flex-col gap-2 pt-1 text-xs">
              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#a69b8d]">Liver (hepatocytes)</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {biophysics.organTropism.liver}%
                  </span>
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
                  <span className="text-[#a69b8d]">Spleen (lymphoid / immune cells)</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {biophysics.organTropism.spleen}%
                  </span>
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
                      backgroundColor: tokens.colors.pigments.ochre,
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#a69b8d]">Lungs (endothelial beds)</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {biophysics.organTropism.lungs}%
                  </span>
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
                      backgroundColor: tokens.colors.pigments.verdigris,
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

### 4.22 `backend/requirements.txt`
**Description:** Python dependencies for FastAPI computational biology microservice  
**Path:** `backend/requirements.txt`

```text
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.9.0
numpy>=2.1.0
```

---

### 4.23 `backend/main.py`
**Description:** FastAPI bio-engine backend implementing thermodynamic CRISPR, LNP biophysics, and HLA scoring  
**Path:** `backend/main.py`

```python
# backend/main.py
"""
NanoCRISPR-3D & ImmunoShield-DRA — Python Computational Biology Backend
Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import math
from typing import Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="NanoCRISPR-3D Bio-Engine API",
    version="1.0.0",
    description="Thermodynamic CRISPR base editing, LNP biophysics, and South Asian HLA de-immunization engine.",
)

# Enable CORS for Vite local dev server (ports 5173 / 4173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 1. DOMAIN SCHEMAS (Strictly aligned with src/engines/types.ts)
# ============================================================================


class GenePreset(BaseModel):
    id: str
    symbol: str
    name: str
    disease: str
    targetOrgan: Literal["Liver", "Bone Marrow (HSPC)", "Lung"]
    editorType: Literal["ABE8e (A→G)", "ABE9 (A→G; window 5–6)", "BE4max (C→T)"]
    pamVariant: Literal["SpCas9", "SpCas9-NG", "SpRY"] = "SpCas9"
    sequence: str
    mutationIndex: int
    sasSnpIndex: int
    sasSnpId: str = "Unmapped"
    sasAlleleFreq: float = 0.05
    clinicalNote: str = ""

    model_config = {"extra": "ignore"}


class BystanderEdit(BaseModel):
    guidePos: int
    genomicIndex: int
    originalCodon: str
    editedCodon: str
    originalAA: str
    editedAA: str
    classification: Literal[
        "Target Edit",
        "Silent (Synonymous)",
        "Missense (Pathogenic Risk)",
        "Nonsense (Premature Stop)",
    ]


class GuideCandidate(BaseModel):
    id: str
    spacer: str
    pam: str
    strand: Literal["+", "-"]
    startIndex: int
    gcContent: int
    targetInWindow: bool
    bystanders: list[BystanderEdit]
    hasSasSnpCollision: bool
    CompositeScore: int
    verdict: Literal[
        "Optimal Clinical Guide",
        "Safe (Silent Bystander)",
        "High Risk (Bystander/SNP)",
        "Low Efficiency",
    ]


class LnpFormulation(BaseModel):
    ionizableLipid: float
    dspcHelper: float
    cholesterol: float
    pegLipid: float
    lipidPka: float
    npRatio: float


class OrganTropism(BaseModel):
    liver: int
    spleen: int
    lungs: int


class LnpBiophysicsResult(BaseModel):
    diameterNm: int
    pdi: float
    zetaPotentialMv: float
    endosomalProtonationPct: int
    bloodProtonationPct: int
    endosomalEscapeEfficiency: int
    cellularUptakeScore: int
    deGennesRfOverD: float
    criticalPackingParam: float
    saxsBraggSpacingNm: float
    organTropism: OrganTropism
    stabilityStatus: Literal[
        "Optimal Clinical LNP",
        "PEG Stealth Dilemma (Low Uptake)",
        "Aggregation Risk (Too Large)",
        "Poor Endosomal Escape",
    ]


class ComponentMass(BaseModel):
    name: str
    role: str
    molarPct: float
    mw: float
    massMg: float
    molarConcMm: float


class BatchMassCalculation(BaseModel):
    targetVolumeMl: float
    mrnaConcMgMl: float
    totalMrnaMassMg: float
    totalLipidMassMg: float
    components: list[ComponentMass]


class BatchMassRequest(BaseModel):
    form: LnpFormulation
    targetVolumeMl: float = 10.0
    mrnaConcMgMl: float = 1.0


class EpitopeHotspot(BaseModel):
    peptide: str
    residueRange: str
    domain: str
    hlaAllele: str
    hlaAlleles: list[str]
    bindingScore: int
    stealthMutation: str
    catalyticSafe: bool


class HlaAssessmentRequest(BaseModel):
    selectedAlleles: list[str] = []
    activeStealthMutations: dict[str, bool] = {}

    model_config = {"extra": "ignore"}


class HlaAssessmentResult(BaseModel):
    patientRelevantEpitopes: list[EpitopeHotspot]
    residualRiskScore: int


# ============================================================================
# 2. BIOCHEMICAL CONSTANTS & THERMODYNAMIC TABLES
# ============================================================================

CODON_TABLE: dict[str, str] = {
    "TTT": "F", "TTC": "F", "TTA": "L", "TTG": "L", "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
    "ATT": "I", "ATC": "I", "ATA": "I", "ATG": "M", "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
    "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S", "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
    "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T", "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
    "TAT": "Y", "TAC": "Y", "TAA": "*", "TAG": "*", "CAT": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
    "AAT": "N", "AAC": "N", "AAA": "K", "AAG": "K", "GAT": "D", "GAC": "D", "GAA": "E", "GAG": "E",
    "TGT": "C", "TGC": "C", "TGA": "*", "TGG": "W", "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R",
    "AGT": "S", "AGC": "S", "AGA": "R", "AGG": "R", "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G",
}

# Sugimoto et al. (1995) RNA:DNA hybrid nearest-neighbor free energy parameters (dG_37 in kcal/mol)
RNA_DNA_DG37: dict[str, float] = {
    "AA": -1.0, "AT": -0.9, "AC": -2.1, "AG": -1.8,
    "TA": -0.9, "TT": -0.2, "TC": -1.5, "TG": -1.6,
    "CA": -1.7, "CT": -0.9, "CC": -2.1, "CG": -2.7,
    "GA": -1.5, "GT": -1.1, "GC": -2.7, "GG": -2.9,
}

# Empirical positional activity weights used by the local guide-ranking model.
ABE8E_POS_WEIGHTS: dict[int, float] = {4: 0.78, 5: 1.00, 6: 1.00, 7: 0.92, 8: 0.68}
ABE9_POS_WEIGHTS: dict[int, float] = {5: 1.00, 6: 1.00}
BE4MAX_POS_WEIGHTS: dict[int, float] = {4: 0.88, 5: 0.98, 6: 1.00, 7: 0.86, 8: 0.62}

BASE_EDITOR_CONFIGS: dict[str, dict[str, object]] = {
    "ABE8e (A→G)": {
        "target_base": "A",
        "replacement_base": "G",
        "window": (4, 8),
        "weights": ABE8E_POS_WEIGHTS,
    },
    "ABE9 (A→G; window 5–6)": {
        "target_base": "A",
        "replacement_base": "G",
        "window": (5, 6),
        "weights": ABE9_POS_WEIGHTS,
    },
    "BE4max (C→T)": {
        "target_base": "C",
        "replacement_base": "T",
        "window": (4, 8),
        "weights": BE4MAX_POS_WEIGHTS,
    },
}

CAS9_EPITOPE_HOTSPOTS: list[EpitopeHotspot] = [
    EpitopeHotspot(
        peptide="NLIALSLGL",
        residueRange="aa 236–244",
        domain="REC2 Domain",
        hlaAllele="HLA-A*02:01 / HLA-A*24:02 (Common Indian)",
        hlaAlleles=["HLA-A*02:01", "HLA-A*24:02"],
        bindingScore=92,
        stealthMutation="L240T (Disrupts MHC-I anchor pocket B without touching DNA groove)",
        catalyticSafe=True,
    ),
    EpitopeHotspot(
        peptide="KTYAHLFDD",
        residueRange="aa 836–844",
        domain="HNH Catalytic Core (Contains H840)",
        hlaAllele="HLA-A*11:01 (High South Asian Frequency ~21%)",
        hlaAlleles=["HLA-A*11:01"],
        bindingScore=84,
        stealthMutation="K836R (Preserves H840 active-site histidine required for strand nicking)",
        catalyticSafe=True,
    ),
    EpitopeHotspot(
        peptide="IYLAAANRL",
        residueRange="aa 1012–1020",
        domain="RuvC-III Domain",
        hlaAllele="HLA-A*24:02 (South Asian Frequency ~18%)",
        hlaAlleles=["HLA-A*24:02"],
        bindingScore=88,
        stealthMutation="L1020G (Eliminates C-terminal anchor binding to HLA groove)",
        catalyticSafe=True,
    ),
    EpitopeHotspot(
        peptide="FEDFLKNRM",
        residueRange="aa 418–426",
        domain="Bridge Helix (Structural Stability)",
        hlaAllele="HLA-B*40:06 (High Dravidian / SAS Frequency ~14%)",
        hlaAlleles=["HLA-B*40:06"],
        bindingScore=81,
        stealthMutation="F421A (Masks hydrophobic anchor while preserving alpha-helical backbone)",
        catalyticSafe=True,
    ),
    EpitopeHotspot(
        peptide="TLYETRRDL",
        residueRange="aa 674–682",
        domain="REC3 Domain (Target RNA Alignment)",
        hlaAllele="HLA-B*15:02 (High Indo-Aryan SAS Frequency ~12%)",
        hlaAlleles=["HLA-B*15:02"],
        bindingScore=78,
        stealthMutation="L675S (Ablates C-terminal peptide binding to MHC cleft)",
        catalyticSafe=True,
    ),
]


def reverse_complement(seq: str) -> str:
    comp = {"A": "T", "T": "A", "C": "G", "G": "C", "N": "N"}
    return "".join(comp.get(b, b) for b in reversed(seq.upper()))


def classify_pam(
    pam: str, pam_variant: Literal["SpCas9", "SpCas9-NG", "SpRY"]
) -> Literal["preferred", "relaxed"] | None:
    """Classify a concrete 3-nt PAM using the same rules as the web engine."""
    normalized = pam.upper()
    if len(normalized) != 3 or any(base not in "ACGT" for base in normalized):
        return None

    second_base, third_base = normalized[1], normalized[2]
    if pam_variant == "SpCas9":
        if second_base == "G" and third_base == "G":
            return "preferred"
        # NAG is 5'-N-A-G-3', not NGA.
        if second_base == "A" and third_base == "G":
            return "relaxed"
        return None
    if pam_variant == "SpCas9-NG":
        if second_base != "G":
            return None
        return "preferred" if third_base == "G" else "relaxed"

    # SpRY is modeled as NNN, with NRN preferred over NYN for ranking.
    return "preferred" if second_base in ("A", "G") else "relaxed"


def calc_rna_dna_dg37(spacer: str) -> float:
    """Computes nearest-neighbor RNA:DNA hybrid stability (kcal/mol at 37°C)."""
    dg = 1.9  # Helix initiation penalty
    for k in range(len(spacer) - 1):
        dinuc = spacer[k : k + 2]
        dg += RNA_DNA_DG37.get(dinuc, -1.4)
    return round(dg, 2)


def score_candidate_thermodynamic(
    spacer: str,
    has_preferred_pam: bool,
    gc_content: int,
    target_in_window: bool,
    target_pos_weight: float,
    edits: list[BystanderEdit],
    has_sas_snp: bool,
) -> tuple[int, Literal["Optimal Clinical Guide", "Safe (Silent Bystander)", "High Risk (Bystander/SNP)", "Low Efficiency"]]:
    score = 65.0 if has_preferred_pam else 48.0

    # 1. Nearest-Neighbor RNA:DNA Hybridization Free Energy Bonus
    # Optimal R-loop invasion occurs around dG_37 in [-34.0, -24.0] kcal/mol
    dg37 = calc_rna_dna_dg37(spacer)
    if -34.5 <= dg37 <= -24.0 and 40 <= gc_content <= 60:
        score += 16.0
    elif 35 <= gc_content <= 65:
        score += 9.0
    else:
        score -= 10.0

    # 2. Seed Region (positions 13-20 proximal to PAM) G/C nucleation stability
    seed_gc = sum(1 for b in spacer[12:20] if b in ("G", "C"))
    if 3 <= seed_gc <= 6:
        score += 4.0

    # 3. Empirical Deaminase Positional Efficiency
    if target_in_window:
        score += 32.0 + (target_pos_weight * 8.0)
    else:
        score -= 25.0

    # 4. U6 Pol III termination check (TTTT)
    has_pol_iii_stop = "TTTT" in spacer
    if has_pol_iii_stop:
        score -= 30.0

    # 5. Bystander Codon Consequence Penalties
    has_harmful_bystander = False
    has_silent_bystander = False
    for e in edits:
        if e.classification == "Nonsense (Premature Stop)":
            score -= 45.0
            has_harmful_bystander = True
        elif e.classification == "Missense (Pathogenic Risk)":
            score -= 25.0
            has_harmful_bystander = True
        elif e.classification == "Silent (Synonymous)":
            score += 4.0
            has_silent_bystander = True

    if has_sas_snp:
        score -= 20.0

    final_score = max(5, min(99, round(score)))

    verdict: Literal[
        "Optimal Clinical Guide",
        "Safe (Silent Bystander)",
        "High Risk (Bystander/SNP)",
        "Low Efficiency",
    ] = "Low Efficiency"

    if target_in_window and not has_harmful_bystander and not has_sas_snp and not has_pol_iii_stop:
        verdict = "Safe (Silent Bystander)" if has_silent_bystander else "Optimal Clinical Guide"
    elif has_harmful_bystander or has_sas_snp:
        verdict = "High Risk (Bystander/SNP)"

    return final_score, verdict


# ============================================================================
# 3. API ENDPOINTS
# ============================================================================


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "online",
        "engine": "NanoCRISPR-3D Python FastAPI Bio-Engine",
        "modules": [
            "RNA:DNA Sugimoto Nearest-Neighbor Thermodynamics",
            "ABE8e/BE4max Empirical Positional Activity",
            "Israelachvili CPP & De Gennes LNP Biophysics",
            "ImmunoShield South Asian MHC-I Panel",
        ],
    }


@app.post("/api/v1/crispr/scan", response_model=list[GuideCandidate])
def scan_guides(preset: GenePreset) -> list[GuideCandidate]:
    seq = preset.sequence.upper()
    editor_config = BASE_EDITOR_CONFIGS[preset.editorType]
    target_base = str(editor_config["target_base"])
    replacement_base = str(editor_config["replacement_base"])
    window_start, window_end = editor_config["window"]
    pos_weights = editor_config["weights"]

    candidates: list[GuideCandidate] = []

    # 1. Sense (+) Strand Scan
    for i in range(0, len(seq) - 22):
        spacer = seq[i : i + 20]
        pam = seq[i + 20 : i + 23]
        pam_classification = classify_pam(pam, preset.pamVariant)
        if pam_classification is None:
            continue

        gc_count = sum(1 for b in spacer if b in ("G", "C"))
        gc_content = round((gc_count / 20) * 100)

        # Co-editing across the selected editor's activity window.
        co_edited = list(seq)
        for pos in range(window_start, window_end + 1):
            g_idx = i + (pos - 1)
            if 0 <= g_idx < len(seq) and seq[g_idx] == target_base:
                co_edited[g_idx] = replacement_base
        co_edited_seq = "".join(co_edited)

        edits: list[BystanderEdit] = []
        target_in_window = False
        target_pos_weight = 0.0

        for pos in range(window_start, window_end + 1):
            g_idx = i + (pos - 1)
            if g_idx < 0 or g_idx >= len(seq):
                continue
            if seq[g_idx] == target_base:
                codon_start = (g_idx // 3) * 3
                orig_codon = seq[codon_start : codon_start + 3]
                if len(orig_codon) < 3:
                    continue
                edit_codon = co_edited_seq[codon_start : codon_start + 3]
                orig_aa = CODON_TABLE.get(orig_codon, "?")
                edit_aa = CODON_TABLE.get(edit_codon, "?")

                is_target = g_idx == preset.mutationIndex
                if is_target:
                    target_in_window = True
                    target_pos_weight = pos_weights.get(pos, 0.8)

                classification: BystanderEdit.__annotations__["classification"] = (
                    "Missense (Pathogenic Risk)"
                )
                if is_target:
                    classification = "Target Edit"
                elif edit_aa == "*":
                    classification = "Nonsense (Premature Stop)"
                elif orig_aa == edit_aa:
                    classification = "Silent (Synonymous)"

                edits.append(
                    BystanderEdit(
                        guidePos=pos,
                        genomicIndex=g_idx,
                        originalCodon=orig_codon,
                        editedCodon=edit_codon,
                        originalAA=orig_aa,
                        editedAA=edit_aa,
                        classification=classification,
                    )
                )

        has_sas_snp = i <= preset.sasSnpIndex <= (i + 22)
        score, verdict = score_candidate_thermodynamic(
            spacer,
            pam_classification == "preferred",
            gc_content,
            target_in_window,
            target_pos_weight,
            edits,
            has_sas_snp,
        )

        candidates.append(
            GuideCandidate(
                id=f"sgRNA-f{i + 1}",
                spacer=spacer,
                pam=pam,
                strand="+",
                startIndex=i,
                gcContent=gc_content,
                targetInWindow=target_in_window,
                bystanders=edits,
                hasSasSnpCollision=has_sas_snp,
                CompositeScore=score,
                verdict=verdict,
            )
        )

    # 2. Antisense (-) Strand Scan (3' PAM at sense indices i-3 .. i-1)
    sense_replacement = "C" if target_base == "A" else "A"
    for i in range(3, len(seq) - 19):
        spacer = reverse_complement(seq[i : i + 20])
        pam = reverse_complement(seq[i - 3 : i])
        pam_classification = classify_pam(pam, preset.pamVariant)
        if pam_classification is None:
            continue

        gc_count = sum(1 for b in spacer if b in ("G", "C"))
        gc_content = round((gc_count / 20) * 100)

        co_edited = list(seq)
        for pos in range(window_start, window_end + 1):
            g_idx = (i + 19) - (pos - 1)
            if 0 <= g_idx < len(seq) and reverse_complement(seq[g_idx]) == target_base:
                co_edited[g_idx] = sense_replacement
        co_edited_seq = "".join(co_edited)

        edits = []
        target_in_window = False
        target_pos_weight = 0.0

        for pos in range(window_start, window_end + 1):
            g_idx = (i + 19) - (pos - 1)
            if g_idx < 0 or g_idx >= len(seq):
                continue
            if reverse_complement(seq[g_idx]) == target_base:
                codon_start = (g_idx // 3) * 3
                orig_codon = seq[codon_start : codon_start + 3]
                if len(orig_codon) < 3:
                    continue
                edit_codon = co_edited_seq[codon_start : codon_start + 3]
                orig_aa = CODON_TABLE.get(orig_codon, "?")
                edit_aa = CODON_TABLE.get(edit_codon, "?")

                is_target = g_idx == preset.mutationIndex
                if is_target:
                    target_in_window = True
                    target_pos_weight = pos_weights.get(pos, 0.8)

                classification = "Missense (Pathogenic Risk)"
                if is_target:
                    classification = "Target Edit"
                elif edit_aa == "*":
                    classification = "Nonsense (Premature Stop)"
                elif orig_aa == edit_aa:
                    classification = "Silent (Synonymous)"

                edits.append(
                    BystanderEdit(
                        guidePos=pos,
                        genomicIndex=g_idx,
                        originalCodon=orig_codon,
                        editedCodon=edit_codon,
                        originalAA=orig_aa,
                        editedAA=edit_aa,
                        classification=classification,
                    )
                )

        has_sas_snp = (i - 3) <= preset.sasSnpIndex <= (i + 19)
        score, verdict = score_candidate_thermodynamic(
            spacer,
            pam_classification == "preferred",
            gc_content,
            target_in_window,
            target_pos_weight,
            edits,
            has_sas_snp,
        )

        candidates.append(
            GuideCandidate(
                id=f"sgRNA-r{i + 1}",
                spacer=spacer,
                pam=pam,
                strand="-",
                startIndex=i,
                gcContent=gc_content,
                targetInWindow=target_in_window,
                bystanders=edits,
                hasSasSnpCollision=has_sas_snp,
                CompositeScore=score,
                verdict=verdict,
            )
        )

    candidates.sort(key=lambda c: c.CompositeScore, reverse=True)
    return candidates[:10]


@app.post("/api/v1/nanotech/simulate", response_model=LnpBiophysicsResult)
def simulate_lnp(form: LnpFormulation) -> LnpBiophysicsResult:
    raw_total = form.ionizableLipid + form.dspcHelper + form.cholesterol + form.pegLipid
    total = raw_total if raw_total > 0 else 100.0

    norm_ion = (form.ionizableLipid / total) * 100.0
    norm_dspc = (form.dspcHelper / total) * 100.0
    norm_chol = (form.cholesterol / total) * 100.0
    norm_peg = max(0.1, (form.pegLipid / total) * 100.0)

    # 1. Hydrodynamic diameter (Dh in nm) via surface curvature & N/P compaction
    raw_dh = (
        135.0
        - 24.0 * math.log(max(0.3, norm_peg * 2.2))
        + (6.0 - form.npRatio) * 3.5
        + (norm_dspc - 10.0) * 0.45
    )
    diameter_nm = round(max(42.0, min(210.0, raw_dh)))

    # 2. Polydispersity Index (PDI)
    chol_dev = abs(norm_chol - 38.5) * 0.004
    dspc_dev = abs(norm_dspc - 10.0) * 0.0025
    low_peg_pen = 0.12 if norm_peg < 1.0 else 0.0
    pdi = round(min(0.45, 0.06 + chol_dev + dspc_dev + low_peg_pen), 2)

    # 3. Henderson-Hasselbalch Ionization
    endosomal_prot = round(100.0 / (1.0 + math.pow(10.0, 5.5 - form.lipidPka)))
    blood_prot = round(100.0 / (1.0 + math.pow(10.0, 7.4 - form.lipidPka)))

    # 4. Zeta potential at pH 7.4 (mV)
    zeta_mv = round((blood_prot * 0.35) - (norm_peg * 2.1), 1)

    # 5. De Gennes Polymer Brush Scaling & ApoE Opsonization
    peg_mol_frac = max(0.002, norm_peg / 100.0)
    grafting_dist_d = math.sqrt(0.65 / peg_mol_frac)
    rf_over_d = round(3.43 / grafting_dist_d, 2)

    peg_penalty = (
        max(10.0, 100.0 - math.pow(norm_peg - 2.0, 1.8) * 18.0)
        if norm_peg > 2.2
        else 95.0
    )
    cellular_uptake = round(min(98.0, max(8.0, peg_penalty)))

    # 6. Israelachvili Critical Packing Parameter: CPP = v / (a_0(pH) * l_c)
    # Branched ionizable tail volume v ~ 1.18 nm^3, l_c ~ 1.65 nm; ion-pairing shrinks a_0 at pH 5.5
    cpp_ph55 = round(
        1.08 + (endosomal_prot / 100.0) * 0.58 + (norm_ion - 50.0) * 0.002,
        2,
    )

    # 7. Endosomal Escape Efficiency
    pka_sweet_spot = max(0.0, 100.0 - abs(form.lipidPka - 6.35) * 55.0)
    escape_eff = round(
        min(
            99.0,
            max(
                5.0,
                endosomal_prot * 0.4 + pka_sweet_spot * 0.35 + cellular_uptake * 0.25,
            ),
        )
    )

    # 8. Bounded SORT Organ Tropism (Liver + Spleen + Lungs == 100%)
    liver, spleen, lungs = 78, 15, 7
    if form.lipidPka > 6.7 or zeta_mv > 8.0:
        pka_shift = max(0.0, (form.lipidPka - 6.5) * 45.0)
        zeta_shift = max(0.0, (zeta_mv - 5.0) * 2.2)
        lungs = min(68, max(12, round(15.0 + pka_shift + zeta_shift)))
        liver = max(20, 78 - lungs)
        spleen = max(4, 100 - liver - lungs)
        liver = 100 - lungs - spleen
    elif form.lipidPka < 6.0 or zeta_mv < -5.0:
        pka_shift = max(0.0, (6.2 - form.lipidPka) * 50.0)
        anionic_shift = max(0.0, (-4.0 - zeta_mv) * 3.5)
        spleen = min(62, max(18, round(20.0 + pka_shift + anionic_shift)))
        liver = max(25, 82 - spleen)
        lungs = max(4, 100 - liver - spleen)
        liver = 100 - spleen - lungs

    stability: LnpBiophysicsResult.__annotations__["stabilityStatus"] = (
        "Optimal Clinical LNP"
    )
    if norm_peg > 3.2:
        stability = "PEG Stealth Dilemma (Low Uptake)"
    elif diameter_nm > 140 or norm_peg < 0.8:
        stability = "Aggregation Risk (Too Large)"
    elif escape_eff < 58:
        stability = "Poor Endosomal Escape"

    saxs_spacing = round(6.45 - (form.npRatio - 3.0) * 0.08, 2)

    return LnpBiophysicsResult(
        diameterNm=diameter_nm,
        pdi=pdi,
        zetaPotentialMv=zeta_mv,
        endosomalProtonationPct=endosomal_prot,
        bloodProtonationPct=blood_prot,
        endosomalEscapeEfficiency=escape_eff,
        cellularUptakeScore=cellular_uptake,
        deGennesRfOverD=rf_over_d,
        criticalPackingParam=cpp_ph55,
        saxsBraggSpacingNm=saxs_spacing,
        organTropism=OrganTropism(liver=liver, spleen=spleen, lungs=lungs),
        stabilityStatus=stability,
    )


@app.post("/api/v1/nanotech/batch", response_model=BatchMassCalculation)
def calculate_batch_masses_endpoint(req: BatchMassRequest) -> BatchMassCalculation:
    safe_vol = max(0.1, req.targetVolumeMl)
    safe_mrna_conc = max(0.01, req.mrnaConcMgMl)
    safe_ionizable = max(1.0, req.form.ionizableLipid)

    total_mrna_mass_mg = round(safe_vol * safe_mrna_conc, 2)
    mmoles_phosphate = total_mrna_mass_mg / 330.0
    mmoles_ionizable = mmoles_phosphate * req.form.npRatio
    total_lipid_mmoles = mmoles_ionizable / (safe_ionizable / 100.0)

    mw_ionizable = 710.2
    mw_dspc = 790.15
    mw_chol = 386.65
    mw_peg = 2509.2

    mmoles_dspc = total_lipid_mmoles * (req.form.dspcHelper / 100.0)
    mmoles_chol = total_lipid_mmoles * (req.form.cholesterol / 100.0)
    mmoles_peg = total_lipid_mmoles * (req.form.pegLipid / 100.0)

    mass_ionizable = round(mmoles_ionizable * mw_ionizable, 2)
    mass_dspc = round(mmoles_dspc * mw_dspc, 2)
    mass_chol = round(mmoles_chol * mw_chol, 2)
    mass_peg = round(mmoles_peg * mw_peg, 2)
    total_lipid_mass_mg = round(mass_ionizable + mass_dspc + mass_chol + mass_peg, 2)

    vol_liters = safe_vol / 1000.0

    return BatchMassCalculation(
        targetVolumeMl=safe_vol,
        mrnaConcMgMl=safe_mrna_conc,
        totalMrnaMassMg=total_mrna_mass_mg,
        totalLipidMassMg=total_lipid_mass_mg,
        components=[
            ComponentMass(
                name="Ionizable Lipid (SM-102 proxy)",
                role="mRNA complexation & endosomal escape",
                molarPct=req.form.ionizableLipid,
                mw=mw_ionizable,
                massMg=mass_ionizable,
                molarConcMm=round(mmoles_ionizable / vol_liters, 2),
            ),
            ComponentMass(
                name="DSPC (Helper Lipid)",
                role="Bilayer structural support",
                molarPct=req.form.dspcHelper,
                mw=mw_dspc,
                massMg=mass_dspc,
                molarConcMm=round(mmoles_dspc / vol_liters, 2),
            ),
            ComponentMass(
                name="Cholesterol",
                role="Membrane fluidity & particle rigidity",
                molarPct=req.form.cholesterol,
                mw=mw_chol,
                massMg=mass_chol,
                molarConcMm=round(mmoles_chol / vol_liters, 2),
            ),
            ComponentMass(
                name="DMG-PEG2000 (Stealth Lipid)",
                role="Colloidal stability & steric hindrance",
                molarPct=req.form.pegLipid,
                mw=mw_peg,
                massMg=mass_peg,
                molarConcMm=round(mmoles_peg / vol_liters, 2),
            ),
        ],
    )


@app.get("/api/v1/immunology/epitopes", response_model=list[EpitopeHotspot])
def get_epitopes() -> list[EpitopeHotspot]:
    return CAS9_EPITOPE_HOTSPOTS


SOUTH_ASIAN_HLA_ALLELES: list[str] = sorted(
    list({allele for ep in CAS9_EPITOPE_HOTSPOTS for allele in ep.hlaAlleles})
)


def filter_epitopes_by_hla_alleles(
    selected_alleles: list[str],
    epitopes: list[EpitopeHotspot] = CAS9_EPITOPE_HOTSPOTS,
) -> list[EpitopeHotspot]:
    selected = {allele.upper() for allele in selected_alleles}
    if not selected:
        return []
    return [
        ep for ep in epitopes
        if any(allele.upper() in selected for allele in ep.hlaAlleles)
    ]


def calculate_hla_risk_score(
    active_epitopes: list[EpitopeHotspot] = CAS9_EPITOPE_HOTSPOTS,
    active_stealth_mutations: dict[str, bool] | None = None,
) -> int:
    if not active_epitopes:
        return 0
    if active_stealth_mutations is None:
        active_stealth_mutations = {}
    total = sum(
        min(8, ep.bindingScore) if active_stealth_mutations.get(ep.peptide, False) else ep.bindingScore
        for ep in active_epitopes
    )
    return round(total / len(active_epitopes))


@app.get("/api/v1/immunology/alleles", response_model=list[str])
def get_hla_alleles() -> list[str]:
    return SOUTH_ASIAN_HLA_ALLELES


@app.post("/api/v1/immunology/assess", response_model=HlaAssessmentResult)
def assess_hla(req: HlaAssessmentRequest) -> HlaAssessmentResult:
    relevant = filter_epitopes_by_hla_alleles(req.selectedAlleles, CAS9_EPITOPE_HOTSPOTS)
    risk = calculate_hla_risk_score(relevant, req.activeStealthMutations)
    return HlaAssessmentResult(patientRelevantEpitopes=relevant, residualRiskScore=risk)
```

---

---

## 5. Developer Protocols & Operating Directives for Agent Argon

When editing or extending this codebase, adhere strictly to these principles:
1. **Zero Stoichiometric Drift:** The 4 lipid components must sum to exactly 100.0% at all times across UI sliders, TypeScript engines, and Python Pydantic models.
2. **Preserve Type Safety:** Keep all interfaces in `src/engines/types.ts` strictly synchronized with the Pydantic schemas in `backend/main.py`.
3. **Engine-UI Separation:** Keep computational biochemistry decoupled inside `src/engines/` and `backend/`. Do not inline biological equations directly into React UI event listeners.
4. **Build & Lint Verification:** Always verify that `npm run build` (`tsc -b && vite build`) and `npm run lint` (`oxlint`) pass with 0 errors and 0 warnings.
5. **Attribution:** Preserve academic attribution to Arunabha Ghosh (MAKAUT) under the Apache License 2.0.
