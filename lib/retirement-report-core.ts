import { jsPDF } from 'jspdf'
import { CityResult } from '@/lib/types'
import { visaScoreForCountry } from '@/lib/visa-data'
import { tenYearProjection, riskAssessment, wealthPreservation } from '@/lib/retirement-projections'

const MARGIN = 48
const FOOTER_Y_OFFSET = 24
const LINE_HEIGHT = 14

function fmtUsd(n: number): string {
  return `$${n.toLocaleString()}`
}

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[]
  for (const line of lines) {
    doc.text(line, x, y)
    y += LINE_HEIGHT
  }
  return y
}

function reportDateLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function citiesByTaxRate(cities: CityResult[]): CityResult[] {
  return [...cities].sort((a, b) => a.taxRate - b.taxRate)
}

function buildTaxTakeaway(cities: CityResult[]): string {
  if (cities.length === 0) return ''
  if (cities.length === 1) {
    const city = cities[0]
    return `${city.name} has a tax rate of ${city.taxRate}% among your saved matches.`
  }

  const sorted = citiesByTaxRate(cities)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]

  if (lowest.taxRate === highest.taxRate) {
    return `All ${cities.length} of your matches share the same effective tax rate of ${lowest.taxRate}%.`
  }

  return `${lowest.name} offers the lowest tax burden among your matches at ${lowest.taxRate}%, compared to ${highest.name} at ${highest.taxRate}%.`
}

export function retirementReportFilename(): string {
  const slug = reportDateLabel().replace(/\s+/g, '-').toLowerCase()
  return `livewhere-relocation-blueprint-${slug}.pdf`
}

export function generateRetirementReportPdf(
  cities: CityResult[],
  budget: number,
  options?: { lifetime?: boolean },
): Buffer {
  const includeLifetimeInsights = options?.lifetime === true
  const unlocked = cities.filter((city) => !city.locked)
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2
  let y = MARGIN

  const drawFooter = () => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text('livewhere.io', pageWidth / 2, pageHeight - FOOTER_Y_OFFSET, { align: 'center' })
  }

  const startNewPage = () => {
    drawFooter()
    doc.addPage()
    y = MARGIN
  }

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - FOOTER_Y_OFFSET - 12) {
      startNewPage()
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(20, 20, 20)
  doc.text('LiveWhere Relocation Blueprint', MARGIN, y)
  y += 28

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(reportDateLabel(), MARGIN, y)
  y += LINE_HEIGHT
  if (budget > 0) {
    doc.text(`Monthly budget: ${fmtUsd(budget)}`, MARGIN, y)
    y += LINE_HEIGHT
  }
  y += 10

  if (includeLifetimeInsights && unlocked.length > 0) {
    const taxSorted = citiesByTaxRate(unlocked)

    ensureSpace(80)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(20, 20, 20)
    doc.text('Tax Comparison', MARGIN, y)
    y += 20

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('City', MARGIN, y)
    doc.text('Country', MARGIN + 180, y)
    doc.text('Tax Rate', MARGIN + 360, y)
    y += LINE_HEIGHT

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    for (const city of taxSorted) {
      ensureSpace(LINE_HEIGHT + 2)
      doc.text(city.name, MARGIN, y)
      doc.text(city.country, MARGIN + 180, y)
      doc.text(`${city.taxRate}%`, MARGIN + 360, y)
      y += LINE_HEIGHT
    }

    y += 6
    const takeaway = buildTaxTakeaway(unlocked)
    if (takeaway) {
      ensureSpace(LINE_HEIGHT * 3)
      y = wrapText(doc, takeaway, MARGIN, y, contentWidth)
    }

    y += 16
    doc.setDrawColor(210, 210, 210)
    doc.line(MARGIN, y, pageWidth - MARGIN, y)
    y += 18
  }

  unlocked.forEach((city, index) => {
    ensureSpace(200)

    if (index > 0) {
      doc.setDrawColor(210, 210, 210)
      doc.line(MARGIN, y, pageWidth - MARGIN, y)
      y += 18
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(20, 20, 20)
    doc.text(`${city.name}, ${city.country}`, MARGIN, y)
    y += 20

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)

    const visaScore = visaScoreForCountry(city.country)
    const stats = [
      `Match score: ${city.score}`,
      `Monthly cost: ${fmtUsd(city.monthlyCost)}`,
      `Monthly savings: ${city.monthlySavings >= 0 ? '+' : '-'}${fmtUsd(Math.abs(city.monthlySavings))}`,
      `Tax rate: ${city.taxRate}%`,
      `Visa difficulty score: ${visaScore ?? 'N/A'}${visaScore != null ? '/100' : ''}`,
    ]

    for (const stat of stats) {
      ensureSpace(LINE_HEIGHT + 2)
      doc.text(stat, MARGIN, y)
      y += LINE_HEIGHT
    }

    y += 6

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    doc.text('Top pros', MARGIN, y)
    y += LINE_HEIGHT

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    const pros = city.pros.slice(0, 3)
    if (pros.length === 0) {
      ensureSpace(LINE_HEIGHT)
      doc.text('—', MARGIN, y)
      y += LINE_HEIGHT
    } else {
      for (const pro of pros) {
        ensureSpace(LINE_HEIGHT * 2)
        y = wrapText(doc, `• ${pro}`, MARGIN, y, contentWidth)
      }
    }

    y += 4

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    doc.text('Top cons', MARGIN, y)
    y += LINE_HEIGHT

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    const cons = city.cons.slice(0, 3)
    if (cons.length === 0) {
      ensureSpace(LINE_HEIGHT)
      doc.text('—', MARGIN, y)
      y += LINE_HEIGHT
    } else {
      for (const con of cons) {
        ensureSpace(LINE_HEIGHT * 2)
        y = wrapText(doc, `• ${con}`, MARGIN, y, contentWidth)
      }
    }

    if (includeLifetimeInsights) {
      const projection = tenYearProjection(city, budget)
      const risk = riskAssessment(city)
      const wealth = wealthPreservation(city, budget)

      y += 8
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 20, 20)
      doc.text('10-Year Projection', MARGIN, y)
      y += LINE_HEIGHT

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(40, 40, 40)
      const projectionLines = [
        `Total accumulated savings: ${fmtUsd(projection.totalAccumulatedSavings)}`,
        `Average monthly savings: ${fmtUsd(projection.averageMonthlySavings)}`,
        `Final monthly savings: ${fmtUsd(projection.finalMonthlySavings)}`,
      ]
      for (const line of projectionLines) {
        ensureSpace(LINE_HEIGHT + 2)
        doc.text(line, MARGIN, y)
        y += LINE_HEIGHT
      }

      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 20, 20)
      doc.text('Risk Assessment', MARGIN, y)
      y += LINE_HEIGHT

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(40, 40, 40)
      const riskLines = [
        `Overall risk: ${risk.level}`,
        `Political stability: ${risk.politicalStability}/100`,
        `Healthcare index: ${risk.healthcareIndex}/100`,
        `Currency risk: ${risk.currencyRisk}/100`,
        `Visa permanence: ${risk.visaPermanence}/100`,
      ]
      for (const line of riskLines) {
        ensureSpace(LINE_HEIGHT + 2)
        doc.text(line, MARGIN, y)
        y += LINE_HEIGHT
      }

      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 20, 20)
      doc.text('Wealth Preservation', MARGIN, y)
      y += LINE_HEIGHT

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(40, 40, 40)
      const wealthLines = [
        `Preservation score: ${wealth.preservationScore}/100`,
        `Tax drag vs US baseline: ${wealth.taxDragVsUsMonthly >= 0 ? '+' : '-'}${fmtUsd(Math.abs(wealth.taxDragVsUsMonthly))}/mo`,
        `US baseline tax: ${wealth.usBaselineTaxRate}%`,
        `Destination tax: ${wealth.destinationTaxRate}%`,
      ]
      for (const line of wealthLines) {
        ensureSpace(LINE_HEIGHT + 2)
        doc.text(line, MARGIN, y)
        y += LINE_HEIGHT
      }
    }

    y += 16
  })

  drawFooter()

  return Buffer.from(doc.output('arraybuffer') as ArrayBuffer)
}
