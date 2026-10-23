import { useParams, navigate } from 'core/routing'
import { Button } from 'ui/basic/button'
import { routes } from '@/shared/route-paths'
import { useDemoData } from './demo-store'
import { shippingBillService } from './shipping-bill-service'
import { BillEditor } from './components/bill-editor'

/**
 * ShippingBillPage route entry component
 * Displays either the creation form or the editor for an existing shipping bill.
 */
export default function ShippingBillPage() {
  const { id } = useParams<{ id?: string }>()
  const { bills } = useDemoData()
  const bill = id ? (bills.find((item) => String(item.id) === id) || shippingBillService.getById(id)) : undefined

  if (id && !bill) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Shipping bill #{id} not found</h1>
        <p className="text-sm text-gray-500">The requested shipping bill record could not be located in local or remote records.</p>
        <Button onClick={() => navigate(routes.dashboard)}>← Return to dashboard</Button>
      </div>
    )
  }

  return <BillEditor key={id ?? 'new'} bill={bill} />
}
