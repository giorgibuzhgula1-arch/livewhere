import styles from './relocation-journey.module.css'

const STAGES = [
  { label: 'Research', complete: true },
  { label: 'Decision', complete: true },
  { label: 'Planning', complete: false },
  { label: 'Preparing Documents', complete: false },
  { label: 'Moving', complete: false },
  { label: 'Settled', complete: false },
] as const

export default function RelocationJourney() {
  return (
    <section className={styles.section} aria-label="Your Relocation Journey">
      <h2 className={styles.heading}>Your Relocation Journey</h2>

      <div className={styles.track}>
        {STAGES.map((stage, index) => (
          <div key={stage.label} className={styles.stage}>
            {index > 0 && <span className={styles.connector} aria-hidden />}
            <div
              className={stage.complete ? styles.markerComplete : styles.markerIncomplete}
              aria-hidden
            >
              {stage.complete ? (
                <span className={styles.check}>✓</span>
              ) : (
                <span className={styles.empty}>⬜</span>
              )}
            </div>
            <p className={styles.label}>{stage.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
