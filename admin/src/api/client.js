import axios from 'axios';

// Usamos una ruta relativa para que Vite actúe como proxy en desarrollo (localhost:5173 -> 3001)
// o tome el dominio actual en producción.
export const getStoreId = () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('storeId') || params.get('store_id');
    if (id) {
        localStorage.setItem('hache_store_id', id);
        return id;
    }
    return localStorage.getItem('hache_store_id') || '';
};

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

apiClient.interceptors.request.use(config => {
    const storeId = getStoreId();
    if (storeId) {
        config.headers['x-store-id'] = storeId;
    }
    return config;
});

export const configAPI = {
    get: () => apiClient.get('/api/config'),
    update: (data) => apiClient.patch('/api/config', data), // PATCH por defefecto (merge)
    replace: (data) => apiClient.put('/api/config', data),  // PUT si se quiere pisar todo
};

export const productsAPI = {
    getAll: () => apiClient.get('/api/products?limit=2000&page=1'),
    getCategories: () => apiClient.get('/api/categories'),
};

export const analyticsAPI = {
    getStats: (days = 30) => apiClient.get(`/api/track/stats?days=${days}`),
};

export default apiClient;
