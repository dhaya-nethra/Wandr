import { useNavigate } from 'react-router-dom';
import { useConsent } from '@/hooks/useConsent';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ArrowRight, ChevronRight, Lock, MapPin, ShieldCheck } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { hasConsent, isLoading: consentLoading } = useConsent();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { isAuthenticated: isAdminAuthenticated, isLoading: adminLoading } = useAdminAuth();

  const isLoading = consentLoading || authLoading || adminLoading;

  const handleParticipantAccess = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    navigate(hasConsent ? '/dashboard' : '/onboarding');
  };

  const handleAdminAccess = () => {
    navigate(isAdminAuthenticated ? '/admin/dashboard' : '/admin/login');
  };

  return (
    <div className="min-h-screen page-bg flex flex-col md:flex-row">

      {/* ── Left panel — branding & context ─────────────────────── */}
      <div className="app-header flex flex-col justify-between px-8 py-10 md:w-[45%] md:min-h-screen md:sticky md:top-0">
        <div>
          <p className="label-caps text-blue-200 mb-8">NATPAC · Kerala Transport Research</p>
          <h1 className="font-display text-4xl font-extrabold text-white leading-[1.1] tracking-tight md:text-5xl">
            Wandr
          </h1>
          <p className="mt-4 text-blue-100 text-[15px] leading-7 max-w-sm">
            A mobility data collection tool built for Kerala's transportation planning research.
            Participants log daily travel; analysts review aggregated patterns.
          </p>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center py-6" aria-hidden="true">
          <div className="wandr-mascot-stage">
            <svg viewBox="0 0 220 120" className="wandr-walker-svg" fill="none">
              <defs>
                {/* Road clip: full-width flat strip for the scrolling dashes */}
                <clipPath id="wandrTrackClip">
                  <rect x="0" y="88" width="220" height="22" />
                </clipPath>
                {/* Scenery clip: full-width strip above the road */}
                <clipPath id="wandrSceneryClip">
                  <rect x="0" y="14" width="220" height="70" />
                </clipPath>
              </defs>

              {/*
                INFINITE SCENERY — correct double-buffer technique:
                ┌─────────────────────────────────────────────────────┐
                │ CLIP is on the STATIC outer <g> — it never moves.   │
                │ ANIMATION is on the inner <g> only.                  │
                │ This prevents the bug where the clip scrolls with    │
                │ the content instead of staying fixed as a window.    │
                └─────────────────────────────────────────────────────┘
                Two 220px tiles [A][B] sit side-by-side.
                CSS moves the inner group from 0 → -220px (one tile).
                Reset is invisible because [A] and [B] are identical.
              */}
              <g clipPath="url(#wandrSceneryClip)">
                <g className="wandr-scenery-scroll">

                  {/* ── Tile A ── (x = 0 … 219) ──────────────────── */}
                  {/* Each cluster is ≤ 44px wide with ≤ 20px gaps    */}

                  {/* cluster 1  x ≈ 0-32 */}
                  <ellipse cx="8"  cy="79" rx="12" ry="6"   className="wandr-bush" />
                  <ellipse cx="24" cy="78" rx="10" ry="5.5" className="wandr-bush" />

                  {/* cluster 2  x ≈ 36-82  (tree) */}
                  <rect x="49" y="58" width="5" height="26" rx="2" className="wandr-tree-trunk" />
                  <circle cx="51" cy="47" r="13" className="wandr-tree-leaf" />
                  <circle cx="40" cy="57" r="9"  className="wandr-tree-leaf" />
                  <circle cx="63" cy="57" r="9"  className="wandr-tree-leaf" />

                  {/* cluster 3  x ≈ 80-122 (low bushes — sit below character body) */}
                  <ellipse cx="88"  cy="79" rx="11" ry="6"   className="wandr-bush" />
                  <ellipse cx="104" cy="78" rx="12" ry="6.5" className="wandr-bush" />
                  <ellipse cx="120" cy="79" rx="10" ry="5.5" className="wandr-bush" />

                  {/* cluster 4  x ≈ 130-180  (tree) */}
                  <rect x="148" y="55" width="5" height="29" rx="2" className="wandr-tree-trunk" />
                  <circle cx="150" cy="44" r="14" className="wandr-tree-leaf" />
                  <circle cx="138" cy="55" r="9"  className="wandr-tree-leaf" />
                  <circle cx="162" cy="55" r="9"  className="wandr-tree-leaf" />

                  {/* cluster 5  x ≈ 178-220 (bushes right up to edge) */}
                  <ellipse cx="181" cy="79" rx="11" ry="6"   className="wandr-bush" />
                  <ellipse cx="197" cy="78" rx="12" ry="6.5" className="wandr-bush" />
                  <ellipse cx="213" cy="79" rx="10" ry="5.5" className="wandr-bush" />

                  {/* ── Tile B ── pixel-perfect copy, offset 220px ── */}
                  <ellipse cx="228" cy="79" rx="12" ry="6"   className="wandr-bush" />
                  <ellipse cx="244" cy="78" rx="10" ry="5.5" className="wandr-bush" />

                  <rect x="269" y="58" width="5" height="26" rx="2" className="wandr-tree-trunk" />
                  <circle cx="271" cy="47" r="13" className="wandr-tree-leaf" />
                  <circle cx="260" cy="57" r="9"  className="wandr-tree-leaf" />
                  <circle cx="283" cy="57" r="9"  className="wandr-tree-leaf" />

                  <ellipse cx="308" cy="79" rx="11" ry="6"   className="wandr-bush" />
                  <ellipse cx="324" cy="78" rx="12" ry="6.5" className="wandr-bush" />
                  <ellipse cx="340" cy="79" rx="10" ry="5.5" className="wandr-bush" />

                  <rect x="368" y="55" width="5" height="29" rx="2" className="wandr-tree-trunk" />
                  <circle cx="370" cy="44" r="14" className="wandr-tree-leaf" />
                  <circle cx="358" cy="55" r="9"  className="wandr-tree-leaf" />
                  <circle cx="382" cy="55" r="9"  className="wandr-tree-leaf" />

                  <ellipse cx="401" cy="79" rx="11" ry="6"   className="wandr-bush" />
                  <ellipse cx="417" cy="78" rx="12" ry="6.5" className="wandr-bush" />
                  <ellipse cx="433" cy="79" rx="10" ry="5.5" className="wandr-bush" />

                </g>
              </g>

              {/* ── Road: two flat horizontal edge strips (static, no scroll needed) */}
              <line x1="0" y1="88"  x2="220" y2="88"  className="wandr-road-edge" />
              <line x1="0" y1="110" x2="220" y2="110" className="wandr-road-edge" />

              {/*
                INFINITE ROAD DASHES — same double-buffer technique as scenery:
                Clip on static outer <g>, animation on inner <g> only.
                Dashes have a 40px period; animating by -40px is seamless
                because every 40px looks identical — no tile boundary needed.
                7 dashes cover 0-264px > 220+40, so the clipped window is
                always full at every frame of the 1.1s loop.
              */}
              <g clipPath="url(#wandrTrackClip)">
                <g className="wandr-road-scroll">
                  <line x1="0"   y1="99" x2="24"  y2="99" className="wandr-bg-line" />
                  <line x1="40"  y1="99" x2="64"  y2="99" className="wandr-bg-line" />
                  <line x1="80"  y1="99" x2="104" y2="99" className="wandr-bg-line" />
                  <line x1="120" y1="99" x2="144" y2="99" className="wandr-bg-line" />
                  <line x1="160" y1="99" x2="184" y2="99" className="wandr-bg-line" />
                  <line x1="200" y1="99" x2="224" y2="99" className="wandr-bg-line" />
                  <line x1="240" y1="99" x2="264" y2="99" className="wandr-bg-line" />
                </g>
              </g>

              <ellipse cx="103" cy="108" rx="56" ry="7" className="wandr-ground" />

              <g className="wandr-walker-body">
                <circle cx="92" cy="30" r="7.5" className="wandr-stroke" />
                <line x1="92" y1="42" x2="92" y2="66" className="wandr-stroke" />

                <g className="wandr-arm-back">
                  <line x1="92" y1="42" x2="79" y2="56" className="wandr-stroke" />
                </g>

                <g className="wandr-arm-front">
                  <line x1="92" y1="42" x2="127" y2="43" className="wandr-stroke" />
                </g>

                <g className="wandr-leg-back">
                  <line x1="92" y1="66" x2="82" y2="92" className="wandr-stroke" />
                </g>

                <g className="wandr-leg-front">
                  <line x1="92" y1="66" x2="102" y2="92" className="wandr-stroke" />
                </g>
              </g>

              <g className="wandr-suitcase-pull">
                <g className="wandr-suitcase">
                  <line x1="127" y1="43" x2="127" y2="49" className="wandr-stroke" />
                  <line x1="122" y1="43" x2="132" y2="43" className="wandr-stroke" />
                  <rect x="116" y="49" width="24" height="29" rx="4" className="wandr-stroke" />
                  <line x1="120" y1="56" x2="136" y2="56" className="wandr-stroke" />

                  <line x1="121" y1="78" x2="121" y2="83" className="wandr-stroke" />
                  <line x1="135" y1="78" x2="135" y2="83" className="wandr-stroke" />
                  <line x1="121" y1="83" x2="135" y2="83" className="wandr-stroke" />

                  <circle cx="121" cy="86" r="3.2" className="wandr-stroke wandr-wheel-left" />
                  <circle cx="135" cy="86" r="3.2" className="wandr-stroke wandr-wheel-right" />
                  <circle cx="121" cy="86" r="0.9" className="wandr-wheel-hub" />
                  <circle cx="135" cy="86" r="0.9" className="wandr-wheel-hub" />
                </g>
              </g>
            </svg>
          </div>
        </div>

        <div className="mt-12 space-y-3 border-t border-blue-400/30 pt-6">
          {[
            'End-to-end encrypted data collection',
            'Separate participant and analyst environments',
            'Audit log on every admin action',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-[13px] text-blue-200">
              <div className="h-1 w-1 rounded-full bg-blue-300 shrink-0" />
              {item}
            </div>
          ))}
          <p className="pt-4 text-[11px] text-blue-300/70 uppercase tracking-widest">
            Government of Kerala · Dept. of Transport
          </p>
        </div>
      </div>

      {/* ── Right panel — access selection ──────────────────────── */}
      <div className="flex flex-col justify-center flex-1 px-8 py-12 md:py-0">
        {isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading…
          </div>
        ) : (
          <div className="max-w-sm w-full mx-auto md:mx-0 space-y-4">
            <p className="label-caps mb-6">Select your access type</p>

            {/* Participant */}
            <button
              onClick={handleParticipantAccess}
              className="group w-full text-left card-flat shadow-card p-5 transition-all duration-150 hover:border-primary/40 hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/8 border border-primary/15">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-[15px] font-semibold text-foreground">
                      {isLoggedIn ? (hasConsent ? 'Continue as Participant' : 'Complete onboarding') : 'Sign in as Participant'}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground leading-5">
                      Record trips, review history, manage your travel profile.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* Admin */}
            <button
              onClick={handleAdminAccess}
              className="group w-full text-left card-flat shadow-card p-5 transition-all duration-150 hover:border-primary/40 hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-100 border border-slate-200">
                    <ShieldCheck className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-[15px] font-semibold text-foreground">
                        {isAdminAuthenticated ? 'Open Admin Portal' : 'Admin Sign In'}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-sm border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                        <Lock className="h-2.5 w-2.5" /> Restricted
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground leading-5">
                      Review participant records, analytics, and data exports.
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            <p className="text-[12px] text-muted-foreground pt-2 text-center">
              Not sure? Start with Participant access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
