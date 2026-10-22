# backend/integrations/ensembl.py
"""
Ensembl REST API Client for Dynamic Genomic Lookup & CDS Extraction.
Enables CRISPR guide scanning across arbitrary human genes (GRCh38).
Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import logging
from typing import Any, Optional
import httpx

from backend.integrations.cache import bio_cache

logger = logging.getLogger(__name__)

ENSEMBL_REST_BASE = "https://rest.ensembl.org"
HEADERS = {"Content-Type": "application/json", "User-Agent": "NanoCRISPR-3D/1.0"}


async def lookup_ensembl_gene(
    symbol: str, species: str = "homo_sapiens"
) -> dict[str, Any]:
    """
    Queries Ensembl REST API for gene metadata and canonical CDS sequence.
    Returns a dictionary formatted to initialize a GenePreset.
    """
    clean_sym = symbol.strip().upper()

    # 1. Check persistent SQLite cache first
    cached = bio_cache.get_gene(clean_sym)
    if cached:
        logger.info(f"Retrieved gene {clean_sym} from local SQLite cache.")
        cached["_source"] = "cached"
        return cached

    # 2. Live query Ensembl REST API
    async with httpx.AsyncClient(timeout=10.0, headers=HEADERS) as client:
        try:
            # Step A: Lookup gene and transcripts
            lookup_url = f"{ENSEMBL_REST_BASE}/lookup/symbol/{species}/{clean_sym}?expand=1"
            resp = await client.get(lookup_url)

            if resp.status_code == 404:
                return {
                    "error": f"Gene '{clean_sym}' not found in Ensembl {species} database.",
                    "status": 404,
                }
            resp.raise_for_status()
            gene_data = resp.json()

            gene_id = gene_data.get("id", "")
            description = gene_data.get("description", f"{clean_sym} gene")
            biotype = gene_data.get("biotype", "protein_coding")
            chrom = gene_data.get("seq_region_name", "Unknown")
            transcripts = gene_data.get("Transcript", [])

            # Identify canonical or primary protein-coding transcript
            canonical_transcript = None
            for t in transcripts:
                if t.get("is_canonical") == 1:
                    canonical_transcript = t
                    break
            if not canonical_transcript and transcripts:
                canonical_transcript = transcripts[0]

            transcript_id = (
                canonical_transcript.get("id", "") if canonical_transcript else ""
            )

            # Step B: Fetch CDS sequence for canonical transcript
            cds_sequence = ""
            if transcript_id:
                seq_url = f"{ENSEMBL_REST_BASE}/sequence/id/{transcript_id}?type=cds"
                seq_resp = await client.get(seq_url)
                if seq_resp.is_success:
                    cds_sequence = seq_resp.json().get("seq", "").upper()

            # Fallback to genomic snippet if CDS is unavailable
            if not cds_sequence:
                seq_url = f"{ENSEMBL_REST_BASE}/sequence/id/{gene_id}"
                seq_resp = await client.get(seq_url)
                if seq_resp.is_success:
                    raw_seq = seq_resp.json().get("seq", "").upper()
                    cds_sequence = raw_seq[:300]

            # Invert organ recommendation heuristic based on known gene functions
            target_organ = "Liver"
            if clean_sym in {"HBB", "HBA1", "HBA2", "BCL11A", "GATA1", "JAK2"}:
                target_organ = "Bone Marrow (HSPC)"
            elif clean_sym in {"CFTR", "SFTPC", "SERPINA1"}:
                target_organ = "Lung"

            # Formulate full GenePreset structure
            preset_data: dict[str, Any] = {
                "id": clean_sym,
                "symbol": f"{clean_sym} (Chr {chrom})",
                "name": description.split(" [")[0],
                "disease": f"Investigational Target ({clean_sym} Pathology)",
                "targetOrgan": target_organ,
                "editorType": "ABE8e (A→G)",
                "pamVariant": "SpCas9",
                "sequence": cds_sequence[:120] if len(cds_sequence) >= 120 else cds_sequence,
                "fullCdsLength": len(cds_sequence),
                "mutationIndex": 21,
                "sasSnpIndex": 42,
                "sasSnpId": f"Ensembl-{transcript_id}",
                "sasAlleleFreq": 0.05,
                "clinicalNote": (
                    f"Live Ensembl annotation (GRCh38). Gene: {gene_id}, "
                    f"Canonical Transcript: {transcript_id}, Biotype: {biotype}."
                ),
                "ensemblGeneId": gene_id,
                "canonicalTranscriptId": transcript_id,
                "chromosome": str(chrom),
                "_source": "live_api",
            }

            # Save to SQLite cache for offline resilience
            bio_cache.set_gene(clean_sym, preset_data)
            return preset_data

        except httpx.HTTPError as exc:
            logger.warning(f"Ensembl API error for {clean_sym}: {exc}")
            # If network error occurs, check if we have any fallback
            return {
                "error": f"Ensembl API unreachable ({str(exc)}). Please check connection or use local presets.",
                "status": 503,
            }
