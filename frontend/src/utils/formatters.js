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
