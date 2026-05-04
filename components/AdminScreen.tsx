import React, { useState, useEffect } from 'react';
import { PixelButton, PixelCard, PixelInput } from './PixelComponents';
import apiClient from '../services/apiClient';

export const AdminScreen: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [users, setUsers] = useState<any[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token === 'admin-secret-token') {
            setIsAuthenticated(true);
            fetchUsers();
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/Admin/login', { username, password });
            if (response.data?.token) {
                localStorage.setItem('adminToken', response.data.token);
                setIsAuthenticated(true);
                fetchUsers();
            }
        } catch (err: any) {
            setError(err.response?.status === 401 ? 'Credenciais inválidas.' : 'Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/Admin/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Erro ao buscar usuários', err);
        }
    };

    const handleAction = async (endpoint: string, method: 'POST' | 'DELETE' = 'POST') => {
        setLoading(true);
        setMessage('');
        try {
            const response = await apiClient.request({
                url: `/Admin/${endpoint}`,
                method: method
            });
            setMessage(response.data?.message || 'Ação executada com sucesso.');
        } catch (err: any) {
            setMessage(`Erro: ${err.response?.data?.message || err.message || 'Desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <PixelCard className="max-w-sm w-full">
                    <h2 className="text-2xl font-bold uppercase text-center text-yellow-400 mb-6 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        Área Administrativa
                    </h2>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase font-bold text-gray-300 mb-1">Usuário</label>
                            <PixelInput 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full text-black"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase font-bold text-gray-300 mb-1">Senha</label>
                            <PixelInput 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full text-black"
                            />
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

                        <PixelButton type="submit" variant="primary" className="w-full" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </PixelButton>
                    </form>
                </PixelCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4 md:p-8 text-white">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-gray-800 p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h1 className="text-2xl font-bold uppercase text-yellow-400 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        Painel de Administração
                    </h1>
                    <PixelButton variant="action" onClick={() => {
                        localStorage.removeItem('adminToken');
                        setIsAuthenticated(false);
                    }}>
                        Sair
                    </PixelButton>
                </div>

                {message && (
                    <div className="bg-blue-900 text-white p-3 border-2 border-white text-sm font-bold animate-pulse">
                        ℹ️ {message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ações Rápidas */}
                    <PixelCard>
                        <h2 className="text-xl font-bold text-yellow-400 mb-4 uppercase">Simulações / Mocks</h2>
                        <div className="space-y-3">
                            <div className="bg-gray-800 p-3 border border-black space-y-2">
                                <h3 className="text-sm font-bold text-gray-300">Grupos</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(g => (
                                        <button 
                                            key={g}
                                            disabled={loading}
                                            onClick={() => handleAction(`mock/group/${g}`)}
                                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 border border-black text-xs font-bold"
                                        >
                                            Grupo {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <PixelButton 
                                variant="danger" 
                                className="w-full" 
                                disabled={loading}
                                onClick={() => handleAction('mock/clear', 'DELETE')}
                            >
                                🗑️ Limpar Todos os Mocks
                            </PixelButton>

                            <PixelButton 
                                variant="secondary" 
                                className="w-full" 
                                disabled={loading}
                                onClick={() => handleAction('clear', 'DELETE')}
                            >
                                ⚠️ Resetar Banco de Dados Oficial
                            </PixelButton>
                        </div>
                    </PixelCard>

                    {/* Usuários */}
                    <PixelCard>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-yellow-400 uppercase">Usuários ({users.length})</h2>
                            <button onClick={fetchUsers} className="text-xs text-blue-400 underline">Atualizar</button>
                        </div>
                        
                        <div className="bg-gray-800 border-2 border-black h-64 overflow-y-auto">
                            {users.map(user => (
                                <div key={user.id} className="flex justify-between items-center p-2 border-b border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-900 border border-gray-600 flex items-center justify-center text-[10px]">
                                            {user.avatar ? '👤' : '?'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-yellow-300">{user.username}</div>
                                            <div className="text-[10px] text-gray-400">{user.id}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-green-400">
                                        {user.points} pts
                                    </div>
                                </div>
                            ))}
                            {users.length === 0 && (
                                <div className="p-4 text-center text-gray-500 text-sm">Nenhum usuário encontrado.</div>
                            )}
                        </div>
                    </PixelCard>
                </div>
            </div>
        </div>
    );
};
