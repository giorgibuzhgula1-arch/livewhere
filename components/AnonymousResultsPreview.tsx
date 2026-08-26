type PreviewCity = {
  name: string
  country: string
  flag: string
  score: number
}

type Props = {
  cities: PreviewCity[]
  showRank?: boolean
}

function getScoreColor(score: number) {
  if (score >= 80) return '#c8f05a'
  if (score >= 65) return '#f0c85a'
  return '#f05a8c'
}

function cardShellStyle(rank: number) {
  return {
    background: rank === 1 ? 'rgba(200,240,90,0.04)' : '#1a1a26',
    border: `1px solid ${
      rank === 1
        ? 'rgba(200,240,90,0.3)'
        : rank === 2
          ? 'rgba(90,240,200,0.2)'
          : 'rgba(255,255,255,0.07)'
    }`,
    borderRadius: 18,
    padding: 24,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }
}

/** Dumb presentational preview - name / country / flag / score only. */
export default function AnonymousResultsPreview({ cities, showRank = true }: Props) {
  if (cities.length === 0) return null

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        margin: '8px 0 4px',
      }}
    >
      {cities.map((city, index) => {
        const rank = index + 1
        const color = getScoreColor(city.score)
        return (
          <div key={`${city.name}|${city.country}`} style={cardShellStyle(rank)}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: color,
                width: `${Math.min(100, Math.max(0, city.score))}%`,
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(240,237,232,0.35)',
                    width: 18,
                    flexShrink: 0,
                    paddingTop: 4,
                  }}
                >
                  {showRank ? rank : null}
                </span>
                <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }} aria-hidden>
                  {city.flag}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#f0ede8',
                      lineHeight: 1.2,
                      marginBottom: 2,
                    }}
                  >
                    {city.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>
                    {city.country}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 26,
                    fontWeight: 700,
                    color,
                    lineHeight: 1,
                  }}
                >
                  {city.score}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(240,237,232,0.45)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginTop: 4,
                  }}
                >
                  match score
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
