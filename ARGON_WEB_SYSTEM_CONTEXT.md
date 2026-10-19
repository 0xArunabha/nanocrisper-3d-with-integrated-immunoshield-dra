# AGENT ARGON SYSTEM CONTEXT: FULL WEB APPLICATION DOSSIER
**Target Application:** `nanoCRISPER 3D with integrated immunoshield DRA`  
**Author:** Arunabha Ghosh, BSc Biotechnology (1st Year), Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal, India  
**Document Purpose:** Complete architectural blueprint, scientific rationale, domain algorithms, biophysical equations, interactive workflows, and full-codebase repository dump for Agent Argon (local sandboxed AI agent).

---

## 1. Executive Summary & Mission Brief for Agent Argon

Welcome, **Agent Argon**. This document provides you with complete, self-contained context regarding the entire **nanoCRISPER 3D with Integrated Immunoshield DRA** web application. 

### What is this web application?
**nanoCRISPER 3D** is an interactive, browser-native biocomputational workstation and molecular modeling suite. It unifies two critical fronts of modern genetic nanomedicine:
1. **Precision Codon-Aware CRISPR Base Editing:** Dual-strand protospacer discovery, deaminase activity window (positions 4–8) simulation, bystander missense/nonsense mutation profiling, Golden Gate cloning oligonucleotide design, and South Asian (SAS) population polymorphism collision detection.
2. **Nanotechnology & Lipid Nanoparticle (LNP) Formulation Engineering:** Multi-component lipid stoichiometry balancing, Henderson-Hasselbalch protonation kinetics, Israelachvili Critical Packing Parameter ($CPP$) phase transitions, De Gennes polymer brush scaling ("The PEG Dilemma"), ApoE opsonization dynamics, Selective Organ Targeting (SORT) biodistribution, wet-lab microfluidic batch mass calculations, and interactive hardware-accelerated 3D structural cutaway rendering.
3. **ImmunoShield Adaptive De-Immunization:** Structure-guided humanization of *Sp*Cas9 against high-frequency South Asian MHC Class I alleles (HLA-A\*02:01, HLA-A\*24:02, HLA-A\*11:01, HLA-B\*40:06, HLA-B\*15:02) to mitigate pre-existing host cytotoxic T-lymphocyte (CTL) responses.
4. **Pre-IND CMC Regulatory Dossier Export:** One-click generation of comprehensive clinical evaluation reports formatted in Markdown.

### Your Role as Agent Argon
As a sandboxed local AI agent, you can inspect, refactor, optimize, extend, and test any part of this web application without external network access. All mathematical models, data schemas, UI components, and TypeScript source files are provided in this single document.

---

## 2. Project Architecture & Technology Stack

The project is built on modern web technologies optimized for high-performance rendering and client-side computational biochemistry:

| Layer | Technology | Version / Spec | Purpose |
| :--- | :--- | :--- | :--- |
| **Language** | TypeScript | ~6.0.2 | Strict static typing across all bio-engines and domain models |
| **Frontend Framework** | React 19 | ^19.2.8 | Declarative UI, Concurrent Mode, zero-overhead memoized state |
| **Build Tool & Bundler**| Vite | ^8.3.0 | Instant ESM HMR and optimized production bundling |
| **Styling & Design** | Tailwind CSS v4 | ^4.3.3 | Scientific dark-mode design system with bespoke typography |
| **3D Graphics Engine** | Three.js | ^0.186.1 | WebGL scene graph, custom shaders, and geometry rendering |
| **React 3D Bridge** | React Three Fiber (R3F) | ^9.8.2 | Declarative component tree for Three.js canvas |
| **3D Helpers** | @react-three/drei | ^10.7.9 | Camera controls, orbit manipulation, environment helpers |
| **Icons** | Lucide React | ^1.59.0 | UI symbols and status glyphs |
| **Linter** | Oxlint | ^1.81.0 | High-speed Rust-based linting |

### Architectural Pattern: Hexagonal / Ports & Adapters
The application decouples its scientific engines from the React presentation layer using an interface-driven design (`IBioEngineService`).
- **In-Browser Heuristics (`LocalBioEngineService`):** High-speed, client-side TypeScript calculations (<1 ms execution) for immediate UI feedback as sliders and inputs change.
- **Future Remote Backend (`RemotePythonBioEngineService`):** Prepared contract for Year 2 integration with external Python/FastAPI backends running GROMACS molecular dynamics or PyTorch neural surrogate models without altering a single line of React code.

