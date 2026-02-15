import type { ReactNode } from 'react'

type PageIntroProps = {
  eyebrow?: string
  title: string
  description: string
  children?: ReactNode
}

export function PageIntro({ eyebrow, title, description, children }: PageIntroProps) {
  return (
    <article className="card page-intro reveal">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {children}
    </article>
  )
}
