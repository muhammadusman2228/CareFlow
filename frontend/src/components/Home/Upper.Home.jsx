import Left from './Left.Home'
import Right from './Right.Home'

const Upper = () => {
    return (
        <div className="upper bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl shadow-slate-200/80 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <Left />
            <Right />
        </div>
    )
}

export default Upper