---

## 3. Directory Layout & File Manifest

```text
nanoCRISPER 3D with intigrated immunoshield DRA/
│
├── package.json                         # Project metadata, scripts, and dependencies
├── tsconfig.json                        # Base TypeScript configuration
├── tsconfig.app.json                    # Application-specific compiler options
├── tsconfig.node.json                   # Vite tooling TypeScript options
├── vite.config.ts                       # Vite configuration with React & Tailwind plugins
├── index.html                           # Root HTML container with scientific fonts
├── README.md                            # Public overview, citation, and academic attribution
├── ARGON_LNP_3D_MODEL_SPEC.md           # Dedicated specification for the 3D cutaway engine
├── ARGON_WEB_SYSTEM_CONTEXT.md          # THIS FILE: Master context document for Agent Argon
│
├── public/
│   ├── favicon.svg                      # Platform nanoparticle icon
│   └── icons.svg                        # SVG symbol sheet
│
└── src/
    ├── main.tsx                         # React 19 application entry point
    ├── App.tsx                          # Primary dual-workstation UI container (~1,590 lines)
    ├── App.css                          # Layout styles and custom animation classes
    ├── index.css                        # Tailwind v4 import, CSS custom properties, typography
    │
    ├── styles/
    │   └── tokens.ts                    # Centralized theme tokens (dark laboratory palette)
    │
    ├── components/
    │   └── NanoViewport3D.tsx           # R3F 3D LNP cutaway viewport component (~1,200 lines)
    │
    └── engines/
        ├── types.ts                     # TypeScript interfaces and domain data contracts
        ├── presets.ts                   # Curated genetic disease presets (HBB, PCSK9, TTR)
        ├── service.ts                   # Hexagonal bio-engine service classes (Local & Remote)
        ├── index.ts                     # Central barrel export for all engines
        ├── bioEngines.ts                # Backward-compatibility re-export barrel
        │
        ├── crispr/
        │   ├── guideScanner.ts          # Dual-strand PAM scan, window 4-8 deamination & codon audit
        │   └── oligoGenerator.ts        # BsmBI / Esp3I Golden Gate cloning oligo generator
        │
        ├── nanotech/
        │   ├── lnpSimulator.ts          # LNP biophysics, Henderson-Hasselbalch, de Gennes, SORT
        │   └── batchCalculator.ts       # Microfluidic wet-lab lipid/mRNA mass calculation
        │
        └── immunology/
            └── hlaScanner.ts            # South Asian HLA epitope catalog & de-immunization
```

---

## 4. Scientific Mechanics & Computational Algorithms

### 4.1 Dual-Strand Codon-Aware CRISPR & Base Editor Discovery Engine
**File:** `src/engines/crispr/guideScanner.ts`

Traditional guide discovery tools only search for canonical PAM sequences and predict cleavage efficiency. The nanoCRISPER engine advances this with:
1. **Dual-Strand Search:** Searches both Sense ($+$) and Antisense ($-$) strands for 20-nt protospacers.
2. **PAM Identification:**
   - Canonical PAM: `5'-NGG-3'` (Scores base 65)
   - Relaxed PAM: `5'-NAG-3'` (Scores base 48)
3. **Deaminase Activity Window (Positions 4–8):**
   - Adenine Base Editors (ABE8e): Converts $A \to G$.
   - Cytosine Base Editors (BE4max): Converts $C \to T$.
   - For Antisense ($-$) strand targets, the deamination on the antisense strand converts $A \to G$ (manifesting on the sense coding strand as $T \to C$) or $C \to T$ (manifesting on the sense strand as $G \to A$).
4. **Codon Consequence Audit:**
   - The engine translates codons across the full open reading frame (ORF) using `CODON_TABLE`.
   - Edits are classified into:
     - `Target Edit`: Modifies the precise pathogenic mutant nucleotide.
     - `Silent (Synonymous)`: Deamination within window 4–8 changes nucleotide but preserves original amino acid.
     - `Missense (Pathogenic Risk)`: Modifies adjacent codon resulting in non-synonymous amino acid change.
     - `Nonsense (Premature Stop)`: Generates a premature termination codon (`TAA`, `TAG`, `TGA`).
