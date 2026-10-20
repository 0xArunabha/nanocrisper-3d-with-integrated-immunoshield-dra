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
