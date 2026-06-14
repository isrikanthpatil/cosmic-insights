import { pb } from '@/utils/pocketbase';

/**
 * Live place-of-birth autocomplete backed by the PocketBase `places`
 * collection (~558k rows). Returns up to 8 display strings of the form
 * "Name, State". Errors (including request auto-cancellation) resolve to [].
 */
export async function searchPlaces(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }

  try {
    const res = await pb.collection('places').getList(1, 8, {
      filter: pb.filter('name ~ {:q}', { q }),
      sort: 'name',
      skipTotal: true,
      requestKey: 'placeSearch', // auto-cancels the previous in-flight search
    });

    const seen = new Set<string>();
    const results: string[] = [];
    for (const item of res.items as any[]) {
      const name = item?.name ?? '';
      const state = item?.state ?? '';
      const display = name + (state ? ', ' + state : '');
      if (!seen.has(display)) {
        seen.add(display);
        results.push(display);
      }
    }
    return results.slice(0, 8);
  } catch {
    // Includes auto-cancellation of superseded searches — fail silently.
    return [];
  }
}
