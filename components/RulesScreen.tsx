
import React from 'react';
import { PixelCard } from './PixelComponents';

export const RulesScreen: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <PixelCard className="bg-white/95 border-gray-900 mb-8 text-gray-900">
                <div className="text-center mb-8 border-b-4 border-gray-900 pb-4">
                    <h2 className="text-2xl md:text-4xl text-gray-900 font-black uppercase tracking-tighter italic">
                        Regulamento do Bolão
                    </h2>
                    <p className="text-red-600 font-bold uppercase text-[10px] md:text-sm mt-2 tracking-widest">
                        Copa do Mundo FIFA 2026
                    </p>
                </div>

                {/* Section 1: Participation */}
                <section className="mb-10">
                    <h3 className="flex items-center gap-3 text-lg md:text-xl font-black uppercase text-gray-900 mb-4">
                        <span className="bg-yellow-400 border-2 border-black px-2 py-0.5 text-sm">1</span>
                        Participação
                    </h3>
                    <div className="bg-gray-100 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                        <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                            Cada pessoa ao entrar no bolão pagará uma taxa de <span className="font-bold text-green-700 underline">R$ 50,00</span>.
                        </p>
                        <p className="text-sm md:text-base text-red-600 font-bold uppercase italic">
                            O pagamento deverá ser realizado antes do começo da competição, caso contrário a participação será cancelada.
                        </p>

                        <div className="bg-yellow-100 border-2 border-dashed border-gray-400 p-4 rounded-sm">
                            <p className="text-xs font-bold text-gray-600 uppercase mb-2">Dados para Pagamento (PIX):</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-900">PIX (CPF):</p>
                                    <p className="text-lg font-mono text-blue-700 select-all">418.365.338-02</p>
                                    <p className="text-xs text-gray-500 italic">Gabriel de Moraes Garcia</p>
                                </div>
                                <div className="space-y-1 border-t md:border-t-0 md:border-l border-gray-300 pt-2 md:pt-0 md:pl-4">
                                    <p className="text-sm font-bold text-gray-900">Banco Itaú:</p>
                                    <p className="text-sm text-gray-800">Agência: <span className="font-mono">1618</span></p>
                                    <p className="text-sm text-gray-800">Conta Corrente: <span className="font-mono">29955-4</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Scoring */}
                <section className="mb-10">
                    <h3 className="flex items-center gap-3 text-lg md:text-xl font-black uppercase text-gray-900 mb-4">
                        <span className="bg-yellow-400 border-2 border-black px-2 py-0.5 text-sm">2</span>
                        Da Pontuação
                    </h3>
                    <div className="space-y-6">
                        <p className="text-sm md:text-base text-gray-700 italic">
                            A pontuação será baseada nos prognósticos para o resultado e o placar das partidas (tempo regulamentar + prorrogação, excluindo pênaltis).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 border-2 border-blue-900 p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                <h4 className="font-black uppercase text-blue-900 mb-2 border-b-2 border-blue-200">Critérios de Acerto</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between items-center text-gray-500 italic">
                                        <span>Apenas 1 Placar Correto</span>
                                        <span className="font-bold">+30 pts</span>
                                    </li>
                                    <li className="flex justify-between items-center">
                                        <span>Resultado (Vitória/Empate)</span>
                                        <span className="font-bold text-blue-700">+60 pts</span>
                                    </li>
                                    <li className="flex justify-between items-center">
                                        <span>Vencedor + 1 Placar</span>
                                        <span className="font-bold text-blue-700">+90 pts</span>
                                    </li>
                                    <li className="flex justify-between items-center bg-blue-200 px-1 border-y border-blue-300">
                                        <span className="font-black">Acerto em Cheio (Placar Exato)</span>
                                        <span className="font-black text-blue-900">+120 pts</span>
                                    </li>
                                    <li className="flex justify-between items-center pt-2">
                                        <span className="font-bold">Time Classificado (Mata-mata)</span>
                                        <span className="font-bold text-green-700">+50 pts/time</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gray-900 text-white p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                                <h4 className="font-black uppercase text-yellow-400 mb-2 border-b-2 border-gray-700">Exemplos (Real: 1x2)</h4>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-gray-400 uppercase">
                                            <th className="text-left py-1">Palpite</th>
                                            <th className="text-center py-1">Pontos</th>
                                            <th className="text-right py-1">Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-mono">
                                        <tr className="border-b border-gray-800">
                                            <td className="py-2 text-green-400">1 x 2</td>
                                            <td className="py-2 text-center font-bold">120</td>
                                            <td className="py-2 text-right text-[10px]">Em Cheio</td>
                                        </tr>
                                        <tr className="border-b border-gray-800">
                                            <td className="py-2 text-yellow-400">0 x 2</td>
                                            <td className="py-2 text-center font-bold">90</td>
                                            <td className="py-2 text-right text-[10px]">Vencedor + 1 Placar</td>
                                        </tr>
                                        <tr className="border-b border-gray-800">
                                            <td className="py-2">3 x 4</td>
                                            <td className="py-2 text-center font-bold">60</td>
                                            <td className="py-2 text-right text-[10px]">Apenas Vencedor</td>
                                        </tr>
                                        <tr className="border-b border-gray-800 text-gray-500">
                                            <td className="py-2">1 x 0</td>
                                            <td className="py-2 text-center font-bold">30</td>
                                            <td className="py-2 text-right text-[10px]">Apenas 1 Placar</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Weightage Table */}
                        <div className="mt-8">
                            <h4 className="font-black uppercase text-gray-900 mb-4 text-center">Pesos por Etapa</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full border-4 border-black text-xs md:text-sm">
                                    <thead>
                                        <tr className="bg-gray-900 text-white uppercase">
                                            <th className="p-2 border-2 border-black">Fase</th>
                                            <th className="p-2 border-2 border-black">Jogos</th>
                                            <th className="p-2 border-2 border-black">Peso</th>
                                            <th className="p-2 border-2 border-black">Pontuação Máx</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-center font-bold">
                                        <tr>
                                            <td className="p-2 border-2 border-black text-left">Fase de Grupos</td>
                                            <td className="p-2 border-2 border-black">72</td>
                                            <td className="p-2 border-2 border-black">x1</td>
                                            <td className="p-2 border-2 border-black">8.640</td>
                                        </tr>
                                        <tr className="bg-gray-100">
                                            <td className="p-2 border-2 border-black text-left italic">Classificados (32 times)</td>
                                            <td className="p-2 border-2 border-black">-</td>
                                            <td className="p-2 border-2 border-black">-</td>
                                            <td className="p-2 border-2 border-black text-green-700">1.600</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border-2 border-black text-left">Dezesseis-avos</td>
                                            <td className="p-2 border-2 border-black">16</td>
                                            <td className="p-2 border-2 border-black text-blue-600">x3</td>
                                            <td className="p-2 border-2 border-black">5.760</td>
                                        </tr>
                                        <tr className="bg-gray-100">
                                            <td className="p-2 border-2 border-black text-left">Oitavas de Final</td>
                                            <td className="p-2 border-2 border-black">8</td>
                                            <td className="p-2 border-2 border-black text-blue-600">x5</td>
                                            <td className="p-2 border-2 border-black">4.800</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border-2 border-black text-left">Quartas de Final</td>
                                            <td className="p-2 border-2 border-black">4</td>
                                            <td className="p-2 border-2 border-black text-blue-600">x7</td>
                                            <td className="p-2 border-2 border-black">3.360</td>
                                        </tr>
                                        <tr className="bg-gray-100">
                                            <td className="p-2 border-2 border-black text-left">Semifinais</td>
                                            <td className="p-2 border-2 border-black">2</td>
                                            <td className="p-2 border-2 border-black text-red-600 font-black">x9</td>
                                            <td className="p-2 border-2 border-black">2.160</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 border-2 border-black text-left">3º Lugar</td>
                                            <td className="p-2 border-2 border-black">1</td>
                                            <td className="p-2 border-2 border-black text-red-600 font-black">x10</td>
                                            <td className="p-2 border-2 border-black">1.200</td>
                                        </tr>
                                        <tr className="bg-yellow-400 text-black">
                                            <td className="p-2 border-2 border-black text-left font-black underline">Grande Final</td>
                                            <td className="p-2 border-2 border-black">1</td>
                                            <td className="p-2 border-2 border-black font-black">x15</td>
                                            <td className="p-2 border-2 border-black font-black">1.800</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-900 text-white font-black">
                                            <td colSpan={3} className="p-2 border-2 border-black text-right uppercase">Total Disponível</td>
                                            <td className="p-2 border-2 border-black">29.320</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Tie-breaker */}
                <section className="mb-10">
                    <h3 className="flex items-center gap-3 text-lg md:text-xl font-black uppercase text-gray-900 mb-4">
                        <span className="bg-yellow-400 border-2 border-black px-2 py-0.5 text-sm">3</span>
                        Critérios de Desempate
                    </h3>
                    <div className="bg-orange-50 p-4 border-l-8 border-orange-500 shadow-md">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-3 italic">Em caso de igualdade de pontos, o desempate seguirá esta ordem:</p>
                        <ol className="space-y-2 list-decimal list-inside text-sm md:text-base font-bold text-gray-800">
                            <li className="p-2 bg-white/50 border border-orange-200">Número de <span className="text-orange-700 underline">acertos em cheio</span> (placar exato).</li>
                            <li className="p-2 bg-white/50 border border-orange-200">Número de acertos em <span className="text-orange-700 underline">times classificados</span>.</li>
                            <li className="p-2 bg-white/50 border border-orange-200">Número de acertos em <span className="text-orange-700 underline">Vencedor + 1 Placar</span>.</li>
                            <li className="p-2 bg-white/50 border border-orange-200">Número de acertos apenas na indicação do <span className="text-orange-700 underline">resultado</span>.</li>
                        </ol>
                    </div>
                </section>

                {/* Section 5: Prizes */}
                <section>
                    <h3 className="flex items-center gap-3 text-lg md:text-xl font-black uppercase text-gray-900 mb-4">
                        <span className="bg-yellow-400 border-2 border-black px-2 py-0.5 text-sm">4</span>
                        Premiação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-yellow-500 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-all border-4 border-black"></div>
                            <div className="relative bg-white border-4 border-black p-6 text-center">
                                <div className="text-4xl mb-2">🥇</div>
                                <h4 className="font-black text-2xl uppercase text-gray-900 italic">1º LUGAR</h4>
                                <div className="text-4xl font-black text-green-600 my-2">80%</div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Do montante total arrecadado</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-gray-400 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-all border-4 border-black"></div>
                            <div className="relative bg-white border-4 border-black p-6 text-center">
                                <div className="text-4xl mb-2">🥈</div>
                                <h4 className="font-black text-2xl uppercase text-gray-900 italic">2º LUGAR</h4>
                                <div className="text-4xl font-black text-gray-600 my-2">20%</div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Do montante total arrecadado</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-12 pt-8 border-t-4 border-gray-200 text-center opacity-40 grayscale">
                    <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Bolão da Copa '26 • Diversão e Competição • Jogue com responsabilidade</p>
                </div>
            </PixelCard>
        </div>
    );
};
