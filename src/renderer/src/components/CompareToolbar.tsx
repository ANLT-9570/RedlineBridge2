interface CompareToolbarProps {
  currentIndex: number
  total: number
  sidebarVisible: boolean
  onToggleSidebar: () => void
  onPrevious: () => void
  onNext: () => void
  onReset: () => void
}

export default function CompareToolbar({
  currentIndex,
  total,
  sidebarVisible,
  onToggleSidebar,
  onPrevious,
  onNext,
  onReset
}: CompareToolbarProps) {
  const displayCurrent = total === 0 ? 0 : currentIndex + 1

  return (
    <header className="compare-toolbar">
      <div className="compare-toolbar__actions">
        <button type="button" onClick={onReset}>
          返回首页
        </button>
        <button type="button" onClick={onToggleSidebar}>
          {sidebarVisible ? '隐藏差异列表' : '显示差异列表'}
        </button>
      </div>
      <div className="compare-toolbar__nav">
        <button type="button" onClick={onPrevious} disabled={currentIndex <= 0 || total === 0}>
          上一个
        </button>
        <span>{displayCurrent} / {total}</span>
        <button type="button" onClick={onNext} disabled={total === 0 || currentIndex >= total - 1}>
          下一个
        </button>
      </div>
    </header>
  )
}
