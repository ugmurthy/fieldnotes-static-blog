export interface SearchEntry {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
}

export function searchPosts(entries: SearchEntry[], query: string): SearchEntry[] {
  const terms = [...new Set(query.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean))];
  if (!terms.length) return [];
  return entries.map((entry, order) => {
    const fields = [entry.title, entry.keywords.join(' '), entry.description]
      .map((field) => field.normalize('NFKC').toLowerCase());
    const matches = terms.map((term) => fields.findIndex((field) => field.includes(term)));
    return { entry, order, score: matches.includes(-1) ? 0 : matches.reduce((sum, field) => sum + 3 - field, 0) };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ entry }) => entry);
}
