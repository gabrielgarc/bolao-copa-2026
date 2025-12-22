
import axios from 'axios';

// Instância base que poderia apontar para um real backend
const apiClient = axios.create({
  baseURL: '/api', // Mock base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;