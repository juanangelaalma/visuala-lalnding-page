export const createExtraction = (repository, request) => repository.createOrGet(request);
export const getExtraction = (repository, id) => repository.get(id);
export const toJobDto = (job) => ({
    id: job.id,
    requestRef: job.requestRef,
    marketplace: job.marketplace,
    status: job.status,
    stage: job.stage,
    attempts: job.attempts,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    ...(job.result ? { result: job.result } : {}),
    ...(job.errorCode ? { error: { code: job.errorCode } } : {}),
});
//# sourceMappingURL=use-cases.js.map