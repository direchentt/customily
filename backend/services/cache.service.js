const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const cache = {
    products: { data: null, lastFetch: null },
    categories: { data: null, lastFetch: null }
};

export const CacheService = {
    get(key) {
        const item = cache[key];
        if (item && item.data && item.lastFetch && (Date.now() - item.lastFetch < CACHE_DURATION)) {
            return item.data;
        }
        return null;
    },
    set(key, data) {
        cache[key] = {
            data,
            lastFetch: Date.now()
        };
    },
    clear(key) {
        if (key) cache[key] = { data: null, lastFetch: null };
        else {
            Object.keys(cache).forEach(k => cache[k] = { data: null, lastFetch: null });
        }
    }
};
