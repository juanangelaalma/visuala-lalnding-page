import { SafeError } from '../domain/errors.js';
import { detectShopeeFailure, parseShopeePayload } from './parser.js';
import { assertAllowedImageUrl, assertAllowedNavigation, assertSafeNetworkUrl, validateShopeeUrl, } from './url-policy.js';
function isProductResponse(input) {
    try {
        const url = new URL(input);
        return url.hostname === 'shopee.co.id' && /^\/api\/v4\/(?:pdp|item)\//.test(url.pathname);
    }
    catch {
        return false;
    }
}
export class ShopeeExtractor {
    browsers;
    navigationTimeout;
    constructor(browsers, navigationTimeout) {
        this.browsers = browsers;
        this.navigationTimeout = navigationTimeout;
    }
    async extract(url, signal, onStage) {
        signal.throwIfAborted();
        validateShopeeUrl(url);
        const context = await this.browsers.context();
        try {
            signal.throwIfAborted();
            await context.route('**/*', async (route) => {
                const request = route.request();
                try {
                    assertSafeNetworkUrl(request.url());
                    if (request.isNavigationRequest()) {
                        assertAllowedNavigation(request.url());
                    }
                    await route.continue();
                }
                catch {
                    await route.abort('blockedbyclient');
                }
            });
            const page = await context.newPage();
            page.setDefaultNavigationTimeout(this.navigationTimeout);
            signal.throwIfAborted();
            const candidates = [];
            const responseTasks = new Set();
            let signalProductResponse = () => { };
            const productResponseReceived = new Promise((resolve) => {
                signalProductResponse = resolve;
            });
            page.on('response', (response) => {
                const contentType = response.headers()['content-type'];
                if (!isProductResponse(response.url()) || !contentType?.includes('json')) {
                    return;
                }
                const task = response
                    .json()
                    .then((payload) => {
                    candidates.push(payload);
                    signalProductResponse();
                })
                    .catch(() => { })
                    .finally(() => responseTasks.delete(task));
                responseTasks.add(task);
            });
            signal.addEventListener('abort', () => void page.close(), { once: true });
            await onStage('navigating');
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            signal.throwIfAborted();
            assertAllowedNavigation(page.url());
            await onStage('extracting');
            await Promise.race([productResponseReceived, page.waitForTimeout(8_000)]);
            signal.throwIfAborted();
            await Promise.allSettled(responseTasks);
            for (const candidate of candidates) {
                const failure = detectShopeeFailure(candidate);
                if (failure) {
                    throw new SafeError(failure);
                }
                const result = parseShopeePayload(candidate, page.url());
                if (result) {
                    return result;
                }
            }
            if (new URL(page.url()).pathname.startsWith('/verify/')) {
                throw new SafeError('VERIFICATION_REQUIRED');
            }
            const dom = await page.evaluate(() => ({
                title: document.querySelector('h1')?.textContent?.trim() ||
                    document
                        .querySelector('meta[property="og:title"]')
                        ?.getAttribute('content'),
                description: document
                    .querySelector('meta[property="og:description"]')
                    ?.getAttribute('content') || undefined,
                images: [...document.querySelectorAll('img')]
                    .map((image) => image.currentSrc || image.src)
                    .filter((source) => source.startsWith('http'))
                    .slice(0, 40),
                canonicalUrl: document.querySelector('link[rel="canonical"]')
                    ?.href || location.href,
            }));
            assertAllowedNavigation(dom.canonicalUrl);
            const images = [...new Set(dom.images)].filter((image) => {
                try {
                    assertAllowedImageUrl(image);
                    return true;
                }
                catch {
                    return false;
                }
            });
            if (!dom.title || images.length === 0) {
                throw new SafeError('INSUFFICIENT_PRODUCT_DATA');
            }
            return {
                title: dom.title,
                images,
                canonicalUrl: dom.canonicalUrl,
                extractionMethod: 'dom',
                completeness: 'partial',
                ...(dom.description ? { description: dom.description } : {}),
            };
        }
        finally {
            await context.close();
        }
    }
}
//# sourceMappingURL=extractor.js.map