5. **Heuristic Scoring Model:**
   $$S_{\text{composite}} = S_{\text{PAM}} + S_{\text{GC}} + S_{\text{target}} - S_{\text{bystander}} - S_{\text{SNP}}$$
   - Target in window: $+35$ bonus; missing target: $-25$ penalty.
   - GC content sweet spot ($40\% \le \text{GC} \le 60\%$): $+15$ bonus.
   - Nonsense bystander: $-45$ penalty; Missense bystander: $-25$ penalty; Silent bystander: $+4$ bonus.
   - South Asian SNP collision: $-20$ penalty.
   - Clamped to $[5, 99]$.
6. **South Asian Population Awareness:**
   - Cross-references spacer coordinates with high-frequency South Asian polymorphisms (from IndiGen and 1000 Genomes SAS):
     - **HBB (Exon 1):** Sickle Cell Disease (HbS $E6V \to$ HbG-Makassar) vs. `rs10768683` (MAF: 14.2%).
     - **PCSK9 (Exon 1):** Familial Hypercholesterolemia (VERVE-101) vs. `rs505151` (MAF: 8.9%).
     - **TTR (Exon 2):** Transthyretin Amyloidosis (NTLA-2001) vs. `rs76992529` (MAF: 5.4%).

---

### 4.2 Golden Gate Cloning Oligonucleotide Generator
**File:** `src/engines/crispr/oligoGenerator.ts`

Generates ready-to-order DNA oligonucleotides for directional Type IIS restriction cloning (`BsmBI` / `Esp3I` / `BpiI`):
- **Top Oligo (Forward):** Appends `5'-CACC-3'` sticky overhang. If the 20-nt spacer does not begin with Guanine (`G`), an extra `G` is automatically inserted to guarantee efficient transcription initiation from the human U6 polymerase III promoter:
  $$\text{Top Oligo} = 5'\text{-CACC-[G?]-spacer-3'}$$
- **Bottom Oligo (Reverse):** Appends `5'-AAAC-3'` sticky overhang to the reverse complement of the spacer:
  $$\text{Bottom Oligo} = 5'\text{-AAAC-[spacerRC]-[C?]-3'}$$

---

### 4.3 ImmunoShield South Asian HLA De-immunization Catalog
**File:** `src/engines/immunology/hlaScanner.ts`

Up to 80% of human adults possess pre-existing neutralizing antibodies and cytotoxic T-cells (CTLs) against *Streptococcus pyogenes* Cas9 (SpCas9) due to childhood bacterial exposure. In vivo LNP delivery risks rapid immune clearance of transfected cells.
The ImmunoShield module catalogs immunogenic 9-mer MHC-I epitopes bound by dominant South Asian HLA alleles and pairs them with structure-guided mutations that preserve catalytic nicking ($D10 / H840$):
1. **`NLIALSLGL` (aa 236–244, REC2):** Bound by `HLA-A*02:01` / `HLA-A*24:02` $\to$ De-immunized via **`L240T`**.
2. **`KTYAHLFDD` (aa 836–844, HNH):** Bound by `HLA-A*11:01` ($\sim 21\%$ SAS frequency) $\to$ De-immunized via **`K836R`** (protects active-site $H840$).
3. **`IYLAAANRL` (aa 1012–1020, RuvC-III):** Bound by `HLA-A*24:02` ($\sim 18\%$ SAS frequency) $\to$ De-immunized via **`L1020G`**.
4. **`FEDFLKNRM` (aa 418–426, Bridge Helix):** Bound by `HLA-B*40:06` ($\sim 14\%$ SAS frequency) $\to$ De-immunized via **`F421A`**.
5. **`TLYETRRDL` (aa 674–682, REC3):** Bound by `HLA-B*15:02` ($\sim 12\%$ SAS frequency) $\to$ De-immunized via **`L675S`**.

---

### 4.4 Nanotechnology & LNP Biophysics Formulation Engine
**File:** `src/engines/nanotech/lnpSimulator.ts`

The biophysics engine simulates the physicochemical behavior of a 4-component lipid nanoparticle:
1. **Dynamic 4-Lipid Stoichiometry Auto-Balancing:**
   $$\text{Cholesterol (mol\%)} = 100.0 - (\text{Ionizable Lipid} + \text{DSPC Helper} + \text{DMG-PEG2000})$$
   Guarantees the molar sum is strictly locked at $100.0\%$ at all times.

