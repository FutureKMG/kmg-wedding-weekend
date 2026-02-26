import type { ReactNode } from 'react'

type InfoCalloutProps = {
  title: string
  body: string
  icon?: ReactNode
  className?: string
}

const DEFAULT_ICON = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10.2v5.4" />
    <circle cx="12" cy="7.3" r="0.9" />
  </svg>
)

export function InfoCallout({ title, body, icon, className }: InfoCalloutProps) {
  const classes = className ? `info-callout ${className}` : 'info-callout'

  return (
    <aside className={classes} role="note" aria-label={title}>
      <div className="info-callout-icon" aria-hidden="true">
        {icon ?? DEFAULT_ICON}
      </div>
      <div className="info-callout-content">
        <p className="info-callout-title">{title}</p>
        <p>{body}</p>
      </div>
    </aside>
  )
}
