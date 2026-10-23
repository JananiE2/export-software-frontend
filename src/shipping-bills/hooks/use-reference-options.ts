import { useEffect, useState } from 'react'

interface UseReferenceOptionsResult<T> {
  data: T[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  reload: () => void
}

/**
 * Custom React hook to asynchronously fetch reference options with state management.
 * Keeps data fetching and state logic out of UI components.
 */
export function useReferenceOptions<T>(
  fetcher: () => Promise<T[]>,
  deps: React.DependencyList = []
): UseReferenceOptionsResult<T> {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setIsError(false)
    setError(null)

    fetcher()
      .then((result) => {
        if (active) {
          setData(result)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setIsError(true)
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [trigger, ...deps])

  return {
    data,
    isLoading,
    isError,
    error,
    reload: () => setTrigger((prev) => prev + 1)
  }
}
