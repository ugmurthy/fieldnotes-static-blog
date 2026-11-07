export const topicSlug = (keyword: string) => keyword.normalize('NFKD').toLowerCase()
  .replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
export const topicPath = (keyword: string) => `topic/${encodeURIComponent(topicSlug(keyword))}/`;
