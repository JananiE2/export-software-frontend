import { useState, useEffect } from 'react'
import { s, useForm } from 'core/form'
import { Form } from 'core/form/components'
import { navigate } from 'core/routing'
import { toast } from 'core/toast-manager'
import { Button } from 'ui/basic/button'
import { Tabs, TabsList, TabsTrigger } from 'ui/interactive/tabs'
import { routes } from '@/shared/route-paths'
import { Branch, Business, emptyBill, Exporter, SavedBill, ShippingBillFormValues } from '../model'
import { saveBill } from '../demo-store'
import { shippingBillService } from '../shipping-bill-service'
import { BranchDialog, PartyDialog } from '../party-dialogs'
import { WorkflowStepper } from './workflow-stepper'
import { ShipmentDetailsTab } from './tabs/shipment-details-tab'
import { InvoicesGoodsTab } from './tabs/invoices-goods-tab'
import { OtherDetailsTab } from './tabs/other-details-tab'

const positive = s.string().refine((value) => (Number(value) > 0 ? undefined : 'Enter a number above zero'))

export const billSchema = s.object({
  jobNumber: s.string().optional(),
  jobDate: s.string(),
  exporterId: s.string(),
  exporterBranchId: s.string(),
  consigneeId: s.string(),
  consigneeBranchId: s.string(),
  loadingPort: s.string(),
  finalDestinationPort: s.string(),
  dischargePort: s.string().optional(),
  originStateCode: s.string().optional(),
  nfeiCategory: s.string().optional(),
  rbiWaiverNumber: s.string().optional(),
  rbiWaiverDate: s.string().optional(),
  sealType: s.string().optional(),
  numberOfContainers: s.string().optional(),
  natureOfCargo: s.string().optional(),
  grossWeight: s.string().optional(),
  netWeight: s.string().optional(),
  measurementUnit: s.string().optional(),
  totalPackages: s.string().optional(),
  marksAndNumbers: s.string().optional(),
  loosePackets: s.string().optional(),
  mawbNumber: s.string().optional(),
  hawbNumber: s.string().optional(),
  invoiceNumber: s.string().optional(),
  invoiceDate: s.string().optional(),
  currency: s.string().optional(),
  contractType: s.string().optional(),
  buyerId: s.string().optional(),
  buyerBranchId: s.string().optional(),
  thirdPartyId: s.string().optional(),
  thirdPartyBranchId: s.string().optional(),
  ritcCode: s.string().optional(),
  goodsDescription1: s.string().optional(),
  quantity: positive.optional(),
  unitOfMeasurement: s.string().optional(),
  unitPrice: positive.optional(),
  containerNumber: s.string().optional(),
  packingNumberFrom: s.string().optional(),
  packingNumberTo: s.string().optional(),
  documentTypeCode: s.string().optional(),
  documentReferenceNumber: s.string().optional(),
  registrationNumber: s.string().optional()
})

interface QuickAddState {
  kind: 'exporter' | 'business'
  role?: 'consignee' | 'buyer' | 'thirdParty' | 'itemThirdParty'
  invoiceIndex?: number
  itemIndex?: number
}

interface QuickBranchState {
  kind: 'exporter' | 'business'
  ownerId: number
  targetPath: any
}

interface BillEditorProps {
  bill?: SavedBill
}

