import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'core/form'
import { Button } from 'ui/basic/button'
import { Card, CardContent, CardHeader } from 'ui/basic/card'
import { Input } from 'ui/inputs/input'
import { Select } from 'ui/inputs/select'
import { emptyDocument, ShippingBillFormValues } from '../../model'
import { referenceDataService, SelectOption } from '../../services/reference-data-service'
import { AdvancedPanel } from '../common/advanced-panel'
import { AsyncCombobox } from '../common/async-combobox'

const dateType = 'date' as 'text'

interface OtherDetailsTabProps {
  formCtx: ReturnType<typeof useForm<ShippingBillFormValues>>
}

export function OtherDetailsTab({ formCtx }: OtherDetailsTabProps) {
  const { register, control } = formCtx.hooks

  const {
    fields: containers,
    append: addContainer,
    remove: removeContainer
  } = useFieldArray({ control, name: 'containers' })

  const {
    fields: packingRanges,
    append: addPackingRange,
    remove: removePackingRange
  } = useFieldArray({ control, name: 'packingRanges' })

  const {
    fields: documents,
    append: addDocument,
    remove: removeDocument
  } = useFieldArray({ control, name: 'documents' })

  const {
    fields: licenses,
    append: addLicense,
    remove: removeLicense
  } = useFieldArray({ control, name: 'licenses' })

  // Asynchronous Options State
  const [containerSizes, setContainerSizes] = useState<SelectOption<string>[]>([])
  const [containerSealTypes, setContainerSealTypes] = useState<SelectOption<number>[]>([])
  const [goodsSources, setGoodsSources] = useState<SelectOption<string>[]>([])

  useEffect(() => {
    let active = true
    Promise.all([
      referenceDataService.getContainerSizes(),
      referenceDataService.getContainerSealTypes(),
      referenceDataService.getGoodsSources()
    ]).then(([sizes, seals, sources]) => {
      if (active) {
        setContainerSizes(sizes)
        setContainerSealTypes(seals)
        setGoodsSources(sources)
      }
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Containers & Packing Ranges Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader
          title="Cargo containers & packing ranges"
          description="Enter container details for FCL shipments, and packaging sequences."
        />
        <CardContent className="space-y-6">
          {/* Containers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Containers ({containers.length})</h3>
                <p className="text-xs text-gray-500">Add when cargo is shipped via ocean containers.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addContainer({ containerNumber: '' })}>
                + Add container
              </Button>
            </div>

            {containers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                No containers added. If cargo is not containerized, leave this empty.
              </div>
            ) : (
              <div className="space-y-3">
                {containers.map((field, index) => (
                  <div key={field.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">Container #{index + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-red-600 hover:bg-red-50"
                        onClick={() => removeContainer(index)}>
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Input
                        label="Container number"
                        {...register(`containers.${index}.containerNumber`)}
                        placeholder="e.g. MSKU1234567"
                      />
                      <Select<ShippingBillFormValues>
                        label="Container size"
                        name={`containers.${index}.containerSize`}
                        options={containerSizes}
                        placeholder="Select size"
                      />
                      <Input
                        label="Seal number"
                        {...register(`containers.${index}.exciseSealNumber`)}
                        placeholder="e.g. SL-8812"
                      />
                      <Input
                        label="Seal date"
                        type={dateType}
                        {...register(`containers.${index}.sealDate`)}
                      />
                      <Select<ShippingBillFormValues>
                        label="Seal type"
                        name={`containers.${index}.sealType`}
                        options={containerSealTypes}
                        placeholder="Select seal type"
                      />
                      <Input
                        label="Seal device ID"
                        {...register(`containers.${index}.sealDeviceId`)}
                        placeholder="RFID / Tracking ID"
                      />
                      <Input
                        label="Movement document type"
                        {...register(`containers.${index}.movementDocumentType`)}
                        placeholder="e.g. Lorry Receipt"
                      />
                      <Input
                        label="Movement document number"
                        {...register(`containers.${index}.movementDocumentNumber`)}
                        placeholder="e.g. LR-9012"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Packing Ranges Section */}
          <div className="border-t border-gray-100 pt-5">
            <AdvancedPanel title={`Packing list serial ranges (${packingRanges.length})`}>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPackingRange({ packingNumberFrom: '', packingNumberTo: '', packingCode: 'CTN' })}>
                    + Add packing range
                  </Button>
                </div>

                {packingRanges.length === 0 ? (
                  <p className="py-2 text-center text-xs text-gray-400">No packing sequences configured.</p>
                ) : (
                  packingRanges.map((field, index) => (
                    <div key={field.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Sequence {index + 1}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-red-500 hover:bg-red-50"
                          onClick={() => removePackingRange(index)}>
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Input
                          label="Package from"
                          type="number"
                          min={1}
                          {...register(`packingRanges.${index}.packingNumberFrom`)}
                          placeholder="1"
                        />
                        <Input
                          label="Package to"
                          type="number"
                          min={1}
                          {...register(`packingRanges.${index}.packingNumberTo`)}
                          placeholder="50"
                        />
                        <Input
                          label="Packing code"
                          {...register(`packingRanges.${index}.packingCode`)}
                          placeholder="e.g. CTN"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AdvancedPanel>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Documents (e-Sanchit) Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <div className="font-semibold leading-none tracking-tight">Supporting documents (e-Sanchit)</div>
            <div className="text-sm text-gray-500 mt-1">Customs paperless document image references and declarations.</div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addDocument(emptyDocument())}>
            + Add document
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm font-medium text-gray-700">No supporting documents attached</p>
              <p className="mt-1 text-xs text-gray-500">
                Attach certificates of origin, packing lists, invoices, or inspection reports when required.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => addDocument(emptyDocument())}>
                Add supporting document
              </Button>
            </div>
          ) : (
            documents.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Document #{index + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-600 hover:bg-red-50"
                    onClick={() => removeDocument(index)}>
                    Remove
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <span className="mb-1 block text-sm font-medium text-gray-800">Document type code</span>
                    <AsyncCombobox
                      name={`documents.${index}.documentTypeCode`}
                      placeholder="Search document type..."
                      fetchOptions={async (query) => {
                        const res = await referenceDataService.getDocumentCodes(query)
                        return res.map((doc) => ({
                          value: doc.value,
                          label: doc.label
                        }))
                      }}
                      getInitialLabel={async (val) => {
                        const docs = await referenceDataService.getDocumentCodes()
                        const found = docs.find((d) => d.value === val || d.label === val)
                        return found ? found.label : val
                      }}
                    />
                  </div>

                  <Input
                    label="Image reference number (IRN)"
                    {...register(`documents.${index}.imageReferenceNumber`)}
                    placeholder="e.g. IRN2026090124"
                  />

                  <Input
                    label="Issue date"
                    type={dateType}
                    {...register(`documents.${index}.documentIssueDate`)}
                  />
                </div>

                <div className="mt-4">
                  <AdvancedPanel title="Issuing authority & ICEGATE details">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Input
                        label="Reference number"
                        {...register(`documents.${index}.documentReferenceNumber`)}
                        placeholder="Document reference #"
                      />
                      <Input
                        label="Expiry date"
                        type={dateType}
                        {...register(`documents.${index}.documentExpiryDate`)}
                      />
                      <Input
                        label="Invoice serial #"
                        type="number"
                        min={1}
                        {...register(`documents.${index}.invoiceSerialNumber`)}
                        placeholder="1"
                      />
                      <Input
                        label="Item serial #"
                        type="number"
                        min={1}
                        {...register(`documents.${index}.itemSerialNumber`)}
                        placeholder="1"
                      />
                      <Input
                        label="Place of issue"
                        {...register(`documents.${index}.placeOfIssue`)}
                        placeholder="e.g. New Delhi"
                      />
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <p className="mb-2 text-xs font-semibold text-gray-700">Issuing Party</p>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Input
                          label="Party code"
                          {...register(`documents.${index}.issuingPartyCode`)}
                        />
                        <Input
                          label="Party name"
                          {...register(`documents.${index}.issuingPartyName`)}
                        />
                        <Input
                          label="Address"
                          {...register(`documents.${index}.issuingPartyAddress1`)}
                        />
                        <Input
                          label="City"
                          {...register(`documents.${index}.issuingPartyCity`)}
                        />
                        <Input
                          label="Postal code"
                          {...register(`documents.${index}.issuingPartyPin`)}
                        />
                      </div>
                    </div>
                  </AdvancedPanel>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Export Licences Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <div className="font-semibold leading-none tracking-tight">Export licences & authorizations</div>
            <div className="text-sm text-gray-500 mt-1">Specify advance authorization, EPCG, or export quota licences when applicable.</div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addLicense({ registrationNumber: '' })}>
            + Add licence
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {licenses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm font-medium text-gray-700">No licences required</p>
              <p className="mt-1 text-xs text-gray-500">
                Only shipments claiming Advance Authorization, EPCG, or DFIA require licence registrations.
              </p>
            </div>
          ) : (
            licenses.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Licence #{index + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-600 hover:bg-red-50"
                    onClick={() => removeLicense(index)}>
                    Remove
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    label="Registration number"
                    {...register(`licenses.${index}.registrationNumber`)}
                    placeholder="e.g. LIC/AA/2026/01"
                  />
                  <Input
                    label="Registration date"
                    type={dateType}
                    {...register(`licenses.${index}.registrationDate`)}
                  />
                  <Input
                    label="Invoice serial #"
                    type="number"
                    min={1}
                    {...register(`licenses.${index}.invoiceSerialNumber`)}
                    placeholder="1"
                  />
                  <Input
                    label="Item serial #"
                    type="number"
                    min={1}
                    {...register(`licenses.${index}.itemSerialNumber`)}
                    placeholder="1"
                  />
                  <Input
                    label="Licence serial #"
                    type="number"
                    min={1}
                    {...register(`licenses.${index}.licenseSerialNumber`)}
                    placeholder="1"
                  />
                  <Input
                    label="Licence quantity"
                    type="number"
                    min={0}
                    {...register(`licenses.${index}.licenseQuantity`)}
                    placeholder="0"
                  />
                  <Input
                    label="Export quantity"
                    type="number"
                    min={0}
                    {...register(`licenses.${index}.licenseExportQuantity`)}
                    placeholder="0"
                  />
                  <Select<ShippingBillFormValues>
                    label="Goods source"
                    name={`licenses.${index}.indigenousOrImported`}
                    options={goodsSources}
                    placeholder="Select source"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
