// src/components/InstitutionalProfileModal.tsx
// Interactive configuration modal for institutional identity, author branding, dossier identifiers, and watermarks.

import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Upload,
  Trash2,
  RotateCcw,
  Sparkles,
  Check,
  X,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { tokens } from '../styles/tokens';
import {
  type InstitutionalProfile,
  DEFAULT_INSTITUTIONAL_PROFILE,
  GENERIC_INSTITUTIONAL_PROFILE,
} from '../engines/institutionProfile';

interface InstitutionalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: InstitutionalProfile;
  onSave: (updated: InstitutionalProfile) => void;
}

export const InstitutionalProfileModal: React.FC<InstitutionalProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [form, setForm] = useState<InstitutionalProfile>(profile);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or parent profile changes
  useEffect(() => {
    if (isOpen) {
      setForm(profile);
      setSavedFeedback(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof InstitutionalProfile>(field: K, value: InstitutionalProfile[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size exceeds 2 MB limit. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleChange('customLogoUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleChange('customLogoUrl', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = () => {
    setForm(DEFAULT_INSTITUTIONAL_PROFILE);
  };

  const handleLoadGeneric = () => {
    setForm(GENERIC_INSTITUTIONAL_PROFILE);
  };

  const handleSave = () => {
    onSave(form);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 400);
  };

  const previewDossierId = `${form.dossierPrefix || 'DRA/IND-2026'}/HBB-01`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="institution-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        style={{
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radius,
        }}
        className="relative w-full max-w-4xl my-auto border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#e8dfd1]"
      >
        {/* Header Bar */}
        <div
          style={{ borderColor: tokens.colors.border }}
          className="px-5 py-3.5 border-b flex items-center justify-between bg-[#141210] shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#4d828f]/20 border border-[#4d828f]/50 flex items-center justify-center text-[#4d828f]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="institution-settings-title" className="text-sm font-bold tracking-tight text-[#f4efe8]">
                Institution &amp; Investigator Profile
              </h2>
              <p className="text-[11px] text-[#a69b8d]">
                Customize university branding, author attribution, dossier identifiers, and print watermarks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-2.5 py-1 text-[11px] rounded border border-[#3d372e] bg-[#1a1714] text-[#a69b8d] hover:text-[#e8dfd1] hover:border-[#4d828f] transition flex items-center gap-1.5 cursor-pointer"
              title="Reset all values to MAKAUT institutional defaults"
            >
              <RotateCcw className="w-3 h-3 text-[#cfa052]" />
              <span className="hidden sm:inline">Reset MAKAUT</span>
            </button>

            <button
              onClick={handleLoadGeneric}
              className="px-2.5 py-1 text-[11px] rounded border border-[#3d372e] bg-[#1a1714] text-[#a69b8d] hover:text-[#e8dfd1] hover:border-[#4d828f] transition flex items-center gap-1.5 cursor-pointer"
              title="Load generic biotechnology lab template"
            >
              <Sparkles className="w-3 h-3 text-[#4d828f]" />
              <span className="hidden sm:inline">Generic Lab</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#28231d] text-[#a69b8d] hover:text-[#e8dfd1] transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Form Inputs */}
            <div className="lg:col-span-7 space-y-4">
              {/* Institution & Short Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider block">
                    Institution / Organization Name
                  </label>
                  <input
                    type="text"
                    value={form.institutionName}
                    onChange={(e) => handleChange('institutionName', e.target.value)}
                    placeholder="e.g. Maulana Abul Kalam Azad University of Technology (MAKAUT)"
                    className="w-full px-3 py-1.5 rounded border border-[#3d372e] bg-[#141210] text-[#e8dfd1] text-xs focus:outline-none focus:border-[#4d828f]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider block">
                    Short Code / Badge
                  </label>
                  <input
                    type="text"
                    value={form.shortCode}
                    onChange={(e) => handleChange('shortCode', e.target.value.toUpperCase())}
                    placeholder="MAKAUT"
                    maxLength={10}
                    className="w-full px-3 py-1.5 rounded border border-[#3d372e] bg-[#141210] text-[#e8dfd1] text-xs font-mono font-bold focus:outline-none focus:border-[#4d828f]"
                  />
                </div>
              </div>

              {/* Department / Division */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider block">
                  Department / Laboratory / Division
                </label>
                <input
                  type="text"
                  value={form.departmentName}
                  onChange={(e) => handleChange('departmentName', e.target.value)}
                  placeholder="Department of Biotechnology, MAKAUT, West Bengal"
                  className="w-full px-3 py-1.5 rounded border border-[#3d372e] bg-[#141210] text-[#e8dfd1] text-xs focus:outline-none focus:border-[#4d828f]"
                />
              </div>

              {/* Author & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider block">
                    Lead Investigator / Author Name
                  </label>
                  <input
                    type="text"
                    value={form.authorName}
                    onChange={(e) => handleChange('authorName', e.target.value)}
                    placeholder="Arunabha Ghosh"
                    className="w-full px-3 py-1.5 rounded border border-[#3d372e] bg-[#141210] text-[#e8dfd1] text-xs focus:outline-none focus:border-[#4d828f]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider block">
                    Platform Architect Title / Role
                  </label>
                  <input
                    type="text"
                    value={form.authorRole}
                    onChange={(e) => handleChange('authorRole', e.target.value)}
                    placeholder="Platform Architect & Lead Investigator"
                    className="w-full px-3 py-1.5 rounded border border-[#3d372e] bg-[#141210] text-[#e8dfd1] text-xs focus:outline-none focus:border-[#4d828f]"
                  />
                </div>
              </div>

              {/* Dossier Code Prefix */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider">
                    Regulatory Dossier ID Prefix
                  </label>
                  <span className="text-[10px] text-[#70675c] font-mono">
                    Sample: <span className="text-[#4d828f]">{previewDossierId}</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={form.dossierPrefix}
                  onChange={(e) => handleChange('dossierPrefix', e.target.value)}
                  placeholder="MAKAUT/DRA/IND-2026"
                  className="w-full px-3 py-1.5 rounded border border-[#3d372e] bg-[#141210] text-[#e8dfd1] text-xs font-mono focus:outline-none focus:border-[#4d828f]"
                />
              </div>

              {/* Logo Upload Section */}
              <div className="p-3 rounded border border-[#332e27] bg-[#151310] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#4d828f]" />
                    Institutional Logo (Optional)
                  </label>
                  {form.customLogoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[10px] text-[#c96255] hover:text-[#e07567] flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {form.customLogoUrl ? (
                    <div className="w-12 h-12 rounded border border-[#4d828f]/50 bg-black/40 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img
                        src={form.customLogoUrl}
                        alt="Uploaded institutional logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded border border-dashed border-[#3d372e] bg-[#1a1714] flex flex-col items-center justify-center text-[#70675c] shrink-0 text-[10px]">
                      <span>No Logo</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="block w-full text-[11px] text-[#a69b8d] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#2a2621] file:text-[#e8dfd1] hover:file:bg-[#3d372e] file:cursor-pointer"
                    />
                    <p className="text-[10px] text-[#70675c] mt-1">
                      Supports PNG, JPG, or SVG up to 2MB. Displayed on Pre-IND Dossier and exported reports.
                    </p>
                  </div>
                </div>
              </div>

              {/* Watermark Section */}
              <div className="p-3 rounded border border-[#332e27] bg-[#151310] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-[#cfa052]" />
                    Print Watermark &amp; Header
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <span className="text-[#a69b8d]">
                      {form.enablePrintWatermark ? 'Active' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={form.enablePrintWatermark}
                      onChange={(e) => handleChange('enablePrintWatermark', e.target.checked)}
                      className="rounded border-[#3d372e] text-[#4d828f] focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={form.printWatermarkText}
                  onChange={(e) => handleChange('printWatermarkText', e.target.value)}
                  disabled={!form.enablePrintWatermark}
                  placeholder="e.g. MAKAUT BIOTECHNOLOGY | NANOCRISPR-3D & IMMUNOSHIELD-DRA"
                  className="w-full px-3 py-1.5 rounded border border-[#3d372e] bg-[#141210] text-[#e8dfd1] text-xs font-mono focus:outline-none focus:border-[#4d828f] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-[10px] text-[#70675c]">
                  Appears in the top-right header box of PDF printouts and printed Pre-IND dossiers.
                </p>
              </div>

              {/* Attestation Textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider block">
                  Regulatory Compliance Attestation Statement
                </label>
                <textarea
                  rows={3}
                  value={form.complianceAttestation}
                  onChange={(e) => handleChange('complianceAttestation', e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#3d372e] bg-[#141210] text-[#e8dfd1] text-[11px] leading-relaxed focus:outline-none focus:border-[#4d828f] resize-none"
                />
              </div>
            </div>

            {/* Right 5 Cols: Real-Time Preview Card */}
            <div className="lg:col-span-5 flex flex-col">
              <span className="text-[11px] font-semibold text-[#a69b8d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#4d828f]" />
                Live Dossier Header Preview
              </span>

              <div className="flex-1 p-4 rounded border border-[#332e27] bg-[#100f0d] flex flex-col justify-between space-y-4">
                {/* Dossier Mock Header */}
                <div className="p-3.5 rounded bg-[#181613] border border-[#26221d] space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-[#2a2621] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      {form.customLogoUrl ? (
                        <div className="w-9 h-9 rounded bg-black/40 border border-[#0f766e] flex items-center justify-center p-0.5 overflow-hidden">
                          <img
                            src={form.customLogoUrl}
                            alt="Logo preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 bg-[#0f766e] text-white flex items-center justify-center font-bold text-[10px] tracking-wider rounded-[2px] shadow-sm">
                          {form.shortCode || 'LOGO'}
                        </div>
                      )}
                      <div>
                        <div className="text-[9px] font-semibold tracking-wider text-[#0f766e] uppercase">
                          IND Module 3 CMC Technical Dossier
                        </div>
                        <div className="text-[12px] font-bold text-[#f4efe8] line-clamp-1">
                          {form.institutionName || 'Institution Name'}
                        </div>
                        <div className="text-[10px] text-[#a69b8d] line-clamp-1">
                          {form.departmentName || 'Department / Laboratory'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div>
                      <span className="text-[8.5px] uppercase block text-[#70675c]">Dossier Code</span>
                      <strong className="text-[#cfa052] font-mono font-medium">{previewDossierId}</strong>
                    </div>
                    <div>
                      <span className="text-[8.5px] uppercase block text-[#70675c]">Lead Investigator</span>
                      <strong className="text-[#0f766e]">{form.authorName || 'Author Name'} ({form.shortCode || 'ORG'})</strong>
                    </div>
                  </div>

                  {/* Watermark badge preview */}
                  <div className="pt-2 border-t border-[#24201b] flex items-center justify-between text-[9px] text-[#70675c]">
                    <span>Watermark:</span>
                    <span className="font-mono text-[9px] text-[#a69b8d] truncate max-w-[180px]">
                      {form.enablePrintWatermark ? form.printWatermarkText : '(Disabled)'}
                    </span>
                  </div>
                </div>

                {/* Attestation Preview snippet */}
                <div className="p-2.5 rounded bg-[#141210] border border-[#24201b] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-[#5e946c]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Regulatory Attestation Preview
                  </div>
                  <p className="text-[9.5px] text-[#a69b8d] leading-normal line-clamp-3">
                    {form.complianceAttestation}
                  </p>
                  <div className="pt-1 border-t border-[#1f1b16] text-[9.5px]">
                    <span className="italic text-[#e8dfd1] font-serif">{form.authorName}</span>
                    <span className="text-[#70675c]"> — {form.departmentName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{ borderColor: tokens.colors.border }}
          className="px-5 py-3 border-t bg-[#141210] flex items-center justify-between shrink-0"
        >
          <div className="text-[11px] text-[#70675c]">
            Changes are saved to local browser storage and take effect immediately.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-[#3d372e] bg-transparent text-[#a69b8d] hover:text-[#e8dfd1] hover:bg-[#24201b] transition cursor-pointer text-xs"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-[#4d828f] hover:bg-[#5b96a4] text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Applied!</span>
                </>
              ) : (
                <span>Save &amp; Apply Profile</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
