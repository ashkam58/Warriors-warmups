export type GradeNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type GradeBandId =
  | 'grades-1-2'
  | 'grades-3-5'
  | 'grades-6-8'
  | 'grades-9-10'
  | 'grades-11-12';

export type CurriculumId =
  | 'CBSE'
  | 'ICSE'
  | 'IGCSE'
  | 'IB'
  | 'INTERNATIONAL'
  | 'CUSTOM';

export type SubjectId = 'mathematics' | 'coding' | 'logic';

export type MasteryState =
  | 'New'
  | 'Exploring'
  | 'Developing'
  | 'Improving'
  | 'Secure'
  | 'Mastered';

export type PlanetId =
  | 'number-nebula'
  | 'geometry-galaxy'
  | 'fraction-frontier'
  | 'logic-labyrinth'
  | 'code-command'
  | 'pixel-architect'
  | 'probability-observatory'
  | 'quantum-vault';

export type GameId =
  | 'reactor-rush'
  | 'fraction-forge'
  | 'geometry-sculptor'
  | 'logic-labyrinth'
  | 'algorithm-maze'
  | 'bug-hunter'
  | 'pattern-planet'
  | 'probability-observatory'
  | 'memory-constellation'
  | 'cosmic-boss-battle';

export type SessionPhaseId =
  | 'intro'
  | 'ignition'
  | 'core-game'
  | 'mixed-practice'
  | 'boss-challenge'
  | 'summary';

export interface GradeBandInfo {
  id: GradeBandId;
  name: string;
  grades: GradeNumber[];
  tagline: string;
  accentColor: string;
  topics: {
    mathematics: string[];
    coding: string[];
    logic: string[];
  };
}

export interface PlanetConfig {
  id: PlanetId;
  number: number;
  name: string;
  subtitle: string;
  domain: SubjectId | 'mixed';
  description: string;
  primaryColor: string;
  secondaryColor: string;
  emissiveColor: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  size: number;
  ringStyle?: 'none' | 'wide' | 'double' | 'tilted' | 'quantum';
  moons: number;
  featuredGameId: GameId;
  secondaryGameIds: GameId[];
  topics: string[];
  emoji?: string;
}

export interface GameMetadata {
  id: GameId;
  code: string;
  name: string;
  planetId: PlanetId;
  subject: SubjectId | 'mixed';
  tagline: string;
  description: string;
  controlsHint: string;
  accentHex: string;
  isCorePriority: boolean;
  emoji?: string;
}

export interface SkillProgress {
  skillId: string;
  skillName: string;
  subject: SubjectId;
  topic: string;
  mastery: MasteryState;
  accuracy: number; // 0 to 100
  attempts: number;
  correctCount: number;
  hintsUsed: number;
  currentStreak: number;
  difficultyLevel: number; // 1 to 5
  lastPracticedAt: number;
  recentErrors: string[];
}

export interface ChallengeItem {
  id: string;
  gameId: GameId;
  gradeRange: [GradeNumber, GradeNumber];
  curriculum: CurriculumId | 'ALL';
  subject: SubjectId;
  topic: string;
  subtopic: string;
  skillId: string;
  skillName: string;
  difficulty: number; // 1 to 5
  questionType:
    | 'mental-math'
    | 'fraction-visual'
    | 'geometry-construct'
    | 'logic-grid'
    | 'algorithm-blocks'
    | 'bug-hunt'
    | 'pattern-sequence'
    | 'probability-sim'
    | 'memory-grid'
    | 'boss-multistage';
  prompt: string;
  contextStory?: string;
  // Interactive payload specific to the game mode
  payload: Record<string, any>;
  correctAnswer: string | number;
  acceptedVariations: string[];
  options?: string[];
  hints: string[];
  explanation: string;
  basePoints: number;
  estimatedSeconds: number;
  prerequisites: string[];
  emoji?: string;
}

export interface SessionPhaseConfig {
  id: SessionPhaseId;
  label: string;
  startMinute: number;
  endMinute: number;
  description: string;
  recommendedGameId: GameId;
}

export interface SessionConfig {
  durationMinutes: number;
  subjectFocus: SubjectId | 'mixed';
  selectedPlanetId: PlanetId;
  selectedGameId: GameId;
  selectedTopic: string | 'adaptive';
  difficultyOverride: number | null; // 1-5 or null for adaptive
  skipIntro: boolean;
  isFullSession: boolean; // true = 15-min multi-phase, false = single game focus
}

export interface SessionRecord {
  id: string;
  timestamp: number;
  durationSeconds: number;
  subjectFocus: SubjectId | 'mixed';
  gamesPlayed: GameId[];
  questionsAttempted: number;
  questionsCorrect: number;
  hintsUsed: number;
  xpEarned: number;
  starsEarned: number;
  skillsPracticed: string[];
  errorsLogged: {
    topic: string;
    prompt: string;
    studentAnswer: string;
    correctAnswer: string;
  }[];
}

export interface ConstellationStar {
  id: string;
  name: string;
  planetId: PlanetId;
  x: number; // 0-100 on sky map
  y: number; // 0-100 on sky map
  unlocked: boolean;
  unlockedAt?: number;
  missionTitle: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  avatarId: string;
  shipColor: string;
  trailStyle: string;
  unlockedCosmetics: string[];
  grade: GradeNumber;
  gradeBand: GradeBandId;
  curriculum: CurriculumId;
  xp: number;
  stars: number;
  level: number;
  badges: string[];
  planetProgress: Record<PlanetId, number>; // 0 to 100
  skills: Record<string, SkillProgress>;
  constellation: ConstellationStar[];
  sessions: SessionRecord[];
  highScores: Record<GameId, number>;
  preferences: {
    soundEnabled: boolean;
    reducedMotion: boolean;
    narrationEnabled: boolean;
  };
}
