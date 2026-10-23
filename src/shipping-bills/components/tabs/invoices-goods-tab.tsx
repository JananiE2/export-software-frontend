import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Checkbox } from 'ui/inputs/checkbox'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { emptyInvoice, emptyItem, invoiceTotal, ShippingBillFormValues } from '../../model'
import { referenceDataService, SelectOption } from '../../services/reference-data-service'
import { AdvancedPanel } from '../common/advanced-panel'
import { PartySelector } from '../party-selector'
import { GoodsItemRow } from './goods-item-row'

const dateType = 'date' as 'text'

interface InvoicesGoodsTabProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  onQuickAddBuyer: (invoiceIndex: number) => void
  onAddBuyerBranch: (ownerId: number, invoiceIndex: number) => void
  onQuickAddThirdParty: (invoiceIndex: number, itemIndex?: number) => void
  onAddThirdPartyBranch: (ownerId: number, invoiceIndex: number, itemIndex?: number) => void
}

export function InvoicesGoodsTab({
  formCtx,
  onQuickAddBuyer,
  onAddBuyerBranch,
  onQuickAddThirdParty,
  onAddThirdPartyBranch
}: InvoicesGoodsTabProps) {
  const { register, control, watch, setValue } = formCtx.hooks
  const { fields: invoices, append: addInvoice, remove: removeInvoice } = useFieldArray({
    control,
    name: 'invoices'
  })

  const formValues = watch()

  // Asynchronous Options State
  const [currencies, setCurrencies] = useState<SelectOption<string>[]>([])
  const [contractTypes, setContractTypes] = useState<SelectOption<string>[]>([])
  const [paymentTypes, setPaymentTypes] = useState<SelectOption<string>[]>([])
  const [priceInclusionTypes, setPriceInclusionTypes] = useState<SelectOption<string>[]>([])

  useEffect(() => {
    let active = true
    Promise.all([
      referenceDataService.getCurrencies(),
      referenceDataService.getContractTypes(),
      referenceDataService.getPaymentTypes(),
      referenceDataService.getPriceInclusionTypes()
    ]).then(([curr, contracts, payments, inclusions]) => {
      if (active) {
        setCurrencies(curr)
        setContractTypes(contracts)
        setPaymentTypes(payments)
        setPriceInclusionTypes(inclusions)
      }
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Invoices & Goods ({invoices.length})</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Export declarations require at least one commercial invoice and associated goods line items.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addInvoice(emptyInvoice())}
          className="shadow-sm">
          + Add another invoice
        </Button>
      </div>

      {invoices.map((field, invoiceIndex) => {
        const invoice = formValues.invoices[invoiceIndex] ?? emptyInvoice()
        const buyerSameAsConsignee = invoice.buyerSameAsConsignee

        // Sync buyer with consignee when buyerSameAsConsignee is checked
        if (buyerSameAsConsignee && formValues.consigneeId && invoice.buyerId !== formValues.consigneeId) {
          setValue(`invoices.${invoiceIndex}.buyerId`, formValues.consigneeId)
          if (formValues.consigneeBranchId) {
            setValue(`invoices.${invoiceIndex}.buyerBranchId`, formValues.consigneeBranchId)
          }
        }

        const calculatedInvoiceTotal = invoiceTotal(invoice)

        return (
          <Card key={field.id} className="border-gray-200 shadow-sm">
            <CardHeader className="flex-row items-center justify-between border-b border-gray-100 bg-gray-50/50 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary-600 text-xs font-semibold text-white">
                  INV {invoiceIndex + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {invoice.invoiceNumber ? `Invoice #${invoice.invoiceNumber}` : `Invoice ${invoiceIndex + 1}`}
                  </h3>
                  <span className="text-xs text-gray-500">{invoice.invoiceDate || 'Date not set'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-xs border border-gray-200">
                  Total: {invoice.currency || 'USD'} {calculatedInvoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {invoices.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-600 hover:bg-red-50"
                    onClick={() => removeInvoice(invoiceIndex)}>
                    Remove invoice
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Header Invoice Inputs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="Invoice number"
                  {...register(`invoices.${invoiceIndex}.invoiceNumber`)}
                  placeholder="e.g. INV-2026-001"
                />
                <Input
                  label="Invoice date"
                  type={dateType}
                  {...register(`invoices.${invoiceIndex}.invoiceDate`)}
                />

                <Select<ShippingBillFormValues>
                  label="Invoice currency"
                  name={`invoices.${invoiceIndex}.currency`}
                  options={currencies}
                  rules={{ required: true }}
                />

                <Select<ShippingBillFormValues>
                  label="Contract type"
                  name={`invoices.${invoiceIndex}.contractType`}
                  options={contractTypes}
                  rules={{ required: true }}
                />
              </div>

              {/* Buyer & Consignee Relationship */}
              <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
                  <Checkbox {...register(`invoices.${invoiceIndex}.buyerSameAsConsignee`)} />
                  Buyer & consignee are the same entity
                </label>

                {!buyerSameAsConsignee && (
                  <div className="mt-4 pt-3 border-t border-gray-200/60">
                    <PartySelector
                      formCtx={formCtx}
                      ownerName={`invoices.${invoiceIndex}.buyerId`}
                      branchName={`invoices.${invoiceIndex}.buyerBranchId`}
                      label="Buyer"
                      kind="business"
                      role="buyer"
                      onQuickAdd={() => onQuickAddBuyer(invoiceIndex)}
                      onAddBranch={(ownerId) => onAddBuyerBranch(ownerId, invoiceIndex)}
                    />
                  </div>
                )}
              </div>

              {/* Charges Breakdown Panel */}
              <AdvancedPanel title="Invoice freight, insurance & additional charges">
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                  {/* Freight & Insurance */}
                  <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    <div className="p-3">
                      <span className="block text-xs font-semibold text-gray-700 mb-1.5">Freight Charges</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.freightRate`)}
                          placeholder="Rate %"
                          disabled={Boolean(invoice.freightAmount)}
                        />
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.freightAmount`)}
                          placeholder="Amount"
                          disabled={Boolean(invoice.freightRate)}
                        />
                        <Select<ShippingBillFormValues>
                          name={`invoices.${invoiceIndex}.freightCurrency`}
                          options={currencies}
                          placeholder={invoice.currency || 'USD'}
                        />
                      </div>
                    </div>

                    <div className="p-3">
                      <span className="block text-xs font-semibold text-gray-700 mb-1.5">Insurance Charges</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.insuranceRate`)}
                          placeholder="Rate %"
                          disabled={Boolean(invoice.insuranceAmount)}
                        />
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.insuranceAmount`)}
                          placeholder="Amount"
                          disabled={Boolean(invoice.insuranceRate)}
                        />
                        <Select<ShippingBillFormValues>
                          name={`invoices.${invoiceIndex}.insuranceCurrency`}
                          options={currencies}
                          placeholder={invoice.currency || 'USD'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Commission & Discount */}
                  <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    <div className="p-3">
                      <span className="block text-xs font-semibold text-gray-700 mb-1.5">Commission</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.commissionRate`)}
                          placeholder="Rate %"
                          disabled={Boolean(invoice.commissionAmount)}
                        />
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.commissionAmount`)}
                          placeholder="Amount"
                          disabled={Boolean(invoice.commissionRate)}
                        />
                        <Select<ShippingBillFormValues>
                          name={`invoices.${invoiceIndex}.commissionCurrency`}
                          options={currencies}
                          placeholder={invoice.currency || 'USD'}
                        />
                      </div>
                    </div>

                    <div className="p-3">
                      <span className="block text-xs font-semibold text-gray-700 mb-1.5">Discount</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.discountRate`)}
                          placeholder="Rate %"
                          disabled={Boolean(invoice.discountAmount)}
                        />
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.discountAmount`)}
                          placeholder="Amount"
                          disabled={Boolean(invoice.discountRate)}
                        />
                        <Select<ShippingBillFormValues>
                          name={`invoices.${invoiceIndex}.discountCurrency`}
                          options={currencies}
                          placeholder={invoice.currency || 'USD'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Other deductions & Packing */}
                  <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    <div className="p-3">
                      <span className="block text-xs font-semibold text-gray-700 mb-1.5">Other Deductions</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.otherDeductionsRate`)}
                          placeholder="Rate %"
                          disabled={Boolean(invoice.otherDeductionsAmount)}
                        />
                        <Input
                          type="number"
                          min={0}
                          {...register(`invoices.${invoiceIndex}.otherDeductionsAmount`)}
                          placeholder="Amount"
                          disabled={Boolean(invoice.otherDeductionsRate)}
                        />
                        <Select<ShippingBillFormValues>
                          name={`invoices.${invoiceIndex}.otherDeductionsCurrency`}
                          options={currencies}
                          placeholder={invoice.currency || 'USD'}
                        />
                      </div>
                    </div>

                    <div className="p-3">
                      <span className="block text-xs font-semibold text-gray-700 mb-1.5">Packing Charges</span>
                      <Input
                        type="number"
                        min={0}
                        {...register(`invoices.${invoiceIndex}.packingCharges`)}
                        placeholder="Amount"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Select<ShippingBillFormValues>
                    label="Price includes"
                    name={`invoices.${invoiceIndex}.freightInsuranceIncluded`}
                    options={priceInclusionTypes}
                    placeholder="Select inclusion"
                  />
                  <Input
                    label="Contract / order #"
                    {...register(`invoices.${invoiceIndex}.contractNumber`)}
                    placeholder="e.g. PO-8921"
                  />
                  <Select<ShippingBillFormValues>
                    label="Payment type"
                    name={`invoices.${invoiceIndex}.natureOfPayment`}
                    options={paymentTypes}
                    placeholder="Select payment"
                  />
                  <Input
                    label="Payment period (days)"
                    type="number"
                    min={0}
                    {...register(`invoices.${invoiceIndex}.periodOfPayment`)}
                    placeholder="e.g. 30"
                  />
                </div>
              </AdvancedPanel>

              {/* Goods Line Items Section */}
              <div className="border-t border-gray-100 pt-5">
                <InvoiceItemsList
                  formCtx={formCtx}
                  invoiceIndex={invoiceIndex}
                  invoiceCurrency={invoice.currency || 'USD'}
                  onQuickAddThirdParty={(itemIdx) => onQuickAddThirdParty(invoiceIndex, itemIdx)}
                  onAddThirdPartyBranch={(ownerId, itemIdx) =>
                    onAddThirdPartyBranch(ownerId, invoiceIndex, itemIdx)
                  }
                />
              </div>

              {/* Footer Total Indicator */}
              <div className="flex items-center justify-end rounded-lg bg-gray-50 px-4 py-3 text-right">
                <div>
                  <span className="text-xs text-gray-500">Calculated Invoice Subtotal: </span>
                  <span className="ml-1 text-sm font-semibold text-gray-900">
                    {invoice.currency || 'USD'}{' '}
                    {calculatedInvoiceTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function InvoiceItemsList({
  formCtx,
  invoiceIndex,
  invoiceCurrency,
  onQuickAddThirdParty,
  onAddThirdPartyBranch
}: {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  invoiceIndex: number
  invoiceCurrency: string
  onQuickAddThirdParty: (itemIndex: number) => void
  onAddThirdPartyBranch: (ownerId: number, itemIndex: number) => void
}) {
  const { control } = formCtx.hooks
  const { fields: items, append: addItem, remove: removeItem } = useFieldArray({
    control,
    name: `invoices.${invoiceIndex}.items`
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Goods Line Items ({items.length})</h4>
          <p className="text-xs text-gray-500">Each item corresponds to a specific tariff HS code and scheme.</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => addItem(emptyItem())}
          className="text-xs">
          + Add goods item
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((field, itemIndex) => (
          <GoodsItemRow
            key={field.id}
            formCtx={formCtx}
            invoiceIndex={invoiceIndex}
            itemIndex={itemIndex}
            invoiceCurrency={invoiceCurrency}
            canRemove={items.length > 1}
            onRemove={() => removeItem(itemIndex)}
            onQuickAddThirdParty={() => onQuickAddThirdParty(itemIndex)}
            onAddThirdPartyBranch={(ownerId) => onAddThirdPartyBranch(ownerId, itemIndex)}
          />
        ))}
      </div>
    </div>
  )
}
