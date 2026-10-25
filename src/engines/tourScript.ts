// src/engines/tourScript.ts
//
// The words of the clinical tour. Every number in a narrative or a metric is read from TourFacts
// (engine output) or from the case settings; nothing is typed in. Published results that are quoted as
// such (the NTLA-2001 phase 1 reductions, the Cas9 pre-existing immunity paper) are named as published,
// next to what they are, and are never presented as a prediction of this model.

import { BASE_EDITOR_DEFINITIONS, type DashboardTab, type ThermodynamicProfile } from './types';
import { isPreferredPam } from './crispr/guideScanner';
import { CAS9_EPITOPE_HOTSPOTS, SOUTH_ASIAN_HLA_ALLELES } from './immunology/hlaScanner';
import type { TourCaseId, TourFacts } from './tourFacts';

/** What the "do it" button of a step does. The controller turns each kind into app state changes. */
export type TourActionKind =
  | 'load-target' // preset + editor + PAM, no guide chosen
  | 'select-guide' // as above, then the lead guide
  | 'show' // only go to the tab
  | 'load-formulation'
  | 'load-hla-panel'
  | 'open-dossier';

export interface TourStepScript {
  stepNumber: number;
  tab: DashboardTab;
  category: string;
  title: string;
  headline: string;
  narrative: string;
  actionKind: TourActionKind;
  /** Undefined when the step has nothing to do (for example, no lead guide exists) */
  actionLabel?: string;
  metrics: { label: string; value: string }[];
}

const f1 = (n: number): string => n.toFixed(1);
const f2 = (n: number): string => n.toFixed(2);

function editorShort(editor: string): string {
  return editor.split(' (')[0];
}

function guideSentence(facts: TourFacts): string {
  const { lead, total, onTarget } = facts.guides;
  const [w0, w1] = facts.editingWindow;
  const head = `The scanner evaluated ${total} candidate guides on both strands with ${editorShort(
    facts.preset.editorType
  )} and ${facts.preset.pamVariant ?? 'SpCas9'}. ${onTarget} of them put the target base inside the editing window (spacer positions ${w0}–${w1}).`;
  if (!lead) {
    return `${head} No candidate covers the target base with these settings, so there is no lead guide. The editor and PAM controls in the Base Editor tab show which combinations do.`;
  }
  const preferred = isPreferredPam(lead.pam, facts.preset.pamVariant ?? 'SpCas9');
  const b = facts.leadBystanders;
  const bystanders =
    lead.bystanders.length === 0
      ? 'no other editable bases in its window'
      : `${b.silent} silent, ${b.missense} missense and ${b.nonsense} nonsense change${
          b.silent + b.missense + b.nonsense === 1 ? '' : 's'
        } among its other editable bases`;
  return `${head} The lead guide is ${lead.id} (${lead.strand} strand, PAM ${lead.pam}, ${
    preferred ? 'a preferred PAM' : 'a relaxed, non-preferred PAM'
  }): composite score ${lead.CompositeScore}/100, verdict "${lead.verdict}", with ${bystanders}. The ${
    facts.preset.sasSnpId
  } position ${
    lead.hasSasSnpCollision ? 'overlaps this guide' : 'does not overlap this guide'
  } (the SNP position and frequency are curated demo inputs for this preset, not a lookup).`;
}

function thermoSentence(facts: TourFacts, backend: ThermodynamicProfile | null): string {
  const t = backend ?? facts.thermo;
  if (!t) {
    return 'There is no lead guide to evaluate with these settings, so no energies are shown.';
  }
  const netNote =
    t.rLoopNetDg < 0
      ? 'negative, so the two duplex terms alone favor invasion'
      : 'positive, so the Cas9 protein has to supply the rest';
  const folding =
    backend && backend.source === 'backend'
      ? `The Python backend's simplified fold of the spacer gives ${f2(backend.hairpinDg)} kcal/mol (${backend.hairpinRisk}) and its homodimer check reports "${backend.selfDimerRisk}".`
      : 'The hairpin fold and the homodimer check run only in the Python backend, which did not answer, so they are not shown.';
  return `Nearest-neighbor energies for the lead spacer ${t.spacer}: the RNA:DNA hybrid is ${f2(
    t.rnaDnaDg37
  )} kcal/mol at 37 °C with a melting temperature of ${f1(t.rnaDnaTm)} °C (Sugimoto 1995 parameters, 150 mM Na⁺, 250 nM strand). The same 20 bases as a DNA:DNA duplex give ${f2(
    t.dnaDnaDg37
  )} kcal/mol (SantaLucia 1998), so the net difference is ${f2(t.rLoopNetDg)} kcal/mol: ${netNote}. This compares two duplexes only; PAM opening and Cas9 binding are not modelled. ${folding}`;
}

