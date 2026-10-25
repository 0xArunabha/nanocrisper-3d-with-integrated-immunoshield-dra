# backend/integrations/__init__.py
from backend.integrations.cache import bio_cache, BioCacheManager
from backend.integrations.ensembl import lookup_ensembl_gene
from backend.integrations.clinvar import (
    lookup_variant_details,
    annotate_bystander_pathogenicity,
)
from backend.integrations.grantham import grantham_class, grantham_distance
from backend.integrations.iedb import (
    score_peptide_hla_binding,
    scan_protein_for_epitopes,
)
from backend.integrations.biopython_bridge import (
    calculate_melting_temp,
    biopython_translate,
)

__all__ = [
    "bio_cache",
    "BioCacheManager",
    "lookup_ensembl_gene",
    "lookup_variant_details",
    "annotate_bystander_pathogenicity",
    "grantham_class",
    "grantham_distance",
    "score_peptide_hla_binding",
    "scan_protein_for_epitopes",
    "calculate_melting_temp",
    "biopython_translate",
]
