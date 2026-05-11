import React, { useState, useEffect } from 'react';
import { AvatarViewer, AvatarConfig } from './AvatarViewer';
import {
    faces,
    expressions,
    hairs,
    shirts,
    accessories,
    defaultColors,
    skinPresets,
    hairPresets,
    eyePresets
} from './avatarParts';

interface AvatarEditorProps {
    onChange: (config: string) => void;
}

type TabName = 'Cabeça' | 'Cabelo' | 'Rosto' | 'Roupa' | 'Extras';

const CategorySelector = ({ label, items, selectedIndex, onSelect }: { label: string, items: any[], selectedIndex: number, onSelect: (idx: number) => void }) => (
    <div className="mb-4">
        <label className="text-[11px] font-bold uppercase mb-2 block text-gray-700">{label}:</label>
        <div className="flex flex-wrap gap-2">
            {items.map((item, idx) => (
                <button
                    type="button"
                    key={idx}
                    onClick={() => onSelect(idx)}
                    className={`px-3 py-2 border-2 text-[10px] sm:text-[11px] font-bold uppercase rounded-lg transition-colors ${idx === selectedIndex ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                    {item.name}
                </button>
            ))}
        </div>
    </div>
);

const ColorSelector = ({ label, value, onChange, presets }: { label: string, value: string, onChange: (v: string) => void, presets?: string[] }) => (
    <div className="mb-4">
        <label className="text-[11px] font-bold uppercase mb-2 block text-gray-700">{label}:</label>
        <div className="flex items-center gap-3">
            {/* Color Picker Box */}
            <div className="relative group shrink-0">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer absolute opacity-0 z-10"
                    title="Escolher cor personalizada"
                />
                <div 
                    className="w-10 h-10 border-2 border-gray-200 rounded-lg pointer-events-none shadow-sm flex items-center justify-center bg-white group-hover:border-gray-300 transition-colors"
                >
                    <div className="w-6 h-6 rounded-md" style={{ backgroundColor: value }}></div>
                </div>
            </div>
            
            {/* Presets Grid */}
            {presets && (
                <div className="flex flex-wrap gap-2">
                    {presets.map(p => (
                        <button
                            type="button"
                            key={p}
                            onClick={() => onChange(p)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${p === value ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:scale-105'}`}
                            style={{ backgroundColor: p }}
                            title={p}
                        />
                    ))}
                </div>
            )}
        </div>
    </div>
);

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ onChange }) => {
    const [activeTab, setActiveTab] = useState<TabName>('Cabeça');
    const [config, setConfig] = useState<AvatarConfig>({
        face: 0,
        expression: 0,
        hair: 1,
        shirt: 0,
        accessory: 0,
        colors: { ...defaultColors }
    });

    useEffect(() => {
        onChange(JSON.stringify(config));
    }, [config, onChange]);

    const updateConfig = (key: keyof Omit<AvatarConfig, 'colors'>, value: number) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleColorChange = (key: keyof AvatarConfig['colors'], value: string) => {
        setConfig(prev => ({
            ...prev,
            colors: { ...prev.colors, [key]: value }
        }));
    };

    const handleRandomize = () => {
        const randomHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        setConfig({
            face: Math.floor(Math.random() * faces.length),
            expression: Math.floor(Math.random() * expressions.length),
            hair: Math.floor(Math.random() * hairs.length),
            shirt: Math.floor(Math.random() * shirts.length),
            accessory: Math.floor(Math.random() * accessories.length),
            colors: {
                skin: skinPresets[Math.floor(Math.random() * skinPresets.length)],
                hair: hairPresets[Math.floor(Math.random() * hairPresets.length)],
                eyes: eyePresets[Math.floor(Math.random() * eyePresets.length)],
                shirtC1: randomHex(),
                shirtC2: randomHex(),
                accessory: randomHex(),
                background: randomHex()
            }
        });
    };

    const tabs: TabName[] = ['Cabeça', 'Cabelo', 'Rosto', 'Roupa', 'Extras'];

    return (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-3 sm:p-5 shadow-sm mt-2 w-full max-w-full overflow-hidden">
            <div className="flex flex-col gap-4">
                
                {/* Preview Area */}
                <div className="flex justify-center w-full">
                    <div className="border-4 border-gray-100 rounded-2xl p-3 bg-gray-50 flex flex-col justify-center items-center shadow-inner relative">
                        <AvatarViewer configStr={JSON.stringify(config)} size={160} />
                        <button
                            type="button"
                            onClick={handleRandomize}
                            className="mt-3 px-3 py-1 bg-yellow-400 border-2 border-black font-bold uppercase text-[10px] sm:text-xs rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:translate-y-px hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] transition-all flex items-center gap-1"
                        >
                            <span>🎲 Aleatório</span>
                        </button>
                    </div>
                </div>
                
                {/* Editor Area */}
                <div className="flex flex-col w-full">
                    {/* Tabs Navigation */}
                    <div className="flex overflow-x-auto pb-1 mb-4 border-b-2 border-gray-100 hide-scrollbar w-full">
                        <div className="flex gap-1 px-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap px-3 py-2 font-bold uppercase text-[10px] sm:text-xs rounded-t-lg transition-all ${
                                        activeTab === tab 
                                        ? 'border-b-4 border-blue-500 text-blue-700 bg-blue-50/50 -mb-[2px]' 
                                        : 'border-b-4 border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 -mb-[2px]'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 bg-white px-1">
                        {activeTab === 'Cabeça' && (
                            <div className="animate-fadeIn">
                                <CategorySelector label="Formato do Rosto" items={faces} selectedIndex={config.face} onSelect={(i) => updateConfig('face', i)} />
                                <ColorSelector label="Cor da Pele" value={config.colors.skin} onChange={(v) => handleColorChange('skin', v)} presets={skinPresets} />
                            </div>
                        )}

                        {activeTab === 'Cabelo' && (
                            <div className="animate-fadeIn">
                                <CategorySelector label="Estilo do Cabelo" items={hairs} selectedIndex={config.hair} onSelect={(i) => updateConfig('hair', i)} />
                                <ColorSelector label="Cor do Cabelo" value={config.colors.hair} onChange={(v) => handleColorChange('hair', v)} presets={hairPresets} />
                            </div>
                        )}

                        {activeTab === 'Rosto' && (
                            <div className="animate-fadeIn">
                                <CategorySelector label="Expressão Facial" items={expressions} selectedIndex={config.expression} onSelect={(i) => updateConfig('expression', i)} />
                                <ColorSelector label="Cor dos Olhos" value={config.colors.eyes} onChange={(v) => handleColorChange('eyes', v)} presets={eyePresets} />
                            </div>
                        )}

                        {activeTab === 'Roupa' && (
                            <div className="animate-fadeIn">
                                <CategorySelector label="Modelo da Camisa" items={shirts} selectedIndex={config.shirt} onSelect={(i) => updateConfig('shirt', i)} />
                                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                    <ColorSelector label="Cor Principal" value={config.colors.shirtC1} onChange={(v) => handleColorChange('shirtC1', v)} />
                                    <ColorSelector label="Cor Secundária" value={config.colors.shirtC2} onChange={(v) => handleColorChange('shirtC2', v)} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'Extras' && (
                            <div className="animate-fadeIn">
                                <CategorySelector label="Acessório" items={accessories} selectedIndex={config.accessory} onSelect={(i) => updateConfig('accessory', i)} />
                                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                    <ColorSelector label="Cor do Acessório" value={config.colors.accessory} onChange={(v) => handleColorChange('accessory', v)} />
                                    <ColorSelector label="Cor de Fundo" value={config.colors.background} onChange={(v) => handleColorChange('background', v)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
