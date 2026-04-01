import React, { useState } from 'react';
import { PixelCard, PixelButton } from './PixelComponents';
import { UserService } from '../services/userService';
import { UserModel } from '../models/user.model';

interface LoginScreenProps {
    onLoginSuccess: (user: UserModel) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!userName || !password) {
            setError('Preencha os campos!');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError('Senha não coincide!');
            return;
        }

        setIsLoading(true);
        try {
            let user;
            if (isLogin) {
                user = await UserService.login(userName, password);
            } else {
                user = await UserService.create(userName, password);
            }
            onLoginSuccess(user);
        } catch (err: any) {
            const msg = err.response?.data || err.message || 'Erro de conexão';
            if (typeof msg === 'string') setError(msg);
            else setError('Erro interno');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <PixelCard className="w-full max-w-sm">
                <div className="flex flex-col items-center justify-center mb-6">
                    <h2 
                        className="text-2xl md:text-4xl text-center uppercase text-yellow-400 drop-shadow-[5px_5px_0_rgba(0,0,0,1)] tracking-tighter leading-relaxed"
                        style={{ fontFamily: "'Press Start 2P', cursive" }}
                    >
                        BOLÃO DA<br/>
                        <span className="text-green-500">COPA 26</span>
                    </h2>
                </div>

                <h1 className="text-sm md:text-base text-center font-bold mb-4 uppercase drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)] text-gray-700">
                    {isLogin ? 'Acesse o Bolão' : 'Inscreva-se Agora'}
                </h1>

                <div className="flex mb-6 border-b-4 border-black">
                    <button
                        type="button"
                        className={`flex-1 py-2 font-bold uppercase text-xs transition duration-200 ${isLogin ? 'bg-yellow-400 border-x-4 border-black border-t-4 translate-y-[4px] text-black' : 'bg-gray-400 border-x-4 border-transparent border-t-4 text-gray-700 hover:text-black'}`}
                        onClick={() => { setIsLogin(true); setError(''); }}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 font-bold uppercase text-xs transition duration-200 ${!isLogin ? 'bg-yellow-400 border-x-4 border-black border-t-4 translate-y-[4px] text-black' : 'bg-gray-400 border-x-4 border-transparent border-t-4 text-gray-700 hover:text-black'}`}
                        onClick={() => { setIsLogin(false); setError(''); }}
                    >
                        Novo
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="bg-red-500 text-white p-2 border-2 text-xs border-black text-center font-bold">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] md:text-xs font-bold uppercase text-black">Usuário:</label>
                        <input
                            type="text"
                            className="bg-white border-4 border-black p-2 text-sm md:text-base font-bold outline-none focus:bg-yellow-100 text-black"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            maxLength={20}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] md:text-xs font-bold uppercase text-black">Senha:</label>
                        <input
                            type="password"
                            className="bg-white border-4 border-black p-2 text-sm md:text-base font-bold outline-none focus:bg-yellow-100 text-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {!isLogin && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] md:text-xs font-bold uppercase text-black">Repita a Senha:</label>
                            <input
                                type="password"
                                className="bg-white border-4 border-black p-2 text-sm md:text-base font-bold outline-none focus:bg-yellow-100 text-black"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="mt-4 flex justify-center">
                        <PixelButton variant="action" className="w-full text-center flex justify-center text-sm" disabled={isLoading} onClick={(e: any) => null}>
                            {isLoading ? 'Wait...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                        </PixelButton>
                    </div>
                </form>
            </PixelCard>

            <div className="mt-8 text-center font-bold text-white/70 uppercase text-[10px] md:text-xs tracking-wider drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                Criado por Gabriel Garcia
            </div>
        </div>
    );
};
