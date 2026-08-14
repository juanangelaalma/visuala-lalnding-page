import { randomUUID } from 'node:crypto';
import { SafeError } from '../domain/errors.js';
export class MemoryJobRepository {
    ttlMs;
    jobs = new Map();
    keys = new Map();
    constructor(ttlMs) {
        this.ttlMs = ttlMs;
    }
    async createOrGet(request) {
        this.prune();
        const existingId = this.keys.get(request.idempotencyKey);
        if (existingId) {
            const existing = this.jobs.get(existingId);
            const inputMatches = existing.requestRef === request.requestRef &&
                existing.marketplace === request.marketplace &&
                existing.url === request.url;
            if (!inputMatches) {
                throw new SafeError('IDEMPOTENCY_CONFLICT');
            }
            return { job: structuredClone(existing), created: false };
        }
        const now = new Date().toISOString();
        const job = {
            ...request,
            id: randomUUID(),
            status: 'queued',
            stage: 'queued',
            attempts: 0,
            createdAt: now,
            updatedAt: now,
        };
        this.jobs.set(job.id, job);
        this.keys.set(request.idempotencyKey, job.id);
        return { job: structuredClone(job), created: true };
    }
    async get(id) {
        this.prune();
        const job = this.jobs.get(id);
        return job && structuredClone(job);
    }
    async claimNext(maxAttempts) {
        const job = [...this.jobs.values()].find((candidate) => candidate.status === 'queued' && candidate.attempts < maxAttempts);
        if (!job) {
            return undefined;
        }
        Object.assign(job, {
            status: 'processing',
            attempts: job.attempts + 1,
            updatedAt: new Date().toISOString(),
        });
        return structuredClone(job);
    }
    async setStage(id, stage) {
        this.mutate(id, { stage });
    }
    async succeed(id, result) {
        this.mutate(id, { status: 'succeeded', stage: 'complete', result });
        const job = this.jobs.get(id);
        if (job) {
            delete job.errorCode;
        }
    }
    async fail(id, code, retry) {
        const nextState = retry
            ? { status: 'queued', stage: 'queued' }
            : { status: 'failed', stage: 'complete', errorCode: code };
        this.mutate(id, nextState);
        const job = this.jobs.get(id);
        if (retry && job) {
            delete job.errorCode;
        }
    }
    mutate(id, patch) {
        const job = this.jobs.get(id);
        if (job) {
            Object.assign(job, patch, { updatedAt: new Date().toISOString() });
        }
    }
    prune() {
        const cutoff = Date.now() - this.ttlMs;
        for (const [id, job] of this.jobs) {
            const terminal = job.status === 'succeeded' || job.status === 'failed';
            if (terminal && Date.parse(job.updatedAt) < cutoff) {
                this.jobs.delete(id);
                this.keys.delete(job.idempotencyKey);
            }
        }
    }
}
//# sourceMappingURL=memory-job-repository.js.map