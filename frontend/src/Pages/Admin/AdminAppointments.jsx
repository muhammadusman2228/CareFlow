import { useState, useEffect, useMemo } from 'react'
import { 
    CalendarCheck, 
    CalendarDays, 
    ChevronLeft, 
    ChevronRight, 
    Search, 
    Clock, 
    User, 
    Stethoscope, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    RotateCcw, 
    Phone, 
    Building2, 
    Loader2,
    Calendar,
    ArrowRightLeft,
    Check,
    Filter
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import Pagination from '../../components/common/Pagination'

const AdminAppointments = () => {
    const axiosPrivate = useAxiosPrivate()

    const getPktDateParts = () => {
        const pktStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
        const [y, m, d] = pktStr.split('-').map(Number)
        return { year: y, month: m, day: d, dateStr: pktStr }
    }

    const initialPkt = useMemo(() => getPktDateParts(), [])
    const [currentYear, setCurrentYear] = useState(initialPkt.year)
    const [currentMonth, setCurrentMonth] = useState(initialPkt.month) // 1-12
    const [selectedDate, setSelectedDate] = useState(null) // 'YYYY-MM-DD' or null for all month
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [page, setPage] = useState(1)

    const [summaryData, setSummaryData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1)
    }, [searchQuery, statusFilter, selectedDate])

    const fetchMonthlyAppointments = async (year, month) => {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const response = await axiosPrivate.get(`/Admin/monthly-appointments?year=${year}&month=${month}`)
            setSummaryData(response.data)
        } catch (error) {
            setErrorMessage('Unable to load appointments. Please check connection.')
            setSummaryData(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMonthlyAppointments(currentYear, currentMonth)
    }, [currentYear, currentMonth])

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentYear(prev => prev - 1)
            setCurrentMonth(12)
        } else {
            setCurrentMonth(prev => prev - 1)
        }
        setSelectedDate(null)
    }

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentYear(prev => prev + 1)
            setCurrentMonth(1)
        } else {
            setCurrentMonth(prev => prev + 1)
        }
        setSelectedDate(null)
    }

    const handleResetCurrentMonth = () => {
        const pkt = getPktDateParts()
        setCurrentYear(pkt.year)
        setCurrentMonth(pkt.month)
        setSelectedDate(null)
    }

    // Today in PKT format: YYYY-MM-DD (Pakistan Standard Time)
    const todayPktStr = useMemo(() => {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
    }, [])

    // Filter appointments
    const filteredAppointments = useMemo(() => {
        if (!summaryData?.appointments) return []
        return summaryData.appointments.filter(appt => {
            // Date filter
            if (selectedDate && appt.appointmentDate !== selectedDate) {
                return false
            }

            // Status filter
            if (statusFilter !== 'ALL') {
                const s = (appt.status || '').toUpperCase()
                if (statusFilter === 'BOOKED' && !['BOOKED', 'CONFIRMED', 'PENDING'].includes(s)) return false
                if (statusFilter === 'CHECKEDIN' && s !== 'CHECKEDIN') return false
                if (statusFilter === 'COMPLETED' && s !== 'COMPLETED') return false
                if (statusFilter === 'CANCELLED' && s !== 'CANCELLED') return false
                if (statusFilter === 'MISSED' && s !== 'MISSED') return false
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const pName = (appt.patientName || '').toLowerCase()
                const pPhone = (appt.patientPhone || '').toLowerCase()
                const dName = (appt.doctorName || '').toLowerCase()
                const dept = (appt.departmentName || '').toLowerCase()
                return pName.includes(q) || pPhone.includes(q) || dName.includes(q) || dept.includes(q)
            }

            return true
        })
    }, [summaryData, selectedDate, statusFilter, searchQuery])

    // Paginated appointments
    const pageSize = 15
    const paginatedAppointments = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredAppointments.slice(start, start + pageSize)
    }, [filteredAppointments, page])

    const getStatusBadge = (status) => {
        const s = (status || '').toUpperCase()
        let label = 'Booked'
        if (s === 'COMPLETED') label = 'Completed'
        else if (s === 'CHECKEDIN') label = 'Checked In'
        else if (s === 'CANCELLED') label = 'Cancelled'
        else if (s === 'MISSED') label = 'Missed'
        else if (s === 'BOOKED' || s === 'PENDING' || s === 'CONFIRMED') label = 'Booked'

        return (
            <span className="text-xs sm:text-sm font-medium text-slate-500">
                {label}
            </span>
        )
    }

    const formatTimeSlot = (timeStr) => {
        if (!timeStr) return '--:--'
        const parts = timeStr.split(':')
        let hours = parseInt(parts[0], 10)
        const minutes = parts[1] || '00'
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12 || 12
        return `${hours}:${minutes} ${ampm}`
    }

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return ''
        const [y, m, d] = dateStr.split('-').map(Number)
        if (!y || !m || !d) return dateStr
        const dateObj = new Date(y, m - 1, d)
        return dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className="admin-appointments p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Header with Title & Navigation Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <CalendarCheck size={26} className="text-sky-600 shrink-0" />
                        Appointments Ledger & Analytics
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Track daily consultation capacity, inspect booked slots, and navigate monthly patient schedules.
                    </p>
                </div>

                {/* Month Navigator Toolbar */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-xs self-start md:self-auto">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Previous Month"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-2 px-2 text-sm font-bold text-slate-800 min-w-36 justify-center">
                        <CalendarDays size={16} className="text-sky-600" />
                        <span>{summaryData?.monthName || `${currentMonth} / ${currentYear}`}</span>
                    </div>

                    <button
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Next Month"
                    >
                        <ChevronRight size={18} />
                    </button>

                    <button
                        onClick={handleResetCurrentMonth}
                        className="ml-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
                    <span>{errorMessage}</span>
                    <button
                        onClick={() => fetchMonthlyAppointments(currentYear, currentMonth)}
                        className="font-semibold underline hover:no-underline ml-4 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* 4 KPI Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="kpi-card bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center gap-4 border border-slate-200/80">
                    <div className="kpi-icon-box w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Calendar size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Today's Appointments</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {summaryData?.todayAppointmentsCount ?? (isLoading ? '...' : 0)}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">Active consultations today</span>
                    </div>
                </div>

                <div className="kpi-card bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center gap-4 border border-slate-200/80">
                    <div className="kpi-icon-box w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <CalendarCheck size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Total in Month</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {summaryData?.totalMonthAppointmentsCount ?? (isLoading ? '...' : 0)}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">Across all departments</span>
                    </div>
                </div>

                <div className="kpi-card bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center gap-4 border border-slate-200/80">
                    <div className="kpi-icon-box w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <CheckCircle2 size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Completed</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {summaryData?.completedCount ?? (isLoading ? '...' : 0)}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">Prescriptions finalized</span>
                    </div>
                </div>

                <div className="kpi-card bg-white rounded-2xl p-5 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all flex items-center gap-4 border border-slate-200/80">
                    <div className="kpi-icon-box w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <AlertCircle size={22} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Cancelled and Missed</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {(summaryData?.cancelledCount ?? 0) + (summaryData?.missedCount ?? 0)}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                            {summaryData?.cancelledCount ?? 0} cancelled, {summaryData?.missedCount ?? 0} no-show
                        </span>
                    </div>
                </div>
            </div>

            {/* Monthly Calendar / Daily Breakdown Grid */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xl shadow-slate-900/10 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                            Daily Breakdown for {summaryData?.monthName || 'Month Overview'}
                        </h2>
                        {selectedDate && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                Filtering: {formatDateDisplay(selectedDate)}
                            </span>
                        )}
                    </div>
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="text-xs font-semibold text-slate-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <RotateCcw size={12} />
                            Show All Month Days
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Loader2 size={28} className="animate-spin text-sky-600" />
                        <span className="text-xs font-medium">Loading monthly appointments...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                        {summaryData?.dailyCounts?.map(day => {
                            const dateStr = day.date
                            const [y, m, d] = (dateStr || '').split('-').map(Number)
                            const dayNumber = d || day.day
                            const weekday = y && m && d 
                                ? new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' }) 
                                : (day.dayOfWeek || '')
                            const isToday = dateStr === todayPktStr
                            const isSelected = selectedDate === dateStr
                            const isCardActive = isSelected || (!selectedDate && isToday && currentMonth === initialPkt.month && currentYear === initialPkt.year)
                            const hasAppts = day.totalCount > 0

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                                    className={`
                                        p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-22 cursor-pointer
                                        ${isCardActive 
                                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs' 
                                            : isToday 
                                                ? 'bg-white border-sky-300 hover:border-sky-400 shadow-xs' 
                                                : hasAppts 
                                                    ? 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs' 
                                                    : 'bg-slate-50/60 border-slate-200/60 opacity-60 hover:opacity-100'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className={`text-xs font-semibold ${isCardActive ? 'text-white' : 'text-slate-500'}`}>
                                            {weekday}
                                        </span>
                                        {isToday && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                isCardActive 
                                                    ? 'bg-white/20 border border-white/30 text-white' 
                                                    : 'bg-sky-100 text-sky-700 border border-sky-200'
                                            }`}>
                                                Today
                                            </span>
                                        )}
                                    </div>

                                    <div className="my-1">
                                        <span className={`text-xl font-black ${isCardActive ? 'text-white' : isToday ? 'text-sky-600' : 'text-slate-900'}`}>
                                            {dayNumber}
                                        </span>
                                    </div>

                                    <span className={`text-xs ${isCardActive ? 'text-white font-medium' : hasAppts ? 'text-sky-600 font-bold' : 'text-slate-400 font-medium'}`}>
                                        {day.totalCount} {day.totalCount === 1 ? 'appt' : 'appts'}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Granular Appointments Ledger Table */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xl shadow-slate-900/10 flex flex-col gap-4">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient, phone, doctor, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={15} className="text-slate-400 shrink-0" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="BOOKED">Booked and Pending</option>
                            <option value="CHECKEDIN">Checked In</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="MISSED">Missed</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                                <th className="py-3 px-4">Patient</th>
                                <th className="py-3 px-4">Doctor and Department</th>
                                <th className="py-3 px-4">Date and Time</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Routing Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <CalendarCheck size={32} className="text-slate-300" />
                                            <span className="font-medium text-sm">No appointments found matching current filters.</span>
                                            {selectedDate && (
                                                <button
                                                    onClick={() => setSelectedDate(null)}
                                                    className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                                                >
                                                    Clear date filter
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedAppointments.map(appt => (
                                    <tr key={appt.appointmentId} className="hover:bg-slate-50/70 transition-colors">
                                        {/* Patient */}
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{appt.patientName}</span>
                                                {appt.patientPhone && (
                                                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Phone size={11} className="text-slate-400" />
                                                        {appt.patientPhone}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Doctor & Dept */}
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                                    <Stethoscope size={13} className="text-slate-400 shrink-0" />
                                                    {appt.doctorName}
                                                </span>
                                                {appt.departmentName && (
                                                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 capitalize">
                                                        <Building2 size={11} className="text-slate-400" />
                                                        {appt.departmentName}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date & Time */}
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">
                                                    {formatDateDisplay(appt.appointmentDate)}
                                                </span>
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Clock size={11} className="text-slate-400" />
                                                    {formatTimeSlot(appt.timeSlot)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-4">
                                            {getStatusBadge(appt.status)}
                                        </td>

                                        {/* Routing / Diversion */}
                                        <td className="py-3 px-4">
                                            {appt.isDiverted ? (
                                                <span 
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                                    title={appt.diversionReason ? `Reason: ${appt.diversionReason}` : 'Diverted from original physician'}
                                                >
                                                    <ArrowRightLeft size={11} className="text-slate-500" />
                                                    <span>Diverted {appt.originalDoctorName ? `(from ${appt.originalDoctorName})` : ''}</span>
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">
                                                    Direct
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredAppointments.length > pageSize && (
                    <Pagination
                        currentPage={page}
                        totalItems={filteredAppointments.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    )
}

export default AdminAppointments
