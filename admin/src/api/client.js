import axios from 'axios';

// Usamos una ruta relativa para que Vite actúe como proxy en desarrollo (localhost:5173 -> 3001)
// o tome el dominio actual en producción.
const apiClient = axios.create({
    baseURL: '',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

export const configAPI = {
    get: () => apiClient.get('/api/config'),
    update: (data) => apiClient.post('/api/config', data),
};

export const productsAPI = {
    getAll: () => apiClient.get('/api/products'),
    getCategories: () => apiClient.get('/api/categories'),
};

export const analyticsAPI = {
    getStats: (days = 30) => apiClient.get(`/api/track/stats?days=${days}`),
};

export default apiClient;
