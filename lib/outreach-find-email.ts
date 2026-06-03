export function buildFindEmailGoogleUrl(channelName: string): string {
  const query = `"${channelName.trim()}" business email contact`
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

export function openFindEmailSearch(channelName: string): void {
  window.open(buildFindEmailGoogleUrl(channelName), '_blank', 'noopener,noreferrer')
}
