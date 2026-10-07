import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { 
    LayoutDashboard, 
    Stethoscope, 
    Building2, 
    CalendarDays, 
    Users, 
    ClipboardList, 
    HelpCircle,
    Search,
    Menu,
    ChevronDown,
    LogOut
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import axios from '../../api/axios'
const AdminDashBoard = () => {
    const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Doctors Management', path: '/admin/dashboard/doctors', icon: Stethoscope },
    { name: 'Departments', path: '/admin/dashboard/departments', icon: Building2 },
    { name: 'Schedules & Shifts', path: '/admin/dashboard/schedules', icon: CalendarDays },
    { name: 'Patients', path: '/admin/dashboard/patients', icon: Users },
    { name: 'Audit Logs', path: '/admin/dashboard/audit-logs', icon: ClipboardList }
]
  
    const { auth, setAuth } = useAuth()
const navigate = useNavigate()
const [isSidebarOpen, setIsSidebarOpen] = useState(true)
const [isProfileOpen, setIsProfileOpen] = useState(false)
const handleLogout = async () => {
    try {
        await axios.post('/auth/logout')
    } catch {
    } finally {
        setAuth({})
        navigate('/login', { replace: true })
    }
}
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
          <aside className={`
    ${isSidebarOpen ? 'w-64' : 'w-20'}
    h-full bg-white border-r border-slate-300/80 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out
`}>
    <div className="flex flex-col">
        <div className="h-18 px-6 flex items-center gap-3 border-b border-slate-100 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
            </div>
            {isSidebarOpen && (
                <span className="text-xl font-bold tracking-tight text-slate-900 truncate">
                    CareFlow
                </span>
            )}
        </div>

        <nav className="p-3 sm:p-4 flex flex-col gap-1.5">
            {navItems.map((item) => {
                const Icon = item.icon
                return (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) => `
                            flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all
                            ${isActive 
                                ? 'bg-sky-50 text-sky-600 font-semibold shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }
                            ${!isSidebarOpen && 'justify-center px-0'}
                        `}
                        title={!isSidebarOpen ? item.name : undefined}
                    >
                        <Icon size={20} className="shrink-0" />
                        {isSidebarOpen && (
                            <span className="truncate">{item.name}</span>
                        )}
                    </NavLink>
                )
            })}
        </nav>
    </div>

    <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
        <button 
            className={`flex items-center gap-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors ${!isSidebarOpen && 'justify-center'}`}
            title={!isSidebarOpen ? "Help center" : undefined}
        >
            <HelpCircle size={16} className="shrink-0" />
            {isSidebarOpen && <span>Help center</span>}
        </button>
        {isSidebarOpen && (
            <span className="text-[11px] font-medium text-slate-400 pl-0.5">
                CareFlow v2.6.1
            </span>
        )}
    </div>
</aside>
            <div className="div flex-1 h-full flex flex-col overflow-hidden min-w-0">
              <header className="h-18 w-full bg-white border-b border-slate-300/80 px-4 sm:px-8 flex items-center justify-between shrink-0 z-20">
    <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Sidebar"
        >
            <Menu size={20} />
        </button>

       <div className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 shadow-xs focus-within:border-sky-500 focus-within:ring-3 focus-within:ring-sky-500/15 transition-all">
    <Search size={17} className="text-slate-400 shrink-0" />
    <input
        type="text"
        placeholder="Search patients, doctors, appointments..."
        className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
    />
</div>
    </div>

    <div className="flex items-center gap-3 sm:gap-5 ml-4">
        <div className="relative">
            <button
                onClick={() => setIsProfileOpen(prev => !prev)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none"
            >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                    {(auth?.user || "A").charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                        Admin Profile
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 leading-tight">
                        {auth?.user || "Dr. Sarah Chen"}
                    </span>
                </div>
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                        <p className="text-xs font-bold text-slate-900">{auth?.user || "Admin"}</p>
                        <p className="text-[10px] text-slate-500">Administrator</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                        <LogOut size={14} />
                        <span>Sign out</span>
                    </button>
                </div>
            )}
        </div>
    </div>
</header>
                <main className="flex-1 w-full overflow-y-auto bg-slate-50/70 p-6 sm:p-8">

                   <Outlet/>
                </main>
            </div>
        </div>
    )
}

export default AdminDashBoard