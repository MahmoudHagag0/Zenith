import { NextResponse } from 'next/server';
import { ApiError, askReasoning } from '@/lib/api';
import { requireToken } from '@/lib/auth';

/**
 * Thin server-side proxy to `POST /reasoning/ask` (Blueprint Step 8) --
 * exists only so the browser-side question form can reach `apps/api`
 * without a cross-origin request, matching the existing `/api/login`
 * proxy convention. No reasoning logic of its own; the structured
 * response returned below is exactly what `apps/api` produced.
 */
export async function POST(request: Request) {
  const token = await requireToken();
  const { question, assetId, portfolioId } = await request.json();
  try {
    const response = await askReasoning(token, { question, assetId, portfolioId });
    return NextResponse.json({ ok: true, response });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Reasoning request failed' }, { status });
  }
}
