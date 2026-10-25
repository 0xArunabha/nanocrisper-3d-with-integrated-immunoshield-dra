// src/engines/presets.ts
import type { GenePreset } from './types';

// The SNP id and frequency on each preset are demonstration inputs: one marker per target so the SNP-collision
// filter has something to show. They were not looked up in Ensembl or gnomAD. In Custom mode the "SAS SNP" box
// asks the backend for a real Ensembl value and replaces them. The sequences are short snippets (about 90 nt) of
// each gene's coding sequence; the HBB one carries the sickle (GTG) allele on purpose.
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
    clinicalNote: 'An adenine base editor can convert the sickle (HbS) valine codon GTG to the Hb G-Makassar alanine codon GCG; G-Makassar has been reported as non-sickling (Newby et al., Nature 2021).'
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
    disease: 'Hereditary ATTR Amyloidosis (TTR V30M, demonstration target)',
    targetOrgan: 'Liver',
    editorType: 'BE4max (C→T)',
    pamVariant: 'SpCas9',
    sequence: 'ATGGCTTCTCATCGTCTGCTCCTCCTCTGCCTTGCTGGACTGGTATTTGTGTCTGAGGCTGGCCCTACGGGCACCGGTGAATCCAAGTGTCCT',
    mutationIndex: 43,
    sasSnpIndex: 52,
    sasSnpId: 'rs76992529 (SAS TTR Variant)',
    sasAlleleFreq: 0.054,
    clinicalNote: 'TTR is made in the liver, so hepatic LNP delivery is the route. Demonstration target: this sequence holds only the first 31 codons (the signal peptide and the start of the protein); the V30M site (precursor residue 50) is not in it.'
  }
];
