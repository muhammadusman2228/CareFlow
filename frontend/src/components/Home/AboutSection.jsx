import { 
    ShieldCheck, 
    Award, 
    Clock, 
    HeartPulse, 
    FileText, 
    Users, 
    CheckCircle2 
} from 'lucide-react'

const AboutSection = () => {
    return (
        <section id="about" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto w-full border-t border-slate-200/80">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 flex flex-col gap-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                            About CareFlow Clinic
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                            Pioneering Digital Healthcare With Human Compassion
                        </h2>
                    </div>

                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        CareFlow is a modern hospital management and patient care institution engineered to eliminate traditional clinical bottlenecks. By pairing world-class medical specialists with streamlined digital scheduling, our patients enjoy continuous, top-tier healthcare from prevention to recovery.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <ShieldCheck size={20} className="text-sky-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">Accredited Specialists</span>
                                <span className="text-xs text-slate-500 mt-0.5">Every doctor is vetted and board-certified</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <FileText size={20} className="text-sky-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">Instant Digital Rx</span>
                                <span className="text-xs text-slate-500 mt-0.5">EHR prescriptions generated immediately</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <Clock size={20} className="text-sky-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">24/7 Availability</span>
                                <span className="text-xs text-slate-500 mt-0.5">Round-the-clock emergency triage coverage</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <HeartPulse size={20} className="text-sky-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900">Full EHR History</span>
                                <span className="text-xs text-slate-500 mt-0.5">Patients maintain full ownership of records</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-center text-center">
                        <span className="text-3xl sm:text-4xl font-extrabold text-sky-700 tracking-tight">100+</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Certified Specialists</span>
                        <span className="text-xs text-slate-500 mt-0.5">Across 10 hospital disciplines</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-center text-center">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">10+</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Clinical Departments</span>
                        <span className="text-xs text-slate-500 mt-0.5">Equipped with state-of-the-art tech</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-center text-center">
                        <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">99.8%</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Satisfaction Rate</span>
                        <span className="text-xs text-slate-500 mt-0.5">Rated by treated outpatients</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-center text-center">
                        <span className="text-3xl sm:text-4xl font-extrabold text-sky-600 tracking-tight">&lt; 15m</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Average Wait Time</span>
                        <span className="text-xs text-slate-500 mt-0.5">Real-time schedule allocation</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AboutSection
