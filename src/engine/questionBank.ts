import {
  ChallengeItem,
  CurriculumId,
  GameId,
  GradeNumber,
} from '../types/universe';
import { getGradeBandForGrade } from './worldData';

/**
 * Generates or selects a mathematically/algorithmically verified ChallengeItem
 * tailored to the student's grade, difficulty (1..5), and game mode.
 */
export function generateChallengeForGame(
  gameId: GameId,
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId = 'CBSE',
  stepIndex: number = 0
): ChallengeItem {
  const clampedDiff = Math.max(1, Math.min(5, Math.round(difficulty)));

  switch (gameId) {
    case 'reactor-rush':
      return generateReactorRushChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'fraction-forge':
      return generateFractionForgeChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'geometry-sculptor':
      return generateGeometrySculptorChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'logic-labyrinth':
      return generateLogicLabyrinthChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'algorithm-maze':
      return generateAlgorithmMazeChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'bug-hunter':
      return generateBugHunterChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'pattern-planet':
      return generatePatternPlanetChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'probability-observatory':
      return generateProbabilityChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'memory-constellation':
      return generateMemoryChallenge(grade, clampedDiff, curriculum, stepIndex);
    case 'cosmic-boss-battle':
      return generateBossChallenge(grade, clampedDiff, curriculum, stepIndex);
    default:
      return generateReactorRushChallenge(grade, clampedDiff, curriculum, stepIndex);
  }
}

function generateReactorRushChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const band = getGradeBandForGrade(grade);
  const s = (seedIdx + 1) * (difficulty + 2);

  if (band === 'grades-1-2') {
    if (seedIdx % 3 === 1) {
      // Fun subtraction / fuel drain
      const a = 11 + ((s * 3) % 14);
      const b = 3 + ((s * 2) % 8);
      const ans = a - b;
      return {
        id: `rr-g12-sub-${a}-${b}-${seedIdx}`,
        gameId: 'reactor-rush',
        gradeRange: [1, 2],
        curriculum,
        subject: 'mathematics',
        topic: 'Subtraction & Mental Fluency',
        subtopic: 'Countdown subtraction',
        skillId: 'math-addition-basic',
        skillName: 'Number Fluency & Subtraction',
        difficulty,
        questionType: 'mental-math',
        emoji: '🚀',
        prompt: `${a} − ${b} = ?`,
        contextStory: `🛸 ${a} space drones docked, then ${b} flew off! How many drones remain?`,
        payload: { operandA: a, operandB: b, operator: '-', mode: 'standard' },
        correctAnswer: ans,
        acceptedVariations: [String(ans)],
        hints: [
          `Start at ${a} and count backward ${b} steps.`,
          `Think: ${ans} + ${b} = ${a}.`,
        ],
        explanation: `${a} minus ${b} equals ${ans}!`,
        basePoints: 110,
        estimatedSeconds: 15,
        prerequisites: ['Counting'],
      };
    } else if (difficulty <= 2 && seedIdx % 3 === 0) {
      const a = 4 + ((s * 5) % 13);
      const b = 3 + ((s * 3) % 9);
      const ans = a + b;
      return {
        id: `rr-g12-add-${a}-${b}-${seedIdx}`,
        gameId: 'reactor-rush',
        gradeRange: [1, 2],
        curriculum,
        subject: 'mathematics',
        topic: 'Addition and subtraction',
        subtopic: 'Single & double-digit mental addition',
        skillId: 'math-addition-basic',
        skillName: 'Number Fluency & Addition',
        difficulty,
        questionType: 'mental-math',
        emoji: '⚡',
        prompt: `${a} + ${b} = ?`,
        contextStory: `⚡ Inject ${a} + ${b} plasma batteries into Rocket Booster Alpha!`,
        payload: { operandA: a, operandB: b, operator: '+', mode: 'standard' },
        correctAnswer: ans,
        acceptedVariations: [String(ans)],
        hints: [
          `Start at ${Math.max(a, b)} and count forward ${Math.min(a, b)} steps.`,
          `Break ${b} into smaller parts to reach the nearest 10 first.`,
        ],
        explanation: `${a} plus ${b} equals ${ans}.`,
        basePoints: 100,
        estimatedSeconds: 15,
        prerequisites: ['Counting'],
      };
    } else {
      // Missing addend or balance
      const target = 14 + ((s * 3) % 16);
      const part = 4 + ((s * 2) % 9);
      const ans = target - part;
      return {
        id: `rr-g12-miss-${target}-${part}-${seedIdx}`,
        gameId: 'reactor-rush',
        gradeRange: [1, 2],
        curriculum,
        subject: 'mathematics',
        topic: 'Place value & missing numbers',
        subtopic: 'Missing addend balance',
        skillId: 'math-missing-number',
        skillName: 'Missing Number Equations',
        difficulty,
        questionType: 'mental-math',
        emoji: '🔋',
        prompt: `${part} + [ ? ] = ${target}`,
        contextStory: `🔋 Balance the fuel cell so the total power reaches ${target}!`,
        payload: { operandA: part, target, operator: '+?', mode: 'missing' },
        correctAnswer: ans,
        acceptedVariations: [String(ans)],
        hints: [
          `Think: How many steps from ${part} up to ${target}?`,
          `Subtract ${target} - ${part} to find the missing energy unit.`,
        ],
        explanation: `Since ${target} - ${part} = ${ans}, the missing number is ${ans}.`,
        basePoints: 120,
        estimatedSeconds: 18,
        prerequisites: ['Addition'],
      };
    }
  }

  if (band === 'grades-3-5') {
    if (difficulty <= 2 && seedIdx % 2 === 0) {
      const a = 4 + ((s * 3) % 9);
      const b = 3 + ((s * 5) % 9);
      const ans = a * b;
      return {
        id: `rr-g35-mul-${a}-${b}-${seedIdx}`,
        gameId: 'reactor-rush',
        gradeRange: [3, 5],
        curriculum,
        subject: 'mathematics',
        topic: 'Multiplication and division',
        subtopic: 'Times table harmonics',
        skillId: 'math-mult-fluency',
        skillName: 'Multiplication Harmonics',
        difficulty,
        questionType: 'mental-math',
        emoji: '⚡',
        prompt: `${a} × ${b} = ?`,
        contextStory: `⚡ ${a} reactor coils each generating ${b} MW of cosmic power!`,
        payload: { operandA: a, operandB: b, operator: '×', mode: 'standard' },
        correctAnswer: ans,
        acceptedVariations: [String(ans)],
        hints: [
          `Think of ${a} groups of ${b}.`,
          `You can compute (${a} × ${Math.floor(b / 2)}) + (${a} × ${b - Math.floor(b / 2)}).`,
        ],
        explanation: `${a} multiplied by ${b} gives ${ans} MW.`,
        basePoints: 130,
        estimatedSeconds: 15,
        prerequisites: ['Addition'],
      };
    } else {
      const divisor = 3 + (s % 8);
      const quotient = 5 + ((s * 3) % 9);
      const bonus = 4 + ((s * 2) % 12);
      const dividend = divisor * quotient;
      const ans = quotient + bonus;
      return {
        id: `rr-g35-mix-${dividend}-${divisor}-${seedIdx}`,
        gameId: 'reactor-rush',
        gradeRange: [3, 5],
        curriculum,
        subject: 'mathematics',
        topic: 'Mixed operations',
        subtopic: 'Order of operations (BODMAS)',
        skillId: 'math-mixed-ops',
        skillName: 'Multi-Step Reactor Arithmetic',
        difficulty,
        questionType: 'mental-math',
        emoji: '🚀',
        prompt: `(${dividend} ÷ ${divisor}) + ${bonus} = ?`,
        contextStory: `🚀 Split the ${dividend} MW surge across ${divisor} conduits, then add ${bonus} MW reserve!`,
        payload: { dividend, divisor, bonus, mode: 'mixed' },
        correctAnswer: ans,
        acceptedVariations: [String(ans)],
        hints: [
          `First solve the division inside the brackets: ${dividend} ÷ ${divisor} = ${quotient}.`,
          `Now add ${bonus} to ${quotient}.`,
        ],
        explanation: `${dividend} ÷ ${divisor} = ${quotient}, and ${quotient} + ${bonus} = ${ans}.`,
        basePoints: 150,
        estimatedSeconds: 20,
        prerequisites: ['Multiplication and division'],
      };
    }
  }

  if (band === 'grades-6-8') {
    if (seedIdx % 2 === 0) {
      const x = 3 + ((s * 3) % 12);
      const coeff = 2 + (s % 6);
      const constant = 4 + ((s * 2) % 15);
      const rhs = coeff * x + constant;
      return {
        id: `rr-g68-alg-${coeff}-${x}-${constant}-${seedIdx}`,
        gameId: 'reactor-rush',
        gradeRange: [6, 8],
        curriculum,
        subject: 'mathematics',
        topic: 'Linear equations',
        subtopic: 'Solving for unknown variable x',
        skillId: 'math-linear-eq',
        skillName: 'Algebraic Core Stabilization',
        difficulty,
        questionType: 'mental-math',
        emoji: '⚡',
        prompt: `${coeff}x + ${constant} = ${rhs}   (Find x)`,
        contextStory: `⚡ Isolate the quantum flux variable x to lock the warp shield!`,
        payload: { coeff, constant, rhs, mode: 'algebra' },
        correctAnswer: x,
        acceptedVariations: [String(x), `x=${x}`],
        hints: [
          `First subtract ${constant} from both sides: ${coeff}x = ${rhs - constant}.`,
          `Now divide ${rhs - constant} by ${coeff}.`,
        ],
        explanation: `${coeff}x = ${rhs} - ${constant} = ${rhs - constant}. Dividing by ${coeff} gives x = ${x}.`,
        basePoints: 175,
        estimatedSeconds: 22,
        prerequisites: ['Algebraic expressions'],
      };
    } else {
      const base = 4 + ((s * 3) % 15);
      const pctChoices = [10, 20, 25, 50];
      const pct = pctChoices[s % pctChoices.length];
      const cleanBase =
        pct === 10 ? base * 10 : pct === 20 ? base * 5 : pct === 25 ? base * 4 : base * 2;
      const ans = (cleanBase * pct) / 100;
      return {
        id: `rr-g68-pct-${cleanBase}-${pct}-${seedIdx}`,
        gameId: 'reactor-rush',
        gradeRange: [6, 8],
        curriculum,
        subject: 'mathematics',
        topic: 'Percentages & Proportions',
        subtopic: 'Mental percentage calculation',
        skillId: 'math-linear-eq',
        skillName: 'Percentage Power Boost',
        difficulty,
        questionType: 'mental-math',
        emoji: '🔋',
        prompt: `${pct}% of ${cleanBase} = ?`,
        contextStory: `🔋 Solar panels captured ${pct}% of ${cleanBase} MW starlight! How many MW is that?`,
        payload: { pct, base: cleanBase, mode: 'percent' },
        correctAnswer: ans,
        acceptedVariations: [String(ans)],
        hints: [
          `${pct}% means ${pct}/100 (or divide by ${100 / pct}).`,
          `Compute ${cleanBase} ÷ ${100 / pct} = ${ans}.`,
        ],
        explanation: `${pct}% of ${cleanBase} = ${cleanBase} ÷ ${100 / pct} = ${ans}.`,
        basePoints: 175,
        estimatedSeconds: 20,
        prerequisites: ['Fractions & percentages'],
      };
    }
  }

  if (band === 'grades-9-10') {
    const root = 3 + ((s * 3) % 9);
    const offset = 5 + ((s * 3) % 16);
    const rhs = root * root + offset;
    return {
      id: `rr-g910-quad-${root}-${offset}-${seedIdx}`,
      gameId: 'reactor-rush',
      gradeRange: [9, 10],
      curriculum,
      subject: 'mathematics',
      topic: 'Quadratics & Polynomials',
      subtopic: 'Positive root of quadratic equation',
      skillId: 'math-quadratics',
      skillName: 'Quadratic Flux Resolution',
      difficulty,
      questionType: 'mental-math',
      emoji: '🚀',
      prompt: `x² + ${offset} = ${rhs}   (Positive x = ?)`,
      contextStory: `🚀 Compute the positive resonance amplitude x for the nonlinear thruster!`,
      payload: { root, offset, rhs, mode: 'quadratic' },
      correctAnswer: root,
      acceptedVariations: [String(root)],
      hints: [
        `Subtract ${offset} from ${rhs}: x² = ${rhs - offset}.`,
        `Take the positive square root of ${rhs - offset}.`,
      ],
      explanation: `x² = ${rhs} - ${offset} = ${root * root}, so the positive root is x = ${root}.`,
      basePoints: 200,
      estimatedSeconds: 25,
      prerequisites: ['Linear equations'],
    };
  }

  // Grades 11-12: Matrices determinant
  const a1 = 2 + ((s * 3) % 6);
  const d1 = 3 + ((s * 2) % 7);
  const b1 = 1 + (s % 4);
  const c1 = 2 + ((s * 5) % 5);
  const det = a1 * d1 - b1 * c1;
  return {
    id: `rr-g1112-det-${a1}-${b1}-${c1}-${d1}-${seedIdx}`,
    gameId: 'reactor-rush',
    gradeRange: [11, 12],
    curriculum,
    subject: 'mathematics',
    topic: 'Matrices & Calculus Foundations',
    subtopic: '2×2 Matrix Determinant',
    skillId: 'math-matrix-det',
    skillName: 'Matrix Determinant & Tensor Stability',
    difficulty,
    questionType: 'mental-math',
    emoji: '🌌',
    prompt: `det [ ${a1}, ${b1} | ${c1}, ${d1} ] = ?`,
    contextStory: `🌌 Compute the 2×2 Jacobian determinant (ad − bc) to stabilize the warp metric!`,
    payload: { matrix: [[a1, b1], [c1, d1]], mode: 'matrix' },
    correctAnswer: det,
    acceptedVariations: [String(det)],
    hints: [
      `For a 2×2 matrix [[a, b], [c, d]], the determinant is (a × d) - (b × c).`,
      `Compute (${a1} × ${d1}) - (${b1} × ${c1}) = ${a1 * d1} - ${b1 * c1}.`,
    ],
    explanation: `det = (${a1} × ${d1}) - (${b1} × ${c1}) = ${a1 * d1} - ${b1 * c1} = ${det}.`,
    basePoints: 240,
    estimatedSeconds: 28,
    prerequisites: ['Algebra'],
  };
}

function generateFractionForgeChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const presets = [
    {
      targetNum: 1,
      targetDen: 2,
      forgeSegments: 6,
      requiredSelected: 3,
      decimal: '0.5',
      percent: '50%',
      label: '1/2',
    },
    {
      targetNum: 2,
      targetDen: 3,
      forgeSegments: 6,
      requiredSelected: 4,
      decimal: '0.67',
      percent: '66.7%',
      label: '2/3',
    },
    {
      targetNum: 3,
      targetDen: 4,
      forgeSegments: 8,
      requiredSelected: 6,
      decimal: '0.75',
      percent: '75%',
      label: '3/4',
    },
    {
      targetNum: 2,
      targetDen: 5,
      forgeSegments: 10,
      requiredSelected: 4,
      decimal: '0.4',
      percent: '40%',
      label: '2/5',
    },
    {
      targetNum: 5,
      targetDen: 6,
      forgeSegments: 12,
      requiredSelected: 10,
      decimal: '0.83',
      percent: '83.3%',
      label: '5/6',
    },
    {
      targetNum: 3,
      targetDen: 8,
      forgeSegments: 8,
      requiredSelected: 3,
      decimal: '0.375',
      percent: '37.5%',
      label: '3/8',
    },
    {
      targetNum: 3,
      targetDen: 5,
      forgeSegments: 10,
      requiredSelected: 6,
      decimal: '0.6',
      percent: '60%',
      label: '3/5',
    },
    {
      targetNum: 1,
      targetDen: 3,
      forgeSegments: 12,
      requiredSelected: 4,
      decimal: '0.33',
      percent: '33.3%',
      label: '1/3',
    },
    {
      targetNum: 7,
      targetDen: 10,
      forgeSegments: 10,
      requiredSelected: 7,
      decimal: '0.7',
      percent: '70%',
      label: '7/10',
    },
  ];

  const item = presets[(seedIdx + difficulty - 1) % presets.length];
  const isHigherGrade = grade >= 6;

  return {
    id: `ff-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'fraction-forge',
    gradeRange: [1, 12],
    curriculum,
    subject: 'mathematics',
    topic: 'Fractions, decimals & proportions',
    subtopic: isHigherGrade ? 'Proportional equivalence & percentages' : 'Visual fraction partitioning',
    skillId: 'math-fractions-equivalence',
    skillName: 'Proportional & Fraction Equivalence',
    difficulty,
    questionType: 'fraction-visual',
    emoji: '🍕',
    prompt: isHigherGrade
      ? `🍕 Slice the ring into ${item.forgeSegments} parts & match ${item.label} (${item.percent})!`
      : `🍕 Slice into ${item.forgeSegments} pieces & light up ${item.label}!`,
    contextStory: `🛸 Balance the Fraction Frontier energy pizza so the ratio equals ${item.label}.`,
    payload: {
      targetNumerator: item.targetNum,
      targetDenominator: item.targetDen,
      totalSegments: item.forgeSegments,
      requiredActive: item.requiredSelected,
      decimalValue: item.decimal,
      percentValue: item.percent,
    },
    correctAnswer: item.requiredSelected,
    acceptedVariations: [
      String(item.requiredSelected),
      `${item.requiredSelected}/${item.forgeSegments}`,
      item.label,
    ],
    hints: [
      `First set the total ring divisions to ${item.forgeSegments} equal parts.`,
      `To make an equivalent fraction to ${item.targetNum}/${item.targetDen} with denominator ${item.forgeSegments}, multiply top and bottom by ${item.forgeSegments / item.targetDen}.`,
      `Activate exactly ${item.requiredSelected} out of ${item.forgeSegments} sectors.`,
    ],
    explanation: `${item.targetNum}/${item.targetDen} is equivalent to ${item.requiredSelected}/${item.forgeSegments} (${item.percent} or ${item.decimal}).`,
    basePoints: 160,
    estimatedSeconds: 30,
    prerequisites: ['Division', 'Number sense'],
  };
}

function generateGeometrySculptorChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const configs = [
    {
      targetWidth: 6,
      targetHeight: 4,
      mode: 'area',
      targetValue: 24,
      targetPerimeter: 20,
      prompt: 'Sculpt a rectangular solar array with an Area of 24 sq units and a Perimeter of 20 units.',
    },
    {
      targetWidth: 5,
      targetHeight: 5,
      mode: 'square',
      targetValue: 25,
      targetPerimeter: 20,
      prompt: 'Construct a symmetrical square crystal platform with Area = 25 sq units (Perimeter = 20 units).',
    },
    {
      targetWidth: 8,
      targetHeight: 3,
      mode: 'perimeter',
      targetValue: 24,
      targetPerimeter: 22,
      prompt: 'Configure the containment frame so Width × Height = 24 sq units and Perimeter = 22 units.',
    },
    {
      targetWidth: 7,
      targetHeight: 4,
      mode: 'area',
      targetValue: 28,
      targetPerimeter: 22,
      prompt: 'Sculpt an orbital docking pad with Area = 28 sq units and Perimeter = 22 units.',
    },
    {
      targetWidth: 9,
      targetHeight: 4,
      mode: 'area',
      targetValue: 36,
      targetPerimeter: 26,
      prompt: 'Construct a hyper-solar wing with Area = 36 sq units and Perimeter = 26 units.',
    },
    {
      targetWidth: 6,
      targetHeight: 6,
      mode: 'square',
      targetValue: 36,
      targetPerimeter: 24,
      prompt: 'Forge a perfect square quantum shield with Area = 36 sq units and Perimeter = 24 units.',
    },
  ];
  const cfg = configs[(seedIdx + difficulty - 1) % configs.length];

  return {
    id: `gs-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'geometry-sculptor',
    gradeRange: [1, 12],
    curriculum,
    subject: 'mathematics',
    topic: 'Geometry, Area & Perimeter',
    subtopic: 'Spatial construction & coordinate dimensions',
    skillId: 'math-geometry-construct',
    skillName: 'Geometric Construction & Spatial Mensuration',
    difficulty,
    questionType: 'geometry-construct',
    prompt: cfg.prompt,
    contextStory: 'Adjust the X-span (Width) and Y-span (Height) of the geometric lattice to match the target blueprint.',
    payload: {
      targetArea: cfg.targetValue,
      targetPerimeter: cfg.targetPerimeter,
      idealWidth: cfg.targetWidth,
      idealHeight: cfg.targetHeight,
    },
    correctAnswer: `${cfg.targetValue}-${cfg.targetPerimeter}`,
    acceptedVariations: [
      `${cfg.targetWidth}x${cfg.targetHeight}`,
      `${cfg.targetHeight}x${cfg.targetWidth}`,
      `${cfg.targetValue}-${cfg.targetPerimeter}`,
    ],
    hints: [
      `Remember: Area = Width × Height, and Perimeter = 2 × (Width + Height).`,
      `Look for two numbers that multiply to ${cfg.targetValue} and add up to ${cfg.targetPerimeter / 2}.`,
      `Try setting Width = ${cfg.targetWidth} and Height = ${cfg.targetHeight}.`,
    ],
    explanation: `A ${cfg.targetWidth} × ${cfg.targetHeight} lattice has Area = ${cfg.targetWidth} × ${cfg.targetHeight} = ${cfg.targetValue} and Perimeter = 2 × (${cfg.targetWidth} + ${cfg.targetHeight}) = ${cfg.targetPerimeter}.`,
    basePoints: 170,
    estimatedSeconds: 30,
    prerequisites: ['Multiplication', 'Addition'],
  };
}

function generateLogicLabyrinthChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const puzzles = [
    {
      title: 'The Prime Beacon Gate',
      clues: [
        'Clue 1: The safe portal number is a PRIME number.',
        'Clue 2: The number is strictly greater than 10.',
        'Clue 3: The sum of its digits equals 8.',
      ],
      nodes: [
        { id: '11', label: 'Portal 11', value: '11', desc: 'Prime · Digit sum = 2' },
        { id: '15', label: 'Portal 15', value: '15', desc: 'Composite (3×5) · Digit sum = 6' },
        { id: '17', label: 'Portal 17', value: '17', desc: 'Prime · Digit sum = 8' },
        { id: '26', label: 'Portal 26', value: '26', desc: 'Even · Digit sum = 8' },
      ],
      correctId: '17',
      explanation: '17 is prime, greater than 10, and 1 + 7 = 8. (26 has digit sum 8 but is not prime).',
    },
    {
      title: 'The Tri-Sensor Deduction Matrix',
      clues: [
        'Clue 1: Sector A does NOT hold the Quantum Key.',
        'Clue 2: Either Sector B or Sector C holds the Quantum Key.',
        'Clue 3: The correct sector has an EVEN sector code.',
      ],
      nodes: [
        { id: 'A-14', label: 'Sector A-14', value: 'A-14', desc: 'Sector A · Code 14 (Even)' },
        { id: 'B-19', label: 'Sector B-19', value: 'B-19', desc: 'Sector B · Code 19 (Odd)' },
        { id: 'C-24', label: 'Sector C-24', value: 'C-24', desc: 'Sector C · Code 24 (Even)' },
        { id: 'D-30', label: 'Sector D-30', value: 'D-30', desc: 'Sector D · Code 30 (Even)' },
      ],
      correctId: 'C-24',
      explanation: 'Clue 1 & 2 narrow it to B or C. Clue 3 requires an even code, eliminating B-19 and leaving C-24.',
    },
    {
      title: 'The Harmonic Lock Sequence',
      clues: [
        'Clue 1: The passcode is a multiple of both 3 and 4.',
        'Clue 2: It is between 20 and 40.',
        'Clue 3: It is NOT divisible by 9.',
      ],
      nodes: [
        { id: '18', label: 'Node 18', value: '18', desc: 'Divisible by 3 & 9, not 4' },
        { id: '24', label: 'Node 24', value: '24', desc: 'Multiple of 3 & 4 (12×2)' },
        { id: '32', label: 'Node 32', value: '32', desc: 'Multiple of 4, not 3' },
        { id: '36', label: 'Node 36', value: '36', desc: 'Multiple of 3, 4, and 9' },
      ],
      correctId: '24',
      explanation: 'Multiples of 3 and 4 between 20 and 40 are 24 and 36. Since 36 is divisible by 9, Clues 1–3 uniquely identify 24.',
    },
    {
      title: 'Boolean Circuit Gatekeeper',
      clues: [
        'Clue 1: Signal P is TRUE and Signal Q is FALSE.',
        'Clue 2: The target gate outputs TRUE for (P AND NOT Q).',
        'Clue 3: The gate ID must have an odd number.',
      ],
      nodes: [
        { id: 'GATE-2', label: 'Gate 2 (TRUE)', value: 'GATE-2', desc: 'Output: TRUE · ID: 2 (Even)' },
        { id: 'GATE-3', label: 'Gate 3 (TRUE)', value: 'GATE-3', desc: 'Output: TRUE · ID: 3 (Odd)' },
        { id: 'GATE-5', label: 'Gate 5 (FALSE)', value: 'GATE-5', desc: 'Output: FALSE · ID: 5 (Odd)' },
        { id: 'GATE-8', label: 'Gate 8 (FALSE)', value: 'GATE-8', desc: 'Output: FALSE · ID: 8 (Even)' },
      ],
      correctId: 'GATE-3',
      explanation: 'Since P is TRUE and NOT Q is TRUE, (P AND NOT Q) evaluates to TRUE. With an odd ID required, Gate 3 is the unique solution.',
    },
  ];

  const p = puzzles[(seedIdx + difficulty - 1) % puzzles.length];

  return {
    id: `ll-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'logic-labyrinth',
    gradeRange: [1, 12],
    curriculum,
    subject: 'logic',
    topic: 'Logical Deduction & Elimination',
    subtopic: p.title,
    skillId: 'logic-deduction-grid',
    skillName: 'Deductive Constraint Elimination',
    difficulty,
    questionType: 'logic-grid',
    prompt: `Analyze all 3 logical clues to eliminate trap nodes and unlock ${p.title}.`,
    contextStory: 'Every false gate drains shields. Cross-check each constraint before locking in your path.',
    payload: {
      title: p.title,
      clues: p.clues,
      nodes: p.nodes,
    },
    correctAnswer: p.correctId,
    acceptedVariations: [p.correctId],
    hints: [
      `Test Clue 1 against all 4 nodes and cross out any node that violates it.`,
      `Now apply Clue 2 and Clue 3 to the remaining candidates.`,
      p.explanation,
    ],
    explanation: p.explanation,
    basePoints: 180,
    estimatedSeconds: 35,
    prerequisites: ['Logical reasoning'],
  };
}

function generateAlgorithmMazeChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  // 5x5 grid: rover starts at (startX, startY) facing 'E' (East: +X)
  // Commands: 'FORWARD', 'LEFT', 'RIGHT', 'REPEAT_2_FORWARD', 'REPEAT_3_FORWARD'
  const levels = [
    {
      name: 'Sector Alpha Straight-Run & Turn',
      gridSize: 5,
      start: { x: 0, y: 2, dir: 'E' as const },
      goal: { x: 2, y: 0 },
      hazards: [
        { x: 1, y: 1 },
        { x: 3, y: 2 },
      ],
      idealBlocks: ['REPEAT_2_FORWARD', 'LEFT', 'REPEAT_2_FORWARD'],
      pythonPreview: `for _ in range(2):\n    rover.move_forward()\nrover.turn_left()\nfor _ in range(2):\n    rover.move_forward()`,
      hintText: 'Move 2 tiles East to (2, 2), turn Left to face North, then move 2 tiles North to (2, 0).',
    },
    {
      name: 'Nebula Asteroid Bypass',
      gridSize: 5,
      start: { x: 0, y: 1, dir: 'E' as const },
      goal: { x: 3, y: 3 },
      hazards: [
        { x: 2, y: 1 },
        { x: 1, y: 3 },
      ],
      idealBlocks: ['FORWARD', 'RIGHT', 'REPEAT_2_FORWARD', 'LEFT', 'REPEAT_2_FORWARD'],
      pythonPreview: `rover.move_forward()\nrover.turn_right()\nfor _ in range(2):\n    rover.move_forward()\nrover.turn_left()\nfor _ in range(2):\n    rover.move_forward()`,
      hintText: 'Step 1 tile East to (1,1), turn Right (South), move 2 tiles South to (1,3)... wait! (1,3) has an asteroid! Instead: turn Right at (1,1), move 1 tile South to (1,2), turn Left (East), move 2 tiles to (3,2), turn Right (South), move 1 tile to (3,3) — or use the Quick Ideal Sequence button!',
    },
    {
      name: 'Deep Space L-Corridor',
      gridSize: 5,
      start: { x: 1, y: 4, dir: 'E' as const },
      goal: { x: 4, y: 1 },
      hazards: [
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ],
      idealBlocks: ['REPEAT_3_FORWARD', 'LEFT', 'REPEAT_3_FORWARD'],
      pythonPreview: `for _ in range(3):\n    rover.move_forward()\nrover.turn_left()\nfor _ in range(3):\n    rover.move_forward()`,
      hintText: 'Move 3 tiles East along the bottom row to (4, 4), turn Left (North), and move 3 tiles North to reach (4, 1).',
    },
  ];

  // Fix Level 2 hazards so idealBlocks is 100% collision-free:
  levels[1].hazards = [
    { x: 2, y: 1 },
    { x: 0, y: 3 },
  ];
  levels[1].hintText =
    'Move 1 tile East to (1,1), turn Right (South), move 2 tiles South to (1,3), turn Left (East), and move 2 tiles East to (3,3).';

  const lvl = levels[(seedIdx + difficulty - 1) % levels.length];

  return {
    id: `am-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'algorithm-maze',
    gradeRange: [1, 12],
    curriculum,
    subject: 'coding',
    topic: 'Algorithms, Sequencing & Loops',
    subtopic: lvl.name,
    skillId: 'coding-algorithm-sequencing',
    skillName: 'Algorithmic Pathfinding & Loops',
    difficulty,
    questionType: 'algorithm-blocks',
    prompt: `Build a sequence of commands to navigate Rover Aegis from (${lvl.start.x}, ${lvl.start.y}) to the Quantum Crystal at (${lvl.goal.x}, ${lvl.goal.y}) without hitting asteroids.`,
    contextStory: 'Queue your command blocks (or Repeat loops) and click Execute Algorithm to run the rover.',
    payload: lvl,
    correctAnswer: 'GOAL_REACHED',
    acceptedVariations: ['GOAL_REACHED'],
    hints: [
      `The rover starts at (${lvl.start.x}, ${lvl.start.y}) facing East (right).`,
      lvl.hintText,
      `Equivalent Python code:\n${lvl.pythonPreview}`,
    ],
    explanation: `Executing [${lvl.idealBlocks.join(' → ')}] navigates the rover cleanly to (${lvl.goal.x}, ${lvl.goal.y}).`,
    basePoints: 200,
    estimatedSeconds: 45,
    prerequisites: ['Sequencing', 'Spatial direction'],
  };
}

function generateBugHunterChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const bugs = [
    {
      title: 'Thruster Fuel Countdown Loop',
      language: grade <= 5 ? 'Block Pseudocode' : 'Python',
      lines: [
        'def ignite_thrusters(fuel):',
        '    while fuel > 0:',
        '        print("Boosting! Fuel:", fuel)',
        '        fuel = fuel + 1  # <-- Check how fuel changes!',
        '    return "Thrusters Complete"',
      ],
      buggyLineIndex: 3,
      patches: [
        { id: 'fix-sub', code: '        fuel = fuel - 1', isCorrect: true, reason: 'Decrements fuel each step so the countdown loop terminates at 0.' },
        { id: 'fix-mul', code: '        fuel = fuel * 2', isCorrect: false, reason: 'Doubles fuel forever, keeping the infinite loop.' },
        { id: 'fix-zero', code: '        while fuel < 0:', isCorrect: false, reason: 'Condition would never run when starting with positive fuel.' },
      ],
      explanation: 'Line 4 added 1 to fuel (`fuel = fuel + 1`) instead of subtracting 1, creating an infinite loop.',
    },
    {
      title: 'Shield Recharge Threshold Check',
      language: grade <= 5 ? 'Pseudocode' : 'JavaScript',
      lines: [
        'function checkShieldStatus(energy) {',
        '  // Recharge needed whenever energy drops below 50',
        '  if (energy > 50) {',
        '    return "LOW SHIELD: Activate Recharge!";',
        '  }',
        '  return "Shields Nominal";',
        '}',
      ],
      buggyLineIndex: 2,
      patches: [
        { id: 'fix-lt', code: '  if (energy < 50) {', isCorrect: true, reason: 'Uses `<` (less than) so low energy (< 50) triggers the recharge alert.' },
        { id: 'fix-eq', code: '  if (energy === 100) {', isCorrect: false, reason: 'Only alerts when shields are completely full.' },
        { id: 'fix-ret', code: '  return energy + 50;', isCorrect: false, reason: 'Does not return the required status string.' },
      ],
      explanation: 'Line 3 used `>` instead of `<`, triggering the low-shield warning only when energy was above 50.',
    },
    {
      title: 'Star Array Total Energy Sum',
      language: 'Python',
      lines: [
        'def sum_star_outputs(outputs):',
        '    total = 0',
        '    for power in outputs:',
        '        total = power  # <-- Accumulator bug',
        '    return total',
      ],
      buggyLineIndex: 3,
      patches: [
        { id: 'fix-acc', code: '        total = total + power', isCorrect: true, reason: 'Adds each `power` value onto the running `total` accumulator.' },
        { id: 'fix-zero', code: '        total = 0', isCorrect: false, reason: 'Resets total to zero on every iteration.' },
        { id: 'fix-len', code: '        total = len(outputs)', isCorrect: false, reason: 'Counts items instead of summing their power values.' },
      ],
      explanation: 'Line 4 overwrote `total` with `power` on each loop iteration instead of accumulating `total = total + power`.',
    },
  ];

  const b = bugs[(seedIdx + difficulty - 1) % bugs.length];

  return {
    id: `bh-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'bug-hunter',
    gradeRange: [1, 12],
    curriculum,
    subject: 'coding',
    topic: 'Debugging & Code Tracing',
    subtopic: b.title,
    skillId: 'coding-debugging',
    skillName: 'Fault Isolation & Code Debugging',
    difficulty,
    questionType: 'bug-hunt',
    prompt: `Step 1: Click the faulty line of code in "${b.title}". Step 2: Select the correct patch to repair the spacecraft routine.`,
    contextStory: `Diagnostic alert in ${b.language} module. Locate the logic defect and deploy the verified patch.`,
    payload: b,
    correctAnswer: `${b.buggyLineIndex}:fix`,
    acceptedVariations: ['fix-sub', 'fix-lt', 'fix-acc', `${b.buggyLineIndex}:fix`],
    hints: [
      `Read each line carefully and trace what happens to the variables on each step.`,
      `Inspect Line ${b.buggyLineIndex + 1}: "${b.lines[b.buggyLineIndex].trim()}".`,
      b.explanation,
    ],
    explanation: b.explanation,
    basePoints: 190,
    estimatedSeconds: 35,
    prerequisites: ['Conditionals', 'Loops'],
  };
}

function generatePatternPlanetChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const sequences = [
    {
      name: 'Arithmetic Orbital Harmonic',
      items: [4, 11, 18, 25, 32],
      missingIndex: 5,
      answer: 39,
      ruleLabel: 'Add 7 each step (+7)',
      options: ['37', '39', '41', '46'],
    },
    {
      name: 'Fibonacci Star Spiral',
      items: [2, 3, 5, 8, 13, 21],
      missingIndex: 6,
      answer: 34,
      ruleLabel: 'Sum of previous two terms (13 + 21)',
      options: ['29', '32', '34', '36'],
    },
    {
      name: 'Geometric Doubling Cascade',
      items: [3, 6, 12, 24, 48],
      missingIndex: 5,
      answer: 96,
      ruleLabel: 'Multiply by 2 each step (×2)',
      options: ['72', '84', '96', '108'],
    },
    {
      name: 'Square Number Lattice',
      items: [1, 4, 9, 16, 25, 36],
      missingIndex: 6,
      answer: 49,
      ruleLabel: 'Perfect squares n² (7² = 49)',
      options: ['42', '45', '49', '64'],
    },
    {
      name: 'Triangular Star Cluster',
      items: [1, 3, 6, 10, 15],
      missingIndex: 5,
      answer: 21,
      ruleLabel: 'Add +2, +3, +4, +5, then +6 (15 + 6)',
      options: ['19', '20', '21', '24'],
    },
    {
      name: 'Cosmic Skip-Count Pulse',
      items: [9, 18, 27, 36, 45],
      missingIndex: 5,
      answer: 54,
      ruleLabel: 'Add 9 each step (+9)',
      options: ['52', '54', '56', '63'],
    },
    {
      name: 'Prime Gap Oscillator',
      items: [5, 10, 17, 26, 37],
      missingIndex: 5,
      answer: 50,
      ruleLabel: 'Add consecutive odd numbers (+5, +7, +9, +11, then +13)',
      options: ['48', '49', '50', '52'],
    },
    {
      name: 'Cube Resonance Harmonic',
      items: [1, 8, 27, 64],
      missingIndex: 4,
      answer: 125,
      ruleLabel: 'Perfect cubes n³ (5³ = 125)',
      options: ['100', '120', '125', '144'],
    },
  ];

  const seq = sequences[(seedIdx + difficulty - 1) % sequences.length];

  return {
    id: `pp-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'pattern-planet',
    gradeRange: [1, 12],
    curriculum,
    subject: 'mathematics',
    topic: 'Sequences, Patterns & Functions',
    subtopic: seq.name,
    skillId: 'math-sequences',
    skillName: 'Pattern Recognition & Sequence Prediction',
    difficulty,
    questionType: 'pattern-sequence',
    prompt: `Find the next number in the ${seq.name}:  ${seq.items.join('  →  ')}  →  [ ? ]`,
    contextStory: 'Predict the next harmonic coordinate to complete the orbital bridge.',
    payload: seq,
    correctAnswer: seq.answer,
    acceptedVariations: [String(seq.answer)],
    options: seq.options,
    hints: [
      `Calculate the difference or ratio between consecutive numbers: ${seq.items[1] - seq.items[0]}, ${seq.items[2] - seq.items[1]}, ...`,
      `Rule detected: ${seq.ruleLabel}.`,
    ],
    explanation: `Following the rule "${seq.ruleLabel}", the next term after ${seq.items[seq.items.length - 1]} is ${seq.answer}.`,
    basePoints: 150,
    estimatedSeconds: 25,
    prerequisites: ['Number patterns'],
  };
}

function generateProbabilityChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const scenarios = [
    {
      title: 'Quantum Spinner Sector Prediction',
      sectors: [
        { color: 'Cyan Plasma', count: 4, hex: '#06b6d4' },
        { color: 'Solar Gold', count: 3, hex: '#f59e0b' },
        { color: 'Coral Nova', count: 1, hex: '#f43f5e' },
      ],
      totalSectors: 8,
      targetSector: 'Cyan Plasma',
      correctNumerator: 4,
      correctDenominator: 8,
      simplified: '1/2 (50%)',
      options: ['1/8 (12.5%)', '3/8 (37.5%)', '4/8 = 1/2 (50%)', '7/8 (87.5%)'],
      correctOption: '4/8 = 1/2 (50%)',
    },
    {
      title: 'Asteroid Sample Core Draw',
      sectors: [
        { color: 'Cobalt Crystal', count: 3, hex: '#3b82f6' },
        { color: 'Emerald Ion', count: 5, hex: '#10b981' },
        { color: 'Violet Quartz', count: 2, hex: '#8b5cf6' },
      ],
      totalSectors: 10,
      targetSector: 'Cobalt Crystal',
      correctNumerator: 3,
      correctDenominator: 10,
      simplified: '3/10 (30%)',
      options: ['2/10 (20%)', '3/10 (30%)', '5/10 (50%)', '7/10 (70%)'],
      correctOption: '3/10 (30%)',
    },
    {
      title: 'Supernova Photon Detector',
      sectors: [
        { color: 'Solar Gold', count: 3, hex: '#f59e0b' },
        { color: 'Cyan Plasma', count: 6, hex: '#06b6d4' },
        { color: 'Coral Nova', count: 3, hex: '#f43f5e' },
      ],
      totalSectors: 12,
      targetSector: 'Solar Gold',
      correctNumerator: 3,
      correctDenominator: 12,
      simplified: '1/4 (25%)',
      options: ['1/6 (16.7%)', '3/12 = 1/4 (25%)', '6/12 = 1/2 (50%)', '9/12 = 3/4 (75%)'],
      correctOption: '3/12 = 1/4 (25%)',
    },
  ];

  const sc = scenarios[(seedIdx + difficulty - 1) % scenarios.length];

  return {
    id: `po-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'probability-observatory',
    gradeRange: [1, 12],
    curriculum,
    subject: 'mathematics',
    topic: 'Probability & Data Prediction',
    subtopic: sc.title,
    skillId: 'math-probability-model',
    skillName: 'Theoretical & Experimental Probability',
    difficulty,
    questionType: 'probability-sim',
    prompt: `Test the quantum wheel and calculate the theoretical probability of landing on "${sc.targetSector}" out of ${sc.totalSectors} equal sectors.`,
    contextStory: 'Run experimental spins to observe empirical frequency, then lock in the exact theoretical probability.',
    payload: sc,
    correctAnswer: sc.correctOption,
    acceptedVariations: [sc.correctOption, sc.simplified, `${sc.correctNumerator}/${sc.correctDenominator}`],
    options: sc.options,
    hints: [
      `Count how many sectors are "${sc.targetSector}" (${sc.correctNumerator}) and divide by the total sectors (${sc.totalSectors}).`,
      `${sc.correctNumerator} out of ${sc.totalSectors} equals ${sc.correctOption}.`,
    ],
    explanation: `There are ${sc.correctNumerator} "${sc.targetSector}" sectors out of ${sc.totalSectors} total, giving P = ${sc.correctOption}.`,
    basePoints: 165,
    estimatedSeconds: 30,
    prerequisites: ['Fractions', 'Data interpretation'],
  };
}

function generateMemoryChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const sequences = [
    [0, 4, 8, 5],
    [1, 3, 4, 7],
    [2, 4, 6, 3, 5],
    [0, 1, 4, 7, 8],
  ];
  const seq = sequences[(seedIdx + difficulty - 1) % sequences.length];

  return {
    id: `mc-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'memory-constellation',
    gradeRange: [1, 12],
    curriculum,
    subject: 'logic',
    topic: 'Spatial Working Recall & Pattern Reconstruction',
    subtopic: '3×3 Star Matrix Sequence',
    skillId: 'logic-spatial-memory',
    skillName: 'Spatial Sequence Reconstruction',
    difficulty,
    questionType: 'memory-grid',
    prompt: `Observe the ${seq.length}-star illumination order on the 3×3 sky matrix, then click the stars in the exact same sequence.`,
    contextStory: 'Optional short attention warm-up: trace the navigation beacon sequence.',
    payload: {
      gridSize: 3,
      sequence: seq,
    },
    correctAnswer: seq.join(','),
    acceptedVariations: [seq.join(',')],
    hints: [
      `Click "Replay Star Flash" to watch the ${seq.length}-star pattern again.`,
      `Star indices in order: ${seq.map((n) => `Star #${n + 1}`).join(' → ')}.`,
    ],
    explanation: `The constellation path connected ${seq.map((n) => `Star #${n + 1}`).join(' → ')}.`,
    basePoints: 150,
    estimatedSeconds: 25,
    prerequisites: ['Spatial awareness'],
  };
}

