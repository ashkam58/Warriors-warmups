import test from 'node:test';
import assert from 'node:assert/strict';
import { getGradeBandForGrade, PLANETS, GAMES } from './worldData';
import { generateChallengeForGame } from './questionBank';
import {
  evaluateAdaptiveSkillUpdate,
  calculateChallengeReward,
  getActiveSessionPhase,
  generateTeacherHandoverSummary,
  createDefaultStudentProfile,
  unlockNextConstellationStar,
} from './adaptiveEngine';
import { GameId, GradeNumber } from '../types/universe';

test('grade band mapping covers Grades 1 to 12 accurately', () => {
  assert.equal(getGradeBandForGrade(1), 'grades-1-2');
  assert.equal(getGradeBandForGrade(2), 'grades-1-2');
  assert.equal(getGradeBandForGrade(4), 'grades-3-5');
  assert.equal(getGradeBandForGrade(7), 'grades-6-8');
  assert.equal(getGradeBandForGrade(10), 'grades-9-10');
  assert.equal(getGradeBandForGrade(12), 'grades-11-12');
});

test('all 8 planets and 10 games are defined and cross-linked', () => {
  assert.equal(PLANETS.length, 8);
  assert.equal(Object.keys(GAMES).length, 10);
  for (const planet of PLANETS) {
    assert.ok(GAMES[planet.featuredGameId], `Featured game missing for ${planet.id}`);
  }
});

test('question bank generates valid challenges with verified answers across all 10 games and grade bands', () => {
  const allGames = Object.keys(GAMES) as GameId[];
  const sampleGrades: GradeNumber[] = [1, 4, 7, 10, 12];

  for (const gameId of allGames) {
    for (const grade of sampleGrades) {
      const challenge = generateChallengeForGame(gameId, grade, 2, 'CBSE', 0);
      assert.equal(challenge.gameId, gameId);
      assert.ok(challenge.prompt.length > 5);
      assert.ok(String(challenge.correctAnswer).length > 0);
      assert.ok(challenge.hints.length >= 2);
      assert.ok(challenge.explanation.length > 5);
    }
  }
});

test('adaptive skill engine progresses mastery and adjusts difficulty fairly', () => {
  const challenge = generateChallengeForGame('reactor-rush', 6, 2, 'CBSE', 0);

  // First correct attempt without hints
  let progress = evaluateAdaptiveSkillUpdate(undefined, challenge, true, 0);
  assert.equal(progress.attempts, 1);
  assert.equal(progress.correctCount, 1);
  assert.equal(progress.accuracy, 100);
  assert.equal(progress.mastery, 'Developing');

  // Second consecutive correct attempt increases difficulty
  progress = evaluateAdaptiveSkillUpdate(progress, challenge, true, 0);
  assert.equal(progress.currentStreak, 2);
  assert.equal(progress.difficultyLevel, 3);
  assert.equal(progress.mastery, 'Improving');

  // Third and fourth correct attempts reach Secure then Mastered
  progress = evaluateAdaptiveSkillUpdate(progress, challenge, true, 0);
  assert.equal(progress.mastery, 'Secure');

  progress = evaluateAdaptiveSkillUpdate(progress, challenge, true, 0);
  assert.equal(progress.mastery, 'Mastered');

  // An incorrect attempt gently lowers difficulty by 1 without wiping out progress
  const afterMistake = evaluateAdaptiveSkillUpdate(progress, challenge, false, 1);
  assert.equal(afterMistake.currentStreak, 0);
  assert.equal(afterMistake.difficultyLevel, progress.difficultyLevel - 1);
  assert.equal(afterMistake.recentErrors.length, 1);
});

test('reward calculation encourages persistence and accuracy', () => {
  const base = calculateChallengeReward(100, 3, 2, 0, false);
  assert.ok(base.points > 100);
  assert.ok(base.xp > 50);
  assert.equal(base.stars, 2);

  const withHintAndRetry = calculateChallengeReward(100, 3, 1, 1, true);
  assert.ok(withHintAndRetry.points > 100);
  assert.equal(withHintAndRetry.stars, 1);
});

test('15-minute session engine maps elapsed seconds to the 6 phases', () => {
  assert.equal(getActiveSessionPhase(15, 15).id, 'intro');
  assert.equal(getActiveSessionPhase(120, 15).id, 'ignition');
  assert.equal(getActiveSessionPhase(300, 15).id, 'core-game');
  assert.equal(getActiveSessionPhase(600, 15).id, 'mixed-practice');
  assert.equal(getActiveSessionPhase(750, 15).id, 'boss-challenge');
  assert.equal(getActiveSessionPhase(860, 15).id, 'summary');
});

test('constellation unlocker and teacher handover summary work on profile data', () => {
  const profile = createDefaultStudentProfile(6);
  const summary = generateTeacherHandoverSummary(profile);
  assert.ok(summary.includes('Aarav Sharma'));
  assert.ok(summary.includes('Grade 6'));

  const unlockRes = unlockNextConstellationStar(profile.constellation, 'geometry-galaxy');
  assert.ok(unlockRes.newlyUnlocked);
  assert.equal(unlockRes.newlyUnlocked?.planetId, 'geometry-galaxy');
});
