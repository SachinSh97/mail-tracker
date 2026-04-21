import type { ReactNode } from 'react'
import { useCarousel } from '../../hooks/useCarousel'
import { cn } from '../../utils/ui'
import { CollectionsPreview, EmailStatusPreview, TrackedEmailsPreview } from './AppPreviews'

interface Slide {
  title: string
  description: string
  preview: ReactNode
}

const SLIDES: Slide[] = [
  {
    title: 'Know when they read it',
    description: 'See the moment your email is opened, how many times, and when it was last read.',
    preview: <EmailStatusPreview />,
  },
  {
    title: 'Every email at a glance',
    description: 'Filter by opened or not opened to know who to follow up with.',
    preview: <TrackedEmailsPreview />,
  },
  {
    title: 'Organised in collections',
    description: 'Group emails by company or project and see how many were opened.',
    preview: <CollectionsPreview />,
  },
]

/**
 * Sign-in page tour of the tracking screens. Swipe, use the dots, or let it advance on its own.
 * Accessible carousel pattern: a labelled region of labelled slides; auto-advance pauses on hover,
 * touch and keyboard focus, and is off for reduced motion.
 */
export function FeatureSlider() {
  const { trackRef, active, goTo, pause, resume } = useCarousel(SLIDES.length)

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What you can do with Seenly"
      className="flex flex-col gap-4"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={pause}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((slide, index) => (
          <div
            key={slide.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${SLIDES.length}: ${slide.title}`}
            // Hidden slides are skipped by screen readers until they're in view
            aria-hidden={index !== active}
            className="flex w-full shrink-0 snap-center flex-col gap-4 px-0.5"
          >
            {/* Purely illustrative: the title and text below say what it shows */}
            <div aria-hidden="true">{slide.preview}</div>
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-base font-semibold">{slide.title}</h2>
              <p className="mx-auto max-w-72 text-[13px] leading-normal text-fg-muted">{slide.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Show slide ${index + 1}: ${slide.title}`}
            aria-current={index === active}
            // 24px tap area around a small visible dot
            className="flex size-6 items-center justify-center"
          >
            <span
              className={cn(
                'h-1.5 rounded-full motion-safe:transition-all',
                index === active ? 'w-5 bg-accent' : 'w-1.5 bg-fg-faint/50',
              )}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
