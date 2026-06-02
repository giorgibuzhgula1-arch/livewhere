export const SALARY_CLUSTER_NAME = 'Salary Cluster'

export const SALARY_CLUSTER_BUDGETS = [2000, 3000, 5000, 8000, 10000] as const

export type SalaryClusterBudget = (typeof SALARY_CLUSTER_BUDGETS)[number]

export function salaryClusterSlug(budget: SalaryClusterBudget | number): string {
  return `best-cities-for-${budget}-month-budget-2026`
}

export function salaryClusterTitle(budget: SalaryClusterBudget | number): string {
  return `Best Cities for $${budget.toLocaleString('en-US')}/Month Budget in 2026`
}

export function salaryClusterPath(budget: SalaryClusterBudget | number): string {
  return `/city-guides/${salaryClusterSlug(budget)}`
}

export const SALARY_CLUSTER_LINKS = SALARY_CLUSTER_BUDGETS.map((budget) => ({
  budget,
  slug: salaryClusterSlug(budget),
  title: salaryClusterTitle(budget),
  path: salaryClusterPath(budget),
}))

/** Markdown block linking every Salary Cluster guide (blank line between links). */
export function salaryClusterRelatedGuidesMarkdown(): string {
  return SALARY_CLUSTER_LINKS.map(
    ({ title, path }) => `[${title}](${path})`
  ).join('\n\n')
}
