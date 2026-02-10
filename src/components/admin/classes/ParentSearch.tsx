"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { ParentWorkshopOption } from "./types"

interface ParentSearchProps {
  onSelect: (parentId: string) => void
  selectedParentId?: string | null
}

export function ParentSearch({ onSelect, selectedParentId }: ParentSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ParentWorkshopOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchParents = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/admin/classes/parents/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (!response.ok) throw new Error("Search failed")
      const json = await response.json()
      setResults(json.data || [])
      setShowResults(true)
    } catch (error) {
      console.error("Error searching parents:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchParents(query)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, searchParents])

  useEffect(() => {
    if (!showResults) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (containerRef.current && !containerRef.current.contains(target)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showResults])

  const handleSelect = (parentId: string, title: string) => {
    onSelect(parentId)
    setShowResults(false)
    setQuery(title)
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Search for Parent Workshop
      </label>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search for parent workshops..."
        onFocus={() => query && setShowResults(true)}
      />
      {isSearching && (
        <div className="absolute right-3 top-8 text-sm text-gray-500">
          Searching...
        </div>
      )}
      {showResults && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id, item.title)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <div className="font-medium text-gray-900">{item.title}</div>
            </button>
          ))}
        </div>
      )}
      {showResults && query && !isSearching && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-lg">
          No parent workshops found. Try a different search term.
        </div>
      )}
    </div>
  )
}
