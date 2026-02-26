import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { InfoCallout } from './InfoCallout'

type FaqCallout = {
  title: string
  body: string
  tone?: 'info'
}

export type FaqAccordionItem = {
  id: string
  title: string
  body?: string
  bullets?: string[]
  callout?: FaqCallout
}

type FaqAccordionProps = {
  items: FaqAccordionItem[]
  allowMultipleOpen?: boolean
  defaultOpenIds?: string[]
  onExpand?: (title: string) => void
}

export function FaqAccordion({
  items,
  allowMultipleOpen = false,
  defaultOpenIds = [],
  onExpand,
}: FaqAccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(defaultOpenIds))
  const accordionId = useId()
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([])

  function toggleItem(item: FaqAccordionItem) {
    setOpenIds((previousOpenIds) => {
      const isOpen = previousOpenIds.has(item.id)
      let nextOpenIds: Set<string>

      if (allowMultipleOpen) {
        nextOpenIds = new Set(previousOpenIds)
        if (isOpen) {
          nextOpenIds.delete(item.id)
        } else {
          nextOpenIds.add(item.id)
        }
      } else {
        nextOpenIds = isOpen ? new Set<string>() : new Set([item.id])
      }

      if (!isOpen) {
        onExpand?.(item.title)
      }

      return nextOpenIds
    })
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>, itemIndex: number) {
    const lastIndex = items.length - 1
    let targetIndex: number | null = null

    switch (event.key) {
      case 'ArrowDown':
        targetIndex = itemIndex >= lastIndex ? 0 : itemIndex + 1
        break
      case 'ArrowUp':
        targetIndex = itemIndex <= 0 ? lastIndex : itemIndex - 1
        break
      case 'Home':
        targetIndex = 0
        break
      case 'End':
        targetIndex = lastIndex
        break
      default:
        break
    }

    if (targetIndex === null) return

    event.preventDefault()
    triggerRefs.current[targetIndex]?.focus()
  }

  return (
    <div className="faq-accordion">
      {items.map((item, itemIndex) => {
        const triggerId = `${accordionId}-trigger-${item.id}`
        const panelId = `${accordionId}-panel-${item.id}`
        const isOpen = openIds.has(item.id)
        const calloutToneClass =
          item.callout?.tone === 'info' ? 'faq-item-callout faq-item-callout-info' : 'faq-item-callout'

        return (
          <article key={item.id} className="faq-item">
            <h4 className="faq-item-heading">
              <button
                id={triggerId}
                type="button"
                className="faq-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item)}
                onKeyDown={(event) => handleTriggerKeyDown(event, itemIndex)}
                ref={(element) => {
                  triggerRefs.current[itemIndex] = element
                }}
              >
                <span>{item.title}</span>
              </button>
            </h4>
            <div id={panelId} className="faq-panel" role="region" aria-labelledby={triggerId} hidden={!isOpen}>
              {item.bullets && item.bullets.length > 0 ? (
                <ul className="faq-item-bullets">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {item.body ? <p className="faq-item-body">{item.body}</p> : null}
              {item.callout ? (
                <InfoCallout
                  title={item.callout.title}
                  body={item.callout.body}
                  className={calloutToneClass}
                />
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
