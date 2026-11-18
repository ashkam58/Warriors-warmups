import React from 'react';
import { StudentProfile } from '../types/universe';
import { AVATAR_OPTIONS, SHIP_COLORS, PLANETS } from '../engine/worldData';
import { soundEngine } from '../engine/soundEngine';
import { X, Sparkles, Award, Rocket } from 'lucide-react';

interface ConstellationVaultModalProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
  onClose: () => void;
}

export const ConstellationVaultModal: React.FC<ConstellationVaultModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
}) => {
  const unlockedStars = profile.constellation.filter((c) => c.unlocked);

  return (
    <div
      role="dialog"
      aria-label="Constellation Star Map and Explorer Avatar Hangar"
      className="fixed inset-0 z-50 bg-[#160B30]/95 overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-8 pointer-events-auto"
    >
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-12">
        <div className="comic-box halftone-dots rounded-2xl p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-[#FFD600] text-[#0B0719] border-2 border-[#0B0719] font-comic text-xs sm:text-sm tracking-wider uppercase mb-1">
              STAR CHART & KURZGESAGT ROCKET HANGAR
            </span>
            <h2 className="text-2xl sm:text-3xl font-comic tracking-wider text-white comic-text-stroke-sm">
              {profile.name}’s Constellation & Starship Vault
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#FF2A85] text-white comic-btn text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close Vault</span>
          </button>
        </div>

        {/* Interactive SVG Constellation Sky Map */}
        <div className="comic-box-cream halftone-dots-dark rounded-2xl p-3.5 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm sm:text-base font-display font-extrabold text-[#0B0719] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF2A85] shrink-0" />
              <span>
                LearnFun Living Constellation ({unlockedStars.length} /{' '}
                {profile.constellation.length} Stars Illuminated)
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-700">
              Every completed mission illuminates a new star in your personal sky!
            </span>
          </div>

          <svg
            viewBox="0 0 800 280"
            className="w-full h-48 sm:h-64 bg-[#160B30] border-[3px] border-[#0B0719] shadow-[4px_4px_0px_#0B0719] rounded-xl"
          >
            {profile.constellation.map((star, idx) => {
              if (idx === 0) return null;
              const prev = profile.constellation[idx - 1];
              const bothLit = star.unlocked && prev.unlocked;
              return (
                <line
                  key={`line-${star.id}`}
                  x1={prev.x * 8}
                  y1={prev.y * 2.6}
                  x2={star.x * 8}
                  y2={star.y * 2.6}
                  stroke={bothLit ? '#00E5FF' : '#3B2378'}
                  strokeWidth={bothLit ? '3.5' : '2'}
                  strokeDasharray={bothLit ? undefined : '6 6'}
                />
              );
            })}

            {profile.constellation.map((star) => {
              const cx = star.x * 8;
              const cy = star.y * 2.6;
              return (
                <g key={star.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={star.unlocked ? 11 : 6}
                    fill={star.unlocked ? '#FFD600' : '#3B2378'}
                    stroke="#0B0719"
                    strokeWidth="3"
                  />
                  <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    fill={star.unlocked ? '#FFFDF7' : '#94A3B8'}
                    className="text-[11px] font-mono font-bold"
                  >
                    {star.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Avatar & Starship Hull Customizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="comic-box-cream halftone-dots-dark rounded-2xl p-3.5 sm:p-5 space-y-3">
            <h3 className="text-sm sm:text-base font-display font-extrabold text-[#0B0719] flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#FF2A85] shrink-0" />
              <span>Explorer Avatar & Starship Hull Color</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVATAR_OPTIONS.map((av) => {
                const active = profile.avatarId === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateProfile({ ...profile, avatarId: av.id });
                    }}
                    className={`p-3 rounded-xl border-[3px] border-[#0B0719] text-left transition-transform cursor-pointer ${
                      active
                        ? 'bg-[#FFD600] text-[#0B0719] shadow-[3px_3px_0px_#0B0719]'
                        : 'bg-white text-[#0B0719]'
                    }`}
                  >
                    <div className="text-sm font-extrabold">{av.name}</div>
                    <div className="text-xs font-semibold text-slate-700">{av.role}</div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <div className="text-xs font-extrabold text-[#0B0719] mb-2">
                Select 3D Spacecraft Hull Finish:
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {SHIP_COLORS.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateProfile({ ...profile, shipColor: sc.hex });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-[#0B0719] flex items-center gap-2 cursor-pointer ${
                      profile.shipColor === sc.hex
                        ? 'bg-[#00E5FF] text-[#0B0719] shadow-[2px_2px_0px_#0B0719]'
                        : 'bg-white text-[#0B0719]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border-2 border-[#0B0719] inline-block"
                      style={{ backgroundColor: sc.hex }}
                    />
                    <span>{sc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="comic-box-cream halftone-dots-dark rounded-2xl p-3.5 sm:p-5 space-y-3">
            <h3 className="text-sm sm:text-base font-display font-extrabold text-[#0B0719] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF9100] shrink-0" />
              <span>Earned Achievement Badges & Planet Exploration</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge) => (
                <div
                  key={badge}
                  className="px-3 py-1.5 rounded-xl bg-[#FFD600] border-2 border-[#0B0719] shadow-[2px_2px_0px_#0B0719] text-xs font-extrabold text-[#0B0719]"
                >
                  ★ {badge}
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pt-2">
              {PLANETS.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs font-bold text-[#0B0719] bg-white px-3 py-1.5 rounded-lg border-2 border-[#0B0719]"
                >
                  <span>{p.name}</span>
                  <span className="font-mono font-extrabold text-[#FF2A85] tabular-nums">
                    {profile.planetProgress[p.id] || 25}% Explored
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
