"use client"

import type React from "react"

interface CodeInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  readOnly?: boolean
}

const CodeInput: React.FC<CodeInputProps> = ({
  id,
  value,
  onChange,
  placeholder = "Enter code here...",
  rows = 10,
  readOnly = false,
}) => {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      className="w-full h-full p-3 font-mono text-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-md focus:ring-[#ddf928] focus:border-[#ddf928] text-gray-300 placeholder-gray-600 resize-none shadow-inner transition-all duration-200"
      spellCheck="false"
      aria-label={placeholder}
    />
  )
}

export default CodeInput
