/**
 * Triggers on-demand Data Cache invalidation on the Next.js frontend
 * after a mutation (product create/update/delete/visibility toggle,
 * and similarly for categories/collections/homepage content).
 *
 * Deliberately fire-and-forget:
 *  - never awaited by the caller, so it can't slow down the admin's
 *    mutation response
 *  - never throws, so a network blip or misconfigured env var can't
 *    fail the mutation itself
 *  - if it doesn't arrive, the frontend's homepage cache still
 *    self-heals on its normal revalidate window (see
 *    frontend/src/lib/api/products.ts) — this is an optimization,
 *    not a correctness dependency
 *
 * Requires FRONTEND_REVALIDATE_URL and REVALIDATE_SECRET to be set;
 * if either is missing this silently no-ops (so local/dev setups
 * without a frontend running don't need to configure it).
 */
export const revalidateFrontendCache = (tag = 'products') => {
    const frontendRevalidateUrl = process.env.FRONTEND_REVALIDATE_URL;
    const secret = process.env.REVALIDATE_SECRET;

    if (!frontendRevalidateUrl || !secret) return;

    const url = `${frontendRevalidateUrl}?secret=${encodeURIComponent(secret)}&tag=${encodeURIComponent(tag)}`;

    fetch(url, { method: 'POST', signal: AbortSignal.timeout(5000) })
        .then((res) => {
            if (!res.ok) {
                console.error(`revalidateFrontendCache: frontend responded ${res.status} for tag "${tag}"`);
            }
        })
        .catch((error) => {
            console.error(`revalidateFrontendCache: request failed (non-fatal) for tag "${tag}":`, error.message);
        });
};
