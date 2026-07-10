import Link from 'next/link'
import styles from '@/app/legal/legal.module.css'

export type LegalSection = {
  heading: string
  paragraphs?: string[]
  listItems?: string[]
}

type Props = {
  title: string
  sections: LegalSection[]
}

export default function LegalPageLayout({ title, sections }: Props) {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Back to LiveWhere
      </Link>

      <h1 className={styles.title}>{title}</h1>

      {sections.map((section) => (
        <section key={section.heading} className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className={styles.body}>
              {paragraph}
            </p>
          ))}
          {section.listItems && section.listItems.length > 0 && (
            <ul className={styles.list}>
              {section.listItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  )
}