2. **Hydrodynamic Diameter ($D_h$ in nm):**
   Higher PEG-lipid content increases surface curvature, reducing particle size:
   $$D_h = \text{round}\left(135 - 24 \cdot \ln(\max(0.3, X_{\text{PEG}} \cdot 2.2)) + (6 - N/P) \cdot 3.5\right)$$
   Bounded physically to $42\text{ nm} \le D_h \le 210\text{ nm}$.

3. **Polydispersity Index (PDI):**
   Models particle size distribution uniformity. Deviations from optimal cholesterol ($\sim 38.5\text{ mol\%}$) and sub-optimal PEG ($<1.0\text{ mol\%}$) increase PDI:
   $$\text{PDI} = 0.06 + |\text{Chol} - 38.5| \cdot 0.004 + (X_{\text{PEG}} < 1.0 \,?\, 0.12 : 0)$$

4. **Henderson-Hasselbalch Ionization Kinetics:**
   $$\text{Protonation } (\%) = \frac{100}{1 + 10^{\text{pH} - \text{pK}_a}}$$
   - **Systemic Circulation ($\text{pH } 7.4$):** Particle should remain predominantly neutral ($<15\%$ protonation) to avoid non-specific macrophage clearance.
   - **Late Endosome ($\text{pH } 5.5$):** Particle rapidly protonates ($>85\%$), driving electrostatically mediated endosomal disruption.

5. **Zeta Potential ($\zeta$ in mV):**
   Calculated at physiological pH 7.4:
   $$\zeta = (\text{Protonation}_{\text{pH 7.4}} \cdot 0.35) - (X_{\text{PEG}} \cdot 2.1)$$

6. **De Gennes Polymer Scaling & The "PEG Dilemma":**
   Simulates PEG2000 polymer conformations on the outer shell:
   - Flory radius: $R_F \approx 3.43\text{ nm}$
   - Grafting distance: $D = \sqrt{0.65 / X_{\text{PEG}}}$
   - Ratio $R_F / D$:
     - $R_F / D < 1.0$: **Mushroom Regime** (chains do not overlap, leaving gaps for ApoE adsorption).
     - $R_F / D \ge 1.0$: **Dense Brush Regime** (chains overlap, creating strong steric hindrance).
   - **ApoE Cellular Uptake Score:** High PEG ($>2.2\text{ mol\%}$) shields against opsonization but blocks ApoE binding, crippling low-density lipoprotein receptor (LDLR)-mediated hepatic uptake.

7. **Israelachvili Critical Packing Parameter ($CPP$):**
   Tracks phase transition in late endosomes:
   $$CPP = 1.08 + (\text{Protonation}_{\text{pH 5.5}} / 100) \cdot 0.58$$
   - $CPP \approx 1.0$: Lamellar bilayer ($L_\alpha$).
   - $CPP \ge 1.45$: Inverted hexagonal phase ($H_{\text{II}}$) promoting membrane fusion and mRNA payload escape into the cytosol.

8. **SAXS Bragg Repeat Spacing ($d_{\text{SAXS}}$):**
   Computes core RNA-lipid repeat periodicity ($d \approx 5.8\text{–}6.4\text{ nm}$):
   $$d_{\text{SAXS}} = 6.45 - (N/P - 3) \cdot 0.08\text{ nm}$$

9. **Selective Organ Targeting (SORT) Biodistribution:**
   - Default (Neutral $\text{pK}_a \approx 6.2\text{–}6.5$): **Liver** ($78\%$), Spleen ($15\%$), Lungs ($7\%$).
   - High $\text{pK}_a$ ($>6.7$) or positive $\zeta$ ($>8\text{ mV}$): Shifts tropism toward **Lungs** (endothelial beds).
   - Low $\text{pK}_a$ ($<6.0$) or negative $\zeta$ ($<-5\text{ mV}$): Shifts tropism toward **Spleen** (macrophages/B-cells).

---

### 4.5 Microfluidic Wet-Lab Batch Mass Calculator
**File:** `src/engines/nanotech/batchCalculator.ts`

Translates target batch volume ($V$ in mL) and mRNA concentration ($C_{\text{mRNA}}$ in mg/mL) into exact mass quantities for microfluidic formulation (e.g., NanoAssemblr / Ignite):
1. Total mRNA mass: $M_{\text{mRNA}} = V \cdot C_{\text{mRNA}}\text{ (mg)}$.
2. Moles of phosphate: $n_{\text{phosphate}} = M_{\text{mRNA}} / 330\text{ mmol}$ (average nucleotide MW $\approx 330\text{ g/mol}$).
3. Required moles of ionizable nitrogen: $n_{\text{ionizable}} = n_{\text{phosphate}} \cdot (N/P)$.
4. Total lipid moles: $n_{\text{total}} = n_{\text{ionizable}} / (X_{\text{ionizable}} / 100)$.
5. Component masses:
   - Ionizable lipid (MW 710.2 g/mol)
   - DSPC (MW 790.15 g/mol)
   - Cholesterol (MW 386.65 g/mol)
   - DMG-PEG2000 (MW 2509.2 g/mol)
