# backend/integrations/grantham.py
"""
Grantham (1974) amino-acid substitution distance.

A real calculation, not a lookup of invented numbers. For two residues i and j:

    D = 50.723 * sqrt( 1.833 * (c_i - c_j)^2 + 0.1018 * (p_i - p_j)^2 + 0.000399 * (v_i - v_j)^2 )

where c is composition, p is polarity and v is molecular volume (Grantham, Science 185:862, 1974).
The constant 50.723 is the scaling used in the published 20 x 20 matrix. Computed from the rounded
property table below this reproduces well-known matrix entries (Glu->Val 121, Glu->Ala 107,
Glu->Gly 98, Val->Ala 64, Arg->His 29, Lys->Arg 26, Leu->Ile 5) exactly, and every other entry
that was checked to within 1 unit (the published matrix used unrounded properties).

Distance classes follow Li, Wu and Luo (1984): 0-50 conservative, 51-100 moderately conservative,
101-150 moderately radical, above 150 radical.

This module only measures how different two amino acids are chemically. It does not say whether a
change is pathogenic; that needs the variant's position, structure and clinical data.

The same function is implemented in src/engines/crispr/grantham.ts. backend/checks/check_grantham.py
compares the known matrix entries so the two cannot drift apart unnoticed.
"""

from __future__ import annotations

import math
from typing import Literal, Optional

# One-letter code -> (composition c, polarity p, volume v), Grantham 1974 Table 2
GRANTHAM_PROPERTIES: dict[str, tuple[float, float, float]] = {
    "A": (0.00, 8.1, 31.0),
    "R": (0.65, 10.5, 124.0),
    "N": (1.33, 11.6, 56.0),
    "D": (1.38, 13.0, 54.0),
    "C": (2.75, 5.5, 55.0),
    "Q": (0.89, 10.5, 85.0),
    "E": (0.92, 12.3, 83.0),
    "G": (0.74, 9.0, 3.0),
    "H": (0.58, 10.4, 96.0),
    "I": (0.00, 5.2, 111.0),
    "L": (0.00, 4.9, 111.0),
    "K": (0.33, 11.3, 119.0),
    "M": (0.00, 5.7, 105.0),
    "F": (0.00, 5.2, 132.0),
    "P": (0.39, 8.0, 32.5),
    "S": (1.42, 9.2, 32.0),
    "T": (0.71, 8.6, 61.0),
    "W": (0.13, 5.4, 170.0),
    "Y": (0.20, 6.2, 136.0),
    "V": (0.00, 5.9, 84.0),
}

_ALPHA = 1.833
_BETA = 0.1018
_GAMMA = 0.000399
_SCALE = 50.723

GranthamClass = Literal[
    "conservative",
    "moderately conservative",
    "moderately radical",
    "radical",
]


def grantham_distance(from_aa: str, to_aa: str) -> Optional[int]:
    """Grantham distance between two one-letter residues, rounded to an integer.

    Returns None when either residue is not one of the 20 standard amino acids (for example a stop
    codon, '*'), because the measure is not defined for those.
    """
    a = GRANTHAM_PROPERTIES.get(from_aa.strip().upper())
    b = GRANTHAM_PROPERTIES.get(to_aa.strip().upper())
    if a is None or b is None:
        return None
    d = _SCALE * math.sqrt(
        _ALPHA * (a[0] - b[0]) ** 2 + _BETA * (a[1] - b[1]) ** 2 + _GAMMA * (a[2] - b[2]) ** 2
    )
    return int(round(d))


def grantham_class(distance: int) -> GranthamClass:
    """Li, Wu and Luo (1984) class for a Grantham distance."""
    if distance <= 50:
        return "conservative"
    if distance <= 100:
        return "moderately conservative"
    if distance <= 150:
        return "moderately radical"
    return "radical"
