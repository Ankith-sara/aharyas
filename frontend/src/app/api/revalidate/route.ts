import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand Data Cache invalidation for tagged fetches (see
 * lib/api/products.ts). The backend calls this after a product
 * mutation (add/edit/remove/toggle-visibility) so the homepage
 * updates immediately instead of waiting out its revalidate window.
 *
 * This is a deliberately thin, backend-driven trigger rather than a
 * direct admin -> frontend coupling: admin and frontend are separate
 * Vercel deployments, and the backend is the one system that already
 * knows about every mutation regardless of which client made it.
 * See backend/services/CacheRevalidationService.js for the caller.
 *
 * If this call never arrives (network blip, misconfigured env var,
 * etc.), the homepage still self-heals within its normal 5 minute
 * revalidate window — this route is an optimization, not a
 * correctness requirement.
 *
 * POST /api/revalidate?secret=<REVALIDATE_SECRET>&tag=products
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const tag = request.nextUrl.searchParams.get('tag') || 'products';

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ success: false, message: 'Invalid or missing secret' }, { status: 401 });
  }

  revalidateTag(tag);

  return NextResponse.json({ success: true, revalidated: true, tag, now: Date.now() });
}
