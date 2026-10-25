#!/usr/bin/env python3
"""
Checks for the pure scientific code in the backend. No server, no network.

Run from the repository root:

    python backend/checks/check_science.py

It loads the modules by file path, so it works without installing httpx or fastapi. Parts that need
pydantic (thermodynamics) or httpx (clinvar) are skipped with a message when those are missing.

    python backend/checks/check_science.py --dump-grantham

adds one line, "MATRIX {json}", with the 20 x 20 Grantham matrix; the browser-side check compares its own matrix with it.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
failures: list[str] = []
skipped: list[str] = []


def load(name: str, relative: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def check(label: str, ok: bool, detail: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {label}{(' - ' + detail) if detail and not ok else ''}")
    if not ok:
        failures.append(label)


# ----------------------------------------------------------------------------------------------
print("Grantham distance")
g = load("grantham", "backend/integrations/grantham.py")

# Entries of the published matrix that were verified by hand: these must match exactly.
exact = {
    ("E", "V"): 121, ("E", "A"): 107, ("E", "G"): 98, ("V", "A"): 64, ("R", "H"): 29,
    ("K", "R"): 26, ("L", "I"): 5, ("F", "Y"): 22, ("D", "E"): 45, ("S", "T"): 58,
    ("G", "W"): 184, ("A", "S"): 99,
}
# Entries where the published matrix (computed from unrounded properties) is 1 above this table's result.
within_one = {("C", "W"): 215, ("L", "M"): 15}

for (a, b), want in exact.items():
    check(f"{a}->{b} = {want}", g.grantham_distance(a, b) == want, str(g.grantham_distance(a, b)))
for (a, b), want in within_one.items():
    got = g.grantham_distance(a, b)
    check(f"{a}->{b} within 1 of {want}", got is not None and abs(got - want) <= 1, str(got))

aas = sorted(g.GRANTHAM_PROPERTIES)
check("20 amino acids", len(aas) == 20)
check("symmetric", all(g.grantham_distance(a, b) == g.grantham_distance(b, a) for a in aas for b in aas))
check("zero on the diagonal", all(g.grantham_distance(a, a) == 0 for a in aas))
check("stop codon has no distance", g.grantham_distance("E", "*") is None)
check("classes", [g.grantham_class(d) for d in (0, 50, 51, 100, 101, 150, 151)] == [
    "conservative", "conservative", "moderately conservative", "moderately conservative",
    "moderately radical", "moderately radical", "radical"])

if "--dump-grantham" in sys.argv:
    print("MATRIX " + json.dumps({a: {b: g.grantham_distance(a, b) for b in aas} for a in aas}))

# ----------------------------------------------------------------------------------------------
print("RNA:DNA nearest-neighbor table (Sugimoto 1995)")
try:
    t = load("thermodynamics", "backend/thermodynamics.py")
except ImportError as exc:  # pydantic missing
    skipped.append(f"thermodynamics ({exc})")
    t = None

if t is not None:
    # dG37 column of the published table, typed separately from dH and dS so a copy error in either
    # shows up as a disagreement. Re-enter these from the paper if you have it open.
    published_dg37 = {
        "AA": -1.0, "AC": -2.1, "AG": -1.8, "AT": -0.9, "CA": -0.9, "CC": -2.1, "CG": -1.7, "CT": -0.9,
        "GA": -1.3, "GC": -2.7, "GG": -2.9, "GT": -1.1, "TA": -0.6, "TC": -1.5, "TG": -1.6, "TT": -0.2,
    }
    check("16 steps", sorted(t.RNA_DNA_NN_PARAMS) == sorted(published_dg37))
    for step, (dh, ds) in sorted(t.RNA_DNA_NN_PARAMS.items()):
        dg = dh - 310.15 * ds / 1000.0
        check(f"{step}: dH - T*dS = {dg:.2f} vs published {published_dg37[step]}",
              abs(dg - published_dg37[step]) <= 0.06)
    # initiation term 1.9 kcal/mol, -3.9 cal/mol/K corresponds to the published +3.1 kcal/mol at 37 C
    check("initiation = +3.1 kcal/mol at 37 C", abs(1.9 - 310.15 * (-3.9) / 1000.0 - 3.1) < 0.05)

    dh, ds, dg37, tm = t.calc_rna_dna_thermodynamics("GACGTTACCGGATTACGCAT")
    check("hybrid dG37 is negative and Tm is plausible", dg37 < 0 and 30 < tm < 90, f"dG37={dg37} Tm={tm}")

# ----------------------------------------------------------------------------------------------
print("Bystander impact rule")
try:
    # clinvar.py imports httpx and the SQLite cache at module level, so import it as the app does
    import importlib

    sys.path.insert(0, str(ROOT))
    clin = importlib.import_module("backend.integrations.clinvar")
except ImportError as exc:
    skipped.append(f"clinvar ({exc})")
    clin = None

if clin is not None:
    ann = clin.annotate_bystander_pathogenicity
    r = ann("HBB", "E", "V", "Missense (Pathogenic Risk)")
    check("HBB Glu>Val is the curated HbS note", r["annotationBasis"] == "curated" and r["riskLevel"] == "Flag")
    r = ann("PCSK9", "E", "V", "Missense (Pathogenic Risk)")
    check("same change elsewhere is a rule, Grantham 121 flagged",
          r["annotationBasis"] == "rule" and r["granthamDistance"] == 121 and r["riskLevel"] == "Flag")
    r = ann("TTR", "R", "H", "Missense (Pathogenic Risk)")
    check("Arg>His is Grantham 29, needs review (not 'benign')", r["granthamDistance"] == 29 and r["riskLevel"] == "Review")
    r = ann("TTR", "Q", "*", "Nonsense (Premature Stop)")
    check("stop has no Grantham distance", r["granthamDistance"] is None and r["riskLevel"] == "Flag")
    r = ann("TTR", "A", "A", "Silent (Synonymous)")
    check("silent is neutral, distance 0", r["riskLevel"] == "Neutral" and r["granthamDistance"] == 0)
    check("no result calls itself ClinVar",
          "clinvar" not in json.dumps(ann("HBB", "A", "T", "Missense (Pathogenic Risk)")).lower())

# ----------------------------------------------------------------------------------------------
print("Bundled cache entries (stdlib only)")
import json as _json
import sqlite3
import tempfile

cache_mod = load("bio_cache_check", "backend/integrations/cache.py")
tmp_db = Path(tempfile.mkdtemp()) / "check.db"
first = cache_mod.BioCacheManager(tmp_db)
check("the three demonstration genes are labelled bundled",
      all((first.get_gene(g) or {}).get("_source") == "bundled" for g in ("HBB", "PCSK9", "TTR")))
check("no bundled note claims Ensembl validation",
      all("validated" not in (first.get_gene(g) or {}).get("clinicalNote", "").lower() for g in ("HBB", "PCSK9", "TTR")))
check("no SNP records are bundled", all(first.get_variant(v) is None for v in ("rs10768683", "rs505151", "rs76992529")))

# a database written by the older code carries seeded rows; they are purged, real answers are kept
with sqlite3.connect(str(tmp_db)) as conn:
    old_seed = _json.dumps({"variantId": "rs505151", "sasFrequency": 0.089, "_source": "cached"})
    real_answer = _json.dumps({"variantId": "rs123", "sasFrequency": 0.3, "_source": "live_api"})
    conn.execute("INSERT OR REPLACE INTO variant_cache VALUES ('rs505151', ?, 0)", (old_seed,))
    conn.execute("INSERT OR REPLACE INTO variant_cache VALUES ('rs123', ?, 0)", (real_answer,))
    conn.execute("INSERT OR REPLACE INTO gene_cache VALUES ('OLD', ?, 0)",
                 (_json.dumps({"id": "OLD", "clinicalNote": "Ensembl GRCh38 Validated.", "_source": "cached"}),))
    conn.commit()
second = cache_mod.BioCacheManager(tmp_db)
check("an old seeded SNP row is removed", second.get_variant("rs505151") is None)
check("an old 'Validated' gene row is removed", second.get_gene("OLD") is None)
check("a real Ensembl answer is kept", (second.get_variant("rs123") or {}).get("sasFrequency") == 0.3)

# ----------------------------------------------------------------------------------------------
print()
if skipped:
    print("skipped: " + "; ".join(skipped))
if failures:
    print(f"{len(failures)} check(s) FAILED")
    sys.exit(1)
print("all checks passed")
