"use client"

import type React from "react"
import { useState } from "react"
import { LucideIcon } from "lucide-react"

interface Tab {
  id: number
  label: string
  content?: React.ReactNode
  icon?: LucideIcon
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
    <div className={`w-full flex flex-col ${className || ""}`}>
      {/* Modern Tab Headers */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-300 rounded-xl focus:outline-none group ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/80"
              }`}
            >
              {Icon && (
                <Icon className={`w-4 h-4 transition-all duration-300 relative z-10 ${
                  isActive 
                    ? "text-white" 
                    : "text-slate-600 group-hover:text-slate-800"
                } ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content with smooth transitions */}
      <div className="flex-1 overflow-hidden relative">
        {tabs.map((tab) => (
          <div 
            key={tab.id} 
            className={`h-full transition-all duration-300 ${
              activeTab === tab.id 
                ? "opacity-100 translate-y-0 block" 
                : "opacity-0 translate-y-2 hidden pointer-events-none"
            }`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}