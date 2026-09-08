<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * PREVENT INERTIA JSON FROM BEING CACHED AND SERVED AS A DOCUMENT
 * =============================================================================
 * THE BUG THIS FIXES
 *
 * Every Inertia URL returns TWO different responses from the same address:
 *
 *   - a normal browser navigation  -> text/html   (the full page)
 *   - a request with X-Inertia: true -> application/json (page props only)
 *
 * Inertia distinguishes them with a `Vary: X-Inertia` response header, which
 * tells every cache "these are different documents, store them separately".
 *
 * If ANY cache in the chain ignores that header — a CDN, a reverse proxy, or
 * LiteSpeed's LSCache, which is enabled by default on most shared hosting —
 * it stores the JSON variant under the plain URL. The next ordinary page load
 * is then answered from cache with `Content-Type: application/json`, and the
 * browser does the only thing it can: renders the raw JSON as text.
 *
 * That is exactly the failure being reported — a screen full of
 * {"component":"LandingPage/Landing","props":{...}} at the site root.
 *
 * It appears TIME-DEPENDENT ("after three or four minutes") because it is
 * governed by the cache's TTL, not by anything in the application. That is
 * also why waiting does not help and why it comes back after a hard refresh:
 * nothing in the code is counting seconds. A cache entry is expiring and
 * being repopulated with the wrong variant.
 *
 * WHAT THIS MIDDLEWARE DOES
 *
 * Marks every Inertia JSON response as private and non-storable, so no cache
 * anywhere in the chain may keep it, regardless of whether that cache honours
 * Vary. It also re-asserts the Vary header for caches that DO honour it.
 *
 * This is belt and braces on purpose. A single misconfigured cache layer
 * anywhere between the app and the browser reproduces the bug, and on shared
 * hosting you do not control all of them.
 *
 * REGISTER IT in bootstrap/app.php, BEFORE HandleInertiaRequests:
 *
 *     $middleware->web(append: [
 *         \App\Http\Middleware\CheckInstallation::class,
 *         \App\Http\Middleware\PreventInertiaCaching::class,   // <-- add
 *         \App\Http\Middleware\HandleInertiaRequests::class,
 *         ...
 *     ]);
 *
 * The .htaccess change shipped alongside this is the other half of the fix —
 * this header tells caches not to store the response; the .htaccess rule stops
 * LiteSpeed caching the application at all.
 */
class PreventInertiaCaching
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        /*
         * Vary is asserted on EVERY response from these routes, not only the
         * JSON ones. A cache has to be told that the HTML variant is also
         * keyed on X-Inertia, or it will happily serve the stored HTML in
         * answer to an XHR — the same bug in the opposite direction, which
         * shows up as an Inertia "page expired" loop rather than raw JSON.
         */
        $existingVary = $response->headers->get('Vary');
        if (!$existingVary) {
            $response->headers->set('Vary', 'X-Inertia');
        } elseif (!str_contains($existingVary, 'X-Inertia')) {
            $response->headers->set('Vary', $existingVary . ', X-Inertia');
        }

        // The JSON variant must never be stored anywhere.
        if ($request->header('X-Inertia')) {
            $response->headers->set(
                'Cache-Control',
                'no-store, no-cache, must-revalidate, private, max-age=0'
            );
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');

            // LiteSpeed reads its own header and ignores Cache-Control in some
            // configurations, so it is told separately.
            $response->headers->set('X-LiteSpeed-Cache-Control', 'no-cache');
        }

        /*
         * Authenticated HTML pages are not cacheable either. They contain a
         * per-session CSRF token and per-user data; a shared cache serving one
         * user's page to another is a security problem, not just a display one.
         */
        if ($request->user()) {
            $response->headers->set(
                'Cache-Control',
                'no-store, no-cache, must-revalidate, private, max-age=0'
            );
            $response->headers->set('X-LiteSpeed-Cache-Control', 'no-cache');
        }

        return $response;
    }
}