export function BillEditor({ bill }: BillEditorProps) {
  const formCtx = useForm<ShippingBillFormValues>(billSchema, {
    defaultValues: bill?.values ?? emptyBill()
  })

  const { setValue, formState } = formCtx.hooks
  const [activeTab, setActiveTab] = useState('details')
  const [draftId, setDraftId] = useState<number | undefined>(bill?.id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadingFlatFile, setDownloadingFlatFile] = useState(false)

  // Dialog states
  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null)
  const [quickBranch, setQuickBranch] = useState<QuickBranchState | null>(null)

  // Auto-focus tabs if form errors exist
  useEffect(() => {
    if (!formState.submitCount || !Object.keys(formState.errors).length) return
    toast.error('Please complete all required fields')
    const errors = formState.errors
    if (
      errors.jobDate ||
      errors.exporterId ||
      errors.exporterBranchId ||
      errors.consigneeId ||
      errors.consigneeBranchId ||
      errors.loadingPort ||
      errors.finalDestinationPort
    ) {
      setActiveTab('details')
    } else if (errors.invoices) {
      setActiveTab('invoices')
    } else if (errors.containers || errors.packingRanges || errors.documents || errors.licenses) {
      setActiveTab('documents')
    }
  }, [formState.submitCount, formState.errors])

  // Handle final submission (API mock service + store)
  const handleSave = async (data: ShippingBillFormValues) => {
    setIsSubmitting(true)
    try {
      // 1. Save locally in client demo-store
      const saved = saveBill(data, draftId)
      setDraftId(saved.id)

      // 2. Submit to mock backend API service (asynchronous Promise-based)
      try {
        await shippingBillService.upsert(data)
      } catch (apiErr) {
        console.warn('Backend API notice (saved locally in demo-store):', apiErr)
      }

      toast.success(bill ? 'Shipping bill updated successfully' : 'Shipping bill created successfully')
      navigate(routes.toShippingBillEdit(saved.id))
    } catch (err: any) {
      console.error('Error saving shipping bill:', err)
      toast.error('Failed to save shipping bill')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle downloading flat file for this bill
  const handleDownloadFlatFile = async () => {
    if (!draftId && !bill) return
    const currentValues = formCtx.hooks.getValues()
    const currentBill: SavedBill = {
      id: draftId || bill?.id || 1000,
      created: bill?.created || new Date().toISOString(),
      updated: new Date().toISOString(),
      values: currentValues
    }

    setDownloadingFlatFile(true)
    try {
      await shippingBillService.downloadFlatFile(currentBill.id, currentBill)
      toast.success('Generated and downloaded ICEGATE flat file (.sb)')
    } catch (err) {
      console.error('Flat file error:', err)
      toast.error('Failed to generate flat file')
    } finally {
      setDownloadingFlatFile(false)
    }
  }

  // Handle newly created party from dialog
  const handlePartySaved = (party: Exporter | Business) => {
    const branchId = party.branches[0]?.id
    if (!quickAdd || !branchId) return

    if (quickAdd.kind === 'exporter') {
      setValue('exporterId', String(party.id), { shouldValidate: true })
      setValue('exporterBranchId', String(branchId), { shouldValidate: true })
      if ('name' in party) setValue('exporterName', party.name)
    } else if (quickAdd.role === 'consignee') {
      setValue('consigneeId', String(party.id), { shouldValidate: true })
      setValue('consigneeBranchId', String(branchId), { shouldValidate: true })
      if ('name' in party) setValue('consigneeName', party.name)
    } else if (quickAdd.role === 'buyer' && quickAdd.invoiceIndex != null) {
      setValue(`invoices.${quickAdd.invoiceIndex}.buyerId`, String(party.id), { shouldValidate: true })
      setValue(`invoices.${quickAdd.invoiceIndex}.buyerBranchId`, String(branchId), { shouldValidate: true })
    } else if (quickAdd.role === 'thirdParty' && quickAdd.invoiceIndex != null) {
      setValue(`invoices.${quickAdd.invoiceIndex}.thirdPartyId`, String(party.id), { shouldValidate: true })
      setValue(`invoices.${quickAdd.invoiceIndex}.thirdPartyBranchId`, String(branchId), { shouldValidate: true })
    } else if (
      quickAdd.role === 'itemThirdParty' &&
      quickAdd.invoiceIndex != null &&
      quickAdd.itemIndex != null
    ) {
      setValue(
        `invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyId`,
        String(party.id),
        { shouldValidate: true }
      )
      setValue(
        `invoices.${quickAdd.invoiceIndex}.items.${quickAdd.itemIndex}.itemThirdPartyBranchId`,
        String(branchId),
        { shouldValidate: true }
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 focus:outline-none"
            onClick={() => navigate(routes.dashboard)}>
            ← Back to Shipping Bills
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            {bill ? `Shipping bill #${bill.values.jobNumber || bill.id}` : 'Create shipping bill'}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Fill in the shipment declarations, invoices, and customs documentation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {bill && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={downloadingFlatFile}
              onClick={handleDownloadFlatFile}>
              {downloadingFlatFile ? 'Generating...' : 'Download .sb Flat File'}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(routes.dashboard)}>
            Close
          </Button>
        </div>
      </div>

      {/* Top Workflow Stepper */}
      <WorkflowStepper currentStepId="shipping-bill" />

      {/* Form with Persistent Tabs */}
      <Form ctx={formCtx} handleSubmit={handleSave} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(String(val))}>
          <TabsList className="flex w-full justify-start border-b border-gray-200">
            <TabsTrigger value="details">1. Shipment basics</TabsTrigger>
            <TabsTrigger value="invoices">2. Invoices & goods</TabsTrigger>
            <TabsTrigger value="documents">3. Containers & others</TabsTrigger>
          </TabsList>

          {/* Tab 1: Shipment Details */}
          <div role="tabpanel" hidden={activeTab !== 'details'} className="mt-4">
            <ShipmentDetailsTab
              formCtx={formCtx}
              onQuickAddExporter={() => setQuickAdd({ kind: 'exporter' })}
              onQuickAddConsignee={() => setQuickAdd({ kind: 'business', role: 'consignee' })}
              onAddExporterBranch={(ownerId) =>
                setQuickBranch({ kind: 'exporter', ownerId, targetPath: 'exporterBranchId' })
              }
              onAddConsigneeBranch={(ownerId) =>
                setQuickBranch({ kind: 'business', ownerId, targetPath: 'consigneeBranchId' })
              }
            />
          </div>

          {/* Tab 2: Invoices & Goods */}
          <div role="tabpanel" hidden={activeTab !== 'invoices'} className="mt-4">
            <InvoicesGoodsTab
              formCtx={formCtx}
              onQuickAddBuyer={(invoiceIndex) =>
                setQuickAdd({ kind: 'business', role: 'buyer', invoiceIndex })
              }
              onAddBuyerBranch={(ownerId, invoiceIndex) =>
                setQuickBranch({
                  kind: 'business',
                  ownerId,
                  targetPath: `invoices.${invoiceIndex}.buyerBranchId`
                })
              }
              onQuickAddThirdParty={(invoiceIndex, itemIndex) =>
                setQuickAdd({
                  kind: 'business',
                  role: itemIndex != null ? 'itemThirdParty' : 'thirdParty',
                  invoiceIndex,
                  itemIndex
                })
              }
              onAddThirdPartyBranch={(ownerId, invoiceIndex, itemIndex) =>
                setQuickBranch({
                  kind: 'business',
                  ownerId,
                  targetPath:
                    itemIndex != null
                      ? `invoices.${invoiceIndex}.items.${itemIndex}.itemThirdPartyBranchId`
                      : `invoices.${invoiceIndex}.thirdPartyBranchId`
                })
              }
            />
          </div>

          {/* Tab 3: Containers & Supporting Docs */}
          <div role="tabpanel" hidden={activeTab !== 'documents'} className="mt-4">
            <OtherDetailsTab formCtx={formCtx} />
          </div>
        </Tabs>

        {/* Step navigation & Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(routes.dashboard)}>
            Cancel
          </Button>

          <div className="flex items-center gap-2.5">
            {activeTab !== 'details' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentVals = formCtx.hooks.getValues()
                  const saved = saveBill(currentVals, draftId)
                  setDraftId(saved.id)
                  setActiveTab(activeTab === 'documents' ? 'invoices' : 'details')
                }}>
                ← Previous step
              </Button>
            )}

            {activeTab !== 'documents' ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  const currentVals = formCtx.hooks.getValues()
                  const saved = saveBill(currentVals, draftId)
                  setDraftId(saved.id)
                  toast.success('Step saved as draft')
                  setActiveTab(activeTab === 'details' ? 'invoices' : 'documents')
                }}>
                Save & Next →
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving declaration...' : 'Save shipping bill'}
              </Button>
            )}
          </div>
        </div>
      </Form>

      {/* Quick Party Add Modal */}
      {quickAdd && (
        <PartyDialog
          kind={quickAdd.kind}
          initialRole={quickAdd.role === 'itemThirdParty' ? 'thirdParty' : quickAdd.role}
          onClose={() => setQuickAdd(null)}
          onSaved={handlePartySaved}
        />
      )}

      {/* Quick Branch Add Modal */}
      {quickBranch && (
        <BranchDialog
          kind={quickBranch.kind}
          ownerId={quickBranch.ownerId}
          onClose={() => setQuickBranch(null)}
          onSaved={(branch: Branch) =>
            setValue(quickBranch.targetPath, String(branch.id), { shouldValidate: true })
          }
        />
      )}
    </div>
  )
}
