import { CityResult } from '@/lib/types'
import {
  generateRetirementReportPdf,
  retirementReportFilename,
} from '@/lib/retirement-report-core'

function downloadPdfInBrowser(pdf: Buffer, filename: string): void {
  const blob = new Blob([new Uint8Array(pdf)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function exportRetirementReport(
  cities: CityResult[],
  budget: number,
  options?: { lifetime?: boolean },
): Promise<void> {
  const pdf = generateRetirementReportPdf(cities, budget, options)
  downloadPdfInBrowser(pdf, retirementReportFilename())
}
