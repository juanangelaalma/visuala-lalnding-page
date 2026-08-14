import { type BrowserContext } from 'playwright';
export declare class BrowserManager {
    private readonly headless;
    private readonly executablePath?;
    private browser;
    private launchPromise;
    constructor(headless: boolean, executablePath?: string | undefined);
    context(): Promise<BrowserContext>;
    close(): Promise<void>;
}
