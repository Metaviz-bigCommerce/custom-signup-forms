"use client"

import type React from "react"
import { useState } from "react"

interface Tab {
  id: number
  label: string
  content?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: number
  className?: string
  onTabChange?: (tabId: number) => void
}

export function Tabs({ tabs, defaultTab, className, onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabClick = (tabId: number) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className={`w-full ${className || ""}`}>
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative focus:outline-none rounded-lg border ${
              activeTab === tab.id
                ? "bg-blue-50 text-blue-700 border-blue-400"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && null}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div key={tab.id} className={`transition-opacity duration-200 ${activeTab === tab.id ? "block" : "hidden"}`}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}