import { useState, useEffect } from 'react'
import { 
    Users, 
    Search, 
    Mail, 
    Phone, 
    Calendar, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    X, 
    Eye, 
    Activity
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const AdminPatients = () => {
    const axiosPrivate = useAxiosPrivate()

    const [patientsData, setPatientsData] = useState({ totalPatients: 0, details: [] })
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPatient, setSelectedPatient] = useState(null)

    const fetchPatients = async () => {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const response = await axiosPrivate.get('/Admin/patient')
            setPatientsData({
                totalPatients: response.data?.totalPatients ?? 0,
                details: Array.isArray(response.data?.details) ? response.data.details : []
            })
        } catch (error) {
            setErrorMessage('Unable to load patient directory. Please check server.')
            setPatientsData({ totalPatients: 0, details: [] })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPatients()
    }, [])

    const filteredPatients = patientsData.details.filter(patient => {
        const q = searchQuery.toLowerCase()
        return (
            (patient.name || '').toLowerCase().includes(q) ||
            (patient.email || '').toLowerCase().includes(q) ||
            (patient.phoneNumber || '').toLowerCase().includes(q)
        )
    })

    const formatRegistrationDate = (dateStr) => {
        if (!dateStr) return 'N/A'
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatFullDate = (dateStr) => {
        if (!dateStr) return 'N/A'
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <div className="patients-page flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Patients Directory
                    </h1>
                    <p className="text-sm text-slate-600 font-medium mt-0.5">
                        Manage registered patient profiles, contact records, and consultation history.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Users size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Total Registered Patients</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {patientsData.totalPatients}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">Verified portal users</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                        <Activity size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-slate-600">Total Completed Consultations</span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                            {patientsData.details.reduce((sum, p) => sum + (p.visitCount || 0), 0)}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">Across all medical departments</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patient by name, email, or phone number..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:outline-none focus:border-sky-500 shadow-sm"
                />
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
                    <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-600">Loading patient directory...</p>
                </div>
            ) : errorMessage ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center gap-2 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="text-xs sm:text-sm text-slate-800 font-semibold">{errorMessage}</p>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                        <Users size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No Patients Found</h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                        {searchQuery ? 'No registered patients match your search criteria.' : 'No patients registered in the clinical system yet.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">Patient Name</th>
                                    <th className="py-3.5 px-5">Contact Details</th>
                                    <th className="py-3.5 px-5">Registration Date</th>
                                    <th className="py-3.5 px-5">Completed Visits</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-800">
                                {filteredPatients.map((patient, index) => (
                                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                    {(patient.name || 'P').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-slate-900 text-sm">
                                                    {patient.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Mail size={13} className="text-slate-500 shrink-0" />
                                                    <span className="font-mono text-xs">{patient.email}</span>
                                                </div>
                                                {patient.phoneNumber && (
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Phone size={13} className="text-slate-500 shrink-0" />
                                                        <span className="text-xs">{patient.phoneNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-slate-700 font-medium">
                                            <span>{formatRegistrationDate(patient.registrationDate)}</span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                                                {patient.visitCount} visits
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <button
                                                onClick={() => setSelectedPatient(patient)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer shadow-2xs"
                                            >
                                                <Eye size={13} />
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">
                                Patient Details
                            </h2>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-5">
                            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                                <div className="w-14 h-14 rounded-xl bg-sky-50 text-sky-700 font-extrabold text-xl flex items-center justify-center shrink-0">
                                    {(selectedPatient.name || 'P').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-base font-bold text-slate-900">
                                        {selectedPatient.name}
                                    </h3>
                                    <span className="text-xs text-slate-500 font-medium">
                                        Verified CareFlow Patient
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="font-medium text-slate-500">Official Email</span>
                                    <span className="font-semibold text-slate-900 font-mono">
                                        {selectedPatient.email}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="font-medium text-slate-500">Contact Number</span>
                                    <span className="font-semibold text-slate-900 font-mono">
                                        {selectedPatient.phoneNumber || 'Not provided'}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="font-medium text-slate-500">Registration Date</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatFullDate(selectedPatient.registrationDate)}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="font-medium text-slate-500">Completed Consultations</span>
                                    <span className="font-semibold text-slate-900">
                                        {selectedPatient.visitCount} visits completed
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                <span className="font-medium text-slate-500">Account Status</span>
                                <span className="font-medium text-slate-500">Email Verified & Active</span>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminPatients
