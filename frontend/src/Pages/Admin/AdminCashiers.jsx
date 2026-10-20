import { useState, useEffect } from 'react'
import {
    Wallet,
    Plus,
    Search,
    Mail,
    Building2,
    Clock,
    Edit3,
    Trash2,
    Loader2,
    X,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    ShieldCheck,
    Eye,
    EyeOff,
    Key,
    Copy,
    Check,
    Banknote
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'
import Pagination from '../../components/common/Pagination'

const AdminCashiers = () => {
    const axiosPrivate = useAxiosPrivate()

    const [cashiers, setCashiers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 10

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

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState(null)
    const [copied, setCopied] = useState(false)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingCashier, setEditingCashier] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', email: '', isVerified: true, newPassword: '' })
    const [isUpdating, setIsUpdating] = useState(false)

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [cashierToDelete, setCashierToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchCashiers = async () => {
        try {
            setLoading(true)
            const res = await axiosPrivate.get('/Admin/cashiers')
            setCashiers(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to load cashier treasury roster.', 'System Notice', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCashiers()
    }, [])

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        try {
            setIsCreating(true)
            const res = await axiosPrivate.post('/Admin/cashiers', createForm)
            setCreatedCredentials({
                name: createForm.name,
                email: createForm.email,
                password: createForm.password
            })
            showPopup(`Cashier desk account for ${res.data.name} initialized successfully.`, 'Cashier Registered', 'success')
            setCreateForm({ name: '', email: '', password: '' })
            fetchCashiers()
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to register cashier desk account.', 'Registration Error', 'error')
        } finally {
            setIsCreating(false)
        }
    }

    const handleOpenEdit = (cashier) => {
        setEditingCashier(cashier)
        setEditForm({
            name: cashier.name,
            email: cashier.email,
            isVerified: cashier.isVerified,
            newPassword: ''
        })
        setIsEditModalOpen(true)
    }

    const handleUpdateSubmit = async (e) => {
        e.preventDefault()
        try {
            setIsUpdating(true)
            await axiosPrivate.put(`/Admin/cashiers/${editingCashier.id}`, editForm)
            showPopup(`Cashier profile for ${editForm.name} updated successfully.`, 'Profile Updated', 'success')
            setIsEditModalOpen(false)
            setEditingCashier(null)
            fetchCashiers()
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to update cashier profile.', 'Update Notice', 'error')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async () => {
        if (!cashierToDelete) return
        try {
            setIsDeleting(true)
            const res = await axiosPrivate.delete(`/Admin/cashiers/${cashierToDelete.id}`)
            showPopup(res.data?.message || 'Cashier account removed successfully.', 'Account Removed', 'success')
            setIsDeleteModalOpen(false)
            setCashierToDelete(null)
            fetchCashiers()
        } catch (err) {
            showPopup(err.response?.data?.message || 'Failed to remove cashier account.', 'Removal Notice', 'error')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCopyCredentials = () => {
        if (!createdCredentials) return
        const text = `CareFlow Hospital Treasury Credentials:\nURL: https://careflow.fun/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nRole: Cashier`
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    const filteredCashiers = cashiers.filter(c => {
        const q = searchQuery.toLowerCase()
        return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    })

    const paginatedCashiers = filteredCashiers.slice((page - 1) * pageSize, page * pageSize)

    const todayDeposited = cashiers.reduce((acc, c) => acc + (Number(c.todayCashDeposited) || 0), 0)
    const todayDepositsCount = cashiers.reduce((acc, c) => acc + (c.todayDepositsCount || 0), 0)
    const totalLodged = cashiers.reduce((acc, c) => acc + (Number(c.totalCashDeposited) || 0), 0)
    const activeCount = cashiers.filter(c => c.isVerified).length

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Wallet size={24} className="text-slate-600 shrink-0" />
                        Main Cashier & Treasury Desks
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Oversee hospital physical cash custodians, credentials, and commercial bank deposit activity.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={fetchCashiers}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
                        title="Refresh Roster"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setCreatedCredentials(null)
                            setCreateForm({ name: '', email: '', password: '' })
                            setIsCreateModalOpen(true)
                        }}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Register Cashier</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Wallet size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cashier Desks</span>
                        <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                            {cashiers.length}
                        </span>
                        <span className="text-xs text-slate-500 font-medium mt-0.5">
                            Hospital Treasury Personnel
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Custodians</span>
                        <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                            {activeCount}
                        </span>
                        <span className="text-xs text-slate-500 font-medium mt-0.5">
                            Authorized to receive counter cash
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Building2 size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Lodgements</span>
                        <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                            {todayDepositsCount}
                        </span>
                        <span className="text-xs text-slate-500 font-medium mt-0.5">
                            Commercial bank deposits today
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Banknote size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Banked Cash</span>
                        <span className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                            PKR {todayDeposited.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Lodged into Hospital Accounts
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Hospital Cashier Roster</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Authorized personnel handling physical cash collections and commercial bank lodgements
                        </p>
                    </div>

                    <div className="relative max-w-xs w-full">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by cashier name or email..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setPage(1)
                            }}
                            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition-all font-semibold placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                <th className="py-3 px-4">Cashier Custodian</th>
                                <th className="py-3 px-4">Contact & Login</th>
                                <th className="py-3 px-4 text-center">Today's Lodgements</th>
                                <th className="py-3 px-4 text-right">Today's Banked Volume</th>
                                <th className="py-3 px-4">Latest Stamped Challan / Slip</th>
                                <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <Loader2 size={22} className="animate-spin mx-auto mb-2 text-slate-500" />
                                        <span>Loading cashier roster...</span>
                                    </td>
                                </tr>
                            ) : paginatedCashiers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No cashiers found. Click "Register Cashier" to add a new treasury desk.
                                    </td>
                                </tr>
                            ) : (
                                paginatedCashiers.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-900">
                                            <div className="flex flex-col">
                                                <span>{c.name}</span>
                                                <span className="text-[10px] font-mono text-slate-400">
                                                    Joined: {new Date(c.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                <Mail size={13} className="text-slate-400" />
                                                <span className="font-mono text-xs">{c.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-slate-900">{c.todayDepositsCount || 0} today</span>
                                                <span className="text-[10px] text-slate-500">{c.totalDepositsCount || 0} all-time</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <span className="font-black text-slate-900 font-mono">
                                                    PKR {Number(c.todayCashDeposited || 0).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    Lifetime: PKR {Number(c.totalCashDeposited || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {c.latestSlipNumber ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{c.latestBankName || 'Commercial Bank'}</span>
                                                    <span className="text-[10px] font-mono text-slate-600">Slip #{c.latestSlipNumber}</span>
                                                    <span className="text-[10px] font-mono text-slate-400">{c.latestDepositReference}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 italic">No bank slips yet</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(c)}
                                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                                    title="Edit Cashier / Reset Password"
                                                >
                                                    <Edit3 size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCashierToDelete(c)
                                                        setIsDeleteModalOpen(true)
                                                    }}
                                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                                    title="Remove or Deactivate Cashier"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalItems={filteredCashiers.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                />
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg border border-slate-200">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Register New Cashier</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Initialize a physical treasury custodian desk</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {createdCredentials ? (
                            <div className="mt-4 flex flex-col gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-1 border-b border-slate-200">
                                        <CheckCircle2 size={16} className="text-slate-700" />
                                        <span>Cashier Credentials Generated</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Name:</span>
                                        <span className="font-bold text-slate-900">{createdCredentials.name}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Email:</span>
                                        <span className="font-mono font-bold text-slate-900">{createdCredentials.email}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Initial Password:</span>
                                        <span className="font-mono font-bold text-slate-900">{createdCredentials.password}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Assigned Portal:</span>
                                        <span className="font-semibold text-slate-800">/cashier/dashboard</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCopyCredentials}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{copied ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateSubmit} className="mt-4 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Muhammad Asif (Cashier)"
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Login Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="e.g. cashier@careflow.com"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Initial Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            placeholder="Enter password (min 6 characters)"
                                            value={createForm.password}
                                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Creating Desk...
                                            </>
                                        ) : (
                                            'Create Cashier Account'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {isEditModalOpen && editingCashier && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg border border-slate-200">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Update Cashier Profile</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Desk ID #{editingCashier.id}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="mt-4 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                    Reset Password (Optional)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to preserve current password"
                                    value={editForm.newPassword}
                                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isVerifiedCheckbox"
                                    checked={editForm.isVerified}
                                    onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <label htmlFor="isVerifiedCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Active Custodian (Authorized to accept handovers)
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && cashierToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-lg border border-slate-200 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Remove Cashier Desk</h3>
                                <p className="text-xs text-slate-500">{cashierToDelete.name}</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600">
                            Are you sure you want to remove this cashier? If this cashier has previously recorded bank deposits or assistant handovers, the account will be safely deactivated to preserve financial audit compliance.
                        </p>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeleteModalOpen(false)
                                    setCashierToDelete(null)
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Removing...
                                    </>
                                ) : (
                                    'Confirm Removal'
                                )}
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
        </div>
    )
}

export default AdminCashiers