function lnpSentence(facts: TourFacts): string {
  const { biophysics: b, endosome, blood } = facts.lnp;
  const f = facts.tourCase.formulation;
  return `The tour loads a four-component LNP: ionizable lipid ${f1(f.ionizableLipid)} mol%, DSPC ${f1(
    f.dspcHelper
  )}, cholesterol ${f1(f.cholesterol)}, PEG-lipid ${f1(f.pegLipid)}, apparent pKa ${f2(f.lipidPka)}, N/P ${f1(
    f.npRatio
  )}. The app's empirical surrogate formulas give a hydrodynamic diameter of ${b.diameterNm} nm and a PDI of ${f2(
    b.pdi
  )}. By Henderson–Hasselbalch the ionizable lipid is ${blood.liveIonizationPct}% protonated at blood pH 7.4 and ${
    endosome.liveIonizationPct
  }% at endosomal pH 5.5. The model's critical packing parameter rises from ${f2(blood.cpp)} to ${f2(
    endosome.cpp
  )}; at or above 1.45 it calls the phase inverted hexagonal (H_II), which here is ${
    endosome.cpp >= 1.45 ? 'reached' : 'not reached'
  } at pH 5.5. The CPP is a linear surrogate (1.08 + 0.58 × protonated fraction), not computed from molecular geometry.`;
}

function hlaSentence(facts: TourFacts): string {
  const h = facts.hla;
  if (h.relevant.length === 0) {
    return `None of the curated epitopes is restricted by ${h.alleles.join(', ')}, so nothing is scored for this panel.`;
  }
  return `Pre-existing immune responses to Cas9 have been reported in healthy adults (Charlesworth et al., Nature Medicine 2019). The curated panel lists ${CAS9_EPITOPE_HOTSPOTS.length} Cas9 epitope entries across ${SOUTH_ASIAN_HLA_ALLELES.length} South Asian HLA class I alleles. For ${h.alleles.join(
    ' and '
  )}, ${h.relevant.length} entr${h.relevant.length === 1 ? 'y applies' : 'ies apply'} (${h.relevant
    .map((e) => e.peptide)
    .join(', ')}). The demo risk score is ${h.baselineRisk}/100 with no substitutions and ${
    h.shieldedRisk
  }/100 with all of them switched on. That is arithmetic on curated inputs (each epitope's score is capped at 8 when its substitution is on), not a predicted immune response, and no substitution has been tested for folding or activity.`;
}

function batchSentence(caseId: TourCaseId, facts: TourFacts): string {
  const { batch } = facts;
  const base = `At ${f1(batch.targetVolumeMl)} mL and ${f1(batch.mrnaConcMgMl)} mg/mL the calculator gives ${f1(
    batch.totalMrnaMassMg
  )} mg of mRNA and ${f1(batch.totalLipidMassMg)} mg of total lipid (${f1(
    facts.lipidToMrnaRatio
  )}:1 lipid to mRNA by mass) at N/P ${f1(
    facts.tourCase.formulation.npRatio
  )}. The Batch tab has IDT and GenScript order sheets for the selected guide. The dossier assembles these model outputs into a Pre-IND-style document; it is a template, not a regulatory submission.`;
  if (caseId !== 'TTR') return base;
  const kg = batch.totalMrnaMassMg / 0.3;
  return `${base} For scale, ${f1(batch.totalMrnaMassMg)} mg would be 0.3 mg/kg for a ${Math.round(
    kg
  )} kg adult if the dose were counted as mRNA mass alone. In the first-in-human trial of NTLA-2001 (a Cas9 nuclease knockout of TTR, a different product; Gillmore et al., NEJM 2021) mean serum TTR fell by 52% at 0.1 mg/kg and 87% at 0.3 mg/kg after 28 days, in 6 patients. Those are published clinical results, not outputs of this model.`;
}

