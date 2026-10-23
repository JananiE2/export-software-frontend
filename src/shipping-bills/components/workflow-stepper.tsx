import { workflowSteps } from '../workflow'

interface WorkflowStepperProps {
  currentStepId?: string
}

export function WorkflowStepper({ currentStepId = 'shipping-bill' }: WorkflowStepperProps) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      {workflowSteps.map((step, index) => {
        const isCurrent = step.id === currentStepId
        return (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
              isCurrent
                ? 'border-primary-400 bg-primary-50/70 shadow-sm'
                : 'border-gray-200/80 bg-white hover:border-gray-300'
            }`}>
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                isCurrent
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500'
              }`}>
              {index + 1}
            </span>
            <div className="min-w-0">
              <p
                className={`truncate text-xs font-semibold ${
                  isCurrent ? 'text-primary-950' : 'text-gray-700'
                }`}>
                {step.title}
              </p>
              <p className="truncate text-[11px] text-gray-500">{step.description}</p>
            </div>
            {isCurrent && (
              <span className="ml-auto inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-800">
                Active
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
