import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type UserRole = 'teacher' | 'student'

interface SidebarProps {
  role: UserRole
  onOpenChange?: (open: boolean) => void
}

function Sidebar({ role, onOpenChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const navigate = useNavigate()

  const teacherItems = [
    { label: 'Profile', to: '/profile', icon: ProfileIcon },
    { label: 'Groups', to: '/groups', icon: GroupsIcon },
    { label: 'Manage', to: '/manage', icon: GroupsIcon },
  ]

  const studentItems = [
    { label: 'Profile', to: '/profile', icon: ProfileIcon },
    { label: 'Track', to: '/track', icon: PencilIcon },
    { label: 'Rewards', to: '/rewards', icon: RewardsIcon },
  ]

  const navItems = role === 'teacher' ? teacherItems : studentItems

  return (
    <>
      {/* Toggle button visible en móvil y desktop */}
      <button
        aria-label="Toggle sidebar"
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white/90 shadow hover:bg-white transition"
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          onOpenChange?.(next)
        }}
      >
        <MenuIcon />
      </button>

      {/* Overlay solo en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => {
            setIsOpen(false)
            onOpenChange?.(false)
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 shadow-lg z-50
          transform transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header con botón de cerrar en desktop */}
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500">STEP</h2>
            <button
              className="hidden md:inline-flex text-gray-600 hover:text-gray-900"
              onClick={() => {
                setIsOpen(false)
                onOpenChange?.(false)
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 13H5v-2h14v2z" />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition
                  ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`
                }
                onClick={() => {
                  // En móvil cerramos al navegar
                  if (window.innerWidth < 768) {
                    setIsOpen(false)
                    onOpenChange?.(false)
                  }
                }}
              >
                <Icon />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer (optional) */}
          <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
            <span>Role: {role}</span>
            <button
              aria-label="Sign out"
              className="inline-flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700"
              onClick={async () => {
                await supabase.auth.signOut()
                setIsOpen(false)
                onOpenChange?.(false)
                navigate('/')
              }}
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer para desktop cuando el sidebar está abierto */}
      <div className={`hidden md:block ${isOpen ? 'w-72' : 'w-0'} shrink-0`} />
    </>
  )
}

/* Icons */

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-800">
      <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-700">
      <path
        fill="currentColor"
        d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
      />
    </svg>
  )
}

function GroupsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-700">
      <path
        fill="currentColor"
        d="M16 11a4 4 0 1 0-4-4a4 4 0 0 0 4 4zm-8 0a3 3 0 1 0-3-3a3 3 0 0 0 3 3zm8 2c-2.67 0-8 1.34-8 4v1h12v-1c0-2.66-5.33-4-8-4zM8 13c-2.21 0-6 1.11-6 3v1h4v-1c0-1.07.58-2.04 1.57-2.83A10.78 10.78 0 0 1 8 13z"
      />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-700" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  )
}

function RewardsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-700">
      <path
        fill="currentColor"
        d="M12 2l2.39 4.84L20 7.27l-3.64 3.54L17.27 16L12 13.77L6.73 16l.91-5.19L4 7.27l5.61-.43L12 2z"
      />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-current" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 13v-2H7V8l-5 4l5 4v-3h9zm3-10H9a2 2 0 0 0-2 2v3h2V5h10v14H9v-3H7v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
      />
    </svg>
  )
}

export default Sidebar