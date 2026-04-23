
import axios from 'axios';

// Instância base que poderia apontar para um real backend
const apiClient = axios.create({
  baseURL: 'https://d1lojjl65isqhs.cloudfront.net/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
    const data = localStorage.getItem('bolao_user');
    if (data && config.headers) {
        try {
            const user = JSON.parse(data);
            const userId = user.id || user.Id;
            if (userId) {
                config.headers['X-User-Id'] = userId.toString();
            }
        } catch (e) {}
    }
    return config;
});

export default apiClient;