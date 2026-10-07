import { useState, useEffect, useRef } from 'react'
import { 
    ClipboardList, 
    Search, 
    Clock, 
    Globe, 
    Laptop, 
    Loader2, 
    RefreshCw, 
    AlertCircle 
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const AdminAuditLogs = () => {
    const axiosPrivate = useAxiosPrivate()

    const [logs, setLogs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [visibleCount, setVisibleCount] = useState(20)
    const observerTarget = useRef(null)

    const fetchLogs = async () => {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const response = await axiosPrivate.get('/Admin/audit-logs')
            if (Array.isArray(response.data)) {
                setLogs(response.data)
            } else {
                setLogs([])
            }
        } catch (error) {
            setErrorMessage('Unable to retrieve administrative audit logs. Check server status.')
            setLogs([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    useEffect(() => {
        setVisibleCount(20)
    }, [searchQuery, roleFilter, statusFilter])

    const filteredLogs = logs.filter(log => {
        const q = searchQuery.toLowerCase()
        const matchesSearch = 
            (log.userName || '').toLowerCase().includes(q) ||
            (log.userEmail || '').toLowerCase().includes(q) ||
            (log.ip || '').toLowerCase().includes(q) ||
            (log.userAgent || '').toLowerCase().includes(q)

        const matchesRole = roleFilter === 'ALL' || (log.role || '').toLowerCase() === roleFilter.toLowerCase()
        const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? log.isActive : !log.isActive)

        return matchesSearch && matchesRole && matchesStatus
    })

    const displayedLogs = filteredLogs.slice(0, visibleCount)

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && visibleCount < filteredLogs.length) {
                    setVisibleCount(prev => Math.min(prev + 15, filteredLogs.length))
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        )

        const currentTarget = observerTarget.current
        if (currentTarget) {
            observer.observe(currentTarget)
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget)
            }
        }
    }, [visibleCount, filteredLogs.length])

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 150 &&
                visibleCount < filteredLogs.length
            ) {
                setVisibleCount(prev => Math.min(prev + 15, filteredLogs.length))
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [visibleCount, filteredLogs.length])

    const totalSessionsCount = logs.length
    const activeSessionsCount = logs.filter(l => l.isActive).length

    const formatTimestamp = (dateStr) => {
        if (!dateStr) return 'N/A'
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="audit-logs-page flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Security Audit Logs
                    </h1>
                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                        Authentication sessions, IP origins, and active token states.
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors shrink-0 cursor-pointer"
                >
                    <RefreshCw size={15} />
                    Refresh Logs
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <ClipboardList size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Total Tracked Sessions</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{totalSessionsCount}</span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">Audit log records</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Clock size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Active Live Sessions</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{activeSessionsCount}</span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">Currently authorized</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by user, email, IP address, or user agent..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:outline-none focus:border-sky-500 shadow-sm"
                    />
                </div>

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full sm:w-44 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-800 bg-white focus:outline-none focus:border-sky-500 shadow-sm"
                >
                    <option value="ALL">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Patient">Patient</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-44 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium text-slate-800 bg-white focus:outline-none focus:border-sky-500 shadow-sm"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Sessions</option>
                    <option value="EXPIRED">Terminated Sessions</option>
                </select>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
                    <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-600">Loading audit logs...</p>
                </div>
            ) : errorMessage ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-2 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="text-xs sm:text-sm text-slate-800 font-semibold">{errorMessage}</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                        <ClipboardList size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Logs Recorded</h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                        {searchQuery ? 'No audit sessions match the search query.' : 'No audit sessions recorded in the security database yet.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">Session</th>
                                    <th className="py-3.5 px-5">User</th>
                                    <th className="py-3.5 px-5">Role</th>
                                    <th className="py-3.5 px-5">IP Address</th>
                                    <th className="py-3.5 px-5">Client Browser</th>
                                    <th className="py-3.5 px-5">Login Time</th>
                                    <th className="py-3.5 px-5 text-right">State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-800">
                                {displayedLogs.map((log) => (
                                    <tr key={log.sessionId} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-4 px-5 font-mono text-xs font-semibold text-slate-600">
                                            #{log.sessionId}
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{log.userName}</span>
                                                <span className="text-xs text-slate-500 font-mono">{log.userEmail}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className="text-xs font-semibold text-slate-700">
                                                {log.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 font-mono text-xs text-slate-700 font-semibold">
                                            <div className="flex items-center gap-1.5">
                                                <Globe size={13} className="text-slate-500 shrink-0" />
                                                <span>{log.ip || '127.0.0.1'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-slate-600 text-xs font-medium max-w-xs truncate" title={log.userAgent}>
                                            <div className="flex items-center gap-1.5">
                                                <Laptop size={13} className="text-slate-500 shrink-0" />
                                                <span className="truncate">{log.userAgent || 'Web Client'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-slate-700 text-xs font-medium">
                                            {formatTimestamp(log.loginTime)}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <span className="text-xs font-semibold text-slate-600">
                                                {log.isActive ? 'Active' : 'Terminated'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div ref={observerTarget} className="py-4 text-center text-xs font-semibold text-slate-500 border-t border-slate-100">
                        {visibleCount < filteredLogs.length ? (
                            <span className="flex items-center justify-center gap-2 text-sky-600 font-medium">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading more sessions... ({displayedLogs.length} of {filteredLogs.length})
                            </span>
                        ) : (
                            <span>Showing all {filteredLogs.length} sessions</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminAuditLogs
