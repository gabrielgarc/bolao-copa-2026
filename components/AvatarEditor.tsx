import React, { useState, useEffect } from 'react';
import { PixelButton } from './PixelComponents';
import { AvatarViewer, AvatarConfig } from './AvatarViewer';

interface AvatarEditorProps {
    onChange: (config: string) => void;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ onChange }) => {
    const [config, setConfig] = useState<AvatarConfig>({
        head: 0,
        hair: 1,
        skinColor: '#f1c27d', // Pele clara
        hairColor: '#4a3000', // Cabelo castanho escuro
        eyeColor: '#000000',
        bgColor: '#3b82f6' // Fundo azul
    });

    useEffect(() => {
        onChange(JSON.stringify(config));
    }, [config, onChange]);

    const updateConfig = (key: keyof AvatarConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const skinColors = ['#fce2c4', '#f1c27d', '#e0ac69', '#8d5524', '#3d220f'];
    const hairColors = ['#000000', '#4a3000', '#a52a2a', '#e8b923', '#717171', '#ff00ff', '#00ff00'];
    const eyeColors = ['#000000', '#3b82f6', '#22c55e', '#a855f7', '#ef4444'];
    const bgColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    return (
        <div className="bg-white border-4 border-black p-4 mt-2">
            <h3 className="text-center font-bold text-xs mb-4 uppercase">Monte seu Avatar</h3>
            
            <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                <div className="flex-shrink-0">
                    <AvatarViewer configStr={JSON.stringify(config)} size={80} />
                </div>
                
                <div className="flex-grow w-full space-y-3">
                    {/* Controles de Forma */}
                    <div className="flex flex-col gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase mb-1 block">Rosto:</label>
                            <div className="flex flex-wrap gap-1">
                                {[0, 1, 2, 3, 4].map(h => (
                                    <button 
                                        type="button"
                                        key={h}
                                        onClick={() => updateConfig('head', h)}
                                        className={`w-6 h-6 border-2 flex items-center justify-center text-[10px] font-bold ${config.head === h ? 'border-red-500 bg-red-100' : 'border-gray-400 bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        {h+1}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase mb-1 block">Cabelo:</label>
                            <div className="flex flex-wrap gap-1">
                                {[0, 1, 2, 3, 4].map(h => (
                                    <button 
                                        type="button"
                                        key={h}
                                        onClick={() => updateConfig('hair', h)}
                                        className={`w-6 h-6 border-2 flex items-center justify-center text-[10px] font-bold ${config.hair === h ? 'border-red-500 bg-red-100' : 'border-gray-400 bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        {h+1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controles de Cor */}
            <div className="space-y-2">
                <div className="flex gap-2 items-center">
                    <label className="text-[10px] font-bold uppercase w-12 shrink-0">Pele:</label>
                    <div className="flex flex-wrap gap-1">
                        {skinColors.map(c => (
                            <button type="button" key={c} onClick={() => updateConfig('skinColor', c)} className={`w-5 h-5 border-2 ${config.skinColor === c ? 'border-red-500 scale-110' : 'border-black'}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <label className="text-[10px] font-bold uppercase w-12 shrink-0">Cabelo:</label>
                    <div className="flex flex-wrap gap-1">
                        {hairColors.map(c => (
                            <button type="button" key={c} onClick={() => updateConfig('hairColor', c)} className={`w-5 h-5 border-2 ${config.hairColor === c ? 'border-red-500 scale-110' : 'border-black'}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <label className="text-[10px] font-bold uppercase w-12 shrink-0">Olho:</label>
                    <div className="flex flex-wrap gap-1">
                        {eyeColors.map(c => (
                            <button type="button" key={c} onClick={() => updateConfig('eyeColor', c)} className={`w-5 h-5 border-2 ${config.eyeColor === c ? 'border-red-500 scale-110' : 'border-black'}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <label className="text-[10px] font-bold uppercase w-12 shrink-0">Fundo:</label>
                    <div className="flex flex-wrap gap-1">
                        {bgColors.map(c => (
                            <button type="button" key={c} onClick={() => updateConfig('bgColor', c)} className={`w-5 h-5 border-2 ${config.bgColor === c ? 'border-red-500 scale-110' : 'border-black'}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
