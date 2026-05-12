import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Shell } from '@/components/layout/Shell'

function App() {
  return (
    <ErrorBoundary>
      <Shell />
    </ErrorBoundary>
  )
}

export default App
