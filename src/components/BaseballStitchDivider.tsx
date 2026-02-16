type BaseballStitchDividerProps = {
  className?: string
}

export function BaseballStitchDivider({ className = '' }: BaseballStitchDividerProps) {
  return (
    <svg
      className={`stitch-divider ${className}`.trim()}
      viewBox="0 0 640 20"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <line x1="0" y1="10" x2="640" y2="10" className="stitch-divider-thread" />
      {Array.from({ length: 38 }, (_, index) => {
        const x = 8 + index * 16
        return <path key={x} d={`M${x} 5 L${x + 8} 15`} className="stitch-divider-stitch" />
      })}
    </svg>
  )
}
