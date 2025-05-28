"use client"

import type React from "react"
import { useState, useRef } from "react"
import { GenerationMode } from "../types"
import { ImageIcon, CodeIcon } from "../constants"
import AuthModal from "./AuthModal"

interface LandingPageProps {
  onStartGeneration: (prompt: string, mode: GenerationMode, imageFile: File | null, inputCode: string) => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartGeneration }) => {
  const [mainPrompt, setMainPrompt] = useState<string>("")
  const [activeMode, setActiveMode] = useState<GenerationMode>(GenerationMode.Prompt)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const themeInputRef = useRef<HTMLInputElement>(null)

  const [inputCode, setInputCode] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // États pour les boutons d'action
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null)

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("signup")

  const [showGenerateSection, setShowGenerateSection] = useState<boolean>(false)

  const resetAuxInputs = () => {
    setImageFile(null)
    setImagePreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (themeInputRef.current) {
      themeInputRef.current.value = ""
    }
    setInputCode("")
  }

  const handleModeSelection = (mode: GenerationMode) => {
    setError(null)
    if (activeMode === mode) {
      setActiveMode(GenerationMode.Prompt)
      resetAuxInputs()
    } else {
      setActiveMode(mode)
      resetAuxInputs()
    }
  }

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    } else {
      setImageFile(null)
      setImagePreviewUrl(null)
    }
  }

  const handleQuickAction = (action: string) => {
    if (activeQuickAction === action) {
      // Désactiver si déjà actif
      setActiveQuickAction(null)
      resetAuxInputs()
      setActiveMode(GenerationMode.Prompt)
    } else {
      // Activer la nouvelle action
      setActiveQuickAction(action)

      switch (action) {
        case "clone":
          setActiveMode(GenerationMode.Image)
          fileInputRef.current?.click()
          break
        case "theme":
          themeInputRef.current?.click()
          break
        case "transform":
          setActiveMode(GenerationMode.Code)
          break
        case "landing":
          setMainPrompt(
            "Créer une landing page moderne et responsive avec un hero section, des fonctionnalités et un call-to-action",
          )
          break
        case "form":
          setMainPrompt("Créer un formulaire d'inscription élégant avec validation et design moderne")
          break
      }
    }
  }

  const handleStartGeneration = () => {
    setShowGenerateSection(true)
    if (!mainPrompt.trim() && activeMode === GenerationMode.Prompt) {
      setError("Please enter a prompt describing what you want to build.")
      return
    }
    if (activeMode === GenerationMode.Image && !imageFile) {
      setError("Please upload an image to generate code from.")
      return
    }
    if (activeMode === GenerationMode.Image && !mainPrompt.trim()) {
      setError("Please provide instructions for interpreting the image.")
      return
    }
    if (activeMode === GenerationMode.Code && !inputCode.trim()) {
      setError("Please provide the existing code to transform.")
      return
    }
    if (activeMode === GenerationMode.Code && !mainPrompt.trim()) {
      setError("Please provide instructions for transforming the code.")
      return
    }

    onStartGeneration(mainPrompt, activeMode, imageFile, inputCode)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleStartGeneration()
    }
  }

  const handleGetStarted = () => {
    setAuthModalMode("signup")
    setIsAuthModalOpen(true)
  }

  const handleLogin = () => {
    setAuthModalMode("login")
    setIsAuthModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 text-center bg-[#121212] overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto mb-16">
            {/* Titre principal sans logo */}
            <div className="mb-8">
              <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                Transform your{" "}
                <span className="relative inline-block">
                  <span className="text-[#ddf928] relative z-10">ideas</span>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ddf928] to-[#b9cc21] rounded-full opacity-50"
                    style={{ bottom: "-8px" }}
                  />
                </span>{" "}
                into code
              </h2>
            </div>

            <h3 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
              <span
                className="bg-gradient-to-r from-[#ddf928] via-[#b9cc21] to-[#ddf928] bg-clip-text text-transparent"
                style={{
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                }}
              >
                instantly
              </span>
            </h3>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              The most advanced AI to create beautiful and functional web interfaces from text descriptions, images or
              existing code.
            </p>

            {/* Generator Interface */}
            <div className="w-full mb-16">
              {!showGenerateSection ? (
                // Version initiale
                <div
                  className="relative backdrop-blur-2xl bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl shadow-2xl"
                  style={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  {/* Textarea */}
                  <div className="overflow-auto">
                    <textarea
                      value={mainPrompt}
                      onChange={(e) => setMainPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe the interface you want to create..."
                      className="w-full h-20 md:h-20 min-h-20 p-6 bg-transparent border-none outline-none text-white placeholder-gray-400 resize-none"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                      }}
                    />
                  </div>

                  {/* Bottom section */}
                  <div className="flex items-center justify-between p-6 border-t border-[rgba(42,42,42,0.5)]">
                    <div className="flex items-center gap-3">
                      {/* Attach button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 p-3 rounded-xl text-white hover:bg-[rgba(42,42,42,0.5)] transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Generate button */}
                      <button
                        onClick={handleStartGeneration}
                        className="flex items-center justify-center p-3 border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-white hover:border-[#ddf928] transition-all duration-300 transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Version après avoir cliqué sur Generate - Version simplifiée du hero sans titre
                <div
                  className="relative backdrop-blur-2xl bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl shadow-2xl"
                  style={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  {/* Textarea */}
                  <div className="overflow-auto">
                    <textarea
                      value={mainPrompt}
                      onChange={(e) => setMainPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe the interface you want to create..."
                      className="w-full h-20 md:h-20 min-h-20 p-6 bg-transparent border-none outline-none text-white placeholder-gray-400 resize-none"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                      }}
                    />
                  </div>

                  {/* Bottom section */}
                  <div className="flex items-center justify-between p-6 border-t border-[rgba(42,42,42,0.5)]">
                    <div className="flex items-center gap-3">
                      {/* Attach button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 p-3 rounded-xl text-white hover:bg-[rgba(42,42,42,0.5)] transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Generate button */}
                      <button
                        onClick={handleStartGeneration}
                        className="flex items-center justify-center p-3 border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-white hover:border-[#ddf928] transition-all duration-300 transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <input ref={themeInputRef} type="file" accept=".zip,.rar,.7z" className="hidden" />

              {/* Error display */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Image preview */}
              {imagePreviewUrl && (
                <div className="mt-4 p-4 bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-lg">
                  <img
                    src={imagePreviewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="max-w-full h-32 object-cover rounded"
                  />
                </div>
              )}

              {/* Quick action buttons - toujours affichés */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => handleQuickAction("clone")}
                  className={`flex items-center gap-2 px-4 py-2 backdrop-blur border rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeQuickAction === "clone"
                      ? "bg-[#ddf928] border-[#ddf928] text-[#1a1a1a]"
                      : "bg-[rgba(26,26,26,0.8)] border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#ddf928]"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Clone Screenshot
                </button>

                <button
                  onClick={() => handleQuickAction("theme")}
                  className={`flex items-center gap-2 px-4 py-2 backdrop-blur border rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeQuickAction === "theme"
                      ? "bg-[#ddf928] border-[#ddf928] text-[#1a1a1a]"
                      : "bg-[rgba(26,26,26,0.8)] border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#ddf928]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Import Theme
                </button>

                <button
                  onClick={() => handleQuickAction("transform")}
                  className={`flex items-center gap-2 px-4 py-2 backdrop-blur border rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeQuickAction === "transform"
                      ? "bg-[#ddf928] border-[#ddf928] text-[#1a1a1a]"
                      : "bg-[rgba(26,26,26,0.8)] border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#ddf928]"
                  }`}
                >
                  <CodeIcon className="w-4 h-4" />
                  Transform Code
                </button>

                <button
                  onClick={() => handleQuickAction("landing")}
                  className={`flex items-center gap-2 px-4 py-2 backdrop-blur border rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeQuickAction === "landing"
                      ? "bg-[#ddf928] border-[#ddf928] text-[#1a1a1a]"
                      : "bg-[rgba(26,26,26,0.8)] border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#ddf928]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Landing Page
                </button>

                <button
                  onClick={() => handleQuickAction("form")}
                  className={`flex items-center gap-2 px-4 py-2 backdrop-blur border rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeQuickAction === "form"
                      ? "bg-[#ddf928] border-[#ddf928] text-[#1a1a1a]"
                      : "bg-[rgba(26,26,26,0.8)] border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#ddf928]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Sign Up Form
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-[#ddf928] mb-2">50K+</div>
                <div className="text-gray-400 text-sm">Projects created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-[#ddf928] mb-2">99.9%</div>
                <div className="text-gray-400 text-sm">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-[#ddf928] mb-2">5s</div>
                <div className="text-gray-400 text-sm">Average time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-[#ddf928] mb-2">24/7</div>
                <div className="text-gray-400 text-sm">Availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
              Revolutionary <span className="text-[#ddf928]">Features</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto">
              Discover the power of AI to transform your ideas into professional code in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[#ddf928] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(221,249,40,0.05)] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ddf928] to-[#b9cc21] rounded-2xl flex items-center justify-center mb-8 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-10 h-10 text-[#1a1a1a]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.53 16.122a3 3 0 0 0-2.122.442L4.108 19.5a2.25 2.25 0 0 1-3.182 0l-.001-.001a2.25 2.25 0 0 1 0-3.182l2.01-2.01a3 3 0 0 0 .442-2.122V9.531a3 3 0 0 0-2.122-.442L.002 7.076a2.25 2.25 0 0 1 0-3.182l.001-.001a2.25 2.25 0 0 1 3.182 0L5.39 6.001a3 3 0 0 0 2.122-.442V3.478a3 3 0 0 0 .442-2.122L9.967.002a2.25 2.25 0 0 1 3.182 0l.001.001a2.25 2.25 0 0 1 0 3.182L11.14 5.39a3 3 0 0 0-.442 2.122v2.123a3 3 0 0 0 2.122.442l2.01 2.009a2.25 2.25 0 0 1 0 3.182l-.001.001a2.25 2.25 0 0 1-3.182 0l-2.01-2.01a3 3 0 0 0-.442-2.122v-2.122a3 3 0 0 0-2.122-.442L7.879 9.967a2.25 2.25 0 0 1-3.182 0l-.001-.001a2.25 2.25 0 0 1 0-3.182l2.01-2.01M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white transition-colors duration-300 group-hover:text-[#ddf928]">
                  Text to Code
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Describe your vision in natural language and watch it transform into functional code with remarkable
                  precision.
                </p>
                <div className="flex items-center text-[#ddf928] text-sm font-semibold">
                  <span>En savoir plus</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[#ddf928] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(221,249,40,0.05)] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ddf928] to-[#b9cc21] rounded-2xl flex items-center justify-center mb-8 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                  <ImageIcon className="w-10 h-10 text-[#1a1a1a]" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white transition-colors duration-300 group-hover:text-[#ddf928]">
                  Image to Code
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Upload a screenshot or design and instantly convert it to responsive HTML and CSS code.
                </p>
                <div className="flex items-center text-[#ddf928] text-sm font-semibold">
                  <span>En savoir plus</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[#ddf928] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(221,249,40,0.05)] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ddf928] to-[#b9cc21] rounded-2xl flex items-center justify-center mb-8 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                  <CodeIcon className="w-10 h-10 text-[#1a1a1a]" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white transition-colors duration-300 group-hover:text-[#ddf928]">
                  Code Transformation
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Modify existing code with simple instructions to add features or change styles.
                </p>
                <div className="flex items-center text-[#ddf928] text-sm font-semibold">
                  <span>En savoir plus</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[#ddf928] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(221,249,40,0.05)] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ddf928] to-[#b9cc21] rounded-2xl flex items-center justify-center mb-8 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                  <svg className="w-10 h-10 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white transition-colors duration-300 group-hover:text-[#ddf928]">
                  Ultra-Fast Generation
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Get your code in less than 5 seconds thanks to our optimized AI and high-performance servers.
                </p>
                <div className="flex items-center text-[#ddf928] text-sm font-semibold">
                  <span>En savoir plus</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[#ddf928] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(221,249,40,0.05)] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ddf928] to-[#b9cc21] rounded-2xl flex items-center justify-center mb-8 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                  <svg className="w-10 h-10 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white transition-colors duration-300 group-hover:text-[#ddf928]">
                  Secure Code
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Clean, secure and optimized code following industry best practices and modern standards.
                </p>
                <div className="flex items-center text-[#ddf928] text-sm font-semibold">
                  <span>En savoir plus</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[#ddf928] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(221,249,40,0.05)] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ddf928] to-[#b9cc21] rounded-2xl flex items-center justify-center mb-8 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                  <svg className="w-10 h-10 text-[#1a1a1a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-6 text-white transition-colors duration-300 group-hover:text-[#ddf928]">
                  Intuitive Interface
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Modern and intuitive user interface designed to maximize your productivity and creativity.
                </p>
                <div className="flex items-center text-[#ddf928] text-sm font-semibold">
                  <span>En savoir plus</span>
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-[#121212] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
              Transparent <span className="text-[#ddf928]">Pricing</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto">
              Choose the plan that fits your needs. Start free and scale as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Free */}
            <div className="relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[rgba(42,42,42,0.8)] shadow-2xl">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4">Free</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-black text-white">$0</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <p className="text-gray-400">For people looking to explore.</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  5 messages per day
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  1 generation mode
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Up to 5 projects
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Export HTML/CSS
                </li>
              </ul>

              <button
                onClick={handleGetStarted}
                className="w-full bg-white hover:bg-gray-100 text-[#1a1a1a] py-3 rounded-lg font-bold transition-colors"
              >
                Start Building
              </button>
            </div>

            {/* Plan Premium - Highlighted */}
            <div className="relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border-2 border-[#ddf928] rounded-2xl p-8 transition-all duration-500 shadow-2xl transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#ddf928] text-[#1a1a1a] px-4 py-1 rounded-full text-sm font-bold">
                  Recommended
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4">Premium</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-black text-white">$20</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <p className="text-gray-400">For higher limits and power users.</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  100 generations per day
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  All generation modes
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Unlimited projects
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Export HTML/CSS
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Access to Clone extension
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Shopify theme import
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Project history
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Priority support
                </li>
              </ul>

              <button
                onClick={handleGetStarted}
                className="w-full bg-[#ddf928] hover:bg-[#b9cc21] text-[#1a1a1a] py-3 rounded-lg font-bold transition-all hover:scale-105"
              >
                Upgrade to Premium
              </button>
            </div>

            {/* Plan Team */}
            <div className="relative backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[rgba(42,42,42,0.8)] shadow-2xl">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-4">Team</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-black text-white">$30</span>
                  <span className="text-gray-400 ml-2">/user/month</span>
                </div>
                <p className="text-gray-400">For fast moving teams and collaboration.</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Everything in Premium
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Unlimited generations
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Team collaboration
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Project sharing
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Centralized management
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Private API
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-[#ddf928] mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Dedicated 24/7 support
                </li>
              </ul>

              <button
                onClick={handleGetStarted}
                className="w-full bg-white hover:bg-gray-100 text-[#1a1a1a] py-3 rounded-lg font-bold transition-colors"
              >
                Start a Team plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-32 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
              What our <span className="text-[#ddf928]">users</span> say
            </h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto">
              Join thousands of developers who trust our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                role: "Lead Developer",
                company: "TechCorp",
                content:
                  "Amazing! I was able to create a complete prototype in 10 minutes. The quality of the generated code is impressive.",
                rating: 5,
              },
              {
                name: "Marc Dubois",
                role: "Freelance",
                company: "Indépendant",
                content: "This AI has revolutionized the way I work. I can now deliver my projects 3x faster.",
                rating: 5,
              },
              {
                name: "Lisa Wang",
                role: "Product Manager",
                company: "StartupXYZ",
                content:
                  "Perfect for creating mockups quickly. The development team loves the precision of the generated code.",
                rating: 5,
              },
            ].map((review, index) => (
              <div
                key={index}
                className="backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[#ddf928] shadow-2xl"
              >
                <div className="flex items-center mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#ddf928]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{review.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#ddf928] to-[#b9cc21] rounded-full flex items-center justify-center mr-4">
                    <span className="text-[#1a1a1a] font-bold">
                      {review.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{review.name}</div>
                    <div className="text-sm text-gray-400">
                      {review.role} • {review.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-[#121212] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
              Frequently Asked <span className="text-[#ddf928]">Questions</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto">Find answers to your questions quickly</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                question: "How does code generation work?",
                answer:
                  "Our AI uses the latest language models to understand your descriptions and generate optimized HTML, CSS and JavaScript code. The process is instant and the code is ready to use.",
              },
              {
                question: "Can I modify the generated code?",
                answer:
                  "Absolutely! The generated code is fully editable. You can modify it directly in our editor or download it to use in your preferred development environment.",
              },
              {
                question: "What types of projects can I create?",
                answer:
                  "You can create any type of web interface: landing pages, forms, dashboards, e-commerce sites, web applications, and much more. Our AI adapts to all your needs.",
              },
              {
                question: "Is the generated code responsive?",
                answer:
                  "Yes! All generated code uses responsive design best practices with Tailwind CSS to ensure perfect adaptation on all devices.",
              },
              {
                question: "Is there a limit to the number of generations?",
                answer:
                  "The free plan offers 10 generations per day. Paid plans offer unlimited generations with advanced features.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="backdrop-blur-2xl bg-gradient-to-br from-[rgba(33,33,33,0.8)] to-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 transition-all duration-500 hover:border-[#ddf928] shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4">{faq.question}</h3>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] border-t border-[#2a2a2a]">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Logo and description */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-32 h-32 rounded-xl overflow-hidden mr-4 shadow-lg">
                  <img src="/images/new-logo.png" alt="Codro Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-8 max-w-md">
                The most advanced AI to transform your ideas into professional code. Create beautiful web interfaces in
                seconds.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378 0 0-.599 2.282-.744 2.84-.282 1.084-1.064 2.456-1.549 3.235C9.584 23.815 10.77 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-white mb-6">Product</h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-semibold text-white mb-6">Support</h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-16 pt-8 border-t border-[#2a2a2a]">
            <div className="text-sm text-gray-600 mb-4 sm:mb-0">© 2025 All rights reserved.</div>
            <div className="flex space-x-8 text-sm">
              <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} />
    </div>
  )
}

export default LandingPage
