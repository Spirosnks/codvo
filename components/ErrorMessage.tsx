import type React from "react"

interface ErrorMessageProps {
  message: string
  details?: string
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, details }) => {
  return (
    <div
      className="bg-red-900/30 border border-red-500/50 text-white px-6 py-4 rounded-md shadow-xl max-w-full overflow-hidden"
      role="alert"
    >
      <div className="flex items-center">
        <svg className="w-6 h-6 mr-3 text-red-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <strong className="font-semibold text-red-300">Erreur:</strong>
      </div>
      <p className="ml-9 text-white font-medium" style={{ wordBreak: "break-word" }}>
        {message}
      </p>
      {details && (
        <p className="text-sm mt-2 ml-9 text-red-200" style={{ wordBreak: "break-word" }}>
          {details}
        </p>
      )}
    </div>
  )
}

export default ErrorMessage
