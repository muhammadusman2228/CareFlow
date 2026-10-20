import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import useAuth from '../../hooks/useAuth'
import AppLogo from '../../components/Home/AppLogo.Home'
import PaymentReceiptModal from '../../components/common/PaymentReceiptModal'
import { formatDoctorName, formatPktTime, formatPktDateTime, formatPktDate } from '../../utils/formatters'
import {
    Wallet,
    Building2,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Clock,
    RefreshCw,
    Receipt,
    CreditCard,
    DollarSign,
    ShieldCheck,
    X,
    FileText,
    LogOut,
    Send,
    Eye,
    ChevronDown,
    ShieldAlert
} from 'lucide-react'

const getTodayPkt = () => {
    const d = new Date()
    const utc = d.getTime() + d.getTimezoneOffset() * 60000
    const pkt = new Date(utc + 5 * 3600000)
    const y = pkt.getFullYear()
    const m = String(pkt.getMonth() + 1).padStart(2, '0')
    const day = String(pkt.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

const HOSPITAL_PARTNER_BANKS = [
    { name: 'Meezan Bank Limited', account: '0102-0102938401 (CareFlow Main Treasury)' },
    { name: 'Habib Bank Limited (HBL)', account: '1234-7901234503 (CareFlow Operating A/C)' },
    { name: 'Allied Bank Limited', account: '0010-0293847201 (CareFlow Revenue Collection)' },
    { name: 'Bank Alfalah', account: '5501-8293049182 (CareFlow Treasury Desk)' },
    { name: 'MCB Bank Limited', account: '0892-1029384710 (CareFlow Operations)' },
    { name: 'United Bank Limited (UBL)', account: '0342-9920192837 (CareFlow Cash Vault)' }
]

const CashierDashboard = () => {
    const navigate = useNavigate()
    const axiosPrivate = useAxiosPrivate()
    const { auth, setAuth } = useAuth()

    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [showLogoutAllModal, setShowLogoutAllModal] = useState(false)

    const [activeTab, setActiveTab] = useState('handovers')
    const [dateFilter, setDateFilter] = useState(getTodayPkt())
    const [summary, setSummary] = useState(null)
    const [handovers, setHandovers] = useState([])
    const [bankDeposits, setBankDeposits] = useState([])
    const [loading, setLoading] = useState(false)
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

    const [selectedHandover, setSelectedHandover] = useState(null)
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
    const [auditNotes, setAuditNotes] = useState('')
    const [auditSubmitting, setAuditSubmitting] = useState(false)

    const [depositBankName, setDepositBankName] = useState('Meezan Bank Limited')
    const [depositAccountNo, setDepositAccountNo] = useState('0102-0102938401 (CareFlow Main Treasury)')
    const [depositSlipNo, setDepositSlipNo] = useState('')
    const [depositNotes, setDepositNotes] = useState('')
    const [depositSubmitting, setDepositSubmitting] = useState(false)

    const [viewingDeposit, setViewingDeposit] = useState(null)
    const [activeReceipt, setActiveReceipt] = useState(null)
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

    const handleBankChange = (name) => {
        setDepositBankName(name)
        const b = HOSPITAL_PARTNER_BANKS.find(x => x.name === name)
        if (b) {
            setDepositAccountNo(b.account)
        }
    }

    const handleViewReceipt = (tx) => {
        setActiveReceipt(tx)
        setIsReceiptModalOpen(true)
    }

    const fetchCashierData = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (dateFilter) params.date = dateFilter

            const [summaryRes, handoversRes, depositsRes] = await Promise.all([
                axiosPrivate.get('/cashier/daily-summary', { params }),
                axiosPrivate.get('/cashier/handovers', { params }),
                axiosPrivate.get('/cashier/bank-deposits', { params })
            ])

            setSummary(summaryRes.data)
            setHandovers(handoversRes.data || [])
            setBankDeposits(depositsRes.data || [])
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to load cashier treasury data.', 'System Notice', 'error')
        } finally {
            setLoading(false)
        }
    }, [axiosPrivate, dateFilter])

    useEffect(() => {
        fetchCashierData()
    }, [fetchCashierData])

    const handleOpenAuditModal = (handover) => {
        setSelectedHandover(handover)
        setAuditNotes(handover.cashierNotes || '')
        setIsAuditModalOpen(true)
    }

    const handleVerifyHandover = async (status) => {
        if (!selectedHandover) return
        setAuditSubmitting(true)
        try {
            await axiosPrivate.post(`/cashier/verify-handover/${selectedHandover.id}`, {
                status,
                cashierNotes: auditNotes
            })
            showPopup(
                `Handover dossier ${selectedHandover.reportNumber} marked as ${status === 'CashierVerified' ? 'Received & Verified' : 'Rejected'}.`,
                'Handover Audit',
                'success'
            )
            setIsAuditModalOpen(false)
            fetchCashierData()
        } catch (err) {
            showPopup(err.response?.data?.message || 'Error updating handover status.', 'Audit Error', 'error')
        } finally {
            setAuditSubmitting(false)
        }
    }

    const handleSubmitBankDeposit = async (e) => {
        e.preventDefault()
        if (!depositSlipNo.trim()) {
            showPopup('Please enter the stamped Bank Deposit Challan / Slip Number.', 'Validation Notice', 'info')
            return
        }

        setDepositSubmitting(true)
        try {
            const payload = {
                depositDate: dateFilter || getTodayPkt(),
                bankName: depositBankName,
                bankAccountNumber: depositAccountNo,
                bankDepositSlipNumber: depositSlipNo.trim(),
                cashierNotes: depositNotes.trim()
            }
            const res = await axiosPrivate.post('/cashier/submit-bank-deposit', payload)
            showPopup(
                `Deposit ${res.data.depositReference} recorded successfully with Bank Slip #${depositSlipNo}. Submitted to administration for audit.`,
                'Bank Deposit Submitted',
                'success'
            )
            setDepositSlipNo('')
            setDepositNotes('')
            setActiveTab('history')
            fetchCashierData()
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to record bank deposit.', 'Deposit Notice', 'error')
        } finally {
            setDepositSubmitting(false)
        }
    }

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.cashier-profile-container')) {
                setIsProfileOpen(false)
            }
        }
        if (isProfileOpen) {
            document.addEventListener('mousedown', handleOutsideClick)
        }
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }
    }, [isProfileOpen])

    const handleLogout = async () => {
        try {
            await axiosPrivate.post('/auth/logout')
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
            await axiosPrivate.post('/auth/logout-all')
        } catch {
        } finally {
            setAuth({})
            navigate('/login', { replace: true })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AppLogo />
                        <span className="hidden sm:inline-block h-5 w-px bg-slate-200" />
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <Wallet size={12} className="text-slate-500" />
                            Main Cashier & Treasury Office
                        </span>
                    </div>

                    <div className="relative cashier-profile-container">
                        <button
                            type="button"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2.5 p-1.5 pl-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                        >
                            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                                {(auth?.user || 'C')[0]}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-xs font-bold text-slate-900 leading-tight">{auth?.user || 'Main Cashier'}</p>
                                <p className="text-[10px] text-slate-500 font-semibold tracking-wide">Hospital Treasury Desk</p>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                                    <p className="text-xs font-bold text-slate-900">{auth?.user || 'Main Cashier'}</p>
                                    <p className="text-[10px] text-slate-500">Hospital Treasury Desk</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
                                >
                                    <LogOut size={14} className="text-slate-500" />
                                    <span>Sign Out</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogoutAll}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left border-t border-slate-100"
                                    title="Revoke all active sessions across all devices"
                                >
                                    <ShieldAlert size={14} className="text-slate-500" />
                                    <span>Sign Out All Devices</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                            Hospital Financial Reconciliation & Banking Desk
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Audit OPD assistant cash handovers, reconcile physical drawers, and lodge consolidated hospital bank deposits.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-2xs">
                            <Calendar size={14} className="text-slate-500" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-transparent focus:outline-none cursor-pointer"
                            />
                        </div>

                        {dateFilter ? (
                            <button
                                type="button"
                                onClick={() => setDateFilter('')}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 cursor-pointer transition-colors"
                            >
                                Clear
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setDateFilter(getTodayPkt())}
                                className="px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-xs font-bold text-sky-700 cursor-pointer transition-colors"
                            >
                                Today
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={fetchCashierData}
                            disabled={loading}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
                            title="Refresh Data"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">OPD Cash In Hand</span>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                                PKR {Number(summary?.totalCashInHand || 0).toLocaleString()}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                Verified Physical Cash in Drawer
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Digital Wallet Inflow</span>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                                <CreditCard size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                                PKR {Number(summary?.totalOnlineInflow || 0).toLocaleString()}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                JazzCash, EasyPaisa, Card TRX
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assistant Handovers</span>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                                <Receipt size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                                {(summary?.handovers || []).filter(h => h.status === 'CashierVerified' || h.status === 'Verified').length} / {summary?.totalHandovers || 0}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {(summary?.pendingHandoversCount || 0) > 0 
                                    ? `${summary.pendingHandoversCount} Pending Physical Verification` 
                                    : 'All Received Handovers Audited'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hospital Banking Status</span>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                                <Building2 size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xs font-bold text-slate-900">
                                <span>{summary?.isBankDeposited ? 'Deposited in Bank' : 'Pending Bank Deposit'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono font-semibold mt-1.5 truncate">
                                {summary?.bankDepositReference || 'No Deposit Challan Yet'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 border-b border-slate-200 px-4 sm:px-6 pt-3 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={() => setActiveTab('handovers')}
                            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'handovers'
                                    ? 'border-sky-600 text-sky-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <FileText size={16} />
                            <span>OPD Assistant Handovers</span>
                            {summary?.pendingHandoversCount > 0 && (
                                <span className="w-5 h-5 min-w-5 rounded-full bg-slate-900 text-white text-[11px] font-bold font-mono inline-flex items-center justify-center leading-none shadow-2xs">
                                    {summary.pendingHandoversCount}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('bankDeposit')}
                            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'bankDeposit'
                                    ? 'border-sky-600 text-sky-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Building2 size={16} />
                            <span>Commercial Bank Deposit</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                                activeTab === 'history'
                                    ? 'border-sky-600 text-sky-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <ShieldCheck size={16} />
                            <span>Bank Deposit History</span>
                        </button>
                    </div>

                    <div className="p-4 sm:p-6">
                        {activeTab === 'handovers' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">Departmental OPD Envelopes</h2>
                                        <p className="text-xs text-slate-500">
                                            Count physical cash received from clinical assistants before endorsing handovers.
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                        Total Handovers: <strong className="text-slate-800">{handovers.length}</strong>
                                    </span>
                                </div>

                                {handovers.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <Receipt size={36} className="mx-auto mb-2 stroke-[1.2]" />
                                        <p className="text-xs font-semibold">No assistant settlement handovers recorded for this date.</p>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="py-3 px-4">Report Ref</th>
                                                    <th className="py-3 px-4">Department / Assistant</th>
                                                    <th className="py-3 px-4 text-center">Tokens</th>
                                                    <th className="py-3 px-4 text-right">Physical Cash</th>
                                                    <th className="py-3 px-4 text-right">Digital Wallets</th>
                                                    <th className="py-3 px-4 text-right">Total Fee</th>
                                                    <th className="py-3 px-4 text-center">Status</th>
                                                    <th className="py-3 px-4 text-center">Audit Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {handovers.map((h) => {
                                                    const isVerified = h.status === 'CashierVerified' || h.status === 'Verified'
                                                    const isRejected = h.status === 'Rejected'
                                                    return (
                                                        <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                                                {h.reportNumber}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-900">{h.departmentName || 'General OPD'}</span>
                                                                    <span className="text-[11px] text-slate-500">{h.assistantName}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                                                                {h.totalAppointments}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono">
                                                                PKR {Number(h.cashAmount).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-bold text-slate-700 font-mono">
                                                                PKR {Number(h.onlineAmount).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                                                                PKR {Number(h.totalAmount).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                {isVerified ? (
                                                                    <span className="text-xs font-semibold text-slate-800">
                                                                        Cashier Verified
                                                                    </span>
                                                                ) : isRejected ? (
                                                                    <span className="text-xs font-semibold text-rose-700">
                                                                        Rejected
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs font-semibold text-slate-700">
                                                                        Needs Physical Count
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenAuditModal(h)}
                                                                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                                                                >
                                                                    Audit Envelope
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'bankDeposit' && (
                            <div className="max-w-2xl mx-auto flex flex-col gap-6 py-2">
                                <div className="border-b border-slate-200 pb-3">
                                    <h2 className="text-base font-extrabold text-slate-900">Commercial Bank Cash Deposit</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Bundle all verified cash from OPD counters, deposit physical cash in hospital account, and record the bank challan number.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Available Cash to Deposit</span>
                                        <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                                            PKR {Number(summary?.totalCashInHand || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            {(summary?.totalCashInHand || 0) <= 0 
                                                ? 'All verified physical cash for this date has been lodged into the bank.'
                                                : `From ${summary?.verifiedHandoversCount || 0} verified departmental assistant handovers awaiting deposit.`
                                            }
                                        </p>
                                    </div>
                                    <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Day Revenue</span>
                                        <p className="text-sm font-bold text-slate-900 font-mono">
                                            PKR {Number(summary?.grandTotal || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-slate-500">Includes PKR {Number(summary?.totalOnlineInflow || 0).toLocaleString()} online bank receipts</p>
                                    </div>
                                </div>

                                {(summary?.totalCashInHand || 0) <= 0 && (
                                    <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2.5">
                                        <CheckCircle2 size={16} className="text-slate-600 shrink-0" />
                                        <span>
                                            Physical drawer is reconciled and balanced. All OPD counter cash collections for this date have been lodged into the hospital bank account.
                                        </span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmitBankDeposit} className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-slate-700">Bank Name</label>
                                            <select
                                                value={depositBankName}
                                                onChange={(e) => handleBankChange(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                                            >
                                                {HOSPITAL_PARTNER_BANKS.map((b) => (
                                                    <option key={b.name} value={b.name}>
                                                        {b.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                                <span>Hospital Bank Account No.</span>
                                                <span className="text-[10px] text-slate-400 font-medium">Automated</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={depositAccountNo}
                                                readOnly
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-semibold text-slate-700 cursor-not-allowed select-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                            <span>Stamped Bank Challan / Deposit Slip Number</span>
                                            <span className="text-[10px] text-rose-500 font-bold">* Required from teller</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={depositSlipNo}
                                            onChange={(e) => setDepositSlipNo(e.target.value)}
                                            placeholder="e.g. MZN-DEP-20261020-99412 or Teller Challan #8812"
                                            required
                                            disabled={(summary?.totalCashInHand || 0) <= 0}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-50"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-700">Cashier Treasury Remarks</label>
                                        <textarea
                                            rows={2}
                                            value={depositNotes}
                                            onChange={(e) => setDepositNotes(e.target.value)}
                                            placeholder="e.g. Bundled notes (1000x15, 500x10). Bank deposit verified with teller stamp."
                                            disabled={(summary?.totalCashInHand || 0) <= 0}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-sky-500 resize-none disabled:opacity-50 disabled:bg-slate-50"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={depositSubmitting || (summary?.totalCashInHand || 0) <= 0}
                                        className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={15} />
                                        <span>
                                            {depositSubmitting
                                                ? 'Recording Deposit...'
                                                : (summary?.totalCashInHand || 0) <= 0
                                                ? 'No Pending Physical Cash to Deposit'
                                                : 'Record Bank Deposit & Submit to Administration'}
                                        </span>
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">Hospital Banking Ledger</h2>
                                        <p className="text-xs text-slate-500">Official bank deposits submitted to administration for final sign-off.</p>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                        Total Records: <strong className="text-slate-800">{bankDeposits.length}</strong>
                                    </span>
                                </div>

                                {bankDeposits.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <Building2 size={36} className="mx-auto mb-2 stroke-[1.2]" />
                                        <p className="text-xs font-semibold">No bank deposits lodged for this date range.</p>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="py-3 px-4">Deposit Ref</th>
                                                    <th className="py-3 px-4">Bank & Challan #</th>
                                                    <th className="py-3 px-4">Date & Time</th>
                                                    <th className="py-3 px-4 text-center">Handovers Bundled</th>
                                                    <th className="py-3 px-4 text-right">Cash Deposited</th>
                                                    <th className="py-3 px-4 text-right">Grand Total</th>
                                                    <th className="py-3 px-4 text-center">Admin Audit Status</th>
                                                    <th className="py-3 px-4 text-center">View</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {bankDeposits.map((b) => {
                                                    const isApproved = b.status === 'AdminApproved'
                                                    const isRejected = b.status === 'Rejected'
                                                    return (
                                                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                                                {b.depositReference}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-900">{b.bankName}</span>
                                                                    <span className="text-[11px] font-mono text-slate-500">Slip: {b.bankDepositSlipNumber}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-600">
                                                                {b.depositDate} {b.depositedAt ? formatPktTime(b.depositedAt) : ''}
                                                            </td>
                                                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                                                                {b.totalHandoversIncluded} counters
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                                                                PKR {Number(b.totalCashDeposited).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                                                                PKR {Number(b.grandTotal).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                                                    {isApproved ? 'Admin Approved & Locked' : isRejected ? 'Rejected by Admin' : 'Pending Executive Sign-off'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingDeposit(b)}
                                                                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                                                                >
                                                                    Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {isAuditModalOpen && selectedHandover && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-4xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-4">
                        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Physical Handover Audit & Cash Count</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        Dossier #{selectedHandover.reportNumber} &bull; Counter: <span className="font-bold text-slate-800">{selectedHandover.departmentName || 'OPD'}</span> &bull; Assistant: <span className="font-bold text-slate-800">{selectedHandover.assistantName}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAuditModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto flex flex-col gap-4">
                            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Physical Cash Due</span>
                                    <p className="text-lg font-black text-slate-900 mt-0.5 font-mono">
                                        PKR {Number(selectedHandover.cashAmount).toLocaleString()}
                                    </p>
                                    <span className="text-[10px] text-slate-500">To be physically counted</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Digital TRX Due</span>
                                    <p className="text-lg font-bold text-slate-800 mt-0.5 font-mono">
                                        PKR {Number(selectedHandover.onlineAmount).toLocaleString()}
                                    </p>
                                    <span className="text-[10px] text-slate-500">Cross-check via TRX IDs</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Consultation</span>
                                    <p className="text-lg font-black text-slate-900 mt-0.5 font-mono">
                                        PKR {Number(selectedHandover.totalAmount).toLocaleString()}
                                    </p>
                                    <span className="text-[10px] text-slate-500">{selectedHandover.totalAppointments} consultations</span>
                                </div>
                            </div>

                            {selectedHandover.assistantNotes && (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                                    <span className="font-bold text-slate-900">Assistant Handover Notes & Denominations: </span>
                                    <p className="mt-0.5 font-medium text-slate-600">{selectedHandover.assistantNotes}</p>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Itemized Patient Consultation Receipts ({selectedHandover.transactions?.length || 0} Slips)
                                    </h4>
                                    <span className="text-[11px] text-slate-500 font-medium">Click Slip to audit individual clinical invoice</span>
                                </div>
                                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200 sticky top-0">
                                            <tr>
                                                <th className="py-2.5 px-3">Receipt #</th>
                                                <th className="py-2.5 px-3">Time</th>
                                                <th className="py-2.5 px-3">Patient Details</th>
                                                <th className="py-2.5 px-3">Doctor / Dept</th>
                                                <th className="py-2.5 px-3">Payment Tender</th>
                                                <th className="py-2.5 px-3 text-right">Fee (PKR)</th>
                                                <th className="py-2.5 px-3 text-center">Receipt Slip</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {(selectedHandover.transactions || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-6 text-center text-slate-400">
                                                        No individual transactions found in this handover dossier.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedHandover.transactions.map((t) => (
                                                    <tr key={t.paymentId} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                            {t.receiptNumber}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                                            {t.paidAt ? formatPktTime(t.paidAt) : '-'}
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900">{t.patientName}</span>
                                                                {t.patientPhone && (
                                                                    <span className="text-[10px] font-mono text-slate-500">{t.patientPhone}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-slate-800">{formatDoctorName(t.doctorName)}</span>
                                                                <span className="text-[10px] text-slate-500">{t.departmentName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200">
                                                                    {t.paymentMethod}
                                                                </span>
                                                                {t.transactionReference && (
                                                                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-28" title={`TRX: ${t.transactionReference}`}>
                                                                        #{t.transactionReference}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                                            PKR {Number(t.amount).toLocaleString()}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewReceipt(t)}
                                                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                                title="View Patient Slip"
                                                            >
                                                                <Eye size={12} className="text-slate-500" />
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

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Cashier Verification Remarks</label>
                                <textarea
                                    rows={2}
                                    value={auditNotes}
                                    onChange={(e) => setAuditNotes(e.target.value)}
                                    placeholder="e.g. Physical cash counted note-by-note and verified against drawer envelope."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-sky-500 resize-none font-medium"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsAuditModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                disabled={auditSubmitting}
                                onClick={() => handleVerifyHandover('Rejected')}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 shadow-2xs transition-colors cursor-pointer"
                            >
                                Reject Handover
                            </button>
                            <button
                                type="button"
                                disabled={auditSubmitting}
                                onClick={() => handleVerifyHandover('CashierVerified')}
                                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <CheckCircle2 size={14} />
                                <span>Verify & Accept Cash Handover</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewingDeposit && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Hospital Bank Deposit Dossier</h3>
                                <p className="text-xs font-mono text-slate-500">{viewingDeposit.depositReference}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingDeposit(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-2.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500">Bank Name:</span>
                                <span className="font-bold text-slate-900">{viewingDeposit.bankName}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500">Account Number:</span>
                                <span className="font-mono text-slate-800">{viewingDeposit.bankAccountNumber}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500">Stamped Challan / Slip:</span>
                                <span className="font-mono font-bold text-slate-800">{viewingDeposit.bankDepositSlipNumber}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500">Total Cash Deposited:</span>
                                <span className="font-black text-slate-900 font-mono">PKR {Number(viewingDeposit.totalCashDeposited).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500">Total Online Collected:</span>
                                <span className="font-bold text-slate-800 font-mono">PKR {Number(viewingDeposit.totalOnlineAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                                <span className="text-slate-900">Grand Total:</span>
                                <span className="text-sm font-extrabold text-slate-900 font-mono">PKR {Number(viewingDeposit.grandTotal).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span className="text-slate-500">Executive Audit Status:</span>
                                <span className="font-bold text-slate-900">{viewingDeposit.status}</span>
                            </div>
                            {viewingDeposit.adminNotes && (
                                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                                    <span className="font-bold">Admin Audit Notes: </span>
                                    <span>{viewingDeposit.adminNotes}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setViewingDeposit(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {showLogoutAllModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full flex flex-col gap-4 border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Sign Out All Devices</h3>
                                <p className="text-xs text-slate-500">Revoke all active sessions</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            Are you sure you want to sign out from all devices? All active sessions and login tokens for this cashier desk will be immediately revoked.
                        </p>
                        <div className="flex items-center justify-end gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowLogoutAllModal(false)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogoutAll}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Sign Out All Devices
                            </button>
                        </div>
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

export default CashierDashboard
