// src/styles/tokens.ts
/**
 * Design tokens for NanoCRISPR-3D
 * Scientific workstation interface tokens (Benchling / Geneious / UCSC Genome Browser aesthetic)
 */

export const tokens = {
  // Color palette
  colors: {
    // Canvas & surfaces (dark charcoal with subtle cool neutral tint, flat, no gradients)
    canvas: '#141618',
    surface: '#1a1c1e',
    surfaceSubtle: '#17191b',
    surfaceRaised: '#212427',
    surfaceHover: '#282b2f',
    surfaceSelected: '#242a30',

    // Borders & dividers
    border: '#2c3035',
    borderMuted: '#222529',
    borderFocus: '#3f6d8c',

    // Typography
    textPrimary: '#e1e4e8',
    textSecondary: '#9aa0a6',
    textMuted: '#686e74',
    textInverse: '#141618',

    // Single disciplined accent color (muted slate/denim blue)
    accent: '#3f6d8c',
    accentHover: '#4b7f9f',
    accentSubdued: 'rgba(63, 109, 140, 0.14)',
    accentBorder: '#3f6d8c',

    // Status indicators (strictly functional data states, never decorative)
    status: {
      success: '#439268',
      successSubtle: 'rgba(67, 146, 104, 0.12)',
      warning: '#b88636',
      warningSubtle: 'rgba(184, 134, 54, 0.12)',
      danger: '#b54a4a',
      dangerSubtle: 'rgba(181, 74, 74, 0.12)',
    },

    // Sequence track highlights
    sequence: {
      targetBg: 'rgba(181, 74, 74, 0.22)',
      targetText: '#e57a7a',
      snpBg: 'rgba(184, 134, 54, 0.22)',
      snpText: '#deb15b',
      guideWindowBg: 'rgba(63, 109, 140, 0.25)',
      guideWindowText: '#a4c7df',
      protospacerUnderline: '#3f6d8c',
    }
  },

  // Single corner radius used across all components
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
    fontSans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontMono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, "Courier New", monospace',
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
    }
  }
} as const;

export type Tokens = typeof tokens;
