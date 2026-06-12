import React, { useEffect, useState } from 'react';
import { PixelCard } from './PixelComponents';
import { AiCommentService } from '../services/aiCommentService';
import { AiComment } from '../types';

export const AiCommentatorScreen: React.FC = () => {
    const [comments, setComments] = useState<AiComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => {
                let next;
                do {
                    next = Math.floor(Math.random() * 6) + 1;
                } while (next === prev);
                return next;
            });
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchComments = async () => {
            const data = await AiCommentService.getComments();
            setComments(data);
            setIsLoading(false);
            
            // Marca como lido (para a bolinha vermelha no menu sumir)
            if (data.length > 0) {
                localStorage.setItem('lastReadAiComment', data[0].id);
            }
        };
        fetchComments();
    }, []);

    const latestComment = comments.length > 0 ? comments[0] : null;
    const pastComments = comments.length > 1 ? comments.slice(1) : [];

    return (
        <div className="max-w-4xl mx-auto p-2 md:p-4 animate-fadeIn">
            {/* Title Section */}
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-4xl text-yellow-400 font-black uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    A Voz da Razão (Ou não)
                </h2>
                <p className="text-white font-bold uppercase text-xs md:text-sm mt-2 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
                    Nosso comentarista robótico analisa a rodada
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-white font-bold animate-pulse text-xl">Aquecendo as válvulas...</div>
                </div>
            ) : (
                <>
                    {/* Latest Comment Section */}
                    {latestComment ? (
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-12">
                            {/* Avatar */}
                            <div className="shrink-0 z-10 w-48 h-48 md:w-64 md:h-64 border-4 border-black bg-purple-900 rounded-full shadow-[8px_8px_0_rgba(0,0,0,0.5)] overflow-hidden flex items-end justify-center relative">
                                <img 
                                    src={`/robot_anim_${currentImageIndex}.png`}
                                    alt="Robô Comentarista" 
                                    className="w-[120%] h-[120%] object-cover object-top translate-y-4"
                                />
                                <div className="absolute bottom-2 bg-yellow-400 border-2 border-black px-4 py-1 font-black text-black uppercase transform -rotate-2">
                                    No Ar
                                </div>
                            </div>

                            {/* Comic Speech Bubble */}
                            <div className="relative bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,1)] flex-grow max-w-full">
                                {/* Triangle pointing to avatar (desktop: left, mobile: top) */}
                                <div className="absolute hidden md:block -left-6 top-16 w-0 h-0 border-t-[15px] border-t-transparent border-r-[25px] border-r-black border-b-[15px] border-b-transparent"></div>
                                <div className="absolute hidden md:block -left-4 top-[66px] w-0 h-0 border-t-[13px] border-t-transparent border-r-[22px] border-r-white border-b-[13px] border-b-transparent z-10"></div>
                                
                                <div className="absolute md:hidden -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-b-[25px] border-b-black border-r-[15px] border-r-transparent"></div>
                                <div className="absolute md:hidden -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[13px] border-l-transparent border-b-[22px] border-b-white border-r-[13px] border-r-transparent z-10"></div>

                                <div className="text-xs text-gray-500 font-bold mb-3 uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Última Análise: {new Date(latestComment.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                                
                                <div className="max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                                    {latestComment.content.split('\n').map((paragraph, idx) => (
                                        <p key={idx} className="text-gray-900 font-bold text-sm md:text-base leading-relaxed mb-4 last:mb-0">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-white bg-black/50 p-8 border-4 border-gray-600 rounded-xl mb-12">
                            <p className="font-bold text-xl">O estúdio está vazio.</p>
                            <p className="text-gray-400 text-sm mt-2">O comentarista ainda não fez nenhuma análise.</p>
                        </div>
                    )}

                    {/* Past Comments */}
                    {pastComments.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-yellow-400 uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,1)] mb-4 border-b-4 border-yellow-400 pb-2 inline-block">
                                Arquivo de Resenhas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pastComments.map(comment => (
                                    <PixelCard key={comment.id} className="bg-gray-100 p-4 border-4 border-black">
                                        <div className="text-[10px] text-gray-500 font-bold mb-2 uppercase">
                                            {new Date(comment.createdAt).toLocaleDateString('pt-BR')} às {new Date(comment.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="text-gray-800 text-sm italic border-l-4 border-gray-400 pl-3 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                                            {comment.content}
                                        </div>
                                    </PixelCard>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
