# nanoCRISPER 3D with Integrated Immunoshield DRA

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React 19](https://img.shields.io/badge/React-19.x-61dafb.svg?logo=react&logoColor=white)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black.svg?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Institution: MAKAUT](https://img.shields.io/badge/Institution-MAKAUT_WB-orange.svg)](https://makautwb.ac.in/)

> **Interactive 3D Lipid Nanoparticle (LNP) Biophysics Engine & Codon-Aware CRISPR Base Editing Suite**  
> Developed by **Arunabha Ghosh** as part of the **BSc Biotechnology** curriculum at **Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal**.

---

## 🔬 Scientific Overview

**nanoCRISPER 3D** is a specialized computational nanomedicine and molecular modeling environment designed to simulate, visualize, and optimize multicomponent **mRNA/sgRNA base editor Lipid Nanoparticles (LNPs)** ($D_h \approx 60\text{–}140\text{ nm}$).

The platform bridges **nanoscale physical chemistry** (critical packing parameters, de Gennes polymer scaling, Henderson-Hasselbalch ionization) with **precision genomic editing** (dual-strand PAM scanning, deaminase activity windows, bystander missense prediction, and South Asian population-specific SNP compatibility).

---

## 🧬 Key Modules & Capabilities

### 1. Interactive 3D LNP Cutaway Engine (`React Three Fiber` + `Three.js`)
- **Outer Monolayer Shell**: Procedurally populated via a **Fibonacci sphere lattice**, modeling:
  - Ionizable tertiary amine lipid heads (SM-102 proxy)
  - Helper structural phospholipids (DSPC)
  - Membrane-rigidifying Cholesterol
  - Stealth DMG-PEG2000 anchors
- **Acyl Tail Inward Vector Field**: Bilayer-inspired inward acyl tails oriented along surface normal vectors.
- **Dynamic PEG Corona**: Simulates polymer kinematics transitioning between the **Mushroom regime** ($<2.5\text{ mol\%}$) and **Dense Brush regime** ($\ge 2.5\text{ mol\%}$).
- **Apolipoprotein E (ApoE) Opsonin Dynamics**: Kinematically models endogenous liver-targeting ApoE protein complex adsorption dictated by the biophysical **"PEG Dilemma"**.
- **Condensed Ribonucleic Core**: 
  - Semi-translucent core cavity envelope
  - Cas9/ABE8e base editor mRNA coiled ribbon ($\sim 4.5\text{ kb}$)
  - sgRNA hairpin loops and inverted-micellar lipid nanoclusters
- **Multi-Mode Cutaways**: 90° clinical wedge, 180° sagittal cross-section, full surface, and core-isolated views.
- **Calibrated HUD**: Live Cryo-TEM scale bar ($20\text{ nm}$ calibrated) with real-time DLS hydrodynamic diameter ($D_h$), PDI, and Zeta potential readouts.

---

### 2. Nanotechnology & CMC Formulation Engine
- **Henderson-Hasselbalch Ionization Kinetics**:
  $$\text{Protonation } (\%) = \frac{100}{1 + 10^{\text{pH} - \text{pK}_a}}$$
  Evaluates physiological circulation ($\text{pH } 7.4$) versus early/late endosomal acidification ($\text{pH } 5.5$).
- **Israelachvili Critical Packing Parameter ($CPP$)**:
  $$CPP = \frac{V_t}{a_0 \cdot l_c}$$
  Tracks membrane transitions from lamellar bilayer ($CPP \approx 1$) to inverted hexagonal phase ($H_{II}$, $CPP > 1.45$) responsible for endosomal membrane fusion.
- **De Gennes Polymer Scaling & The PEG Dilemma**:
  Calculates the ratio of the Flory radius ($R_F$) to grafting distance ($D$) to evaluate the trade-off between systemic circulation stealth and receptor-mediated cellular uptake.
- **SAXS Bragg Repeat Spacing**:
  Computes core RNA-lipid packaging periodicity ($d \approx 5.8\text{–}6.4\text{ nm}$).

---

### 3. Codon-Aware CRISPR & Base Editor Engine
- **Dual-Strand Guide Scanning**: Scans sense ($+$) and antisense ($-$) strands for canonical (`NGG`) and relaxed (`NAG`) PAM motifs.
- **Deaminase Editing Window**: Evaluates positions 4 through 8 ($5' \to 3'$) for:
  - **Adenine Base Editors (ABE8e)**: $A \to G$ conversion
  - **Cytosine Base Editors (BE4max)**: $C \to T$ conversion
- **Bystander Mutation Classifier**: Full open-reading-frame translation across the standard genetic code to classify bystander edits into:
  - Target Edit
  - Synonymous / Silent
  - Pathogenic Missense Risk
  - Premature Nonsense Stop
- **South Asian (SAS) Genetic Variant Awareness**:
  Cross-references targets against South Asian genomic polymorphisms (IndiGen / 1000 Genomes SAS):
  - **HBB (Exon 1)**: $\beta$-Thalassemia / Sickle Cell Disease (HbS $E6V$ $\to$ benign HbG-Makassar conversion; rs10768683 check)
  - **PCSK9 (Exon 1)**: Familial Hypercholesterolemia (VERVE-101 clinical benchmark; rs505151 check)
  - **TTR (Exon 2)**: Hereditary ATTR Amyloidosis (NTLA-2001 clinical benchmark; rs76992529 check)
- **Automated Golden Gate Cloning Oligos**: Generates forward and reverse primers with `BsmBI` / `Esp3I` directional overhangs.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **3D Rendering** | [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) + [@react-three/drei](https://github.com/pmndrs/drei) |
| **Language & Types** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) |
| **Linting & Tooling** | [Oxlint](https://oxc.rs/) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/0xArunabha/nanocrisper-3d-with-integrated-immunoshield-dra.git
   cd nanocrisper-3d-with-integrated-immunoshield-dra
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📜 Academic Integrity & Attribution

```text
Project: nanoCRISPER 3D with integrated immunoshield DRA
Author: Arunabha Ghosh
Program: BSc Biotechnology (1st Year)
Institution: Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal, India
```

*This software and research framework was designed and developed by **Arunabha Ghosh**. Any use, derivative study, or academic evaluation must appropriately cite this repository and preserve the original author attribution according to university academic integrity regulations.*

## 📌 Citation

If you use or reference this work in your research, academic presentation, or project, please cite it using:

```bibtex
@software{Ghosh_nanoCRISPER_3D_2026,
  author = {Ghosh, Arunabha},
  title = {{nanoCRISPER 3D with Integrated Immunoshield DRA: Interactive 3D Lipid Nanoparticle Biophysics & Codon-Aware CRISPR Base Editing Suite}},
  year = {2026},
  url = {https://github.com/0xArunabha/nanocrisper-3d-with-integrated-immunoshield-dra},
  note = {Department of Biotechnology, Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal}
}
```
*(You can also click the **"Cite this repository"** button in the right sidebar of the GitHub repository to export in APA or BibTeX format).*

---

## 📄 License

Distributed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for complete terms, conditions, and patent grants.

