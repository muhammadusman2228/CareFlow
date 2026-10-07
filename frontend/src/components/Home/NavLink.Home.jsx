
const NavLink = () => {
    const scrollTo = (id) => {
        const el = document.getElementById(id)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <ul className="hidden md:flex justify-center items-center gap-8 text-[15px]">
            <li className="text-slate-600 hover:text-sky-600 font-medium border-b-2 border-transparent hover:border-sky-200 pb-1 transition-colors">
                <button onClick={() => scrollTo('doctors')} className="cursor-pointer">Find Doctors</button>
            </li>
            <li className="text-slate-600 hover:text-sky-600 font-medium border-b-2 border-transparent hover:border-sky-200 pb-1 transition-colors">
                <button onClick={() => scrollTo('departments')} className="cursor-pointer">Medical Specialities</button>
            </li>
            <li className="text-slate-600 hover:text-sky-600 font-medium border-b-2 border-transparent hover:border-sky-200 pb-1 transition-colors">
                <button onClick={() => scrollTo('about')} className="cursor-pointer">About Clinic</button>
            </li>
            <li className="text-slate-600 hover:text-sky-600 font-medium border-b-2 border-transparent hover:border-sky-200 pb-1 transition-colors">
                <button onClick={() => scrollTo('emergency')} className="cursor-pointer">Emergency Service</button>
            </li>
        </ul>
    )
}
export default NavLink