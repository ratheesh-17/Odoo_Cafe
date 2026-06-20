import { clsx } from 'clsx'

export function Table({ children, className }) {
  return (
    <div className={clsx('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className }) {
  return (
    <th className={clsx('px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }) {
  return (
    <td className={clsx('px-4 py-3 text-sm text-white/80 border-t border-border', className)}>
      {children}
    </td>
  )
}

export function Tr({ children, onClick, className }) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-white/5',
        className,
      )}
    >
      {children}
    </tr>
  )
}
