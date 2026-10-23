interface UnderlinedTextProps {
  children: React.ReactNode
  /** Tailwind/CSS classes applied to the text — use this for font size, weight, color, etc. */
  className?: string
  /** CSS color value for the underline bar. Defaults to `currentColor`. */
  underlineColor?: string
  /** Thickness of the underline bar in px. Defaults to 3. */
  underlineThickness?: number
  /**
   * How many px the underline extends beyond each side of the text.
   * e.g. 5 → underline is 10px wider than the text total. Defaults to 6.
   */
  underlineOverhang?: number
  /** Gap between the text baseline and the top of the underline bar in px. Defaults to 4. */
  underlineGap?: number
}

/**
 * Renders text with a decorative underline bar that:
 * - Is always slightly wider than the text
 * - Is positioned absolutely so it does NOT affect the component's layout height
 * - Therefore the vertical centre of this component equals the vertical centre of the text
 */
export function UnderlinedText({
  children,
  className = "",
  underlineColor = "currentColor",
  underlineThickness = 3,
  underlineOverhang = 6,
  underlineGap = 4,
}: UnderlinedTextProps) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <span
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          left: -underlineOverhang,
          width: `calc(100% + ${underlineOverhang * 2}px)`,
          height: underlineThickness,
          top: `calc(100% + ${underlineGap}px)`,
          backgroundColor: underlineColor,
        }}
      />
    </span>
  )
}
