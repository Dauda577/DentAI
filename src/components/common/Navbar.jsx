import { useState } from 'react'
import { Menu, Bell, User, Settings, LogOut } from 'lucide-react'
import Breadcrumb from './Breadcrumb'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import SearchInput from '@/components/ui/SearchInput'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export default function Navbar({ onOpenMobileSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [globalSearch, setGlobalSearch] = useState('')

  const submitGlobalSearch = (e) => {
    e.preventDefault()
    if (!globalSearch.trim()) return
    navigate(`${ROUTES.PATIENTS}?q=${encodeURIComponent(globalSearch.trim())}`)
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          className="text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumb />
      </div>

      <form onSubmit={submitGlobalSearch} className="hidden max-w-xs flex-1 md:block">
        <SearchInput value={globalSearch} onChange={setGlobalSearch} placeholder="Search patients…" />
      </form>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
        >
          <Bell className="h-4.5 w-4.5" />
          <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-card-hover">
              <Avatar name={user?.name} size="sm" />
              <span className="hidden text-sm font-medium text-foreground sm:inline">{user?.name}</span>
            </button>
          }
        >
          <Dropdown.Item icon={User} onClick={() => navigate(ROUTES.SETTINGS)}>
            Profile
          </Dropdown.Item>
          <Dropdown.Item icon={Settings} onClick={() => navigate(ROUTES.SETTINGS)}>
            Settings
          </Dropdown.Item>
          <Dropdown.Item icon={LogOut} danger onClick={logout}>
            Logout
          </Dropdown.Item>
        </Dropdown>
      </div>
    </header>
  )
}
