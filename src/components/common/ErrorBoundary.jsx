import { Component } from 'react'
import { AlertOctagon } from 'lucide-react'
import Button from '@/components/ui/Button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Centralized log point — swap for a real error-reporting service later
    // without touching any component that throws.
    console.error('DentAI ErrorBoundary caught an error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false })
    window.location.assign('/dashboard')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
          <AlertOctagon className="h-10 w-10 text-destructive" />
          <h1 className="font-display text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. You can try reloading the dashboard, and if this keeps happening,
            contact support.
          </p>
          <Button onClick={this.handleReset}>Reload dashboard</Button>
        </div>
      )
    }

    return this.props.children
  }
}
