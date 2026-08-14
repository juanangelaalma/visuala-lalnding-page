import { z } from 'zod';
export declare const ConfigSchema: z.ZodObject<{
    SCRAPER_API_KEY: z.ZodString;
    HOST: z.ZodDefault<z.ZodString>;
    PORT: z.ZodDefault<z.ZodNumber>;
    HEADLESS: z.ZodEffects<z.ZodDefault<z.ZodEnum<["true", "false"]>>, boolean, "false" | "true" | undefined>;
    PLAYWRIGHT_EXECUTABLE_PATH: z.ZodOptional<z.ZodString>;
    JOB_TIMEOUT_MS: z.ZodDefault<z.ZodNumber>;
    NAVIGATION_TIMEOUT_MS: z.ZodDefault<z.ZodNumber>;
    MAX_ATTEMPTS: z.ZodDefault<z.ZodNumber>;
    CONCURRENCY: z.ZodDefault<z.ZodNumber>;
    RESULT_TTL_MS: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    HEADLESS: boolean;
    SCRAPER_API_KEY: string;
    HOST: string;
    PORT: number;
    JOB_TIMEOUT_MS: number;
    NAVIGATION_TIMEOUT_MS: number;
    MAX_ATTEMPTS: number;
    CONCURRENCY: number;
    RESULT_TTL_MS: number;
    PLAYWRIGHT_EXECUTABLE_PATH?: string | undefined;
}, {
    SCRAPER_API_KEY: string;
    HEADLESS?: "false" | "true" | undefined;
    PLAYWRIGHT_EXECUTABLE_PATH?: string | undefined;
    HOST?: string | undefined;
    PORT?: number | undefined;
    JOB_TIMEOUT_MS?: number | undefined;
    NAVIGATION_TIMEOUT_MS?: number | undefined;
    MAX_ATTEMPTS?: number | undefined;
    CONCURRENCY?: number | undefined;
    RESULT_TTL_MS?: number | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare const loadConfig: (environment?: NodeJS.ProcessEnv) => {
    HEADLESS: boolean;
    SCRAPER_API_KEY: string;
    HOST: string;
    PORT: number;
    JOB_TIMEOUT_MS: number;
    NAVIGATION_TIMEOUT_MS: number;
    MAX_ATTEMPTS: number;
    CONCURRENCY: number;
    RESULT_TTL_MS: number;
    PLAYWRIGHT_EXECUTABLE_PATH?: string | undefined;
};
