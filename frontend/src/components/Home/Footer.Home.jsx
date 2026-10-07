import { Link } from 'react-router'
import AppLogo from './AppLogo.Home'

const Footer = () => {
    const scrollToSection = (id) => {
        const el = document.getElementById(id)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <footer className="w-full bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
                    <div className="flex flex-col gap-3 md:col-span-1">
                        <AppLogo isWhite={true} />
                        <p className="text-slate-400 text-xs leading-relaxed mt-1">
                            Next-generation hospital management system delivering streamlined clinical care, verified doctors, and instant digital prescriptions.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <span className="font-bold text-white text-xs uppercase tracking-wider">Quick Navigation</span>
                        <button onClick={() => scrollToSection('doctors')} className="text-left hover:text-white transition-colors cursor-pointer">
                            Find Doctors
                        </button>
                        <button onClick={() => scrollToSection('departments')} className="text-left hover:text-white transition-colors cursor-pointer">
                            Medical Specialities
                        </button>
                        <button onClick={() => scrollToSection('about')} className="text-left hover:text-white transition-colors cursor-pointer">
                            About Clinic
                        </button>
                        <button onClick={() => scrollToSection('emergency')} className="text-left hover:text-white transition-colors cursor-pointer">
                            Emergency Response
                        </button>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <span className="font-bold text-white text-xs uppercase tracking-wider">Clinical Portals</span>
                        <Link to="/login" className="hover:text-white transition-colors">
                            Patient Portal & Login
                        </Link>
                        <Link to="/login" className="hover:text-white transition-colors">
                            Doctor Clinical Portal
                        </Link>
                        <Link to="/login" className="hover:text-white transition-colors">
                            Administrative Console
                        </Link>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <span className="font-bold text-white text-xs uppercase tracking-wider">Contact & Hotline</span>
                        <span>Emergency: 1-8000-CARE-NOW</span>
                        <span>Support: support@careflow.com</span>
                        <span>Clinical Pavilion, Main Campus</span>
                        <span>24/7 Continuous Operation</span>
                    </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
                    <span>&copy; {new Date().getFullYear()} CareFlow Hospital Systems. All rights reserved.</span>
                    <span>Accredited Clinical Healthcare Platform</span>
                </div>
            </div>
        </footer>
    )
}

export default Footer
