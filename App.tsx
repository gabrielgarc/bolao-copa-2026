
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, MatchStage, TeamStats, Match, StandingsResponse } from './types';
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
import { RankingService, MyRankingData } from './services/rankingService';
import { UserService } from './services/userService';

// Models Individuais
import { MatchModel } from './models/match.model';
import { RankingModel } from './models/ranking.model';
import { UserModel } from './models/user.model';
import { LoginScreen } from './components/LoginScreen';
import { AvatarViewer } from './components/AvatarViewer';
import { RulesScreen } from './components/RulesScreen';

type MatchesSubView = 'TABLE' | 'DATE' | 'TODAY';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<AppView>(() => {
        return (localStorage.getItem('bolao_current_view') as AppView) || AppView.SPREADSHEET;
    });
    
    const [currentStage, setCurrentStage] = useState<MatchStage>('GROUPS');
    const [activeGroup, setActiveGroup] = useState<string>('A');
    const [matchesSubView, setMatchesSubView] = useState<MatchesSubView>('TABLE');

    const [allMatches, setAllMatches] = useState<MatchModel[]>([]);
    const [leaderboard, setLeaderboard] = useState<RankingModel[]>([]);
    const [predictions, setPredictions] = useState<Record<string, { home: string, away: string }>>({});
    const [simulatedStandings, setSimulatedStandings] = useState<StandingsResponse>({ groups: {}, overallThirds: [] });
    const [officialStandings, setOfficialStandings] = useState<StandingsResponse>({ groups: {}, overallThirds: [] });
    const [currentUser, setCurrentUser] = useState<UserModel | null>(null);
    const [groupDefinitions, setGroupDefinitions] = useState<Record<string, any[]>>({});
    const [simulatedToday, setSimulatedToday] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [myRanking, setMyRanking] = useState<MyRankingData>({ pointsByMatch: {}, pointsByStage: {}, totalPoints: 0, qualifiedTeamsCount: 0, correctQualifiedTeamIds: [], qualifiedTeamStatuses: {}, qualificationBonusByGroup: {} });

    // Persist current view
    useEffect(() => {
        localStorage.setItem('bolao_current_view', currentView);
    }, [currentView]);

    // Fetch data on mount and whenever the view changes (as requested)
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const userData = await UserService.getCurrentPlayer();
                setCurrentUser(userData);

                if (userData) {
                    const [matchesData, rankingsData, predsData, groupDefs, simulatedDate, simStandings, offStandings, myRankingData] = await Promise.all([
                        MatchService.getAll(),
                        RankingService.getLeaderboard(),
                        PredictionService.getSaved(),
                        ApiService.getGroupDefinitions(),
                        ApiService.getSimulatedDate(),
                        PredictionService.getStandings(false),
                        PredictionService.getStandings(true),
                        RankingService.getMyRanking()
                    ]);

                    setAllMatches(matchesData);
                    setLeaderboard(rankingsData);
                    setPredictions(predsData);
                    setSimulatedStandings(simStandings);
                    setOfficialStandings(offStandings);
                    const definitionsMap = groupDefs.reduce((acc: Record<string, any[]>, group: any) => {
                        acc[group.groupLetter] = group.teams;
                        return acc;
                    }, {});
                    setGroupDefinitions(definitionsMap);
                    setSimulatedToday(simulatedDate);
                    setMyRanking(myRankingData);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [currentView]);

    const handlePredict = async (matchId: string, home: string, away: string) => {
        const newPredictions = {
            ...predictions,
            [matchId]: { home, away }
        };
        setPredictions(newPredictions);
        const newStandings = await PredictionService.save(matchId, home, away);
        if (newStandings) {
            setSimulatedStandings(newStandings);
        }
    };

    // Ranking e pontos do usuário vêm do backend
    const { userPoints, userRank } = useMemo(() => {
        const total = myRanking.totalPoints;
        const allRankings = [...leaderboard].sort((a, b) => b.points - a.points);
        let rank = 1;
        for (const user of allRankings) {
            if (currentUser && user.name === currentUser.name) continue;
            if (total >= user.points) break;
            rank++;
        }
        return { userPoints: total, userRank: rank };
    }, [myRanking, leaderboard, currentUser]);

    // Cálculo de pontos totais do usuário e ranking

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

                                <StandingsTable stats={(isOfficial ? officialStandings : simulatedStandings).groups[`GROUP_${activeGroup}`] || []} />
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

    const currentUserRanking = leaderboard.find(u => u.name === currentUser?.name);
    const userAvatar = currentUser?.avatar || currentUserRanking?.avatar;

    return (
        <div className={`min-h-screen pb-20 transition-colors duration-500 ${currentView === AppView.OFFICIAL_RESULTS ? 'bg-red-900' : 'bg-green-800'} bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] ${currentView === AppView.LEADERBOARD ? 'h-screen overflow-hidden' : ''}`}>
            <Header
                currentView={currentView}
                onViewChange={setCurrentView}
                userName={currentUser?.name || "Carregando..."}
                userRank={userRank}
                userAvatar={userAvatar}
                userPoints={userPoints}
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
                        standings={simulatedStandings}
                        onPredict={handlePredict}
                        currentStage={currentStage}
                        onStageChange={setCurrentStage}
                        pointsByMatch={myRanking.pointsByMatch}
                        qualifiedTeamsCount={myRanking.qualifiedTeamsCount}
                        correctQualifiedTeamIds={myRanking.correctQualifiedTeamIds || []}
                        qualifiedTeamStatuses={myRanking.qualifiedTeamStatuses || {}}
                        qualificationBonusByGroup={myRanking.qualificationBonusByGroup || {}}
                    />
                )}

                {currentView === AppView.OFFICIAL_RESULTS && (
                    <SpreadsheetView
                        matches={allMatches}
                        predictions={predictions}
                        standings={officialStandings}
                        onPredict={handlePredict}
                        currentStage={currentStage}
                        onStageChange={setCurrentStage}
                        isOfficial={true}
                        pointsByMatch={myRanking.pointsByMatch}
                        qualifiedTeamsCount={myRanking.qualifiedTeamsCount}
                        correctQualifiedTeamIds={myRanking.correctQualifiedTeamIds || []}
                    />
                )}

                {currentView === AppView.LEADERBOARD && (
                    <div className="max-w-6xl mx-auto h-[calc(100vh-160px)] flex flex-col overflow-hidden">
                        <PixelCard className="bg-yellow-100 flex-grow flex flex-col overflow-hidden">
                            <h2 className="text-lg md:text-xl text-center text-gray-900 mb-4 uppercase border-b-4 border-gray-900 pb-2 font-bold shrink-0">Top Palpiteiros</h2>
                            <div className="flex-grow overflow-x-auto overflow-y-auto -mx-2 md:mx-0 px-2 md:px-0 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                                <table className="w-full text-left border-collapse relative">
                                    <thead className="sticky top-0 z-20 bg-yellow-100 shadow-[0_2px_0_0_rgba(0,0,0,1)]">
                                        <tr className="text-gray-900 uppercase text-[8px] md:text-xs font-black">
                                            <th className="p-1 md:p-2 text-center w-8 md:w-10">Pos</th>
                                            <th className="p-1 md:p-2">Palpiteiro</th>
                                            <th className="p-1 md:p-2 text-center bg-yellow-200/50" title="Pontos Totais">Total</th>
                                            <th className="p-1 md:p-2 text-center" title="Times Classificados (100pts cada)">Clas.</th>
                                            <th className="p-1 md:p-2 text-center text-blue-700" title="Placar Exato (120pts)">120</th>
                                            <th className="p-1 md:p-2 text-center text-green-700" title="Vencedor + 1 Placar (90pts)">90</th>
                                            <th className="p-1 md:p-2 text-center text-orange-700" title="Apenas Vencedor (60pts)">60</th>
                                            <th className="p-1 md:p-2 text-center text-red-700" title="Apenas 1 Placar (30pts)">30</th>
                                            <th className="p-1 md:p-2 text-center text-gray-500" title="Nenhum Acerto (0pts)">0</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...leaderboard]
                                            .sort((a, b) => b.points - a.points)
                                            .map((user, index) => {
                                                const isMe = currentUser && user.name === currentUser.name;

                                                return (
                                                    <tr key={user.id} className={`border-b-2 border-gray-300 last:border-0 ${isMe ? 'bg-yellow-200' : 'hover:bg-yellow-50'} transition-all text-[10px] md:text-sm`}>
                                                        <td className="p-1 md:p-2 text-center font-bold text-gray-500">#{index + 1}</td>
                                                        <td className="p-1 md:p-2 flex items-center gap-2 md:gap-4 overflow-visible relative hover:z-50">
                                                            <div className="relative group/avatar shrink-0 z-10 hover:z-50 transition-all duration-300">
                                                                <AvatarViewer 
                                                                    configStr={user.avatar} 
                                                                    size={80} 
                                                                    className="w-12 h-12 md:w-20 md:h-20 border-2 md:border-4 border-black bg-gray-200 shadow-[2px_2px_0_rgba(0,0,0,1)] my-1 transition-all duration-300 cursor-zoom-in group-hover/avatar:scale-[2.2] md:group-hover/avatar:scale-[2.8] group-hover/avatar:shadow-[8px_8px_0_rgba(0,0,0,0.5)] origin-left" 
                                                                />
                                                            </div>
                                                            <span className={`font-black text-[10px] md:text-lg uppercase tracking-tighter ${isMe ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {user.name} {isMe && '(VOCÊ)'}
                                                            </span>
                                                        </td>
                                                        <td className="p-1 md:p-2 text-center font-black text-sm md:text-xl text-green-700 bg-yellow-200/50">{isMe ? userPoints : user.points}</td>
                                                        <td className="p-1 md:p-2 text-center font-bold text-gray-700">{user.qualifiedTeamsCount}</td>
                                                        <td className="p-1 md:p-2 text-center font-bold text-blue-700">{user.fullMatches}</td>
                                                        <td className="p-1 md:p-2 text-center font-bold text-green-700">{user.halfMatches}</td>
                                                        <td className="p-1 md:p-2 text-center font-bold text-orange-700">{user.outcomeMatches}</td>
                                                        <td className="p-1 md:p-2 text-center font-bold text-red-700">{user.partialMatches}</td>
                                                        <td className="p-1 md:p-2 text-center font-bold text-gray-500">{user.zeroMatches}</td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </PixelCard>
                    </div>
                )}

                {currentView === AppView.MY_SCORE && (
                    <div className="max-w-4xl mx-auto">
                        <UserScoreView
                            userRank={userRank}
                            myRanking={myRanking}
                        />
                    </div>
                )}

                {currentView === AppView.RULES && (
                    <RulesScreen />
                )}
                </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default App;