
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, MatchStage, TeamStats, Match } from './types';
import { PixelButton, PixelCard } from './components/PixelComponents';
import { MatchCard } from './components/MatchCard';
import { OfficialMatchCard } from './components/OfficialMatchCard';
import { StandingsTable } from './components/StandingsTable';
import { Header, Footer } from './components/LayoutComponents';
import { UserScoreView } from './components/UserScoreView';
import { SpreadsheetView } from './components/SpreadsheetView';
import { calculatePoints } from './utils/scoring';
import { ApiService } from './services/apiService';

// Novos Serviços Modulares
import { MatchService } from './services/matchService';
import { PredictionService } from './services/predictionService';
import { RankingService } from './services/rankingService';
import { UserService } from './services/userService';

// Models Individuais
import { MatchModel } from './models/match.model';
import { RankingModel } from './models/ranking.model';
import { UserModel } from './models/user.model';
import { LoginScreen } from './components/LoginScreen';

type MatchesSubView = 'TABLE' | 'DATE' | 'TODAY';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<AppView>(AppView.SPREADSHEET);
    const [currentStage, setCurrentStage] = useState<MatchStage>('GROUPS');
    const [activeGroup, setActiveGroup] = useState<string>('A');
    const [matchesSubView, setMatchesSubView] = useState<MatchesSubView>('TABLE');

    const [allMatches, setAllMatches] = useState<MatchModel[]>([]);
    const [leaderboard, setLeaderboard] = useState<RankingModel[]>([]);
    const [predictions, setPredictions] = useState<Record<string, { home: string, away: string }>>({});
    const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
    const [groupDefinitions, setGroupDefinitions] = useState<Record<string, any[]>>({});
    const [simulatedToday, setSimulatedToday] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Carregamento inicial de dados usando os novos serviços
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const userData = await UserService.getCurrentPlayer();
                setCurrentUser(userData);

                if (userData) {
                    const [matchesData, rankingsData, predsData, groupDefs, simulatedDate] = await Promise.all([
                        MatchService.getAll(),
                        RankingService.getLeaderboard(),
                        PredictionService.getSaved(),
                        ApiService.getGroupDefinitions(),
                        ApiService.getSimulatedDate()
                    ]);

                    setAllMatches(matchesData);
                    setLeaderboard(rankingsData);
                    setPredictions(predsData);
                    const definitionsMap = groupDefs.reduce((acc: Record<string, any[]>, group: any) => {
                        acc[group.groupLetter] = group.teams;
                        return acc;
                    }, {});
                    setGroupDefinitions(definitionsMap);
                    setSimulatedToday(simulatedDate);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handlePredict = async (matchId: string, home: string, away: string) => {
        const newPredictions = {
            ...predictions,
            [matchId]: { home, away }
        };
        setPredictions(newPredictions);
        await PredictionService.save(matchId, home, away);
    };

    // Cálculo de pontos totais do usuário e ranking
    const { userPoints, userRank } = useMemo(() => {
        let total = 0;
        allMatches.forEach(match => {
            const pred = predictions[match.id];
            const hasRealResult = match.realHomeScore !== undefined && match.realAwayScore !== undefined;

            if (pred && pred.home !== '' && pred.away !== '' && hasRealResult) {
                const pHome = parseInt(pred.home);
                const pAway = parseInt(pred.away);
                if (!isNaN(pHome) && !isNaN(pAway)) {
                    total += calculatePoints(pHome, pAway, match.realHomeScore!, match.realAwayScore!);
                }
            }
        });

        const allRankings = [...leaderboard].sort((a, b) => b.points - a.points);
        let rank = 1;
        for (const user of allRankings) {
            if (currentUser && user.name === currentUser.name) continue;
            if (total >= user.points) break;
            rank++;
        }

        return { userPoints: total, userRank: rank };
    }, [allMatches, predictions, leaderboard, currentUser]);

    const groupStats = useMemo(() => {
        if (currentStage !== 'GROUPS' || allMatches.length === 0 || Object.keys(groupDefinitions).length === 0) return [];

        const teams = groupDefinitions[activeGroup] || [];
        const matches = allMatches.filter(m => m.group === `Grupo ${activeGroup}`);

        const statsMap: Record<string, TeamStats> = {};
        matches.forEach(match => {
            if (!statsMap[match.homeTeam.id]) {
                statsMap[match.homeTeam.id] = { teamId: match.homeTeam.id, team: match.homeTeam, points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalDiff: 0, goalsFor: 0, goalsAgainst: 0 };
            }
            if (!statsMap[match.awayTeam.id]) {
                statsMap[match.awayTeam.id] = { teamId: match.awayTeam.id, team: match.awayTeam, points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalDiff: 0, goalsFor: 0, goalsAgainst: 0 };
            }
        });

        matches.forEach(match => {
            let hScore: number | undefined;
            let aScore: number | undefined;

            if (currentView === AppView.OFFICIAL_RESULTS) {
                hScore = match.realHomeScore;
                aScore = match.realAwayScore;
            } else {
                const pred = predictions[match.id];
                if (pred && pred.home !== '' && pred.away !== '') {
                    hScore = parseInt(pred.home);
                    aScore = parseInt(pred.away);
                }
            }

            if (hScore !== undefined && aScore !== undefined && !isNaN(hScore) && !isNaN(aScore)) {
                if (statsMap[match.homeTeam.id]) statsMap[match.homeTeam.id].played += 1;
                if (statsMap[match.awayTeam.id]) statsMap[match.awayTeam.id].played += 1;

                if (statsMap[match.homeTeam.id]) {
                    statsMap[match.homeTeam.id].goalsFor += hScore;
                    statsMap[match.homeTeam.id].goalsAgainst += aScore;
                    statsMap[match.homeTeam.id].goalDiff += (hScore - aScore);
                }
                if (statsMap[match.awayTeam.id]) {
                    statsMap[match.awayTeam.id].goalsFor += aScore;
                    statsMap[match.awayTeam.id].goalsAgainst += hScore;
                    statsMap[match.awayTeam.id].goalDiff += (aScore - hScore);
                }

                if (hScore > aScore) {
                    if (statsMap[match.homeTeam.id]) { statsMap[match.homeTeam.id].points += 3; statsMap[match.homeTeam.id].won += 1; }
                    if (statsMap[match.awayTeam.id]) { statsMap[match.awayTeam.id].lost += 1; }
                } else if (aScore > hScore) {
                    if (statsMap[match.awayTeam.id]) { statsMap[match.awayTeam.id].points += 3; statsMap[match.awayTeam.id].won += 1; }
                    if (statsMap[match.homeTeam.id]) { statsMap[match.homeTeam.id].lost += 1; }
                } else {
                    if (statsMap[match.homeTeam.id]) { statsMap[match.homeTeam.id].points += 1; statsMap[match.homeTeam.id].drawn += 1; }
                    if (statsMap[match.awayTeam.id]) { statsMap[match.awayTeam.id].points += 1; statsMap[match.awayTeam.id].drawn += 1; }
                }
            }
        });

        return Object.values(statsMap).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
            return b.goalsFor - a.goalsFor;
        });
    }, [activeGroup, currentStage, predictions, allMatches, currentView, groupDefinitions]);

    const todayStr = simulatedToday;

    const matchesByDate = useMemo(() => {
        const filtered = allMatches.filter(m => {
            if (matchesSubView === 'TODAY') {
                return m.date.startsWith(todayStr);
            }
            if (currentStage === 'GROUPS') return m.stage === 'GROUPS';
            return m.stage === currentStage;
        });

        const groups: Record<string, Match[]> = {};
        filtered.forEach(m => {
            if (!groups[m.date]) groups[m.date] = [];
            groups[m.date].push(m);
        });

        return Object.entries(groups).sort((a, b) => {
            const dateA = a[0].split('/').reverse().join('');
            const dateB = b[0].split('/').reverse().join('');
            return dateA.localeCompare(dateB);
        });
    }, [allMatches, currentStage, matchesSubView, todayStr]);

    const renderMatchesView = (isOfficial: boolean) => {
        const stages: { id: MatchStage, label: string }[] = [
            { id: 'GROUPS', label: 'Grupos' },
            { id: 'R32', label: '2ª Fase' },
            { id: 'R16', label: 'Oitavas' },
            { id: 'QF', label: 'Quartas' },
            { id: 'SF', label: 'Semi' },
            { id: 'FINAL', label: 'Final' },
        ];

        // Loading removido pois foi movido para o <main> geral

        return (
            <div className="max-w-4xl mx-auto">
                {isOfficial && (
                    <div className="mb-6 text-center">
                        <h2 className="text-xl md:text-3xl text-red-500 font-bold drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase italic">
                            Resultados Oficiais
                        </h2>
                        <p className="text-white opacity-60 text-[8px] md:text-[10px] uppercase font-bold mt-1">Placares reais das partidas confirmadas pela FIFA</p>
                    </div>
                )}

                {matchesSubView !== 'TODAY' && (
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {stages.map(stage => (
                            <PixelButton
                                key={stage.id}
                                variant={currentStage === stage.id ? (isOfficial ? 'danger' : 'action') : 'primary'}
                                onClick={() => setCurrentStage(stage.id)}
                                className="flex-grow md:flex-grow-0 min-w-[70px] text-[8px] md:text-xs text-center justify-center px-2"
                            >
                                {stage.label}
                            </PixelButton>
                        ))}
                    </div>
                )}

                <div className="flex justify-center mb-6">
                    <div className="bg-gray-800 p-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex flex-wrap justify-center">
                        <button
                            onClick={() => setMatchesSubView('TABLE')}
                            className={`px-3 py-1 text-[8px] md:text-[10px] uppercase font-bold transition-colors ${matchesSubView === 'TABLE' ? (isOfficial ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black') : 'text-gray-400 hover:text-white'}`}
                        >
                            Tabela
                        </button>
                        <button
                            onClick={() => setMatchesSubView('DATE')}
                            className={`px-3 py-1 text-[8px] md:text-[10px] uppercase font-bold transition-colors ${matchesSubView === 'DATE' ? (isOfficial ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black') : 'text-gray-400 hover:text-white'}`}
                        >
                            Calendário
                        </button>
                        <button
                            onClick={() => setMatchesSubView('TODAY')}
                            className={`px-3 py-1 text-[8px] md:text-[10px] uppercase font-bold transition-all ${matchesSubView === 'TODAY' ? 'bg-red-600 text-white animate-pulse' : 'text-gray-400 hover:text-white bg-red-900/20'}`}
                        >
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full inline-block animate-ping"></span>
                                AO VIVO
                            </span>
                        </button>
                    </div>
                </div>

                {matchesSubView === 'TABLE' && (
                    <>
                        {currentStage === 'GROUPS' && (
                            <>
                                <div className="mb-6 flex justify-center">
                                    <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 md:gap-2">
                                        {Object.keys(groupDefinitions).map(letter => (
                                            <PixelButton
                                                key={letter}
                                                variant={activeGroup === letter ? (isOfficial ? 'danger' : 'action') : 'secondary'}
                                                onClick={() => setActiveGroup(letter)}
                                                className="w-8 h-8 md:w-9 md:h-9 text-[10px] md:text-sm font-bold shadow-sm flex items-center justify-center px-0 p-0"
                                            >
                                                {letter}
                                            </PixelButton>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4 text-center">
                                    <h2 className={`text-xl md:text-2xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] uppercase font-bold ${isOfficial ? 'text-red-400' : 'text-yellow-300'}`}>
                                        Grupo {activeGroup}
                                    </h2>
                                </div>

                                <StandingsTable stats={groupStats} />
                            </>
                        )}

                        <div>
                            {allMatches
                                .filter(m => {
                                    if (currentStage === 'GROUPS') return m.group === `Grupo ${activeGroup}`;
                                    return m.stage === currentStage;
                                })
                                .map((match) => (
                                    isOfficial ? (
                                        <OfficialMatchCard key={match.id} match={match} />
                                    ) : (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                            prediction={predictions[match.id]}
                                            onPredict={(h, a) => handlePredict(match.id, h, a)}
                                            isToday={match.date.startsWith(todayStr)}
                                        />
                                    )
                                ))}
                        </div>
                    </>
                )}

                {(matchesSubView === 'DATE' || matchesSubView === 'TODAY') && (
                    <div className="space-y-8">
                        {matchesByDate.map(([date, matches]) => (
                            <div key={date}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-1 flex-grow bg-gray-900 opacity-30"></div>
                                    <h3 className={`border-2 border-black px-4 py-1 text-[10px] md:text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${date.startsWith(todayStr) ? 'bg-red-600 text-white' : (isOfficial ? 'bg-red-400 text-white' : 'bg-yellow-400 text-black')}`}>
                                        {date} {date.startsWith(todayStr) && '(HOJE)'}
                                    </h3>
                                    <div className="h-1 flex-grow bg-gray-900 opacity-30"></div>
                                </div>
                                <div className="space-y-4">
                                    {matches.map((match) => (
                                        isOfficial ? (
                                            <OfficialMatchCard key={match.id} match={match} />
                                        ) : (
                                            <MatchCard
                                                key={match.id}
                                                match={match}
                                                prediction={predictions[match.id]}
                                                onPredict={(h, a) => handlePredict(match.id, h, a)}
                                                isToday={match.date.startsWith(todayStr)}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (!currentUser) {
        return (
            <div className={`min-h-screen pb-20 transition-colors duration-500 bg-green-800 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')]`}>
                <LoginScreen onLoginSuccess={async (user) => {
                    setCurrentUser(user);
                    // Após o login atualiza a página para puxar os dados
                    window.location.reload();
                }} />
            </div>
        );
    }

    return (
        <div className={`min-h-screen pb-20 transition-colors duration-500 ${currentView === AppView.OFFICIAL_RESULTS ? 'bg-red-900' : 'bg-green-800'} bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')]`}>
            <Header
                currentView={currentView}
                onViewChange={setCurrentView}
                userName={currentUser?.name || "Carregando..."}
                userRank={userRank}
            />

            <main className="p-3 md:p-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="flex gap-3 mb-8">
                            <div className="w-5 h-5 bg-yellow-400 animate-bounce shadow-[4px_4px_0_rgba(0,0,0,1)] border-2 border-black" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-5 h-5 bg-yellow-400 animate-bounce shadow-[4px_4px_0_rgba(0,0,0,1)] border-2 border-black" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-5 h-5 bg-yellow-400 animate-bounce shadow-[4px_4px_0_rgba(0,0,0,1)] border-2 border-black" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <p className="text-yellow-400 text-xl font-bold animate-pulse uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,1)] tracking-widest">Sincronizando...</p>
                    </div>
                ) : (
                    <>
                        {currentView === AppView.MATCHES && renderMatchesView(false)}

                        {currentView === AppView.SPREADSHEET && (
                    <SpreadsheetView
                        matches={allMatches}
                        predictions={predictions}
                        onPredict={handlePredict}
                        currentStage={currentStage}
                        onStageChange={setCurrentStage}
                    />
                )}

                {currentView === AppView.OFFICIAL_RESULTS && (
                    <SpreadsheetView
                        matches={allMatches}
                        predictions={predictions}
                        onPredict={handlePredict}
                        currentStage={currentStage}
                        onStageChange={setCurrentStage}
                        isOfficial={true}
                    />
                )}

                {currentView === AppView.USER_SCORE && (
                    <UserScoreView
                        matches={allMatches}
                        predictions={predictions}
                        userRank={userRank}
                    />
                )}

                {currentView === AppView.LEADERBOARD && (
                    <div className="max-w-2xl mx-auto">
                        <PixelCard className="bg-yellow-100">
                            <h2 className="text-lg md:text-xl text-center text-gray-900 mb-6 uppercase border-b-4 border-gray-900 pb-2 font-bold">Top Palpiteiros</h2>
                                <div className="space-y-4">
                                    {[...leaderboard]
                                        .sort((a, b) => b.points - a.points)
                                        .map((user, index) => (
                                            <div key={user.id} className={`flex items-center justify-between border-b-2 border-gray-300 pb-2 last:border-0 ${currentUser && user.name === currentUser.name ? 'bg-yellow-200 -mx-4 px-4 py-2' : ''}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-lg md:text-2xl w-6 md:w-8 text-gray-400 font-bold">#{index + 1}</div>
                                                    <img src={`https://picsum.photos/seed/${user.avatar}/50/50`} alt="avatar" className="w-8 h-8 md:w-10 md:h-10 border-2 border-black" />
                                                    <span className={`text-gray-900 text-[10px] md:text-base font-bold ${currentUser && user.name === currentUser.name ? 'text-red-600' : ''}`}>
                                                        {user.name} {currentUser && user.name === currentUser.name && '(VOCÊ)'}
                                                    </span>
                                                </div>
                                                <div className="text-green-700 font-bold text-xs md:text-base">{currentUser && user.name === currentUser.name ? userPoints : user.points} PTS</div>
                                            </div>
                                        ))}
                                </div>
                        </PixelCard>
                    </div>
                )}
                </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default App;