import type { Extractor, JobRepository } from '../domain/contracts.js';
export declare class Worker {
    private readonly repository;
    private readonly extractor;
    private readonly options;
    private stopped;
    private readonly running;
    private readonly controllers;
    private scheduler;
    private timer?;
    constructor(repository: JobRepository, extractor: Extractor, options: {
        concurrency: number;
        maxAttempts: number;
        timeoutMs: number;
    });
    start(): void;
    private scheduleNow;
    private tick;
    private process;
    stop(): Promise<void>;
}
