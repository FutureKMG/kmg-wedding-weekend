interface BallparkScriptWordmarkProps {
  title: string
  subtitle?: string
  className?: string
  level?: 'h1' | 'h2' | 'h3' | 'p'
  compact?: boolean
}

export function BallparkScriptWordmark({
  title,
  subtitle,
  className,
  level = 'h2',
  compact = false,
}: BallparkScriptWordmarkProps) {
  const HeadingTag = level
  const rootClassName = ['ballpark-script', compact ? 'ballpark-script-compact' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName}>
      <HeadingTag className="ballpark-script-word">
        <span className="ballpark-script-star ballpark-script-star-left" aria-hidden="true">
          ★
        </span>
        <span className="ballpark-script-text">{title}</span>
        <span className="ballpark-script-star ballpark-script-star-right" aria-hidden="true">
          ★
        </span>
      </HeadingTag>

      {subtitle ? <p className="ballpark-script-subtitle">{subtitle}</p> : null}
      <span className="ballpark-script-tail" aria-hidden="true" />
    </div>
  )
}
