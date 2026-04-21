
import React, { useState, useEffect, useRef } from 'react';
import { Match } from '../types';
import { PixelCard, PixelInput, PixelFlag } from './PixelComponents';
import { calculatePoints } from '../utils/scoring';

interface MatchCardProps {
  match: Match;
  prediction?: { home: string; away: string };
  onPredict: (home: string, away: string) => Promise<void>;
  isToday?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, prediction, onPredict, isToday }) => {
  const [homeInput, setHomeInput] = useState(prediction?.home || '');
  const [awayInput, setAwayInput] = useState(prediction?.away || '');
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prediction) {
      setHomeInput(prediction.home);
      setAwayInput(prediction.away);
    }
  }, [prediction]);

  const isLocked = match.isLocked || match.realHomeScore !== undefined || match.realAwayScore !== undefined || match.homeTeam.name === 'Unknown' || match.awayTeam.name === 'Unknown';

  const triggerSave = (home: string, away: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if ((home !== '' && away !== '') || (home === '' && away === '')) {
      setIsSaving(true);
      debounceTimer.current = setTimeout(async () => {
        await onPredict(home, away);
        setIsSaving(false);
      }, 800);
    }
  };

  const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const val = e.target.value;
    if (val === '' || (parseInt(val) >= 0 && val.length <= 2)) {
        setHomeInput(val);
        triggerSave(val, awayInput);
    }
  };

  const handleAwayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const val = e.target.value;
    if (val === '' || (parseInt(val) >= 0 && val.length <= 2)) {
        setAwayInput(val);
        triggerSave(homeInput, val);
    }
  };

  const hasPrediction = homeInput !== '' && awayInput !== '';
  const isInvalid = (homeInput !== '' && awayInput === '') || (homeInput === '' && awayInput !== '');
  const hasRealResult = match.realHomeScore !== undefined && match.realAwayScore !== undefined;
  
  let points = 0;
  let pointsColor = 'bg-gray-400';
  
  if (hasPrediction && hasRealResult) {
    const pHome = parseInt(homeInput);
    const pAway = parseInt(awayInput);
    if (!isNaN(pHome) && !isNaN(pAway)) {
        points = calculatePoints(pHome, pAway, match.realHomeScore!, match.realAwayScore!);
    }
    if (points === 3) pointsColor = 'bg-green-500 text-white';
    else if (points === 2) pointsColor = 'bg-yellow-400 text-black';
    else if (points === 1) pointsColor = 'bg-orange-400 text-white';
    else pointsColor = 'bg-red-500 text-white';
  }

  const cardBgColor = isToday 
    ? (isLocked ? 'bg-yellow-100' : 'bg-yellow-50') 
    : (isLocked ? 'bg-gray-200' : 'bg-gray-100');

  return (
    <PixelCard 
      className={`mb-3 md:mb-4 relative transition-all ${isLocked ? 'opacity-90' : 'opacity-100'} overflow-hidden ${isToday ? 'border-yellow-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]' : ''}`} 
      colorClass={cardBgColor}
    >
       {isSaving && (
         <div className="absolute inset-0 bg-black/40 z-30 flex items-center justify-center backdrop-blur-[1px]">
           <div className="bg-yellow-400 border-4 border-black px-4 py-2 text-[10px] font-bold text-black animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
             Salvando...
           </div>
         </div>
       )}

       {isToday && (
         <div className="absolute top-0 right-0 bg-red-600 text-white text-[7px] md:text-[8px] px-2 py-1 font-bold z-20 border-l-2 border-b-2 border-black animate-pulse uppercase">
           Live
         </div>
       )}

      <div className={`flex justify-between items-center mb-2 text-[8px] md:text-[10px] uppercase tracking-tighter border-b pb-1 gap-2 ${isToday ? 'text-yellow-800 border-yellow-300' : 'text-gray-500 border-gray-300'}`}>
        <span className="whitespace-nowrap font-bold flex items-center gap-1">
          {isLocked && <span className="text-red-600">🔒</span>}
          {match.group}
        </span>
        <span className="whitespace-nowrap font-bold">{match.date.split('/')[0]}/{match.date.split('/')[1]} {match.time}</span>
        <span className="truncate max-w-[80px] md:max-w-[150px] text-right font-bold">{match.stadium}</span>
      </div>

      <div className="flex flex-row items-center justify-between gap-1 md:gap-4">
        <div className="flex flex-col md:flex-row items-center justify-start md:justify-end gap-1 md:gap-2 w-[35%] md:w-1/3 text-center md:text-right">
          <div className="order-1 md:order-2 shrink-0">
            <PixelFlag team={match.homeTeam} className="w-8 h-5 md:w-10 md:h-7" />
          </div>
          <div className="order-2 md:order-1 w-full overflow-hidden">
            <span className="block text-[8px] md:text-sm font-bold leading-tight text-black truncate uppercase">
                {match.homeTeam.namePt || match.homeTeam.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 w-[30%] shrink-0">
            <div className={`flex items-center justify-center gap-1 px-1 py-1 border-2 border-gray-900 rounded-sm ${isLocked ? 'bg-gray-400' : (isToday ? 'bg-yellow-200' : 'bg-gray-300')}`}>
                <PixelInput 
                    type="number" 
                    min="0"
                    value={homeInput} 
                    onChange={handleHomeChange} 
                    disabled={isLocked || isSaving}
                    className="w-7 h-7 md:w-10 md:h-10 text-center text-xs md:text-lg p-0 font-bold"
                    placeholder="-"
                />
                <span className="text-xs md:text-lg font-bold text-gray-700">X</span>
                <PixelInput 
                    type="number" 
                    min="0"
                    value={awayInput} 
                    onChange={handleAwayChange} 
                    disabled={isLocked || isSaving}
                    className="w-7 h-7 md:w-10 md:h-10 text-center text-xs md:text-lg p-0 font-bold"
                    placeholder="-"
                />
            </div>
            <div className="h-3 flex items-center">
              {isInvalid && <span className="text-[6px] md:text-[8px] text-red-600 font-bold uppercase">Incompleto</span>}
            </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-start md:justify-start gap-1 md:gap-2 w-[35%] md:w-1/3 text-center md:text-left">
            <div className="order-1 md:order-1 shrink-0">
                <PixelFlag team={match.awayTeam} className="w-8 h-5 md:w-10 md:h-7" />
            </div>
            <div className="order-2 md:order-2 w-full overflow-hidden">
                <span className="block text-[8px] md:text-sm font-bold leading-tight text-black truncate uppercase">
                    {match.awayTeam.namePt || match.awayTeam.name}
                </span>
            </div>
        </div>
      </div>

      {hasRealResult && (
          <div className="mt-1 flex flex-row items-center justify-center gap-2 md:gap-4 border-t border-dashed border-gray-400 pt-1 w-full flex-nowrap overflow-hidden">
              <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[7px] md:text-[9px] uppercase text-gray-500 font-bold whitespace-nowrap">OFICIAL:</span>
                  <span className="text-[9px] md:text-xs font-bold text-gray-900 bg-white px-2 py-0.5 border border-gray-400 shadow-[1px_1px_0_rgba(0,0,0,0.1)] whitespace-nowrap">
                      {match.realHomeScore} - {match.realAwayScore}
                  </span>
              </div>
              {hasPrediction && (
                  <div className={`${pointsColor} border border-black px-1.5 py-0.5 text-[7px] md:text-[9px] font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] whitespace-nowrap shrink-0`}>
                      {points} {points === 1 ? 'PT' : 'PTS'}
                  </div>
              )}
          </div>
      )}
    </PixelCard>
  );
};