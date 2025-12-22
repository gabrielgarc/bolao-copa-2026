
import React, { useState } from 'react';
import { AppView } from '../types';
import { PixelButton } from './PixelComponents';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  userName?: string;
  userRank?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, userName = "Jogador", userRank = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (view: AppView) => {
    onViewChange(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-900 border-b-4 border-black p-4 sticky top-0 z-50 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-sm md:text-2xl text-yellow-400 drop-shadow-[2px_2px_0px_rgba(255,0,0,1)] uppercase font-bold">
            Bolão da Copa '26
          </h1>
          <div className="text-[8px] md:text-xs text-white/80 font-bold uppercase mt-1 flex items-center gap-2">
            <span>{userName}</span>
            <span className="text-yellow-400 bg-black/40 px-1 border border-yellow-400/30">#{userRank}º Lugar</span>
          </div>
        </div>
        
        <div className="relative">
          {/* Hamburger Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col gap-1.5 p-2 border-4 border-black bg-gray-800 active:shadow-none active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
          >
            <div className="w-6 h-1 bg-yellow-400"></div>
            <div className="w-6 h-1 bg-yellow-400"></div>
            <div className="w-6 h-1 bg-yellow-400"></div>
          </button>

          {/* Sandwich Menu Overlay */}
          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/20 z-10" 
                onClick={() => setIsMenuOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] z-20 overflow-hidden">
                <nav className="flex flex-col">
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold border-b-2 border-black transition-colors ${currentView === AppView.MATCHES ? 'bg-yellow-400 text-black' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.MATCHES)}
                  >
                    Palpites (Cards)
                  </button>
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold border-b-2 border-black transition-colors ${currentView === AppView.SPREADSHEET ? 'bg-blue-500 text-white' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.SPREADSHEET)}
                  >
                    Planilha
                  </button>
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold border-b-2 border-black transition-colors ${currentView === AppView.OFFICIAL_RESULTS ? 'bg-red-500 text-white' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.OFFICIAL_RESULTS)}
                  >
                    Resultados Oficiais
                  </button>
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold border-b-2 border-black transition-colors ${currentView === AppView.USER_SCORE ? 'bg-yellow-400 text-black' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.USER_SCORE)}
                  >
                    Meus Pontos
                  </button>
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold transition-colors ${currentView === AppView.LEADERBOARD ? 'bg-yellow-400 text-black' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.LEADERBOARD)}
                  >
                    Ranking
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 w-full text-center p-2 bg-gray-900 border-t-4 border-black text-[10px] text-gray-500 z-40">
      Feito com React, Tailwind & Gemini 2.5
    </footer>
  );
};