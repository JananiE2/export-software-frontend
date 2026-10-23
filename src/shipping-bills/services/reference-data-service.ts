import { documentCodes } from '@/data/e-sanchit-codes'
import { quantityCodes } from '@/data/quantity-code'
import rawSchemeCodes from '@/data/scheme-codes'
import { stateOptions } from '@/data/states'
import { Trades } from '@/data/trade-agrements'
import {
  cargoOptions,
  contractTypes,
  paymentTypes,
  priceInclusionTypes,
  sealTypes,
  weightUnits
} from '@/data/types'
import { loadingPorts, PortOption, ports } from '../model'

export interface SelectOption<T = string> {
  value: T
  label: string
  sublabel?: string
}

export interface SchemeCodeOption extends SelectOption<string> {
  drawback?: boolean
  RODTEP?: boolean
  ROSCTL?: boolean
}

const MOCK_NETWORK_DELAY = 120

function simulateDelay<T>(data: T, delayMs = MOCK_NETWORK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs))
}

const marksByExporter: Record<string, SelectOption<string>[]> = {
  '1000': [
    { value: 'AARAV TEXTILES / MADE IN INDIA', label: 'AARAV TEXTILES / MADE IN INDIA' },
    { value: 'ATPL / LOT NO. ______', label: 'ATPL / LOT NO. ______' }
  ],
  '1002': [
    { value: 'BLUE HARBOR EXPORTS / INDIA', label: 'BLUE HARBOR EXPORTS / INDIA' },
    { value: 'BHE / SHIPPING MARKS AS PER INVOICE', label: 'BHE / SHIPPING MARKS AS PER INVOICE' }
  ],
  '1010': [
    { value: 'APEX GARMENTS / SURAT / INDIA', label: 'APEX GARMENTS / SURAT / INDIA' },
    { value: 'APEX / CTN NO. 1 UPWARDS', label: 'APEX / CTN NO. 1 UPWARDS' }
  ],
  '1020': [
    { value: 'ZENITH SPICES / KOCHI EXPORT', label: 'ZENITH SPICES / KOCHI EXPORT' },
    { value: 'ZSAC / AGRI GRADE 1', label: 'ZSAC / AGRI GRADE 1' }
  ],
  '1030': [
    { value: 'TITANIUM ENGG / PUNE / INDIA', label: 'TITANIUM ENGG / PUNE / INDIA' },
    { value: 'TEW / PRECISION PARTS', label: 'TEW / PRECISION PARTS' }
  ]
}

const currencyList: SelectOption<string>[] = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' }
]

const nfeiCategoryList: SelectOption<string>[] = [
  { value: '01', label: '01 - Free trade sample' },
  { value: '02', label: '02 - Diplomatic goods' },
  { value: '03', label: '03 - Warranty replacement' },
  { value: '07', label: '07 - Gift parcel' },
  { value: '08', label: '08 - Other' }
]

const containerSizeList: SelectOption<string>[] = [
  { value: '20', label: '20 ft Standard' },
  { value: '40', label: '40 ft Standard' },
  { value: '45', label: '45 ft High Cube' }
]

const containerSealTypeList: SelectOption<number>[] = [
  { value: 1, label: 'BTSL - Bottle Seal' },
  { value: 2, label: 'ESEAL - Electronic Seal' },
  { value: 3, label: 'RFID - Radio Frequency Identifier' }
]

const igstPaymentList: SelectOption<string>[] = [
  { value: 'NA', label: 'Not applicable' },
  { value: 'LUT', label: 'Under LUT / bond' },
  { value: 'P', label: 'Against payment' }
]

const accessoryStatusList: SelectOption<string>[] = [
  { value: '0', label: 'No accessory' },
  { value: '1', label: 'Included free of cost' },
  { value: '2', label: 'Entered separately' }
]

const goodsSourceList: SelectOption<string>[] = [
  { value: 'I', label: 'Imported' },
  { value: 'D', label: 'Indigenous' }
]

