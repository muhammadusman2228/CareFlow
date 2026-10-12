

import { useState } from 'react'
import AppLogo from './AppLogo.Home'
import LoginButton from './LoginButton.Home'
import NavLink from './NavLink.Home'
import { Menu, X } from 'lucide-react'

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const scrollTo = (id) => {
        setIsMobileMenuOpen(false)
        const el = document.getElementById(id)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm shadow-slate-900/5 transition-all">
            <div className="nav h-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto flex items-center justify-between text-black">
                <AppLogo />
                <NavLink />
                <div className="hidden md:flex items-center">
                    <LoginButton />
                </div>
                <div className="flex md:hidden items-center gap-2">
                    <LoginButton />
                    <button
                        onClick={() => setIsMobileMenuOpen(prev => !prev)}
                        className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Toggle Navigation Menu"
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 shadow-xl animate-in slide-in-from-top-2 duration-150 flex flex-col gap-3">
                    <button
                        onClick={() => scrollTo('doctors')}
                        className="text-left py-2 text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
                    >
                        Find Doctors
                    </button>
                    <button
                        onClick={() => scrollTo('departments')}
                        className="text-left py-2 text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
                    >
                        Medical Specialities
                    </button>
                    <button
                        onClick={() => scrollTo('about')}
                        className="text-left py-2 text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
                    >
                        About Clinic
                    </button>
                    <button
                        onClick={() => scrollTo('emergency')}
                        className="text-left py-2 text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
                    >
                        Emergency Service
                    </button>
                </div>
            )}
        </header>
    )
}
export default Navbar