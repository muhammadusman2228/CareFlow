import { useState, useEffect } from 'react'
import { 
    Users, 
    Stethoscope, 
    Calendar, 
    Banknote, 
    Loader2, 
    RefreshCw, 
    AlertCircle 
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const DEPARTMENT_COLORS = [
    '#0284c7',
    '#0d9488',
    '#0891b2',
    '#059669',
    '#4f46e5',
    '#7c3aed',
    '#e11d48',
    '#d97706',
    '#2563eb',
    '#64748b'
]

const AdminOverview = () => {
    const axiosPrivate = useAxiosPrivate()

    const [dashboardData, setDashboardData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [hoveredDept, setHoveredDept] = useState(null)

    const currentDate = new Date().toLocaleDateString('en-US', {
        timeZone: 'Asia/Karachi',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    const fetchDashboardData = async () => {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const response = await axiosPrivate.get('/Admin/dashboard')
            setDashboardData(response.data)
        } catch (error) {
            setErrorMessage('Unable to load dashboard data. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const completedAppointmentsCount = dashboardData?.completedAppointments ?? 0
    const confirmedAppointmentsCount = dashboardData?.confirmedAppointments ?? 0
    const pendingAppointmentsCount = dashboardData?.pendingAppointments ?? 0
    const cancelledAppointmentsCount = dashboardData?.cancelledAppointments ?? 0
    const todayAppointmentsCount = dashboardData?.todayAppointments ?? 0

    const departmentWorkloadList = dashboardData?.departmentWorkload || []
    const totalTodayDepartmentScheduled = departmentWorkloadList.reduce((sum, item) => sum + (item.appointmentCount || 0), 0)

    const activities = dashboardData?.recentActivities || []
    const past7Days = (() => {
        const list = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            list.push(d.toLocaleDateString('en-US', { weekday: 'short' }))
        }
        return list
    })()

    const weeklyTrends = dashboardData?.weeklyCompletedTrends || [0, 0, 0, 0, 0, 0, 0]
    const maxTrendVal = Math.max(...weeklyTrends, 5)

    const radius = 95
    const circumference = 2 * Math.PI * radius

    const enrichedDepartments = departmentWorkloadList.map((dept, index) => {
        const count = dept.appointmentCount || 0
        const percent = totalTodayDepartmentScheduled > 0 
            ? Math.round((count / totalTodayDepartmentScheduled) * 100) 
            : 0
        return {
            ...dept,
            percent,
            color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]
        }
    })

    let accumulatedOffset = 0
    const donutSlices = enrichedDepartments.length > 0
        ? enrichedDepartments.map((dept) => {
            const fraction = totalTodayDepartmentScheduled > 0
                ? ((dept.appointmentCount || 0) > 0 ? (dept.appointmentCount / totalTodayDepartmentScheduled) : 0)
                : (1 / enrichedDepartments.length)
            const arcLength = fraction * circumference
            const slice = {
                ...dept,
                arcLength,
                offset: accumulatedOffset
            }
            accumulatedOffset += arcLength
            return slice
        })
        : []

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-600">Loading dashboard data...</p>
            </div>
        )
    }

    if (errorMessage) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-3 max-w-md mx-auto shadow-sm">
                <AlertCircle className="w-9 h-9 text-rose-500" />
                <p className="text-sm font-semibold text-slate-800">{errorMessage}</p>
                <button
                    onClick={fetchDashboardData}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                    <RefreshCw size={14} />
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Top KPI Cards
                    </h1>
                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                        Hospital activity and key performance metrics.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">
                        {currentDate}
                    </span>
                    <button
                        onClick={fetchDashboardData}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Users size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Total Patients</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {dashboardData?.totalPatients ?? 0}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                            +{dashboardData?.monthlyTrends ?? 0} this month
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Stethoscope size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Active Doctors</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {dashboardData?.totalDoctors ?? 0}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                            Verified practitioners
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Calendar size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Appointments Today</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {todayAppointmentsCount}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                            {pendingAppointmentsCount} pending review
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Banknote size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Daily Revenue</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            ${dashboardData?.dailyRevenue ? Number(dashboardData.dailyRevenue).toFixed(2) : '0.00'}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                            Completed billings
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                Completed Consultations
                            </h2>
                            <span className="text-xs sm:text-sm font-medium text-slate-600">
                                Real-time weekly consultation trends
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-extrabold text-slate-900">
                                {completedAppointmentsCount}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-500">total</span>
                        </div>
                    </div>

                    <div className="relative w-full h-64 pt-4">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 460 170">
                            <g className="text-xs fill-slate-500 font-semibold">
                                <line x1="20" y1="20" x2="440" y2="20" stroke="#e2e8f0" strokeWidth="1" />
                                <text x="10" y="24" textAnchor="end">{maxTrendVal}</text>

                                <line x1="20" y1="65" x2="440" y2="65" stroke="#e2e8f0" strokeWidth="1" />
                                <text x="10" y="69" textAnchor="end">{Math.round(maxTrendVal * 0.6)}</text>

                                <line x1="20" y1="110" x2="440" y2="110" stroke="#e2e8f0" strokeWidth="1" />
                                <text x="10" y="114" textAnchor="end">{Math.round(maxTrendVal * 0.3)}</text>

                                <line x1="20" y1="145" x2="440" y2="145" stroke="#cbd5e1" strokeWidth="1" />
                                <text x="10" y="148" textAnchor="end">0</text>
                            </g>

                            {past7Days.map((day, idx) => {
                                const x = 50 + idx * 56
                                const val = weeklyTrends[idx] ?? 0
                                const barH = maxTrendVal > 0 && val > 0 
                                    ? Math.max((val / maxTrendVal) * 115, 8) 
                                    : 0
                                const y = 145 - barH

                                return (
                                    <g key={day}>
                                        {val > 0 && (
                                            <text
                                                x={x + 12}
                                                y={y - 5}
                                                textAnchor="middle"
                                                className="text-[11px] fill-slate-700 font-bold"
                                            >
                                                {val}
                                            </text>
                                        )}
                                        <rect
                                            x={x}
                                            y={y}
                                            width="24"
                                            height={Math.max(barH, 2)}
                                            rx="4"
                                            fill="#0284c7"
                                            className="transition-all duration-300"
                                        />
                                        <text
                                            x={x + 12}
                                            y="164"
                                            textAnchor="middle"
                                            className="text-xs fill-slate-600 font-semibold"
                                        >
                                            {day}
                                        </text>
                                    </g>
                                )
                            })}
                        </svg>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-medium text-slate-600">
                        <span>Database Stream</span>
                        <span className="font-bold text-slate-800">{completedAppointmentsCount} consultations recorded</span>
                    </div>
                </div>

                <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                Department Load Distribution
                            </h2>
                            <span className="text-xs sm:text-sm font-medium text-slate-600">
                                Scheduled appointments and clinical workload
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base sm:text-lg font-extrabold text-slate-900">
                                {totalTodayDepartmentScheduled} Total
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-slate-500">scheduled</span>
                        </div>
                    </div>

                    <div className="py-6 flex items-center justify-center min-h-[260px]">
                        <div className="relative w-60 h-60 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
                                <circle
                                    cx="130"
                                    cy="130"
                                    r={radius}
                                    fill="none"
                                    stroke="#f1f5f9"
                                    strokeWidth="30"
                                />

                                {donutSlices.map((slice) => (
                                    <circle
                                        key={slice.departmentName}
                                        cx="130"
                                        cy="130"
                                        r={radius}
                                        fill="none"
                                        stroke={slice.color}
                                        strokeWidth="30"
                                        strokeDasharray={`${slice.arcLength} ${circumference - slice.arcLength}`}
                                        strokeDashoffset={-slice.offset}
                                        strokeLinecap="butt"
                                        className="transition-all duration-500 cursor-pointer hover:opacity-85"
                                        onMouseEnter={() => setHoveredDept(slice)}
                                        onMouseLeave={() => setHoveredDept(null)}
                                    />
                                ))}
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {hoveredDept ? hoveredDept.departmentName : 'Clinical Load'}
                                </span>
                                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                                    {hoveredDept ? `${hoveredDept.percent}%` : totalTodayDepartmentScheduled}
                                </span>
                                <span className="text-xs font-semibold text-slate-500 mt-1">
                                    {hoveredDept ? `${hoveredDept.appointmentCount || 0} scheduled` : 'Appointments Today'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-medium text-slate-600">
                        <span>Active Clinical Units</span>
                        <span className="font-bold text-slate-800">{departmentWorkloadList.length} units</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        Today's System Activities
                    </h2>
                    <span className="text-xs sm:text-sm text-slate-600 font-semibold">
                        {activities.length} entries (Today)
                    </span>
                </div>

                {activities.length === 0 ? (
                    <div className="p-10 text-center text-sm font-medium text-slate-500">
                        No recent activity recorded yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">Time</th>
                                    <th className="py-3.5 px-6">User</th>
                                    <th className="py-3.5 px-6">Action</th>
                                    <th className="py-3.5 px-6">Module</th>
                                    <th className="py-3.5 px-6 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-800">
                                {activities.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-600">
                                            {item.time || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-900">
                                            {item.user || 'Unknown'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-800">
                                            {item.action || 'Activity'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600">
                                            {item.module || 'System'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs sm:text-sm font-semibold text-slate-600">
                                                {item.status || 'Success'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminOverview