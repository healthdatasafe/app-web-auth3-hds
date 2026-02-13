interface AlertProps {
  error?: string
  success?: string
}

export default function Alert ({ error, success }: AlertProps) {
  const msg = success || error
  if (!msg) return null

  const isSuccess = !!success
  return (
    <div className={`mt-4 rounded-lg p-3 text-sm ${isSuccess
      ? 'bg-green-50 text-green-800 border border-green-200'
      : 'bg-red-50 text-red-800 border border-red-200'
    }`}
    >
      <span dangerouslySetInnerHTML={{ __html: msg }} />
    </div>
  )
}
