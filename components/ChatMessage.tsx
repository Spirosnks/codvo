import type React from "react"

export type MessageRole = "user" | "assistant" | "system"

export interface ChatMessageProps {
  role: MessageRole
  content: string
  isLoading?: boolean
  timestamp?: number
  attachments?: {
    type: string
    url: string
    name?: string
  }[]
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isLoading = false, timestamp, attachments = [] }) => {
  const isUser = role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-md p-3 shadow-md ${
          isUser
            ? "bg-[#212121] text-white border border-[#2a2a2a]"
            : role === "system"
              ? "bg-[#1a1a1a] text-gray-300 italic border border-[#2a2a2a]"
              : "bg-[#1a1a1a] text-gray-200 border-l-4 border-[#ddf928] border-t border-r border-b border-[#2a2a2a]"
        } transition-all duration-300 hover:shadow-lg`}
      >
        {isLoading ? (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap">{content}</div>

            {attachments && attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="border border-[#3a3a3a] rounded-md overflow-hidden bg-[#212121]">
                    {attachment.type.startsWith("image/") ? (
                      <div className="flex flex-col">
                        <img
                          src={attachment.url || "/placeholder.svg"}
                          alt={attachment.name || "Attached image"}
                          className="max-w-full max-h-96 object-contain"
                        />
                        <div className="p-2 text-xs text-gray-400 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1 text-[#ddf928]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {attachment.name || "Image jointe"}
                        </div>
                      </div>
                    ) : attachment.type.startsWith("video/") ? (
                      <video src={attachment.url} controls className="max-w-full max-h-64" />
                    ) : (
                      <div className="p-2 bg-[#212121] text-sm flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-gray-300">{attachment.name || "Attached file"}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {timestamp && (
              <div className="mt-1 text-right">
                <span className="text-xs text-gray-500">
                  {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