export const referenceDataService = {
  /**
   * Fetch scheme codes with optional query filtering
   */
  async getSchemeCodes(query = ''): Promise<SchemeCodeOption[]> {
    const q = query.trim().toLowerCase()
    const list = rawSchemeCodes as SchemeCodeOption[]
    if (!q) return simulateDelay(list)
    const filtered = list.filter(
      (item) => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    )
    return simulateDelay(filtered)
  },

  /**
   * Fetch quantity codes / units of measurement
   */
  async getQuantityCodes(query = ''): Promise<SelectOption<string>[]> {
    const q = query.trim().toLowerCase()
    if (!q) return simulateDelay(quantityCodes)
    const filtered = quantityCodes.filter(
      (item) => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    )
    return simulateDelay(filtered)
  },

  /**
   * Fetch e-Sanchit supporting document codes
   */
  async getDocumentCodes(query = ''): Promise<SelectOption<string>[]> {
    const q = query.trim().toLowerCase()
    if (!q) return simulateDelay(documentCodes)
    const filtered = documentCodes.filter(
      (item) => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    )
    return simulateDelay(filtered)
  },

  /**
   * Fetch Indian states & codes
   */
  async getStateOptions(query = ''): Promise<SelectOption<number>[]> {
    const q = query.trim().toLowerCase()
    if (!q) return simulateDelay(stateOptions)
    const filtered = stateOptions.filter((item) => item.label.toLowerCase().includes(q))
    return simulateDelay(filtered)
  },

  /**
   * Fetch Trade Agreements
   */
  async getTradeAgreements(query = ''): Promise<SelectOption<string>[]> {
    const q = query.trim().toLowerCase()
    if (!q) return simulateDelay(Trades)
    const filtered = Trades.filter(
      (item) => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    )
    return simulateDelay(filtered)
  },

  /**
   * Fetch supported currencies
   */
  async getCurrencies(): Promise<SelectOption<string>[]> {
    return simulateDelay(currencyList, 60)
  },

  /**
   * Fetch cargo nature options
   */
  async getCargoOptions(): Promise<SelectOption<string>[]> {
    return simulateDelay(cargoOptions, 60)
  },

  /**
   * Fetch contract types (FOB, CIF, etc.)
   */
  async getContractTypes(): Promise<SelectOption<string>[]> {
    return simulateDelay(contractTypes, 60)
  },

  /**
   * Fetch weight units (KG, MT, lb, etc.)
   */
  async getWeightUnits(): Promise<SelectOption<string>[]> {
    return simulateDelay(weightUnits, 60)
  },

  /**
   * Fetch payment types (DP, AP, LC, etc.)
   */
  async getPaymentTypes(): Promise<SelectOption<string>[]> {
    return simulateDelay(paymentTypes, 60)
  },

  /**
   * Fetch price inclusion types
   */
  async getPriceInclusionTypes(): Promise<SelectOption<string>[]> {
    return simulateDelay(priceInclusionTypes, 60)
  },

  /**
   * Fetch seal types
   */
  async getSealTypes(): Promise<SelectOption<string>[]> {
    return simulateDelay(sealTypes, 60)
  },

  /**
   * Fetch NFEI categories
   */
  async getNfeiCategories(): Promise<SelectOption<string>[]> {
    return simulateDelay(nfeiCategoryList, 60)
  },

  /**
   * Fetch Container Sizes
   */
  async getContainerSizes(): Promise<SelectOption<string>[]> {
    return simulateDelay(containerSizeList, 60)
  },

  /**
   * Fetch Container Seal Types
   */
  async getContainerSealTypes(): Promise<SelectOption<number>[]> {
    return simulateDelay(containerSealTypeList, 60)
  },

  /**
   * Fetch IGST Payment Statuses
   */
  async getIgstPaymentStatuses(): Promise<SelectOption<string>[]> {
    return simulateDelay(igstPaymentList, 60)
  },

  /**
   * Fetch Accessory Statuses
   */
  async getAccessoryStatuses(): Promise<SelectOption<string>[]> {
    return simulateDelay(accessoryStatusList, 60)
  },

  /**
   * Fetch Goods Sources (Imported / Indigenous)
   */
  async getGoodsSources(): Promise<SelectOption<string>[]> {
    return simulateDelay(goodsSourceList, 60)
  },

  /**
   * Fetch Port of Loading (Indian ports) or Final Destination Ports
   */
  async getPorts(query = '', indianOnly = false): Promise<PortOption[]> {
    const list = indianOnly ? loadingPorts : [...loadingPorts, ...ports]
    const q = query.trim().toLowerCase()
    if (!q) return simulateDelay(list)
    const filtered = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    )
    return simulateDelay(filtered)
  },

  /**
   * Fetch Port by Code
   */
  async getPortByCode(code: string): Promise<PortOption | undefined> {
    const all = [...loadingPorts, ...ports]
    const found = all.find((p) => p.code.toUpperCase() === code.trim().toUpperCase())
    return simulateDelay(found, 50)
  },

  /**
   * Fetch Marks and Numbers options for an exporter
   */
  async getMarksAndNumbers(exporterId: string): Promise<SelectOption<string>[]> {
    if (!exporterId) return simulateDelay([])
    const options = marksByExporter[exporterId] ?? [
      { value: `EXP-${exporterId} / STANDARD EXPORT MARKS`, label: `EXP-${exporterId} / STANDARD EXPORT MARKS` }
    ]
    return simulateDelay(options)
  }
}