6. Outputs total lipid mass, individual milligram weights to dissolve in ethanol, millimolar concentrations, and the total lipid:mRNA weight ratio ($w/w$).

---

### 4.6 Interactive 3D Cutaway LNP Viewport Engine
**File:** `src/components/NanoViewport3D.tsx` *(See `ARGON_LNP_3D_MODEL_SPEC.md` for full 1200-line specification)*

Renders a biophysically calibrated cutaway model of the lipid nanoparticle:
- **Outer Monolayer Shell:** Procedurally generated lipid heads distributed via a Fibonacci sphere lattice.
- **Acyl Tails:** Inward vectors directed toward the core cavity.
- **Dynamic PEG Corona:** Procedural polymer beads transitioning between mushroom and brush states.
- **ApoE Opsonins:** Surface protein clusters positioned according to the PEG Dilemma equation.
- **Condensed Ribonucleic Core:** Semi-translucent cavity envelope containing Cas9/base editor mRNA coiled ribbon and inverted-micellar lipid nanoclusters.
- **Cutaway Modes:** Quarter wedge (90°), Sagittal (180°), Full sphere, Core-only.
- **HUD & Scale Bar:** Cryo-TEM calibrated 20 nm physical scale bar, DLS diameter, PDI, and Zeta potential readouts.

---

## 5. UI Layout & User Interaction Workflows

The web interface (`src/App.tsx`) is arranged into an ultra-dense, scientific laboratory workbench:

```text
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Target Gene Tabs (HBB, PCSK9, TTR, +Custom) | Mass Calc Toggle | Export Pre-IND (.md)   │
├───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Optional Drawer: Custom Sequence Input (5'->3' CDS, mutation index, SAS SNP, editor type, organ)]   │
├───────────────────────────────────────────────────────────┬───────────────────────────────────────────┤
│ LEFT WORKSTATION: GENOMICS & BASE EDITING                 │ RIGHT WORKSTATION: LNP BIOPHYSICS & 3D    │
│                                                           │                                           │
│ 1. Target Locus Metadata Bar                              │ 1. 3D Cutaway Viewport (NanoViewport3D)   │
│    - Disease indication, organ, editor, SAS SNP info      │    - WebGL Canvas, cutaway controls, HUD  │
│                                                           │                                           │
│ 2. Coding Sequence Track & Reading Frame                  │ 2. Lipid Formulation Sliders              │
│    - Pigment-coded A, T, C, G bases                       │    - Presets: Onpattro, SM-102, Lung-SORT │
│    - Cinnabar red target nucleotide highlight             │    - Sliders: Ionizable, DSPC, PEG, pKa   │
│    - Amber ochre SAS SNP highlight                        │    - Auto-balanced Cholesterol (Sum = 100)│
│    - Cyan active protospacer underline                    │                                           │
│                                                           │ 3. Wet-Lab Batch Mass Calculator (Drawer) │
│ 3. Protospacer Candidates Table                           │    - Target volume (mL) & mRNA conc       │
│    - Strand (+/-), Spacer, PAM, GC%, SAS SNP, Score,      │    - Component mg weights & mM molarities │
│      Evaluation verdict                                   │                                           │
│    - Interactive sorting by all fields & strand filters   │ 4. Calculated Biophysical Properties HUD  │
│                                                           │    - Dh (nm), PDI, Zeta (mV)              │
│ 4. Golden Gate Cloning Oligo Sheet                        │    - Endosomal protonation (pH 5.5)       │
│    - Top (5'-CACC) & Bottom (5'-AAAC) oligos              │    - Cellular uptake & endosomal escape   │
│    - One-click copy buttons with visual feedback          │                                           │
│                                                           │ 5. Predicted Biodistribution (SORT)       │
│ 5. Deaminase Codon Audit (Window 4–8)                     │    - Liver %, Spleen %, Lungs % bars      │
│    - Original codon -> Edited codon                       │                                           │
│    - Amino acid change & consequence classification       │                                           │
│                                                           │                                           │
│ 6. Cas9 ImmunoShield Epitope Panel                        │                                           │
│    - 5 South Asian HLA alleles & risk scores              │                                           │
│    - Stealth mutation toggle (L240T, K836R, etc.)         │                                           │
└───────────────────────────────────────────────────────────┴───────────────────────────────────────────┘
```

