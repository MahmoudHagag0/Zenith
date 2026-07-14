'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireToken } from '@/lib/auth';
import { createPortfolio } from '@/lib/api';

/** Thin proxy to the existing, unmodified Portfolios backend (S1-004) -- no new business logic. */
export async function createPortfolioAction(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const token = await requireToken();
  try {
    if (!name) throw new Error('Portfolio name is required');
    await createPortfolio(token, name);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create portfolio';
    redirect(`/portfolio?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/portfolio');
  redirect('/portfolio');
}
