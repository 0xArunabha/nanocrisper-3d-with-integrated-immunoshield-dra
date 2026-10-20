// src/styles/tokens.ts
export const tokens = {
  colors: {
    // Warm carbon & dark espresso-ink surfaces (replaces cold blue-greys)
    canvas: '#12110f',
    surface: '#181613',
    surfaceSubtle: '#151310',
    surfaceRaised: '#211e1a',
    surfaceHover: '#2a2621',
    surfaceSelected: '#2c251d',

    // Warm rules & hairlines
    border: '#332e27',
    borderMuted: '#24201b',
    borderFocus: '#b88644',

    // Parchment, warm bone, and sepia-grey typography
    textPrimary: '#e8dfd1',
    textSecondary: '#a69b8d',
    textMuted: '#70675c',
    textInverse: '#12110f',

    // Primary Mineral Accent: Vintage Petrol / Prussian Blue
    accent: '#4d828f',
    accentHover: '#5e96a3',
    accentSubdued: 'rgba(77, 130, 143, 0.16)',
    accentBorder: '#4d828f',

    // Vintage Pigment Status Colors (Verdigris, Raw Ochre, Cinnabar/Terracotta)
    status: {
      success: '#5e946c',       // Oxidized Verdigris / Sage
      successSubtle: 'rgba(94, 148, 108, 0.15)',
      warning: '#c98a3b',       // Raw Sienna / Vintage Ochre
      warningSubtle: 'rgba(201, 138, 59, 0.15)',
      danger: '#bd5142',        // Cinnabar / Terracotta Red
      dangerSubtle: 'rgba(189, 81, 66, 0.15)',
    },

    // Molecular & Nucleotide Pigments (for 3D LNP & Sequence Tracks)
    pigments: {
      ochre: '#cfa052',         // Ionizable amine heads / Guanine
      ivory: '#d9cdb8',         // DSPC phosphocholine heads
      terracotta: '#b85b46',    // Cholesterol sterols / Thymine
      petrol: '#528796',        // PEG-2000 corona / Cytosine
      verdigris: '#639972',     // Protonated mRNA core / Adenine
      mauve: '#9e6778',         // ApoE 4-helix opsonins / Cas9 RNP lobes
      bronze: '#54493b',        // Hydrophobic sn-1/sn-2 acyl tails
    },

    // Sequence track highlights (harmonized with vintage pigment palette)
    sequence: {
      targetBg: 'rgba(189, 81, 66, 0.22)',
      targetBorder: '#bd5142',
      targetText: '#e27b6c',
      snpBg: 'rgba(201, 138, 59, 0.22)',
      snpBorder: '#c98a3b',
      snpText: '#df9e51',
      guideWindowBg: 'rgba(77, 130, 143, 0.16)',
      guideWindowBorder: 'rgba(77, 130, 143, 0.45)',
      guideWindowText: '#98c2cc',
      deaminaseWindowBg: 'rgba(201, 138, 59, 0.22)',
      deaminaseWindowBorder: 'rgba(201, 138, 59, 0.55)',
      deaminaseWindowText: '#e0ad5a',
      pamBg: 'rgba(207, 160, 82, 0.14)',
      pamBorder: 'rgba(207, 160, 82, 0.50)',
      pamText: '#d4a359',
      protospacerUnderline: '#4d828f',
    },
  },
  radius: '3px',

  // Spacing scale (multiples of 4px)
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
  },

  // Typography scale
  typography: {
    fontSans: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontDisplay: '"Space Grotesk", sans-serif',
    fontMono: '"IBM Plex Mono", "JetBrains Mono", Menlo, Consolas, monospace',
    size: {
      xs: '11px',    // metadata, labels, table data, tags
      sm: '12px',    // body text, controls, inputs
      base: '13px',  // section headers, prominent values
      md: '14px',    // subsection titles, main controls
      lg: '16px',    // page/target header
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.45,
      relaxed: 1.6,
    },
  },
} as const;

export type Tokens = typeof tokens;
