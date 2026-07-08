"use client"

import { ComparisonGrid, ComparisonPanel } from "@/components/tuning-comparison"

function RobotWithDial({ needleDirection }: { needleDirection: "ccw" | "cw" }) {
  return (
    <svg viewBox="0 0 160 120" className="mx-auto h-auto w-40" role="img" aria-label="Robot rotating counterclockwise (CCW) next to a gyro dial">
      <style>{`
        .gyro-chassis { transform-box: fill-box; transform-origin: center; animation: gyro-rotate-ccw 4s linear infinite; }
        .gyro-needle-ccw { transform-box: fill-box; transform-origin: center; animation: gyro-rotate-ccw 4s linear infinite; }
        .gyro-needle-cw { transform-box: fill-box; transform-origin: center; animation: gyro-rotate-cw 4s linear infinite; }
        @keyframes gyro-rotate-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes gyro-rotate-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .gyro-chassis, .gyro-needle-ccw, .gyro-needle-cw { animation: none; }
        }
      `}</style>

      <defs>
        <marker id="gyro-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" className="fill-foreground" />
        </marker>
      </defs>

      {/* chassis: the robot is always physically turned counterclockwise (CCW) by hand */}
      <g className="gyro-chassis">
        <rect x="20" y="35" width="50" height="50" rx="8" className="fill-muted stroke-border" strokeWidth="2" />
        <line x1="45" y1="60" x2="45" y2="40" className="stroke-foreground" strokeWidth="2" markerEnd="url(#gyro-arrow)" />
      </g>

      {/* gyro dial */}
      <circle cx="120" cy="60" r="28" className="fill-card stroke-border" strokeWidth="2" />
      <g className={needleDirection === "ccw" ? "gyro-needle-ccw" : "gyro-needle-cw"}>
        <line
          x1="120"
          y1="35"
          x2="120"
          y2="85"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={needleDirection === "ccw" ? "stroke-green-600 dark:stroke-green-400" : "stroke-destructive"}
        />
      </g>
      <circle cx="120" cy="60" r="2" className="fill-foreground" />
      <text x="120" y="100" textAnchor="middle" className="fill-muted-foreground text-[9px]">
        gyro
      </text>
    </svg>
  )
}

export function GyroCheckAnimation() {
  return (
    <ComparisonGrid>
      <ComparisonPanel variant="correct" caption="Rotating the robot counterclockwise (CCW) (top-down) increases the gyro reading.">
        <RobotWithDial needleDirection="ccw" />
      </ComparisonPanel>
      <ComparisonPanel
        variant="incorrect"
        caption="The gyro decreases instead — set gyroInvert to true in swervedrive.json, redeploy, and recheck."
      >
        <RobotWithDial needleDirection="cw" />
      </ComparisonPanel>
    </ComparisonGrid>
  )
}
