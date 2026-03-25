interface InlineErrorProps {
  message: string
}

export default function InlineError({ message }: InlineErrorProps) {
  return <p className="inline-error">{message}</p>
}
