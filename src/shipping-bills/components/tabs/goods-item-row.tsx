import { useEffect, useState } from 'react'
import { useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { lineTotal, ShippingBillFormValues } from '../../model'
import {
  referenceDataService,
  SchemeCodeOption,
  SelectOption
} from '../../services/reference-data-service'
import { AdvancedPanel } from '../common/advanced-panel'
import { PartySelector } from '../party-selector'

const dateType = 'date' as 'text'

interface GoodsItemRowProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  invoiceIndex: number
  itemIndex: number
  invoiceCurrency: string
  canRemove: boolean
  onRemove: () => void
  onQuickAddThirdParty: () => void
  onAddThirdPartyBranch: (ownerId: number) => void
}

export function GoodsItemRow({
  formCtx,
  invoiceIndex,
  itemIndex,
  invoiceCurrency,
  canRemove,
  onRemove,
  onQuickAddThirdParty,
  onAddThirdPartyBranch
}: GoodsItemRowProps) {
  const { register, watch, setValue } = formCtx.hooks
  const item = watch(`invoices.${invoiceIndex}.items.${itemIndex}`)

  // Asynchronous Options State
  const [schemeCodes, setSchemeCodes] = useState<SchemeCodeOption[]>([])
  const [quantityCodes, setQuantityCodes] = useState<SelectOption<string>[]>([])
  const [tradeAgreements, setTradeAgreements] = useState<SelectOption<string>[]>([])
  const [igstStatuses, setIgstStatuses] = useState<SelectOption<string>[]>([])
  const [accessoryStatuses, setAccessoryStatuses] = useState<SelectOption<string>[]>([])

  useEffect(() => {
    let active = true
    Promise.all([
      referenceDataService.getSchemeCodes(),
      referenceDataService.getQuantityCodes(),
      referenceDataService.getTradeAgreements(),
      referenceDataService.getIgstPaymentStatuses(),
      referenceDataService.getAccessoryStatuses()
    ]).then(([schemes, quantities, trades, igst, accessories]) => {
      if (active) {
        setSchemeCodes(schemes)
        setQuantityCodes(quantities)
        setTradeAgreements(trades)
        setIgstStatuses(igst)
        setAccessoryStatuses(accessories)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // Auto-calculate line total when quantity or unitPrice changes (if not manually overridden)
  useEffect(() => {
    const qty = Number(item?.quantity) || 0
    const price = Number(item?.unitPrice) || 0
    const calculated = (qty * price).toFixed(2)
    if (qty > 0 && price > 0 && (!item?.lineTotal || item.lineTotal === '0')) {
      setValue(`invoices.${invoiceIndex}.items.${itemIndex}.lineTotal`, calculated)
    }
  }, [item?.quantity, item?.unitPrice, invoiceIndex, itemIndex, setValue, item?.lineTotal])

  // Determine if selected scheme qualifies for drawback/RoDTEP/RoSCTL
  const selectedScheme = schemeCodes.find((s) => s.value === item?.schemeCode)
  const showDrawback = Boolean(
    selectedScheme && (selectedScheme.drawback || selectedScheme.RODTEP || selectedScheme.ROSCTL)
  )

  const calculatedTotal = item ? lineTotal(item) : 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-800">
            {itemIndex + 1}
          </span>
          <h4 className="text-sm font-semibold text-gray-900">Goods Item {itemIndex + 1}</h4>
        </div>
        {canRemove && (
          <Button size="sm" variant="ghost" className="text-xs text-red-600 hover:bg-red-50" onClick={onRemove}>
            Remove item
          </Button>
        )}
      </div>

      {/* Core Item Fields */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          label="RITC / HS code"
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.ritcCode`)}
          placeholder="e.g. 61091000"
        />

        <Select<ShippingBillFormValues>
          label="Scheme code"
          name={`invoices.${invoiceIndex}.items.${itemIndex}.schemeCode`}
          options={schemeCodes}
          placeholder="Select export scheme"
        />

        <div className="lg:col-span-4">
          <Input
            label="Goods description"
            {...register(`invoices.${invoiceIndex}.items.${itemIndex}.goodsDescription1`)}
            placeholder="Detailed description of goods"
          />
        </div>

        <Input
          label="Quantity"
          type="number"
          min={0}
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.quantity`)}
          placeholder="1"
        />

        <Select<ShippingBillFormValues>
          label="Unit (UOM)"
          name={`invoices.${invoiceIndex}.items.${itemIndex}.unitOfMeasurement`}
          options={quantityCodes}
          rules={{ required: true }}
        />

        <Input
          label={`Unit price (${invoiceCurrency || 'USD'})`}
          type="number"
          min={0}
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.unitPrice`)}
          placeholder="0.00"
        />

        <Input
          label="Line total"
          type="number"
          min={0}
          placeholder={`${calculatedTotal.toFixed(2)}`}
          {...register(`invoices.${invoiceIndex}.items.${itemIndex}.lineTotal`)}
        />

        <Select<ShippingBillFormValues>
          label="IGST payment"
          name={`invoices.${invoiceIndex}.items.${itemIndex}.igstPaymentStatus`}
          options={igstStatuses}
          placeholder="Select status"
        />
      </div>

      {/* Conditional Drawback Fields */}
      {showDrawback && (
        <div className="mt-3.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
          <p className="mb-2 text-xs font-semibold text-amber-900">
            Duty Drawback / RoSCTL / RoDTEP Information
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Drawback Serial #"
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.drawbackSerialNumber`)}
              placeholder="e.g. 6109A"
            />
            <Input
              label="Drawback Unit"
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.drawbackUnit`)}
              placeholder="e.g. PCS"
            />
            <Input
              label="Drawback Quantity"
              type="number"
              min={0}
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.drawbackQuantity`)}
              placeholder="0"
            />
          </div>
        </div>
      )}

      {/* Flags & Checkboxes */}
      <div className="mt-3 flex flex-wrap items-center gap-6 border-t border-gray-100 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700">
          <Checkbox {...register(`invoices.${invoiceIndex}.items.${itemIndex}.rewardItem`)} />
          Claim Export Reward (MEIS / RoDTEP)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700">
          <Checkbox {...register(`invoices.${invoiceIndex}.items.${itemIndex}.thirdPartyItem`)} />
          Supplied by Third Party
        </label>
      </div>

      {/* Third Party PartySelector */}
      {item?.thirdPartyItem && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
          <PartySelector
            formCtx={formCtx}
            ownerName={`invoices.${invoiceIndex}.items.${itemIndex}.itemThirdPartyId`}
            branchName={`invoices.${invoiceIndex}.items.${itemIndex}.itemThirdPartyBranchId`}
            label="Item Third-Party Supplier"
            kind="business"
            role="thirdParty"
            required={false}
            onQuickAdd={onQuickAddThirdParty}
            onAddBranch={onAddThirdPartyBranch}
          />
        </div>
      )}

      {/* Advanced Customs, Taxes, and AR4 details */}
      <div className="mt-4">
        <AdvancedPanel title="Item customs, taxes & AR4 excise details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues>
              label="Unit of rate"
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.unitOfRate`)}
              options={quantityCodes}
              placeholder={item?.unitOfMeasurement || 'UOM'}
            />
            <Input
              label="Per unit rate count"
              type="number"
              min={1}
              placeholder="1"
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.numberOfUnits`)}
            />
            <Input
              label="Present market value"
              type="number"
              min={0}
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.presentMarketValue`)}
              placeholder="0.00"
            />
            <Input
              label="GCess amount"
              type="number"
              min={0}
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.cess`)}
              placeholder="0.00"
            />

            <div className="sm:col-span-2 lg:col-span-3">
              <Input
                label="Accessories description"
                {...register(`invoices.${invoiceIndex}.items.${itemIndex}.accessoriesDescription`)}
                placeholder="Optional accessory information"
              />
            </div>
            <Select<ShippingBillFormValues>
              label="Accessory status"
              name={`invoices.${invoiceIndex}.items.${itemIndex}.accessoryStatus`}
              options={accessoryStatuses}
              placeholder="Select accessory status"
            />

            {item?.igstPaymentStatus === 'P' && (
              <>
                <Input
                  label="Taxable value"
                  type="number"
                  min={0}
                  {...register(`invoices.${invoiceIndex}.items.${itemIndex}.taxableValue`)}
                  placeholder="0.00"
                />
                <Input
                  label="IGST amount"
                  type="number"
                  min={0}
                  {...register(`invoices.${invoiceIndex}.items.${itemIndex}.igstAmount`)}
                  placeholder="0.00"
                />
              </>
            )}

            <Input
              label="Origin district code"
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.originDistrictCode`)}
              placeholder="e.g. 522"
            />
            <Select<ShippingBillFormValues>
              label="Trade agreement code"
              name={`invoices.${invoiceIndex}.items.${itemIndex}.tradeAgreementsCode`}
              options={tradeAgreements}
              placeholder="NCPTI"
            />
            <Input
              label="End use code"
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.endUseOfItem`)}
              placeholder="e.g. GNX100"
            />
            <Input
              label="Packages for item"
              type="number"
              min={0}
              {...register(`invoices.${invoiceIndex}.items.${itemIndex}.totalPackage`)}
              placeholder="Packages"
            />
          </div>

          <div className="mt-4 border-t border-gray-200/60 pt-3">
            <p className="mb-2 text-xs font-semibold text-gray-700">AR4 / Central Excise Details</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="AR4 number"
                {...register(`invoices.${invoiceIndex}.items.${itemIndex}.ar4Number`)}
                placeholder="Excise certificate #"
              />
              <Input
                label="AR4 date"
                type={dateType}
                {...register(`invoices.${invoiceIndex}.items.${itemIndex}.ar4Date`)}
              />
            </div>
          </div>
        </AdvancedPanel>
      </div>
    </div>
  )
}
