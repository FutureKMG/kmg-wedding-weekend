type HeroImageProps = {
  alt: string
  className?: string
}

export function HeroImage({ alt, className }: HeroImageProps) {
  return (
    <picture className={className}>
      <source
        media="(max-width: 720px)"
        srcSet="/theme/invite-hero-mobile.avif"
        type="image/avif"
      />
      <source
        media="(max-width: 720px)"
        srcSet="/theme/invite-hero-mobile.webp"
        type="image/webp"
      />
      <source srcSet="/theme/invite-hero.avif" type="image/avif" />
      <source srcSet="/theme/invite-hero.webp" type="image/webp" />
      <img src="/theme/invite-hero.png" alt={alt} loading="lazy" />
    </picture>
  )
}
