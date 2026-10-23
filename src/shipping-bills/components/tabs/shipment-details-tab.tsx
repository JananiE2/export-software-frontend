import { useEffect, useState } from 'react'
import { useForm } from 'core/form'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { portCountry, ShippingBillFormValues } from '../../model'
import { referenceDataService, SelectOption } from '../../services/reference-data-service'
import { AdvancedPanel } from '../common/advanced-panel'
import { AsyncCombobox } from '../common/async-combobox'
import { SectionHeading } from '../common/section-heading'
import { PartySelector } from '../party-selector'

const dateType = 'date' as 'text'

interface ShipmentDetailsTabProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
  onQuickAddExporter: () => void
  onQuickAddConsignee: () => void
  onAddExporterBranch: (ownerId: number) => void
  onAddConsigneeBranch: (ownerId: number) => void
}

export function ShipmentDetailsTab({
  formCtx,
  onQuickAddExporter,
  onQuickAddConsignee,
  onAddExporterBranch,
  onAddConsigneeBranch
}: ShipmentDetailsTabProps) {
  const { register, watch, setValue } = formCtx.hooks
  const values = watch()

  // Asynchronous Reference Options State
  const [cargoOptions, setCargoOptions] = useState<SelectOption<string>[]>([])
  const [weightUnits, setWeightUnits] = useState<SelectOption<string>[]>([])
  const [stateOptions, setStateOptions] = useState<SelectOption<number>[]>([])
  const [nfeiCategories, setNfeiCategories] = useState<SelectOption<string>[]>([])
  const [sealTypes, setSealTypes] = useState<SelectOption<string>[]>([])
  const [marksOptions, setMarksOptions] = useState<SelectOption<string>[]>([])
  const [marksLoading, setMarksLoading] = useState(false)

  // Load static reference options once asynchronously via service
  useEffect(() => {
    let active = true
    Promise.all([
      referenceDataService.getCargoOptions(),
      referenceDataService.getWeightUnits(),
      referenceDataService.getStateOptions(),
      referenceDataService.getNfeiCategories(),
      referenceDataService.getSealTypes()
    ]).then(([cargo, weight, states, nfei, seals]) => {
      if (active) {
        setCargoOptions(cargo)
        setWeightUnits(weight)
        setStateOptions(states)
        setNfeiCategories(nfei)
        setSealTypes(seals)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // Asynchronously fetch marks & numbers whenever exporterId changes
  useEffect(() => {
    let active = true
    if (!values.exporterId) {
      setMarksOptions([])
      setValue('marksAndNumbers', '')
      return
    }

    setMarksLoading(true)
    referenceDataService
      .getMarksAndNumbers(values.exporterId)
      .then((opts) => {
        if (active) {
          setMarksOptions(opts)
          setMarksLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setMarksOptions([])
          setMarksLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [values.exporterId, setValue])

  // Domain rule: Gross weight vs Net weight validation check
  const grossNum = values.grossWeight ? Number(values.grossWeight) : NaN
  const netNum = values.netWeight ? Number(values.netWeight) : NaN
  const isWeightInvalid = !isNaN(grossNum) && !isNaN(netNum) && grossNum < netNum

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader
        title="Shipment basics"
        description="Specify export parties, ports, cargo classification, and packaging details."
      />
      <CardContent className="space-y-6">
        {/* Parties Section */}
        <div className="space-y-4">
          <PartySelector
            formCtx={formCtx}
            ownerName="exporterId"
            branchName="exporterBranchId"
            label="Exporter"
            kind="exporter"
            onQuickAdd={onQuickAddExporter}
            onAddBranch={onAddExporterBranch}
          />

          <PartySelector
            formCtx={formCtx}
            ownerName="consigneeId"
            branchName="consigneeBranchId"
            label="Consignee"
            kind="business"
            role="consignee"
            onQuickAdd={onQuickAddConsignee}
            onAddBranch={onAddConsigneeBranch}
          />
        </div>

        {/* Route Section */}
        <div className="border-t border-gray-100 pt-5">
          <SectionHeading
            title="Route details"
            description="Departure and destination customs ports determine applicable export duties."
          />
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-800">Port of loading</span>
              <AsyncCombobox
                name="loadingPort"
                placeholder="Search Indian loading port..."
                rules={{ required: true }}
                fetchOptions={async (query) => {
                  const res = await referenceDataService.getPorts(query, true)
                  return res.map((p) => ({
                    value: p.code,
                    label: `${p.name} · ${p.code}`,
                    sublabel: `Country: ${p.countryCode}`
                  }))
                }}
                getInitialLabel={async (code) => {
                  const port = await referenceDataService.getPortByCode(code)
                  return port ? `${port.name} · ${port.code}` : code
                }}
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-gray-800">Final destination port</span>
              <AsyncCombobox
                name="finalDestinationPort"
                placeholder="Search destination port..."
                rules={{ required: true }}
                fetchOptions={async (query) => {
                  const res = await referenceDataService.getPorts(query, false)
                  return res.map((p) => ({
                    value: p.code,
                    label: `${p.name} · ${p.code}`,
                    sublabel: `Country: ${p.countryCode}`
                  }))
                }}
                getInitialLabel={async (code) => {
                  const port = await referenceDataService.getPortByCode(code)
                  return port ? `${port.name} · ${port.code}` : code
                }}
              />
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Origin / Dest Country:</span>
            <span>{portCountry(values.loadingPort) || '—'}</span>
            <span>→</span>
            <span>{portCountry(values.finalDestinationPort) || '—'}</span>
          </div>
        </div>

        {/* Regulatory & Route Exceptions */}
        <AdvancedPanel title="Regulatory and route exceptions">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-800">Discharge port</span>
              <AsyncCombobox
                name="dischargePort"
                placeholder="Defaults to destination"
                fetchOptions={async (query) => {
                  const res = await referenceDataService.getPorts(query, false)
                  return res.map((p) => ({
                    value: p.code,
                    label: `${p.name} · ${p.code}`,
                    sublabel: `Country: ${p.countryCode}`
                  }))
                }}
                getInitialLabel={async (code) => {
                  const port = await referenceDataService.getPortByCode(code)
                  return port ? `${port.name} · ${port.code}` : code
                }}
              />
            </div>

            <Select<ShippingBillFormValues>
              label="Origin state"
              name="originStateCode"
              options={stateOptions}
              placeholder="Select state"
            />

            <Select<ShippingBillFormValues>
              label="NFEI category"
              name="nfeiCategory"
              options={nfeiCategories}
              placeholder="Not applicable"
            />

            <Input label="RBI waiver number" {...register('rbiWaiverNumber')} placeholder="e.g. RBI/2026/0129" />
            <Input label="RBI waiver date" type={dateType} {...register('rbiWaiverDate')} />
          </div>
        </AdvancedPanel>

        {/* Package & Weights Detail */}
        <div className="border-t border-gray-100 pt-5">
          <SectionHeading
            title="Package & weights detail"
            description="Ensure net weight does not exceed gross weight."
          />
          <div className="mt-3 grid gap-4 pb-2 sm:grid-cols-2 lg:grid-cols-4">
            <Select<ShippingBillFormValues>
              label="Nature of cargo"
              name="natureOfCargo"
              options={cargoOptions}
            />

            <div>
              <Input
                label="Gross weight"
                type="number"
                min={0}
                {...register('grossWeight')}
                placeholder="0.00"
              />
            </div>

            <div>
              <Input
                label="Net weight"
                type="number"
                min={0}
                {...register('netWeight')}
                placeholder="0.00"
              />
              {isWeightInvalid && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  ⚠️ Gross weight must be ≥ Net weight
                </p>
              )}
            </div>

            <Select<ShippingBillFormValues>
              label="Weight unit"
              name="measurementUnit"
              options={weightUnits}
            />

            <Input
              label="Total packages"
              type="number"
              min={1}
              {...register('totalPackages')}
              placeholder="1"
            />

            <div className="sm:col-span-3">
              <Select<ShippingBillFormValues>
                label="Marks and numbers"
                name="marksAndNumbers"
                options={marksOptions}
                placeholder={
                  !values.exporterId
                    ? 'Select exporter first'
                    : marksLoading
                    ? 'Loading marks and numbers...'
                    : marksOptions.length === 0
                    ? 'No marks found'
                    : 'Select marks and numbers'
                }
                disabled={!values.exporterId || marksLoading || !marksOptions.length}
              />
            </div>
          </div>

          <AdvancedPanel title="Additional transport details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select<ShippingBillFormValues>
                label="Seal type"
                name="sealType"
                options={sealTypes}
                placeholder="Select seal type"
              />
              {(!values.containers || values.containers.length === 0) && (
                <Input
                  label="Number of containers"
                  type="number"
                  min={0}
                  {...register('numberOfContainers')}
                  placeholder="0"
                />
              )}
              <Input label="Loose packets" type="number" min={0} {...register('loosePackets')} placeholder="0" />
              <Input label="MAWB number" {...register('mawbNumber')} placeholder="Master Airway Bill #" />
              <Input label="HAWB number" {...register('hawbNumber')} placeholder="House Airway Bill #" />
            </div>
          </AdvancedPanel>
        </div>
      </CardContent>
    </Card>
  )
}
