import type { BrowserManager } from '../browser/browser-manager.js';
import type { Extractor } from '../domain/contracts.js';
import type { ExtractionResult } from '../domain/model.js';
export declare class ShopeeExtractor implements Extractor {
    private readonly browsers;
    private readonly navigationTimeout;
    constructor(browsers: BrowserManager, navigationTimeout: number);
    extract(url: string, signal: AbortSignal, onStage: (stage: 'navigating' | 'extracting') => Promise<void>): Promise<ExtractionResult>;
}
