import {
  ChallengeItem,
  GameId,
  GradeNumber,
  MasteryState,
  SessionPhaseConfig,
  SkillProgress,
  StudentProfile,
} from '../types/universe';
import {
  GRADE_BANDS,
  INITIAL_CONSTELLATION,
  PLANETS,
  SESSION_PHASES,
  getGradeBandForGrade,
} from './worldData';

const STORAGE_KEY = 'learnfun_universe_profile_v1';

export const MASTERY_ORDER: MasteryState[] = [
  'New',
  'Exploring',
  'Developing',
  'Improving',
  'Secure',
  'Mastered',
];

/**
 * Computes the updated MasteryState and adaptive difficulty (1..5)
 * considering accuracy, attempts, hints used, and current streak.
 * Never relies exclusively on speed.
 */
export function evaluateAdaptiveSkillUpdate(
  existing: SkillProgress | undefined,
  challenge: ChallengeItem,
  isCorrect: boolean,
  hintsUsedOnAttempt: number
): SkillProgress {
  const prev: SkillProgress = existing ?? {
    skillId: challenge.skillId,
    skillName: challenge.skillName,
    subject: challenge.subject,
    topic: challenge.topic,
    mastery: 'New',
    accuracy: 0,
    attempts: 0,
    correctCount: 0,
    hintsUsed: 0,
    currentStreak: 0,
    difficultyLevel: challenge.difficulty || 2,
    lastPracticedAt: Date.now(),
    recentErrors: [],
  };

  const attempts = prev.attempts + 1;
  const correctCount = prev.correctCount + (isCorrect ? 1 : 0);
  const accuracy = Math.round((correctCount / attempts) * 100);
  const hintsUsed = prev.hintsUsed + hintsUsedOnAttempt;
  const currentStreak = isCorrect ? prev.currentStreak + 1 : 0;

  let difficultyLevel = prev.difficultyLevel;
  if (isCorrect && hintsUsedOnAttempt === 0 && currentStreak >= 2) {
    difficultyLevel = Math.min(5, difficultyLevel + 1);
  } else if (!isCorrect) {
    // Gentle recovery: step down by at most 1 after an error so student isn't punished harshly
    difficultyLevel = Math.max(1, difficultyLevel - 1);
  }

  let mastery: MasteryState = 'Exploring';
  if (attempts === 1 && !isCorrect) {
    mastery = 'Exploring';
  } else if (accuracy >= 88 && correctCount >= 4 && hintsUsed <= attempts) {
    mastery = 'Mastered';
  } else if (accuracy >= 78 && correctCount >= 3) {
    mastery = 'Secure';
  } else if (accuracy >= 65 && correctCount >= 2) {
    mastery = 'Improving';
  } else if (correctCount >= 1) {
    mastery = 'Developing';
  }

  const recentErrors = [...prev.recentErrors];
  if (!isCorrect) {
    recentErrors.unshift(`${challenge.topic}: ${challenge.prompt}`);
    if (recentErrors.length > 5) recentErrors.pop();
  }

  return {
    ...prev,
    mastery,
    accuracy,
    attempts,
    correctCount,
    hintsUsed,
    currentStreak,
    difficultyLevel,
    lastPracticedAt: Date.now(),
    recentErrors,
  };
}

/**
 * Calculates score & XP reward for a challenge completion.
 * Rewards accuracy, persistence, and trying higher difficulty — not just raw speed.
 */
export function calculateChallengeReward(
  basePoints: number,
  difficulty: number,
  comboStreak: number,
  hintsUsed: number,
  wasRetryRecovery: boolean
): { points: number; xp: number; stars: number } {
  const diffMultiplier = 1 + (difficulty - 1) * 0.2;
  const comboBonus = Math.min(2.0, 1 + comboStreak * 0.15);
  const hintAdjustment = hintsUsed > 0 ? 0.85 : 1.0; // Encouraging: using a hint still awards 85%
  const persistenceBonus = wasRetryRecovery ? 35 : 0;

  const points = Math.round(basePoints * diffMultiplier * comboBonus * hintAdjustment) + persistenceBonus;
  const xp = Math.round(points * 0.5);
  const stars = difficulty >= 3 && hintsUsed === 0 ? 2 : 1;

  return { points, xp, stars };
}

/**
 * Determines which phase of the 15-minute session is active given elapsed seconds.
 */