---

## 6. Complete Source Code Repository

The complete source code of all foundational files is reproduced below so Agent Argon has immediate access to every module:

### 6.1 `package.json`
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

### 6.2 `src/styles/tokens.ts`
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
  typography: {
    fontSans: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontDisplay: '"Space Grotesk", sans-serif',
    fontMono: '"IBM Plex Mono", "JetBrains Mono", monospace',
  }
} as const;
```

---

### 6.3 `src/engines/types.ts`
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

### 6.4 `src/engines/presets.ts`
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

### 6.5 `src/engines/crispr/guideScanner.ts`
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

  // 2. Scan Antisense (-) Strand
  for (let i = 0; i <= seq.length - 20; i++) {
    const spacer = reverseComplement(seq.slice(i, i + 20));

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

    if (!pam || (!isCanonicalPam && !isRelaxedPam)) continue;

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;

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

### 6.6 `src/engines/crispr/oligoGenerator.ts`
```typescript
// src/engines/crispr/oligoGenerator.ts
import type { CloningOligos } from '../types';
import { reverseComplement } from './guideScanner';

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

### 6.7 `src/engines/immunology/hlaScanner.ts`
```typescript
// src/engines/immunology/hlaScanner.ts
import type { EpitopeHotspot } from '../types';

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

export function calculateHlaRiskScore(activeEpitopes: EpitopeHotspot[] = CAS9_EPITOPE_HOTSPOTS): number {
  if (activeEpitopes.length === 0) return 0;
  const avg = activeEpitopes.reduce((acc, ep) => acc + ep.bindingScore, 0) / activeEpitopes.length;
  return Math.round(avg);
}
```

---

### 6.8 `src/engines/nanotech/lnpSimulator.ts`
```typescript
// src/engines/nanotech/lnpSimulator.ts
import type { LnpFormulation, LnpBiophysicsResult } from '../types';

export function simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
  const total = form.ionizableLipid + form.dspcHelper + form.cholesterol + form.pegLipid;
  const normPeg = (form.pegLipid / total) * 100;
  const normChol = (form.cholesterol / total) * 100;

  // 1. Hydrodynamic diameter (Dh in nm)
  const rawDiameter = 135 - 24 * Math.log(Math.max(0.3, normPeg * 2.2)) + (6 - form.npRatio) * 3.5;
  const diameterNm = Math.round(Math.max(42, Math.min(210, rawDiameter)));

  // 2. Polydispersity Index (PDI)
  const pdi = Number((0.06 + Math.abs(normChol - 38.5) * 0.004 + (normPeg < 1.0 ? 0.12 : 0)).toFixed(2));

  // 3. Henderson-Hasselbalch Ionization
  const endosomalProtonationPct = Math.round(100 / (1 + Math.pow(10, 5.5 - form.lipidPka)));
  const bloodProtonationPct = Math.round(100 / (1 + Math.pow(10, 7.4 - form.lipidPka)));

  // 4. Zeta Potential at pH 7.4 (mV)
  const zetaPotentialMv = Number(((bloodProtonationPct * 0.35) - (normPeg * 2.1)).toFixed(1));

  // 5. The "PEG Dilemma" & Cellular Uptake
  const pegPenalty = normPeg > 2.2 ? Math.max(10, 100 - Math.pow(normPeg - 2.0, 1.8) * 18) : 95;
  const cellularUptakeScore = Math.round(Math.min(98, Math.max(8, pegPenalty)));

  // 6. Endosomal Escape Efficiency
  const pkaSweetSpotBonus = Math.max(0, 100 - Math.abs(form.lipidPka - 6.35) * 55);
  const endosomalEscapeEfficiency = Math.round(
    (endosomalProtonationPct * 0.4 + pkaSweetSpotBonus * 0.35 + cellularUptakeScore * 0.25)
  );

  // 7. Organ Tropism (SORT)
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

  // Israelachvili Critical Packing Parameter (CPP) at pH 5.5
  const criticalPackingParam = Number((1.08 + (endosomalProtonationPct / 100) * 0.58).toFixed(2));

  // SAXS q_1 Bragg Repeat Spacing (nm)
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

### 6.9 `src/engines/nanotech/batchCalculator.ts`
```typescript
// src/engines/nanotech/batchCalculator.ts
import type { LnpFormulation, BatchMassCalculation } from '../types';

