import { getDemoData, saveBranch, saveBusiness, saveExporter } from '../demo-store'
import { Branch, Business, Exporter } from '../model'

const MOCK_DELAY_MS = 150

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export const partyService = {
  /**
   * Search active Exporters by name or IEC
   */
  async searchExporters(query = ''): Promise<Exporter[]> {
    const { exporters } = getDemoData()
    const q = query.trim().toLowerCase()
    const filtered = exporters.filter(
      (item) => !item.disabled && (!q || item.name.toLowerCase().includes(q) || item.iec.toLowerCase().includes(q))
    )
    return delay(filtered)
  },

  /**
   * Fetch single Exporter by ID
   */
  async getExporterById(exporterId: string | number): Promise<Exporter | undefined> {
    const { exporters } = getDemoData()
    const found = exporters.find((item) => String(item.id) === String(exporterId))
    return delay(found, 60)
  },

  /**
   * Search Branches belonging to an Exporter
   */
  async searchExporterBranches(exporterId: string | number, query = ''): Promise<Branch[]> {
    if (!exporterId) return delay([])
    const { exporters } = getDemoData()
    const exporter = exporters.find((item) => String(item.id) === String(exporterId))
    if (!exporter) return delay([])

    const q = query.trim().toLowerCase()
    const filtered = exporter.branches.filter(
      (branch) =>
        !q ||
        branch.branchName.toLowerCase().includes(q) ||
        branch.city.toLowerCase().includes(q) ||
        (branch.state && branch.state.toLowerCase().includes(q))
    )
    return delay(filtered)
  },

  /**
   * Search Consignees by name
   */
  async searchConsignees(query = ''): Promise<Business[]> {
    const { businesses } = getDemoData()
    const q = query.trim().toLowerCase()
    const filtered = businesses.filter(
      (item) => item.isConsignee && (!q || item.name.toLowerCase().includes(q) || (item.iec && item.iec.toLowerCase().includes(q)))
    )
    return delay(filtered)
  },

  /**
   * Fetch single Consignee by ID
   */
  async getConsigneeById(consigneeId: string | number): Promise<Business | undefined> {
    const { businesses } = getDemoData()
    const found = businesses.find((item) => String(item.id) === String(consigneeId))
    return delay(found, 60)
  },

  /**
   * Search Branches belonging to a Consignee
   */
  async searchConsigneeBranches(consigneeId: string | number, query = ''): Promise<Branch[]> {
    if (!consigneeId) return delay([])
    const { businesses } = getDemoData()
    const consignee = businesses.find((item) => String(item.id) === String(consigneeId))
    if (!consignee) return delay([])

    const q = query.trim().toLowerCase()
    const filtered = consignee.branches.filter(
      (branch) =>
        !q ||
        branch.branchName.toLowerCase().includes(q) ||
        branch.city.toLowerCase().includes(q) ||
        (branch.state && branch.state.toLowerCase().includes(q))
    )
    return delay(filtered)
  },

  /**
   * Search Buyers by name
   */
  async searchBuyers(query = ''): Promise<Business[]> {
    const { businesses } = getDemoData()
    const q = query.trim().toLowerCase()
    const filtered = businesses.filter(
      (item) => item.isBuyer && (!q || item.name.toLowerCase().includes(q))
    )
    return delay(filtered)
  },

  /**
   * Search Third-Party entities by name
   */
  async searchThirdParties(query = ''): Promise<Business[]> {
    const { businesses } = getDemoData()
    const q = query.trim().toLowerCase()
    const filtered = businesses.filter(
      (item) => item.isThirdParty && (!q || item.name.toLowerCase().includes(q))
    )
    return delay(filtered)
  },

  /**
   * Save or update an Exporter
   */
  async saveExporter(exporterData: Parameters<typeof saveExporter>[0]): Promise<Exporter> {
    const saved = saveExporter(exporterData)
    return delay(saved, 100)
  },

  /**
   * Save or update a Business
   */
  async saveBusiness(businessData: Parameters<typeof saveBusiness>[0]): Promise<Business> {
    const saved = saveBusiness(businessData)
    return delay(saved, 100)
  },

  /**
   * Save branch for an exporter or business
   */
  async saveBranch(
    kind: 'exporter' | 'business',
    ownerId: number,
    branch: Omit<Branch, 'id'> & { id?: number }
  ): Promise<Branch> {
    const saved = saveBranch(kind, ownerId, branch)
    return delay(saved, 100)
  }
}
