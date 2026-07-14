'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireToken } from '@/lib/auth';
import { addWatchlistItem, createWatchlist, removeWatchlistItem, searchAssets } from '@/lib/api';

/** Thin proxies to the existing, unmodified Watchlist backend (S1-003) -- no new business logic, just form-to-fetch plumbing. */

export async function createWatchlistAction(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const token = await requireToken();
  try {
    if (!name) throw new Error('Watchlist name is required');
    await createWatchlist(token, name);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create watchlist';
    redirect(`/watchlist?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/watchlist');
  redirect('/watchlist');
}

export async function addItemAction(formData: FormData): Promise<void> {
  const watchlistId = String(formData.get('watchlistId') ?? '');
  const symbol = String(formData.get('symbol') ?? '').trim();
  const token = await requireToken();
  try {
    if (!symbol) throw new Error('Symbol is required');
    const matches = await searchAssets(token, symbol);
    const asset = matches.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase()) ?? matches[0];
    if (!asset) throw new Error(`No asset found matching "${symbol}"`);
    await addWatchlistItem(token, watchlistId, asset.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add item';
    redirect(`/watchlist?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/watchlist');
  redirect('/watchlist');
}

export async function removeItemAction(formData: FormData): Promise<void> {
  const watchlistId = String(formData.get('watchlistId') ?? '');
  const assetId = String(formData.get('assetId') ?? '');
  const token = await requireToken();
  try {
    await removeWatchlistItem(token, watchlistId, assetId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove item';
    redirect(`/watchlist?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/watchlist');
  redirect('/watchlist');
}
