import { debounce } from 'lodash';

class SearchService {
  constructor() {
    this.searchCache = new Map();
    this.fuseOptions = {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'category', weight: 0.2 },
        { name: 'oemNumber', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true
    };
  }

  // Fuzzy search implementation
  fuzzySearch(query, items = []) {
    if (!query) return items;

    const cacheKey = `${query}_${items.length}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    const results = items.filter(item => {
      const searchText = `${item.name} ${item.description} ${item.category} ${item.reference || ''}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    this.searchCache.set(cacheKey, results);
    return results;
  }

  // Debounced search for performance
  debouncedSearch = debounce((query, callback) => {
    const results = this.fuzzySearch(query);
    callback(results);
  }, 300);

  // Clear cache
  clearCache() {
    this.searchCache.clear();
  }
}

export default new SearchService();