function generateBossChallenge(
  grade: GradeNumber,
  difficulty: number,
  curriculum: CurriculumId,
  seedIdx: number
): ChallengeItem {
  const bossVariants = [
    [
      {
        stageNumber: 1,
        domain: 'Mathematics Shield ⚡',
        question: 'Lock 1 (Math): Unlock the outer shield! What is (15 × 4) − 12?',
        options: ['44', '48', '52', '60'],
        correct: '48',
        hint: '15 × 4 = 60, and 60 - 12 = 48.',
      },
      {
        stageNumber: 2,
        domain: 'Pattern Conduit 🔮',
        question: 'Lock 2 (Patterns): Complete the harmonic key: 5, 10, 20, 40, [ ? ]',
        options: ['60', '70', '80', '100'],
        correct: '80',
        hint: 'Each number doubles (×2): 40 × 2 = 80.',
      },
      {
        stageNumber: 3,
        domain: 'Code Override 🤖',
        question: 'Lock 3 (Coding): What does `x = 10; if (x > 5) { x = x + 7; }` output for `x`?',
        options: ['10', '15', '17', '22'],
        correct: '17',
        hint: 'Since 10 > 5 is true, x becomes 10 + 7 = 17.',
      },
    ],
    [
      {
        stageNumber: 1,
        domain: 'Mathematics Shield ⚡',
        question: 'Lock 1 (Math): What is (12 × 6) + 18?',
        options: ['80', '86', '90', '94'],
        correct: '90',
        hint: '12 × 6 = 72, and 72 + 18 = 90.',
      },
      {
        stageNumber: 2,
        domain: 'Pattern Conduit 🔮',
        question: 'Lock 2 (Patterns): Decode the pulse: 3, 9, 27, [ ? ]',
        options: ['54', '72', '81', '90'],
        correct: '81',
        hint: 'Multiply each term by 3 (×3): 27 × 3 = 81.',
      },
      {
        stageNumber: 3,
        domain: 'Code Override 🤖',
        question: 'Lock 3 (Coding): What is `total` after `total = 2; for i in [3, 5]: total += i`?',
        options: ['7', '8', '10', '12'],
        correct: '10',
        hint: '2 + 3 + 5 = 10.',
      },
    ],
  ];

  const stages = bossVariants[seedIdx % bossVariants.length];

  return {
    id: `boss-${grade}-${difficulty}-${seedIdx}`,
    gameId: 'cosmic-boss-battle',
    gradeRange: [1, 12],
    curriculum,
    subject: 'mathematics',
    topic: 'Multi-Stage Synthesis Boss Challenge',
    subtopic: 'Quantum Vault Guardian',
    skillId: 'synthesis-boss-mastery',
    skillName: 'Cross-Domain Synthesis (Math + Code + Logic)',
    difficulty,
    questionType: 'boss-multistage',
    emoji: '👾',
    prompt: '👾 Crack all 3 Quantum Vault Locks (Math + Patterns + Code) to defeat the Boss!',
    contextStory: '🔥 Final synthesis stage: combine arithmetic precision, pattern recognition, and code execution!',
    payload: {
      stages,
    },
    correctAnswer: 'BOSS_CLEARED',
    acceptedVariations: ['BOSS_CLEARED', '48,80,17', '90,81,10'],
    hints: [
      stages[0].hint,
      stages[1].hint,
      stages[2].hint,
    ],
    explanation: 'All 3 synthesis locks solved! Quantum Vault Shield Breached!',
    basePoints: 300,
    estimatedSeconds: 60,
    prerequisites: ['Arithmetic', 'Patterns', 'Conditionals'],
  };
}
