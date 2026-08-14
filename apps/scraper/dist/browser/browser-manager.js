import { chromium } from 'playwright';
export class BrowserManager {
    headless;
    executablePath;
    browser;
    launchPromise;
    constructor(headless, executablePath) {
        this.headless = headless;
        this.executablePath = executablePath;
    }
    async context() {
        if (!this.browser?.isConnected()) {
            this.launchPromise ??= chromium.launch({ headless: this.headless, ...(this.executablePath ? { executablePath: this.executablePath } : {}) });
            try {
                this.browser = await this.launchPromise;
            }
            finally {
                this.launchPromise = undefined;
            }
        }
        return this.browser.newContext({ acceptDownloads: false, serviceWorkers: 'block', locale: 'id-ID' });
    }
    async close() {
        const browser = this.browser ?? await this.launchPromise;
        await browser?.close();
        this.browser = undefined;
        this.launchPromise = undefined;
    }
}
//# sourceMappingURL=browser-manager.js.map