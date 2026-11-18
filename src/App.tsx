import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChallengeItem,
  CurriculumId,
  GameId,
  GradeNumber,
  PlanetId,
  SessionConfig,
  StudentProfile,
} from './types/universe';
import {
  GAMES,
  GRADE_BANDS,
  PLANETS,
  SESSION_PHASES,
  getGradeBandForGrade,
} from './engine/worldData';
import {
  calculateChallengeReward,
  evaluateAdaptiveSkillUpdate,
  generateTeacherHandoverSummary,
  getActiveSessionPhase,
  getRecommendedGameForPlanet,
  loadStudentProfile,
  saveStudentProfile,
  unlockNextConstellationStar,
} from './engine/adaptiveEngine';
import { soundEngine } from './engine/soundEngine';
import { GalaxyCanvas } from './components/GalaxyCanvas';
import { GameArena } from './components/games/GameArena';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ConstellationVaultModal } from './components/ConstellationVaultModal';
import { Emoji } from './components/Emoji';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Award,
  Clock,
  Rocket,
  EyeOff,
} from 'lucide-react';

type ShellState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const [profile, setProfile] = useState<StudentProfile>(() => loadStudentProfile());
  const [shellState, setShellState] = useState<ShellState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });

  const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId>('number-nebula');
  const [activeGameId, setActiveGameId] = useState<GameId>('reactor-rush');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [showConstellationModal, setShowConstellationModal] = useState<boolean>(false);

  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    durationMinutes: 15,
    subjectFocus: 'mixed',
    selectedPlanetId: 'number-nebula',
    selectedGameId: 'reactor-rush',
    selectedTopic: 'adaptive',
    difficultyOverride: null,
    skipIntro: false,
    isFullSession: true,
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(65);
  const [sessionStats, setSessionStats] = useState<{
    attempted: number;
    correct: number;
    hintsUsed: number;
    xpEarned: number;
    starsEarned: number;
    gamesPlayed: GameId[];
    skillsPracticed: string[];
    unlockedStarName?: string;
    errorsLogged: {
      topic: string;
      prompt: string;
      studentAnswer: string;
      correctAnswer: string;
    }[];
  }>({
    attempted: 0,
    correct: 0,
    hintsUsed: 0,
    xpEarned: 0,
    starsEarned: 0,
    gamesPlayed: ['reactor-rush'],
    skillsPracticed: [],
    errorsLogged: [],
  });

  const shellStateRef = useRef(shellState);
  shellStateRef.current = shellState;

  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  useEffect(() => {
    soundEngine.setEnabled(profile.preferences.soundEnabled);
  }, [profile.preferences.soundEnabled]);

  const updateAndPersistProfile = useCallback((next: StudentProfile) => {
    setProfile(next);
    saveStudentProfile(next);
  }, []);

  const startWarmUpSession = useCallback(
    (gameToLaunch?: GameId, planetToLaunch?: PlanetId) => {
      soundEngine.playClick();
      const targetPlanet = planetToLaunch || selectedPlanetId;
      const targetGame = gameToLaunch || getRecommendedGameForPlanet(targetPlanet);
      setSelectedPlanetId(targetPlanet);
      setActiveGameId(targetGame);
      setElapsedSeconds(sessionConfig.skipIntro ? 65 : 15);
      setSessionStats({
        attempted: 0,
        correct: 0,
        hintsUsed: 0,
        xpEarned: 0,
        starsEarned: 0,
        gamesPlayed: [targetGame],
        skillsPracticed: [],
        errorsLogged: [],
      });
      setShellState('playing');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [selectedPlanetId, sessionConfig.skipIntro]
  );

  const finishSessionAndShowSummary = useCallback(() => {
    soundEngine.playVictoryFanfare();
    const { updated: updatedConstellation, newlyUnlocked } =
      unlockNextConstellationStar(profile.constellation, selectedPlanetId);

    const nextPlanetProg = {
      ...profile.planetProgress,
      [selectedPlanetId]: Math.min(
        100,
        (profile.planetProgress[selectedPlanetId] || 20) + 15
      ),
    };

    const newRecord = {
      id: `sess-${Date.now()}`,
      timestamp: Date.now(),
      durationSeconds: Math.max(60, elapsedSeconds),
      subjectFocus: sessionConfig.subjectFocus,
      gamesPlayed: sessionStats.gamesPlayed,
      questionsAttempted: Math.max(1, sessionStats.attempted),
      questionsCorrect: sessionStats.correct,
      hintsUsed: sessionStats.hintsUsed,
      xpEarned: Math.max(50, sessionStats.xpEarned),
      starsEarned: Math.max(1, sessionStats.starsEarned),
      skillsPracticed:
        sessionStats.skillsPracticed.length > 0
          ? sessionStats.skillsPracticed
          : ['Number Fluency & Addition'],
      errorsLogged: sessionStats.errorsLogged,
    };

    const updatedProfile: StudentProfile = {
      ...profile,
      xp: profile.xp + Math.max(50, sessionStats.xpEarned),
      stars: profile.stars + Math.max(1, sessionStats.starsEarned),
      level: Math.floor((profile.xp + Math.max(50, sessionStats.xpEarned)) / 400) + 1,
      planetProgress: nextPlanetProg,
      constellation: updatedConstellation,
      sessions: [newRecord, ...profile.sessions.slice(0, 19)],
    };

    updateAndPersistProfile(updatedProfile);
    setSessionStats((prev) => ({
      ...prev,
      unlockedStarName: newlyUnlocked?.name,
    }));
    setShellState('gameover');
  }, [
    profile,
    selectedPlanetId,
    elapsedSeconds,
    sessionConfig.subjectFocus,
    sessionStats,
    updateAndPersistProfile,
  ]);

  useEffect(() => {
    if (shellState !== 'playing') return;
    const totalSeconds = sessionConfig.durationMinutes * 60;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev + 1 >= totalSeconds) {
          return totalSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [shellState, sessionConfig.durationMinutes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showTeacherModal || showConstellationModal) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (shellStateRef.current === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startWarmUpSession();
        } else if (e.key === 'h' || e.key === 'H') {
          setDockCollapsed((c) => !c);
        }
      } else if (shellStateRef.current === 'playing') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setShellState('paused');
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          updateAndPersistProfile({
            ...profile,
            preferences: {
              ...profile.preferences,
              soundEnabled: !profile.preferences.soundEnabled,
            },
          });
        }
      } else if (shellStateRef.current === 'paused') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setShellState('playing');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showTeacherModal,
    showConstellationModal,
    startWarmUpSession,
    profile,
    updateAndPersistProfile,
  ]);

  const handleChallengeCompleted = useCallback(
    (
      challenge: ChallengeItem,
      isCorrect: boolean,
      hintsUsed: number,
      wasRetryRecovery: boolean
    ) => {
      const existingSkill = profile.skills[challenge.skillId];
      const updatedSkill = evaluateAdaptiveSkillUpdate(
        existingSkill,
        challenge,
        isCorrect,
        hintsUsed
      );

      const reward = isCorrect
        ? calculateChallengeReward(
            challenge.basePoints,
            challenge.difficulty,
            updatedSkill.currentStreak,
            hintsUsed,
            wasRetryRecovery
          )
        : { points: 0, xp: 10, stars: 0 };

      const nextProfile: StudentProfile = {
        ...profile,
        xp: profile.xp + reward.xp,
        stars: profile.stars + reward.stars,
        skills: {
          ...profile.skills,
          [challenge.skillId]: updatedSkill,
        },
      };
      updateAndPersistProfile(nextProfile);

      setSessionStats((prev) => ({
        ...prev,
        attempted: prev.attempted + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        hintsUsed: prev.hintsUsed + hintsUsed,
        xpEarned: prev.xpEarned + reward.xp,
        starsEarned: prev.starsEarned + reward.stars,
        gamesPlayed: prev.gamesPlayed.includes(challenge.gameId)
          ? prev.gamesPlayed
          : [...prev.gamesPlayed, challenge.gameId],
        skillsPracticed: prev.skillsPracticed.includes(challenge.skillName)
          ? prev.skillsPracticed
          : [...prev.skillsPracticed, challenge.skillName],
        errorsLogged: isCorrect
          ? prev.errorsLogged
          : [
              ...prev.errorsLogged,
              {
                topic: challenge.topic,
                prompt: challenge.prompt,
                studentAnswer: 'Needs review',
                correctAnswer: String(challenge.correctAnswer),
              },
            ],
      }));
    },
    [profile, updateAndPersistProfile]
  );

  const focusedPlanet =
    PLANETS.find((p) => p.id === selectedPlanetId) || PLANETS[0];
  const activePhase = getActiveSessionPhase(
    elapsedSeconds,
    sessionConfig.durationMinutes
  );
  const remainingSeconds = Math.max(
    0,
    sessionConfig.durationMinutes * 60 - elapsedSeconds
  );
  const remMins = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const remSecs = String(remainingSeconds % 60).padStart(2, '0');

  const currentAdaptiveDifficulty =
    sessionConfig.difficultyOverride ??
    Object.values(profile.skills)[0]?.difficultyLevel ??
    2;

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#160B30] select-none">
      {/* 3D Kurzgesagt Pop-Art Galaxy Viewport */}
      <GalaxyCanvas
        selectedPlanetId={selectedPlanetId}
        onSelectPlanet={(pid) => {
          soundEngine.playClick();
          setSelectedPlanetId(pid);
          setActiveGameId(getRecommendedGameForPlanet(pid));
        }}
        shipColor={profile.shipColor}
        reducedMotion={profile.preferences.reducedMotion}
        isPlayingGame={shellState === 'playing'}
      />

      {/* =====================================================================
          STATE 1: POP-ART COMIC & KURZGESAGT GALAXY EXPLORER
         ===================================================================== */}
      {shellState === 'title' && (
        <div className="fixed inset-0 z-10 overflow-y-auto overscroll-contain lg:overflow-hidden pointer-events-auto lg:pointer-events-none flex flex-col justify-between gap-3 p-3 sm:p-4 md:p-6">
          {/* Top Row: Left Comic Cover Issue Box | Right Cream Comic Dossier */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-3 sm:gap-4">
            {/* Left Third: Comic Book Cover Header & Profile Selector */}
            <div className="pointer-events-auto comic-box halftone-dots rounded-2xl p-3.5 sm:p-4 md:p-5 lg:max-w-md w-full">
              {/* Comic Issue Header Strip */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] font-comic text-sm tracking-wider uppercase -rotate-1 shadow-[2px_2px_0px_#0B0719]">
                  COMIC ISSUE #1 · KURZGESAGT COSMOS
                </span>
                <span className="px-2 py-0.5 bg-[#FF2A85] text-white border-2 border-[#0B0719] font-mono text-xs font-extrabold">
                  ★ {profile.stars} STARS
                </span>
              </div>

              <div className="flex items-center gap-3.5 mb-3.5">
                {/* Bespoke Pop-Art Inline SVG Emblem */}
                <svg
                  viewBox="0 0 56 56"
                  className="w-14 h-14 shrink-0"
                  aria-hidden="true"
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="25"
                    fill="#FF2A85"
                    stroke="#0B0719"
                    strokeWidth="4"
                  />
                  <ellipse
                    cx="28"
                    cy="28"
                    rx="23"
                    ry="9"
                    transform="rotate(-22 28 28)"
                    fill="#00E5FF"
                    stroke="#0B0719"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="11"
                    fill="#FFD600"
                    stroke="#0B0719"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="41"
                    cy="15"
                    r="4.5"
                    fill="#00E676"
                    stroke="#0B0719"
                    strokeWidth="2.5"
                  />
                </svg>
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-comic tracking-wider text-[#FFD600] comic-text-stroke leading-none">
                    LEARNFUN GALAXY!
                  </h1>
                  <p className="text-[11px] sm:text-xs md:text-sm font-extrabold text-[#00E5FF] mt-1 tracking-wide uppercase inline-flex items-center gap-1.5">
                    <Emoji char="🚀" size={16} />
                    <span>Play First · Learning Always · 15-Min Warm-Up</span>
                  </p>
                </div>
              </div>

              {/* Student Grade (1-12) & Curriculum Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
                <div>
                  <label
                    htmlFor="title-grade-select"
                    className="block text-xs font-extrabold uppercase text-[#FFD600] mb-1"
                  >
                    Explorer Grade (1–12)
                  </label>
                  <select
                    id="title-grade-select"
                    aria-label="Select Student Grade"
                    value={profile.grade}
                    onChange={(e) => {
                      soundEngine.playClick();
                      const g = Number(e.target.value) as GradeNumber;
                      updateAndPersistProfile({
                        ...profile,
                        grade: g,
                        gradeBand: getGradeBandForGrade(g),
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FFFDF7] text-[#0B0719] border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] text-sm font-extrabold cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Grade {g} ({GRADE_BANDS[getGradeBandForGrade(g as GradeNumber)].name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="title-curriculum-select"
                    className="block text-xs font-extrabold uppercase text-[#00E5FF] mb-1"
                  >
                    Curriculum Standard
                  </label>
                  <select
                    id="title-curriculum-select"
                    aria-label="Select Curriculum"
                    value={profile.curriculum}
                    onChange={(e) => {
                      soundEngine.playClick();
                      updateAndPersistProfile({
                        ...profile,
                        curriculum: e.target.value as CurriculumId,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FFFDF7] text-[#0B0719] border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] text-sm font-extrabold cursor-pointer"
                  >
                    <option value="CBSE">CBSE / NCERT</option>
                    <option value="ICSE">ICSE</option>
                    <option value="IGCSE">IGCSE</option>
                    <option value="IB">IB</option>
                    <option value="INTERNATIONAL">International</option>
                    <option value="CUSTOM">Custom Teacher</option>
                  </select>
                </div>
              </div>

              {/* Primary Pop-Art CTA + Secondary Actions */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startWarmUpSession()}
                  className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-[#FFD600] hover:bg-[#FFEA00] text-[#0B0719] comic-btn font-comic tracking-wider text-xl md:text-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Emoji char={GAMES[activeGameId]?.emoji || '🚀'} size={24} />
                  <span>
                    LAUNCH {GAMES[activeGameId]?.name.toUpperCase()}!
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setShowConstellationModal(true);
                    }}
                    className="py-2 px-2 sm:px-3 rounded-xl bg-[#FF2A85] hover:bg-[#FF4081] text-white comic-btn text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">
                      Constellation ({profile.constellation.filter((c) => c.unlocked).length}/
                      {profile.constellation.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setShowTeacherModal(true);
                    }}
                    className="py-2 px-2 sm:px-3 rounded-xl bg-[#00E5FF] hover:bg-[#33EBFF] text-[#0B0719] comic-btn text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">Teacher Console</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Top-Right Cream Comic Dossier Card for Selected Planet */}
            <div className="pointer-events-auto comic-box-cream halftone-dots-dark rounded-2xl p-3.5 sm:p-4 md:p-5 lg:max-w-sm w-full">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="px-2.5 py-0.5 border-2 border-[#0B0719] font-comic text-sm tracking-wider uppercase text-[#0B0719] shadow-[2px_2px_0px_#0B0719]"
                  style={{ backgroundColor: focusedPlanet.primaryColor }}
                >
                  PLANET 0{focusedPlanet.number} · {focusedPlanet.domain.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 bg-[#0B0719] text-[#FFD600] rounded font-mono text-xs font-bold tabular-nums">
                  {profile.planetProgress[focusedPlanet.id] || 25}% Explored
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <Emoji char={focusedPlanet.emoji || '🪐'} size={36} />
                <h2 className="text-2xl font-display font-extrabold text-[#0B0719] leading-tight">
                  {focusedPlanet.name}: {focusedPlanet.subtitle}
                </h2>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1.5 mb-3 leading-relaxed">
                {focusedPlanet.description}
              </p>

              <div className="space-y-1.5 mb-3.5">
                <div className="text-xs font-extrabold uppercase text-slate-700">
                  Choose Comic Mission on {focusedPlanet.name}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    focusedPlanet.featuredGameId,
                    ...focusedPlanet.secondaryGameIds,
                  ].map((gid) => {
                    const g = GAMES[gid];
                    const isSelected = activeGameId === gid;
                    return (
                      <button
                        key={gid}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setActiveGameId(gid);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-extrabold border-2 border-[#0B0719] transition-transform cursor-pointer inline-flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#FFD600] text-[#0B0719] shadow-[2px_2px_0px_#0B0719] -translate-y-0.5'
                            : 'bg-white text-[#0B0719] hover:bg-slate-100'
                        }`}
                      >
                        <Emoji char={g.emoji || '🚀'} size={16} />
                        <span>{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  startWarmUpSession(activeGameId, focusedPlanet.id)
                }
                className="w-full py-3 px-4 rounded-xl bg-[#00E676] hover:bg-[#33EB91] text-[#0B0719] comic-btn font-comic tracking-wider text-lg md:text-xl uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <Rocket className="w-5 h-5" />
                <span>
                  PLAY {GAMES[activeGameId]?.name.toUpperCase()} NOW!
                </span>
              </button>
            </div>
          </div>

          {/* Unified Collapsible Bottom Pop-Art Dock (8 Kurzgesagt Planets) */}
          <div className="pointer-events-auto mx-auto w-full max-w-[960px] flex flex-col items-center pb-2 lg:pb-0">
            <button
              type="button"
              onClick={() => setDockCollapsed((c) => !c)}
              className="px-4 py-1 rounded-t-xl bg-[#FFD600] text-[#0B0719] border-[3px] border-b-0 border-[#0B0719] text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Show Galaxy Dock [H]</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Hide Controls [H]</span>
                </>
              )}
            </button>

            {!dockCollapsed && (
              <div className="w-full comic-box halftone-dots rounded-2xl p-3 space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {PLANETS.map((planet) => {
                    const isSelected = planet.id === selectedPlanetId;
                    return (
                      <button
                        key={planet.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedPlanetId(planet.id);
                          setActiveGameId(planet.featuredGameId);
                        }}
                        className={`p-2 rounded-xl border-[3px] border-[#0B0719] text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFFDF7] text-[#0B0719] shadow-[3px_3px_0px_#FFD600] -translate-y-0.5'
                            : 'bg-[#160B30] text-white hover:bg-[#2A1760]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Emoji char={planet.emoji || '🪐'} size={18} />
                          <span
                            className={`text-[11px] font-mono font-extrabold ${
                              isSelected ? 'text-[#0B0719]' : 'text-[#FFD600]'
                            }`}
                          >
                            P0{planet.number}
                          </span>
                        </div>
                        <div className="text-xs md:text-sm font-display font-extrabold truncate">
                          {planet.name}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t-2 border-[#0B0719] text-xs font-bold text-[#FFFDF7]">
                  <span>
                    Click Any 3D Planet · Enter/Space Start · P Pause · M Mute
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateAndPersistProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            soundEnabled: !profile.preferences.soundEnabled,
                          },
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#160B30] border-2 border-[#0B0719] text-xs font-extrabold text-[#00E5FF] flex items-center gap-1 cursor-pointer"
                    >
                      {profile.preferences.soundEnabled ? (
                        <Volume2 className="w-3.5 h-3.5" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>
                        Sound: {profile.preferences.soundEnabled ? 'On' : 'Muted'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateAndPersistProfile({
                          ...profile,
                          preferences: {
                            ...profile.preferences,
                            reducedMotion: !profile.preferences.reducedMotion,
                          },
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#160B30] border-2 border-[#0B0719] text-xs font-extrabold text-[#FFD600] flex items-center gap-1 cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>
                        Reduced Motion:{' '}
                        {profile.preferences.reducedMotion ? 'On' : 'Off'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 2: CINEMATIC PLAYING HUD & FOCUSED GAME ARENA
         ===================================================================== */}
      {shellState === 'playing' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col">
          {/* Sleek Centered Cinematic HUD Pill Bar (No edge-to-edge wide clutter) */}
          <div className="pointer-events-auto shrink-0 w-full max-w-[960px] mx-auto px-3 sm:px-5 pt-2.5">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-[#21124C] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719]">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShellState('title');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#160B30] hover:bg-[#2E1A68] text-[#00E5FF] border-2 border-[#0B0719] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Emoji char="🪐" size={15} />
                  <span className="hidden sm:inline">Galaxy Map</span>
                </button>

                <div className="px-2.5 py-1 rounded-xl bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                  <span
                    data-testid="session-timer-readout"
                    className="text-xs sm:text-sm font-mono font-extrabold tabular-nums"
                  >
                    {remMins}:{remSecs}
                  </span>
                </div>

                {/* Inline Grade Quick-Switcher so students/teachers can test any Grade 1-12 topic live */}
                <select
                  aria-label="Select Grade"
                  value={profile.grade}
                  onChange={(e) => {
                    soundEngine.playClick();
                    const g = Number(e.target.value) as GradeNumber;
                    updateAndPersistProfile({
                      ...profile,
                      grade: g,
                      gradeBand: getGradeBandForGrade(g),
                    });
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#FFFDF7] text-[#0B0719] border-2 border-[#0B0719] text-xs font-extrabold cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div
                  data-testid="hud-xp-readout"
                  className="hidden sm:block px-2.5 py-1 rounded-xl bg-[#FFFDF7] text-[#0B0719] border-2 border-[#0B0719] font-mono text-xs font-extrabold tabular-nums whitespace-nowrap"
                >
                  {profile.xp} XP · ★{profile.stars}
                </div>

                <button
                  type="button"
                  aria-label="Toggle Sound Mute"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    updateAndPersistProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        soundEnabled: !profile.preferences.soundEnabled,
                      },
                    });
                  }}
                  className="p-1.5 rounded-xl bg-[#FFFDF7] text-[#0B0719] border-2 border-[#0B0719] cursor-pointer"
                >
                  {profile.preferences.soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-rose-600" />
                  )}
                </button>

                <button
                  type="button"
                  aria-label="Pause Session"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setShellState('paused');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#FF2A85] text-white border-2 border-[#0B0719] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Mini-Game Arena */}
          <div className="pointer-events-auto flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <GameArena
              key={`${activeGameId}-${profile.grade}-${profile.curriculum}`}
              gameId={activeGameId}
              grade={profile.grade}
              curriculum={profile.curriculum}
              difficulty={currentAdaptiveDifficulty}
              skillProgress={
                Object.values(profile.skills).find(
                  (s) => s.subject === GAMES[activeGameId]?.subject
                )
              }
              onChallengeCompleted={handleChallengeCompleted}
              onSwitchGame={(gid) => setActiveGameId(gid)}
              onFinishSessionEarly={finishSessionAndShowSummary}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 3: PAUSED COMIC MODAL
         ===================================================================== */}
      {shellState === 'paused' && (
        <div
          role="dialog"
          aria-label="Session Paused Modal"
          className="fixed inset-0 z-40 bg-[#160B30]/90 flex items-center justify-center p-4 pointer-events-auto"
        >
          <div className="comic-box-cream halftone-dots-dark rounded-2xl p-6 max-w-md w-full space-y-5">
            <div>
              <span className="px-2.5 py-0.5 bg-[#FF2A85] text-white border-2 border-[#0B0719] font-comic text-sm tracking-wider uppercase">
                TIME FREEZE · PAUSED
              </span>
              <h2 className="text-3xl font-comic tracking-wide text-[#0B0719] mt-2">
                {GAMES[activeGameId]?.name}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-[#21124C] text-white p-3.5 rounded-xl border-[3px] border-[#0B0719] font-mono tabular-nums">
              <div>
                <div className="text-[10px] text-[#00E5FF] font-bold">SOLVED</div>
                <div className="text-lg font-extrabold">
                  {sessionStats.correct}/{sessionStats.attempted}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#FFD600] font-bold">SESSION XP</div>
                <div className="text-lg font-extrabold text-[#FFD600]">
                  +{sessionStats.xpEarned}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#00E676] font-bold">TIME LEFT</div>
                <div className="text-lg font-extrabold">
                  {remMins}:{remSecs}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShellState('playing')}
                className="w-full py-3 px-4 rounded-xl bg-[#FFD600] text-[#0B0719] comic-btn font-display font-extrabold text-sm cursor-pointer"
              >
                Resume Mission [P]
              </button>
              <button
                type="button"
                onClick={finishSessionAndShowSummary}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00E676] text-[#0B0719] comic-btn font-extrabold text-xs cursor-pointer"
              >
                Complete Session & Claim Constellation Star
              </button>
              <button
                type="button"
                onClick={() => setShellState('title')}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-[#0B0719] comic-btn font-extrabold text-xs cursor-pointer"
              >
                Return to LearnFun Galaxy Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 4: GAME OVER / VICTORY COMIC SUMMARY MODAL
         ===================================================================== */}
      {shellState === 'gameover' && (
        <div
          role="dialog"
          aria-label="Warm-Up Session Complete Summary"
          className="fixed inset-0 z-40 bg-[#160B30]/92 flex items-center justify-center p-4 pointer-events-auto overflow-y-auto"
        >
          <div className="comic-box-cream halftone-dots-dark rounded-2xl p-6 max-w-lg w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FFD600] border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] flex items-center justify-center">
                <Award className="w-8 h-8 text-[#0B0719]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] font-comic text-sm tracking-wider uppercase">
                  BOOM! 15-MINUTE WARM-UP COMPLETE!
                </span>
                <h2 className="text-3xl font-comic tracking-wide text-[#0B0719] mt-1">
                  Constellation Star Illuminated!
                </h2>
              </div>
            </div>

            {sessionStats.unlockedStarName && (
              <div className="bg-[#FFD600] text-[#0B0719] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-xl p-3 text-xs font-extrabold flex items-center gap-2">
                <Sparkles className="w-5 h-5 shrink-0" />
                <span>
                  New Star Added to Your Sky: <strong>{sessionStats.unlockedStarName}</strong>
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-center bg-[#21124C] text-white p-4 rounded-xl border-[3px] border-[#0B0719] font-mono tabular-nums">
              <div>
                <div className="text-[10px] text-[#00E5FF] font-bold">CHALLENGES</div>
                <div className="text-xl font-extrabold">
                  {Math.max(1, sessionStats.correct)} /{' '}
                  {Math.max(1, sessionStats.attempted)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#FFD600] font-bold">XP EARNED</div>
                <div className="text-xl font-extrabold text-[#FFD600]">
                  +{Math.max(50, sessionStats.xpEarned)} XP
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#FF2A85] font-bold">TOTAL STARS</div>
                <div className="text-xl font-extrabold text-[#00E676]">
                  ★ {profile.stars}
                </div>
              </div>
            </div>

            <div className="bg-white border-[3px] border-[#0B0719] rounded-xl p-4 text-xs text-[#0B0719] space-y-1">
              <div className="font-mono uppercase text-[#FF2A85] font-extrabold">
                Live Class Handover Summary
              </div>
              <p className="leading-relaxed font-semibold">
                {generateTeacherHandoverSummary(profile)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={() => startWarmUpSession()}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FFD600] text-[#0B0719] comic-btn font-display font-extrabold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Next Warm-Up</span>
              </button>
              <button
                type="button"
                onClick={() => setShellState('title')}
                className="py-3 px-4 rounded-xl bg-[#00E5FF] text-[#0B0719] comic-btn font-extrabold text-sm cursor-pointer"
              >
                Explore Galaxy Map
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeacherModal && (
        <TeacherDashboard
          profile={profile}
          sessionConfig={sessionConfig}
          onUpdateProfile={updateAndPersistProfile}
          onUpdateSessionConfig={setSessionConfig}
          onLaunchCustomSession={(cfg) => {
            setShowTeacherModal(false);
            startWarmUpSession(cfg.selectedGameId, cfg.selectedPlanetId);
          }}
          onClose={() => setShowTeacherModal(false)}
        />
      )}

      {showConstellationModal && (
        <ConstellationVaultModal
          profile={profile}
          onUpdateProfile={updateAndPersistProfile}
          onClose={() => setShowConstellationModal(false)}
        />
      )}
    </div>
  );
}
