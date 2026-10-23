import { useEffect, useRef, useState } from "react"
import { scoreColor } from "@/utils/scoreColor"

interface Props {
  score: number
  size?: number          // diameter in px, defaults to 120
  strokeWidth?: number   // stroke thickness in px, defaults to size * 0.08
  bgColor?: string       // fill inside the ring; e.g. "white" or a CSS colour value
}

export function ScoreRing({ score, size = 120, strokeWidth: strokeWidthProp, bgColor }: Props) {
  const strokeWidth = strokeWidthProp ?? size * 0.08
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference * (1 - score / 100)

  // Start empty; animate to target after mount, and on every score change.
  const [offset, setOffset] = useState(circumference)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Double rAF: first schedules before next paint, second guarantees the
    // initial empty state is committed before the transition begins.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setOffset(targetOffset))
    })
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetOffset])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track — faded tint of the progress colour so the ring reads as one object */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill={bgColor ?? "none"}
        strokeWidth={strokeWidth}
        style={{ stroke: scoreColor(score, 0.15) }}
      />
      {/* Progress ring — fills clockwise from 3 o'clock */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        style={{
          stroke: scoreColor(score),
          transition: "stroke-dashoffset 0.8s ease-out, stroke 0.8s ease-out",
        }}
      />
      {/* Score label */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-bold"
        fontSize={size * 0.24}
      >
        {score}
      </text>
    </svg>
  )
}
