import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChallengeItem,
  CurriculumId,
  GameId,
  GradeNumber,
  SkillProgress,
} from '../../types/universe';
import { generateChallengeForGame } from '../../engine/questionBank';
import { GAMES } from '../../engine/worldData';
import { soundEngine } from '../../engine/soundEngine';
import { Emoji, EmojiText, fireComicCelebration } from '../Emoji';
import { MathVisualizerLab } from './MathVisualizerLab';
import {
  Lightbulb,
  CheckCircle2,
  RotateCcw,
  Play,
  ArrowRight,
  ShieldAlert,
  Zap,
  Eye,
  Flame,
  Trophy,
  Keyboard,
  Compass,
} from 'lucide-react';

interface GameArenaProps {
  gameId: GameId;
  grade: GradeNumber;
  curriculum: CurriculumId;
  difficulty: number;
  skillProgress?: SkillProgress;
  onChallengeCompleted: (
    challenge: ChallengeItem,
    isCorrect: boolean,
    hintsUsed: number,
    wasRetryRecovery: boolean
  ) => void;
  onSwitchGame: (newGameId: GameId) => void;
  onFinishSessionEarly: () => void;
}

const ALL_GAME_IDS: GameId[] = [
  'reactor-rush',
  'fraction-forge',
  'geometry-sculptor',
  'pattern-planet',
  'probability-observatory',
  'logic-labyrinth',
  'algorithm-maze',
  'bug-hunter',
  'memory-constellation',
  'cosmic-boss-battle',
];

