import "./bootstrap";
import "../css/app.css";
import "../css/rtl.css";
import "./i18n";

import { createRoot } from "react-dom/client";
import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { Suspense } from "react";
import axios from "axios";


/*
 * CSRF TOKEN REFRESH
 * -----------------------------------------------------------------------------
 * REWRITTEN. The previous implementation refreshed the token like this:
 *
 *     const response = await fetch(window.location.href, { method: 'GET' });
 *     const html = await response.text();
 *     ...parse the whole document with DOMParser, read the meta tag...
 *
 * Three problems with that, all of which contribute to the raw-JSON failure:
 *
 * 1. IT RE-DOWNLOADS THE ENTIRE CURRENT PAGE to read one meta tag — full HTML,
 *    every prop, every embedded payload. On the landing page that is a large
 *    response, fetched again on top of the navigation already in flight.
 *
 * 2. IT WRITES THAT RESPONSE INTO THE BROWSER HTTP CACHE under the page's own
 *    URL, using the default cache mode. Once any cache in the chain has stored
 *    the wrong variant for that URL, a later navigation can be answered with
 *    JSON instead of HTML — which is precisely the reported symptom.
 *
 * 3. THE 419 DETECTION NEVER FIRED. `event.detail.errors` is Inertia's
 *    validation error bag; it does not carry HTTP status codes, so
 *    `errors[419]` was always undefined and the retry path was dead code.
 *
 * The replacement asks the server for the token and nothing else, from a
 * dedicated endpoint, with caching explicitly disabled. It also guards against
 * concurrent calls, so a burst of failed requests triggers one refresh rather
 * than one per request.
 */

/*
 * Keep a reference to the untouched fetch BEFORE patching it, so refreshToken
 * cannot recurse into its own interceptor.
 */
const originalFetch = window.fetch.bind(window);

/** In-flight refresh, so N failed requests cause 1 fetch rather than N. */
let refreshInFlight: Promise<string | null> | null = null;

const readToken = (): string | null =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? null;

const applyToken = (token: string) => {
    document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', token);
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
};

const refreshToken = async (): Promise<string | null> => {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
        try {
            // `cache: 'no-store'` is the important part: it keeps this request
            // out of the HTTP cache entirely, so it cannot poison the entry for
            // any page URL.
            const response = await originalFetch('/csrf-token', {
                method: 'GET',
                cache: 'no-store',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) return null;

            const data = await response.json();
            if (data?.token) {
                applyToken(data.token);
                return data.token as string;
            }
            return null;
        } catch {
            return null;
        } finally {
            // Cleared on the next tick so simultaneous callers share this result.
            setTimeout(() => { refreshInFlight = null; }, 0);
        }
    })();

    return refreshInFlight;
};

router.on('before', () => {
    if (!readToken()) {
        refreshToken();
    }
});

/*
 * Inertia surfaces a 419 as an `invalid` event carrying the response, not as
 * an entry in the validation error bag. This is the listener the old code was
 * trying to write.
 */
router.on('invalid', (event: any) => {
    if (event?.detail?.response?.status === 419) {
        event.preventDefault();
        refreshToken().then(() => router.reload());
    }
});

// Global fetch interceptor — adds a fresh token to state-changing requests and
// retries once on 419.
window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [, options] = args;
    const method = (options?.method || 'GET').toUpperCase();

    if (method !== 'GET' && method !== 'HEAD') {
        const token = readToken() ?? (await refreshToken());
        if (token && options) {
            options.headers = { ...(options.headers as any), 'X-CSRF-TOKEN': token };
        }
    }

    const response = await originalFetch(...args);

    if (response.status === 419) {
        const token = await refreshToken();
        if (token && options) {
            options.headers = { ...(options.headers as any), 'X-CSRF-TOKEN': token };
            return originalFetch(...args);
        }
    }

    return response;
};

createInertiaApp({
    title: (title) => {
        const initialPage = JSON.parse(
            document.getElementById("app")?.dataset.page || "{}"
        );
        const pageProps = initialPage?.props ?? {};
        let customTitle;
        if (pageProps?.auth?.user?.type === "superadmin") {
            customTitle = pageProps?.adminAllSetting?.titleText;
        } else if (pageProps?.auth?.user?.type) {
            customTitle = pageProps?.companyAllSetting?.titleText;
        } else {
            customTitle = pageProps?.adminAllSetting?.titleText;
        }
        const appName = customTitle || import.meta.env.VITE_APP_NAME || "Laravel";
        return `${title} - ${appName}`;
    },
    resolve: (name) => {
        const allPages = {
            ...import.meta.glob('./pages/**/*.tsx'),
            ...import.meta.glob('../../packages/workdo/*/src/Resources/js/Pages/**/*.tsx')
        };

        // Try pages directory (lowercase p)
        const lowerPagePath = `./pages/${name}.tsx`;
        if (allPages[lowerPagePath]) {
            return allPages[lowerPagePath]();
        }

        // Try package pages
        const [packageName, ...pagePath] = name.split('/');
        const packagePagePath = `../../packages/workdo/${packageName}/src/Resources/js/Pages/${pagePath.join('/')}.tsx`;
        if (allPages[packagePagePath]) {
            return allPages[packagePagePath]();
        }

        throw new Error(`Page not found: ${name}`);
    },
    setup({ el, App, props }) {
        // Make props globally available
        (window as any).page = props;
        const root = createRoot(el);

        root.render(
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
            >
                <Suspense fallback={null}>
                    <App {...props} />
                </Suspense>
                <Toaster position="top-center" richColors />
            </ThemeProvider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
