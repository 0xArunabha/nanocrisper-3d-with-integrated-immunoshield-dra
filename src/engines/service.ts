// src/engines/service.ts
import type {
  IBioEngineService,
  GenePreset,
  GuideCandidate,
  CloningOligos,
  LnpFormulation,
  LnpBiophysicsResult,
  BatchMassCalculation,
  EpitopeHotspot,
  ThermodynamicProfile,
  SecondaryStructureResult,
  HomodimerResult,
  BystanderEdit,
  VariantAnnotation,
  ExternalGeneMetadata
} from './types';
import { scanForGuides, translateSequence, reverseComplement } from './crispr/guideScanner';
import { generateCloningOligos } from './crispr/oligoGenerator';
import { simulateLnpBiophysics } from './nanotech/lnpSimulator';
import { calculateBatchMasses } from './nanotech/batchCalculator';
import { CAS9_EPITOPE_HOTSPOTS } from './immunology/hlaScanner';

/**
 * Default In-Browser Implementation of IBioEngineService.
 * Executes analytical heuristics in real time (< 1 ms latency) on the client.
 */
export class LocalBioEngineService implements IBioEngineService {
  scanGuides(preset: GenePreset): GuideCandidate[] {
    return scanForGuides(preset);
  }

  generateCloningOligos(spacer: string): CloningOligos {
    return generateCloningOligos(spacer);
  }

  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
    return simulateLnpBiophysics(form);
  }

  calculateBatchMasses(
    form: LnpFormulation,
    targetVolumeMl: number = 10,
    mrnaConcMgMl: number = 1.0
  ): BatchMassCalculation {
    return calculateBatchMasses(form, targetVolumeMl, mrnaConcMgMl);
  }

  translateSequence(seq: string): string {
    return translateSequence(seq);
  }

  reverseComplement(seq: string): string {
    return reverseComplement(seq);
  }

  getEpitopeHotspots(): EpitopeHotspot[] {
    return CAS9_EPITOPE_HOTSPOTS;
  }
}

/**
 * Hybrid Remote Python / FastAPI Adapter with Instant Local Fallback Cache.
 * Communicates with http://localhost:8000/api/v1 while maintaining zero-latency
 * synchronous compatibility for React concurrent rendering.
 */
export class RemotePythonBioEngineService implements IBioEngineService {
  private baseUrl: string;
  private localFallback: LocalBioEngineService;
  private guideCache: Map<string, GuideCandidate[]>;
  private lnpCache: Map<string, LnpBiophysicsResult>;

