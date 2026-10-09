import { useState, useEffect } from 'react'
import { 
    HeartPulse, 
    Baby, 
    Brain, 
    Bone, 
    Stethoscope, 
    Eye, 
    Sparkles, 
    Scissors, 
    Activity,
    ArrowRight,
    Users
} from 'lucide-react'
import axios from '../../api/axios'

const getDeptIcon = (name = '') => {
    const n = name.toLowerCase()
    if (n.includes('cardio')) return HeartPulse
    if (n.includes('pedia')) return Baby
    if (n.includes('neuro')) return Brain
    if (n.includes('ortho')) return Bone
    if (n.includes('ophthal')) return Eye
    if (n.includes('pulmo') || n.includes('lung')) return Activity
    if (n.includes('derma')) return Sparkles
    if (n.includes('surg')) return Scissors
    return Stethoscope
}

const DepartmentsSection = ({ onSelectDepartment }) => {
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await axios.get('/Department')
                if (Array.isArray(res.data)) {
                    setDepartments(res.data)
                }
            } catch {
            } finally {
                setLoading(false)
            }
        }
        fetchDepartments()
    }, [])

    const capitalize = (str = '') => {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    return (
        <section id="departments" className="py-16 px-6 lg:px-16 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                        Clinical Specialities
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                        Specialized Medical Departments
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 max-w-xl">
                        Comprehensive diagnostic and therapeutic clinical disciplines led by accredited physicians.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span>{loading ? '...' : `${departments.length} Units Operating`}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => {
                    const IconComponent = getDeptIcon(dept.name)
                    return (
                        <div
                            key={dept.id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
                            onClick={() => onSelectDepartment?.(dept.name)}
                        >
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                    <IconComponent size={24} />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 capitalize mb-2">
                                    {capitalize(dept.name)}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                                    {dept.description || 'Specialized clinical care and advanced treatment modalities tailored for patient wellness.'}
                                </p>
                            </div>

                            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                    <Users size={14} className="text-slate-400" />
                                    <span>{dept.doctorCounts ?? 0} Specialists</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:text-sky-700">
                                    <span>View Doctors</span>
                                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default DepartmentsSection
