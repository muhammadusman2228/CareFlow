
import {Link} from 'react-router'

const NavLink=()=>{
    return(
         <ul className="hidden md:flex justify-center items-center gap-8 text-[15px]">
              <li className="text-slate-600 hover:text-sky-600 font-medium border-b-2 border-transparent hover:border-sky-200 pb-1 transition-colors"><Link to="">Find Doctors</Link></li>
              <li className="text-slate-600 hover:text-sky-600 font-medium border-b-2 border-transparent hover:border-sky-200 pb-1 transition-colors"><Link to="">Medical Specialities</Link></li>
              <li className="text-slate-600 hover:text-sky-600 font-medium border-b-2 border-transparent hover:border-sky-200 pb-1 transition-colors"><Link to="">About Clinic</Link></li>
              <li className="text-slate-600 hover:text-sky-600 font-medium border-b-2 border-transparent hover:border-sky-200 pb-1 transition-colors"><Link to="">Emergency Service</Link></li>
            </ul>
    )
}
export default NavLink