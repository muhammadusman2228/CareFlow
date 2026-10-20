export const formatDoctorName = (input) => {
    if (!input) return ''
    const raw = typeof input === 'string' ? input : (input.doctorName || input.name || '')
    if (!raw || typeof raw !== 'string') return ''
    let cleaned = raw.trim()
    while (/^dr\.?\s+/i.test(cleaned)) {
        cleaned = cleaned.replace(/^dr\.?\s+/i, '').trim()
    }
    return `Dr. ${cleaned}`
}

export const formatDepartmentName = (name) => {
    if (!name || typeof name !== 'string') return ''
    return name.charAt(0).toUpperCase() + name.slice(1)
}

export const formatPktTime = (dateStr) => {
    if (!dateStr) return '-'
    const s = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') ? `${dateStr.replace(' ', 'T')}Z` : dateStr
    const d = new Date(s)
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(d)
}

export const formatPktDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const s = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') ? `${dateStr.replace(' ', 'T')}Z` : dateStr
    const d = new Date(s)
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(d)
}

export const formatPktDate = (dateStr) => {
    if (!dateStr) return '-'
    const s = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') ? `${dateStr.replace(' ', 'T')}Z` : dateStr
    const d = new Date(s)
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(d)
}
