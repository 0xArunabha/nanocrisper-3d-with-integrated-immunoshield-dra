// src/engines/institutionProfile.ts
// Institutional and Investigator Profile domain model & persistence service

export interface InstitutionalProfile {
  institutionName: string;
  shortCode: string;
  departmentName: string;
  authorName: string;
  authorRole: string;
  dossierPrefix: string;
  complianceAttestation: string;
  customLogoUrl: string | null;
  enablePrintWatermark: boolean;
  printWatermarkText: string;
}

export const INSTITUTION_PROFILE_STORAGE_KEY = 'nanocrisper_institution_profile_v1';

export const DEFAULT_INSTITUTIONAL_PROFILE: InstitutionalProfile = {
  institutionName: 'Maulana Abul Kalam Azad University of Technology (MAKAUT)',
  shortCode: 'MAKAUT',
  departmentName: 'Department of Biotechnology, MAKAUT, West Bengal',
  authorName: 'Arunabha Ghosh',
  authorRole: 'Platform Architect & Lead Investigator',
  dossierPrefix: 'MAKAUT/DRA/IND-2026',
  complianceAttestation:
    'This document reflects algorithmic pre-IND evaluation conducted under the NanoCRISPR-3D & ImmunoShield-DRA computational platform developed at MAKAUT. Biophysical calibrations adhere to peer-reviewed nearest-neighbor kinetics (Sugimoto 1995, SantaLucia 1998, Turner 2004) and self-assembly phase transition principles (Israelachvili 2011, De Gennes 1979). In vitro characterization (cryo-EM, DLS, Sanger/NGS sequencing) is required prior to Phase 1 clinical filing.',
  customLogoUrl: null,
  enablePrintWatermark: true,
  printWatermarkText: 'MAKAUT BIOTECHNOLOGY | NANOCRISPR-3D & IMMUNOSHIELD-DRA',
};

export const GENERIC_INSTITUTIONAL_PROFILE: InstitutionalProfile = {
  institutionName: 'Biotechnology & Computational Nanomedicine Center',
  shortCode: 'BIOCENTER',
  departmentName: 'Translational CRISPR & Nanomedicine Division',
  authorName: 'Lead Computational Biologist',
  authorRole: 'Principal Investigator',
  dossierPrefix: 'DRA/IND-2026',
  complianceAttestation:
    'This document reflects algorithmic pre-IND evaluation conducted under the NanoCRISPR-3D & ImmunoShield-DRA computational platform. Biophysical calibrations adhere to peer-reviewed nearest-neighbor kinetics (Sugimoto 1995, SantaLucia 1998, Turner 2004) and self-assembly phase transition principles (Israelachvili 2011, De Gennes 1979). In vitro characterization (cryo-EM, DLS, Sanger/NGS sequencing) is required prior to Phase 1 clinical filing.',
  customLogoUrl: null,
  enablePrintWatermark: true,
  printWatermarkText: 'TRANSLATIONAL NANOMEDICINE | NANOCRISPR-3D & IMMUNOSHIELD-DRA',
};

/**
 * Loads institutional profile from localStorage or falls back to defaults.
 */
export function loadInstitutionalProfile(): InstitutionalProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_INSTITUTIONAL_PROFILE;
  }
  try {
    const raw = localStorage.getItem(INSTITUTION_PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_INSTITUTIONAL_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_INSTITUTIONAL_PROFILE,
      ...parsed,
    };
  } catch (err) {
    console.warn('Failed to parse institutional profile from localStorage, using default:', err);
    return DEFAULT_INSTITUTIONAL_PROFILE;
  }
}

/**
 * Saves institutional profile to localStorage and applies dynamic print style.
 */
export function saveInstitutionalProfile(profile: InstitutionalProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INSTITUTION_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    applyPrintWatermarkStyle(profile);
  } catch (err) {
    console.error('Failed to save institutional profile to localStorage:', err);
  }
}

/**
 * Injects or updates a dynamic <style> tag to control paged media print watermark.
 */
export function applyPrintWatermarkStyle(profile: InstitutionalProfile): void {
  if (typeof document === 'undefined') return;

  const styleId = 'nanocrisper-dynamic-print-watermark';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  if (profile.enablePrintWatermark && profile.printWatermarkText.trim()) {
    const escaped = profile.printWatermarkText.replace(/"/g, '\\"');
    styleEl.textContent = `
      @page {
        @top-right {
          content: "${escaped}" !important;
          font-family: "Inter", "Helvetica Neue", Arial, sans-serif !important;
          font-size: 7.5pt !important;
          font-weight: 600 !important;
          color: #334155 !important;
        }
      }
    `;
  } else {
    styleEl.textContent = `
      @page {
        @top-right {
          content: "" !important;
        }
      }
    `;
  }
}
