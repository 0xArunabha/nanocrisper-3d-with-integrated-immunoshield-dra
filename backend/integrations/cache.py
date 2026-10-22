# backend/integrations/cache.py
"""
Persistent SQLite Cache Layer for External Biological APIs.
Ensures zero latency on repeated queries and full offline functionality.
Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Optional

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
DB_PATH = CACHE_DIR / "bio_cache.db"


class BioCacheManager:
    """Manages persistent caching of external genomic, variant, and immunological queries."""

    def __init__(self, db_path: Path = DB_PATH) -> None:
        self.db_path = db_path
        self._ensure_tables()
        self._seed_benchmark_defaults()

    def _get_connection(self) -> sqlite3.Connection:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_tables(self) -> None:
        with self._get_connection() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS gene_cache (
                    symbol TEXT PRIMARY KEY,
                    data_json TEXT NOT NULL,
                    updated_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS variant_cache (
                    variant_id TEXT PRIMARY KEY,
                    data_json TEXT NOT NULL,
                    updated_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS clinvar_cache (
                    mutation_key TEXT PRIMARY KEY,
                    data_json TEXT NOT NULL,
                    updated_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS epitope_cache (
                    cache_key TEXT PRIMARY KEY,
                    data_json TEXT NOT NULL,
                    updated_at REAL NOT NULL
                );
                """
            )
            conn.commit()

    def _seed_benchmark_defaults(self) -> None:
        """Seeds benchmark clinical cases into local SQLite cache for offline reliability."""
        seeds = {
            "HBB": {
                "id": "HBB",
                "symbol": "HBB (Chr 11p15.4)",
                "name": "Hemoglobin Subunit Beta",
                "disease": "Beta-Thalassemia / Sickle Cell Disease (HbS E6V)",
                "targetOrgan": "Bone Marrow (HSPC)",
                "editorType": "ABE8e (A→G)",
                "pamVariant": "SpCas9",
                "sequence": "ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAG",
                "fullCdsLength": 444,
                "mutationIndex": 19,
                "sasSnpIndex": 32,
                "sasSnpId": "rs10768683",
                "sasAlleleFreq": 0.142,
                "clinicalNote": "Ensembl GRCh38 Validated. Canonical Transcript: ENST00000335295. High prevalence in Eastern India.",
                "ensemblGeneId": "ENSG00000244734",
                "canonicalTranscriptId": "ENST00000335295",
                "chromosome": "11",
                "_source": "cached",
            },
            "PCSK9": {
                "id": "PCSK9",
                "symbol": "PCSK9 (Chr 1p32.3)",
                "name": "Proprotein Convertase Subtilisin/Kexin Type 9",
                "disease": "Familial Hypercholesterolemia (VERVE-101 Benchmark)",
                "targetOrgan": "Liver",
                "editorType": "ABE8e (A→G)",
                "pamVariant": "SpCas9",
                "sequence": "ATGGGCACCGTCAGCTCCAGGCAGTCCTGGTGGCCGGGGCCACTGCTGCTGCTGCTGCTGCTGCTCCTGGGTCCCGCGGGCGCCCGTGCGC",
                "fullCdsLength": 2079,
                "mutationIndex": 22,
                "sasSnpIndex": 45,
                "sasSnpId": "rs505151",
                "sasAlleleFreq": 0.089,
                "clinicalNote": "Ensembl GRCh38 Validated. Canonical Transcript: ENST00000302118. LNP hepatic delivery silences PCSK9.",
                "ensemblGeneId": "ENSG00000169174",
                "canonicalTranscriptId": "ENST00000302118",
                "chromosome": "1",
                "_source": "cached",
            },
            "TTR": {
                "id": "TTR",
                "symbol": "TTR (Chr 18q12.1)",
                "name": "Transthyretin (V30M)",
                "disease": "Hereditary ATTR Amyloidosis (NTLA-2001 Benchmark)",
                "targetOrgan": "Liver",
                "editorType": "BE4max (C→T)",
                "pamVariant": "SpCas9",
                "sequence": "ATGGCTTCTCATCGTCTGCTCCTCCTCTGCCTTGCTGGACTGGTATTTGTGTCTGAGGCTGGCCCTACGGGCACCGGTGAATCCAAGTGTCCT",
                "fullCdsLength": 444,
                "mutationIndex": 43,
                "sasSnpIndex": 52,
                "sasSnpId": "rs76992529",
                "sasAlleleFreq": 0.054,
                "clinicalNote": "Ensembl GRCh38 Validated. Canonical Transcript: ENST00000237014. Hepatic LNP silences amyloid fibrils.",
                "ensemblGeneId": "ENSG00000118271",
                "canonicalTranscriptId": "ENST00000237014",
                "chromosome": "18",
                "_source": "cached",
            },
        }

        for sym, data in seeds.items():
            if not self.get_gene(sym):
                self.set_gene(sym, data)

        variant_seeds = {
            "rs10768683": {
                "variantId": "rs10768683",
                "name": "rs10768683",
                "mostSevereConsequence": "intron_variant",
                "clinicalSignificance": ["Benign", "Likely Benign"],
                "sasFrequency": 0.142,
                "minorAllele": "T",
                "ancestralAllele": "C",
                "_source": "cached",
            },
            "rs505151": {
                "variantId": "rs505151",
                "name": "rs505151 (G670E)",
                "mostSevereConsequence": "missense_variant",
                "clinicalSignificance": ["Benign", "Protective Against CHD"],
                "sasFrequency": 0.089,
                "minorAllele": "A",
                "ancestralAllele": "G",
                "_source": "cached",
            },
            "rs76992529": {
                "variantId": "rs76992529",
                "name": "rs76992529 (V30M)",
                "mostSevereConsequence": "missense_variant",
                "clinicalSignificance": ["Pathogenic", "ATTR Amyloidosis"],
                "sasFrequency": 0.054,
                "minorAllele": "T",
                "ancestralAllele": "C",
                "_source": "cached",
            },
        }
        for vid, data in variant_seeds.items():
            if not self.get_variant(vid):
                self.set_variant(vid, data)


    def get_gene(self, symbol: str) -> Optional[dict[str, Any]]:
        sym = symbol.strip().upper()
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT data_json FROM gene_cache WHERE symbol = ?", (sym,)
            ).fetchone()
            if row:
                try:
                    return json.loads(row["data_json"])
                except Exception:
                    return None
        return None

    def set_gene(self, symbol: str, data: dict[str, Any]) -> None:
        sym = symbol.strip().upper()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO gene_cache (symbol, data_json, updated_at) VALUES (?, ?, ?)",
                (sym, json.dumps(data), time.time()),
            )
            conn.commit()

    def get_variant(self, variant_id: str) -> Optional[dict[str, Any]]:
        vid = variant_id.strip().lower()
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT data_json FROM variant_cache WHERE variant_id = ?", (vid,)
            ).fetchone()
            if row:
                try:
                    return json.loads(row["data_json"])
                except Exception:
                    return None
        return None

    def set_variant(self, variant_id: str, data: dict[str, Any]) -> None:
        vid = variant_id.strip().lower()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO variant_cache (variant_id, data_json, updated_at) VALUES (?, ?, ?)",
                (vid, json.dumps(data), time.time()),
            )
            conn.commit()

    def get_clinvar(self, mutation_key: str) -> Optional[dict[str, Any]]:
        key = mutation_key.strip().upper()
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT data_json FROM clinvar_cache WHERE mutation_key = ?", (key,)
            ).fetchone()
            if row:
                try:
                    return json.loads(row["data_json"])
                except Exception:
                    return None
        return None

    def set_clinvar(self, mutation_key: str, data: dict[str, Any]) -> None:
        key = mutation_key.strip().upper()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO clinvar_cache (mutation_key, data_json, updated_at) VALUES (?, ?, ?)",
                (key, json.dumps(data), time.time()),
            )
            conn.commit()

    def get_epitope(self, peptide: str, allele: str) -> Optional[dict[str, Any]]:
        key = f"{peptide.strip().upper()}_{allele.strip().upper()}"
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT data_json FROM epitope_cache WHERE cache_key = ?", (key,)
            ).fetchone()
            if row:
                try:
                    return json.loads(row["data_json"])
                except Exception:
                    return None
        return None

    def set_epitope(self, peptide: str, allele: str, data: dict[str, Any]) -> None:
        key = f"{peptide.strip().upper()}_{allele.strip().upper()}"
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO epitope_cache (cache_key, data_json, updated_at) VALUES (?, ?, ?)",
                (key, json.dumps(data), time.time()),
            )
            conn.commit()


# Shared singleton instance
bio_cache = BioCacheManager()
