import { useEffect } from 'react'
import { useForm } from 'core/form'
import { partyService } from '../services/party-service'
import { AsyncCombobox } from './common/async-combobox'
import { ShippingBillFormValues } from '../model'

export type BranchPath =
  | 'exporterBranchId'
  | 'consigneeBranchId'
  | `invoices.${number}.buyerBranchId`
  | `invoices.${number}.thirdPartyBranchId`
  | `invoices.${number}.items.${number}.itemThirdPartyBranchId`

export type OwnerPath =
  | 'exporterId'
  | 'consigneeId'
  | `invoices.${number}.buyerId`
  | `invoices.${number}.thirdPartyId`
  | `invoices.${number}.items.${number}.itemThirdPartyId`

interface PartySelectorProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  ownerName: OwnerPath
  branchName: BranchPath
  label: string
  kind: 'exporter' | 'business'
  role?: 'consignee' | 'buyer' | 'thirdParty'
  required?: boolean
  onAddBranch: (ownerId: number) => void
  onQuickAdd: () => void
}

export function PartySelector({
  formCtx,
  ownerName,
  branchName,
  label,
  kind,
  role = 'consignee',
  required = true,
  onAddBranch,
  onQuickAdd
}: PartySelectorProps) {
  const ownerId = formCtx.hooks.watch(ownerName as any)
  const branchId = formCtx.hooks.watch(branchName as any)

  // Reset branch if owner changes and branch doesn't belong to owner
  useEffect(() => {
    if (!ownerId && branchId) {
      formCtx.hooks.setValue(branchName as any, '', { shouldValidate: true })
      return
    }

    if (ownerId && branchId) {
      const checkBranch = async () => {
        const branches =
          kind === 'exporter'
            ? await partyService.searchExporterBranches(ownerId)
            : await partyService.searchConsigneeBranches(ownerId)
        if (!branches.some((b) => String(b.id) === String(branchId))) {
          formCtx.hooks.setValue(branchName as any, '', { shouldValidate: true })
        }
      }
      void checkBranch()
    }
  }, [ownerId, branchName, formCtx.hooks, kind, branchId])

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800">{label}</span>
          <button
            type="button"
            className="text-primary-600 text-xs font-medium hover:underline focus:outline-none"
            onClick={onQuickAdd}>
            + Add new
          </button>
        </div>
        <AsyncCombobox
          name={ownerName}
          placeholder={`Search & select ${kind}...`}
          rules={{ required }}
          fetchOptions={async (query) => {
            if (kind === 'exporter') {
              const res = await partyService.searchExporters(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name,
                sublabel: item.iec ? `IEC: ${item.iec}` : undefined
              }))
            } else if (role === 'buyer') {
              const res = await partyService.searchBuyers(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name
              }))
            } else if (role === 'thirdParty') {
              const res = await partyService.searchThirdParties(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name
              }))
            } else {
              const res = await partyService.searchConsignees(query)
              return res.map((item) => ({
                value: String(item.id),
                label: item.name
              }))
            }
          }}
          getInitialLabel={async (id) => {
            if (kind === 'exporter') {
              const item = await partyService.getExporterById(id)
              return item ? item.name : ''
            } else {
              const item = await partyService.getConsigneeById(id)
              return item ? item.name : ''
            }
          }}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800">Branch / address</span>
          {ownerId && (
            <button
              type="button"
              className="text-primary-600 text-xs font-medium hover:underline focus:outline-none"
              onClick={() => onAddBranch(Number(ownerId))}>
              + Add branch
            </button>
          )}
        </div>
        <AsyncCombobox
          name={branchName}
          placeholder={ownerId ? 'Search & select branch...' : `Choose ${kind} first`}
          disabled={!ownerId}
          rules={{ required: required || Boolean(ownerId) }}
          deps={[ownerId]}
          fetchOptions={async (query) => {
            if (!ownerId) return []
            const branches =
              kind === 'exporter'
                ? await partyService.searchExporterBranches(ownerId, query)
                : await partyService.searchConsigneeBranches(ownerId, query)
            return branches.map((b) => ({
              value: String(b.id),
              label: `${b.branchName} · ${b.city}`,
              sublabel: b.address1 ? `${b.address1}${b.state ? `, ${b.state}` : ''}` : undefined
            }))
          }}
          getInitialLabel={async (bId) => {
            if (!ownerId) return ''
            const branches =
              kind === 'exporter'
                ? await partyService.searchExporterBranches(ownerId)
                : await partyService.searchConsigneeBranches(ownerId)
            const found = branches.find((b) => String(b.id) === String(bId))
            return found ? `${found.branchName} · ${found.city}` : ''
          }}
        />
      </div>
    </div>
  )
}
