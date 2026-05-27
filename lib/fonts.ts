import { DM_Sans, Playfair_Display } from 'next/font/google'

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

/** Use in inline styles so headings pick up next/font (not bare 'Playfair Display'). */
export const fontFamilySans = 'var(--font-dm-sans), sans-serif'
export const fontFamilySerif = 'var(--font-playfair), serif'
