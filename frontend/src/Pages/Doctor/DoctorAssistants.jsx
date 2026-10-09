import { useState, useEffect } from 'react'
import { 
    Users, 
    Mail, 
    Clock, 
    Award, 
    Building2, 
    RefreshCw, 
    Loader2, 
    ShieldCheck, 
    CheckCircle2, 
    AlertCircle,
    UserCheck,
    Stethoscope,
    Phone
} from 'lucide-react'
import useAxiosPrivate from '../../hooks/useAxiosPrivate'

const DoctorAssistants = () => {
    const axiosPrivate = useAxiosPrivate()

    const [assistants, setAssistants] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAssistants = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await axiosPrivate.get('/Assistant/my-assistants')
            setAssistants(Array.isArray(res.data) ? res.data : [])
        } catch {
            setError('Unable to load clinical assistants assigned to your profile.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAssistants()
    }, [])

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Clinical Assistants</h1>
                    <p className="text-sm font-medium text-slate-600 mt-1">Assistants coordinating patient triage, vital checks, and diagnostic lab sampling</p>
                </div>

                <button
                    onClick={fetchAssistants}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-all self-start sm:self-auto"
                >
                    <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    <span>Refresh Roster</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-800 shadow-xs">
                    <AlertCircle size={18} className="text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-slate-600 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <Loader2 size={24} className="animate-spin text-slate-900" />
                    <span className="text-sm font-bold text-slate-700">Loading assistant staff roster...</span>
                </div>
            ) : assistants.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-slate-500 bg-white rounded-2xl border border-slate-200 text-center px-6 shadow-sm">
                    <Users size={38} className="text-slate-400" />
                    <h3 className="text-base font-bold text-slate-900">No Dedicated Assistants Assigned</h3>
                    <p className="text-sm font-medium text-slate-500 max-w-md">
                        You do not currently have dedicated clinical assistants assigned by hospital administration. Department pool assistants will handle intake triage.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {assistants.map((ast) => (
                        <div key={ast.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
                                            {ast.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-950">{ast.name}</h3>
                                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                                                <Mail size={13} className="text-slate-400" />
                                                {ast.email}
                                            </span>
                                            {ast.phoneNumber && (
                                                <a 
                                                    href={`tel:${ast.phoneNumber}`} 
                                                    className="text-xs font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1.5 mt-0.5 transition-colors"
                                                >
                                                    <Phone size={13} className="text-slate-400" />
                                                    <span>{ast.phoneNumber}</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {ast.isActive ? (
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-2xs">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                            Off Duty
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-2.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Department</span>
                                        <span className="font-bold text-slate-900 text-sm">{ast.departmentName || 'General OPD'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Shift (PKT)</span>
                                        <span className="font-bold text-slate-900 font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {ast.shiftStart?.substring(0, 5)} - {ast.shiftEnd?.substring(0, 5)}
                                        </span>
                                    </div>
                                    {ast.phoneNumber && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Phone Hotline</span>
                                            <a 
                                                href={`tel:${ast.phoneNumber}`} 
                                                className="font-bold text-slate-900 font-mono text-xs flex items-center gap-1.5 hover:underline"
                                            >
                                                <Phone size={12} className="text-slate-600" />
                                                <span>{ast.phoneNumber}</span>
                                            </a>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-slate-200 flex flex-col gap-1">
                                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Qualifications:</span>
                                        <span className="text-slate-800 font-semibold">{ast.qualifications || 'Clinical Assistant'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                                <span>Station: Triage & Lab Desk</span>
                                <span className="font-bold text-slate-700">CareFlow OPD</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default DoctorAssistants
