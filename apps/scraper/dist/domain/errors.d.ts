export declare class SafeError extends Error {
    readonly code: string;
    readonly retryable: boolean;
    constructor(code: string, message?: string, retryable?: boolean);
}
export declare const safeCode: (error: unknown) => string;
