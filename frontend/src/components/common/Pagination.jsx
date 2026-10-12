import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ 
    currentPage = 1, 
    totalItems = 0, 
    pageSize = 20, 
    onPageChange 
}) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1

    if (totalItems <= 0) return null

    const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems)
    const endItem = Math.min(currentPage * pageSize, totalItems)

    const getPageNumbers = () => {
        const pages = []
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
            }
        }
        return pages
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3.5 border-t border-slate-200 bg-white">
            <div className="text-xs font-semibold text-slate-600">
                Showing <span className="font-bold text-slate-900">{startItem}</span> to{' '}
                <span className="font-bold text-slate-900">{endItem}</span> of{' '}
                <span className="font-bold text-slate-900">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                    <ChevronLeft size={15} />
                    <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                        if (page === '...') {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 py-1 text-xs text-slate-400 select-none">
                                    &hellip;
                                </span>
                            )
                        }

                        const isActive = page === currentPage
                        return (
                            <button
                                key={page}
                                type="button"
                                onClick={() => onPageChange(page)}
                                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    isActive
                                        ? 'bg-sky-600 text-white shadow-xs'
                                        : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    )
}

export default Pagination
