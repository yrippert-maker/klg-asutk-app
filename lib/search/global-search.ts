export interface SearchResult { id: string; title: string; type: string; url: string; snippet?: string; score?: number; [key: string]: any; }
export function globalSearch(...a: any[]): SearchResult[] { return []; }
export function getSearchSuggestions(...a: any[]): string[] { return []; }
export default { globalSearch, getSearchSuggestions };
