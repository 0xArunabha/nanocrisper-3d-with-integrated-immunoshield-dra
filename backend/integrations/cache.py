# backend/integrations/cache.py
"""
Persistent SQLite Cache Layer for External Biological APIs.

What is stored, and what `_source` says about it:
  - "live_api" answers from Ensembl are written here and come back labelled "cached" on the next lookup.
  - Three gene entries (HBB, PCSK9, TTR) are bundled with the app so the demo presets can be searched
    offline. They are demonstration entries with the same short sequences the presets use. They were not
    fetched from Ensembl, so they are labelled "bundled", never "cached" or "validated".
  - No SNP records are bundled. An rsID is either answered by Ensembl or reported as not looked up.

Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Optional

BUNDLED_NOTE = (
    "Bundled demonstration entry, not fetched from Ensembl in this session. The sequence is the short "
    "preset sequence the app uses; the canonical transcript ID ({transcript}) is given for reference. "
    "The target base, SNP position and frequency are the preset's own demo inputs."
)

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
DB_PATH = CACHE_DIR / "bio_cache.db"


class BioCacheManager:
    """Manages persistent caching of external genomic, variant, and immunological queries."""

    def __init__(self, db_path: Path = DB_PATH) -> None:
        self.db_path = db_path
        self._ensure_tables()
        self._purge_unverified_seeds()
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

    def _purge_unverified_seeds(self) -> None:
        """
        Earlier versions seeded hand-written gene and SNP records and labelled them "cached" / "Ensembl GRCh38
        Validated". Delete those rows from an existing database. Real Ensembl answers are stored as
        "live_api", so this never touches them.
        """
        with self._get_connection() as conn:
            conn.execute(
                "DELETE FROM variant_cache WHERE data_json LIKE '%\"_source\": \"cached\"%'"
            )
            conn.execute(
                "DELETE FROM gene_cache WHERE data_json LIKE '%Ensembl GRCh38 Validated%'"
            )
            conn.commit()

    def _seed_benchmark_defaults(self) -> None:
        """Bundles the three demonstration gene entries so the presets can be searched offline."""
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
                "clinicalNote": BUNDLED_NOTE.format(transcript="ENST00000335295"),
                "ensemblGeneId": "ENSG00000244734",
                "canonicalTranscriptId": "ENST00000335295",
                "chromosome": "11",
                "_source": "bundled",
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
                "clinicalNote": BUNDLED_NOTE.format(transcript="ENST00000302118"),
                "ensemblGeneId": "ENSG00000169174",
                "canonicalTranscriptId": "ENST00000302118",
                "chromosome": "1",
                "_source": "bundled",
            },
            "TTR": {
                "id": "TTR",
                "symbol": "TTR (Chr 18q12.1)",
                "name": "Transthyretin (V30M)",
                "disease": "Hereditary ATTR Amyloidosis (TTR V30M, demonstration target)",
                "targetOrgan": "Liver",
                "editorType": "BE4max (C→T)",
                "pamVariant": "SpCas9",
                "sequence": "ATGGCTTCTCATCGTCTGCTCCTCCTCTGCCTTGCTGGACTGGTATTTGTGTCTGAGGCTGGCCCTACGGGCACCGGTGAATCCAAGTGTCCT",
                "fullCdsLength": 444,
                "mutationIndex": 43,
                "sasSnpIndex": 52,
                "sasSnpId": "rs76992529",
                "sasAlleleFreq": 0.054,
                "clinicalNote": BUNDLED_NOTE.format(transcript="ENST00000237014"),
                "ensemblGeneId": "ENSG00000118271",
                "canonicalTranscriptId": "ENST00000237014",
                "chromosome": "18",
                "_source": "bundled",
            },
        }

        for sym, data in seeds.items():
            if not self.get_gene(sym):
                self.set_gene(sym, data)

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
