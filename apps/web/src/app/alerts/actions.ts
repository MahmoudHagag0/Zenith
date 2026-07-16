'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireToken } from '@/lib/auth';
import { createAlert, deleteAlert, searchAssets } from '@/lib/api';
import type { AlertConditionType } from '@/lib/api';

/** Thin proxies to the new Alerts backend (S1-030) -- no business logic, just form-to-fetch plumbing, matching the existing Watchlist/Journal action conventions. */

const CONDITION_TYPES: readonly AlertConditionType[] = ['DIRECTION_BULLISH', 'DIRECTION_BEARISH', 'PRICE_ABOVE', 'PRICE_BELOW'];

export async function createAlertAction(formData: FormData): Promise<void> {
  const symbol = String(formData.get('symbol') ?? '').trim();
  const conditionType = String(formData.get('conditionType') ?? '') as AlertConditionType;
  const targetPriceRaw = String(formData.get('targetPrice') ?? '').trim();
  const token = await requireToken();
  try {
    if (!symbol) throw new Error('Symbol is required');
    if (!CONDITION_TYPES.includes(conditionType)) throw new Error('A condition type is required');
    const matches = await searchAssets(token, symbol);
    const asset = matches.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase()) ?? matches[0];
    if (!asset) throw new Error(`No asset found matching "${symbol}"`);
    const needsPrice = conditionType === 'PRICE_ABOVE' || conditionType === 'PRICE_BELOW';
    const targetPrice = targetPriceRaw ? Number(targetPriceRaw) : undefined;
    if (needsPrice && (targetPrice === undefined || Number.isNaN(targetPrice))) {
      throw new Error('A target price is required for that condition');
    }
    await createAlert(token, { assetId: asset.id, conditionType, targetPrice });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create alert';
    redirect(`/alerts?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/alerts');
  redirect('/alerts');
}

export async function deleteAlertAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const token = await requireToken();
  try {
    await deleteAlert(token, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete alert';
    redirect(`/alerts?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/alerts');
  redirect('/alerts');
}
