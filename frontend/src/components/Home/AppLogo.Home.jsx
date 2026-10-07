const AppLogo = ({ isWhite = false, textColor = 'text-slate-900' }) => {
    const textStyle = isWhite ? 'text-white' : textColor
    return (
        <div className="logo flex items-center gap-2.5">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="11" y="2" width="10" height="28" rx="5" fill="#0284C7" />
                <rect x="2" y="11" width="28" height="10" rx="5" fill="#38BDF8" />
                <circle cx="16" cy="16" r="4" fill="#0369A1" />
            </svg>
            <h2 className={`text-2xl font-bold tracking-tight ${textStyle}`}>CareFlow</h2>
        </div>
    )
}

export default AppLogo