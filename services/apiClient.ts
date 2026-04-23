
import axios from 'axios';

// Em desenvolvimento usa URL relativa (proxy do Vite → localhost:5000)
// Em produção usa a URL absoluta do CloudFront
const baseURL = import.meta.env.DEV
  ? '/api'
  : 'https://d1lojjl65isqhs.cloudfront.net/api';

const apiClient = axios.create({
  baseURL,
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