export function getActiveSessionPhase(
  elapsedSeconds: number,
  totalDurationMinutes: number = 15
): SessionPhaseConfig {
  const scale = totalDurationMinutes / 15;
  const elapsedMinutes = elapsedSeconds / 60;

  for (const phase of SESSION_PHASES) {
    const start = phase.startMinute * scale;
    const end = phase.endMinute * scale;
    if (elapsedMinutes >= start && elapsedMinutes < end) {
      return phase;
    }
  }
  return SESSION_PHASES[SESSION_PHASES.length - 1];
}

/**
 * Generates an intelligent, data-backed Teacher Handover Summary from the student's actual profile & sessions.
 */
export function generateTeacherHandoverSummary(profile: StudentProfile): string {
  const skillList = Object.values(profile.skills);
  const totalSessions = profile.sessions.length;
  const totalMinutes = Math.max(
    15,
    Math.round(profile.sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60)
  );

  const masteredOrSecure = skillList.filter(
    (s) => s.mastery === 'Mastered' || s.mastery === 'Secure'
  );
  const improving = skillList.filter(
    (s) => s.mastery === 'Improving' || s.mastery === 'Developing'
  );
  const needsRevision = skillList.filter(
    (s) => s.accuracy < 70 || s.recentErrors.length > 0
  );

  const subjectsPracticed = Array.from(
    new Set(skillList.map((s) => s.subject.charAt(0).toUpperCase() + s.subject.slice(1)))
  );
  const subjectsText =
    subjectsPracticed.length > 0
      ? subjectsPracticed.join(', ')
      : 'Mathematics, Coding and Logic';

  const strongText =
    masteredOrSecure.length > 0
      ? `The student demonstrated strong mastery in ${masteredOrSecure
          .slice(0, 2)
          .map((s) => s.skillName.toLowerCase())
          .join(' and ')} (${masteredOrSecure[0].accuracy}% accuracy).`
      : `The student is actively exploring core grade ${profile.grade} concepts.`;

  const improvingText =
    improving.length > 0
      ? `${improving[0].skillName} is improving steadily (${improving[0].mastery} state).`
      : '';

  const revisionText =
    needsRevision.length > 0
      ? `Suggested focus for the live class session: ${needsRevision
          .slice(0, 2)
          .map((s) => s.topic.toLowerCase())
          .join(' and ')}.`
      : `Suggested focus for the next session: multi-step synthesis in ${
          GRADE_BANDS[profile.gradeBand].topics.mathematics[0].toLowerCase()
        } and loop tracing.`;

  return `Today, ${profile.name} (Grade ${profile.grade} · ${profile.curriculum}) completed ${totalMinutes} minutes across ${totalSessions} warm-up session(s) covering ${subjectsText}. ${improvingText} ${strongText} ${revisionText}`
    .replace(/\s+/g, ' ')
    .trim();
}

