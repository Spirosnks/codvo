"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import ChatMessage, { type ChatMessageProps } from "./ChatMessage"

interface ChatInterfaceProps {
  messages: ChatMessageProps[]
  onNewMessage: (message: string, attachments?: { type: string; url: string; name?: string; file?: File }[]) => void
  onFileUpload: (file: File) => void
  onDeleteMessage?: (messageIndex: number) => void
  onEditMessage?: (
    messageIndex: number,
    newContent: string,
    attachments?: { type: string; url: string; name?: string; file?: File }[],
  ) => void
  isGenerating: boolean
  initialPrompt?: string
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onNewMessage,
  onFileUpload,
  onDeleteMessage,
  onEditMessage,
  isGenerating,
  initialPrompt = "",
}) => {
  const [newMessage, setNewMessage] = useState<string>(initialPrompt)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPromptBuilder, setShowPromptBuilder] = useState<boolean>(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>("")
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState<string>("")

  // État pour l'image sélectionnée mais pas encore envoyée
  const [selectedImage, setSelectedImage] = useState<{
    file: File
    url: string
    name: string
  } | null>(null)

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Gestion du glisser-déposer
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith("image/")) {
          handleImageFile(file)
        } else {
          alert("Veuillez glisser un fichier image valide")
        }
      }
    }

    const chatContainer = document.querySelector(".chat-container")
    if (chatContainer) {
      chatContainer.addEventListener("dragover", handleDragOver)
      chatContainer.addEventListener("dragleave", handleDragLeave)
      chatContainer.addEventListener("drop", handleDrop)

      return () => {
        chatContainer.removeEventListener("dragover", handleDragOver)
        chatContainer.removeEventListener("dragleave", handleDragLeave)
        chatContainer.removeEventListener("drop", handleDrop)
      }
    }
  }, [])

  const handleImageFile = (file: File) => {
    // Créer une URL pour la prévisualisation
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage({
        file: file,
        url: reader.result as string,
        name: file.name,
      })
      console.log("Image sélectionnée:", file.name, file.type, file.size)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((newMessage.trim() || selectedImage) && !isGenerating) {
      // Préparer les attachments si une image est sélectionnée
      const attachments = selectedImage
        ? [
            {
              type: selectedImage.file.type,
              url: selectedImage.url,
              name: selectedImage.name,
              file: selectedImage.file, // Ajouter le fichier original
            },
          ]
        : undefined

      // Envoyer le message avec ou sans image
      const messageContent = newMessage.trim() || (selectedImage ? "Voici une image à analyser:" : "")
      onNewMessage(messageContent, attachments)

      // Reset du formulaire
      setNewMessage("")
      setSelectedImage(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      handleImageFile(file)
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } else {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, GIF, etc.)")
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
  }

  const handleDeleteMessage = (messageIndex: number) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageIndex)
    }
  }

  const startEditingMessage = (messageIndex: number, content: string) => {
    setEditingMessageIndex(messageIndex)
    setEditingContent(content)
  }

  const cancelEditing = () => {
    setEditingMessageIndex(null)
    setEditingContent("")
  }

  const saveEditedMessage = () => {
    if (editingMessageIndex !== null && onEditMessage) {
      onEditMessage(editingMessageIndex, editingContent)
      setEditingMessageIndex(null)
      setEditingContent("")
    }
  }

  const enhancePrompt = () => {
    setShowPromptBuilder(true)

    // Déterminer le type de demande pour personnaliser l'amélioration
    const userMessage = newMessage.toLowerCase().trim()

    let improved = ""

    // Analyser la demande pour créer un prompt plus précis
    if (userMessage.includes("change") || userMessage.includes("modifie") || userMessage.includes("remplace")) {
      if (userMessage.includes("couleur") || userMessage.includes("color")) {
        improved = `Modifie le code HTML existant en changeant uniquement la couleur ${
          userMessage.includes("du") || userMessage.includes("de") ? "comme demandé: " : "de: "
        }${newMessage}. 
Assure-toi de préserver toute la structure et les fonctionnalités existantes.`
      } else if (userMessage.includes("texte") || userMessage.includes("text") || userMessage.includes("contenu")) {
        improved = `Modifie le code HTML existant en changeant uniquement le texte ${
          userMessage.includes("du") || userMessage.includes("de") ? "comme demandé: " : "de: "
        }${newMessage}.
Assure-toi de préserver toute la mise en forme, les styles et les fonctionnalités existantes.`
      } else if (userMessage.includes("ajoute") || userMessage.includes("add")) {
        improved = `Modifie le code HTML existant en ajoutant ${newMessage}.
Intègre cet ajout harmonieusement avec le design et la structure existants.`
      } else {
        improved = `Modifie le code HTML existant selon cette demande: ${newMessage}.
Conserve la structure générale et le style de la page tout en apportant précisément les modifications demandées.`
      }
    } else if (userMessage.includes("supprime") || userMessage.includes("enlève") || userMessage.includes("remove")) {
      improved = `Modifie le code HTML existant en supprimant ${newMessage.replace(/^(supprime|enlève|remove)\s+/i, "")}.
Assure-toi que la suppression n'affecte pas négativement le reste de la page.`
    } else {
      // Demande générique
      improved = `Modifie le code HTML existant pour: ${newMessage}. 
Conserve la structure générale et le style de la page tout en apportant précisément les modifications demandées.
N'ajoute que ce qui est explicitement demandé sans inventer de nouvelles sections ou fonctionnalités.`
    }

    setEnhancedPrompt(improved)
  }

  const useEnhancedPrompt = () => {
    setNewMessage(enhancedPrompt)
    setShowPromptBuilder(false)
  }

  return (
    <div
      className={`flex flex-col h-full bg-[#121212] rounded-md overflow-hidden border border-[#2a2a2a] chat-container relative ${isDragOver ? "border-[#ddf928] border-2" : ""}`}
    >
      {/* Overlay de glisser-déposer */}
      {isDragOver && (
        <div className="absolute inset-0 bg-[#ddf928] bg-opacity-10 flex items-center justify-center z-50 border-2 border-dashed border-[#ddf928] rounded-md">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto text-[#ddf928] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-[#ddf928] text-lg font-medium">Glissez votre image ici</p>
            <p className="text-gray-400 text-sm">L'image sera ajoutée au chat</p>
          </div>
        </div>
      )}

      <div className="bg-[#1a1a1a] p-3 border-b border-[#2a2a2a] flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">
          <span className="text-[#ddf928]">Chat</span> with{" "}
          <span className="text-[#ddf928]" style={{ fontFamily: "Colette, sans-serif" }}>
            codro
          </span>
        </h2>
        <div className="text-xs text-gray-400">
          {messages.length > 0 ? `${messages.length} messages` : "Start a conversation"}
        </div>
      </div>

      <div
        className="flex-grow overflow-y-auto p-4 bg-[#121212] space-y-4"
        style={{ height: "calc(100% - 130px)", overflowY: "auto" }}
      >
        {messages.map((msg, index) => (
          <div key={index} className="group relative">
            {editingMessageIndex === index ? (
              // Mode édition
              <div className="bg-[#1a1a1a] border border-[#ddf928] rounded-md p-3">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full bg-[#212121] border border-[#2a2a2a] rounded-md text-gray-200 p-2 resize-none min-h-[60px]"
                  rows={3}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 text-xs bg-[#212121] text-gray-300 rounded-md hover:bg-[#2a2a2a]"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveEditedMessage}
                    className="px-3 py-1 text-xs bg-[#ddf928] text-[#1a1a1a] rounded-md hover:bg-[#b9cc21]"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            ) : (
              // Mode normal
              <>
                <ChatMessage
                  role={msg.role}
                  content={msg.content}
                  isLoading={msg.isLoading}
                  attachments={msg.attachments}
                  timestamp={msg.timestamp}
                />

                {/* Boutons d'action (visibles au survol) */}
                {msg.role === "user" && !msg.isLoading && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                      onClick={() => startEditingMessage(index, msg.content)}
                      className="p-1 bg-[#212121] hover:bg-[#2a2a2a] text-gray-300 rounded-md transition-colors"
                      title="Modifier le message"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(index)}
                      className="p-1 bg-[#212121] hover:bg-red-600 text-gray-300 hover:text-white rounded-md transition-colors"
                      title="Supprimer le message"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showPromptBuilder && (
        <div className="p-3 bg-[#1a1a1a] border-t border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#ddf928]">✨ Enhanced Prompt</span>
            <button onClick={() => setShowPromptBuilder(false)} className="text-gray-400 hover:text-white text-xs">
              Close
            </button>
          </div>
          <div className="bg-[#212121] p-3 rounded-md text-gray-300 text-sm mb-2 border border-[#2a2a2a]">
            {enhancedPrompt}
          </div>
          <button
            onClick={useEnhancedPrompt}
            className="text-xs bg-[#ddf928] text-[#1a1a1a] px-3 py-1.5 rounded-md font-medium hover:bg-[#b9cc21] transition-colors"
          >
            Use Enhanced Prompt
          </button>
        </div>
      )}

      <div className="p-3 bg-[#1a1a1a] border-t border-[#2a2a2a]">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Image preview si une image est sélectionnée */}
          {selectedImage && (
            <div className="relative bg-[#212121] border border-[#2a2a2a] rounded-md p-2 mb-2">
              <div className="flex items-center gap-3">
                <img
                  src={selectedImage.url || "/placeholder.svg"}
                  alt={selectedImage.name}
                  className="w-12 h-12 object-cover rounded border border-[#2a2a2a]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{selectedImage.name}</p>
                  <p className="text-xs text-gray-500">Selected image</p>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Supprimer l'image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedImage
                  ? "Describe what you want to do with this image..."
                  : "Ask a question or request code generation..."
              }
              className="w-full p-3 bg-[#212121] border border-[#2a2a2a] rounded-md text-gray-200 placeholder-gray-500 resize-none min-h-[60px] max-h-[120px] focus:ring-2 focus:ring-[#ddf928] focus:border-[#ddf928] transition-all duration-200"
              rows={2}
              disabled={isGenerating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={triggerFileInput}
                className="p-2 bg-[#212121] hover:bg-[#2a2a2a] text-gray-300 rounded-md transition-colors border border-[#2a2a2a]"
                title="Attach image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
              </button>

              <button
                type="button"
                onClick={enhancePrompt}
                className="p-2 bg-[#212121] hover:bg-[#2a2a2a] text-gray-300 rounded-md transition-colors border border-[#2a2a2a]"
                title="Prompt builder"
                disabled={!newMessage.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>

            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || isGenerating}
              className="px-4 py-2 bg-[#ddf928] text-[#1a1a1a] rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b9cc21] transition-all duration-200 shadow-md flex items-center"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#1a1a1a]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatInterface
