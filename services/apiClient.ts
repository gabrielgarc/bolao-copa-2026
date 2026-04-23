
import axios from 'axios';

// Instância base que poderia apontar para um real backend
const apiClient = axios.create({
  baseURL: 'http://bolao-2026.eba-84zczwn3.us-east-1.elasticbeanstalk.com/api',
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