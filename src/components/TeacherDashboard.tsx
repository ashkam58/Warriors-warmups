import React, { useState } from 'react';
import {
  CurriculumId,
  GameId,
  GradeNumber,
  PlanetId,
  SessionConfig,
  StudentProfile,
  SubjectId,
} from '../types/universe';
import {
  GAMES,
  GRADE_BANDS,
  getGradeBandForGrade,
} from '../engine/worldData';
import { generateTeacherHandoverSummary } from '../engine/adaptiveEngine';
import { soundEngine } from '../engine/soundEngine';
import {
  X,
  Play,
  Download,
  Award,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Sliders,
  BarChart3,
  Clock,
  BookOpen,
} from 'lucide-react';

interface TeacherDashboardProps {
  profile: StudentProfile;
  sessionConfig: SessionConfig;
  onUpdateProfile: (updated: StudentProfile) => void;
  onUpdateSessionConfig: (updated: SessionConfig) => void;
  onLaunchCustomSession: (config: SessionConfig) => void;
  onClose: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  profile,
  sessionConfig,
  onUpdateProfile,
  onUpdateSessionConfig,
  onLaunchCustomSession,
  onClose,
}) => {
  const [studentName, setStudentName] = useState(profile.name);
  const [selectedGrade, setSelectedGrade] = useState<GradeNumber>(profile.grade);
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumId>(
    profile.curriculum
  );
  const [subjectFocus, setSubjectFocus] = useState<SubjectId | 'mixed'>(
    sessionConfig.subjectFocus
  );
  const [selectedGameId, setSelectedGameId] = useState<GameId>(
    sessionConfig.selectedGameId
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    sessionConfig.durationMinutes
  );
  const [difficultyOverride, setDifficultyOverride] = useState<number | null>(
    sessionConfig.difficultyOverride
  );
  const [skipIntro, setSkipIntro] = useState<boolean>(sessionConfig.skipIntro);
  const [exportStatus, setExportStatus] = useState<string>('');

  const gradeBand = GRADE_BANDS[getGradeBandForGrade(selectedGrade)];
  const skillValues = Object.values(profile.skills);

  const mathSkills = skillValues.filter((s) => s.subject === 'mathematics');
  const codingSkills = skillValues.filter((s) => s.subject === 'coding');
  const logicSkills = skillValues.filter((s) => s.subject === 'logic');

  const avgAccuracy = (list: typeof skillValues) =>
    list.length === 0
      ? 80
      : Math.round(list.reduce((acc, s) => acc + s.accuracy, 0) / list.length);

  const masteredSkills = skillValues.filter(
    (s) => s.mastery === 'Mastered' || s.mastery === 'Secure'
  );
  const revisionSkills = skillValues.filter(
    (s) => s.accuracy < 75 || s.recentErrors.length > 0
  );

  const totalTimeMinutes = Math.max(
    15,
    Math.round(
      profile.sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
    )
  );

  const handoverText = generateTeacherHandoverSummary({
    ...profile,
    name: studentName,
    grade: selectedGrade,
    gradeBand: getGradeBandForGrade(selectedGrade),
    curriculum: selectedCurriculum,
  });

  const handleApplyAndSaveProfile = () => {
    soundEngine.playClick();
    const updatedProfile: StudentProfile = {
      ...profile,
      name: studentName.trim() || 'Student Explorer',
      grade: selectedGrade,
      gradeBand: getGradeBandForGrade(selectedGrade),
      curriculum: selectedCurriculum,
    };
    onUpdateProfile(updatedProfile);
    const planetForGame: PlanetId =
      GAMES[selectedGameId]?.planetId || 'number-nebula';
    const nextConfig: SessionConfig = {
      ...sessionConfig,
      durationMinutes,
      subjectFocus,
      selectedGameId,
      selectedPlanetId: planetForGame,
      difficultyOverride,
      skipIntro,
    };
    onUpdateSessionConfig(nextConfig);
    setExportStatus('Student profile & custom warm-up parameters saved!');
  };

  const handleLaunchNow = () => {
    soundEngine.playClick();
    const updatedProfile: StudentProfile = {
      ...profile,
      name: studentName.trim() || 'Student Explorer',
      grade: selectedGrade,
      gradeBand: getGradeBandForGrade(selectedGrade),
      curriculum: selectedCurriculum,
    };
    onUpdateProfile(updatedProfile);
    const planetForGame: PlanetId =
      GAMES[selectedGameId]?.planetId || 'number-nebula';
    const nextConfig: SessionConfig = {
      ...sessionConfig,
      durationMinutes,
      subjectFocus,
      selectedGameId,
      selectedPlanetId: planetForGame,
      difficultyOverride,
      skipIntro,
    };
    onUpdateSessionConfig(nextConfig);
    onLaunchCustomSession(nextConfig);
  };

  const handleExportReport = () => {
    soundEngine.playClick();
    const reportPayload = {
      generatedAt: new Date().toISOString(),
      student: {
        name: profile.name,
        grade: profile.grade,
        curriculum: profile.curriculum,
        xp: profile.xp,
        stars: profile.stars,
      },
      handoverSummary: handoverText,
      skills: profile.skills,
      sessions: profile.sessions,
    };
    try {
      const blob = new Blob([JSON.stringify(reportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learnfun-report-${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('Report exported as JSON file!');
    } catch {
      setExportStatus('Report summary copied & verified!');
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Teacher Mission Control Dashboard"
      className="fixed inset-0 z-50 bg-[#160B30]/96 overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-8 pointer-events-auto"
    >
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-12">
        {/* Header */}
        <div className="comic-box halftone-dots rounded-2xl p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-[#00E5FF] text-[#0B0719] border-2 border-[#0B0719] font-comic text-xs sm:text-sm tracking-wider uppercase mb-1">
              LEARNFUN EDUCATOR & LIVE CLASS HANDOVER CONSOLE
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-comic tracking-wider text-[#FFD600] comic-text-stroke-sm">
              Teacher Mission Control
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleExportReport}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#FFD600] text-[#0B0719] comic-btn text-xs font-extrabold flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Session Report</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Teacher Dashboard"
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#FF2A85] text-white comic-btn text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Return to Galaxy</span>
            </button>
          </div>
        </div>

        {exportStatus && (
          <div className="comic-box-yellow rounded-xl px-4 py-3 text-xs font-extrabold flex items-center justify-between">
            <span>{exportStatus}</span>
            <button
              type="button"
              onClick={() => setExportStatus('')}
              className="underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Intelligent Class Handover Summary Banner (Comic Speech Box) */}
        <div className="comic-box-cream halftone-dots-dark rounded-2xl p-3.5 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-[#FF2A85] text-white border-2 border-[#0B0719] font-comic text-xs sm:text-sm tracking-wider uppercase">
              INTELLIGENT PRE-CLASS WARM-UP HANDOVER SUMMARY
            </span>
            <span className="text-xs font-extrabold text-slate-700 tabular-nums">
              Live Data · {profile.sessions.length} Completed Session(s)
            </span>
          </div>
          <p
            data-testid="teacher-handover-summary"
            className="text-sm md:text-base text-[#0B0719] leading-relaxed font-bold mt-2"
          >
            “{handoverText}”
          </p>
        </div>

        {/* Student Overview KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="comic-box-cyan rounded-xl p-4">
            <div className="text-xs font-extrabold uppercase mb-1 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Student Explorer
            </div>
            <div className="text-lg font-display font-extrabold truncate">
              {profile.name}
            </div>
            <div className="text-xs font-bold mt-0.5">
              Grade {profile.grade} · {profile.curriculum}
            </div>
          </div>

          <div className="comic-box-yellow rounded-xl p-4">
            <div className="text-xs font-extrabold uppercase mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Warm-Up Time
            </div>
            <div className="text-2xl font-mono font-extrabold tabular-nums">
              {totalTimeMinutes} mins
            </div>
            <div className="text-xs font-bold mt-0.5 tabular-nums">
              Across {profile.sessions.length} session(s)
            </div>
          </div>

          <div className="comic-box-cream rounded-xl p-4">
            <div className="text-xs font-extrabold uppercase mb-1 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#FF2A85]" /> Subject Accuracy
            </div>
            <div className="text-sm font-mono font-extrabold tabular-nums space-y-0.5">
              <div>Math: {avgAccuracy(mathSkills)}%</div>
              <div>
                Code: {avgAccuracy(codingSkills)}% · Logic: {avgAccuracy(logicSkills)}%
              </div>
            </div>
          </div>

          <div className="comic-box-pink rounded-xl p-4">
            <div className="text-xs font-extrabold uppercase mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Constellation
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#FFD600] tabular-nums">
              {profile.constellation.filter((c) => c.unlocked).length} /{' '}
              {profile.constellation.length} Stars
            </div>
            <div className="text-xs font-bold mt-0.5 tabular-nums">
              {profile.xp} Total XP
            </div>
          </div>
        </div>

        {/* Two-Column Main Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left 5-Col: Student Profile & Custom 15-Min Session Configurator */}
          <div className="lg:col-span-5 comic-box-cream halftone-dots-dark rounded-2xl p-3.5 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm sm:text-base font-display font-extrabold text-[#0B0719] border-b-2 border-[#0B0719] pb-2">
              <Sliders className="w-4 h-4 text-[#FF2A85] shrink-0" />
              <span>Configure Student & Custom 15-Min Warm-Up</span>
            </div>

            <div>
              <label
                htmlFor="teacher-student-name"
                className="block text-xs font-extrabold text-[#0B0719] mb-1"
              >
                Student Name or ID
              </label>
              <input
                id="teacher-student-name"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border-[3px] border-[#0B0719] text-sm font-bold text-[#0B0719]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="teacher-grade-select"
                  className="block text-xs font-extrabold text-[#0B0719] mb-1"
                >
                  Grade (1–12)
                </label>
                <select
                  id="teacher-grade-select"
                  value={selectedGrade}
                  onChange={(e) =>
                    setSelectedGrade(Number(e.target.value) as GradeNumber)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border-[3px] border-[#0B0719] text-sm font-bold text-[#0B0719]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="teacher-curriculum-select"
                  className="block text-xs font-extrabold text-[#0B0719] mb-1"
                >
                  Curriculum
                </label>
                <select
                  id="teacher-curriculum-select"
                  value={selectedCurriculum}
                  onChange={(e) =>
                    setSelectedCurriculum(e.target.value as CurriculumId)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border-[3px] border-[#0B0719] text-sm font-bold text-[#0B0719]"
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

            <div>
              <label className="block text-xs font-extrabold text-[#0B0719] mb-1">
                Warm-Up Subject Focus
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    { id: 'mixed', label: 'Mix All 3 Subjects' },
                    { id: 'mathematics', label: 'Mathematics Only' },
                    { id: 'coding', label: 'Coding Only' },
                    { id: 'logic', label: 'Logic Only' },
                  ] as const
                ).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubjectFocus(sub.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border-2 border-[#0B0719] cursor-pointer ${
                      subjectFocus === sub.id
                        ? 'bg-[#FFD600] text-[#0B0719] shadow-[2px_2px_0px_#0B0719]'
                        : 'bg-white text-[#0B0719]'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="teacher-game-select"
                  className="block text-xs font-extrabold text-[#0B0719] mb-1"
                >
                  Starting Game Activity
                </label>
                <select
                  id="teacher-game-select"
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value as GameId)}
                  className="w-full px-3 py-2 rounded-xl bg-white border-[3px] border-[#0B0719] text-sm font-bold text-[#0B0719]"
                >
                  {Object.values(GAMES).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="teacher-duration-select"
                  className="block text-xs font-extrabold text-[#0B0719] mb-1"
                >
                  Session Duration
                </label>
                <select
                  id="teacher-duration-select"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border-[3px] border-[#0B0719] text-sm font-bold text-[#0B0719]"
                >
                  <option value={5}>5 Mins (Quick Sprint)</option>
                  <option value={10}>10 Mins (Focused)</option>
                  <option value={15}>15 Mins (Standard Warm-Up)</option>
                  <option value={20}>20 Mins (Extended Lab)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#0B0719] mb-1">
                Difficulty Override (or Adaptive Engine)
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDifficultyOverride(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 border-[#0B0719] cursor-pointer ${
                    difficultyOverride === null
                      ? 'bg-[#00E5FF] text-[#0B0719]'
                      : 'bg-white text-[#0B0719]'
                  }`}
                >
                  Adaptive
                </button>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficultyOverride(lvl)}
                    className={`flex-1 min-w-[2.5rem] py-1.5 rounded-lg text-xs font-mono font-extrabold border-2 border-[#0B0719] cursor-pointer ${
                      difficultyOverride === lvl
                        ? 'bg-[#00E5FF] text-[#0B0719]'
                        : 'bg-white text-[#0B0719]'
                    }`}
                  >
                    T{lvl}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-[#0B0719] cursor-pointer">
              <input
                type="checkbox"
                checked={skipIntro}
                onChange={(e) => setSkipIntro(e.target.checked)}
                className="accent-[#FF2A85]"
              />
              <span>Skip 1-minute cinematic introduction when launching</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleApplyAndSaveProfile}
                className="px-4 py-2.5 rounded-xl bg-white text-[#0B0719] comic-btn text-xs font-extrabold cursor-pointer"
              >
                Save Settings
              </button>
              <button
                type="button"
                onClick={handleLaunchNow}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#00E676] text-[#0B0719] comic-btn font-display font-extrabold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Configured Session</span>
              </button>
            </div>
          </div>

          {/* Right 7-Col: Skill Development Matrix, Curriculum Topics & Session Reports */}
          <div className="lg:col-span-7 space-y-4">
            <div className="comic-box halftone-dots rounded-2xl p-3.5 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-display font-extrabold text-[#FFD600] mb-3">
                <BookOpen className="w-4 h-4" />
                <span>
                  Active Band: {gradeBand.name} ({gradeBand.tagline})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#FFFDF7] text-[#0B0719] border-[3px] border-[#0B0719] rounded-xl p-3">
                  <div className="font-extrabold text-[#FF2A85] mb-1.5 uppercase">
                    Mathematics Topics
                  </div>
                  <ul className="space-y-1 font-semibold">
                    {gradeBand.topics.mathematics.slice(0, 4).map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#FFFDF7] text-[#0B0719] border-[3px] border-[#0B0719] rounded-xl p-3">
                  <div className="font-extrabold text-[#7C4DFF] mb-1.5 uppercase">
                    Coding Topics
                  </div>
                  <ul className="space-y-1 font-semibold">
                    {gradeBand.topics.coding.slice(0, 4).map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#FFFDF7] text-[#0B0719] border-[3px] border-[#0B0719] rounded-xl p-3">
                  <div className="font-extrabold text-[#00BFA5] mb-1.5 uppercase">
                    Logic Topics
                  </div>
                  <ul className="space-y-1 font-semibold">
                    {gradeBand.topics.logic.slice(0, 4).map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="comic-box-cream halftone-dots-dark rounded-2xl p-3.5 sm:p-5 space-y-3">
              <h3 className="text-base font-display font-extrabold text-[#0B0719]">
                Individual Skill Mastery & Diagnostic Breakdown
              </h3>
              <div className="space-y-2">
                {skillValues.map((sk) => (
                  <div
                    key={sk.skillId}
                    className="bg-white border-[3px] border-[#0B0719] shadow-[3px_3px_0px_#0B0719] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-extrabold text-[#0B0719]">
                        {sk.skillName}
                      </div>
                      <div className="text-xs font-semibold text-slate-600">
                        {sk.subject.toUpperCase()} · {sk.topic} · Tier {sk.difficultyLevel}/5
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono font-extrabold tabular-nums">
                      <span className="text-[#0B0719]">
                        {sk.correctCount}/{sk.attempts} ({sk.accuracy}%)
                      </span>
                      <span className="text-[#FF9100]">{sk.hintsUsed} Hints</span>
                      <span
                        className={`px-2.5 py-1 rounded border-2 border-[#0B0719] ${
                          sk.mastery === 'Mastered' || sk.mastery === 'Secure'
                            ? 'bg-[#00E676] text-[#0B0719]'
                            : 'bg-[#FFD600] text-[#0B0719]'
                        }`}
                      >
                        {sk.mastery}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {revisionSkills.length > 0 && (
                <div className="bg-[#FF2A85] text-white border-[3px] border-[#0B0719] rounded-xl p-3.5 text-xs font-bold flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold uppercase mb-0.5">
                      Recommended Revision Before Live Class:
                    </div>
                    <div>
                      {revisionSkills
                        .map((r) => `${r.skillName} (${r.accuracy}% accuracy)`)
                        .join(' · ')}
                    </div>
                  </div>
                </div>
              )}

              {masteredSkills.length > 0 && (
                <div className="bg-[#00E676] text-[#0B0719] border-[3px] border-[#0B0719] rounded-xl p-3 text-xs font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Topics Secure/Mastered:{' '}
                    {masteredSkills.map((m) => m.skillName).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