export function createDefaultStudentProfile(grade: GradeNumber = 6): StudentProfile {
  const gradeBand = getGradeBandForGrade(grade);
  return {
    id: 'student-arjun-01',
    name: 'Aarav Sharma',
    avatarId: 'nova-explorer',
    shipColor: '#06b6d4',
    trailStyle: 'plasma-cyan',
    unlockedCosmetics: ['nova-explorer', 'pixel-bot', 'lyra-sage', 'orion-prime'],
    grade,
    gradeBand,
    curriculum: 'CBSE',
    xp: 1450,
    stars: 18,
    level: 4,
    badges: [
      'Reactor Igniter',
      'Fraction Architect',
      'Clean Code Cadet',
      'Labyrinth Pathfinder',
    ],
    planetProgress: {
      'number-nebula': 65,
      'geometry-galaxy': 40,
      'fraction-frontier': 55,
      'logic-labyrinth': 50,
      'code-command': 60,
      'pixel-architect': 30,
      'probability-observatory': 25,
      'quantum-vault': 20,
    },
    skills: {
      'math-linear-eq': {
        skillId: 'math-linear-eq',
        skillName: 'Algebraic Core Stabilization',
        subject: 'mathematics',
        topic: 'Linear equations',
        mastery: 'Secure',
        accuracy: 86,
        attempts: 7,
        correctCount: 6,
        hintsUsed: 1,
        currentStreak: 3,
        difficultyLevel: 3,
        lastPracticedAt: Date.now() - 86400000,
        recentErrors: [],
      },
      'math-fractions-equivalence': {
        skillId: 'math-fractions-equivalence',
        skillName: 'Proportional & Fraction Equivalence',
        subject: 'mathematics',
        topic: 'Fractions, decimals & proportions',
        mastery: 'Improving',
        accuracy: 75,
        attempts: 4,
        correctCount: 3,
        hintsUsed: 1,
        currentStreak: 2,
        difficultyLevel: 2,
        lastPracticedAt: Date.now() - 43200000,
        recentErrors: ['Fractions, decimals & proportions: Convert 3/8 to sectors'],
      },
      'coding-algorithm-sequencing': {
        skillId: 'coding-algorithm-sequencing',
        skillName: 'Algorithmic Pathfinding & Loops',
        subject: 'coding',
        topic: 'Algorithms, Sequencing & Loops',
        mastery: 'Secure',
        accuracy: 80,
        attempts: 5,
        correctCount: 4,
        hintsUsed: 1,
        currentStreak: 2,
        difficultyLevel: 3,
        lastPracticedAt: Date.now() - 36000000,
        recentErrors: [],
      },
      'coding-debugging': {
        skillId: 'coding-debugging',
        skillName: 'Fault Isolation & Code Debugging',
        subject: 'coding',
        topic: 'Debugging & Code Tracing',
        mastery: 'Developing',
        accuracy: 67,
        attempts: 3,
        correctCount: 2,
        hintsUsed: 2,
        currentStreak: 1,
        difficultyLevel: 2,
        lastPracticedAt: Date.now() - 22000000,
        recentErrors: ['Debugging & Code Tracing: Loop accumulator update'],
      },
      'logic-deduction-grid': {
        skillId: 'logic-deduction-grid',
        skillName: 'Deductive Constraint Elimination',
        subject: 'logic',
        topic: 'Logical Deduction & Elimination',
        mastery: 'Improving',
        accuracy: 75,
        attempts: 4,
        correctCount: 3,
        hintsUsed: 1,
        currentStreak: 1,
        difficultyLevel: 2,
        lastPracticedAt: Date.now() - 18000000,
        recentErrors: [],
      },
    },
    constellation: INITIAL_CONSTELLATION,
    sessions: [
      {
        id: 'sess-demo-1',
        timestamp: Date.now() - 86400000,
        durationSeconds: 900,
        subjectFocus: 'mixed',
        gamesPlayed: ['reactor-rush', 'fraction-forge', 'algorithm-maze', 'bug-hunter'],
        questionsAttempted: 18,
        questionsCorrect: 15,
        hintsUsed: 3,
        xpEarned: 680,
        starsEarned: 5,
        skillsPracticed: [
          'Algebraic Core Stabilization',
          'Proportional & Fraction Equivalence',
          'Algorithmic Pathfinding & Loops',
          'Fault Isolation & Code Debugging',
        ],
        errorsLogged: [
          {
            topic: 'Debugging & Code Tracing',
            prompt: 'Star Array Total Energy Sum',
            studentAnswer: 'total = 0',
            correctAnswer: 'total = total + power',
          },
        ],
      },
    ],
    highScores: {
      'reactor-rush': 1420,
      'fraction-forge': 980,
      'geometry-sculptor': 760,
      'logic-labyrinth': 890,
      'algorithm-maze': 1150,
      'bug-hunter': 920,
      'pattern-planet': 640,
      'probability-observatory': 580,
      'memory-constellation': 610,
      'cosmic-boss-battle': 1200,
    },
    preferences: {
      soundEnabled: true,
      reducedMotion: false,
      narrationEnabled: false,
    },
  };
}

export function loadStudentProfile(): StudentProfile {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createDefaultStudentProfile(6);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultStudentProfile(6);
    const parsed = JSON.parse(raw) as StudentProfile;
    if (!parsed || !parsed.grade || !parsed.planetProgress) {
      return createDefaultStudentProfile(6);
    }
    return parsed;
  } catch {
    return createDefaultStudentProfile(6);
  }
}

export function saveStudentProfile(profile: StudentProfile): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function unlockNextConstellationStar(
  constellation: StudentProfile['constellation'],
  preferredPlanetId?: PlanetConfig['id']
): { updated: StudentProfile['constellation']; newlyUnlocked?: StudentProfile['constellation'][0] } {
  const copy = constellation.map((c) => ({ ...c }));
  let target = copy.find((c) => !c.unlocked && c.planetId === preferredPlanetId);
  if (!target) {
    target = copy.find((c) => !c.unlocked);
  }
  if (target) {
    target.unlocked = true;
    target.unlockedAt = Date.now();
    return { updated: copy, newlyUnlocked: target };
  }
  return { updated: copy };
}

type PlanetConfig = (typeof PLANETS)[number];
export function getRecommendedGameForPlanet(planetId: PlanetConfig['id']): GameId {
  const found = PLANETS.find((p) => p.id === planetId);
  return found ? found.featuredGameId : 'reactor-rush';
}
