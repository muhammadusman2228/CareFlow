import { useState, useEffect, useCallback } from 'react'
import { 
    Receipt, 
    Search, 
    RefreshCw, 
    Calendar, 
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
    Lock,
    Send
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import Pagination from '../../components/common/Pagination'
import PaymentReceiptModal from '../../components/common/PaymentReceiptModal'
import { formatPktTime, formatPktDateTime, formatPktDate } from '../../utils/formatters'

const getTodayPkt = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())

const AdminSettlements = () => {
    const axiosPrivate = useAxiosPrivate()

    const [activeView, setActiveView] = useState('deposits')
    const [reports, setReports] = useState([])
    const [bankDeposits, setBankDeposits] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [popupModal, setPopupModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })

    const showPopup = (message, title = 'Notice', type = 'info') => {
        setPopupModal({
            isOpen: true,
            title,
            message: typeof message === 'string' ? message : 'An unexpected notice was received.',
            type
        })
    }

    const closePopup = () => {
        setPopupModal(prev => ({ ...prev, isOpen: false }))
    }

    const [dateFilter, setDateFilter] = useState(() => getTodayPkt())
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const [selectedReport, setSelectedReport] = useState(null)
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
    const [adminNotes, setAdminNotes] = useState('')
    const [isSubmittingAudit, setIsSubmittingAudit] = useState(false)
    const [auditError, setAuditError] = useState(null)

    const [selectedDeposit, setSelectedDeposit] = useState(null)
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
    const [depositAdminNotes, setDepositAdminNotes] = useState('')
    const [isSubmittingDepositAudit, setIsSubmittingDepositAudit] = useState(false)

    const [viewingReceipt, setViewingReceipt] = useState(null)
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

    const isPastVerified = selectedReport && selectedReport.reportDate < getTodayPkt() && selectedReport.status === 'Verified'
    const isPastDepositVerified = selectedDeposit && selectedDeposit.depositDate < getTodayPkt() && selectedDeposit.status === 'AdminApproved'

    const fetchAllData = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (dateFilter) params.append('date', dateFilter)
            if (statusFilter !== 'ALL') params.append('status', statusFilter)

            const queryString = params.toString() ? `?${params.toString()}` : ''

            const [reportsRes, depositsRes] = await Promise.all([
                axiosPrivate.get(`/Admin/settlement-reports${queryString}`),
                axiosPrivate.get(`/Admin/bank-deposits${dateFilter ? `?date=${dateFilter}` : ''}`)
            ])

            setReports(Array.isArray(reportsRes.data) ? reportsRes.data : [])
            setBankDeposits(Array.isArray(depositsRes.data) ? depositsRes.data : [])
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to load financial settlement dossiers.', 'System Notice', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [axiosPrivate, dateFilter, statusFilter])

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

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
            showPopup(`Settlement dossier ${res.data.reportNumber} has been ${status.toLowerCase()}!`, 'Dossier Audit', 'success')
            setIsAuditModalOpen(false)
            fetchAllData()
        } catch (err) {
            setAuditError(err.response?.data?.message || `Failed to update report status.`)
        } finally {
            setIsSubmittingAudit(false)
        }
    }

    const handleOpenDepositModal = (deposit) => {
        setSelectedDeposit(deposit)
        setDepositAdminNotes(deposit.adminNotes || '')
        setIsDepositModalOpen(true)
    }

    const handleVerifyDepositAction = async (status) => {
        if (!selectedDeposit) return
        setIsSubmittingDepositAudit(true)
        try {
            const payload = {
                status,
                adminNotes: depositAdminNotes.trim() || undefined
            }
            const res = await axiosPrivate.patch(`/Admin/bank-deposits/${selectedDeposit.id}/verify`, payload)
            setBankDeposits(prev => prev.map(b => b.id === selectedDeposit.id ? res.data : b))
            showPopup(`Bank deposit ${res.data.depositReference} has been approved and sealed!`, 'Bank Deposit Approved', 'success')
            setIsDepositModalOpen(false)
            fetchAllData()
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to update bank deposit verification.', 'Audit Notice', 'error')
        } finally {
            setIsSubmittingDepositAudit(false)
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

    const filteredDeposits = bankDeposits.filter(b => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
            b.depositReference?.toLowerCase().includes(q) ||
            b.bankName?.toLowerCase().includes(q) ||
            b.bankDepositSlipNumber?.toLowerCase().includes(q) ||
            b.cashierName?.toLowerCase().includes(q)
        )
    })

    const totalCollected = reports.reduce((acc, r) => acc + (r.totalAmount || 0), 0)
    const cashTotal = reports.reduce((acc, r) => acc + (r.cashAmount || 0), 0)
    const onlineTotal = reports.reduce((acc, r) => acc + (r.onlineAmount || 0), 0)
    const totalDepositedInBank = bankDeposits.reduce((acc, b) => acc + (b.totalCashDeposited || 0), 0)
    const undepositedCash = Math.max(0, cashTotal - totalDepositedInBank)

    const formatDateTime = (dateStr) => formatPktDateTime(dateStr)

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Financial Audit & Banking Vault</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Executive oversight of main cashier commercial bank deposits and departmental assistant handovers.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                        onClick={fetchAllData}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
                    >
                        <RefreshCw size={15} className={`text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Dossiers</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Day Revenue</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Banknote size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl font-black text-slate-900 font-mono">PKR {totalCollected.toLocaleString()}</span>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Across all 10 departments</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial Bank Lodged</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl font-black text-slate-900 font-mono">PKR {totalDepositedInBank.toLocaleString()}</span>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Deposited into Hospital Bank Account</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Undeposited Cash in Hand</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Banknote size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl font-black text-slate-900 font-mono">PKR {undepositedCash.toLocaleString()}</span>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">
                            {undepositedCash === 0 ? "All physical cash lodged in bank" : "Awaiting commercial bank deposit"}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Digital & M-Wallets</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <CreditCard size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-2xl font-black text-slate-900 font-mono">PKR {onlineTotal.toLocaleString()}</span>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">JazzCash, EasyPaisa, Direct Bank</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xs overflow-hidden flex flex-col border border-slate-200">
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 pt-3 bg-slate-50/70">
                    <button
                        type="button"
                        onClick={() => { setActiveView('deposits'); setCurrentPage(1); }}
                        className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                            activeView === 'deposits'
                                ? 'border-sky-600 text-sky-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Building2 size={16} />
                        <span>Executive Bank Deposits</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">
                            {bankDeposits.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setActiveView('handovers'); setCurrentPage(1); }}
                        className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                            activeView === 'handovers'
                                ? 'border-sky-600 text-sky-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Receipt size={16} />
                        <span>OPD Department Handovers</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">
                            {reports.length}
                        </span>
                    </button>
                </div>

                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={activeView === 'deposits' ? "Search deposit ref, bank, challan slip #, or cashier..." : "Search report #, assistant, doctor, or department..."}
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
                                    title="Clear date filter to show all records"
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

                        {activeView === 'handovers' && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Status:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500 font-semibold"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="Submitted">Submitted (Pending Cashier)</option>
                                    <option value="CashierVerified">Cashier Verified</option>
                                    <option value="Verified">Admin Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {activeView === 'deposits' ? (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Deposit Ref</th>
                                    <th className="py-3.5 px-4">Bank Name & Slip #</th>
                                    <th className="py-3.5 px-4">Deposit Date</th>
                                    <th className="py-3.5 px-4">Cashier</th>
                                    <th className="py-3.5 px-4 text-center">Counters</th>
                                    <th className="py-3.5 px-4 text-right">Cash Deposited</th>
                                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                                    <th className="py-3.5 px-4 text-center">Audit Status</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="py-14 text-center text-slate-600">
                                            <div className="flex items-center justify-center gap-2.5">
                                                <Loader2 size={18} className="animate-spin text-slate-500" />
                                                <span className="text-sm font-semibold text-slate-700">Loading bank deposits...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredDeposits.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-14 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Building2 size={36} className="text-slate-400 stroke-[1.2]" />
                                                <span className="text-base font-bold text-slate-800">No bank deposits lodged</span>
                                                <span className="text-xs text-slate-500">Deposits submitted by the main cashier will appear here for executive approval</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDeposits.slice((currentPage - 1) * 15, currentPage * 15).map((deposit) => {
                                        const isApproved = deposit.status === 'AdminApproved'
                                        const isRejected = deposit.status === 'Rejected'
                                        const isLocked = isApproved && deposit.depositDate < getTodayPkt()
                                        return (
                                            <tr key={deposit.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                    {deposit.depositReference}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{deposit.bankName}</span>
                                                        <span className="font-mono text-[11px] text-sky-700 font-semibold">Slip: {deposit.bankDepositSlipNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-slate-700 whitespace-nowrap font-semibold">
                                                    {deposit.depositDate}
                                                </td>
                                                <td className="py-4 px-4 font-bold text-slate-900">
                                                    {deposit.cashierName}
                                                </td>
                                                <td className="py-4 px-4 text-center font-bold text-slate-800">
                                                    {deposit.totalHandoversIncluded}
                                                </td>
                                                <td className="py-4 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                                                    PKR {Number(deposit.totalCashDeposited).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                                                    PKR {Number(deposit.grandTotal).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                                        {isApproved ? 'Approved & Sealed' : isRejected ? 'Rejected' : 'Awaiting Sign-off'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDepositModal(deposit)}
                                                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        {isLocked ? (
                                                            <>
                                                                <Lock size={13} className="text-slate-400" />
                                                                <span>View (Locked)</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye size={13} className="text-slate-400" />
                                                                <span>Audit Deposit</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[1050px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Report #</th>
                                    <th className="py-3.5 px-4">Closing Date</th>
                                    <th className="py-3.5 px-4">Clinical Assistant</th>
                                    <th className="py-3.5 px-4">Doctor / Dept</th>
                                    <th className="py-3.5 px-4 text-center">Visits</th>
                                    <th className="py-3.5 px-4 text-right">Cash in Drawer</th>
                                    <th className="py-3.5 px-4 text-right">Digital TRX</th>
                                    <th className="py-3.5 px-4 text-right">Total Fee</th>
                                    <th className="py-3.5 px-4 text-center">Cashier Audit</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-center">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
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
                                                <Receipt size={36} className="text-slate-400 stroke-[1.2]" />
                                                <span className="text-base font-bold text-slate-800">No assistant reports found</span>
                                                <span className="text-xs text-slate-500">Reports submitted by OPD assistants will appear here</span>
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
                                                PKR {Number(report.cashAmount || 0).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                                PKR {Number(report.onlineAmount || 0).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                                                PKR {Number(report.totalAmount || 0).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-4 text-center whitespace-nowrap">
                                                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                                    {report.status === 'CashierVerified' ? 'Cashier Verified' : report.status === 'Verified' ? 'Bank Approved' : 'Pending Cashier'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => handleOpenAuditModal(report)}
                                                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Eye size={13} className="text-slate-400" />
                                                    <span>View Summary</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalItems={activeView === 'deposits' ? filteredDeposits.length : filteredReports.length}
                    pageSize={15}
                    onPageChange={setCurrentPage}
                />
            </div>

            {isDepositModalOpen && selectedDeposit && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Audit Commercial Bank Deposit</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        Challan #{selectedDeposit.bankDepositSlipNumber} • Ref: {selectedDeposit.depositReference}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDepositModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto flex flex-col gap-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                                <div>
                                    <span className="text-slate-500">Bank Name:</span>
                                    <p className="font-bold text-slate-900 mt-0.5">{selectedDeposit.bankName}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Account No:</span>
                                    <p className="font-mono text-slate-900 mt-0.5">{selectedDeposit.bankAccountNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Lodged By:</span>
                                    <p className="font-bold text-slate-900 mt-0.5">{selectedDeposit.cashierName}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Deposit Date:</span>
                                    <p className="font-bold text-slate-900 mt-0.5">{selectedDeposit.depositDate}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 text-white text-center">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Physical Cash Deposited</span>
                                    <p className="text-lg font-black text-emerald-400 mt-0.5">
                                        PKR {Number(selectedDeposit.totalCashDeposited).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Online Inflow</span>
                                    <p className="text-lg font-bold text-sky-400 mt-0.5">
                                        PKR {Number(selectedDeposit.totalOnlineAmount).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Grand Total</span>
                                    <p className="text-lg font-black text-white mt-0.5">
                                        PKR {Number(selectedDeposit.grandTotal).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {selectedDeposit.cashierNotes && (
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                                    <span className="font-bold text-slate-900">Cashier Treasury Remarks: </span>
                                    <span className="text-slate-600">{selectedDeposit.cashierNotes}</span>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                    Bundled OPD Assistant Handovers ({selectedDeposit.handoverReports?.length || selectedDeposit.totalHandoversIncluded} counters)
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                                            <tr>
                                                <th className="py-2 px-3">Dossier #</th>
                                                <th className="py-2 px-3">Department</th>
                                                <th className="py-2 px-3">Assistant</th>
                                                <th className="py-2 px-3 text-right">Cash Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {(selectedDeposit.handoverReports || []).map((h) => (
                                                <tr key={h.id}>
                                                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{h.reportNumber}</td>
                                                    <td className="py-2 px-3 text-slate-700">{h.departmentName || 'OPD'}</td>
                                                    <td className="py-2 px-3 text-slate-700">{h.assistantName}</td>
                                                    <td className="py-2 px-3 text-right font-black text-emerald-700">
                                                        PKR {Number(h.cashAmount).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Executive Sign-off Remarks
                                </label>
                                <textarea
                                    rows={2}
                                    disabled={isPastDepositVerified}
                                    placeholder={isPastDepositVerified ? "Audit remarks are sealed for past verified deposits." : "Enter bank teller verification notes, general ledger posting confirmation..."}
                                    value={depositAdminNotes}
                                    onChange={(e) => setDepositAdminNotes(e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500 font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed resize-none"
                                />

                                {isPastDepositVerified && (
                                    <div className="mt-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-2 text-xs font-medium">
                                        <Lock size={15} className="text-slate-500 shrink-0" />
                                        <span>Past approved bank deposits are sealed and locked for hospital fiscal audit integrity.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsDepositModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                            >
                                Close
                            </button>

                            {!isPastDepositVerified && (
                                <>
                                    <button
                                        type="button"
                                        disabled={isSubmittingDepositAudit}
                                        onClick={() => handleVerifyDepositAction('Rejected')}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 shadow-2xs transition-colors cursor-pointer"
                                    >
                                        Reject Deposit
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isSubmittingDepositAudit}
                                        onClick={() => handleVerifyDepositAction('AdminApproved')}
                                        className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 size={14} />
                                        <span>{isSubmittingDepositAudit ? 'Sealing...' : 'Approve & Seal Bank Deposit'}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isAuditModalOpen && selectedReport && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Departmental Handover Dossier</h3>
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
                                        <span className="text-xs font-semibold uppercase tracking-wider">Physical Cash</span>
                                        <Banknote size={16} className="text-slate-500" />
                                    </div>
                                    <div className="text-xl font-bold text-slate-900 font-mono">
                                        PKR {selectedReport.cashAmount?.toLocaleString()}
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Handed to Cashier Desk</p>
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

                            {selectedReport.cashierNotes && (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                                    <span className="font-bold text-slate-900">Main Cashier Verification Note: </span>
                                    <p className="mt-0.5 text-slate-600 font-medium">{selectedReport.cashierNotes}</p>
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

                            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-slate-600 shrink-0" />
                                        <span className="text-slate-700">
                                            {selectedReport.status === 'CashierVerified' ? (
                                                <>Audited & Accepted by Main Cashier: <strong className="text-slate-900">{selectedReport.cashierName || 'Cashier Desk'}</strong></>
                                            ) : selectedReport.status === 'Verified' ? (
                                                <>Bank Deposited & Reconciled into Hospital General Ledger.</>
                                            ) : (
                                                <>Awaiting physical cash count and audit by Main Cashier desk.</>
                                            )}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-500 font-semibold">
                                        Custody: {selectedReport.status === 'Submitted' ? 'With Assistant' : 'With Cashier / Bank'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsAuditModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                    >
                                        Close Dossier
                                    </button>
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

            {popupModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 border border-slate-200 shadow-xl flex flex-col items-center text-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            popupModal.type === 'error'
                                ? 'bg-slate-100 text-rose-600'
                                : popupModal.type === 'success'
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}>
                            {popupModal.type === 'error' ? (
                                <AlertCircle size={24} />
                            ) : popupModal.type === 'success' ? (
                                <CheckCircle2 size={24} />
                            ) : (
                                <AlertCircle size={24} />
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <h3 className="text-base font-bold text-slate-900">{popupModal.title}</h3>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                {popupModal.message}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closePopup}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs mt-1"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminSettlements
