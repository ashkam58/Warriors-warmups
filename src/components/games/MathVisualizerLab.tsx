import React, { useState, useEffect } from 'react';
import { ChallengeItem, GameId, GradeNumber } from '../../types/universe';
import { soundEngine } from '../../engine/soundEngine';
import { Emoji } from '../Emoji';
import { Eye, Sparkles, Sliders, Layers, CheckCircle2, Hand } from 'lucide-react';

interface MathVisualizerLabProps {
  challenge: ChallengeItem;
  gameId: GameId;
  grade: GradeNumber;
  practiceMode: 'challenge' | 'visual-lab' | 'blitz';
  currentInput?: string;
  onSelectAnswer?: (val: string, autoSubmit?: boolean) => void;
}

export const MathVisualizerLab: React.FC<MathVisualizerLabProps> = ({
  challenge,
  gameId,
  practiceMode,
  currentInput = '',
  onSelectAnswer,
}) => {
  const [visualLens, setVisualLens] = useState<'primary' | 'secondary' | 'steps'>('primary');
  const [sandboxTestVal, setSandboxTestVal] = useState<number>(3);
  const [showDecomposition, setShowDecomposition] = useState<boolean>(true);
  const [proofStep, setProofStep] = useState<number>(1);
  const [interactivePct, setInteractivePct] = useState<number>(20);
  const [interactiveLanding, setInteractiveLanding] = useState<number | null>(null);

  const payload = challenge.payload || {};
  const mode = payload.mode || 'standard';

  // Reset interactive states when challenge changes
  useEffect(() => {
    setProofStep(1);
    setInteractiveLanding(null);
    if (payload.mode === 'algebra') {
      setSandboxTestVal(2);
    } else if (payload.mode === 'percent') {
      setInteractivePct(payload.pct || 25);
    } else if (payload.mode === 'quadratic') {
      setSandboxTestVal(2);
    }
  }, [challenge.id, payload.mode, payload.pct]);

  // Synchronize keypad input into the visual model in real time!
  useEffect(() => {
    const parsed = Number(currentInput);
    if (!currentInput || Number.isNaN(parsed)) return;
    if (mode === 'algebra' && parsed >= 1 && parsed <= 20) {
      setSandboxTestVal(parsed);
    } else if (mode === 'quadratic' && parsed >= 1 && parsed <= 15) {
      setSandboxTestVal(parsed);
    } else if (mode === 'standard' && (payload.operator === '+' || payload.operator === '-')) {
      setInteractiveLanding(parsed);
    }
  }, [currentInput, mode, payload.operator]);

  const triggerInteractiveSelection = (val: string | number, autoSubmit: boolean = false) => {
    soundEngine.playClick();
    if (onSelectAnswer) {
      onSelectAnswer(String(val), autoSubmit);
    }
  };

  // Render dedicated interactive mathematical visualizers for Reactor Rush & Math challenges
  const renderReactorMathVisualizer = () => {
    // 1. ADDITION OR SUBTRACTION: Interactive Click-to-Land Number Line & Ten-Frame Counters
    if (mode === 'standard' && (payload.operator === '+' || payload.operator === '-')) {
      const a: number = payload.operandA || 8;
      const b: number = payload.operandB || 5;
      const isAdd = payload.operator === '+';
      const result = isAdd ? a + b : a - b;
      const activeTarget = interactiveLanding ?? result;
      const maxTick = Math.max(20, result + 4, a + 4);
      const minTick = Math.min(0, result - 2);
      const span = Math.max(10, maxTick - minTick);

      const xForVal = (v: number) => 40 + ((v - minTick) / span) * 520;
      const startX = xForVal(a);
      const endX = xForVal(activeTarget);
      const midX = (startX + endX) / 2;

      return (
        <div className="space-y-3">
          {visualLens === 'primary' ? (
            <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-extrabold uppercase text-[#00E5FF] flex items-center gap-1.5">
                  <Hand className="w-4 h-4 text-[#FFD600]" />
                  <span>Tap Any Number on the Line to Land Your Jump!</span>
                </span>
                <span className="text-xs sm:text-sm font-mono font-extrabold text-[#FFD600] tabular-nums">
                  Start {a} {isAdd ? `+ ${b}` : `− ${b}`} →{' '}
                  {interactiveLanding !== null ? `Selected: ${interactiveLanding}` : 'Tap Tick!'}
                </span>
              </div>

              <svg
                viewBox="0 0 600 145"
                className="w-full h-36 sm:h-40 select-none overflow-visible"
                aria-label="Interactive Number Line Jump Diagram"
              >
                {/* Base Axis Line */}
                <line
                  x1="30"
                  y1="98"
                  x2="570"
                  y2="98"
                  stroke="#FFFDF7"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Parabolic Jump Arc */}
                <path
                  d={`M ${startX} 90 Q ${midX} 16 ${endX} 90`}
                  fill="none"
                  stroke={activeTarget === result ? '#00E676' : '#FF2A85'}
                  strokeWidth="4.5"
                  strokeDasharray="8 4"
                />

                {/* Jump Badge */}
                <rect
                  x={midX - 44}
                  y="10"
                  width="88"
                  height="28"
                  rx="8"
                  fill="#FFD600"
                  stroke="#0B0719"
                  strokeWidth="3"
                />
                <text
                  x={midX}
                  y="29"
                  textAnchor="middle"
                  fill="#0B0719"
                  className="text-[13px] font-mono font-extrabold"
                >
                  {isAdd ? `Jump +${b}` : `Jump −${b}`}
                </text>

                {/* Interactive Clickable Tick Marks */}
                {Array.from({ length: span + 1 }).map((_, idx) => {
                  const val = minTick + idx;
                  if (span > 24 && val % 2 !== 0 && val !== a && val !== result && val !== activeTarget)
                    return null;
                  const tx = xForVal(val);
                  const isStart = val === a;
                  const isSelected = val === interactiveLanding;
                  const isCorrectLanding = val === result;
                  return (
                    <g
                      key={val}
                      className="cursor-pointer group"
                      onClick={() => {
                        setInteractiveLanding(val);
                        triggerInteractiveSelection(val, false);
                      }}
                    >
                      <circle
                        cx={tx}
                        cy="98"
                        r={isStart || isSelected || isCorrectLanding ? 11 : 7}
                        fill={
                          isSelected
                            ? '#00E676'
                            : isStart
                            ? '#00E5FF'
                            : isCorrectLanding && practiceMode === 'visual-lab'
                            ? '#FFD600'
                            : '#21124C'
                        }
                        stroke="#0B0719"
                        strokeWidth="2.5"
                      />
                      <text
                        x={tx}
                        y="130"
                        textAnchor="middle"
                        fill={
                          isSelected
                            ? '#00E676'
                            : isStart
                            ? '#00E5FF'
                            : '#FFFDF7'
                        }
                        className="text-[12px] font-mono font-extrabold"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {interactiveLanding !== null && (
                <div className="flex items-center justify-between gap-2 bg-[#21124C] p-2.5 rounded-xl border-2 border-[#0B0719]">
                  <span className="text-xs sm:text-sm font-mono font-extrabold text-white">
                    You landed on <strong className="text-[#00E676]">{interactiveLanding}</strong>{' '}
                    (Jump from {a} by {interactiveLanding - a >= 0 ? `+${interactiveLanding - a}` : interactiveLanding - a})
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerInteractiveSelection(interactiveLanding, true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#00E676] text-[#0B0719] comic-btn text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lock In {interactiveLanding}!</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
              <div className="text-xs sm:text-sm font-extrabold uppercase text-[#FFD600] flex items-center justify-between">
                <span>Interactive Ten-Frame & Plasma Block Grouping (Tap to Count!)</span>
                <button
                  type="button"
                  onClick={() => triggerInteractiveSelection(result, false)}
                  className="px-3 py-1 rounded-lg bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] font-mono text-xs font-extrabold cursor-pointer"
                >
                  Send Total ({result}) to Keypad
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-center bg-[#21124C] p-3.5 rounded-xl border-2 border-[#0B0719]">
                {Array.from({ length: a }).map((_, idx) => {
                  const crossedOut = !isAdd && idx >= a - b;
                  return (
                    <button
                      key={`a-${idx}`}
                      type="button"
                      onClick={() => triggerInteractiveSelection(idx + 1, false)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 border-[#0B0719] flex items-center justify-center font-mono text-xs font-extrabold cursor-pointer transition-transform hover:scale-105 ${
                        crossedOut
                          ? 'bg-rose-500/40 text-white line-through opacity-50'
                          : 'bg-[#00E5FF] text-[#0B0719] shadow-[2px_2px_0px_#0B0719]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
                {isAdd &&
                  Array.from({ length: b }).map((_, idx) => (
                    <button
                      key={`b-${idx}`}
                      type="button"
                      onClick={() => triggerInteractiveSelection(a + idx + 1, false)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] shadow-[2px_2px_0px_#0B0719] flex items-center justify-center font-mono text-xs font-extrabold cursor-pointer transition-transform hover:scale-105"
                    >
                      {a + idx + 1}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. MISSING ADDEND / PART-PART-WHOLE BAR MODEL WITH SLIDER
    if (mode === 'missing') {
      const part: number = payload.operandA || 6;
      const target: number = payload.target || 15;
      const missing = target - part;
      const pctPart = Math.round((part / target) * 100);
      const pctMissing = 100 - pctPart;

      return (
        <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-extrabold text-[#FFD600] uppercase">
            <span>Singapore Bar Model · Tap the Yellow Bar to Fill Answer!</span>
            <span className="font-mono text-[#00E5FF]">Whole Total = {target}</span>
          </div>

          {/* Whole Bar */}
          <div className="w-full h-11 rounded-xl bg-[#00E676] border-[3px] border-[#0B0719] flex items-center justify-center font-mono text-base sm:text-lg font-extrabold text-[#0B0719] shadow-[3px_3px_0px_#0B0719]">
            WHOLE TOTAL = {target} UNITS
          </div>

          {/* Split Part Bars */}
          <div className="flex w-full h-12 rounded-xl overflow-hidden border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719]">
            <div
              style={{ width: `${pctPart}%` }}
              className="bg-[#00E5FF] text-[#0B0719] flex items-center justify-center font-mono text-sm sm:text-base font-extrabold border-r-[3px] border-[#0B0719]"
            >
              Known: {part}
            </div>
            <button
              type="button"
              style={{ width: `${pctMissing}%` }}
              onClick={() => triggerInteractiveSelection(missing, false)}
              className="bg-[#FFD600] hover:bg-[#FFEA00] text-[#0B0719] flex items-center justify-center font-mono text-sm sm:text-base font-extrabold cursor-pointer"
            >
              Tap to Fill Missing: {missing} ({target} − {part})
            </button>
          </div>
        </div>
      );
    }

    // 3. MULTIPLICATION: Interactive Area Array & Distributive Split Visualizer
    if (mode === 'standard' && payload.operator === '×') {
      const rows: number = payload.operandA || 6;
      const cols: number = payload.operandB || 7;
      const splitCol = Math.floor(cols / 2);
      const remCol = cols - splitCol;
      const totalProduct = rows * cols;

      return (
        <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-extrabold uppercase text-[#00E5FF] flex items-center gap-1.5">
              <Emoji char="🟦" size={18} />
              <span>
                {rows} × {cols} Area Array Matrix (Tap Partial Sums to Fill!)
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowDecomposition((d) => !d);
              }}
              className="px-3 py-1 rounded-lg bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] text-xs font-extrabold cursor-pointer"
            >
              {showDecomposition ? 'Hide Distributive Split' : 'Show Distributive Split'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div
              className="grid gap-1.5 bg-[#0B0719] p-3 rounded-xl border-2 border-white/20"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: rows * cols }).map((_, idx) => {
                const c = idx % cols;
                const isFirstPart = showDecomposition && c < splitCol;
                return (
                  <div
                    key={idx}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border border-[#0B0719] ${
                      isFirstPart ? 'bg-[#00E5FF]' : 'bg-[#FFD600]'
                    }`}
                  />
                );
              })}
            </div>

            {showDecomposition && (
              <div className="space-y-2 text-xs sm:text-sm font-mono font-extrabold text-white bg-[#21124C] p-3.5 rounded-xl border-2 border-[#0B0719]">
                <div className="text-[#FFD600] uppercase">Distributive Law Breakdown:</div>
                <div className="text-[#00E5FF]">
                  Cyan Part: {rows} × {splitCol} = {rows * splitCol}
                </div>
                <div className="text-[#FFD600]">
                  Gold Part: {rows} × {remCol} = {rows * remCol}
                </div>
                <button
                  type="button"
                  onClick={() => triggerInteractiveSelection(totalProduct, false)}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] font-extrabold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>
                    Use Sum: {rows * splitCol} + {rows * remCol} = {totalProduct}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 4. MIXED OPERATIONS (BODMAS): Equal Partition Buckets + Bonus Bar
    if (mode === 'mixed') {
      const dividend: number = payload.dividend || 24;
      const divisor: number = payload.divisor || 4;
      const bonus: number = payload.bonus || 7;
      const perBucket = dividend / divisor;
      const totalAns = perBucket + bonus;

      return (
        <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-extrabold uppercase text-[#00E5FF]">
            <span>Step 1: Split {dividend} MW equally into {divisor} Conduits</span>
            <span className="text-[#FFD600] font-mono">+ {bonus} MW Reserve</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: Math.min(8, divisor) }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => triggerInteractiveSelection(perBucket, false)}
                className={`p-2.5 rounded-xl border-2 border-[#0B0719] text-center font-mono cursor-pointer ${
                  idx === 0
                    ? 'bg-[#00E5FF] text-[#0B0719] shadow-[3px_3px_0px_#FFD600]'
                    : 'bg-[#21124C] text-white hover:bg-[#2E1A68]'
                }`}
              >
                <div className="text-[10px] font-bold uppercase opacity-80">
                  Conduit #{idx + 1}
                </div>
                <div className="text-base sm:text-lg font-extrabold tabular-nums">
                  {perBucket} MW
                </div>
              </button>
            ))}
          </div>

          <div className="bg-[#21124C] border-2 border-[#0B0719] rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs sm:text-sm font-extrabold text-white">
            <span>
              1 Conduit ({dividend} ÷ {divisor} = <strong className="text-[#00E5FF]">{perBucket}</strong>)
              + Reserve (<strong className="text-[#FFD600]">+{bonus}</strong>)
            </span>
            <button
              type="button"
              onClick={() => triggerInteractiveSelection(totalAns, false)}
              className="px-3 py-1 rounded-lg bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] font-extrabold cursor-pointer"
            >
              Use {perBucket} + {bonus} = {totalAns}!
            </button>
          </div>
        </div>
      );
    }

    // 5. LINEAR ALGEBRA EQUATION: Interactive Balance Scale & Variable Tester (Solve by Balancing!)
    if (mode === 'algebra') {
      const coeff: number = payload.coeff || 3;
      const constant: number = payload.constant || 6;
      const rhs: number = payload.rhs || 21;
      const lhsWithTest = coeff * sandboxTestVal + constant;
      const isBalanced = lhsWithTest === rhs;
      const tiltDeg = Math.max(-14, Math.min(14, (rhs - lhsWithTest) * 0.6));

      return (
        <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-extrabold uppercase text-[#00E5FF] flex items-center gap-1.5">
              <Emoji char="⚖️" size={18} />
              <span>Interactive Algebra Balance Scale (Slide x Until Level!)</span>
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-lg font-mono text-xs font-extrabold border-2 border-[#0B0719] ${
                isBalanced ? 'bg-[#00E676] text-[#0B0719]' : 'bg-[#FF2A85] text-white'
              }`}
            >
              {isBalanced
                ? `⚖️ EQUATION BALANCED! x = ${sandboxTestVal}`
                : `Test x = ${sandboxTestVal}: Left (${lhsWithTest}) ≠ Right (${rhs})`}
            </span>
          </div>

          <svg
            viewBox="0 0 520 140"
            className="w-full h-32 sm:h-36 select-none"
            aria-label="Algebra Equation Balance Beam"
          >
            {/* Fulcrum Base */}
            <polygon
              points="260,78 232,130 288,130"
              fill="#FFD600"
              stroke="#0B0719"
              strokeWidth="3.5"
            />
            {/* Tilting Beam Group */}
            <g transform={`rotate(${tiltDeg} 260 78)`}>
              <line
                x1="70"
                y1="78"
                x2="450"
                y2="78"
                stroke="#FFFDF7"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Left Pan: coeff * x + constant */}
              <rect
                x="45"
                y="32"
                width="165"
                height="42"
                rx="10"
                fill="#00E5FF"
                stroke="#0B0719"
                strokeWidth="3.5"
              />
              <text
                x="127"
                y="58"
                textAnchor="middle"
                fill="#0B0719"
                className="text-[15px] font-mono font-extrabold"
              >
                {coeff}({sandboxTestVal}) + {constant} = {lhsWithTest}
              </text>

              {/* Right Pan: rhs */}
              <rect
                x="310"
                y="32"
                width="165"
                height="42"
                rx="10"
                fill={isBalanced ? '#00E676' : '#FF2A85'}
                stroke="#0B0719"
                strokeWidth="3.5"
              />
              <text
                x="392"
                y="58"
                textAnchor="middle"
                fill={isBalanced ? '#0B0719' : '#FFFDF7'}
                className="text-[15px] font-mono font-extrabold"
              >
                Target = {rhs}
              </text>
            </g>
          </svg>

          {/* Interactive x-Value Slider + Quick Step Buttons (-1 / +1) + Direct Solve Button */}
          <div className="bg-[#21124C] border-2 border-[#0B0719] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, sandboxTestVal - 1);
                  setSandboxTestVal(next);
                  triggerInteractiveSelection(next, false);
                }}
                className="w-8 h-8 rounded-lg bg-[#FFFDF7] text-[#0B0719] font-mono font-extrabold border-2 border-[#0B0719] cursor-pointer"
              >
                −
              </button>
              <input
                id="algebra-x-slider"
                aria-label="Test Variable X Slider"
                type="range"
                min={1}
                max={16}
                value={sandboxTestVal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSandboxTestVal(v);
                  triggerInteractiveSelection(v, false);
                }}
                className="w-full accent-[#00E676] cursor-pointer h-3"
              />
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(16, sandboxTestVal + 1);
                  setSandboxTestVal(next);
                  triggerInteractiveSelection(next, false);
                }}
                className="w-8 h-8 rounded-lg bg-[#FFFDF7] text-[#0B0719] font-mono font-extrabold border-2 border-[#0B0719] cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              type="button"
              data-testid="visual-solve-button"
              onClick={() => triggerInteractiveSelection(sandboxTestVal, true)}
              className={`px-3.5 py-2 rounded-xl comic-btn text-xs sm:text-sm font-mono font-extrabold flex items-center gap-1.5 cursor-pointer ${
                isBalanced
                  ? 'bg-[#00E676] text-[#0B0719]'
                  : 'bg-[#FFD600] text-[#0B0719]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isBalanced
                  ? `Submit Balanced x = ${sandboxTestVal}!`
                  : `Try x = ${sandboxTestVal}`}
              </span>
            </button>
          </div>
        </div>
      );
    }

    // 6. PERCENTAGE: Interactive 10×10 Hundred-Grid & Clickable 10% Strip Blocks
    if (mode === 'percent') {
      const targetPct: number = payload.pct || 25;
      const base: number = payload.base || 80;
      const currentVal = (base * interactivePct) / 100;

      return (
        <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-extrabold uppercase text-[#00E5FF]">
            <span>Interactive 10×10 Percentage Grid (Tap % Presets to Partition!)</span>
            <span className="text-[#FFD600] font-mono">
              {interactivePct}% of {base} = {currentVal} MW
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <div className="grid grid-cols-10 gap-1 bg-[#0B0719] p-2.5 rounded-xl border-2 border-white/20">
              {Array.from({ length: 100 }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const nextPct = idx + 1;
                    setInteractivePct(nextPct);
                    const computed = (base * nextPct) / 100;
                    if (Number.isInteger(computed)) {
                      triggerInteractiveSelection(computed, false);
                    }
                  }}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] cursor-pointer ${
                    idx < interactivePct ? 'bg-[#00E676]' : 'bg-[#21124C]'
                  }`}
                />
              ))}
            </div>

            <div className="flex-1 w-full space-y-2.5 font-mono text-xs sm:text-sm font-extrabold text-white">
              <div className="bg-[#21124C] p-3 rounded-xl border-2 border-[#0B0719] space-y-2">
                <div className="text-[#FFD600]">Tap a Benchmark Percentage to Inspect:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 20, 25, 50, 75, 100].map((p) => {
                    const val = (base * p) / 100;
                    const isTarget = p === targetPct;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setInteractivePct(p);
                          triggerInteractiveSelection(val, false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border-2 border-[#0B0719] text-xs font-extrabold cursor-pointer ${
                          interactivePct === p
                            ? 'bg-[#00E676] text-[#0B0719]'
                            : isTarget
                            ? 'bg-[#FFD600] text-[#0B0719]'
                            : 'bg-white text-[#0B0719]'
                        }`}
                      >
                        {p}% = {val}
                      </button>
                    );
                  })}
                </div>

                <div className="w-full h-5 bg-[#0B0719] rounded-lg overflow-hidden border-2 border-white/30">
                  <div
                    className="h-full bg-[#00E676] transition-all duration-200"
                    style={{ width: `${interactivePct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">
                    10% block = {base / 10} MW
                  </span>
                  <button
                    type="button"
                    data-testid="visual-solve-button"
                    onClick={() => triggerInteractiveSelection(currentVal, true)}
                    className="px-3 py-1 rounded-lg bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] text-xs font-extrabold cursor-pointer"
                  >
                    Submit {currentVal} MW!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 7. QUADRATICS & MATRICES (Grades 9-12): Interactive SVG Parabola & 2D Determinant Parallelogram
    if (mode === 'quadratic' || mode === 'matrix') {
      if (mode === 'quadratic') {
        const offset: number = payload.offset || 10;
        const rhs: number = payload.rhs || 35;
        const testSq = sandboxTestVal * sandboxTestVal;
        const totalWithTest = testSq + offset;
        const isMatched = totalWithTest === rhs;
        const maxCurveY = Math.max(rhs + 25, 144 + offset);

        const toSvgX = (xVal: number) => 30 + (xVal / 12) * 210;
        const toSvgY = (yVal: number) => 115 - Math.min(100, (yVal / maxCurveY) * 95);

        const curvePoints = Array.from({ length: 25 })
          .map((_, i) => {
            const xv = i * 0.5;
            const yv = xv * xv + offset;
            return `${toSvgX(xv)},${toSvgY(yv)}`;
          })
          .join(' ');

        return (
          <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              {/* Interactive SVG Parabola Curve y = x^2 + offset */}
              <svg
                viewBox="0 0 260 135"
                className="w-full h-32 bg-[#0B0719] rounded-xl border-2 border-[#00E5FF]/40 select-none"
              >
                {/* Target Horizontal Line y = rhs */}
                <line
                  x1="25"
                  y1={toSvgY(rhs)}
                  x2="245"
                  y2={toSvgY(rhs)}
                  stroke="#FFD600"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <text
                  x="242"
                  y={Math.max(14, toSvgY(rhs) - 5)}
                  textAnchor="end"
                  fill="#FFD600"
                  className="text-[9px] font-mono font-extrabold"
                >
                  Target y = {rhs}
                </text>

                {/* Parabola Curve */}
                <polyline
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="3"
                  points={curvePoints}
                />

                {/* Active Point on Parabola */}
                <circle
                  cx={toSvgX(sandboxTestVal)}
                  cy={toSvgY(totalWithTest)}
                  r="6"
                  fill={isMatched ? '#00E676' : '#FF2A85'}
                  stroke="#FFFDF7"
                  strokeWidth="2"
                />
                <text
                  x={Math.min(215, Math.max(45, toSvgX(sandboxTestVal)))}
                  y={Math.max(15, toSvgY(totalWithTest) - 9)}
                  textAnchor="middle"
                  fill="#FFFDF7"
                  className="text-[10px] font-mono font-extrabold"
                >
                  ({sandboxTestVal}, {totalWithTest})
                </text>
              </svg>

              {/* Geometric Square Area x^2 + Offset */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-xl bg-[#00E5FF] border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#FFD600] flex flex-col items-center justify-center text-[#0B0719] font-mono font-extrabold">
                  <span className="text-xs uppercase">x = {sandboxTestVal}</span>
                  <span className="text-lg">x² = {testSq}</span>
                </div>
                <div className="text-xl font-mono font-extrabold text-white">+ {offset} =</div>
                <div
                  className={`px-3.5 py-2.5 rounded-xl border-[3px] border-[#0B0719] font-mono font-extrabold text-base ${
                    isMatched ? 'bg-[#00E676] text-[#0B0719]' : 'bg-[#FF2A85] text-white'
                  }`}
                >
                  {totalWithTest}
                </div>
              </div>
            </div>

            <div className="bg-[#21124C] p-3 rounded-xl border-2 border-[#0B0719] flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono font-extrabold text-[#FFD600]">
                Slide Root x = {sandboxTestVal}:
              </span>
              <input
                type="range"
                min={1}
                max={12}
                value={sandboxTestVal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSandboxTestVal(v);
                  triggerInteractiveSelection(v, false);
                }}
                className="flex-1 accent-[#00E676] cursor-pointer"
              />
              <button
                type="button"
                data-testid="visual-solve-button"
                onClick={() => triggerInteractiveSelection(sandboxTestVal, true)}
                className={`px-3.5 py-1.5 rounded-xl comic-btn text-xs font-mono font-extrabold cursor-pointer ${
                  isMatched ? 'bg-[#00E676] text-[#0B0719]' : 'bg-[#FFD600] text-[#0B0719]'
                }`}
              >
                {isMatched ? `⚡ Root Found! Submit x = ${sandboxTestVal}` : `Try x = ${sandboxTestVal}`}
              </button>
            </div>
          </div>
        );
      }

      const mat: number[][] = payload.matrix || [
        [3, 1],
        [2, 4],
      ];
      const a = mat[0][0];
      const b = mat[0][1];
      const c = mat[1][0];
      const d = mat[1][1];
      const ad = a * d;
      const bc = b * c;
      const det = ad - bc;
      const scale = 11;
      const ox = 25;
      const oy = 110;
      const p1x = ox + a * scale;
      const p1y = oy - c * scale;
      const p2x = ox + b * scale;
      const p2y = oy - d * scale;
      const p3x = ox + (a + b) * scale;
      const p3y = oy - (c + d) * scale;

      return (
        <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <svg
            viewBox="0 0 220 130"
            className="w-full h-32 bg-[#0B0719] rounded-xl border-2 border-[#00E5FF]/40 select-none"
          >
            <polygon
              points={`${ox},${oy} ${p1x},${p1y} ${p3x},${p3y} ${p2x},${p2y}`}
              fill="rgba(0, 230, 118, 0.28)"
              stroke="#00E676"
              strokeWidth="2.5"
            />
            <line x1={ox} y1={oy} x2={p1x} y2={p1y} stroke="#00E5FF" strokeWidth="3" />
            <line x1={ox} y1={oy} x2={p2x} y2={p2y} stroke="#FF2A85" strokeWidth="3" />
            <text x="115" y="22" fill="#FFD600" className="text-[10px] font-mono font-extrabold">
              Area Scale = |ad − bc| = {Math.abs(det)}
            </text>
          </svg>

          <div className="space-y-2 font-mono text-xs sm:text-sm font-extrabold text-white">
            <div className="text-[#FFD600] uppercase">2D Jacobian Area (ad − bc):</div>
            <div className="text-[#00E676]">
              Main Diagonal (a×d): {a} × {d} = {ad}
            </div>
            <div className="text-[#FF2A85]">
              Anti-Diagonal (b×c): {b} × {c} = {bc}
            </div>
            <button
              type="button"
              data-testid="visual-solve-button"
              onClick={() => triggerInteractiveSelection(det, true)}
              className="mt-1 px-3.5 py-2 rounded-xl bg-[#00E676] text-[#0B0719] comic-btn text-xs font-extrabold cursor-pointer"
            >
              ⚡ Lock In {ad} − {bc} = {det}!
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render Pattern Planet Visual Difference Bridge & Interactive Candidate Tester
  const renderPatternPlanetVisualizer = () => {
    const items: number[] = payload.items || [4, 11, 18, 25, 32];
    const options: string[] = challenge.options || [];
    const maxVal = Math.max(...items, Number(challenge.correctAnswer) || 50);

    return (
      <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-extrabold uppercase text-[#00E5FF] flex items-center gap-1.5">
            <Emoji char="📊" size={18} />
            <span>Interactive Growth Staircase (Tap a Bar to Test!)</span>
          </span>
          <span className="text-xs font-mono font-extrabold text-[#FFD600]">
            Rule: {payload.ruleLabel || 'Observe the step difference!'}
          </span>
        </div>

        {/* Jump Deltas & Bars Row */}
        <div className="flex items-end justify-center gap-2 sm:gap-3 pt-2">
          {items.map((num, idx) => {
            const hPct = Math.max(22, Math.round((num / maxVal) * 95));
            const delta = idx > 0 ? num - items[idx - 1] : null;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                {delta !== null && (
                  <span className="px-2 py-0.5 rounded-md bg-[#FFD600] text-[#0B0719] font-mono text-[11px] font-extrabold border border-[#0B0719]">
                    +{delta}
                  </span>
                )}
                <div
                  style={{ height: `${hPct}px` }}
                  className="w-10 sm:w-12 rounded-t-xl bg-[#00E5FF] border-2 border-[#0B0719] flex items-center justify-center font-mono text-xs sm:text-sm font-extrabold text-[#0B0719]"
                >
                  {num}
                </div>
                <span className="text-[10px] font-mono text-slate-300 font-bold">
                  T{idx + 1}
                </span>
              </div>
            );
          })}
          <div className="flex flex-col items-center gap-1">
            <span className="px-2 py-0.5 rounded-md bg-[#00E676] text-[#0B0719] font-mono text-[11px] font-extrabold border border-[#0B0719]">
              Next
            </span>
            <div
              style={{
                height: `${Math.max(
                  28,
                  Math.min(105, Math.round(((Number(currentInput) || maxVal) / maxVal) * 95))
                )}px`,
              }}
              className="w-12 sm:w-14 rounded-t-xl bg-[#FFD600] border-2 border-dashed border-white flex items-center justify-center font-mono text-sm sm:text-base font-extrabold text-[#0B0719] transition-all"
            >
              {currentInput || (practiceMode === 'visual-lab' ? challenge.correctAnswer : '?')}
            </div>
            <span className="text-[10px] font-mono text-[#FFD600] font-bold">
              T{items.length + 1}
            </span>
          </div>
        </div>

        {/* Interactive Candidate Bar Tester directly inside the visualizer */}
        {options.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/15">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-300 mr-1">
                Preview Next Bar:
              </span>
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => triggerInteractiveSelection(opt, false)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-extrabold border-2 border-[#0B0719] cursor-pointer ${
                    currentInput === opt
                      ? 'bg-[#FFD600] text-[#0B0719]'
                      : 'bg-[#21124C] text-white hover:bg-[#311B6E]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {currentInput && (
              <button
                type="button"
                data-testid="visual-solve-button"
                onClick={() => triggerInteractiveSelection(currentInput, true)}
                className="px-3.5 py-1 rounded-xl bg-[#00E676] text-[#0B0719] border-2 border-[#0B0719] font-comic tracking-wider text-sm cursor-pointer"
              >
                ⚡ Lock In {currentInput}!
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Step-by-Step Visual Proof Drawer (Available on ALL 10 games!)
  const renderStepByStepVisualProof = () => {
    const allSteps = [
      ...challenge.hints,
      `Final Verification: ${challenge.explanation}`,
    ];
    return (
      <div className="bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-extrabold uppercase text-[#FFD600] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#00E5FF]" />
            <span>
              Interactive Step-by-Step Visual Proof ({proofStep} / {allSteps.length})
            </span>
          </span>
          <div className="flex items-center gap-1.5">
            {allSteps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setProofStep(idx + 1);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-extrabold border-2 border-[#0B0719] cursor-pointer ${
                  proofStep >= idx + 1
                    ? 'bg-[#00E676] text-[#0B0719]'
                    : 'bg-[#21124C] text-white'
                }`}
              >
                Step {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {allSteps.slice(0, proofStep).map((st, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border-2 border-[#0B0719] font-bold text-sm sm:text-base flex items-start gap-2.5 ${
                i === allSteps.length - 1
                  ? 'bg-[#FFD600] text-[#0B0719]'
                  : 'bg-[#FFFDF7] text-[#0B0719]'
              }`}
            >
              <span className="px-2 py-0.5 rounded bg-[#0B0719] text-[#FFD600] font-mono text-xs font-extrabold shrink-0">
                #{i + 1}
              </span>
              <span>{st}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      data-testid="math-visualizer-lab"
      className="my-2 space-y-2.5"
    >
      {/* Visualizer Mode Switcher Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#21124C] border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] rounded-xl px-3 py-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-comic tracking-wider text-[#00E5FF] uppercase">
          <Eye className="w-4 h-4 text-[#FFD600] shrink-0" />
          <span>INTERACTIVE MATH VISUALIZATION LAB</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setVisualLens('primary');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border-2 border-[#0B0719] flex items-center gap-1 cursor-pointer ${
              visualLens === 'primary'
                ? 'bg-[#FFD600] text-[#0B0719]'
                : 'bg-[#160B30] text-white hover:bg-[#2E1A68]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Model</span>
          </button>

          {gameId === 'reactor-rush' &&
            payload.mode === 'standard' &&
            (payload.operator === '+' || payload.operator === '-') && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setVisualLens('secondary');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border-2 border-[#0B0719] flex items-center gap-1 cursor-pointer ${
                  visualLens === 'secondary'
                    ? 'bg-[#FFD600] text-[#0B0719]'
                    : 'bg-[#160B30] text-white hover:bg-[#2E1A68]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ten-Frame Blocks</span>
              </button>
            )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setVisualLens('steps');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border-2 border-[#0B0719] flex items-center gap-1 cursor-pointer ${
              visualLens === 'steps'
                ? 'bg-[#00E676] text-[#0B0719]'
                : 'bg-[#160B30] text-white hover:bg-[#2E1A68]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visual Step Proof</span>
          </button>
        </div>
      </div>

      {/* Active Visual Diagram */}
      {visualLens === 'steps' ? (
        renderStepByStepVisualProof()
      ) : gameId === 'reactor-rush' ? (
        renderReactorMathVisualizer()
      ) : gameId === 'pattern-planet' ? (
        renderPatternPlanetVisualizer()
      ) : (
        renderStepByStepVisualProof()
      )}
    </div>
  );
};
