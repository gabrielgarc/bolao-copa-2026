
import React, { useState } from 'react';
import { AppView } from '../types';
import { PixelButton } from './PixelComponents';
import { UserService } from '../services/userService';
import { AvatarViewer } from './AvatarViewer';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  userName?: string;
  userRank?: number;
  userAvatar?: string;
  userPoints?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, userName = "Jogador", userRank = 0, userAvatar, userPoints = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (view: AppView) => {
    onViewChange(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-900 border-b-4 border-black p-2 md:p-3 sticky top-0 z-50 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto flex justify-between items-center relative">
        
        {/* Left: User Info */}
        <div className="flex items-center justify-start gap-2 z-10 flex-1">
          {userAvatar ? (
            <AvatarViewer configStr={userAvatar} size={50} className="md:w-[60px] md:h-[60px] border-2 border-black bg-gray-700 shrink-0" />
          ) : (
            <div className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] bg-gray-800 border-2 border-black shrink-0"></div>
          )}
          
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] md:text-xs text-white font-bold uppercase truncate max-w-[60px] sm:max-w-[100px] md:max-w-none leading-none mb-1">
              {userName}
            </span>
            <span className="text-[7px] md:text-[9px] text-green-400 font-bold uppercase whitespace-nowrap bg-black/40 px-1 border border-green-400/30 leading-none py-0.5">
              {userPoints} PTS
            </span>
            <span className="text-[7px] md:text-[9px] text-yellow-400 font-bold uppercase whitespace-nowrap bg-black/40 px-1 border border-yellow-400/30 leading-none py-0.5">
              #{userRank}º Lugar
            </span>
          </div>
        </div>

        {/* Center: Title */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none z-0">
          <h1 
            className="text-[9px] sm:text-sm md:text-2xl text-yellow-400 drop-shadow-[2px_2px_0px_rgba(255,0,0,1)] uppercase"
            style={{ fontFamily: "'Press Start 2P', cursive", lineHeight: "1.5" }}
          >
            Bolão da<br className="md:hidden" /> Copa '26
          </h1>
        </div>
        
        {/* Right: Hamburger */}
        <div className="relative z-10 flex-1 flex justify-end">
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
              <div className="absolute right-0 mt-14 w-56 bg-gray-800 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] z-20 overflow-hidden">
                <nav className="flex flex-col">
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold border-b-2 border-black transition-colors ${currentView === AppView.SPREADSHEET ? 'bg-blue-500 text-white' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.SPREADSHEET)}
                  >
                    Palpites
                  </button>
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold border-b-2 border-black transition-colors ${currentView === AppView.OFFICIAL_RESULTS ? 'bg-red-500 text-white' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.OFFICIAL_RESULTS)}
                  >
                    Resultados Oficiais
                  </button>
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold border-b-2 border-black transition-colors ${currentView === AppView.MY_SCORE ? 'bg-green-600 text-white' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.MY_SCORE)}
                  >
                    Minha Pontuação
                  </button>
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold border-b-2 border-black transition-colors ${currentView === AppView.RULES ? 'bg-orange-500 text-white' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.RULES)}
                  >
                    Regulamento
                  </button>
                  <button 
                    className={`w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold transition-colors ${currentView === AppView.LEADERBOARD ? 'bg-yellow-400 text-black' : 'text-yellow-400 hover:bg-gray-700'}`}
                    onClick={() => handleNav(AppView.LEADERBOARD)}
                  >
                    Ranking
                  </button>
                  <button 
                    className="w-full text-left p-4 uppercase text-[10px] md:text-xs font-bold text-red-500 hover:bg-red-900 border-t-4 border-black transition-colors"
                    onClick={() => {
                        UserService.logout();
                        window.location.reload();
                    }}
                  >
                    Sair
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
  // @ts-ignore
  const commitHash = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev';
  
  return (
    <footer className="fixed bottom-0 w-full text-center p-2 bg-gray-900 border-t-4 border-black text-[10px] text-gray-500 z-40">
      <span className="font-mono uppercase tracking-widest opacity-70">Build: {commitHash}</span>
    </footer>
  );
};