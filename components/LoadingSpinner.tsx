import type React from "react"
import { LoadingSpinnerIcon } from "../constants"

interface LoadingSpinnerProps {
  text?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "Generating..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-300">
      <LoadingSpinnerIcon className="h-16 w-16 text-purple-500" />
      <p className="mt-5 text-xl font-medium tracking-wide">{text}</p>
    </div>
  )
}

export default LoadingSpinner