  constructor(baseUrl: string = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
    this.localFallback = new LocalBioEngineService();
    this.guideCache = new Map();
    this.lnpCache = new Map();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchScanGuides(preset: GenePreset): Promise<GuideCandidate[]> {
    const cacheKey = `${preset.id}:${preset.editorType}:${preset.pamVariant ?? 'SpCas9'}:${preset.mutationIndex}:${preset.sequence}`;
    try {
      const res = await fetch(`${this.baseUrl}/crispr/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
      if (res.ok) {
        const data = (await res.json()) as GuideCandidate[];
        this.guideCache.set(cacheKey, data);
        return data;
      }
    } catch {
      // Offline fallback to local engine
    }
    return this.localFallback.scanGuides(preset);
  }

  async fetchLnpBiophysics(form: LnpFormulation): Promise<LnpBiophysicsResult> {
    const cacheKey = JSON.stringify(form);
    try {
      const res = await fetch(`${this.baseUrl}/nanotech/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = (await res.json()) as LnpBiophysicsResult;
        this.lnpCache.set(cacheKey, data);
        return data;
      }
    } catch {
      // Offline fallback to local engine
    }
    return this.localFallback.simulateLnpBiophysics(form);
  }

  async fetchThermodynamics(spacer: string): Promise<ThermodynamicProfile | null> {
    try {
      const res = await fetch(`${this.baseUrl}/crispr/thermodynamics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spacer })
      });
      if (res.ok) {
        return (await res.json()) as ThermodynamicProfile;
      }
    } catch {
      // Offline fallback
    }
    return null;
  }

  async fetchSecondaryStructure(sequence: string): Promise<SecondaryStructureResult | null> {
    try {
      const res = await fetch(`${this.baseUrl}/crispr/secondary-structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence })
      });
      if (res.ok) {
        return (await res.json()) as SecondaryStructureResult;
      }
    } catch {
      // Offline fallback
    }
    return null;
  }

  async fetchHomodimer(spacer: string): Promise<HomodimerResult | null> {
    try {
      const res = await fetch(`${this.baseUrl}/crispr/homodimer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spacer })
      });
      if (res.ok) {
        return (await res.json()) as HomodimerResult;
      }
    } catch {
      // Offline fallback
    }
    return null;
  }

  async fetchExternalGene(symbol: string): Promise<ExternalGeneMetadata | null> {
    try {
      const res = await fetch(`${this.baseUrl}/external/gene/${encodeURIComponent(symbol)}`, {
        method: 'GET'
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          return data as ExternalGeneMetadata;
        }
      }
    } catch {
      // Offline fallback
    }
    return null;
  }

  async fetchExternalVariant(rsid: string): Promise<VariantAnnotation | null> {
    try {
      const res = await fetch(`${this.baseUrl}/external/variant/${encodeURIComponent(rsid)}`, {
        method: 'GET'
      });
      if (res.ok) {
        return (await res.json()) as VariantAnnotation;
      }
    } catch {
      // Offline fallback
    }
    return null;
  }

  async annotateBystandersWithClinVar(
    geneSymbol: string,
    bystanders: BystanderEdit[]
  ): Promise<BystanderEdit[]> {
    if (!bystanders || bystanders.length === 0) return [];
    try {
      const res = await fetch(`${this.baseUrl}/external/clinvar/annotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geneSymbol, bystanders })
      });
      if (res.ok) {
        return (await res.json()) as BystanderEdit[];
      }
    } catch {
      // Offline fallback
    }
    return bystanders;
  }

  async predictProteinEpitopes(
    sequence: string,
    allele: string,
    minScore: number = 70
  ): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/external/immunology/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence, allele, minScore })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline fallback
    }
    return [];
  }

  scanGuides(preset: GenePreset): GuideCandidate[] {
    const cacheKey = `${preset.id}:${preset.editorType}:${preset.pamVariant ?? 'SpCas9'}:${preset.mutationIndex}:${preset.sequence}`;
    const cached = this.guideCache.get(cacheKey);
    if (cached) return cached;
    return this.localFallback.scanGuides(preset);
  }

  generateCloningOligos(spacer: string): CloningOligos {
    return this.localFallback.generateCloningOligos(spacer);
  }

  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
    const cacheKey = JSON.stringify(form);
    const cached = this.lnpCache.get(cacheKey);
    if (cached) return cached;
    return this.localFallback.simulateLnpBiophysics(form);
  }

  calculateBatchMasses(
    form: LnpFormulation,
    targetVolumeMl?: number,
    mrnaConcMgMl?: number
  ): BatchMassCalculation {
    return this.localFallback.calculateBatchMasses(form, targetVolumeMl, mrnaConcMgMl);
  }

  translateSequence(seq: string): string {
    return this.localFallback.translateSequence(seq);
  }

  reverseComplement(seq: string): string {
    return this.localFallback.reverseComplement(seq);
  }

  getEpitopeHotspots(): EpitopeHotspot[] {
    return this.localFallback.getEpitopeHotspots();
  }
}

// Export default singleton instance
export const remoteBioEngineService = new RemotePythonBioEngineService('http://localhost:8000/api/v1');
export const bioEngineService: IBioEngineService = remoteBioEngineService;
