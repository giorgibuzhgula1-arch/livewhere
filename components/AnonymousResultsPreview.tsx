type PreviewCity = {
  name: string
  country: string
  flag: string
  score: number
}

type Props = {
  cities: PreviewCity[]
}

/** Dumb presentational preview - name / country / flag / score only. */
export default function AnonymousResultsPreview({ cities }: Props) {
  if (cities.length === 0) return null

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        margin: '4px 0 8px',
      }}
    >
      {cities.map((city, index) => (
        <div
          key={`${city.name}|${city.country}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(240,237,232,0.35)',
              width: 18,
              flexShrink: 0,
            }}
          >
            {index + 1}
          </span>
          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }} aria-hidden>
            {city.flag}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 17,
                fontWeight: 700,
                color: '#f0ede8',
                lineHeight: 1.2,
              }}
            >
              {city.name}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginTop: 2 }}>
              {city.country}
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#c8f05a',
              flexShrink: 0,
            }}
          >
            {city.score}
          </div>
        </div>
      ))}
    </div>
  )
}