export const GameArena: React.FC<GameArenaProps> = ({
  gameId,
  grade,
  curriculum,
  difficulty,
  onChallengeCompleted,
  onSwitchGame,
  onFinishSessionEarly,
}) => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [practiceMode, setPracticeMode] = useState<'challenge' | 'visual-lab' | 'blitz'>('challenge');
  const [localTierOverride, setLocalTierOverride] = useState<number | null>(null);
  const [blitzSecondsLeft, setBlitzSecondsLeft] = useState<number>(60);
  const [blitzScore, setBlitzScore] = useState<number>(0);
  const [questStars, setQuestStars] = useState<number>(0);
  const [showDecompositionGrid, setShowDecompositionGrid] = useState<boolean>(true);
  const [showTopicRibbon, setShowTopicRibbon] = useState<boolean>(false);
  const [showUniversalKeypad, setShowUniversalKeypad] = useState<boolean>(false);

  const effectiveDifficulty = localTierOverride ?? difficulty;
  const difficultyRef = useRef<number>(effectiveDifficulty);
  difficultyRef.current = effectiveDifficulty;

  const autoAdvanceTimerRef = useRef<number | null>(null);

  const [challenge, setChallenge] = useState<ChallengeItem>(() =>
    generateChallengeForGame(gameId, grade, effectiveDifficulty, curriculum, 0)
  );
  const [hintsShown, setHintsShown] = useState<number>(0);
  const [hadMistakeThisRound, setHadMistakeThisRound] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'correct' | 'retry';
    message: string;
    callout?: string;
  }>({ type: 'idle', message: '' });

  // A: Reactor Rush
  const [numpadInput, setNumpadInput] = useState<string>('');
  const [combo, setCombo] = useState<number>(1);

  // B: Fraction Forge
  const [ringTotalSectors, setRingTotalSectors] = useState<number>(
    challenge.payload?.totalSegments || 6
  );
  const [activeSectorCount, setActiveSectorCount] = useState<number>(1);

  // C: Geometry Sculptor
  const [sculptWidth, setSculptWidth] = useState<number>(4);
  const [sculptHeight, setSculptHeight] = useState<number>(4);

  // D: Logic Labyrinth
  const [eliminatedNodes, setEliminatedNodes] = useState<string[]>([]);
  const [activeClueIdx, setActiveClueIdx] = useState<number>(0);

  // E: Algorithm Maze
  const [commandQueue, setCommandQueue] = useState<string[]>([]);
  const [roverPos, setRoverPos] = useState<{
    x: number;
    y: number;
    dir: 'N' | 'E' | 'S' | 'W';
  }>(() => ({
    x: challenge.payload?.start?.x ?? 0,
    y: challenge.payload?.start?.y ?? 2,
    dir: challenge.payload?.start?.dir ?? 'E',
  }));
  const [roverTraceMessage, setRoverTraceMessage] = useState<string>(
    'Tap any adjacent grid tile or command block to move Rover!'
  );

  // F: Bug Hunter
  const [selectedBugLine, setSelectedBugLine] = useState<number | null>(null);
  const [hoveredPatchId, setHoveredPatchId] = useState<string | null>(null);

  // G & H: Pattern Planet & Probability Observatory
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [simTrials, setSimTrials] = useState<Record<string, number>>({});
  const [totalSpins, setTotalSpins] = useState<number>(0);
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [selectedWheelColor, setSelectedWheelColor] = useState<string | null>(null);

  // I: Memory Constellation
  const [isFlashingStars, setIsFlashingStars] = useState<boolean>(false);
  const [activeFlashIdx, setActiveFlashIdx] = useState<number | null>(null);
  const [playerStarSeq, setPlayerStarSeq] = useState<number[]>([]);

  // J: Cosmic Boss Battle
  const [bossStageIdx, setBossStageIdx] = useState<number>(0);

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAutoAdvance();
  }, [clearAutoAdvance]);

  const triggerMemoryFlash = useCallback((seq: number[]) => {
    setIsFlashingStars(true);
    setPlayerStarSeq([]);
    seq.forEach((starId, idx) => {
      setTimeout(() => {
        setActiveFlashIdx(starId);
        soundEngine.playClick();
      }, idx * 450 + 200);
    });
    setTimeout(() => {
      setActiveFlashIdx(null);
      setIsFlashingStars(false);
    }, seq.length * 450 + 350);
  }, []);

  useEffect(() => {
    clearAutoAdvance();
    const nextChallenge = generateChallengeForGame(
      gameId,
      grade,
      difficultyRef.current,
      curriculum,
      stepIndex
    );
    setChallenge(nextChallenge);
    setHintsShown(0);
    setHadMistakeThisRound(false);
    setFeedback({ type: 'idle', message: '' });
    setNumpadInput('');
    setSelectedOption('');

    if (gameId === 'fraction-forge') {
      setRingTotalSectors(nextChallenge.payload.totalSegments || 6);
      setActiveSectorCount(1);
    } else if (gameId === 'geometry-sculptor') {
      setSculptWidth(3);
      setSculptHeight(3);
    } else if (gameId === 'logic-labyrinth') {
      setEliminatedNodes([]);
      setActiveClueIdx(0);
    } else if (gameId === 'algorithm-maze') {
      setCommandQueue([]);
      setRoverPos({
        x: nextChallenge.payload.start.x,
        y: nextChallenge.payload.start.y,
        dir: nextChallenge.payload.start.dir,
      });
      setRoverTraceMessage('Tap an adjacent grid cell or command button to guide Rover!');
    } else if (gameId === 'bug-hunter') {
      setSelectedBugLine(null);
      setHoveredPatchId(null);
    } else if (gameId === 'probability-observatory') {
      setSimTrials({});
      setTotalSpins(0);
      setSelectedWheelColor(nextChallenge.payload.targetSector || null);
    } else if (gameId === 'memory-constellation') {
      setPlayerStarSeq([]);
      triggerMemoryFlash(nextChallenge.payload.sequence || [0, 4, 8]);
    } else if (gameId === 'cosmic-boss-battle') {
      setBossStageIdx(0);
    }
  }, [gameId, grade, curriculum, stepIndex, localTierOverride, clearAutoAdvance, triggerMemoryFlash]);

  // 60-Second Blitz Sprint countdown timer
  useEffect(() => {
    if (practiceMode !== 'blitz') return;
    const timer = window.setInterval(() => {
      setBlitzSecondsLeft((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [practiceMode]);

  const handleNextChallenge = useCallback(() => {
    clearAutoAdvance();
    soundEngine.playClick();
    setStepIndex((i) => i + 1);
  }, [clearAutoAdvance]);

  const handleCompleteSuccess = useCallback(
    (customMessage?: string, callout: string = 'BOOM! 💥') => {
      if (feedback.type === 'correct') return;

      soundEngine.playCorrect(combo);
      fireComicCelebration(['🚀', '⭐', '💥', '⚡', '🎉']);
      setCombo((c) => c + 1);
      setQuestStars((q) => (q + 1 > 5 ? 1 : q + 1));
      if (practiceMode === 'blitz') {
        setBlitzScore((s) => s + 100 * combo);
      }
      setFeedback({
        type: 'correct',
        callout,
        message: customMessage || `Verified! ${challenge.explanation}`,
      });
      onChallengeCompleted(challenge, true, hintsShown, hadMistakeThisRound);

      clearAutoAdvance();
      autoAdvanceTimerRef.current = window.setTimeout(
        () => {
          setStepIndex((i) => i + 1);
        },
        practiceMode === 'blitz' ? 750 : 1350
      );
    },
    [
      feedback.type,
      challenge,
      combo,
      practiceMode,
      hintsShown,
      hadMistakeThisRound,
      onChallengeCompleted,
      clearAutoAdvance,
    ]
  );

  const handleMistake = useCallback(
    (customRetryMessage: string) => {
      if (feedback.type === 'correct') return;
      soundEngine.playGentleHintOrRetry();
      setCombo(1);
      setHadMistakeThisRound(true);
      setFeedback({
        type: 'retry',
        callout: 'WHOOPS! 🔄',
        message: customRetryMessage,
      });
      onChallengeCompleted(challenge, false, hintsShown, false);
    },
    [feedback.type, challenge, hintsShown, onChallengeCompleted]
  );

  const handleRevealHint = () => {
    soundEngine.playClick();
    setHintsShown((h) => Math.min(challenge.hints.length, h + 1));
  };

  const verifyDirectAnswer = useCallback(
    (rawVal: string, sourceLabel: string = 'Visual Lab') => {
      if (feedback.type === 'correct') {
        handleNextChallenge();
        return;
      }
      const clean = rawVal.trim();
      if (!clean) return;

      if (gameId === 'geometry-sculptor') {
        const matchDim = clean.match(/^(\d+)\s*[x×*,\s]\s*(\d+)$/i);
        if (matchDim) {
          const w = Number(matchDim[1]);
          const h = Number(matchDim[2]);
          setSculptWidth(Math.max(1, Math.min(10, w)));
          setSculptHeight(Math.max(1, Math.min(8, h)));
          if (
            w * h === challenge.payload.targetArea &&
            2 * (w + h) === challenge.payload.targetPerimeter
          ) {
            handleCompleteSuccess(
              `Blueprint Matched via ${sourceLabel}! ${w} × ${h} gives Area = ${w * h} and Perimeter = ${2 * (w + h)}.`,
              'BAM! 📐'
            );
            return;
          }
        }
      }

      if (gameId === 'fraction-forge') {
        const matchFrac = clean.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (matchFrac) {
          const n = Number(matchFrac[1]);
          const d = Number(matchFrac[2]);
          if (d > 0) {
            setRingTotalSectors(d);
            setActiveSectorCount(n);
            if (
              n * challenge.payload.targetDenominator ===
              d * challenge.payload.targetNumerator
            ) {
              handleCompleteSuccess(
                `Harmonic Equivalence Locked! ${n}/${d} = ${challenge.payload.targetNumerator}/${challenge.payload.targetDenominator}.`,
                'POW! 🍕'
              );
              return;
            }
          }
        }
      }

      if (gameId === 'cosmic-boss-battle') {
        const currentStage = challenge.payload.stages[bossStageIdx];
        if (currentStage && clean === String(currentStage.correct)) {
          soundEngine.playCorrect(bossStageIdx + 1);
          if (bossStageIdx + 1 < challenge.payload.stages.length) {
            setBossStageIdx((s) => s + 1);
            setNumpadInput('');
            setFeedback({
              type: 'idle',
              message: `Lock ${currentStage.stageNumber} Unlocked!`,
            });
          } else {
            handleCompleteSuccess(
              'QUANTUM VAULT BREACHED! All 3 Multi-Stage Boss Locks Solved!',
              'K.O.! 👾'
            );
          }
          return;
        }
      }

      if (
        clean === String(challenge.correctAnswer) ||
        challenge.acceptedVariations.includes(clean)
      ) {
        handleCompleteSuccess(
          `Solved via ${sourceLabel}! ${challenge.explanation}`,
          'ZAP! ⚡'
        );
      } else {
        handleMistake(
          `Value (${clean}) doesn't match the target yet. Adjust the interactive visual model or tap Hint!`
        );
      }
    },
    [
      feedback.type,
      handleNextChallenge,
      gameId,
      challenge,
      bossStageIdx,
      handleCompleteSuccess,
      handleMistake,
    ]
  );

  const handleVisualSelectAnswer = useCallback(
    (val: string, autoSubmit?: boolean) => {
      if (feedback.type === 'correct') return;
      setNumpadInput(val);
      setSelectedOption(val);
      if (autoSubmit) {
        verifyDirectAnswer(val, 'Interactive Visual Model');
      }
    },
    [feedback.type, verifyDirectAnswer]
  );

  const adjustNumpadByDelta = useCallback(
    (delta: number) => {
      if (feedback.type === 'correct') return;
      soundEngine.playClick();
      setNumpadInput((prev) => {
        const current = Number(prev);
        const base = Number.isFinite(current) && prev.trim() !== '' ? current : 0;
        const next = String(base + delta);
        setSelectedOption(next);
        return next;
      });
    },
    [feedback.type]
  );

  // Live bidirectional sync: typing on the Universal Math Keypad immediately updates Fraction Forge & Geometry Sculptor visuals
  useEffect(() => {
    const clean = numpadInput.trim();
    if (!clean) return;
    if (gameId === 'fraction-forge') {
      const mFrac = clean.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (mFrac) {
        const n = Number(mFrac[1]);
        const d = Number(mFrac[2]);
        if (d >= 2 && d <= 16 && n >= 0 && n <= d) {
          setRingTotalSectors(d);
          setActiveSectorCount(n);
        }
      } else if (/^\d+$/.test(clean)) {
        const n = Number(clean);
        if (n >= 0 && n <= ringTotalSectors) {
          setActiveSectorCount(n);
        }
      }
    } else if (gameId === 'geometry-sculptor') {
      const mDim = clean.match(/^(\d+)\s*[x×*]\s*(\d+)$/i);
      if (mDim) {
        const w = Number(mDim[1]);
        const h = Number(mDim[2]);
        if (w >= 1 && w <= 10 && h >= 1 && h <= 8) {
          setSculptWidth(w);
          setSculptHeight(h);
        }
      }
    }
  }, [numpadInput, gameId, ringTotalSectors]);

  const verifyReactorInput = useCallback(() => {
    verifyDirectAnswer(numpadInput, 'Math Keypad');
  }, [verifyDirectAnswer, numpadInput]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (feedback.type === 'correct') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextChallenge();
        }
        return;
      }

      if (/^[0-9./x×-]$/i.test(e.key)) {
        const char = e.key === '×' ? 'x' : e.key;
        setShowUniversalKeypad(true);
        setNumpadInput((prev) => {
          const next = prev.length < 8 ? prev + char : prev;
          setSelectedOption(next);
          return next;
        });
      } else if (e.key === 'Backspace') {
        setNumpadInput((prev) => {
          const next = prev.slice(0, -1);
          setSelectedOption(next);
          return next;
        });
      } else if (e.key === 'Enter' && numpadInput.trim().length > 0) {
        e.preventDefault();
        verifyDirectAnswer(numpadInput, 'Keyboard');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [feedback.type, numpadInput, handleNextChallenge, verifyDirectAnswer]);

  const verifyFractionForge = () => {
    if (feedback.type === 'correct') return;
    const targetNum = challenge.payload.targetNumerator;
    const targetDen = challenge.payload.targetDenominator;
    if (activeSectorCount * targetDen === ringTotalSectors * targetNum) {
      handleCompleteSuccess(
        `Harmonic Equivalence Locked! ${activeSectorCount}/${ringTotalSectors} = ${targetNum}/${targetDen} (${challenge.payload.percentValue}).`,
        'POW! 🍕'
      );
    } else {
      handleMistake(
        `Current ring ratio is ${activeSectorCount}/${ringTotalSectors}, which does not equal ${targetNum}/${targetDen}. Try energizing ${challenge.payload.requiredActive} out of ${challenge.payload.totalSegments} slices!`
      );
    }
  };

  const verifyGeometrySculptor = () => {
    if (feedback.type === 'correct') return;
    const area = sculptWidth * sculptHeight;
    const perim = 2 * (sculptWidth + sculptHeight);
    if (
      area === challenge.payload.targetArea &&
      perim === challenge.payload.targetPerimeter
    ) {
      handleCompleteSuccess(
        `Blueprint Matched! ${sculptWidth} × ${sculptHeight} gives Area = ${area} and Perimeter = ${perim}.`,
        'BAM! 📐'
      );
    } else {
      handleMistake(
        `Your ${sculptWidth}×${sculptHeight} lattice has Area = ${area} (target ${challenge.payload.targetArea}) and Perimeter = ${perim} (target ${challenge.payload.targetPerimeter}).`
      );
    }
  };

  const verifyLogicLabyrinth = (portalId: string) => {
    if (feedback.type === 'correct') return;
    if (portalId === String(challenge.correctAnswer)) {
      handleCompleteSuccess(`Safe Portal Unlocked! ${challenge.explanation}`, 'EUREKA! 🧠');
    } else {
      handleMistake(
        `Portal ${portalId} violates one of the clues! Toggle "Eliminate" on trap portals to narrow down the truth.`
      );
    }
  };

  const executeAlgorithmMaze = (queueToRun: string[]) => {
    if (feedback.type === 'correct') return;
    const start = challenge.payload.start;
    const goal = challenge.payload.goal;
    const hazards: { x: number; y: number }[] = challenge.payload.hazards || [];
    const gridSize = challenge.payload.gridSize || 5;

    const atomicSteps: ('FORWARD' | 'LEFT' | 'RIGHT')[] = [];
    queueToRun.forEach((cmd) => {
      if (cmd === 'REPEAT_2_FORWARD') {
        atomicSteps.push('FORWARD', 'FORWARD');
      } else if (cmd === 'REPEAT_3_FORWARD') {
        atomicSteps.push('FORWARD', 'FORWARD', 'FORWARD');
      } else if (cmd === 'FORWARD' || cmd === 'LEFT' || cmd === 'RIGHT') {
        atomicSteps.push(cmd);
      }
    });

    let curX = start.x;
    let curY = start.y;
    let curDir: 'N' | 'E' | 'S' | 'W' = start.dir;
    const dirOrder: ('N' | 'E' | 'S' | 'W')[] = ['N', 'E', 'S', 'W'];

    for (let i = 0; i < atomicSteps.length; i++) {
      const step = atomicSteps[i];
      if (step === 'LEFT') {
        curDir = dirOrder[(dirOrder.indexOf(curDir) + 3) % 4];
      } else if (step === 'RIGHT') {
        curDir = dirOrder[(dirOrder.indexOf(curDir) + 1) % 4];
      } else if (step === 'FORWARD') {
        if (curDir === 'E') curX += 1;
        if (curDir === 'W') curX -= 1;
        if (curDir === 'S') curY += 1;
        if (curDir === 'N') curY -= 1;

        if (curX < 0 || curX >= gridSize || curY < 0 || curY >= gridSize) {
          setRoverPos({
            x: Math.max(0, Math.min(gridSize - 1, curX)),
            y: Math.max(0, Math.min(gridSize - 1, curY)),
            dir: curDir,
          });
          setRoverTraceMessage(`Step ${i + 1}: Rover hit sector boundary!`);
          handleMistake(
            `Rover went out of bounds at step ${i + 1}. Adjust your command sequence!`
          );
          return;
        }

        if (hazards.some((h) => h.x === curX && h.y === curY)) {
          setRoverPos({ x: curX, y: curY, dir: curDir });
          setRoverTraceMessage(`Step ${i + 1}: Asteroid collision at (${curX}, ${curY})!`);
          handleMistake(
            `Collision with asteroid at (${curX}, ${curY})! Reroute around hazards.`
          );
          return;
        }
      }
    }

    setRoverPos({ x: curX, y: curY, dir: curDir });
    if (curX === goal.x && curY === goal.y) {
      setRoverTraceMessage(`Target reached at (${curX}, ${curY}) in ${queueToRun.length} blocks!`);
      handleCompleteSuccess(
        `Autonomous Rover reached the Quantum Crystal at (${goal.x}, ${goal.y})!`,
        'WHAM! 🤖'
      );
    } else {
      setRoverTraceMessage(
        `Rover stopped at (${curX}, ${curY}) facing ${curDir}. Goal is (${goal.x}, ${goal.y}).`
      );
      handleMistake(
        `Rover finished at (${curX}, ${curY}), short of the crystal at (${goal.x}, ${goal.y}).`
      );
    }
  };

  // Interactive Click-on-Maze-Tile step builder for Algorithm Maze!
  const handleMazeTileClick = (tx: number, ty: number) => {
    if (feedback.type === 'correct') return;
    const dx = tx - roverPos.x;
    const dy = ty - roverPos.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;

    soundEngine.playClick();
    const targetDir: 'N' | 'E' | 'S' | 'W' =
      dx === 1 ? 'E' : dx === -1 ? 'W' : dy === 1 ? 'S' : 'N';
    const dirOrder: ('N' | 'E' | 'S' | 'W')[] = ['N', 'E', 'S', 'W'];
    const curIdx = dirOrder.indexOf(roverPos.dir);
    const tgtIdx = dirOrder.indexOf(targetDir);
    const diff = (tgtIdx - curIdx + 4) % 4;

    const addedCmds: string[] = [];
    if (diff === 1) addedCmds.push('RIGHT');
    else if (diff === 3) addedCmds.push('LEFT');
    else if (diff === 2) addedCmds.push('RIGHT', 'RIGHT');
    addedCmds.push('FORWARD');

    const nextQueue = [...commandQueue, ...addedCmds];
    setCommandQueue(nextQueue);
    setRoverPos({ x: tx, y: ty, dir: targetDir });
    setRoverTraceMessage(`Stepped to (${tx}, ${ty}) facing ${targetDir}.`);

    if (
      tx === challenge.payload.goal.x &&
      ty === challenge.payload.goal.y
    ) {
      executeAlgorithmMaze(nextQueue);
    }
  };

  const verifyBugHunter = (patchId: string) => {
    if (feedback.type === 'correct') return;
    const patchObj = challenge.payload.patches.find((p: { id: string }) => p.id === patchId);
    const bugIdx = challenge.payload.buggyLineIndex;

    if (selectedBugLine !== null && selectedBugLine !== bugIdx) {
      handleMistake(
        `You highlighted Line ${selectedBugLine + 1}, but the bug is on Line ${bugIdx + 1}. Click Line ${bugIdx + 1} first!`
      );
      return;
    }

    if (patchObj && patchObj.isCorrect) {
      setSelectedBugLine(bugIdx);
      handleCompleteSuccess(`Bug Patched on Line ${bugIdx + 1}! ${patchObj.reason}`, 'ZAP! 🐛');
    } else {
      handleMistake(
        patchObj ? `Patch rejected: ${patchObj.reason}` : 'Select the correct patch!'
      );
    }
  };

  const spinProbabilityWheel = (count: number) => {
    soundEngine.playClick();
    const sectors: { color: string; count: number }[] = challenge.payload.sectors;
    const total: number = challenge.payload.totalSectors;
    const nextCounts = { ...simTrials };
    for (let c = 0; c < count; c++) {
      let r = Math.floor(Math.random() * total);
      for (const s of sectors) {
        if (r < s.count) {
          nextCounts[s.color] = (nextCounts[s.color] || 0) + 1;
          break;
        }
        r -= s.count;
      }
    }
    setSimTrials(nextCounts);
    setTotalSpins((s) => s + count);
    setWheelAngle((a) => a + 360 + Math.floor(Math.random() * 360));
  };

  const handleStarClick = (starIdx: number) => {
    if (isFlashingStars || feedback.type === 'correct') return;
    soundEngine.playClick();
    const targetSeq: number[] = challenge.payload.sequence;
    const nextPlayerSeq = [...playerStarSeq, starIdx];
    setPlayerStarSeq(nextPlayerSeq);

    const pos = nextPlayerSeq.length - 1;
    if (targetSeq[pos] !== starIdx) {
      handleMistake(
        `Star #${starIdx + 1} was out of sequence! Click "Replay Star Flash" to watch the pattern again.`
      );
      setPlayerStarSeq([]);
      return;
    }

    if (nextPlayerSeq.length === targetSeq.length) {
      handleCompleteSuccess(`Constellation Pattern Reconstructed!`, 'STARBURST! 🌟');
    }
  };

  const meta = GAMES[gameId];

  return (
    <div className="relative z-10 w-full max-w-[960px] mx-auto px-3 sm:px-5 pt-2.5 pb-10 flex flex-col gap-3.5">
      {/* =====================================================================
          CINEMATIC SPOTLIGHT HEADER BAR (Compact, Focused, Zero Clutter)
         ===================================================================== */}
      <div className="comic-box halftone-dots rounded-2xl px-3.5 sm:px-5 py-2.5 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Mission Title & Question Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] flex items-center justify-center -rotate-3 shrink-0"
              style={{ backgroundColor: meta.accentHex }}
            >
              <Emoji char={meta.emoji || '🚀'} size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 bg-[#FF2A85] text-white border-2 border-[#0B0719] font-comic text-xs tracking-wider leading-none">
                  QUESTION #{stepIndex + 1}
                </span>
                {combo > 1 && (
                  <span className="px-2 py-0.5 bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] font-comic text-xs tracking-wider leading-none inline-flex items-center gap-1">
                    <Emoji char="🔥" size={12} /> {combo}x STREAK
                  </span>
                )}
                <span className="text-xs font-mono font-extrabold text-[#FFD600] hidden sm:inline">
                  {'★'.repeat(questStars)}
                  {'☆'.repeat(Math.max(0, 5 - questStars))}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-comic tracking-wider text-[#FFD600] comic-text-stroke leading-none mt-0.5 truncate">
                {meta.name}
              </h2>
            </div>
          </div>

          {/* Right: Sleek Mode Switcher, Tier Selector & Topic Switcher Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 3 Practice Mode Tabs */}
            <div
              role="group"
              aria-label="Practice and Learning Mode Selector"
              className="flex items-center gap-1 bg-[#160B30] p-1 rounded-xl border-2 border-[#0B0719]"
            >
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPracticeMode('challenge');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                  practiceMode === 'challenge'
                    ? 'bg-[#FFD600] text-[#0B0719]'
                    : 'text-white hover:text-[#FFD600]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Challenge</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPracticeMode('visual-lab');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                  practiceMode === 'visual-lab'
                    ? 'bg-[#00E5FF] text-[#0B0719]'
                    : 'text-white hover:text-[#00E5FF]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Lab</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPracticeMode('blitz');
                  setBlitzSecondsLeft(60);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                  practiceMode === 'blitz'
                    ? 'bg-[#00E676] text-[#0B0719]'
                    : 'text-white hover:text-[#00E676]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>60s Blitz</span>
              </button>
            </div>

            {/* Compact Tier Selector (T1 - T5) */}
            <div className="flex items-center gap-0.5 bg-[#160B30] p-1 rounded-xl border-2 border-[#0B0719]">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  aria-label={`Difficulty Tier ${lvl}`}
                  onClick={() => {
                    soundEngine.playClick();
                    setLocalTierOverride(lvl);
                  }}
                  className={`w-6 h-6 rounded-md font-mono text-[11px] font-extrabold cursor-pointer ${
                    effectiveDifficulty === lvl
                      ? 'bg-[#FF2A85] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  T{lvl}
                </button>
              ))}
            </div>

            {/* Topic Switcher Toggle Button */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowTopicRibbon((r) => !r);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] shadow-[2px_2px_0px_#0B0719] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{showTopicRibbon ? 'Hide Topics' : 'Switch Topic (10)'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Topic Switcher Ribbon (Also accessible via quick pills when toggled) */}
        {showTopicRibbon && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t-2 border-[#0B0719]/50">
            {ALL_GAME_IDS.map((gid) => {
              const g = GAMES[gid];
              const active = gid === gameId;
              return (
                <button
                  key={gid}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onSwitchGame(gid);
                    setShowTopicRibbon(false);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border-2 border-[#0B0719] whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#FFD600] text-[#0B0719]'
                      : 'bg-[#160B30] text-white hover:bg-[#2E1A68]'
                  }`}
                >
                  <Emoji char={g.emoji || '🚀'} size={14} />
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          FOCUSED CINEMATIC 2-PANEL STAGE (Big Typography + Interactive Visuals)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left/Center 7-Col: Big Hero Question + Interactive Topic Visualizer */}
        <div className="lg:col-span-7 comic-box-cream halftone-dots-dark rounded-2xl p-4 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            {/* BIG Hero Question Speech Bubble (Extra-Large Crisp Typography, Zero Clutter) */}
            <div
              key={challenge.id}
              className="animate-comic-pop bg-white border-[4px] border-[#0B0719] shadow-[5px_5px_0px_#0B0719] rounded-2xl p-4 sm:p-6"
            >
              {gameId === 'reactor-rush' ? (
                (() => {
                  const [mainEq, parenNote] = challenge.prompt.split(/\s+\(/);
                  return (
                    <div className="flex flex-col items-center justify-center gap-2 py-2 sm:py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <Emoji char={challenge.emoji || '⚡'} size={42} />
                        <h3 className="text-3xl sm:text-5xl md:text-6xl font-mono font-extrabold text-[#0B0719] tracking-tight tabular-nums leading-none">
                          {mainEq}
                        </h3>
                      </div>
                      {parenNote && (
                        <span className="px-3 py-0.5 rounded-lg bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] font-mono text-xs sm:text-sm font-extrabold uppercase">
                          ({parenNote}
                        </span>
                      )}
                    </div>
                  );
                })()
              ) : (
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-[#0B0719] leading-snug">
                  <EmojiText text={challenge.prompt} emojiSize={32} />
                </h3>
              )}
            </div>

            {/* ===============================================================
                1. REACTOR RUSH INTERACTIVE MATH VISUALIZER (Grades 1-12)
               =============================================================== */}
            {gameId === 'reactor-rush' && (
              <MathVisualizerLab
                challenge={challenge}
                gameId={gameId}
                grade={grade}
                practiceMode={practiceMode}
                currentInput={numpadInput}
                onSelectAnswer={handleVisualSelectAnswer}
              />
            )}

            {/* ===============================================================
                2. FRACTION FORGE INTERACTIVE RING + EQUIVALENCE BAR MODEL
               =============================================================== */}
            {gameId === 'fraction-forge' && (
              <div className="flex flex-col items-center gap-3.5">
                <div className="flex flex-col sm:flex-row items-center gap-5 justify-center w-full">
                  <svg
                    viewBox="0 0 220 220"
                    className="w-44 h-44 sm:w-52 sm:h-52 select-none shrink-0"
                    aria-label="Interactive Planetary Fraction Ring"
                  >
                    <circle cx="110" cy="110" r="96" fill="#0B0719" />
                    {Array.from({ length: ringTotalSectors }).map((_, idx) => {
                      const startAngle = (idx / ringTotalSectors) * Math.PI * 2 - Math.PI / 2;
                      const endAngle =
                        ((idx + 1) / ringTotalSectors) * Math.PI * 2 - Math.PI / 2;
                      const r = 88;
                      const x1 = 110 + r * Math.cos(startAngle);
                      const y1 = 110 + r * Math.sin(startAngle);
                      const x2 = 110 + r * Math.cos(endAngle);
                      const y2 = 110 + r * Math.sin(endAngle);
                      const largeArc = 1 / ringTotalSectors > 0.5 ? 1 : 0;
                      const d = `M 110 110 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                      const isEnergized = idx < activeSectorCount;
                      return (
                        <path
                          key={idx}
                          d={d}
                          fill={isEnergized ? '#FF2A85' : '#FFFDF7'}
                          stroke="#0B0719"
                          strokeWidth="3.5"
                          className="cursor-pointer transition-opacity hover:opacity-90"
                          onClick={() => {
                            soundEngine.playClick();
                            const nextCount = idx + 1 === activeSectorCount ? idx : idx + 1;
                            setActiveSectorCount(nextCount);
                            setNumpadInput(`${nextCount}/${ringTotalSectors}`);
                          }}
                        />
                      );
                    })}
                    <circle
                      cx="110"
                      cy="110"
                      r="38"
                      fill="#FFD600"
                      stroke="#0B0719"
                      strokeWidth="4"
                    />
                    <text
                      x="110"
                      y="118"
                      textAnchor="middle"
                      fill="#0B0719"
                      className="font-mono font-extrabold text-xl"
                    >
                      {activeSectorCount}/{ringTotalSectors}
                    </text>
                  </svg>

                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 w-full sm:w-auto">
                    <div className="bg-[#FF2A85] text-white border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] rounded-2xl p-3.5">
                      <div className="text-xs font-extrabold uppercase">Target 🎯</div>
                      <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums mt-0.5">
                        {challenge.payload.targetNumerator}/{challenge.payload.targetDenominator}{' '}
                        ({challenge.payload.percentValue})
                      </div>
                    </div>
                    <div className="bg-[#00E5FF] text-[#0B0719] border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] rounded-2xl p-3.5">
                      <div className="text-xs font-extrabold uppercase">Your Ring 🍕</div>
                      <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums mt-0.5">
                        {activeSectorCount}/{ringTotalSectors} (
                        {Math.round((activeSectorCount / ringTotalSectors) * 100)}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Synchronized Equivalence Bar Model */}
                <div className="w-full bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold uppercase text-[#FFD600]">
                    <span>Tap Bar Segments to Align Equivalence!</span>
                    <span className="font-mono text-[#00E5FF]">
                      {(activeSectorCount / ringTotalSectors).toFixed(2)} vs{' '}
                      {challenge.payload.decimalValue}
                    </span>
                  </div>

                  <div
                    className="grid w-full h-7 rounded-lg overflow-hidden border-2 border-[#0B0719]"
                    style={{
                      gridTemplateColumns: `repeat(${challenge.payload.targetDenominator}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: challenge.payload.targetDenominator }).map((_, i) => (
                      <div
                        key={i}
                        className={`border-r border-[#0B0719] flex items-center justify-center text-[10px] font-mono font-extrabold ${
                          i < challenge.payload.targetNumerator
                            ? 'bg-[#00E676] text-[#0B0719]'
                            : 'bg-[#21124C] text-slate-400'
                        }`}
                      >
                        1/{challenge.payload.targetDenominator}
                      </div>
                    ))}
                  </div>

                  <div
                    className="grid w-full h-8 rounded-lg overflow-hidden border-2 border-[#0B0719]"
                    style={{
                      gridTemplateColumns: `repeat(${ringTotalSectors}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: ringTotalSectors }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          const nextCount = i + 1 === activeSectorCount ? i : i + 1;
                          setActiveSectorCount(nextCount);
                          setNumpadInput(`${nextCount}/${ringTotalSectors}`);
                        }}
                        className={`border-r border-[#0B0719] flex items-center justify-center text-[10px] font-mono font-extrabold cursor-pointer ${
                          i < activeSectorCount
                            ? 'bg-[#FF2A85] text-white'
                            : 'bg-[#FFFDF7] text-[#0B0719]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  {activeSectorCount * challenge.payload.targetDenominator ===
                    ringTotalSectors * challenge.payload.targetNumerator && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        data-testid="visual-solve-button"
                        onClick={verifyFractionForge}
                        className="px-4 py-1.5 rounded-xl bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] shadow-[2px_2px_0px_#0B0719] font-comic tracking-wider text-sm cursor-pointer"
                      >
                        ⚡ Bars Aligned! Lock In {activeSectorCount}/{ringTotalSectors}!
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                3. GEOMETRY SCULPTOR CLICK-TO-SCULPT COORDINATE LATTICE
               =============================================================== */}
            {gameId === 'geometry-sculptor' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-full flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-extrabold uppercase text-[#0B0719]">
                    Tap Any Grid Square to Sculpt ({sculptWidth} × {sculptHeight})!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setShowDecompositionGrid((g) => !g);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#21124C] text-[#FFD600] border-2 border-[#0B0719] text-xs font-extrabold cursor-pointer"
                  >
                    {showDecompositionGrid ? 'Hide Unit Numbers' : 'Show Unit Numbers'}
                  </button>
                </div>

                <svg
                  viewBox="0 0 280 200"
                  className="w-full max-w-lg h-52 sm:h-60 bg-[#21124C] border-[4px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl select-none"
                >
                  {Array.from({ length: 80 }).map((_, idx) => {
                    const gx = idx % 10;
                    const gy = Math.floor(idx / 10);
                    const isInside = gx < sculptWidth && gy < sculptHeight;
                    const squareIndex = gy * sculptWidth + gx + 1;
                    return (
                      <g
                        key={`cell-${gx}-${gy}`}
                        className="cursor-pointer"
                        onClick={() => {
                          soundEngine.playClick();
                          const nextW = gx + 1;
                          const nextH = gy + 1;
                          setSculptWidth(nextW);
                          setSculptHeight(nextH);
                          setNumpadInput(`${nextW}x${nextH}`);
                        }}
                      >
                        <rect
                          x={40 + gx * 20}
                          y={20 + gy * 20}
                          width={20}
                          height={20}
                          fill={
                            isInside
                              ? (gx + gy) % 2 === 0
                                ? '#FFD600'
                                : '#FFEA00'
                              : '#1B0E3F'
                          }
                          stroke={isInside ? '#0B0719' : '#3B2378'}
                          strokeWidth="1.5"
                        />
                        {isInside && showDecompositionGrid && (
                          <text
                            x={40 + gx * 20 + 10}
                            y={20 + gy * 20 + 13}
                            textAnchor="middle"
                            fill="#0B0719"
                            className="text-[8px] font-mono font-extrabold pointer-events-none"
                          >
                            {squareIndex}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  <rect
                    x={40}
                    y={20}
                    width={sculptWidth * 20}
                    height={sculptHeight * 20}
                    fill="none"
                    stroke="#00E5FF"
                    strokeWidth="3.5"
                    className="pointer-events-none"
                  />
                </svg>

                <div className="grid grid-cols-2 gap-2.5 w-full">
                  <div
                    className={`p-2.5 rounded-xl border-[3px] border-[#0B0719] font-mono text-center ${
                      sculptWidth * sculptHeight === challenge.payload.targetArea
                        ? 'bg-[#00E676] text-[#0B0719]'
                        : 'bg-[#21124C] text-white'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase opacity-80">
                      Area · Target {challenge.payload.targetArea}
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold tabular-nums">
                      {sculptWidth} × {sculptHeight} = {sculptWidth * sculptHeight}
                    </div>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl border-[3px] border-[#0B0719] font-mono text-center ${
                      2 * (sculptWidth + sculptHeight) === challenge.payload.targetPerimeter
                        ? 'bg-[#00E676] text-[#0B0719]'
                        : 'bg-[#21124C] text-white'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase opacity-80">
                      Perimeter · Target {challenge.payload.targetPerimeter}
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold tabular-nums">
                      2({sculptWidth}+{sculptHeight}) = {2 * (sculptWidth + sculptHeight)}
                    </div>
                  </div>
                </div>

                {sculptWidth * sculptHeight === challenge.payload.targetArea &&
                  2 * (sculptWidth + sculptHeight) === challenge.payload.targetPerimeter && (
                    <button
                      type="button"
                      data-testid="visual-solve-button"
                      onClick={verifyGeometrySculptor}
                      className="w-full py-2 px-4 rounded-xl bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] shadow-[3px_3px_0px_#0B0719] font-comic tracking-wider text-base cursor-pointer"
                    >
                      ⚡ Blueprint Matched on Grid! Submit {sculptWidth} × {sculptHeight} Now!
                    </button>
                  )}
              </div>
            )}

            {/* ===============================================================
                4. LOGIC LABYRINTH INTERACTIVE DEDUCTION TRUTH CIRCUIT
               =============================================================== */}
            {gameId === 'logic-labyrinth' && (
              <div className="space-y-3">
                <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-3.5 space-y-2.5">
                  <div className="text-xs font-extrabold uppercase text-[#FFD600] flex items-center justify-between">
                    <span>Interactive Logic Gate Filter (Tap a Clue to Inspect!)</span>
                    <span className="text-[#00E5FF] font-mono">
                      Active Portals: {4 - eliminatedNodes.length} / 4
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {challenge.payload.clues.map((clue: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setActiveClueIdx(idx);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border-2 border-[#0B0719] text-sm sm:text-base font-extrabold flex items-center gap-2.5 cursor-pointer transition-all ${
                          activeClueIdx === idx
                            ? 'bg-[#00E676] text-[#0B0719] shadow-[3px_3px_0px_#0B0719]'
                            : 'bg-[#21124C] text-white hover:bg-[#2E1A68]'
                        }`}
                      >
                        <Emoji char="🗝️" size={18} />
                        <span>{clue}</span>
                      </button>
                    ))}
                  </div>

                  {/* Interactive 4-Portal Visual Circuit Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {challenge.payload.nodes.map(
                      (node: { id: string; label: string; desc: string }) => {
                        const isElim = eliminatedNodes.includes(node.id);
                        return (
                          <div
                            key={node.id}
                            onClick={() => {
                              soundEngine.playClick();
                              setEliminatedNodes((prev) =>
                                prev.includes(node.id)
                                  ? prev.filter((x) => x !== node.id)
                                  : [...prev, node.id]
                              );
                            }}
                            className={`p-2.5 rounded-xl border-2 border-[#0B0719] text-center cursor-pointer transition-all ${
                              isElim
                                ? 'bg-rose-950/60 text-rose-300 opacity-55 line-through'
                                : 'bg-[#00E5FF] text-[#0B0719] shadow-[2px_2px_0px_#0B0719]'
                            }`}
                          >
                            <div className="font-mono text-sm font-extrabold">{node.label}</div>
                            <div className="text-[10px] font-bold mt-0.5 leading-tight">
                              {node.desc}
                            </div>
                            <div className="text-[9px] font-mono uppercase mt-1 underline">
                              {isElim ? 'Tap to Restore' : 'Tap to Cross Out'}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                5. ALGORITHM MAZE CLICK-TO-STEP ROVER GRID + LIVE CODE TRACE
               =============================================================== */}
            {gameId === 'algorithm-maze' && (
              <div className="flex flex-col sm:flex-row items-center gap-3.5">
                <div className="grid grid-cols-5 gap-1.5 bg-[#0B0719] p-2.5 rounded-2xl border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] shrink-0">
                  {Array.from({ length: 25 }).map((_, idx) => {
                    const gx = idx % 5;
                    const gy = Math.floor(idx / 5);
                    const isRover = roverPos.x === gx && roverPos.y === gy;
                    const isGoal =
                      challenge.payload.goal.x === gx && challenge.payload.goal.y === gy;
                    const isHazard = (challenge.payload.hazards || []).some(
                      (h: { x: number; y: number }) => h.x === gx && h.y === gy
                    );
                    const isAdjacent =
                      Math.abs(gx - roverPos.x) + Math.abs(gy - roverPos.y) === 1 && !isHazard;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleMazeTileClick(gx, gy)}
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center text-xs font-mono font-extrabold border-2 border-[#0B0719] transition-transform ${
                          isRover
                            ? 'bg-[#00E5FF] text-[#0B0719] scale-105'
                            : isGoal
                            ? 'bg-[#FFD600] text-[#0B0719] cursor-pointer hover:scale-105'
                            : isHazard
                            ? 'bg-[#FF2A85] text-white cursor-not-allowed'
                            : isAdjacent
                            ? 'bg-[#2E1A68] text-[#00E676] border-[#00E676] cursor-pointer hover:bg-[#00E676] hover:text-[#0B0719]'
                            : 'bg-[#21124C] text-slate-300 cursor-pointer'
                        }`}
                      >
                        {isRover ? (
                          <span className="inline-flex items-center gap-0.5 text-sm font-extrabold">
                            <Emoji char="🤖" size={18} />
                            {roverPos.dir === 'E'
                              ? '→'
                              : roverPos.dir === 'N'
                              ? '↑'
                              : roverPos.dir === 'S'
                              ? '↓'
                              : '←'}
                          </span>
                        ) : isGoal ? (
                          <Emoji char="💎" size={20} />
                        ) : isHazard ? (
                          <Emoji char="☄️" size={20} />
                        ) : (
                          <span className="text-[10px]">
                            {gx},{gy}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 w-full bg-[#21124C] text-white border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-3.5 font-mono text-xs sm:text-sm">
                  <div className="text-[#FFD600] font-extrabold mb-1">
                    # Live Code ({commandQueue.length} blocks — tap adjacent green tiles to step!):
                  </div>
                  <pre className="text-[#00E5FF] font-bold overflow-x-auto max-h-28 leading-relaxed">
                    {commandQueue.length === 0
                      ? '# Tap a glowing neighbor tile on the grid or add blocks...'
                      : commandQueue
                          .map((c) =>
                            c === 'FORWARD'
                              ? 'rover.move_forward()'
                              : c === 'LEFT'
                              ? 'rover.turn_left()'
                              : c === 'RIGHT'
                              ? 'rover.turn_right()'
                              : c === 'REPEAT_2_FORWARD'
                              ? 'for _ in range(2): rover.move_forward()'
                              : 'for _ in range(3): rover.move_forward()'
                          )
                          .join('\n')}
                  </pre>
                  <div className="mt-2 pt-1.5 border-t border-white/20 text-[#00E676] font-bold text-xs">
                    {roverTraceMessage}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                6. BUG HUNTER INTERACTIVE VARIABLE WATCH & EXECUTION TRACE
               =============================================================== */}
            {gameId === 'bug-hunter' && (
              <div className="space-y-3">
                {/* Interactive Live Execution Trace Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#160B30] border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] rounded-2xl p-3 font-mono text-xs">
                  <div className="bg-rose-950/80 border-2 border-[#FF2A85] rounded-xl p-2.5 text-white">
                    <div className="text-[#FF2A85] font-extrabold uppercase mb-1">
                      ⚠️ Current Buggy Trace (Line {challenge.payload.buggyLineIndex + 1}):
                    </div>
                    <div className="font-bold text-rose-200">
                      {challenge.payload.lines[challenge.payload.buggyLineIndex]?.trim()}
                    </div>
                    <div className="mt-1 text-[11px] text-[#FFD600]">
                      Result: Logic defect / wrong output!
                    </div>
                  </div>
                  <div className="bg-emerald-950/80 border-2 border-[#00E676] rounded-xl p-2.5 text-white">
                    <div className="text-[#00E676] font-extrabold uppercase mb-1">
                      ✅ Target Patched Behavior:
                    </div>
                    <div className="font-bold text-emerald-200">
                      {hoveredPatchId
                        ? challenge.payload.patches
                            .find((p: { id: string }) => p.id === hoveredPatchId)
                            ?.code.trim()
                        : 'Select buggy line & tap a patch on the right'}
                    </div>
                    <div className="mt-1 text-[11px] text-[#00E5FF]">
                      Tap Line #{challenge.payload.buggyLineIndex + 1} below to isolate fault!
                    </div>
                  </div>
                </div>

                <div className="bg-[#21124C] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-3 font-mono text-xs sm:text-sm space-y-1 overflow-x-auto">
                  {challenge.payload.lines.map((line: string, idx: number) => {
                    const isSelected = selectedBugLine === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedBugLine(idx);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF2A85] text-white font-bold border-2 border-[#0B0719]'
                            : 'hover:bg-[#311B6E] text-white'
                        }`}
                      >
                        <span className="text-[#FFD600] font-bold select-none w-5 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="whitespace-pre">{line}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                7. PATTERN PLANET SEQUENCE STAIRCASE + JUMP BRIDGES
               =============================================================== */}
            {gameId === 'pattern-planet' && (
              <div className="space-y-3">
                <MathVisualizerLab
                  challenge={challenge}
                  gameId={gameId}
                  grade={grade}
                  practiceMode={practiceMode}
                  currentInput={numpadInput || selectedOption}
                  onSelectAnswer={handleVisualSelectAnswer}
                />
              </div>
            )}

            {/* ===============================================================
                8. PROBABILITY OBSERVATORY SPINNING SVG WHEEL + CONVERGENCE BARS
               =============================================================== */}
            {gameId === 'probability-observatory' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-3.5">
                  {/* Interactive Spinning SVG Quantum Wheel */}
                  <div className="relative flex flex-col items-center shrink-0">
                    <svg
                      viewBox="0 0 180 180"
                      className="w-36 h-36 sm:w-40 sm:h-40 select-none cursor-pointer"
                      onClick={() => spinProbabilityWheel(1)}
                    >
                      <g
                        style={{
                          transform: `rotate(${wheelAngle}deg)`,
                          transformOrigin: '90px 90px',
                          transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      >
                        {(() => {
                          const total: number = challenge.payload.totalSectors;
                          const expandedColors: { color: string; hex: string }[] = [];
                          challenge.payload.sectors.forEach(
                            (s: { color: string; count: number; hex: string }) => {
                              for (let i = 0; i < s.count; i++) {
                                expandedColors.push({ color: s.color, hex: s.hex });
                              }
                            }
                          );
                          return expandedColors.map((slice, idx) => {
                            const a1 = (idx / total) * Math.PI * 2 - Math.PI / 2;
                            const a2 = ((idx + 1) / total) * Math.PI * 2 - Math.PI / 2;
                            const r = 78;
                            const x1 = 90 + r * Math.cos(a1);
                            const y1 = 90 + r * Math.sin(a1);
                            const x2 = 90 + r * Math.cos(a2);
                            const y2 = 90 + r * Math.sin(a2);
                            const isTarget = slice.color === selectedWheelColor;
                            return (
                              <path
                                key={idx}
                                d={`M 90 90 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                                fill={slice.hex}
                                stroke="#0B0719"
                                strokeWidth={isTarget ? '3.5' : '2'}
                                opacity={
                                  selectedWheelColor && !isTarget ? 0.65 : 1
                                }
                              />
                            );
                          });
                        })()}
                        <circle
                          cx="90"
                          cy="90"
                          r="22"
                          fill="#FFD600"
                          stroke="#0B0719"
                          strokeWidth="3.5"
                        />
                      </g>
                      {/* Fixed Pointer Needle */}
                      <polygon
                        points="90,2 82,18 98,18"
                        fill="#FF2A85"
                        stroke="#0B0719"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="flex gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => spinProbabilityWheel(1)}
                        className="px-2.5 py-1 rounded-lg bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] text-xs font-extrabold cursor-pointer"
                      >
                        🎲 Spin ×1
                      </button>
                      <button
                        type="button"
                        onClick={() => spinProbabilityWheel(100)}
                        className="px-2.5 py-1 rounded-lg bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] text-xs font-extrabold cursor-pointer"
                      >
                        🚀 ×100 Trials ({totalSpins})
                      </button>
                    </div>
                  </div>

                  {/* Interactive Sector Ratio Cards */}
                  <div className="flex-1 w-full space-y-2">
                    {challenge.payload.sectors.map(
                      (sec: { color: string; count: number; hex: string }) => {
                        const empirical = simTrials[sec.color] || 0;
                        const theoPct = Math.round(
                          (sec.count / challenge.payload.totalSectors) * 100
                        );
                        const empPct =
                          totalSpins > 0 ? Math.round((empirical / totalSpins) * 100) : 0;
                        const isTarget = sec.color === challenge.payload.targetSector;
                        return (
                          <div
                            key={sec.color}
                            onClick={() => {
                              soundEngine.playClick();
                              setSelectedWheelColor(sec.color);
                              const ratioStr = `${sec.count}/${challenge.payload.totalSectors}`;
                              setNumpadInput(ratioStr);
                              setSelectedOption(ratioStr);
                            }}
                            className={`p-2.5 rounded-xl border-2 border-[#0B0719] cursor-pointer transition-all ${
                              selectedWheelColor === sec.color
                                ? 'bg-[#2E1A68] border-[#FFD600]'
                                : 'bg-[#21124C]'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono font-extrabold text-white">
                              <span className="text-[#FFD600]">{sec.color}</span>
                              <span>
                                {sec.count}/{challenge.payload.totalSectors} ({theoPct}%) · Obs:{' '}
                                {empPct}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-[#0B0719] rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-[#00E5FF]"
                                style={{ width: `${theoPct}%` }}
                              />
                            </div>
                            {isTarget && (
                              <div className="mt-1.5 flex justify-end">
                                <button
                                  type="button"
                                  data-testid="visual-solve-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    verifyDirectAnswer(
                                      String(challenge.correctAnswer),
                                      'Quantum Spinner Wheel'
                                    );
                                  }}
                                  className="px-3 py-1 rounded-lg bg-[#00E676] text-[#0B0719] border border-[#0B0719] font-comic tracking-wider text-xs cursor-pointer"
                                >
                                  ⚡ Lock In P({sec.color}) = {sec.count}/
                                  {challenge.payload.totalSectors}!
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                9. MEMORY CONSTELLATION 3x3 SKY MATRIX WITH SVG VECTOR LINES
               =============================================================== */}
            {gameId === 'memory-constellation' && (
              <div className="flex flex-col items-center gap-3 my-1">
                <div className="relative bg-[#160B30] p-4 rounded-2xl border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719]">
                  {/* Dynamic SVG Constellation Lines Connecting Tapped Stars */}
                  <svg
                    viewBox="0 0 240 240"
                    className="absolute inset-0 w-full h-full pointer-events-none z-0"
                  >
                    {playerStarSeq.map((starId, idx) => {
                      if (idx === 0) return null;
                      const prevId = playerStarSeq[idx - 1];
                      const x1 = 46 + (prevId % 3) * 74;
                      const y1 = 46 + Math.floor(prevId / 3) * 74;
                      const x2 = 46 + (starId % 3) * 74;
                      const y2 = 46 + Math.floor(starId / 3) * 74;
                      return (
                        <line
                          key={`${prevId}-${starId}-${idx}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#00E676"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>

                  <div className="relative z-10 grid grid-cols-3 gap-3">
                    {Array.from({ length: 9 }).map((_, idx) => {
                      const isFlashing = activeFlashIdx === idx;
                      const playerOrder = playerStarSeq.indexOf(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleStarClick(idx)}
                          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-[3px] border-[#0B0719] flex flex-col items-center justify-center transition-transform cursor-pointer ${
                            isFlashing
                              ? 'bg-[#FFD600] text-[#0B0719] scale-110 font-extrabold'
                              : playerOrder !== -1
                              ? 'bg-[#00E676] text-[#0B0719] font-extrabold'
                              : 'bg-[#FFFDF7] text-[#0B0719] hover:bg-[#00E5FF]'
                          }`}
                        >
                          <Emoji char={isFlashing ? '🌟' : '⭐'} size={26} />
                          <span className="text-xs font-mono font-extrabold mt-0.5">
                            {playerOrder !== -1 ? `#${playerOrder + 1}` : `S${idx + 1}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                10. COSMIC BOSS BATTLE 3-RING QUANTUM SHIELD CORE VISUALIZER
               =============================================================== */}
            {gameId === 'cosmic-boss-battle' && (
              <div className="space-y-3">
                <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  {/* Animated 3-Shield SVG Quantum Core */}
                  <svg
                    viewBox="0 0 160 160"
                    className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 select-none"
                  >
                    {[0, 1, 2].map((ringIdx) => {
                      const r = 68 - ringIdx * 18;
                      const unlocked = ringIdx < bossStageIdx;
                      const active = ringIdx === bossStageIdx;
                      return (
                        <circle
                          key={ringIdx}
                          cx="80"
                          cy="80"
                          r={r}
                          fill="none"
                          stroke={
                            unlocked ? '#00E676' : active ? '#FFD600' : '#FF2A85'
                          }
                          strokeWidth={active ? '5' : '3.5'}
                          strokeDasharray={unlocked ? '4 6' : active ? '14 6' : 'none'}
                        />
                      );
                    })}
                    <circle
                      cx="80"
                      cy="80"
                      r="20"
                      fill={bossStageIdx >= 3 ? '#00E676' : '#FF2A85'}
                      stroke="#0B0719"
                      strokeWidth="3"
                    />
                    <text
                      x="80"
                      y="85"
                      textAnchor="middle"
                      fill="#FFFDF7"
                      className="text-xs font-mono font-extrabold"
                    >
                      {bossStageIdx}/3
                    </text>
                  </svg>

                  <div className="flex-1 space-y-2 text-white">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {challenge.payload.stages.map(
                        (st: { stageNumber: number; domain: string }, idx: number) => (
                          <span
                            key={st.stageNumber}
                            className={`px-2.5 py-1 rounded-lg border-2 border-[#0B0719] text-xs font-mono font-extrabold ${
                              idx < bossStageIdx
                                ? 'bg-[#00E676] text-[#0B0719]'
                                : idx === bossStageIdx
                                ? 'bg-[#FFD600] text-[#0B0719]'
                                : 'bg-[#21124C] text-slate-400'
                            }`}
                          >
                            <EmojiText text={st.domain} emojiSize={14} />
                          </span>
                        )
                      )}
                    </div>
                    <div className="text-lg sm:text-xl font-display font-extrabold text-[#FFFDF7] leading-snug">
                      {challenge.payload.stages[bossStageIdx]?.question}
                    </div>
                    <div className="text-xs font-mono text-[#00E5FF]">
                      💡 Visual Clue: {challenge.payload.stages[bossStageIdx]?.hint}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step-by-Step Visual Proof Lab when in Visual Lab Mode for non-Reactor/Pattern games */}
            {practiceMode === 'visual-lab' &&
              gameId !== 'reactor-rush' &&
              gameId !== 'pattern-planet' && (
                <MathVisualizerLab
                  challenge={challenge}
                  gameId={gameId}
                  grade={grade}
                  practiceMode={practiceMode}
                  currentInput={numpadInput}
                  onSelectAnswer={handleVisualSelectAnswer}
                />
              )}
          </div>

          {/* Sleek Hints & Finish Footer */}
          <div className="pt-2.5 border-t-[3px] border-[#0B0719] flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRevealHint}
                disabled={hintsShown >= challenge.hints.length}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFD600] text-[#0B0719] comic-btn text-xs sm:text-sm font-extrabold disabled:opacity-40 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4" />
                <span>
                  {hintsShown === 0
                    ? `Hint (${challenge.hints.length})`
                    : hintsShown < challenge.hints.length
                    ? `Next Hint (${hintsShown}/${challenge.hints.length})`
                    : 'All Hints Shown'}
                </span>
              </button>

              <button
                type="button"
                onClick={onFinishSessionEarly}
                className="text-xs sm:text-sm font-extrabold text-[#FF2A85] hover:underline cursor-pointer"
              >
                Finish Warm-Up & Claim Star →
              </button>
            </div>

            {hintsShown > 0 && (
              <div className="bg-[#FFD600] text-[#0B0719] border-[3px] border-[#0B0719] rounded-xl p-3 space-y-1">
                {challenge.hints.slice(0, hintsShown).map((h, i) => (
                  <p key={i} className="text-xs sm:text-sm font-bold">
                    <strong>Hint {i + 1}:</strong> {h}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
            Right 5-Col: Focused Action, Answer & Keypad Deck
           =================================================================== */}
        <div className="lg:col-span-5 comic-box halftone-dots rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5">
          <div>
            {/* Top-of-Deck Celebration / Feedback Banner */}
            {feedback.type !== 'idle' && (
              <div
                data-testid="challenge-feedback-banner"
                className={`animate-comic-pop p-3.5 rounded-2xl border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] mb-3 ${
                  feedback.type === 'correct'
                    ? 'bg-[#00E676] text-[#0B0719]'
                    : 'bg-[#FF2A85] text-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {feedback.type === 'correct' ? (
                    <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 stroke-[2.5]" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5 stroke-[2.5]" />
                  )}
                  <div className="flex-1">
                    <div className="font-comic text-xl tracking-wider leading-none mb-1 flex items-center gap-2">
                      <EmojiText
                        text={
                          feedback.callout ||
                          (feedback.type === 'correct' ? 'BOOM! 💥' : 'TRY AGAIN! 🔄')
                        }
                        emojiSize={20}
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold leading-snug">
                      {feedback.message}
                    </p>
                  </div>
                </div>

                {feedback.type === 'correct' && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="w-full h-2 bg-[#0B0719] rounded-full overflow-hidden p-0.5">
                      <div className="w-full h-full bg-[#FFD600] rounded-full animate-countdown-shrink" />
                    </div>
                    <button
                      type="button"
                      onClick={handleNextChallenge}
                      className="w-full py-2 px-3 rounded-xl bg-[#FFD600] hover:bg-[#FFEA00] text-[#0B0719] comic-btn font-comic tracking-wider text-base flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Emoji char="🚀" size={18} />
                      <span>NEXT QUESTION (#{stepIndex + 2}) NOW!</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CONTROLS FOR REACTOR RUSH */}
            {gameId === 'reactor-rush' && (
              <div className="space-y-2.5">
                {/* Single Big Hero Answer Readout */}
                <div className="bg-[#FFD600] border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] rounded-2xl py-2 px-4 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#0B0719] inline-flex items-center gap-1.5">
                    <Emoji char="⌨️" size={16} />
                    <span>ANSWER</span>
                  </span>
                  <div
                    data-testid="reactor-input-display"
                    className="text-3xl sm:text-4xl font-mono font-extrabold text-[#0B0719] tracking-wider tabular-nums"
                  >
                    {numpadInput || '?'}
                  </div>
                </div>

                {/* Mental Math Stepper Bar (-10, -1, +1, +10, ⌫) */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: '-10', delta: -10 },
                    { label: '-1', delta: -1 },
                    { label: '+1', delta: 1 },
                    { label: '+10', delta: 10 },
                  ].map((st) => (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => adjustNumpadByDelta(st.delta)}
                      className="py-1.5 rounded-xl bg-[#160B30] hover:bg-[#00E5FF] text-[#00E5FF] hover:text-[#0B0719] border-2 border-[#0B0719] font-mono text-xs sm:text-sm font-extrabold cursor-pointer transition-colors"
                    >
                      {st.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Backspace"
                    onClick={() => {
                      if (feedback.type === 'correct') return;
                      soundEngine.playClick();
                      setNumpadInput((p) => p.slice(0, -1));
                    }}
                    className="py-1.5 rounded-xl bg-[#FF2A85] text-white border-2 border-[#0B0719] font-mono text-xs sm:text-sm font-extrabold cursor-pointer"
                  >
                    ⌫
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', 'CLR'].map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (feedback.type === 'correct') return;
                          soundEngine.playClick();
                          if (key === 'CLR') setNumpadInput('');
                          else if (key === '-')
                            setNumpadInput((p) => (p.startsWith('-') ? p.slice(1) : '-' + p));
                          else setNumpadInput((p) => (p.length < 7 ? p + key : p));
                        }}
                        className="py-2.5 sm:py-3 rounded-xl bg-[#FFFDF7] hover:bg-[#FFD600] text-[#0B0719] comic-btn text-2xl sm:text-3xl font-mono font-extrabold cursor-pointer"
                      >
                        {key}
                      </button>
                    )
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={verifyReactorInput}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#00E676] hover:bg-[#33EB91] text-[#0B0719] comic-btn font-comic tracking-wider text-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    <span>SUBMIT ANSWER!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (feedback.type === 'correct') return;
                      soundEngine.playClick();
                      setNumpadInput(String(challenge.correctAnswer));
                    }}
                    className="py-3 px-3 rounded-xl bg-[#FFD600] text-[#0B0719] comic-btn text-xs font-mono font-extrabold cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}

            {/* CONTROLS FOR FRACTION FORGE */}
            {gameId === 'fraction-forge' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-[#FFD600] mb-1.5">
                    1. Equal Pizza Slices: <strong>{ringTotalSectors} slices</strong>
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[2, 3, 4, 5, 6, 8, 10, 12].map((div) => (
                      <button
                        key={div}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setRingTotalSectors(div);
                          const clamped = Math.min(activeSectorCount, div);
                          setActiveSectorCount(clamped);
                          setNumpadInput(`${clamped}/${div}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-mono text-sm font-extrabold border-2 border-[#0B0719] cursor-pointer ${
                          ringTotalSectors === div
                            ? 'bg-[#FFD600] text-[#0B0719]'
                            : 'bg-[#FFFDF7] text-[#0B0719]'
                        }`}
                      >
                        /{div}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-[#00E5FF] mb-1">
                    2. Lit Slices: <strong>{activeSectorCount}</strong> of {ringTotalSectors}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={ringTotalSectors}
                    value={activeSectorCount}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setActiveSectorCount(v);
                      setNumpadInput(`${v}/${ringTotalSectors}`);
                    }}
                    aria-label="Energized Sectors Slider"
                    className="w-full accent-[#FF2A85] cursor-pointer h-3"
                  />
                </div>

                <button
                  type="button"
                  onClick={verifyFractionForge}
                  className="w-full py-3 px-4 rounded-xl bg-[#FF2A85] text-white comic-btn font-comic tracking-wider text-xl cursor-pointer"
                >
                  CHECK FRACTION! 🍕
                </button>
              </div>
            )}

            {/* CONTROLS FOR GEOMETRY SCULPTOR */}
            {gameId === 'geometry-sculptor' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-[#FFD600] mb-1">
                    Width (X-Span): <strong>{sculptWidth} units</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={sculptWidth}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setSculptWidth(w);
                      setNumpadInput(`${w}x${sculptHeight}`);
                    }}
                    aria-label="Lattice Width Slider"
                    className="w-full accent-[#FFD600] cursor-pointer h-3"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-[#00E5FF] mb-1">
                    Height (Y-Span): <strong>{sculptHeight} units</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={sculptHeight}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setSculptHeight(h);
                      setNumpadInput(`${sculptWidth}x${h}`);
                    }}
                    aria-label="Lattice Height Slider"
                    className="w-full accent-[#00E5FF] cursor-pointer h-3"
                  />
                </div>
                <button
                  type="button"
                  onClick={verifyGeometrySculptor}
                  className="w-full py-3 px-4 rounded-xl bg-[#FFD600] text-[#0B0719] comic-btn font-comic tracking-wider text-xl cursor-pointer"
                >
                  VERIFY BLUEPRINT! 📐
                </button>
              </div>
            )}

            {/* CONTROLS FOR LOGIC LABYRINTH */}
            {gameId === 'logic-labyrinth' && (
              <div className="space-y-2.5">
                {challenge.payload.nodes.map(
                  (node: { id: string; label: string; desc: string }) => {
                    const isEliminated = eliminatedNodes.includes(node.id);
                    return (
                      <div
                        key={node.id}
                        className={`p-2.5 rounded-xl border-[3px] border-[#0B0719] flex items-center justify-between gap-2 ${
                          isEliminated
                            ? 'bg-slate-800 opacity-50 line-through text-slate-400'
                            : 'bg-[#FFFDF7] text-[#0B0719] shadow-[3px_3px_0px_#0B0719]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-extrabold truncate">
                            {node.label}
                          </div>
                          <div className="text-xs font-bold text-slate-600 truncate">
                            {node.desc}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setEliminatedNodes((prev) =>
                                prev.includes(node.id)
                                  ? prev.filter((x) => x !== node.id)
                                  : [...prev, node.id]
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 border-2 border-[#0B0719] text-xs font-extrabold text-[#0B0719] cursor-pointer"
                          >
                            {isEliminated ? 'Restore' : 'Eliminate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => verifyLogicLabyrinth(node.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#00E676] border-2 border-[#0B0719] text-[#0B0719] font-extrabold text-xs sm:text-sm cursor-pointer"
                          >
                            Unlock!
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* CONTROLS FOR ALGORITHM MAZE */}
            {gameId === 'algorithm-maze' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'FORWARD', label: '↑ Move Forward' },
                    { id: 'LEFT', label: '↺ Turn Left' },
                    { id: 'RIGHT', label: '↻ Turn Right' },
                    { id: 'REPEAT_2_FORWARD', label: '⟳ Repeat 2× Move' },
                    { id: 'REPEAT_3_FORWARD', label: '⟳ Repeat 3× Move' },
                  ].map((cmd) => (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setCommandQueue((q) => [...q, cmd.id]);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#FFFDF7] hover:bg-[#00E5FF] text-[#0B0719] comic-btn text-xs font-mono font-extrabold text-left cursor-pointer"
                    >
                      + {cmd.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      const ideal = challenge.payload.idealBlocks || [];
                      setCommandQueue(ideal);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#FFD600] text-[#0B0719] comic-btn text-xs font-mono font-extrabold text-left cursor-pointer"
                  >
                    ⚡ Optimal Loop
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCommandQueue([]);
                      setRoverPos({
                        x: challenge.payload.start.x,
                        y: challenge.payload.start.y,
                        dir: challenge.payload.start.dir,
                      });
                    }}
                    className="py-3 px-3.5 rounded-xl bg-[#FFFDF7] text-[#0B0719] comic-btn text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => executeAlgorithmMaze(commandQueue)}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#00E676] text-[#0B0719] comic-btn font-comic tracking-wider text-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" /> RUN ROVER!
                  </button>
                </div>
              </div>
            )}

            {/* CONTROLS FOR BUG HUNTER */}
            {gameId === 'bug-hunter' && (
              <div className="space-y-2.5">
                <div className="text-xs sm:text-sm font-extrabold text-[#FFFDF7]">
                  {selectedBugLine !== null
                    ? `Selected Line ${selectedBugLine + 1} for patching:`
                    : 'Tap the buggy line on the left, then pick the patch:'}
                </div>
                {challenge.payload.patches.map(
                  (patch: { id: string; code: string; isCorrect: boolean }) => (
                    <button
                      key={patch.id}
                      type="button"
                      onMouseEnter={() => setHoveredPatchId(patch.id)}
                      onClick={() => verifyBugHunter(patch.id)}
                      className="w-full text-left p-3.5 rounded-xl bg-[#FFFDF7] hover:bg-[#FFD600] text-[#0B0719] comic-btn font-mono text-xs sm:text-sm font-extrabold cursor-pointer"
                    >
                      <div className="text-[10px] text-[#FF2A85] uppercase mb-0.5">
                        Deploy Patch Option
                      </div>
                      <code>{patch.code.trim()}</code>
                    </button>
                  )
                )}
              </div>
            )}

            {/* CONTROLS FOR PATTERN PLANET & PROBABILITY OBSERVATORY */}
            {(gameId === 'pattern-planet' || gameId === 'probability-observatory') && (
              <div className="grid grid-cols-2 gap-2.5">
                {(challenge.options || []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (feedback.type === 'correct') return;
                      setSelectedOption(opt);
                      setNumpadInput(opt);
                      if (
                        opt === String(challenge.correctAnswer) ||
                        challenge.acceptedVariations.includes(opt)
                      ) {
                        handleCompleteSuccess(undefined, 'BINGO! 🎯');
                      } else {
                        handleMistake(
                          `Not quite (${opt}). Check the sequence rule or theoretical ratio!`
                        );
                      }
                    }}
                    className="py-3.5 px-3.5 rounded-2xl bg-[#FFFDF7] hover:bg-[#FFD600] text-[#0B0719] comic-btn text-left font-mono text-base sm:text-lg font-extrabold flex items-center justify-between cursor-pointer"
                  >
                    <span>{opt}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* CONTROLS FOR MEMORY CONSTELLATION */}
            {gameId === 'memory-constellation' && (
              <div className="space-y-3">
                <p className="text-base font-extrabold text-[#FFFDF7]">
                  Connected: <strong>{playerStarSeq.length}</strong> /{' '}
                  {challenge.payload.sequence.length} stars.
                </p>
                <button
                  type="button"
                  onClick={() => triggerMemoryFlash(challenge.payload.sequence)}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#FFD600] text-[#0B0719] comic-btn font-comic tracking-wider text-xl cursor-pointer"
                >
                  REPLAY STAR FLASH! 🌟
                </button>
              </div>
            )}

            {/* CONTROLS FOR COSMIC BOSS BATTLE */}
            {gameId === 'cosmic-boss-battle' && (
              <div className="grid grid-cols-2 gap-2.5">
                {(challenge.payload.stages[bossStageIdx]?.options || []).map(
                  (opt: string) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        if (feedback.type === 'correct') return;
                        const currentStage = challenge.payload.stages[bossStageIdx];
                        if (opt === currentStage.correct) {
                          soundEngine.playCorrect(bossStageIdx + 1);
                          if (bossStageIdx + 1 < challenge.payload.stages.length) {
                            setBossStageIdx((s) => s + 1);
                            setFeedback({
                              type: 'idle',
                              message: `Lock ${currentStage.stageNumber} Unlocked!`,
                            });
                          } else {
                            handleCompleteSuccess(
                              'QUANTUM VAULT BREACHED! All 3 Multi-Stage Boss Locks Solved!',
                              'K.O.! 👾'
                            );
                          }
                        } else {
                          handleMistake(
                            `Vault Shield deflected "${opt}". Hint: ${currentStage.hint}`
                          );
                        }
                      }}
                      className="py-3.5 px-4 rounded-2xl bg-[#FFFDF7] hover:bg-[#FFD600] text-[#0B0719] comic-btn text-left font-mono text-lg font-extrabold flex items-center justify-between cursor-pointer"
                    >
                      <span>{opt}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            )}

            {/* ===============================================================
                UNIVERSAL INTERACTIVE MATH KEYPAD (Clean & Toggleable)
               =============================================================== */}
            {(gameId === 'pattern-planet' ||
              gameId === 'probability-observatory' ||
              gameId === 'fraction-forge' ||
              gameId === 'geometry-sculptor' ||
              gameId === 'logic-labyrinth' ||
              gameId === 'cosmic-boss-battle') && (
              <div
                data-testid="universal-math-keypad"
                className="mt-3 pt-3 border-t-2 border-[#0B0719]/50 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setShowUniversalKeypad((v) => !v);
                    }}
                    className="text-xs font-extrabold uppercase text-[#FFD600] inline-flex items-center gap-1.5 cursor-pointer hover:underline"
                  >
                    <Keyboard className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>{showUniversalKeypad ? 'Hide Math Keypad' : 'Show Math Keypad'}</span>
                  </button>
                  <span
                    data-testid="universal-keypad-display"
                    className="px-2.5 py-0.5 rounded-lg bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] font-mono text-sm font-extrabold tabular-nums min-w-[3.75rem] text-center"
                  >
                    {numpadInput || '?'}
                  </span>
                </div>

                {showUniversalKeypad && (
                  <>
                    <div className="grid grid-cols-6 gap-1.5">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '/', 'x'].map(
                        (k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              if (feedback.type === 'correct') return;
                              soundEngine.playClick();
                              setNumpadInput((prev) => {
                                const next = prev.length < 8 ? prev + k : prev;
                                setSelectedOption(next);
                                return next;
                              });
                            }}
                            className="py-1.5 rounded-xl bg-[#FFFDF7] hover:bg-[#00E5FF] text-[#0B0719] border-2 border-[#0B0719] shadow-[2px_2px_0px_#0B0719] font-mono text-sm sm:text-base font-extrabold cursor-pointer"
                          >
                            {k}
                          </button>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setNumpadInput('');
                          setSelectedOption('');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#FF2A85] text-white border-2 border-[#0B0719] font-mono text-xs font-extrabold cursor-pointer"
                      >
                        CLR
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setNumpadInput((p) => p.slice(0, -1));
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#160B30] text-white border-2 border-[#0B0719] font-mono text-xs font-extrabold cursor-pointer"
                      >
                        ⌫
                      </button>
                      <button
                        type="button"
                        data-testid="universal-keypad-submit"
                        onClick={() => verifyDirectAnswer(numpadInput, 'Universal Math Keypad')}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#00E676] hover:bg-[#33EB91] text-[#0B0719] comic-btn font-comic tracking-wider text-sm sm:text-base cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>SUBMIT ({numpadInput || '?'})</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Always-Accessible Next / Skip Action Footer */}
          <div className="pt-2.5 border-t-[3px] border-[#0B0719]">
            <button
              type="button"
              data-testid="next-challenge-button"
              onClick={handleNextChallenge}
              className={`w-full py-2.5 px-4 rounded-xl comic-btn font-comic tracking-wider text-lg flex items-center justify-center gap-2 cursor-pointer ${
                feedback.type === 'correct'
                  ? 'bg-[#FFD600] hover:bg-[#FFEA00] text-[#0B0719]'
                  : 'bg-[#00E5FF] hover:bg-[#33EBFF] text-[#0B0719]'
              }`}
            >
              <Emoji char={feedback.type === 'correct' ? '🚀' : '⚡'} size={20} />
              <span>
                {feedback.type === 'correct'
                  ? `NEXT QUESTION (#${stepIndex + 2}) NOW!`
                  : `SKIP TO QUESTION #${stepIndex + 2}`}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
