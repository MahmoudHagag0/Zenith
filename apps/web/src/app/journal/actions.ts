'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireToken } from '@/lib/auth';
import { createJournalEntry, deleteJournalEntry } from '@/lib/api';

/** Thin proxies to the new Journal backend (S1-029) -- no business logic, just form-to-fetch plumbing, matching the existing Watchlist/Portfolio action conventions. */

export async function createJournalEntryAction(formData: FormData): Promise<void> {
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '').trim();
  const transactionId = String(formData.get('transactionId') ?? '').trim();
  const tags = tagsRaw ? tagsRaw.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
  const token = await requireToken();
  try {
    if (!title) throw new Error('Title is required');
    if (!content) throw new Error('Content is required');
    await createJournalEntry(token, { title, content, tags, transactionId: transactionId || undefined });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create journal entry';
    redirect(`/journal?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/journal');
  redirect('/journal');
}

export async function deleteJournalEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const token = await requireToken();
  try {
    await deleteJournalEntry(token, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete journal entry';
    redirect(`/journal?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/journal');
  redirect('/journal');
}
