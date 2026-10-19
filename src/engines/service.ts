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
 * Blueprint for Year 2: Remote Python / PyTorch / BioPython Backend Service.
 * In Year 2, simply change the active service provider to an instance of this class!
 * The React UI will not require a single line of change.
 *
 * Example:
 * ```ts
 * export const activeEngine: IBioEngineService = new RemotePythonBioEngineService('http://localhost:8000/api/v1');
 * ```
 */
export class RemotePythonBioEngineService implements IBioEngineService {
  private baseUrl: string;
  private localFallback: LocalBioEngineService;

  constructor(baseUrl: string = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
    this.localFallback = new LocalBioEngineService();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  scanGuides(preset: GenePreset): GuideCandidate[] {
    // In Year 2: return await fetch(`${this.baseUrl}/crispr/scan`, { method: 'POST', body: JSON.stringify(preset) }).then(r => r.json());
    // Fallback to local heuristic if offline
    return this.localFallback.scanGuides(preset);
  }

  generateCloningOligos(spacer: string): CloningOligos {
    return this.localFallback.generateCloningOligos(spacer);
  }

  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
    // In Year 2: calls Python GROMACS / PyTorch surrogate model
    return this.localFallback.simulateLnpBiophysics(form);
  }

  calculateBatchMasses(form: LnpFormulation, targetVolumeMl?: number, mrnaConcMgMl?: number): BatchMassCalculation {
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
export const bioEngineService: IBioEngineService = new LocalBioEngineService();
