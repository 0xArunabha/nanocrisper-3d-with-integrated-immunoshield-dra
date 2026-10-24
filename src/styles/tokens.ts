// src/styles/tokens.ts
/**
 * Vintage Precision Lab Instrument Design Tokens
 * Inspired by 1970s–80s Tektronix oscilloscopes, Dieter Rams’ Braun hardware,
 * and Hewlett-Packard benchtop clinical analyzers.
 */

export const tokens = {
  colors: {
    // 1. Instrument Chassis & Surfaces
    canvas: '#141618',         // Outer application frame & page background (--bg-chassis-deep)
    surface: '#1E2124',        // Primary module cards & control panels (--bg-panel-surface)
    surfaceSubtle: '#16181A',  // Segmented top header strip (--bg-panel-header)
    surfaceRaised: '#262A2E',  // Sub-cards & readouts (--bg-panel-elevated)
    surfaceHover: '#30363B',   // Tactile hover state
    surfaceSelected: '#2A2F34',// Active switch / selected state
    viewportRecessed: '#0A0C0E', // Recessed optical/CRT viewport (--bg-viewport-recessed)

    // 2. Bezels, Hairlines & Shadows
    border: '#2E3338',         // Standard 1px solid card/table border (--border-chassis)
    borderMuted: '#24282D',    // Subtle internal grid border
    borderBevelLight: '#3A4046', // Top highlight on raised buttons
    borderBevelDark: '#0D0E10',  // Bottom edge on raised buttons
    borderFocus: '#38BDF8',    // Active halide cyan focus ring
    gridGraticule: '#1C2226',  // Oscilloscope graticule lines

    // 3. Typography & Silk-Screened Ink
    textPrimary: '#EAE6DF',    // Warm archival white (--text-primary-ink)
    textSecondary: '#98A1A6',  // Etched steel gray (--text-secondary-ink)
    textMuted: '#646D73',      // Coordinates, units, captions (--text-muted-ink)
    textInverse: '#0A0C0E',

    // 4. Clinical & Hardware Signal Indicators
    accent: '#38BDF8',         // Optical Cyan (--signal-halide-cyan)
    accentHover: '#56CCF2',
    accentSubdued: 'rgba(56, 189, 248, 0.14)',
    accentBorder: '#38BDF8',

    status: {
      success: '#38D399',      // Tektronix P31 Green (--signal-phosphor-green)
      successSubtle: 'rgba(56, 211, 153, 0.12)',
      warning: '#F5A623',      // Vintage Amber CRT (--signal-amber-crt)
      warningSubtle: 'rgba(245, 166, 35, 0.12)',
      danger: '#E5484D',       // Braun Orange-Red (--signal-braun-red)
      dangerSubtle: 'rgba(229, 72, 77, 0.14)',
    },

    // 5. Biochemical Nucleotide Channels
    nucleotides: {
      a: '#E5484D',            // Vermilion Red (--nt-adenine-a)
      t: '#F5A623',            // Ochre Amber (--nt-thymine-t)
      g: '#38D399',            // Phosphor Mint (--nt-guanine-g)
      c: '#5B9BD5',            // Cobalt Blue (--nt-cytosine-c)
    },

    // 6. LNP Formulation Layer Channels (Synced with 3D Cutaway)
    lipids: {
      ionizable: '#D97736',    // Copper Orange (--lipid-ionizable)
      helperDspc: '#38BDF8',   // Cerulean Blue (--lipid-helper-dspc)
      peg: '#38D399',          // Phosphor Green (--lipid-peg)
      cholesterol: '#EAB308',  // Warm Brass (--lipid-cholesterol)
      payload: '#F43F5E',      // Crimson RNP/mRNA core (--payload-cas9-mrna)
    },

    // Backward-compatible pigments palette for existing components
    pigments: {
      ochre: '#D97736',        // Copper Orange (Ionizable)
      ivory: '#38BDF8',        // Cerulean Blue (DSPC)
      terracotta: '#EAB308',   // Warm Brass (Cholesterol)
      petrol: '#38D399',       // Phosphor Green (PEG)
      verdigris: '#38D399',    // Phosphor Mint
      mauve: '#A855F7',        // ApoE
      bronze: '#8A7458',       // Acyl tails
      payload: '#F43F5E',      // Cas9 + mRNA crimson
    },

    // Sequence track highlights
    sequence: {
      targetBg: 'rgba(229, 72, 77, 0.22)',
      targetBorder: '#E5484D',
      targetText: '#FF6B6B',
      snpBg: 'rgba(229, 72, 77, 0.22)',
      snpBorder: '#E5484D',
      snpText: '#FF6B6B',
      guideWindowBg: 'rgba(56, 189, 248, 0.18)',
      guideWindowBorder: 'rgba(56, 189, 248, 0.60)',
      guideWindowText: '#38BDF8',
      deaminaseWindowBg: 'rgba(245, 166, 35, 0.20)',
      deaminaseWindowBorder: 'rgba(245, 166, 35, 0.55)',
      deaminaseWindowText: '#F5A623',
      pamBg: 'rgba(56, 211, 153, 0.16)',
      pamBorder: 'rgba(56, 211, 153, 0.50)',
      pamText: '#38D399',
      protospacerUnderline: '#38BDF8',
    },
  },
  radius: '2px',

  // Spacing scale
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
    fontSans: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontDisplay: '"Plus Jakarta Sans", "Inter", sans-serif',
    fontMono: '"JetBrains Mono", "IBM Plex Mono", Menlo, Consolas, monospace',
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
