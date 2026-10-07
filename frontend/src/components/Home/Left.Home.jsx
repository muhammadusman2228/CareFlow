import { useNavigate } from 'react-router'
import useAuth from '../../hooks/useAuth'

const Left = () => {
    const navigate = useNavigate()
    const { auth } = useAuth()

    const handleBook = () => {
        if (auth?.accessToken) {
            navigate('/patient/dashboard/book')
        } else {
            const el = document.getElementById('doctors')
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' })
            } else {
                navigate('/login')
            }
        }
    }

    const handleExplore = () => {
        const el = document.getElementById('departments')
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className="left grid lg:col-span-7 gap-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Modern HealthCare, Seamless Clinical Care
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Experience patient-centered care with advanced technology and a dedicated team of specialists committed to your well-being.
            </p>
            <div className="appointments flex flex-wrap items-center gap-3 pt-2">
                <button
                    onClick={handleBook}
                    className="bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-semibold text-sm sm:text-base px-6 sm:px-7 py-3.5 rounded-xl shadow-lg shadow-sky-600/25 hover:shadow-xl hover:shadow-sky-600/35 transition-all cursor-pointer"
                >
                    Book an Appointment
                </button>
                <button
                    onClick={handleExplore}
                    className="border border-sky-600 bg-white text-sky-700 hover:bg-sky-600 hover:text-white active:scale-[0.98] font-semibold text-sm sm:text-base px-6 sm:px-7 py-3.5 rounded-xl shadow-xs hover:shadow-lg hover:shadow-sky-600/25 transition-all cursor-pointer"
                >
                    Explore Departments
                </button>
            </div>
        </div>
    )
}

export default Left