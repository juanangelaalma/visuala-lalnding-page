import type { ExtractionResult } from '../domain/model.js';
export declare function detectShopeeFailure(value: unknown): 'VERIFICATION_REQUIRED' | undefined;
export declare function parseShopeePayload(value: unknown, canonicalUrl: string): ExtractionResult | undefined;
