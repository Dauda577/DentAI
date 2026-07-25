import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from '@/components/common/Sidebar'
import Navbar from '@/components/common/Navbar'
import ToastContainer from '@/components/ui/Toast'
import { useSidebar } from '@/hooks/useSidebar'
import { useLocation } from 'react-router-dom'

export default function DashboardLayout() {
  const { isCollapsed, toggleCollapsed, isMobileOpen, toggleMobile, closeMobile } = useSidebar()
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]
          focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapsed={toggleCollapsed}
        isMobileOpen={isMobileOpen}
        closeMobile={closeMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMobileSidebar={toggleMobile} />

        <main id="main-content" className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="mx-auto max-w-7xl px-4 py-6 lg:px-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
