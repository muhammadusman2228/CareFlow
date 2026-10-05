import { Link } from "react-router"



const LoginButton=()=>{
    return(
 <button  className="login-btn cursor-pointer bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all">
              <Link to="/login">Patient Portal/Login</Link>
            </button>
    )
}
export default LoginButton