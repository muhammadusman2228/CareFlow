import { useState, useEffect } from 'react'
import { 
    Receipt, 
    Search, 
    RefreshCw, 
    Calendar, 
    UserCheck, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    AlertCircle, 
    Loader2, 
    Eye, 
    ShieldCheck, 
    Banknote, 
    CreditCard, 
    Building2, 
    X,
    Check,
    Filter,
    Lock
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import Pagination from '../../components/common/Pagination'
import PaymentReceiptModal from '../../components/common/PaymentReceiptModal'

const getTodayPkt = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())

const AdminSettlements = () => {
    const axiosPrivate = useAxiosPrivate()

    const [reports, setReports] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState('')

    const [dateFilter, setDateFilter] = useState(() => getTodayPkt())
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const [selectedReport, setSelectedReport] = useState(null)
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
    const [adminNotes, setAdminNotes] = useState('')
    const [isSubmittingAudit, setIsSubmittingAudit] = useState(false)
    const [auditError, setAuditError] = useState(null)

    const [viewingReceipt, setViewingReceipt] = useState(null)
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

    const isPastVerified = selectedReport && selectedReport.reportDate < getTodayPkt() && selectedReport.status === 'Verified'

    const fetchReports = async () => {
        setIsLoading(true)
        setError(null)
        try {
            let url = '/Admin/settlement-reports'
            const params = new URLSearchParams()
            if (dateFilter) params.append('date', dateFilter)
            if (statusFilter !== 'ALL') params.append('status', statusFilter)
            
            const queryString = params.toString()
            if (queryString) {
                url += `?${queryString}`
            }

            const res = await axiosPrivate.get(url)
            setReports(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load financial settlement reports.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [dateFilter, statusFilter])

    const handleOpenAuditModal = async (report) => {
        setSelectedReport(report)
        setAdminNotes(report.adminNotes || '')
        setAuditError(null)
        setIsAuditModalOpen(true)

        try {
            const res = await axiosPrivate.get(`/Admin/settlement-reports/${report.id}`)
            if (res.data) {
                setSelectedReport(res.data)
                setReports(prev => prev.map(r => r.id === report.id ? res.data : r))
            }
        } catch {
        }
    }

    const handleAuditAction = async (status) => {
        if (!selectedReport) return
        setIsSubmittingAudit(true)
        setAuditError(null)
        try {
            const payload = {
                status,
                adminNotes: adminNotes.trim() || undefined
            }
            const res = await axiosPrivate.patch(`/Admin/settlement-reports/${selectedReport.id}/verify`, payload)
            
            setReports(prev => prev.map(r => r.id === selectedReport.id ? res.data : r))
            setSelectedReport(res.data)
            setSuccessMessage(`Settlement report ${res.data.reportNumber} has been ${status.toLowerCase()}!`)
            setIsAuditModalOpen(false)
        } catch (err) {
            setAuditError(err.response?.data?.message || `Failed to update report status.`)
        } finally {
            setIsSubmittingAudit(false)
        }
    }

    const filteredReports = reports.filter(r => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
            r.reportNumber?.toLowerCase().includes(q) ||
            r.assistantName?.toLowerCase().includes(q) ||
            r.doctorName?.toLowerCase().includes(q) ||
            r.departmentName?.toLowerCase().includes(q)
        )
    })

    const totalCollected = reports.reduce((acc, r) => acc + (r.totalAmount || 0), 0)
    const pendingCount = reports.filter(r => r.status === 'Submitted').length
    const verifiedCount = reports.filter(r => r.status === 'Verified').length
    const cashTotal = reports.reduce((acc, r) => acc + (r.cashAmount || 0), 0)
    const onlineTotal = reports.reduce((acc, r) => acc + (r.onlineAmount || 0), 0)

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Settlements & Audit Desk</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Audit daily fee collection slips and verify cash handoffs submitted by clinical assistants
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                        onClick={fetchReports}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
                    >
                        <RefreshCw size={15} className={`text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Reports</span>
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-slate-600 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage('')} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && (
                <div className="p-4 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} className="text-slate-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports Revenue</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Banknote size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl font-bold text-slate-900">PKR {totalCollected.toLocaleString()}</span>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Across {reports.length} closing reports</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Physical Cash</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Banknote size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl font-bold text-slate-900">PKR {cashTotal.toLocaleString()}</span>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Physical cash handed to accounts</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Digital & Online</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <CreditCard size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl font-bold text-slate-900">PKR {onlineTotal.toLocaleString()}</span>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">JazzCash, EasyPaisa, Bank, Card</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification Queue</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">{pendingCount}</span>
                            <span className="text-xs font-semibold text-slate-600">Awaiting Audit</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">{verifiedCount} verified & reconciled</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xs overflow-hidden flex flex-col border border-slate-200">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search report #, assistant, doctor, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 bg-white"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Date:</span>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500 font-semibold"
                            />
                            {dateFilter ? (
                                <button
                                    type="button"
                                    onClick={() => setDateFilter('')}
                                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                    title="Clear date filter to show all hospital reports"
                                >
                                    <X size={13} className="text-slate-500" />
                                    <span>Clear</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setDateFilter(getTodayPkt())}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                                    title="Filter today's reports"
                                >
                                    Today
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500 font-semibold"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="Submitted">Submitted (Pending Audit)</option>
                                <option value="Verified">Verified (Reconciled)</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[1050px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">Report #</th>
                                <th className="py-3.5 px-4">Closing Date</th>
                                <th className="py-3.5 px-4">Clinical Assistant</th>
                                <th className="py-3.5 px-4">Doctor / Dept</th>
                                <th className="py-3.5 px-4 text-center">Visits</th>
                                <th className="py-3.5 px-4 text-right">Cash in Register</th>
                                <th className="py-3.5 px-4 text-right">Digital / Online</th>
                                <th className="py-3.5 px-4 text-right">Total Revenue</th>
                                <th className="py-3.5 px-4 text-center">Audit Status</th>
                                <th className="py-3.5 px-4 sm:px-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="py-14 text-center text-slate-600">
                                        <div className="flex items-center justify-center gap-2.5">
                                            <Loader2 size={18} className="animate-spin text-slate-500" />
                                            <span className="text-sm font-semibold text-slate-700">Loading settlement reports...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-14 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Receipt size={36} className="text-slate-400" />
                                            <span className="text-base font-bold text-slate-800">No settlement reports found</span>
                                            <span className="text-xs text-slate-500">Reports submitted by clinical assistants will appear here for audit</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.slice((currentPage - 1) * 15, currentPage * 15).map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                                            {report.reportNumber}
                                        </td>
                                        <td className="py-4 px-4 text-slate-700 font-semibold whitespace-nowrap">
                                            {report.reportDate}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-slate-900">
                                            {report.assistantName}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{report.doctorName || 'All Assigned'}</span>
                                                <span className="text-[11px] text-slate-500">{report.departmentName || 'OPD'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center font-bold text-slate-800">
                                            {report.totalAppointments}
                                        </td>
                                        <td className="py-4 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                            PKR {report.cashAmount?.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                            PKR {report.onlineAmount?.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                            PKR {report.totalAmount?.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-4 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                {report.status === 'Submitted' ? 'Pending Audit' : report.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleOpenAuditModal(report)}
                                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                                {report.reportDate < getTodayPkt() && report.status === 'Verified' ? (
                                                    <>
                                                        <Lock size={13} className="text-slate-400" />
                                                        <span>View (Locked)</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye size={13} className="text-slate-400" />
                                                        <span>Audit & Details</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredReports.length}
                    pageSize={15}
                    onPageChange={setCurrentPage}
                />
            </div>

            {isAuditModalOpen && selectedReport && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Audit Settlement Report</h3>
                                    <p className="text-xs font-semibold text-slate-500">
                                        Ref: <span className="font-mono text-slate-900 font-bold">{selectedReport.reportNumber}</span> &bull; Submitted by <span className="font-bold text-slate-900">{selectedReport.assistantName}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAuditModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {auditError && (
                                <div className="p-4 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
                                    <AlertCircle size={16} className="text-slate-600" />
                                    <span>{auditError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <div>
                                    <span className="text-slate-500 font-medium">Closing Date:</span>
                                    <p className="font-bold text-slate-900 mt-0.5">{selectedReport.reportDate}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Submitted At:</span>
                                    <p className="font-bold text-slate-900 mt-0.5">{formatDateTime(selectedReport.submittedAt)}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Total Consultations:</span>
                                    <p className="font-bold text-slate-900 mt-0.5">{selectedReport.totalAppointments} visits</p>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Audit Status:</span>
                                    <p className="mt-0.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                            {selectedReport.status}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                    <div className="flex items-center justify-between text-slate-600 mb-1">
                                        <span className="text-xs font-semibold uppercase tracking-wider">Cash in Register</span>
                                        <Banknote size={16} className="text-slate-500" />
                                    </div>
                                    <div className="text-xl font-bold text-slate-900 font-mono">
                                        PKR {selectedReport.cashAmount?.toLocaleString()}
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Physical notes to reconcile</p>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                    <div className="flex items-center justify-between text-slate-600 mb-1">
                                        <span className="text-xs font-semibold uppercase tracking-wider">Online / Digital</span>
                                        <CreditCard size={16} className="text-slate-500" />
                                    </div>
                                    <div className="text-xl font-bold text-slate-900 font-mono">
                                        PKR {selectedReport.onlineAmount?.toLocaleString()}
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Reconciled via TRX IDs</p>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 text-white">
                                    <div className="flex items-center justify-between text-slate-300 mb-1">
                                        <span className="text-xs font-semibold uppercase tracking-wider">Grand Total</span>
                                        <Receipt size={16} className="text-slate-400" />
                                    </div>
                                    <div className="text-xl font-bold text-white font-mono">
                                        PKR {selectedReport.totalAmount?.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {selectedReport.assistantNotes && (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                    <span className="font-bold text-slate-700">Assistant Closing Remarks:</span>
                                    <p className="text-slate-900 mt-1 italic font-medium">"{selectedReport.assistantNotes}"</p>
                                </div>
                            )}

                            {selectedReport.status !== 'Submitted' && (
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800">
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        {selectedReport.status === 'Verified' ? <CheckCircle2 size={16} className="text-slate-600" /> : <XCircle size={16} className="text-slate-600" />}
                                        <span>{selectedReport.status === 'Verified' ? 'Verified & Reconciled' : 'Rejected / Flagged for Review'}</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-600">
                                        Audited by <span className="font-bold text-slate-900">{selectedReport.verifiedByAdminName || 'Admin'}</span> on {formatDateTime(selectedReport.verifiedAt)}
                                    </p>
                                    {selectedReport.adminNotes && (
                                        <p className="mt-2 text-xs font-medium text-slate-700">
                                            Auditor Note: <span className="italic">{selectedReport.adminNotes}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                                    Transactions Breakdown ({selectedReport.transactions?.length || 0} Slips)
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                                            <tr>
                                                <th className="py-2.5 px-3">Slip #</th>
                                                <th className="py-2.5 px-3">Patient</th>
                                                <th className="py-2.5 px-3">Doctor</th>
                                                <th className="py-2.5 px-3 text-right">Fee (PKR)</th>
                                                <th className="py-2.5 px-3">Method</th>
                                                <th className="py-2.5 px-3">TRX ID</th>
                                                <th className="py-2.5 px-3 text-center">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(!selectedReport.transactions || selectedReport.transactions.length === 0) ? (
                                                <tr>
                                                    <td colSpan={7} className="py-6 text-center text-slate-500 font-medium">
                                                        No individual transactions recorded in this report.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedReport.transactions.map((tx) => (
                                                    <tr key={tx.paymentId} className="hover:bg-slate-50">
                                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{tx.receiptNumber}</td>
                                                        <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.patientName}</td>
                                                        <td className="py-2.5 px-3 text-slate-600">{tx.doctorName}</td>
                                                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                                            PKR {tx.amount?.toLocaleString()}
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200">
                                                                {tx.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                                            {tx.transactionReference || '-'}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setViewingReceipt(tx)
                                                                    setIsReceiptModalOpen(true)
                                                                }}
                                                                className="text-slate-700 hover:text-slate-900 font-semibold text-[11px] underline inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Eye size={12} className="text-slate-400" />
                                                                <span>Slip</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200">
                                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                                    Auditor Verification Remarks & Settlement Notes
                                </label>
                                <textarea
                                    rows={2}
                                    disabled={isPastVerified}
                                    placeholder={isPastVerified ? "Reconciliation notes are sealed for past verified reports." : "Enter physical cash count, reconciliation notes, or bank deposit confirmation..."}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500 font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                />

                                {isPastVerified && (
                                    <div className="mt-3 p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-2.5 text-xs font-medium">
                                        <Lock size={16} className="text-slate-500 shrink-0" />
                                        <span>This report was reconciled and verified on a past date ({selectedReport.reportDate}). Past verified reports are locked and sealed for financial audit integrity.</span>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAuditModalOpen(false)}
                                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>

                                    {!isPastVerified && (
                                        <>
                                            <button
                                                type="button"
                                                disabled={isSubmittingAudit}
                                                onClick={() => handleAuditAction('Rejected')}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                                    selectedReport.status === 'Rejected'
                                                        ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                                                }`}
                                            >
                                                <XCircle size={14} className="text-slate-500" />
                                                <span>
                                                    {selectedReport.status === 'Rejected'
                                                        ? 'Update Rejection Notes'
                                                        : (selectedReport.status === 'Verified' ? 'Change to Rejected' : 'Reject Report')}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                disabled={isSubmittingAudit}
                                                onClick={() => handleAuditAction('Verified')}
                                                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                                    selectedReport.status === 'Verified'
                                                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                                                }`}
                                            >
                                                {isSubmittingAudit ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        <span>Updating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 size={14} className="text-white" />
                                                        <span>
                                                            {selectedReport.status === 'Verified'
                                                                ? 'Update Verification Notes'
                                                                : (selectedReport.status === 'Rejected' ? 'Change to Verified & Approve' : 'Verify & Reconcile')}
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PaymentReceiptModal
                receipt={viewingReceipt}
                isOpen={isReceiptModalOpen}
                onClose={() => {
                    setIsReceiptModalOpen(false)
                    setViewingReceipt(null)
                }}
            />
        </div>
    )
}

export default AdminSettlements