export function buildTourSteps(
  caseId: TourCaseId,
  facts: TourFacts,
  backendThermo: ThermodynamicProfile | null = null
): TourStepScript[] {
  const { preset, guides, hla, batch } = facts;
  const lead = guides.lead;
  const t = backendThermo ?? facts.thermo;
  const fromBackend = backendThermo?.source === 'backend';
  const isHbb = caseId === 'HBB';
  const settingsChanged =
    preset.editorType !== facts.presetDefault.editor ||
    (preset.pamVariant ?? 'SpCas9') !== facts.presetDefault.pam;
  // Why the preset's own settings fail, when the sequence itself explains it
  const baseAtTarget = preset.sequence[preset.mutationIndex]?.toUpperCase() ?? '';
  const complement: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' };
  const defaultDef = BASE_EDITOR_DEFINITIONS[facts.presetDefault.editor];
  const defaultCanEditBase =
    baseAtTarget !== '' &&
    (defaultDef.targetBase === baseAtTarget || defaultDef.targetBase === complement[baseAtTarget]);
  const editorReason = defaultCanEditBase
    ? ''
    : ` The base at the target position is ${baseAtTarget} (${complement[baseAtTarget] ?? '?'} on the other strand), which ${editorShort(
        facts.presetDefault.editor
      )} (${defaultDef.targetBase}→${defaultDef.replacementBase}) cannot edit.`;
  const overrideNote =
    settingsChanged && facts.defaultOnTarget === 0
      ? ` With the preset's own settings (${editorShort(facts.presetDefault.editor)}, ${
          facts.presetDefault.pam
        }) no candidate guide puts the target base in the editing window.${editorReason} The tour uses ${editorShort(
          preset.editorType
        )} with ${preset.pamVariant ?? 'SpCas9'} instead${
          preset.pamVariant === 'SpRY'
            ? '. SpRY reads almost any PAM, which widens the choice of guides but is generally less specific than NGG'
            : ''
        }.`
      : '';

  // V30M is precursor residue 50 (nt 148-150 of the coding sequence). If the preset's sequence stops before
  // it, the target base is a demonstration position and the text must say so.
  const v30mNote =
    preset.sequence.length >= 150
      ? ' This preset encodes V30M (G>A), which an adenine base editor reverts, so the tour uses a base-editing analogue of that benchmark.'
      : ` The preset is labelled V30M, but its ${preset.sequence.length}-nt sequence covers only the first ${Math.floor(
          preset.sequence.length / 3
        )} codons, and the V30M site (precursor residue 50) lies outside it. The target base (position ${preset.mutationIndex + 1}) is a demonstration position${
          preset.mutationIndex < 60 ? ' inside the signal peptide' : ''
        }, so these guides show the workflow; they are not a design for V30M.`;

  const indication = isHbb
    ? `Sickle cell disease comes from the Glu6Val change in HBB (GAG to GTG). Instead of a double-strand break, an adenine base editor can turn the sickle valine codon (GTG) into alanine (GCG), the Hb G-Makassar variant, which has been reported as non-sickling (Newby et al., Nature 2021).${overrideNote}`
    : `Hereditary transthyretin amyloidosis is caused by misfolded TTR accumulating in the heart and nerves. NTLA-2001 (Intellia) is the clinical benchmark for LNP-delivered editing of TTR in the liver; it is a Cas9 nuclease knockout, a different strategy from base editing.${v30mNote}${overrideNote}`;

  const steps: TourStepScript[] = [
    {
      stepNumber: 1,
      tab: 'overview',
      category: '1. Genomic Indication',
      title: 'Target Locus & Strategy',
      headline: isHbb
        ? 'Sickle cell disease: HbS (Glu6Val) to Hb G-Makassar (Ala)'
        : 'ATTR amyloidosis: TTR V30M with an adenine base editor',
      narrative: indication,
      actionKind: 'load-target',
      actionLabel: `Load ${preset.id} target & settings`,
      metrics: [
        { label: 'Target gene', value: preset.symbol },
        { label: 'Editor', value: preset.editorType },
        { label: 'PAM variant', value: preset.pamVariant ?? 'SpCas9' },
        {
          label: 'Guides covering target',
          value: `${guides.onTarget} of ${guides.total}`,
        },
      ],
    },
    {
      stepNumber: 2,
      tab: 'crispr',
      category: '2. Protospacer Discovery',
      title: 'Guide Scanning & Codon Audit',
      headline: lead
        ? `Lead guide ${lead.id}: ${lead.verdict}`
        : 'No guide covers the target base with these settings',
      narrative: guideSentence(facts),
      actionKind: 'select-guide',
      actionLabel: lead ? `Select lead guide ${lead.id}` : undefined,
      metrics: [
        { label: 'Candidates scanned', value: `${guides.total}` },
        { label: 'Cover the target base', value: `${guides.onTarget}` },
        {
          label: 'Lead guide',
          value: lead ? `${lead.id} · ${lead.CompositeScore}/100` : 'none',
        },
        {
          label: `SNP ${preset.sasSnpId.split(' ')[0]}`,
          value: lead ? (lead.hasSasSnpCollision ? 'Overlaps the guide' : 'No overlap') : 'n/a',
        },
      ],
    },
    {
      stepNumber: 3,
      tab: 'crispr',
      category: '3. Thermodynamics',
      title: 'Nearest-Neighbor Energies',
      headline: 'RNA:DNA hybrid stability and a duplex-only R-loop estimate',
      narrative: thermoSentence(facts, backendThermo),
      actionKind: 'show',
      actionLabel: 'Go to the guide table',
      metrics: t
        ? [
            { label: 'Hybrid ΔG°37', value: `${f2(t.rnaDnaDg37)} kcal/mol` },
            { label: 'Melting Tm', value: `${f1(t.rnaDnaTm)} °C` },
            { label: 'DNA:DNA ΔG°37', value: `${f2(t.dnaDnaDg37)} kcal/mol` },
            { label: 'Net (hybrid − duplex)', value: `${f2(t.rLoopNetDg)} kcal/mol` },
            { label: 'Seed ΔG (11–20)', value: `${f2(t.seedDg)} kcal/mol` },
            {
              label: 'Hairpin / dimer',
              value: fromBackend
                ? `${backendThermo?.hairpinRisk}; ${backendThermo?.selfDimerRisk}`
                : 'needs Python backend',
            },
          ]
        : [{ label: 'Energies', value: 'no lead guide' }],
    },
    {
      stepNumber: 4,
      tab: 'lnp',
      category: '4. Nanotechnology Biophysics',
      title: 'LNP Formulation & Endosomal Transition',
      headline: `${facts.lnp.blood.liveIonizationPct}% protonated in blood, ${facts.lnp.endosome.liveIonizationPct}% in the endosome`,
      narrative:
        lnpSentence(facts) +
        (isHbb
          ? ''
          : ` The model's organ split for this formulation is ${facts.lnp.biophysics.organTropism.liver}% liver, ${facts.lnp.biophysics.organTropism.spleen}% spleen, ${facts.lnp.biophysics.organTropism.lungs}% lung, a surrogate that depends only on pKa and zeta potential, not a measured biodistribution. This composition is a generic recipe; NTLA-2001 uses its own ionizable lipid and recipe, and this one is not claimed to match it.`),
      actionKind: 'load-formulation',
      actionLabel: 'Load the tour LNP formulation',
      metrics: [
        { label: 'Diameter Dh', value: `${facts.lnp.biophysics.diameterNm} nm` },
        { label: 'PDI', value: f2(facts.lnp.biophysics.pdi) },
        {
          label: 'Protonated at pH 7.4 → 5.5',
          value: `${facts.lnp.blood.liveIonizationPct}% → ${facts.lnp.endosome.liveIonizationPct}%`,
        },
        {
          label: 'CPP at pH 5.5',
          value: `${f2(facts.lnp.endosome.cpp)} (${
            facts.lnp.endosome.cpp >= 1.45 ? 'H_II' : 'lamellar'
          })`,
        },
      ],
    },
    {
      stepNumber: 5,
      tab: 'immunology',
      category: '5. ImmunoShield HLA Engineering',
      title: 'HLA Class I Panel & Demo Risk Score',
      headline:
        hla.baselineRisk === null
          ? 'No curated epitope for this HLA panel'
          : `Demo risk score ${hla.baselineRisk}/100 → ${hla.shieldedRisk}/100 with substitutions`,
      narrative: hlaSentence(facts),
      actionKind: 'load-hla-panel',
      actionLabel: `Select ${hla.alleles.join(' + ')}`,
      metrics: [
        { label: 'HLA alleles', value: hla.alleles.join(', ') },
        { label: 'Epitope entries', value: `${hla.relevant.length}` },
        { label: 'No substitutions', value: hla.baselineRisk === null ? 'n/a' : `${hla.baselineRisk} / 100` },
        { label: 'All substitutions', value: hla.shieldedRisk === null ? 'n/a' : `${hla.shieldedRisk} / 100` },
      ],
    },
    {
      stepNumber: 6,
      tab: 'batch',
      category: '6. CMC & Dossier',
      title: 'Batch Scaling & Pre-IND Dossier',
      headline: `${f1(batch.totalMrnaMassMg)} mg mRNA and ${f1(batch.totalLipidMassMg)} mg lipid per batch`,
      narrative: batchSentence(caseId, facts),
      actionKind: 'open-dossier',
      actionLabel: 'Open the Pre-IND dossier',
      metrics: [
        { label: 'Batch volume', value: `${f1(batch.targetVolumeMl)} mL` },
        { label: 'Total mRNA', value: `${f1(batch.totalMrnaMassMg)} mg` },
        { label: 'Total lipids', value: `${f1(batch.totalLipidMassMg)} mg` },
        { label: 'Lipid : mRNA (mass)', value: `${f1(facts.lipidToMrnaRatio)} : 1` },
      ],
    },
  ];
  return steps;
}
