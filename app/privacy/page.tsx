import type { Metadata } from 'next'
import LegalPageLayout, { type LegalSection } from '@/components/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy — LiveWhere',
  description: 'LiveWhere Privacy Policy.',
  alternates: {
    canonical: '/privacy',
  },
}

const SECTIONS: LegalSection[] = [
  {
    heading: 'Information We Collect',
    paragraphs: ['We may collect:'],
    listItems: [
      'Name',
      'Email address',
      'Relocation preferences',
      'Budget',
      'Lifestyle preferences',
      'Usage analytics',
      'Device information',
    ],
  },
  {
    heading: 'How We Use Your Information',
    paragraphs: ['We use your information to:'],
    listItems: [
      'Generate personalized recommendations',
      'Improve LiveWhere',
      'Process payments',
      'Respond to support requests',
      'Send product updates (only if you opt in)',
    ],
  },
  {
    heading: 'Payments',
    paragraphs: [
      'Payments are securely processed by Stripe.',
      'LiveWhere does not store your payment information.',
    ],
  },
  {
    heading: 'Analytics',
    paragraphs: [
      'We use analytics tools such as Google Analytics to understand how visitors use our website.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'LiveWhere uses cookies to improve user experience and analyze website performance.',
      'You can disable cookies through your browser settings.',
    ],
  },
  {
    heading: 'Data Sharing',
    paragraphs: [
      'We do not sell your personal information.',
      'We only share information with trusted service providers necessary to operate LiveWhere.',
    ],
  },
  {
    heading: 'Data Security',
    paragraphs: ['We use industry-standard security measures to protect your information.'],
  },
  {
    heading: 'Your Rights',
    paragraphs: ['You may request to:'],
    listItems: [
      'Access your personal data',
      'Update your information',
      'Delete your account',
      'Request removal of your data',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: ['We may update this Privacy Policy from time to time.'],
  },
  {
    heading: 'Contact',
    paragraphs: ['support@livewhere.io'],
  },
]

export default function PrivacyPage() {
  return <LegalPageLayout title="Privacy Policy" sections={SECTIONS} />
}
