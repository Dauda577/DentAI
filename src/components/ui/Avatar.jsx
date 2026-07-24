const SIZES = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' }

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function Avatar({ name, src, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${SIZES[size]} ${className}`}
      />
    )
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-secondary/40 font-medium text-foreground ${SIZES[size]} ${className}`}
    >
      {initials(name) || '—'}
    </div>
  )
}
