import apiClient from './apiClient';

export const AdminService = {
    async mockNextMatch() {
        const response = await apiClient.post('/Admin/mock/next');
        return response.data;
    },
    async clearMock() {
        const response = await apiClient.delete('/Admin/mock/clear');
        return response.data;
    },
    async getTokens() {
        const response = await apiClient.get('/Admin/tokens');
        return response.data;
    },
    async generateToken(prefix: string) {
        const response = await apiClient.post('/Admin/tokens', { prefix });
        return response.data;
    },
    async getAiComment() {
        const response = await apiClient.get('/Admin/ai-comment');
        return response.data;
    }
};
