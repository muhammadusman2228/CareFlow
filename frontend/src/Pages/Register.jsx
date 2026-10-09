import { Link, useNavigate } from "react-router";
import registerImage from "../assets/RegistrationImage.png";
import { useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Home/Navbar.Home";

const initialFormState = {
  fullName: "",
  dob: "",
  email: "",
  gender: "",
  password: "",
  bloodGroup: "",
  number: "",
  EmergencyContact: "",
  terms: false,
};

const Register = () => {



  const [formData, setFormData] = useState(initialFormState);
  const [loading,setLoading]=useState(false)
const [errorMsg,setErrorMsg]=useState("")
const navigate=useNavigate()

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const payload = {
    name: formData.fullName,
    email: formData.email,
    password: formData.password,
    gender: formData.gender,
    bloodGroup: formData.bloodGroup,
    phoneNumber: formData.number,
    emergencyContact: formData.EmergencyContact,
    dateOfBirth: formData.dob
}
  const handleSubmit =async (e) => {
    e.preventDefault();
    setLoading(true)
 try {
   await axios.post("/auth/patient/register",payload)
   navigate('/verifyEmail')
 
 } catch (error) {
  if(!error?.response){
    setErrorMsg("Maintenace is going on. Try again after some time ")
  }
  else if (error?.response.status===429){
    setErrorMsg(error.response?.data?.message || "Too many attempts. Please try again after 15 minutes.")
  }
  else if (error?.response.status===409){
    setErrorMsg("This email is already taken ")
  }
  else{
    setErrorMsg("Try again later")
  }
 }
 finally{
  setLoading(false)
  setFormData(initialFormState)
 }
  };

  return (
    <div className="register grid grid-cols-1 lg:grid-cols-12 w-full h-screen bg-slate-50 overflow-hidden">
      <div className="pic hidden lg:flex lg:col-span-5 xl:col-span-5 relative w-full h-full bg-slate-100 overflow-hidden items-center justify-center">
        <img
          className="w-full h-full object-cover object-center"
          src={registerImage}
          alt="CareFlow Registration Page"
        />
      </div>

      <div className="form col-span-1 lg:col-span-7 xl:col-span-7 h-full w-full flex justify-center items-center p-3 sm:p-5 overflow-hidden">
        <div className="group relative w-full max-w-170 p-0.5 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-2xl shadow-slate-900/15 transition-all duration-300 ease-out hover:scale-[1.01] hover:-translate-y-1 hover:shadow-sky-500/20">
          <div className="absolute -inset-full bg-[conic-gradient(from_0deg,transparent_0_300deg,#38bdf8_360deg)] animate-[spin_4s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="registerDiv relative w-full bg-white rounded-[14px] p-6 sm:p-7 flex flex-col shadow-2xl shadow-slate-900/10">
            <div className="heading flex justify-center items-center flex-col mb-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Patient Registration
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Create your account to access CareFlow Services
              </p>
            </div>
 {errorMsg && (
    <div className="w-full py-2 px-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-medium text-center">
        {errorMsg}
    </div>
)}
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fullName"
                  className="text-xs font-semibold text-slate-800"
                >
                  Full Name
                </label>
                <input
                  placeholder="Enter your name"
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="dob"
                  className="text-xs font-semibold text-slate-800"
                >
                  Date of Birth
                </label>
                <input
                  placeholder="Enter Date of Birth"
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-slate-800"
                >
                  Email Address
                </label>
                <input
                  placeholder="you@example.com"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="Gender"
                  className="text-xs font-semibold text-slate-800"
                >
                  Gender
                </label>
                <div className="genders grid grid-cols-3 p-0.5 bg-slate-50 border border-slate-200 rounded-lg h-8.5 items-center">
                  <label
                    htmlFor="male"
                    className={`flex items-center justify-center py-1 text-xs font-semibold rounded-md cursor-pointer transition-all ${formData.gender === "male" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      id="male"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={handleChange}
                    />
                    <span>Male</span>
                  </label>
                  <label
                    htmlFor="female"
                    className={`flex items-center justify-center py-1 text-xs font-semibold rounded-md cursor-pointer transition-all ${formData.gender === "female" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      id="female"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={handleChange}
                    />
                    <span>Female</span>
                  </label>
                  <label
                    htmlFor="others"
                    className={`flex items-center justify-center py-1 text-xs font-semibold rounded-md cursor-pointer transition-all ${formData.gender === "others" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      id="others"
                      name="gender"
                      value="others"
                      checked={formData.gender === "others"}
                      onChange={handleChange}
                    />
                    <span>Others</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-800"
                >
                  Password
                </label>
                <input
                  placeholder="Enter Password"
                  id="password"
                  name="password"
                  value={formData.password}
                  type="password"
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="bloodGroup"
                  className="text-xs font-semibold text-slate-800"
                >
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  id="bloodGroup"
                  name="bloodGroup"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all cursor-pointer"
                >
                  <option value="" disabled>
                    Select Blood Group
                  </option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="number"
                  className="text-xs font-semibold text-slate-800"
                >
                  Contact Number
                </label>
                <input
                  placeholder="Enter your Number"
                  id="number"
                  name="number"
                  type="text"
                  value={formData.number}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="EmergencyContact"
                  className="text-xs font-semibold text-slate-800"
                >
                  Emergency Contact
                </label>
                <input
                  value={formData.EmergencyContact}
                  onChange={handleChange}
                  placeholder="Emergency Contact"
                  id="EmergencyContact"
                  name="EmergencyContact"
                  type="text"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between gap-4 mt-1">
                <label
                  className="flex items-center gap-2 cursor-pointer select-none"
                  htmlFor="terms"
                >
                  <input
                    checked={formData.terms}
                    onChange={handleChange}
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span className="text-slate-600 text-xs">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!formData.terms ||loading}
                  className="py-2.5 px-6 font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-sky-600/20 hover:shadow-lg transition-all text-xs sm:text-sm cursor-pointer shrink-0"
                >
                  Create Patient Account
                </button>
              </div>
            </form>

            <div className="flex justify-between items-center text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
              <span>
                Already have an account?{" "}
                <Link to="/login" className="text-sky-600 font-semibold">
                  Login
                </Link>
              </span>
              <span>
                Registered but not verified?{" "}
                <Link to="/verifyEmail" className="text-sky-600 font-semibold">
                  Verify
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;
