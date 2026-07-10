'use client'

type Props = {
  favorited: boolean
  onToggle: () => void
  disabled?: boolean
  cityLabel: string
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden
      fill={filled ? '#c8f05a' : 'none'}
      stroke={filled ? '#c8f05a' : 'rgba(240, 237, 232, 0.4)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function CityFavoriteButton({ favorited, onToggle, disabled, cityLabel }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      disabled={disabled}
      aria-label={favorited ? `Remove ${cityLabel} from favorites` : `Add ${cityLabel} to favorites`}
      aria-pressed={favorited}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: 'none',
        borderRadius: 8,
        background: favorited ? 'rgba(200, 240, 90, 0.1)' : 'transparent',
        cursor: disabled ? 'wait' : 'pointer',
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.15s',
      }}
    >
      <StarIcon filled={favorited} />
    </button>
  )
}
