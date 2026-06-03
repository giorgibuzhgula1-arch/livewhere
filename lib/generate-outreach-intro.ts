const OPENAI_MODEL = 'gpt-4o-mini'

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function truncateToMaxWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return words.join(' ')
  return `${words.slice(0, maxWords).join(' ')}.`
}

export function outreachFirstName(channelName: string): string {
  const cleaned = channelName
    .replace(/\s*[-|•·].*$/i, '')
    .replace(/[@#]/g, ' ')
    .trim()
  const first = cleaned.split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, '') ?? ''
  if (first.length >= 2) {
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  return 'there'
}

function fallbackIntro(channelName: string): string {
  return `I have been watching ${channelName} and think your audience would find LiveWhere useful when comparing cities and cost of living.`
}

export async function generateOutreachIntro(params: {
  channelName: string
  videoTitles: string[]
}): Promise<string> {
  if (!params.videoTitles.length) {
    return fallbackIntro(params.channelName)
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    const topic = params.videoTitles[0]?.replace(/\s+/g, ' ').trim()
    return truncateToMaxWords(
      `Your recent video on ${topic} made me think LiveWhere could help your audience compare cities and living costs.`,
      40
    )
  }

  const titlesList = params.videoTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'You write short, natural outreach email intros. No hype, no flattery, no exclamation marks. Mention one specific topic from the creator\'s recent videos. Connect it naturally to LiveWhere (city discovery by cost of living, taxes, climate, lifestyle). Maximum 40 words. Return only the intro sentence(s), no quotes.',
        },
        {
          role: 'user',
          content: `Creator: ${params.channelName}\nRecent YouTube videos:\n${titlesList}`,
        },
      ],
    }),
  })

  if (!res.ok) {
    console.error('OpenAI outreach intro failed:', res.status)
    return fallbackIntro(params.channelName)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const raw = data.choices?.[0]?.message?.content?.trim()
  if (!raw) return fallbackIntro(params.channelName)

  const intro = raw.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ')
  return truncateToMaxWords(intro, 40)
}
