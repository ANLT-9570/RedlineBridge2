import type { DiffSidebarItem } from '../../../shared/contracts'

interface DiffSidebarProps {
  items: DiffSidebarItem[]
  activeId: string | null
  onSelect: (id: string) => void
}

export default function DiffSidebar({ items, activeId, onSelect }: DiffSidebarProps) {
  return (
    <aside className="diff-sidebar" aria-label="差异列表">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === activeId ? 'diff-sidebar__item is-active' : 'diff-sidebar__item'}
          onClick={() => onSelect(item.id)}
        >
          <span>{item.summary}</span>
        </button>
      ))}
    </aside>
  )
}
