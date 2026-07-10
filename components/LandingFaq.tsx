'use client'

import { useState } from 'react'
import { fontFamilySans, fontFamilySerif } from '@/lib/fonts'

const ACCENT = '#c8f05a'

const FAQ_ITEMS = [
  {
    question: 'What makes LiveWhere different from Google, ChatGPT or Numbeo?',
    answer:
      'Google gives you information. ChatGPT gives you suggestions. Numbeo gives you data. LiveWhere combines all of that into one personalized analysis based on your budget, lifestyle and long-term goals—so you can make one confident decision.',
  },
  {
    question: 'How much could I actually save by relocating?',
    answer:
      'It depends on where you live today and where you move. Many people discover they could reduce their long-term living costs by tens or even hundreds of thousands of dollars over the next decade. Your personalized analysis shows your estimated savings.',
  },
  {
    question: 'Can I compare cities before I move?',
    answer:
      'Yes. Compare cities side by side across cost of living, taxes, healthcare, safety, climate and more—so you can understand the trade-offs before making a life-changing decision.',
  },
  {
    question: 'Is the analysis really free?',
    answer:
      'Yes. Your first analysis is completely free. If you want unlimited searches, detailed comparisons and advanced planning tools, you can upgrade at any time.',
  },
  {
    question: 'What do I get if I upgrade?',
    answer:
      'Pro unlocks every city, unlimited comparisons and advanced AI insights. Blueprint adds a personalized relocation report, long-term financial projections, risk analysis and ongoing monitoring—giving you everything you need to plan your move with confidence.',
  },
  {
    question: 'Where does LiveWhere get its data?',
    answer:
      'We combine data from trusted global sources, including government agencies, international organizations and continuously updated cost-of-living datasets. Every recommendation is built using multiple data points—not opinions.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'We continuously monitor changes in cost of living, taxes, healthcare, visas and other relocation factors to keep recommendations as accurate and up to date as possible.',
  },
] as const

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={open ? ACCENT : 'rgba(240, 237, 232, 0.45)'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        flexShrink: 0,
        transition: 'transform 0.2s ease',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function LandingFaq() {
  const [listExpanded, setListExpanded] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  function toggleList() {
    setListExpanded((prev) => {
      if (prev) setOpenIndex(null)
      return !prev
    })
  }

  return (
    <section
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '80px 24px 100px',
        position: 'relative',
        zIndex: 1,
      }}
      aria-labelledby="landing-faq-heading"
    >
      <h2
        id="landing-faq-heading"
        style={{
          fontFamily: fontFamilySerif,
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: '#f0ede8',
          textAlign: 'center',
          margin: '0 0 40px',
        }}
      >
        Frequently Asked Questions
      </h2>

      <button
        type="button"
        onClick={toggleList}
        aria-expanded={listExpanded}
        aria-controls="landing-faq-list"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '18px 20px',
          marginBottom: listExpanded ? 12 : 0,
          background: listExpanded ? 'rgba(200, 240, 90, 0.04)' : '#12121a',
          border: `1px solid ${listExpanded ? 'rgba(200, 240, 90, 0.35)' : 'rgba(255, 255, 255, 0.07)'}`,
          borderRadius: 16,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: fontFamilySans,
          transition: 'border-color 0.2s ease, background 0.2s ease',
        }}
      >
        <span
          style={{
            fontSize: 'clamp(15px, 2.5vw, 17px)',
            fontWeight: 600,
            lineHeight: 1.45,
            color: listExpanded ? ACCENT : '#f0ede8',
            transition: 'color 0.2s ease',
          }}
        >
          {listExpanded ? 'Hide Questions' : 'View Frequently Asked Questions'}
        </span>
        <ChevronIcon open={listExpanded} />
      </button>

      {listExpanded && (
      <div
        id="landing-faq-list"
        className="landing-faq-scroll"
        style={{
          maxHeight: 520,
          overflowY: 'auto',
          paddingRight: 6,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          const panelId = `faq-panel-${index}`
          const buttonId = `faq-button-${index}`

          return (
            <div
              key={item.question}
              style={{
                background: '#12121a',
                border: `1px solid ${isOpen ? 'rgba(200, 240, 90, 0.35)' : 'rgba(255, 255, 255, 0.07)'}`,
                borderRadius: 16,
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
              }}
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '18px 20px',
                  background: isOpen ? 'rgba(200, 240, 90, 0.04)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: fontFamilySans,
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(15px, 2.5vw, 17px)',
                    fontWeight: 600,
                    lineHeight: 1.45,
                    color: isOpen ? ACCENT : '#f0ede8',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.question}
                </span>
                <ChevronIcon open={isOpen} />
              </button>

              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  style={{
                    padding: '0 20px 20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: fontFamilySans,
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: 'rgba(240, 237, 232, 0.72)',
                      margin: '16px 0 0',
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
      )}

      <style>{`
        .landing-faq-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) rgba(255, 255, 255, 0.04);
        }
        .landing-faq-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .landing-faq-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 3px;
        }
        .landing-faq-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 3px;
        }
      `}</style>
    </section>
  )
}
