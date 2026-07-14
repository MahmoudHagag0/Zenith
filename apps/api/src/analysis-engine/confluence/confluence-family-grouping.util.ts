/**
 * Groups any array of entries carrying a `methodologyFamily` field into
 * per-family arrays (S1-012 Sprint Brief, Scope item 6; ADR-007) — reads
 * the field only, never assigns or edits it. Providers with no declared
 * family, or a family shared by no other participating Provider, form a
 * singleton group of their own. Generic over the entry shape so the same
 * grouping logic serves both whole-Provider-output grouping and
 * per-dimension contribution grouping (`confluence-dimension-aggregator.util.ts`).
 */
export function groupByFamily<T extends { readonly methodologyFamily?: string }>(entries: readonly T[]): T[][] {
  const groups = new Map<string, T[]>();
  const singletons: T[][] = [];

  for (const entry of entries) {
    if (!entry.methodologyFamily) {
      singletons.push([entry]);
      continue;
    }
    const existing = groups.get(entry.methodologyFamily);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(entry.methodologyFamily, [entry]);
    }
  }

  return [...groups.values(), ...singletons];
}
