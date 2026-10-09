import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { 
    Activity, 
    FlaskConical, 
    HelpCircle, 
    Search, 
    Menu, 
    ChevronDown, 
    LogOut, 
    UserCheck,
    ClipboardList,
    Clock
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import axios from '../../api/axios'

const AssistantDashboard = () => {
    const navItems = [
        { name: 'Patient Triage & Vitals', path: '/assistant/dashboard', icon: Activity, end: true },
        { name: 'Diagnostic Lab Desk', path: '/assistant/dashboard/labs', icon: FlaskConical },
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

    const todayDateFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    return (
        <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
            <aside className={`
                ${isSidebarOpen ? 'w-64' : 'w-20'}
                h-full bg-white border-r border-slate-300/80 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out
            `}>
                <div className="flex flex-col">
                    <div className="h-18 px-6 flex items-center gap-3 border-b border-slate-100 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 shadow-xs">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col">
                                <span className="text-base font-bold tracking-tight text-slate-900 truncate">
                                    CareFlow
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                    Clinical Assistant
                                </span>
                            </div>
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
                                            ? 'bg-slate-100 text-slate-950 font-semibold shadow-xs' 
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
                    <div className={`flex items-center gap-2 text-xs font-medium text-slate-500 ${!isSidebarOpen && 'justify-center'}`}>
                        <Clock size={15} className="shrink-0 text-slate-400" />
                        {isSidebarOpen && <span className="font-mono text-[11px]">PKT (UTC+5) Shift</span>}
                    </div>
                    {isSidebarOpen && (
                        <span className="text-[11px] font-medium text-slate-400 pl-0.5">
                            CareFlow Hospital v2.6.1
                        </span>
                    )}
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                <header className="h-18 bg-white border-b border-slate-300/80 px-4 sm:px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex flex-col">
                            <span className="text-xs font-semibold text-slate-500">{todayDateFormatted}</span>
                            <span className="text-xs font-bold text-slate-900">Patient Triage & Medical Orders Desk</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                    {auth.user ? auth.user.substring(0, 2).toUpperCase() : 'AS'}
                                </div>
                                <div className="hidden sm:flex flex-col text-left">
                                    <span className="text-xs font-bold text-slate-900 leading-tight">
                                        {auth.user || 'Clinical Assistant'}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500">
                                        Medical Assistant
                                    </span>
                                </div>
                                <ChevronDown size={14} className="text-slate-400" />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50">
                                    <div className="px-3.5 py-2 border-b border-slate-100">
                                        <p className="text-xs font-bold text-slate-900 truncate">{auth.user}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Duty: Triage & Labs</p>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut size={14} />
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AssistantDashboard
