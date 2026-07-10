import type { Metadata } from 'next'
import LegalPageLayout, { type LegalSection } from '@/components/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Terms of Service — LiveWhere',
  description: 'LiveWhere Terms of Service.',
  alternates: {
    canonical: '/terms',
  },
}

const SECTIONS: LegalSection[] = [
  {
    heading: 'Acceptance of Terms',
    paragraphs: [
      'By accessing or using LiveWhere, you agree to these Terms of Service. If you do not agree, please do not use the Service.',
    ],
  },
  {
    heading: 'About LiveWhere',
    paragraphs: [
      'LiveWhere provides personalized relocation insights, city comparisons and planning tools to help users make informed relocation decisions.',
      'The information provided is for informational purposes only and should not be considered legal, financial, tax or immigration advice.',
    ],
  },
  {
    heading: 'User Accounts',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.',
    ],
  },
  {
    heading: 'Payments',
    paragraphs: [
      'Some features require a paid subscription or one-time purchase.',
      'All payments are securely processed by Stripe.',
    ],
  },
  {
    heading: 'Refunds',
    paragraphs: [
      'If you experience technical issues preventing you from accessing your purchase, please contact us.',
      'Refund requests are reviewed individually.',
    ],
  },
  {
    heading: 'Intellectual Property',
    paragraphs: [
      'All content, software, branding, algorithms and designs on LiveWhere remain the property of LiveWhere.',
      'You may not copy, reproduce or redistribute any part of the Service without permission.',
    ],
  },
  {
    heading: 'Limitation of Liability',
    paragraphs: [
      'LiveWhere is provided "as is."',
      'We make reasonable efforts to provide accurate information but cannot guarantee completeness or accuracy.',
      'You are responsible for your relocation decisions.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'We may update these Terms from time to time.',
      'Continued use of the Service constitutes acceptance of the updated Terms.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: ['Questions? support@livewhere.io'],
  },
]

export default function TermsPage() {
  return <LegalPageLayout title="Terms of Service" sections={SECTIONS} />
}
