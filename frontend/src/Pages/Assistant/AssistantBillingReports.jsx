import { useState, useEffect } from 'react'
import { 
    Banknote, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    Filter, 
    Loader2, 
    Printer, 
    RefreshCw, 
    Search, 
    Send, 
    ShieldCheck, 
    AlertCircle, 
    X, 
    CreditCard,
    Smartphone,
    Building2,
    Check,
    History
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import PaymentReceiptModal from '../../components/common/PaymentReceiptModal'
import { formatDoctorName, formatPktTime, formatPktDate } from '../../utils/formatters'

const AssistantBillingReports = () => {
    const axiosPrivate = useAxiosPrivate()

    const [summary, setSummary] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState(() => {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date())
    })
    const [activeTab, setActiveTab] = useState('TODAY')

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
    const [submitNotes, setSubmitNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

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

    const [activeReceipt, setActiveReceipt] = useState(null)
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')

    const fetchDailyFinance = async (dateStr) => {
        try {
            setLoading(true)
            const res = await axiosPrivate.get('/Assistant/reports/daily-finance', {
                params: dateStr ? { date: dateStr } : {}
            })
            setSummary(res.data)
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to load daily financial register.', 'Register Notice', 'error')
        } finally {
            setLoading(false)
        }
    }

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true)
            const res = await axiosPrivate.get('/Assistant/reports/history')
            setHistory(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to load settlement reports history.', 'History Notice', 'error')
        } finally {
            setHistoryLoading(false)
        }
    }

    useEffect(() => {
        fetchDailyFinance(selectedDate)
    }, [selectedDate])

    useEffect(() => {
        if (activeTab === 'HISTORY') {
            fetchHistory()
        }
    }, [activeTab])

    const handleSubmitSettlement = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitError('')
        try {
            const res = await axiosPrivate.post('/Assistant/reports/submit-daily', {
                reportDate: selectedDate,
                notes: submitNotes
            })
            setIsSubmitModalOpen(false)
            setSubmitNotes('')
            showPopup(`Daily settlement report #${res.data.reportNumber} submitted successfully to Main Cashier Treasury Desk.`, 'Handover Submitted', 'success')
            fetchDailyFinance(selectedDate)
            if (activeTab === 'HISTORY') fetchHistory()
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Failed to submit daily settlement report.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleViewReceipt = (tx) => {
        setActiveReceipt(tx)
        setIsReceiptModalOpen(true)
    }

    const filteredTransactions = (summary?.transactions || []).filter(tx => {
        const query = searchQuery.toLowerCase()
        return (
            tx.patientName?.toLowerCase().includes(query) ||
            tx.patientPhone?.toLowerCase().includes(query) ||
            tx.doctorName?.toLowerCase().includes(query) ||
            tx.receiptNumber?.toLowerCase().includes(query) ||
            tx.paymentMethod?.toLowerCase().includes(query)
        )
    })

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Banknote size={24} className="text-slate-500 shrink-0" />
                        Clinical Cash Register & Daily Settlement
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Collect consultation fees, issue patient receipts, and submit shift cash handoffs to Main Cashier.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab('TODAY')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'TODAY' 
                                    ? 'bg-white text-slate-900 shadow-2xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Daily Register
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'HISTORY' 
                                    ? 'bg-white text-slate-900 shadow-2xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <History size={13} className="text-slate-500" />
                            <span>Past Reports</span>
                        </button>
                    </div>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:border-sky-500 cursor-pointer"
                    />

                    <button
                        onClick={() => fetchDailyFinance(selectedDate)}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
                        title="Refresh Daily Ledger"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {activeTab === 'TODAY' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                <Banknote size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-slate-500">Total Day Revenue</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                                    PKR {loading ? '...' : Number(summary?.totalCollected || 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 font-medium mt-0.5">
                                    {summary?.paidAppointmentsCount || 0} consultations cleared
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-slate-500">Previously Handed Over</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                                    PKR {loading ? '...' : Number(summary?.previouslySettledAmount || 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 font-medium mt-0.5">
                                    {summary?.settledBatchesCount || 0} batch{summary?.settledBatchesCount === 1 ? '' : 'es'} sealed & audited
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                <Banknote size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-slate-500">Current Cash in Drawer</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                                    PKR {loading ? '...' : Number(summary?.unsettledCash || 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 font-medium mt-0.5">
                                    {(summary?.unsettledCash || 0) > 0 ? `Ready for Batch ${summary?.nextBatchNumber || 1} handover` : 'All physical cash handed over'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                <CreditCard size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-slate-500">Pending Online Inflow</span>
                                <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                                    PKR {loading ? '...' : Number(summary?.unsettledOnline || 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 font-medium mt-0.5">
                                    JazzCash, EasyPaisa, Card
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                <ShieldCheck size={22} />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-900">
                                        Shift Handover & Treasury Status
                                    </h3>
                                    {(summary?.unsettledAmount || 0) > 0 ? (
                                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border bg-slate-100 text-slate-800 border-slate-300">
                                            Batch {summary?.nextBatchNumber || 1} Pending
                                        </span>
                                    ) : (summary?.settledBatchesCount || 0) > 0 ? (
                                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border bg-slate-100 text-slate-800 border-slate-300">
                                            All Batches Audited ({summary.settledBatchesCount})
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200">
                                            No Collections Yet
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {(summary?.unsettledAmount || 0) > 0 ? (
                                        <>You have <strong>PKR {Number(summary?.unsettledAmount || 0).toLocaleString()}</strong> in new consultation collections in your drawer awaiting shift handover envelope to the Main Cashier desk.</>
                                    ) : (summary?.settledBatchesCount || 0) > 0 ? (
                                        <>All {summary?.settledBatchesCount} handover batches for {selectedDate} have been handed over to the Main Cashier and logged into hospital treasury.</>
                                    ) : (
                                        <>Once your clinic shift concludes or fees are collected, submit your physical cash envelope to the Main Cashier desk.</>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div>
                            {(summary?.unsettledAmount || 0) > 0 ? (
                                <button
                                    onClick={() => {
                                        setSubmitError('')
                                        setIsSubmitModalOpen(true)
                                    }}
                                    className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Send size={15} />
                                    <span>Submit Handover (Batch {summary?.nextBatchNumber || 1} - PKR {Number(summary?.unsettledAmount || 0).toLocaleString()} Pending)</span>
                                </button>
                            ) : (summary?.settledBatchesCount || 0) > 0 ? (
                                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
                                    <Check size={15} className="text-slate-600" />
                                    <span>All Batches Sealed & Submitted</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 text-xs font-medium">
                                    <Clock size={15} className="text-slate-400" />
                                    <span>Drawer Empty</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {summary?.batchesToday && summary.batchesToday.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Today's Shift Handover Envelopes</h3>
                                    <p className="text-xs text-slate-500">Sequential batches sealed and dispatched to Main Cashier for this date</p>
                                </div>
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                    {summary.batchesToday.length} Batch{summary.batchesToday.length === 1 ? '' : 'es'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {summary.batchesToday.map((batch, idx) => (
                                    <div key={batch.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-xs text-slate-900">
                                                {batch.reportNumber}
                                            </span>
                                            <span className="text-[11px] font-semibold text-slate-700">
                                                {batch.status === 'Verified' ? 'Bank Audited' : (batch.status === 'CashierVerified' ? 'Cashier Verified' : 'Awaiting Cashier')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                                            <span className="text-slate-500">Batch #{idx + 1} Total:</span>
                                            <span className="font-mono font-bold text-slate-900">
                                                PKR {Number(batch.totalAmount).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Cash: PKR {Number(batch.cashAmount).toLocaleString()}</span>
                                            <span>Online: PKR {Number(batch.onlineAmount).toLocaleString()}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            Dispatched: {formatPktTime(batch.submittedAt)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Today's Fee Collections Ledger</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Individual paid consultation receipts generated today</p>
                            </div>

                            <div className="relative max-w-xs w-full">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search receipt, patient, doctor, method..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition-all placeholder:text-slate-400 font-semibold"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="py-3 px-4">Receipt #</th>
                                        <th className="py-3 px-4">Time</th>
                                        <th className="py-3 px-4">Patient Details</th>
                                        <th className="py-3 px-4">Attending Doctor</th>
                                        <th className="py-3 px-4">Method & Ref</th>
                                        <th className="py-3 px-4 text-right">Fee (PKR)</th>
                                        <th className="py-3 px-4 text-center">Batch Status</th>
                                        <th className="py-3 px-4 text-center">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-400">
                                                <Loader2 size={22} className="animate-spin mx-auto mb-2 text-slate-500" />
                                                <span>Loading daily transactions...</span>
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-400">
                                                No fee collections recorded yet for this date.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map(tx => (
                                            <tr key={tx.paymentId} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                    {tx.receiptNumber}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                                    {formatPktTime(tx.paidAt)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{tx.patientName}</span>
                                                        {tx.patientPhone && (
                                                             <span className="text-[11px] font-mono text-slate-500">{tx.patientPhone}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">{formatDoctorName(tx.doctorName)}</span>
                                                        <span className="text-[11px] text-slate-500">{tx.departmentName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200">
                                                            {tx.paymentMethod}
                                                        </span>
                                                        {tx.transactionReference && (
                                                            <span className="font-mono text-[10px] text-slate-500 truncate max-w-28" title={`TRX: ${tx.transactionReference}`}>
                                                                #{tx.transactionReference}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                                    PKR {Number(tx.amount).toLocaleString()}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {tx.isSettled ? (
                                                        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                                                            Sealed in Handover
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-900 whitespace-nowrap">
                                                            Current Drawer
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <button
                                                        onClick={() => handleViewReceipt(tx)}
                                                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                        title="Print Patient Slip"
                                                    >
                                                        <Printer size={12} className="text-slate-500" />
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
                </>
            ) : (
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Settlement Reports History</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Past shift closing registers submitted to Main Cashier Treasury</p>
                        </div>
                        <button
                            onClick={fetchHistory}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="py-3 px-4">Report Number</th>
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4 text-center">Receipts</th>
                                    <th className="py-3 px-4 text-right">Cash Handed</th>
                                    <th className="py-3 px-4 text-right">Online Total</th>
                                    <th className="py-3 px-4 text-right">Total Revenue</th>
                                    <th className="py-3 px-4 text-center">Audit Status</th>
                                    <th className="py-3 px-4">Verified By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {historyLoading ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400">
                                            <Loader2 size={22} className="animate-spin mx-auto mb-2 text-slate-500" />
                                            <span>Loading settlement history...</span>
                                        </td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400">
                                            No historical settlement dossiers found.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map(rep => (
                                        <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                                {rep.reportNumber}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">
                                                {rep.reportDate} {formatPktTime(rep.submittedAt)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                                {rep.totalAppointments}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                                                PKR {Number(rep.cashAmount).toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-slate-700 font-mono">
                                                PKR {Number(rep.onlineAmount).toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                                                PKR {Number(rep.totalAmount).toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                                                    {rep.status === 'CashierVerified' ? 'Cashier Verified' : (rep.status === 'Verified' ? 'Bank Audited' : 'Pending Cashier')}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">
                                                {rep.cashierName ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">Cashier: {rep.cashierName}</span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {rep.cashierVerifiedAt ? new Date(rep.cashierVerifiedAt).toLocaleDateString() : 'Received'}
                                                            {rep.verifiedByAdminName ? ` • Audited: ${rep.verifiedByAdminName}` : ''}
                                                        </span>
                                                    </div>
                                                ) : rep.verifiedByAdminName ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">Audited: {rep.verifiedByAdminName}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(rep.verifiedAt).toLocaleDateString()}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Pending Handover</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isSubmitModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg border border-slate-200">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Submit Cash Handover (Batch {summary?.nextBatchNumber || 1})</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Physical Cash Envelope for {selectedDate}</p>
                            </div>
                            <button
                                onClick={() => setIsSubmitModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitSettlement} className="mt-4 flex flex-col gap-4">
                            {submitError && (
                                <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle size={15} className="shrink-0 text-slate-600" />
                                    <span>{submitError}</span>
                                </div>
                            )}

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Unsettled Consultations in Drawer:</span>
                                    <span className="font-bold text-slate-900">{summary?.unsettledAppointmentsCount || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Physical Cash in Envelope:</span>
                                    <span className="font-bold text-slate-900 font-mono">PKR {Number(summary?.unsettledCash || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Digital / Online Inflow:</span>
                                    <span className="font-bold text-slate-900 font-mono">PKR {Number(summary?.unsettledOnline || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                                    <span>Batch Total Tender:</span>
                                    <span className="font-mono">PKR {Number(summary?.unsettledAmount || 0).toLocaleString()}</span>
                                </div>
                                {(summary?.previouslySettledAmount || 0) > 0 && (
                                    <div className="flex justify-between pt-1.5 text-[11px] text-slate-500 border-t border-dashed border-slate-200">
                                        <span>Previously Handed Over Today:</span>
                                        <span className="font-semibold text-slate-700">PKR {Number(summary?.previouslySettledAmount).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Denominations / Cash Envelope Notes (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={submitNotes}
                                    onChange={(e) => setSubmitNotes(e.target.value)}
                                    placeholder="Enter physical cash denominations, envelope number, or shift notes for Cashier..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition-all resize-none font-medium"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsSubmitModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Submitting to Cashier...
                                        </>
                                    ) : (
                                        'Confirm & Hand Over to Cashier'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {popupModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3.5 ${
                            popupModal.type === 'error'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : popupModal.type === 'success'
                                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                            {popupModal.type === 'error' ? (
                                <AlertCircle size={24} />
                            ) : popupModal.type === 'success' ? (
                                <CheckCircle2 size={24} className="text-slate-700" />
                            ) : (
                                <AlertCircle size={24} />
                            )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                            {popupModal.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            {popupModal.message}
                        </p>
                        <button
                            type="button"
                            onClick={closePopup}
                            className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <PaymentReceiptModal
                isOpen={isReceiptModalOpen}
                receipt={activeReceipt}
                onClose={() => setIsReceiptModalOpen(false)}
            />
        </div>
    )
}

export default AssistantBillingReports
