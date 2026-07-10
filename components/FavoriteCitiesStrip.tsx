'use client'

import { useState } from 'react'
import type { FavoriteCity } from '@/lib/favorite-cities'
import CityFavoriteButton from '@/components/CityFavoriteButton'

type Props = {
  favorites: FavoriteCity[]
  flagByKey: Map<string, string>
  isFavorited: (cityName: string, cityCountry: string) => boolean
  onToggle: (cityName: string, cityCountry: string) => void
  togglingKey: string | null
}

export default function FavoriteCitiesStrip({
  favorites,
  flagByKey,
  isFavorited,
  onToggle,
  togglingKey,
}: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <section
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '18px 20px',
        marginBottom: 20,
      }}
      aria-label="Your favorite cities"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 700,
            color: '#f0ede8',
          }}
        >
          Your Favorite Cities
        </span>
        <span style={{ fontSize: 12, color: 'rgba(240, 237, 232, 0.45)', fontWeight: 600 }}>
          {favorites.length} saved · {expanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 14 }}>
          {favorites.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(240, 237, 232, 0.5)', margin: 0, lineHeight: 1.5 }}>
              Star cities inside your saved plans to collect favorites here.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {favorites.map((fav) => {
                const key = `${fav.city_name}|${fav.city_country}`
                const flag = flagByKey.get(key) ?? ''
                return (
                  <div
                    key={fav.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px 6px 12px',
                      borderRadius: 999,
                      background: 'rgba(200, 240, 90, 0.08)',
                      border: '1px solid rgba(200, 240, 90, 0.28)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(240, 237, 232, 0.85)',
                    }}
                  >
                    <span>
                      {flag} {fav.city_name}, {fav.city_country}
                    </span>
                    <CityFavoriteButton
                      favorited={isFavorited(fav.city_name, fav.city_country)}
                      onToggle={() => onToggle(fav.city_name, fav.city_country)}
                      disabled={togglingKey === key}
                      cityLabel={`${fav.city_name}, ${fav.city_country}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
