export class SafeError extends Error {
    code;
    retryable;
    constructor(code, message = code, retryable = false) {
        super(message);
        this.code = code;
        this.retryable = retryable;
    }
}
export const safeCode = (error) => error instanceof SafeError ? error.code : 'EXTRACTION_FAILED';
//# sourceMappingURL=errors.js.map