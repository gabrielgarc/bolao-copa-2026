import apiClient from './apiClient';

export const AdminService = {
    async mockNextMatch() {
        const response = await apiClient.post('/Admin/mock/next');
        return response.data;
    },
    async clearMock() {
        const response = await apiClient.delete('/Admin/mock/clear');
        return response.data;
    }
};
