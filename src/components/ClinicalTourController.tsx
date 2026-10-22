// src/components/ClinicalTourController.tsx
/**
 * Clinical Walkthrough & Faculty Evaluation Tour Controller.
 * Guides evaluators, faculty (MAKAUT), and visiting scientists through
 * end-to-end therapeutic translation: from pathogenic locus targeting
 * (e.g., Sickle Cell HBB E6V -> HbG-Makassar, or NTLA-2001 TTR Amyloidosis)
 * to thermodynamic validation, LNP biophysics, HLA de-immunization, and CMC batch dosing.
 *
 * Author: Arunabha Ghosh (MAKAUT)
 * License: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  X,
  Sparkles,
  ArrowRight,
  Minimize2,
  Maximize2,
  Dna,
  FlaskConical,
  Shield,
  FileText,
  Activity,
  Award,
} from 'lucide-react';
import type { DashboardTab, LnpFormulation } from '../engines/types';
import type { InstitutionalProfile } from '../engines/institutionProfile';

export type CaseStudyId = 'HBB' | 'TTR';

export interface TourStep {
  stepNumber: number;
  tab: DashboardTab;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  narrative: string;
  actionLabel?: string;
  takeAction?: () => void;
  metrics: { label: string; value: string }[];
}

interface ClinicalTourControllerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: CaseStudyId;
  onSelectCase: (caseId: CaseStudyId) => void;
  currentTab: DashboardTab;
  onNavigateTab: (tab: DashboardTab) => void;
  onApplyPreset: (presetId: string) => void;
  onSelectGuideIndex: (idx: number) => void;
  onApplyFormulation: (form: LnpFormulation) => void;
  onToggleHlaAllele: (allele: string) => void;
  onToggleStealthMutation: (peptide: string) => void;
  onSetBatchParameters: (volMl: number, concMgMl: number) => void;
  onOpenDossier: () => void;
  profile?: InstitutionalProfile;
}

export const ClinicalTourController: React.FC<ClinicalTourControllerProps> = ({
  isOpen,
  onClose,
  activeCase,
  onSelectCase,
  onNavigateTab,
  onApplyPreset,
  onSelectGuideIndex,
  onApplyFormulation,
  onToggleHlaAllele,
  onToggleStealthMutation,
  onSetBatchParameters,
  onOpenDossier,
  profile,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(14);

  // Define steps for Case 1: Sickle Cell Disease (HBB E6V -> HbG-Makassar)
  const hbbSteps: TourStep[] = [
    {
      stepNumber: 1,
      tab: 'overview',
      category: '1. Genomic Indication',
      icon: Dna,
      title: 'Target Locus & Therapeutic Strategy',
      headline: 'Curing Sickle Cell Disease via HBB E6V → HbG-Makassar',
      narrative:
        'Sickle Cell Disease (SCD) is caused by a canonical A→T transversion in codon 6 of HBB (GAG to GTG, Glu6Val), causing hemoglobin tetramers to polymerize into rigid sickled rods. Rather than creating hazardous double-strand DNA breaks via Cas9 nuclease, NanoCRISPR-3D executes a precision Adenine Base Editing (ABE8e) strategy that converts pathogenic Valine (GTG) into Alanine (GCG) — producing the naturally occurring, benign HbG-Makassar hemoglobin variant.',
      actionLabel: 'Load HBB Locus & Strategy',
      takeAction: () => {
        onApplyPreset('HBB');
        onNavigateTab('overview');
      },
      metrics: [
        { label: 'Target Gene', value: 'HBB (Exon 1)' },
        { label: 'Pathology', value: 'HbS (Glu6Val)' },
        { label: 'Correction', value: 'HbG-Makassar (Ala6)' },
        { label: 'DSB Risk', value: 'Zero (Base Editor)' },
      ],
    },
    {
      stepNumber: 2,
      tab: 'crispr',
      category: '2. Protospacer Discovery',
      icon: Dna,
      title: 'Dual-Strand Guide Scanning & Codon Audit',
      headline: 'Selecting Lead sgRNA & Auditing Catalytic Bystanders',
      narrative:
        'The scanner evaluates 20-nt protospacers across both sense and antisense strands with preferred 3\'-NGG PAMs. For each candidate, the deaminase catalytic window (positions 4–8) is audited codon-by-codon to ensure bystander edits produce either synonymous (silent) changes or safe variants, while strictly penalizing premature nonsense stop codons. South Asian genomic polymorphism rs10768683 is mapped to prevent patient-specific guide failure.',
      actionLabel: 'Select Lead Guide sgRNA-f1',
      takeAction: () => {
        onApplyPreset('HBB');
        onNavigateTab('crispr');
        onSelectGuideIndex(0);
      },
      metrics: [
        { label: 'Lead Guide', value: 'sgRNA-f1' },
        { label: 'Activity Window', value: 'Pos 4–8' },
        { label: 'Bystander Audit', value: 'Silent Synonymous' },
        { label: 'SAS SNP rs10768683', value: 'Clear (No Collision)' },
      ],
    },
    {
      stepNumber: 3,
      tab: 'crispr',
      category: '3. Python Biophysics Engine',
      icon: Activity,
      title: 'Sugimoto & Turner 2004 Thermodynamic Validation',
      headline: 'RNA:DNA Heteroduplex Stability & Turner MFE Hairpins',
      narrative:
        'The Python FastAPI backend computes Sugimoto (1995) nearest-neighbor thermodynamics, yielding a stable RNA:DNA hybrid free energy (dG37 = -32.5 kcal/mol, Tm = 84.2°C). Next, the Turner (2004) dynamic programming algorithm folds the 20-nt spacer to calculate minimum free energy (MFE) secondary structures. If spacer RNA forms a severe hairpin (dG < -3.5 kcal/mol), the R-loop is locked and Cas9 loading is blocked. Here, net R-loop energy is negative (-8.12 kcal/mol), proving spontaneous invasion.',
      actionLabel: 'Inspect Thermodynamic Profile',
      takeAction: () => {
        onNavigateTab('crispr');
      },
      metrics: [
        { label: 'Sugimoto dG°37', value: '-32.5 kcal/mol' },
        { label: 'Melting Tm', value: '84.2 °C' },
        { label: 'Net R-Loop dG', value: '-8.12 kcal/mol (Favored)' },
        { label: 'Spacer Hairpin MFE', value: 'Unstructured (Low Risk)' },
      ],
    },
    {
      stepNumber: 4,
      tab: 'lnp',
      category: '4. Nanotechnology Biophysics',
      icon: FlaskConical,
      title: 'Clinical LNP Formulation & 3D Structure',
      headline: 'Israelachvili CPP & Endosomal Hexagonal H_II Transition',
      narrative:
        'To deliver base-editor mRNA to bone marrow hematopoietic stem and progenitor cells (HSPCs), we formulate a 4-component lipid nanoparticle: Ionizable lipid (50 mol%), DSPC (10 mol%), Cholesterol (38.5 mol%), and PEG2000-DMG (1.5 mol%). In physiological blood (pH 7.4), the LNP carries an 8% neutral charge for long circulation. Upon endosomal acidification to pH 5.5, the ionizable amine reaches 99.3% protonation, triggering the Israelachvili Critical Packing Parameter (CPP >= 1.45) transition into the inverted hexagonal (H_II) phase for endosomal membrane fusion.',
      actionLabel: 'Load Clinical LNP Stoichiometry',
      takeAction: () => {
        onNavigateTab('lnp');
        onApplyFormulation({
          ionizableLipid: 50.0,
          dspcHelper: 10.0,
          cholesterol: 38.5,
          pegLipid: 1.5,
          lipidPka: 6.35,
          npRatio: 6.0,
        });
      },
      metrics: [
        { label: 'Diameter Dh', value: '78 nm' },
        { label: 'PDI', value: '0.08 (Monodisperse)' },
        { label: 'Endosome pH 5.5 Prot', value: '99.3%' },
        { label: 'Israelachvili CPP', value: '1.48 (H_II Fusion)' },
      ],
    },
    {
      stepNumber: 5,
      tab: 'immunology',
      category: '5. ImmunoShield HLA Engineering',
      icon: Shield,
      title: 'South Asian HLA Class I De-Immunization',
      headline: 'Shielding Immunogenic Cas9 Epitopes from T-Cell Attack',
      narrative:
        'SpCas9 is derived from Streptococcus pyogenes; over 80% of human adults possess pre-existing neutralizing antibodies and cytotoxic CD8+ T-cells against Cas9 epitopes. ImmunoShield-DRA profiles the patient against high-frequency South Asian HLA alleles (HLA-A*02:11, HLA-A*24:02, HLA-B*40:06). In silico stealth mutations (such as L514A and Y823A) eliminate immunogenic anchor residues, reducing the clinical immunogenicity risk score from 78/100 to <10/100 while keeping catalytic residues (D10, H840) completely intact.',
      actionLabel: 'Apply South Asian Stealth Panel',
      takeAction: () => {
        onNavigateTab('immunology');
        onToggleHlaAllele('HLA-A*02:11');
        onToggleHlaAllele('HLA-A*24:02');
        onToggleStealthMutation('L514A (REC3 anchor disruption)');
        onToggleStealthMutation('Y823A (HNH surface loop stealth)');
      },
      metrics: [
        { label: 'Target Alleles', value: 'HLA-A*02:11, A*24:02' },
        { label: 'Baseline Risk', value: '78 / 100' },
        { label: 'Stealth Engineered Risk', value: '<10 / 100' },
        { label: 'Catalytic Triad', value: 'D10 / H840 Intact' },
      ],
    },
    {
      stepNumber: 6,
      tab: 'batch',
      category: '6. CMC & Regulatory Dossier',
      icon: FileText,
      title: 'Wet-Lab Batch Scaling & Pre-IND Dossier',
      headline: 'Synthesizing Golden Gate Oligos & Generating Pre-IND PDF',
      narrative:
        'To prepare for clinical administration, the CMC batch calculator scales microfluidic synthesis: a 10 mL batch at 1.0 mg/mL mRNA provides 10.0 mg mRNA and 226.5 mg total lipids (15.0:1 lipid:mRNA ratio) for patient dosing. Commercial IDT and GenScript CSV order sheets with BsmBI Golden Gate overhangs are ready for 1-click export. Finally, the Pre-IND Regulatory Dossier compiles all locus specs, biophysical thermodynamics, and nonclinical toxicology into a print/PDF specification report.',
      actionLabel: 'Open Pre-IND Regulatory Dossier',
      takeAction: () => {
        onNavigateTab('batch');
        onSetBatchParameters(10.0, 1.0);
        onOpenDossier();
      },
      metrics: [
        { label: 'Batch Volume', value: '10.0 mL' },
        { label: 'Total mRNA', value: '10.0 mg' },
        { label: 'Total Lipids', value: '226.5 mg' },
        { label: 'Synthesis Sheets', value: 'IDT / GenScript CSV Ready' },
      ],
    },
  ];

  // Define steps for Case 2: In Vivo ATTR Amyloidosis (TTR / NTLA-2001 Benchmark)
  const ttrSteps: TourStep[] = [
    {
      stepNumber: 1,
      tab: 'overview',
      category: '1. Genomic Indication',
      icon: Dna,
      title: 'Target Locus & Clinical Rationale',
      headline: 'Silencing Transthyretin Amyloidosis (NTLA-2001 Benchmark)',
      narrative:
        'Hereditary Transthyretin Amyloidosis (ATTR) is caused by misfolded TTR proteins accumulating in the heart and peripheral nerves. Intellia Therapeutics demonstrated clinical proof-of-concept with NTLA-2001, using in vivo LNP-delivered Cas9 to knock out TTR in the liver with a single systemic infusion. NanoCRISPR-3D models this benchmark, configuring Cytidine Base Editing (BE4max) to introduce a precise splice disruption or premature stop codon in TTR Exon 2 without chromosomal translocations.',
      actionLabel: 'Load TTR NTLA-2001 Benchmark',
      takeAction: () => {
        onApplyPreset('TTR');
        onNavigateTab('overview');
      },
      metrics: [
        { label: 'Target Gene', value: 'TTR (Exon 2)' },
        { label: 'Indication', value: 'ATTR Amyloidosis' },
        { label: 'Benchmark', value: 'Intellia NTLA-2001' },
        { label: 'Delivery Mode', value: 'Systemic IV Infusion' },
      ],
    },
    {
      stepNumber: 2,
      tab: 'crispr',
      category: '2. Protospacer Discovery',
      icon: Dna,
      title: 'BE4max Guide Selection & SNP Clearance',
      headline: 'Screening C→T Base Editor Protospacers in TTR',
      narrative:
        'The workbench scans TTR coding sequences for high-affinity BE4max protospacers with SpCas9 NGG recognition. The algorithm audits positions 4–8 for target cytosine deamination while screening against regional South Asian TTR polymorphisms (rs76992529) to guarantee population-wide target engagement.',
      actionLabel: 'View TTR Lead Protospacer',
      takeAction: () => {
        onApplyPreset('TTR');
        onNavigateTab('crispr');
        onSelectGuideIndex(0);
      },
      metrics: [
        { label: 'Editor', value: 'BE4max (C→T)' },
        { label: 'Catalytic Window', value: 'Positions 4–8' },
        { label: 'On-Target Score', value: '>85 / 100' },
        { label: 'SAS SNP rs76992529', value: 'Clear' },
      ],
    },
    {
      stepNumber: 3,
      tab: 'crispr',
      category: '3. Python Biophysics Engine',
      icon: Activity,
      title: 'Thermodynamic Validation & Off-Target Protection',
      headline: 'Sugimoto Heteroduplex Energy & Seed Asymmetry',
      narrative:
        'The thermodynamic engine validates that the PAM-proximal seed region (positions 11–20) exhibits optimal nucleating stability (-14.2 kcal/mol) without excessive tight binding that could stall base editing turnover. The Net R-loop driving energy remains spontaneous, and Turner dynamic programming confirms that the spacer RNA is unstructured and ready for Cas9 loading.',
      actionLabel: 'Check Thermodynamics',
      takeAction: () => {
        onNavigateTab('crispr');
      },
      metrics: [
        { label: 'Sugimoto Hybrid dG', value: '-31.2 kcal/mol' },
        { label: 'Seed Stability', value: '-14.2 kcal/mol (Optimal)' },
        { label: 'Net R-Loop dG', value: '-6.40 kcal/mol' },
        { label: 'Hairpin Severity', value: 'Negligible' },
      ],
    },
    {
      stepNumber: 4,
      tab: 'lnp',
      category: '4. Nanotechnology Biophysics',
      icon: FlaskConical,
      title: 'NTLA-2001 Hepatic LNP Formulation',
      headline: 'Optimizing ApoE-Mediated Liver Tropism (78% Hepatic Uptake)',
      narrative:
        'NTLA-2001 utilizes a clinically validated lipid stoichiometry (50% ionizable lipid, 10% DSPC, 38.5% cholesterol, 1.5% PEG-DMG). In the bloodstream, the PEG-lipid slowly desorbs, allowing endogenous Apolipoprotein E (ApoE) to bind to the particle surface. Hepatocyte LDL receptors recognize ApoE, driving >75% biodistribution specifically to liver tissue while sparing cardiac and lung exposure.',
      actionLabel: 'Apply NTLA-2001 Formulation',
      takeAction: () => {
        onNavigateTab('lnp');
        onApplyFormulation({
          ionizableLipid: 50.0,
          dspcHelper: 10.0,
          cholesterol: 38.5,
          pegLipid: 1.5,
          lipidPka: 6.35,
          npRatio: 6.0,
        });
      },
      metrics: [
        { label: 'Liver Tropism', value: '78% (Target)' },
        { label: 'Hydrodynamic Size', value: '72 nm' },
        { label: 'ApoE Mechanism', value: 'LDL Receptor Mediated' },
        { label: 'Stability Status', value: 'Optimal Clinical LNP' },
      ],
    },
    {
      stepNumber: 5,
      tab: 'immunology',
      category: '5. ImmunoShield HLA Engineering',
      icon: Shield,
      title: 'Immune Evasion in Hepatic Antigen Presentation',
      headline: 'Preventing Anti-Cas9 Hepatotoxicity & CD8+ T-Cell Lysis',
      narrative:
        'In vivo hepatic delivery exposes Cas9 peptides to liver sinusoidal endothelial cells and Kupffer cells, which present immunogenic peptides on HLA Class I. ImmunoShield-DRA de-immunizes the Cas9 backbone for South Asian patients, preventing CD8+ T-cell-mediated transaminitis (ALT/AST spikes) and sustaining long-term gene editing.',
      actionLabel: 'Shield Hepatic Epitopes',
      takeAction: () => {
        onNavigateTab('immunology');
        onToggleHlaAllele('HLA-A*24:02');
        onToggleStealthMutation('L514A (REC3 anchor disruption)');
      },
      metrics: [
        { label: 'Hepatic Presentation', value: 'Shielded' },
        { label: 'Hepatotoxicity Risk', value: 'Low (Safe)' },
        { label: 'Cas9 Active Sites', value: 'D10 / H840 Intact' },
        { label: 'Residual Risk', value: '<15 / 100' },
      ],
    },
    {
      stepNumber: 6,
      tab: 'batch',
      category: '6. CMC & Regulatory Dossier',
      icon: FileText,
      title: 'Clinical Infusion Dosing & Pre-IND Dossier',
      headline: 'Calculating Clinical NTLA-2001 Infusion Doses',
      narrative:
        'In the landmark Phase 1 trial, NTLA-2001 demonstrated robust serum TTR reductions at 0.1 mg/kg and 0.3 mg/kg. The CMC calculator configures a 20 mL clinical preparation for an adult patient, calculating exact component weights in milligrams for GMP compounding. The Pre-IND dossier exports ready-to-file regulatory documentation.',
      actionLabel: 'Generate Pre-IND Regulatory Dossier',
      takeAction: () => {
        onNavigateTab('batch');
        onSetBatchParameters(20.0, 1.0);
        onOpenDossier();
      },
      metrics: [
        { label: 'Target Dose', value: '0.3 mg/kg (20 mg total)' },
        { label: 'Total Lipid Mass', value: '453.0 mg' },
        { label: 'Serum TTR Reduction', value: '>85% Expected' },
        { label: 'Regulatory File', value: 'Pre-IND PDF Ready' },
      ],
    },
  ];

  const currentSteps = activeCase === 'HBB' ? hbbSteps : ttrSteps;
  const step = currentSteps[currentStepIdx] || currentSteps[0];

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && isOpen) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleNext();
            return 14;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, isOpen, currentStepIdx, currentSteps.length]);

  // Execute step action on step change
  const executeStep = (idx: number) => {
    setCurrentStepIdx(idx);
    setCountdown(14);
    const target = currentSteps[idx];
    if (target) {
      onNavigateTab(target.tab);
      if (target.takeAction) {
        target.takeAction();
      }
    }
  };

  const handleNext = () => {
    if (currentStepIdx < currentSteps.length - 1) {
      executeStep(currentStepIdx + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      executeStep(currentStepIdx - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Clinical Walkthrough Tour Controller"
      className={`no-print fixed z-40 transition-all duration-300 ${
        isMinimized
          ? 'bottom-4 right-4 w-72'
          : 'bottom-4 right-4 sm:right-6 w-[94vw] sm:w-[480px] max-w-[500px]'
      }`}
    >
      <div className="bg-[#181613] border-2 border-[#cfa052]/80 rounded-[5px] shadow-2xl overflow-hidden flex flex-col backdrop-blur-md">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#12110f] border-b border-[#2e2923]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#cfa052]/15 text-[#cfa052]">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[11px] font-bold text-[#e8dfd1] flex items-center gap-1">
                {profile?.shortCode ? `${profile.shortCode} Clinical Case Tour` : 'Clinical Case Tour'}
                <Award className="w-3 h-3 text-[#cfa052]" />
              </span>
              <span className="text-[9px] text-[#70675c] font-mono-seq">
                Step {step.stepNumber} of {currentSteps.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Case Study Switcher */}
            <select
              value={activeCase}
              onChange={(e) => {
                const newCase = e.target.value as CaseStudyId;
                onSelectCase(newCase);
                setCurrentStepIdx(0);
                if (newCase === 'HBB') {
                  onApplyPreset('HBB');
                } else {
                  onApplyPreset('TTR');
                }
              }}
              className="bg-[#211e1a] border border-[#332e27] text-[#cfa052] text-[10px] font-mono-seq rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-[#cfa052]"
              title="Switch therapeutic clinical case study"
            >
              <option value="HBB">Case 1: Sickle Cell (HBB)</option>
              <option value="TTR">Case 2: ATTR Amyloid (TTR)</option>
            </select>

            {/* Auto Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1 rounded text-[10px] flex items-center gap-0.5 border cursor-pointer transition ${
                isPlaying
                  ? 'bg-[#cfa052]/20 border-[#cfa052] text-[#cfa052]'
                  : 'bg-[#211e1a] border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1]'
              }`}
              title={isPlaying ? `Auto-advance active (${countdown}s)` : 'Start auto-guided tour'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-[#cfa052]" />
                  <span className="font-mono-seq text-[9px]">{countdown}s</span>
                </>
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>

            {/* Minimize / Maximize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-[#a69b8d] hover:text-[#e8dfd1] hover:bg-[#211e1a] transition cursor-pointer"
              title={isMinimized ? 'Expand tour window' : 'Minimize tour'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 rounded text-[#a69b8d] hover:text-[#e8dfd1] hover:bg-[#211e1a] transition cursor-pointer"
              title="Exit clinical walkthrough"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Progress Segmented Indicator */}
        <div className="grid grid-cols-6 gap-1 px-3 pt-2 pb-1 bg-[#151310] border-b border-[#24201b]">
          {currentSteps.map((s, idx) => {
            const isActive = idx === currentStepIdx;
            const isCompleted = idx < currentStepIdx;
            return (
              <button
                key={idx}
                onClick={() => executeStep(idx)}
                className={`h-1.5 rounded-[2px] transition cursor-pointer ${
                  isActive
                    ? 'bg-[#cfa052] shadow-sm'
                    : isCompleted
                    ? 'bg-[#5e946c]'
                    : 'bg-[#24201b] hover:bg-[#332e27]'
                }`}
                title={`Jump to Step ${s.stepNumber}: ${s.title}`}
              />
            );
          })}
        </div>

        {/* Minimized Quick Preview */}
        {isMinimized ? (
          <div className="p-2.5 flex items-center justify-between text-xs bg-[#181613]">
            <span className="font-semibold text-[#e8dfd1] truncate pr-2">
              {step.stepNumber}. {step.title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePrev}
                disabled={currentStepIdx === 0}
                className="p-1 rounded bg-[#211e1a] border border-[#332e27] disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentStepIdx === currentSteps.length - 1}
                className="p-1 rounded bg-[#cfa052] text-[#12110f] font-bold disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          /* Full Step Card Body */
          <div className="p-3.5 flex flex-col gap-3 bg-[#181613] max-h-[70vh] overflow-y-auto">
            {/* Step Headline & Category */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono-seq text-[#a69b8d] uppercase tracking-wider mb-0.5">
                <span className="text-[#cfa052] font-semibold">{step.category}</span>
                <span className="text-[#70675c]">Module {step.stepNumber} of 6</span>
              </div>
              <h2 className="font-display text-sm font-bold text-[#e8dfd1] tracking-tight">
                {step.headline}
              </h2>
            </div>

            {/* Scientific Narrative */}
            <p className="text-[11px] text-[#a69b8d] leading-relaxed bg-[#12110f] p-2.5 rounded-[3px] border border-[#24201b]">
              {step.narrative}
            </p>

            {/* Key Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-1.5 font-mono-seq text-[10px]">
              {step.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-1.5 rounded-[2px] bg-[#141210] border border-[#26221c] flex flex-col gap-0.5"
                >
                  <span className="text-[9px] text-[#70675c] uppercase">{m.label}</span>
                  <span className="font-semibold text-[#e8dfd1] text-[10px]">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Action Trigger inside Step */}
            {step.actionLabel && step.takeAction && (
              <button
                onClick={() => step.takeAction && step.takeAction()}
                className="w-full py-1.5 px-3 text-xs font-semibold rounded-[3px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#cfa052]/50 hover:border-[#cfa052] text-[#e8dfd1] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#cfa052]" />
                <span>{step.actionLabel}</span>
              </button>
            )}

            {/* Footer Navigation Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-[#24201b] text-xs">
              <button
                onClick={handlePrev}
                disabled={currentStepIdx === 0}
                className="px-2.5 py-1 rounded-[3px] bg-[#211e1a] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-[10px] font-mono-seq text-[#70675c]">
                {currentStepIdx + 1} / {currentSteps.length}
              </span>

              {currentStepIdx < currentSteps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-3 py-1 rounded-[3px] bg-[#cfa052] hover:bg-[#dfb163] text-[#12110f] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-3 py-1 rounded-[3px] bg-[#5e946c] hover:bg-[#73a880] text-[#12110f] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>Complete Tour</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
