import type { JobRepository } from '../domain/contracts.js';
import type { ExtractionJob, ExtractionRequest } from '../domain/model.js';
export declare const createExtraction: (repository: JobRepository, request: ExtractionRequest) => Promise<{
    job: ExtractionJob;
    created: boolean;
}>;
export declare const getExtraction: (repository: JobRepository, id: string) => Promise<ExtractionJob | undefined>;
export declare const toJobDto: (job: ExtractionJob) => {
    error?: {
        code: string;
    };
    result?: import("../domain/model.js").ExtractionResult;
    id: string;
    requestRef: string;
    marketplace: "shopee";
    status: import("../domain/model.js").JobStatus;
    stage: import("../domain/model.js").JobStage;
    attempts: number;
    createdAt: string;
    updatedAt: string;
};
