import { useState, useEffect } from 'react'
import { 
    FlaskConical, 
    Search, 
    RefreshCw, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    X, 
    Check, 
    FileText, 
    Stethoscope, 
    Calendar,
    ArrowRight
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const AssistantLabDesk = () => {
    const axiosPrivate = useAxiosPrivate()

    const [labOrders, setLabOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
    const [resultsSummary, setResultsSummary] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [successMessage, setSuccessMessage] = useState('')

    const fetchLabOrders = async () => {
        setIsLoading(true)
        setErrorMessage(null)
        try {
            const res = await axiosPrivate.get('/Assistant/pending-lab-orders')
            setLabOrders(Array.isArray(res.data) ? res.data : [])
        } catch {
            setErrorMessage('Unable to load diagnostic lab orders queue.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLabOrders()
    }, [])

    const handleQuickCollectSample = async (order) => {
        if (order.isAppointmentCompleted || order.appointmentStatus === 'Completed') {
            setErrorMessage('Cannot modify lab orders for completed appointments.')
            return
        }
        try {
            await axiosPrivate.put(`/Assistant/lab-order/${order.id}/status`, {
                status: 'Sample Collected',
                resultsSummary: order.resultsSummary || null
            })
            setSuccessMessage(`Specimen collected for ${order.patientName} (${order.testName}).`)
            await fetchLabOrders()
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to update lab order status.')
        }
    }

    const handleOpenCompleteModal = (order) => {
        if (order.isAppointmentCompleted || order.appointmentStatus === 'Completed') {
            setErrorMessage('Cannot modify lab orders for completed appointments.')
            return
        }
        setSelectedOrder(order)
        setResultsSummary(order.resultsSummary || '')
        setIsCompleteModalOpen(true)
        setErrorMessage(null)
    }

    const handleCompleteSubmit = async (e) => {
        e.preventDefault()
        if (!selectedOrder) return

        setIsSubmitting(true)
        setErrorMessage(null)

        try {
            await axiosPrivate.put(`/Assistant/lab-order/${selectedOrder.id}/status`, {
                status: 'Completed',
                resultsSummary: resultsSummary.trim()
            })
            setSuccessMessage(`Diagnostic findings submitted for ${selectedOrder.testName}.`)
            setIsCompleteModalOpen(false)
            setSelectedOrder(null)
            await fetchLabOrders()
        } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Failed to complete lab order.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredOrders = labOrders.filter(order => {
        const matchesSearch = 
            order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.clinicalNotes && order.clinicalNotes.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Diagnostic Lab Desk & Orders</h1>
                    <p className="text-sm font-medium text-slate-600 mt-1">Collect diagnostic specimens, coordinate pathology processing, and submit test reports</p>
                </div>

                <button
                    onClick={fetchLabOrders}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-all self-start sm:self-auto"
                >
                    <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    <span>Refresh Orders</span>
                </button>
            </div>

            {successMessage && (
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-white shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage('')} className="text-slate-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            )}

            {errorMessage && (
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between text-xs text-slate-900 font-bold shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} className="text-slate-900 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                    <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-700">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by patient, ordered test, or doctor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filter Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800 font-bold"
                        >
                            <option value="ALL">All Lab Statuses</option>
                            <option value="Ordered">Ordered (Pending Collection)</option>
                            <option value="Sample Collected">Sample Collected (In Lab)</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/80 text-xs font-black text-slate-700 uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">Patient</th>
                                <th className="py-3.5 px-4">Diagnostic Test</th>
                                <th className="py-3.5 px-4">Referring Doctor</th>
                                <th className="py-3.5 px-4">Clinical Instructions</th>
                                <th className="py-3.5 px-4">Order Status</th>
                                <th className="py-3.5 px-4">Lab Findings</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center text-slate-600">
                                        <div className="flex items-center justify-center gap-2.5">
                                            <Loader2 size={18} className="animate-spin text-slate-900" />
                                            <span className="text-sm font-bold text-slate-700">Loading laboratory orders...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FlaskConical size={36} className="text-slate-400" />
                                            <span className="text-base font-bold text-slate-800">No diagnostic orders found</span>
                                            <span className="text-xs text-slate-500">Tests ordered by consulting doctors appear here in real-time</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-4 px-4 sm:px-6">
                                            <span className="text-sm font-bold text-slate-900">{order.patientName}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-xs font-semibold text-slate-900">{order.testName}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-xs font-semibold text-slate-800">
                                                Dr. {order.doctorName}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-xs font-medium text-slate-600 max-w-xs truncate" title={order.clinicalNotes}>
                                            {order.clinicalNotes || '-'}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`text-xs font-semibold ${
                                                order.status === 'Completed'
                                                    ? 'text-slate-950 font-bold'
                                                    : order.status === 'Sample Collected'
                                                    ? 'text-slate-800'
                                                    : 'text-slate-500'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-slate-900 text-xs font-medium max-w-xs truncate" title={order.resultsSummary}>
                                            {order.resultsSummary || <span className="text-slate-400 italic">Awaiting findings</span>}
                                        </td>
                                        <td className="py-4 px-4 sm:px-6 text-right">
                                            {order.isAppointmentCompleted || order.appointmentStatus === 'Completed' ? (
                                                <span className="text-xs font-medium text-slate-400">Locked (Completed)</span>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    {order.status === 'Ordered' && (
                                                        <button
                                                            onClick={() => handleQuickCollectSample(order)}
                                                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs"
                                                            title="Mark specimen collected"
                                                        >
                                                            Collect Specimen
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleOpenCompleteModal(order)}
                                                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors shadow-xs"
                                                    >
                                                        {order.status === 'Completed' ? 'Edit Findings' : 'Enter Results'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCompleteModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                    <FlaskConical size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Record Diagnostic Findings</h3>
                                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                                        Patient: <span className="text-slate-950 font-bold">{selectedOrder.patientName}</span> &bull; Test: <span className="text-slate-950 font-bold">{selectedOrder.testName}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCompleteModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCompleteSubmit} className="p-6 sm:p-8 flex flex-col gap-5">
                            {errorMessage && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Ordered Test:</span>
                                    <span className="text-slate-900 font-black text-sm">{selectedOrder.testName}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Doctor Note:</span>
                                    <span className="text-slate-800 font-semibold">{selectedOrder.clinicalNotes || 'Routine pathology analysis'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Results Summary & Quantitative Findings <span className="text-rose-600">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="e.g. Hb: 13.5 g/dL, WBC: 7,400 /mcL, Platelets: 220,000 /mcL, ESR: 12 mm/hr. Normal limits."
                                    value={resultsSummary}
                                    onChange={(e) => setResultsSummary(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 resize-none font-mono bg-white"
                                />
                            </div>

                            <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setIsCompleteModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !resultsSummary.trim()}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    <span>Submit Findings</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AssistantLabDesk
