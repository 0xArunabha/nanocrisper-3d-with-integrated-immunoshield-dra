// src/engines/service.ts
import type {
  IBioEngineService,
  GenePreset,
  GuideCandidate,
  CloningOligos,
  LnpFormulation,
  LnpBiophysicsResult,
  BatchMassCalculation,
  EpitopeHotspot
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
    const cacheKey = `${preset.id}:${preset.editorType}:${preset.mutationIndex}:${preset.sequence}`;
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

  scanGuides(preset: GenePreset): GuideCandidate[] {
    const cacheKey = `${preset.id}:${preset.editorType}:${preset.mutationIndex}:${preset.sequence}`;
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
