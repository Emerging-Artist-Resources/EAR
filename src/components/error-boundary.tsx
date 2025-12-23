"use client"

import React, { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service in production
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <Text className="text-xl font-bold mb-2">Something went wrong</Text>
            <Text className="text-gray-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </Text>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-xs bg-gray-100 p-2 rounded mb-4 overflow-auto">
                {this.state.error.stack}
              </pre>
            )}
            <Button onClick={this.handleReset} variant="default">
              Try again
            </Button>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
