import { Users, Stethoscope, CalendarDays, Banknote } from 'lucide-react'

const AdminOverview = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    const kpiCards = [
        {
            title: "Total Patients",
            icon: Users,
            iconBg: "bg-blue-50 border border-blue-100/90",
            iconColor: "text-blue-700",
            hoverBorder: "hover:border-blue-300"
        },
        {
            title: "Active Doctors",
            icon: Stethoscope,
            iconBg: "bg-emerald-50 border border-emerald-100/90",
            iconColor: "text-emerald-700",
            hoverBorder: "hover:border-emerald-300"
        },
        {
            title: "Appointments Today",
            icon: CalendarDays,
            iconBg: "bg-indigo-50 border border-indigo-100/90",
            iconColor: "text-indigo-700",
            hoverBorder: "hover:border-indigo-300"
        },
        {
            title: "Daily Revenue",
            icon: Banknote,
            iconBg: "bg-amber-50 border border-amber-100/90",
            iconColor: "text-amber-700",
            hoverBorder: "hover:border-amber-300"
        }
    ]

    return (
        <div className="overview-page flex flex-col gap-7 max-w-7xl mx-auto pb-10">
            
            <section className="kpi-section flex flex-col gap-3.5">
                <div className="section-header flex items-center justify-between">
                    <h2 className="section-title text-base font-bold text-slate-800 tracking-tight">
                        Top KPI Cards
                    </h2>
                    <span className="section-date text-xs sm:text-sm font-medium text-slate-500">
                        {currentDate}
                    </span>
                </div>

                <div className="kpi-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {kpiCards.map((card) => {
                        const Icon = card.icon
                        return (
                            <div 
                                key={card.title}
                                className={`kpi-card bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm shadow-slate-200/80 hover:shadow-md ${card.hoverBorder} transition-all flex items-center gap-4`}
                            >
                                <div className={`icon-box w-13 h-13 sm:w-14 sm:h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                                    <Icon className={`icon w-6 h-6 sm:w-7 sm:h-7 ${card.iconColor}`} strokeWidth={1.8} />
                                </div>
                                <div className="card-info flex flex-col justify-center min-w-0">
                                    <span className="card-title text-sm sm:text-base font-bold text-slate-800 tracking-tight leading-snug">
                                        {card.title}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className="analytics-section flex flex-col gap-3.5">
                <div className="section-header flex items-center justify-between">
                    <h2 className="section-title text-base font-bold text-slate-800 tracking-tight">
                        Clinical Analytics & Performance
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">
                        Operational Overview
                    </span>
                </div>
                
                <div className="analytics-grid grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="appointment-flow-box lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm shadow-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between min-h-[340px]">
                        <div className="card-header flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="card-heading text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                                Weekly Appointment Flow
                            </h3>
                            <span className="badge-tag text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                                Scheduled vs Completed
                            </span>
                        </div>
                        <div className="card-canvas-empty flex-1 w-full min-h-[240px]"></div>
                    </div>

                    <div className="department-workload-box lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm shadow-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between min-h-[340px]">
                        <div className="card-header flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="card-heading text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                                Department Workload Distribution
                            </h3>
                            <span className="badge-tag text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Capacity Ratio
                            </span>
                        </div>
                        <div className="card-canvas-empty flex-1 w-full min-h-[240px]"></div>
                    </div>
                </div>
            </section>

            <section className="activity-audit-section flex flex-col gap-3.5">
                <div className="section-header flex items-center justify-between">
                    <h2 className="section-title text-base font-bold text-slate-800 tracking-tight">
                        Administrative Audit Trail
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">
                        Live System Logs
                    </span>
                </div>

                <div className="activity-log-card bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm shadow-slate-200/80 hover:shadow-md transition-all min-h-[280px] flex flex-col justify-between">
                    <div className="card-header flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="card-heading text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                            Recent System Activity & Event Logs
                        </h3>
                        <span className="badge-tag text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                            Real-time Stream
                        </span>
                    </div>
                    <div className="card-canvas-empty flex-1 w-full min-h-[180px]"></div>
                </div>
            </section>

        </div>
    )
}

export default AdminOverview