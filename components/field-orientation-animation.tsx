"use client"

import { ComparisonGrid, ComparisonPanel } from "@/components/tuning-comparison"

function FieldScene({ mirrored, heading = 0 }: { mirrored: boolean; heading?: number }) {
  return (
    <svg
      viewBox="0 0 160 130"
      className="mx-auto h-auto w-40"
      role="img"
      aria-label={`Robot at a ${heading}° heading moving on the 2D field relative to the driver station`}
    >
      <style>{`
        .field-dot { animation: field-move 4s ease-in-out infinite; }
        .field-dot-mirrored { animation: field-move-mirrored 4s ease-in-out infinite; }
        @keyframes field-move {
          0%, 100% { transform: translate(0px, 0px); }
          20%      { transform: translate(0px, -28px); }
          40%      { transform: translate(0px, 0px); }
          55%      { transform: translate(0px, 28px); }
          70%      { transform: translate(0px, 0px); }
          80%      { transform: translate(-28px, 0px); }
          90%      { transform: translate(0px, 0px); }
          95%      { transform: translate(28px, 0px); }
        }
        @keyframes field-move-mirrored {
          0%, 100% { transform: translate(0px, 0px); }
          20%      { transform: translate(0px, 28px); }
          40%      { transform: translate(0px, 0px); }
          55%      { transform: translate(0px, -28px); }
          70%      { transform: translate(0px, 0px); }
          80%      { transform: translate(28px, 0px); }
          90%      { transform: translate(0px, 0px); }
          95%      { transform: translate(-28px, 0px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .field-dot, .field-dot-mirrored { animation: none; }
        }
      `}</style>

      {/* field boundary */}
      <rect x="20" y="10" width="120" height="100" rx="6" className="fill-muted stroke-border" strokeWidth="2" />

      {/* driver station marker, bottom edge */}
      <line x1="20" y1="110" x2="140" y2="110" className="stroke-primary" strokeWidth="3" />
      <text x="80" y="124" textAnchor="middle" className="fill-primary text-[8px] font-medium">
        driver station
      </text>

      {/* robot: position on the field, then its own heading (rotation is purely cosmetic here — field-oriented
          drive means the movement direction below does NOT depend on this rotation) */}
      <g transform="translate(80 60)">
        <g className={mirrored ? "field-dot-mirrored" : "field-dot"}>
          <g transform={`rotate(${heading})`}>
            <rect
              x="-7"
              y="-7"
              width="14"
              height="14"
              rx="3"
              className={mirrored ? "fill-destructive" : "fill-green-600 dark:fill-green-400"}
            />
            <line x1="0" y1="-2" x2="0" y2="-11" className="stroke-background" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  )
}

export function FieldOrientationAnimation({ heading = 0 }: { heading?: number }) {
  const headingNote = heading !== 0 ? ` Even at a ${heading}° heading, the direction shouldn't change.` : ""
  return (
    <ComparisonGrid>
      <ComparisonPanel
        variant="correct"
        caption={`Pushing forward moves the robot away from the driver station on the field widget, and left/right match too.${headingNote}`}
      >
        <FieldScene mirrored={false} heading={heading} />
      </ComparisonPanel>
      <ComparisonPanel
        variant="incorrect"
        caption="The field widget moves opposite what you'd expect — check the gyro offset/inversion."
      >
        <FieldScene mirrored heading={heading} />
      </ComparisonPanel>
    </ComparisonGrid>
  )
}
