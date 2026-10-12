import Left from './Left.Home'
import Right from './Right.Home'

const Upper = () => {
    return (
        <div className="upper bg-white rounded-3xl p-5 sm:p-8 lg:p-12 border border-slate-200/90 shadow-xl shadow-slate-200/80 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <Left />
            <Right />
        </div>
    )
}

export default Upper