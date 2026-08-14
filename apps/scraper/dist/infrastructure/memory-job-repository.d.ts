import type { JobRepository } from '../domain/contracts.js';
import type { ExtractionJob, ExtractionRequest, ExtractionResult, JobStage } from '../domain/model.js';
export declare class MemoryJobRepository implements JobRepository {
    private readonly ttlMs;
    private readonly jobs;
    private readonly keys;
    constructor(ttlMs: number);
    createOrGet(request: ExtractionRequest): Promise<{
        job: ExtractionJob;
        created: boolean;
    }>;
    get(id: string): Promise<ExtractionJob | undefined>;
    claimNext(maxAttempts: number): Promise<ExtractionJob | undefined>;
    setStage(id: string, stage: JobStage): Promise<void>;
    succeed(id: string, result: ExtractionResult): Promise<void>;
    fail(id: string, code: string, retry: boolean): Promise<void>;
    private mutate;
    private prune;
}
