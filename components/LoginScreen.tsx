import React, { useState } from 'react';
import { PixelCard, PixelButton } from './PixelComponents';
import { UserService } from '../services/userService';
import { UserModel } from '../models/user.model';
import { AvatarEditor } from './AvatarEditor';

interface LoginScreenProps {
    onLoginSuccess: (user: UserModel) => void;
}

type Mode = 'login' | 'register' | 'forgot';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<Mode>('login');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [avatarConfig, setAvatarConfig] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (mode === 'login') {
            if (!userName || !password) return setError('Preencha os campos!');
        } else if (mode === 'register') {
            if (!userName || !password || !token || !name) return setError('Preencha os campos, nome e o token!');
            if (password !== confirmPassword) return setError('Senha não coincide!');
        } else if (mode === 'forgot') {
            if (!token || !password) return setError('Preencha o token e a nova senha!');
            if (password !== confirmPassword) return setError('Senha não coincide!');
        }

        setIsLoading(true);
        try {
            if (mode === 'login') {
                const user = await UserService.login(userName, password);
                onLoginSuccess(user);
            } else if (mode === 'register') {
                const trimmedUser = userName.trim();
                const trimmedName = name.trim();
                if (!trimmedUser || !trimmedName) return setError('Preencha o usuário e o nome!');
                const user = await UserService.create(trimmedUser, password, avatarConfig || "user-ronaldo", token, trimmedName);
                onLoginSuccess(user);
            } else if (mode === 'forgot') {
                await UserService.resetPassword(token, password);
                setSuccessMsg('Senha alterada! Agora você pode entrar.');
                setMode('login');
                setPassword('');
                setConfirmPassword('');
                setToken('');
            }
        } catch (err: any) {
            const msg = err.response?.data || err.message || 'Erro de conexão';
            if (typeof msg === 'string') setError(msg);
            else setError('Erro interno');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 md:p-8">
            <PixelCard className={`w-full transition-all duration-300 ${mode === 'register' ? 'max-w-4xl' : 'max-w-sm'}`}>
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
                    {mode === 'login' ? 'Acesse o Bolão' : mode === 'register' ? 'Inscreva-se Agora' : 'Recuperar Senha'}
                </h1>

                <div className="flex mb-6 border-b-4 border-black max-w-sm mx-auto overflow-hidden text-xs">
                    <button
                        type="button"
                        className={`flex-1 py-2 font-bold uppercase transition duration-200 ${mode !== 'register' ? 'bg-yellow-400 border-x-4 border-black border-t-4 translate-y-[4px] text-black' : 'bg-gray-400 border-x-4 border-transparent border-t-4 text-gray-700 hover:text-black'}`}
                        onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); setName(''); }}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 font-bold uppercase transition duration-200 ${mode === 'register' ? 'bg-yellow-400 border-x-4 border-black border-t-4 translate-y-[4px] text-black' : 'bg-gray-400 border-x-4 border-transparent border-t-4 text-gray-700 hover:text-black'}`}
                        onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); setName(''); }}
                    >
                        Novo
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className={`flex flex-col ${mode === 'register' ? 'md:flex-row md:gap-8' : ''}`}>
                        
                        {/* Left Column (or full width if login/forgot) */}
                        <div className="flex-1 flex flex-col gap-4 max-w-sm mx-auto w-full">
                            {error && (
                                <div className="bg-red-500 text-white p-2 border-2 text-xs border-black text-center font-bold">
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="bg-green-500 text-white p-2 border-2 text-xs border-black text-center font-bold">
                                    {successMsg}
                                </div>
                            )}

                            {(mode === 'register' || mode === 'forgot') && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] md:text-xs font-bold uppercase text-black">Token de Cadastro:</label>
                                    <input
                                        type="text"
                                        className="bg-white border-4 border-black p-2 text-sm md:text-base font-bold outline-none focus:bg-yellow-100 text-black uppercase"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value.toUpperCase())}
                                        maxLength={8}
                                        placeholder="EX: ABCD1234"
                                    />
                                </div>
                            )}

                            {mode === 'register' && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] md:text-xs font-bold uppercase text-black">Nome:</label>
                                    <input
                                        type="text"
                                        className="bg-white border-4 border-black p-2 text-sm md:text-base font-bold outline-none focus:bg-yellow-100 text-black"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        maxLength={40}
                                        placeholder="Ex: Gabriel Garcia"
                                    />
                                </div>
                            )}

                            {(mode === 'login' || mode === 'register') && (
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
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] md:text-xs font-bold uppercase text-black">{mode === 'forgot' ? 'Nova Senha:' : 'Senha:'}</label>
                                <input
                                    type="password"
                                    className="bg-white border-4 border-black p-2 text-sm md:text-base font-bold outline-none focus:bg-yellow-100 text-black"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {(mode === 'register' || mode === 'forgot') && (
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

                            {mode === 'login' && (
                                <div className="flex flex-col gap-2 mt-4">
                                    <div className="text-right">
                                        <button 
                                            type="button" 
                                            onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                                            className="text-[10px] font-bold uppercase text-gray-500 hover:text-gray-700 underline"
                                        >
                                            Esqueci minha senha
                                        </button>
                                    </div>
                                    <PixelButton variant="action" className="w-full text-center flex justify-center text-sm" disabled={isLoading} onClick={(e: any) => null}>
                                        {isLoading ? 'Wait...' : 'Entrar'}
                                    </PixelButton>
                                </div>
                            )}

                            {mode === 'forgot' && (
                                <div className="flex flex-col gap-2 mt-4">
                                    <div className="text-right">
                                        <button 
                                            type="button" 
                                            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                                            className="text-[10px] font-bold uppercase text-gray-500 hover:text-gray-700 underline"
                                        >
                                            Voltar ao login
                                        </button>
                                    </div>
                                    <PixelButton variant="action" className="w-full text-center flex justify-center text-sm" disabled={isLoading} onClick={(e: any) => null}>
                                        {isLoading ? 'Wait...' : 'Alterar Senha'}
                                    </PixelButton>
                                </div>
                            )}
                        </div>

                        {/* Right Column (Avatar Editor) */}
                        {mode === 'register' && (
                            <div className="flex-[1.5] w-full">
                                <AvatarEditor onChange={setAvatarConfig} />
                            </div>
                        )}
                    </div>
                    
                    {mode === 'register' && (
                        <div className="flex justify-center max-w-sm mx-auto w-full">
                            <PixelButton variant="action" className="w-full text-center flex justify-center text-sm md:text-base md:py-3" disabled={isLoading} onClick={(e: any) => null}>
                                {isLoading ? 'Wait...' : 'Criar Conta'}
                            </PixelButton>
                        </div>
                    )}
                </form>
            </PixelCard>

            <div className="mt-8 text-center font-bold text-white/70 uppercase text-[10px] md:text-xs tracking-wider drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                Criado por Gabriel Garcia
            </div>
        </div>
    );
};
