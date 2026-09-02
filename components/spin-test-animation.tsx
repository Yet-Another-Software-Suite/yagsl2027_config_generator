"use client"

import { ComparisonGrid, ComparisonPanel } from "@/components/tuning-comparison"

type SpinMode = "correct" | "drift" | "reverse"

function SpinScene({ mode }: { mode: SpinMode }) {
  const pinwheel = mode !== "drift"
  const chassisClass = mode === "drift" ? "spin-bad" : mode === "reverse" ? "spin-cw" : "spin-ccw-chassis"

  return (
    <svg viewBox="0 0 160 120" className="mx-auto h-auto w-40" role="img" aria-label="Robot attempting to spin in place next to the AdvantageScope swerve widget">
      <style>{`
        .spin-ccw-chassis { transform-box: fill-box; transform-origin: center; animation: spin-ccw 3s linear infinite; }
        .spin-cw { transform-box: fill-box; transform-origin: center; animation: spin-cw 3s linear infinite; }
        .spin-bad { transform-box: fill-box; transform-origin: center; animation: drift 3s linear infinite; }
        .widget-spin { transform-box: fill-box; transform-origin: center; animation: spin-ccw 3s linear infinite; }
        /* the stick is centered (zero angular velocity, no rotation) during 0-10% and 90-100%, matching
           ControllerAnimation's hold-left keyframes, so the robot only spins while the stick is held over */
        @keyframes spin-ccw {
          0%, 10%   { transform: rotate(0deg); }
          90%, 100% { transform: rotate(-360deg); }
        }
        @keyframes spin-cw {
          0%, 10%   { transform: rotate(0deg); }
          90%, 100% { transform: rotate(360deg); }
        }
        @keyframes drift {
          0%, 10%   { transform: translate(0px, 0px) rotate(0deg); }
          30%       { transform: translate(12px, 0px) rotate(15deg); }
          50%       { transform: translate(0px, 10px) rotate(0deg); }
          70%       { transform: translate(-12px, 0px) rotate(-15deg); }
          90%, 100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .spin-ccw-chassis, .spin-cw, .spin-bad, .widget-spin { animation: none; }
        }
      `}</style>

      {/* mini AdvantageScope widget: always shows the commanded rotation (CCW), regardless of what the
          real robot actually does */}
      <rect x="108" y="6" width="40" height="40" rx="6" className="fill-card stroke-border" strokeWidth="1.5" />
      <g className="widget-spin">
        <line x1="128" y1="26" x2="128" y2="12" className="stroke-primary" strokeWidth="2" />
      </g>
      <circle cx="128" cy="26" r="1.5" className="fill-primary" />
      <text x="128" y="53" textAnchor="middle" className="fill-muted-foreground text-[7px]">
        widget
      </text>

      {/* robot chassis */}
      <g className={chassisClass}>
        <rect x="20" y="40" width="70" height="70" rx="12" className="fill-muted stroke-border" strokeWidth="2" />
        {/* wheels: for a clean spin (correct or reversed direction) they're angled tangentially (pinwheel);
            the steering angle alone doesn't tell you the rotation direction, that's set by which way each
            drive wheel spins. Left forward-facing (undefined) for the drift case, which never got steered
            into spin position at all. */}
        <g transform={pinwheel ? "rotate(45 20 56)" : undefined}>
          <rect x="14" y="46" width="12" height="20" rx="3" className="fill-foreground/80" />
        </g>
        <g transform={pinwheel ? "rotate(-45 90 56)" : undefined}>
          <rect x="84" y="46" width="12" height="20" rx="3" className="fill-foreground/80" />
        </g>
        <g transform={pinwheel ? "rotate(-45 20 94)" : undefined}>
          <rect x="14" y="84" width="12" height="20" rx="3" className="fill-foreground/80" />
        </g>
        <g transform={pinwheel ? "rotate(45 90 94)" : undefined}>
          <rect x="84" y="84" width="12" height="20" rx="3" className="fill-foreground/80" />
        </g>
      </g>
    </svg>
  )
}

export function SpinTestAnimation() {
  return (
    <ComparisonGrid>
      <ComparisonPanel
        variant="correct"
        caption="Wheels angle tangentially (pinwheel pattern) so the robot spins cleanly in place, matching the AdvantageScope swerve widget."
      >
        <SpinScene mode="correct" />
      </ComparisonPanel>
      <ComparisonPanel
        variant="incorrect"
        caption="The robot spins cleanly, but the wrong way (clockwise (CW) instead of CCW): check for inverted drive motors, a diagonal module swap (front-left ↔ back-right, front-right ↔ back-left), or absolute encoder offsets that were captured with the bevel gear facing right instead of left."
      >
        <SpinScene mode="reverse" />
      </ComparisonPanel>
      <ComparisonPanel
        variant="incorrect"
        caption="Wheels stay pointed the same direction, so the robot drifts or translates instead of spinning in place: check module CAN IDs and absolute encoder offsets."
      >
        <SpinScene mode="drift" />
      </ComparisonPanel>
    </ComparisonGrid>
  )
}
