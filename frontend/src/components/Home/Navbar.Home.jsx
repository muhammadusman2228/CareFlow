

import AppLogo from './AppLogo.Home'
import LoginButton from './LoginButton.Home'
import NavLink from './NavLink.Home'

const Navbar=()=>{
    return(
 <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm shadow-slate-900/5 transition-all">
          <div className="nav h-20 px-6 lg:px-16 max-w-7xl mx-auto flex items-center justify-between text-black">
           <AppLogo/>
            <NavLink/>
            <LoginButton/>
          </div>
        </header>
    )
}
export default Navbar