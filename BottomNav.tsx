import React from 'react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/trades', label: 'Trades', icon: TradesIcon, end: false },
  { to: '/add', label: 'Add Trade', icon: AddIcon, end: false },
  { to: '/analytics', label: 'Analytics', icon: AnalyticsIcon, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false }
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-base-raised border-t border-base-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex max-w-lg mx-auto">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                isActive ? 'text-accent' : 'text-ink-faint'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon active={isActive} />
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

type IconProps = { active: boolean }

function DashboardIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : '#5A6270'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}
function TradesIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : '#5A6270'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  )
}
function AddIcon({ active }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : '#5A6270'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" />
    </svg>
  )
}
function AnalyticsIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : '#5A6270'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V9M12 19V5M20 19v-6" />
    </svg>
  )
}
function SettingsIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3B82F6' : '#5A6270'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.23.5.7.85 1.25 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
