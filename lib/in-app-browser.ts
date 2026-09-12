const IN_APP_UA =
  /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FBSS|TikTok|musical_ly|BytedanceWebview|Line\/|Twitter|LinkedInApp|Snapchat|Pinterest/i

export function isInAppBrowser(userAgent?: string): boolean {
  const ua =
    userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  return IN_APP_UA.test(ua)
}
