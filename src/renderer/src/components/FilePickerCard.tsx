interface FilePickerCardProps {
  title: string
  buttonLabel: string
  filePath: string | null
  onPick: () => void | Promise<void>
}

export default function FilePickerCard({ title, buttonLabel, filePath, onPick }: FilePickerCardProps) {
  return (
    <section className="picker-card">
      <h2 className="picker-card__title">{title}</h2>
      <p className="picker-card__path">{filePath ?? '未选择文件'}</p>
      <button className="picker-card__button" type="button" onClick={() => void onPick()}>
        {buttonLabel}
      </button>
    </section>
  )
}