export function calculateBatchMasses(
  form: LnpFormulation,
  targetVolumeMl: number = 10,
  mrnaConcMgMl: number = 1.0
): BatchMassCalculation {
  const totalMrnaMassMg = Number((targetVolumeMl * mrnaConcMgMl).toFixed(2));
  const mmolesPhosphate = totalMrnaMassMg / 330;
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

### 6.10 `src/engines/service.ts`
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
    return this.localFallback.scanGuides(preset);
  }

  generateCloningOligos(spacer: string): CloningOligos {
    return this.localFallback.generateCloningOligos(spacer);
  }

  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
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
```

---

### 6.11 `src/engines/index.ts` & `src/engines/bioEngines.ts`
```typescript
// src/engines/index.ts
export * from './types';
export * from './presets';
export * from './service';
export * from './crispr/guideScanner';
export * from './crispr/oligoGenerator';
export * from './nanotech/lnpSimulator';
export * from './nanotech/batchCalculator';
export * from './immunology/hlaScanner';
```
```typescript
// src/engines/bioEngines.ts
export * from './index';
```

---

### 6.12 `src/main.tsx`
```tsx
// src/main.tsx
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

### 6.13 `src/index.css`
```css
/* src/index.css */
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

.font-display {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

.font-mono-seq {
  font-family: var(--font-mono);
  letter-spacing: -0.01em;
}
```

---

## 7. Developer Protocols & Operating Guidelines for Agent Argon

When extending or maintaining this web application, follow these scientific and engineering standards:

### 1. Build, Run & Test Commands
```bash
# Start Vite development server
npm run dev

# Run TypeScript compilation and production build
npm run build

# Run high-speed Oxlint check
npm run lint

# Preview built production bundle
npm run preview
```

### 2. Scientific & Mathematical Invariants
- **Lipid Stoichiometry Rule:** Total lipid molar percentage must strictly equal $100.0\%$. In `App.tsx`, Cholesterol is computed dynamically as `100 - (ionizable + dspc + peg)`. Never allow user inputs or sliders to violate this conservation constraint.
- **Reading Frame Rigor:** The genomic sequence in `GenePreset` is 0-indexed and aligned with the coding sequence (CDS) frame. Codon translation in `guideScanner.ts` uses `Math.floor(genomicIdx / 3) * 3` to evaluate frame-accurate amino acid substitutions.
- **Antisense Strand Strand-Swapping:** When evaluating deamination on the antisense ($-$) strand, an $A \to G$ editing event produces a $T \to C$ change on the sense strand, while a $C \to T$ editing event produces a $G \to A$ change on the sense strand.
- **Microfluidic Mass Balance:** In `batchCalculator.ts`, nucleotide MW is fixed at $330\text{ g/mol}$. The total mass of mRNA and lipids must reflect the $N/P$ charge ratio.

### 3. Hexagonal Engine Decoupling
- Keep all computational logic, chemical formulas, and CRISPR scanning algorithms inside `src/engines/`.
- `App.tsx` and UI components must consume algorithms via functions exported from `src/engines/bioEngines.ts`. Never inline biological scoring formulas inside UI component callbacks.

### 4. 3D Viewport Performance Budget
- For detailed 3D shader specifications, instancing architectures, and stencil cutaway mechanics, refer to `ARGON_LNP_3D_MODEL_SPEC.md`.
- Target 60–120 FPS on standard desktop GPUs.

---

## 8. Academic Citation & Intellectual Attribution

If generating derivative tools, reports, or research documentation from this platform, preserve the original author attribution:

```bibtex
@software{Ghosh_nanoCRISPER_3D_2026,
  author = {Ghosh, Arunabha},
  title = {{nanoCRISPER 3D with Integrated Immunoshield DRA: Interactive 3D Lipid Nanoparticle Biophysics & Codon-Aware CRISPR Base Editing Suite}},
  year = {2026},
  url = {https://github.com/0xArunabha/nanocrisper-3d-with-integrated-immunoshield-dra},
  note = {Department of Biotechnology, Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal, India}
}
```
Distributed under the **Apache License 2.0**.
