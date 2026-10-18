import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { 
    LayoutDashboard, 
    CalendarDays, 
    FileText, 
    FolderClock, 
    HelpCircle,
    Search,
    Menu,
    ChevronDown,
    LogOut,
    Stethoscope,
    Users,
    X,
    Calendar,
    ShieldAlert
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import axios from '../../api/axios'
import { formatDoctorName } from '../../utils/formatters'

const DoctorDashBoard = () => {
    const navItems = [
        { name: 'Overview', path: '/doctor/dashboard', icon: LayoutDashboard, end: true },
        { name: 'Consultations', path: '/doctor/dashboard/appointments', icon: CalendarDays },
        { name: 'My Schedule', path: '/doctor/dashboard/schedule', icon: Calendar },
        { name: 'Prescriptions', path: '/doctor/dashboard/prescriptions', icon: FileText },
        { name: 'My Assistants', path: '/doctor/dashboard/assistants', icon: Users },
        { name: 'Patient Records', path: '/doctor/dashboard/records', icon: FolderClock },
    ]

    const { auth, setAuth } = useAuth()
    const navigate = useNavigate()
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [showLogoutAllModal, setShowLogoutAllModal] = useState(false)

    const handleLogout = async () => {
        try {
            await axios.post('/auth/logout')
        } catch {
        } finally {
            setAuth({})
            navigate('/login', { replace: true })
        }
    }

    const handleLogoutAll = () => {
        setIsProfileOpen(false)
        setShowLogoutAllModal(true)
    }

    const confirmLogoutAll = async () => {
        try {
            await axios.post('/auth/logout-all')
        } catch {
        } finally {
            setAuth({})
            navigate('/login', { replace: true })
        }
    }

    const todayDateFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    return (
        <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans relative">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <aside className={`
                fixed inset-y-0 left-0 z-40 lg:static lg:z-auto
                ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}
                h-full bg-white border-r border-slate-300/80 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
            `}>
                <div className="flex flex-col">
                    <div className="h-18 px-5 sm:px-6 flex items-center justify-between border-b border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/30">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            </div>
                            {isSidebarOpen && (
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                                        CareFlow
                                    </span>
                                    <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                        Physician Portal
                                    </span>
                                </div>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors lg:hidden cursor-pointer"
                                title="Close Sidebar"
                            >
                                <X size={18} />
                            </button>
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
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            setIsSidebarOpen(false)
                                        }
                                    }}
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
                                    <Icon size={19} className="shrink-0" />
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
                        title={!isSidebarOpen ? "Clinical Guidelines" : undefined}
                    >
                        <HelpCircle size={16} className="shrink-0" />
                        {isSidebarOpen && <span>Clinical Guidelines</span>}
                    </button>
                    {isSidebarOpen && (
                        <span className="text-[11px] font-medium text-slate-400 pl-0.5">
                            CareFlow v2.6.1
                        </span>
                    )}
                </div>
            </aside>

            <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
                <header className="h-18 w-full bg-white border-b border-slate-300/80 px-4 sm:px-8 flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
                        <button
                            onClick={() => setIsSidebarOpen(prev => !prev)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Toggle Sidebar"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="hidden sm:flex items-center text-xs font-semibold text-slate-500">
                            <span>{todayDateFormatted}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5 ml-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(prev => !prev)}
                                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none"
                            >
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                                    {(formatDoctorName(auth?.user) || 'D').replace(/^Dr\.\s*/i, '').charAt(0).toUpperCase() || 'D'}
                                </div>
                                <div className="hidden md:flex flex-col text-left">
                                    <span className="text-xs font-bold text-slate-900 leading-tight">
                                        {formatDoctorName(auth?.user || "Physician")}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500 leading-tight">
                                        Active Duty
                                    </span>
                                </div>
                                <ChevronDown size={15} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                                        <p className="text-xs font-bold text-slate-900">{formatDoctorName(auth?.user || "Doctor")}</p>
                                        <p className="text-[10px] text-slate-500">Physician</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
                                    >
                                        <LogOut size={14} className="text-slate-500" />
                                        <span>Sign out</span>
                                    </button>
                                    <button
                                        onClick={handleLogoutAll}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left border-t border-slate-100"
                                        title="Revoke all active sessions across all devices"
                                    >
                                        <ShieldAlert size={14} className="text-slate-500" />
                                        <span>Sign out all devices</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 w-full overflow-y-auto bg-slate-100 p-3 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>

            {showLogoutAllModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Sign Out All Devices</h3>
                                <p className="text-xs text-slate-500">Revoke all active sessions</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Are you sure you want to sign out from all devices? All other active sessions and login tokens will be immediately revoked.
                        </p>
                        <div className="flex items-center justify-end gap-2.5 pt-1">
                            <button
                                onClick={() => setShowLogoutAllModal(false)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogoutAll}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Sign out all devices
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DoctorDashBoard