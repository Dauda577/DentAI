import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog'

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.NEW_DIAGNOSIS, label: 'New Diagnosis', icon: Stethoscope },
  { to: ROUTES.PATIENTS, label: 'Patients', icon: Users },
  { to: ROUTES.REPORTS, label: 'Reports', icon: FileText },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
]

function SidebarContent({ isCollapsed, onNavigate }) {
  const { logout } = useAuth()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
          <Stethoscope className="h-4.5 w-4.5 text-accent" />
        </div>
        {!isCollapsed && <span className="font-display text-base font-semibold text-foreground">DentAI</span>}
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
              ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  />
                )}
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-card-hover hover:text-foreground"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

      <ConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={() => { setShowLogoutDialog(false); logout() }}
        title="Sign out"
        description="Are you sure you want to sign out of DentAI?"
        confirmLabel="Sign out"
      />
    </div>
  )
}

export default function Sidebar({ isCollapsed, toggleCollapsed, isMobileOpen, closeMobile }) {
  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: isCollapsed ? 76 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="relative hidden shrink-0 border-r border-border lg:block"
      >
        <SidebarContent isCollapsed={isCollapsed} />
        <button
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full
            border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={closeMobile}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="relative h-full w-64 border-r border-border"
            >
              <button
                onClick={closeMobile}
                aria-label="Close menu"
                className="absolute right-3 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent isCollapsed={false} onNavigate={closeMobile} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
