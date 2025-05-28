"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { generateCodeFromPrompt, generateCodeFromImage, generateCodeFromCode } from "../services/geminiService"
import { convertFileToBase64 } from "../services/fileHelper"
import CodeInput from "./CodeInput"
import PreviewPane from "./PreviewPane"
import LoadingSpinner from "./LoadingSpinner"
import ErrorMessage from "./ErrorMessage"
import { WandIcon, ImageIcon, CodeIcon, LoadingSpinnerIcon } from "../constants"
import { GenerationMode, type GenerationResult } from "../types"

const InteractiveGeneratorPage: React.FC = () => {
  const [mainPrompt, setMainPrompt] = useState<string>("")
  const [activeMode, setActiveMode] = useState<GenerationMode>(GenerationMode.Prompt)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [inputCode, setInputCode] = useState<string>("")

  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [editableCode, setEditableCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Référence pour le timeout
  const timeoutRef = useRef<number | null>(null)

  // Nettoyer le timeout lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const resetAuxInputs = () => {
    setImageFile(null)
    setImagePreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setInputCode("")
  }

  const handleModeSelection = (mode: GenerationMode) => {
    setError(null)
    setGenerationResult(null)
    setEditableCode("")
    if (activeMode === mode) {
      // Toggle off if clicking the same mode button again
      setActiveMode(GenerationMode.Prompt)
      resetAuxInputs()
    } else {
      setActiveMode(mode)
      resetAuxInputs() // Reset inputs when switching to a new mode
      if (mode === GenerationMode.Image && fileInputRef.current) {
        // No auto click, user explicitly clicks the styled button that triggers the input
      }
    }
  }

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Supprimer la vérification de taille de 4MB
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

  const handleGenerate = useCallback(async () => {
    // Nettoyer tout timeout existant
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

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

    setIsLoading(true)
    setError(null)
    setGenerationResult(null) // Clear previous results
    setEditableCode("")

    // Définir un timeout pour éviter un chargement infini
    timeoutRef.current = window.setTimeout(() => {
      setIsLoading(false)
      setError("La génération a pris trop de temps. Veuillez réessayer.")
    }, 30000) // 30 secondes de timeout

    try {
      console.log("Début de la génération avec Gemini API...")

      let code = ""
      if (activeMode === GenerationMode.Image && imageFile) {
        console.log("Mode: Image-to-Code")
        const base64Image = await convertFileToBase64(imageFile)
        code = await generateCodeFromImage(base64Image, imageFile.type, mainPrompt)
      } else if (activeMode === GenerationMode.Code && inputCode) {
        console.log("Mode: Code-to-Code")
        code = await generateCodeFromCode(inputCode, mainPrompt)
      } else {
        console.log("Mode: Prompt-to-Code")
        code = await generateCodeFromPrompt(mainPrompt)
      }

      console.log("Génération terminée avec succès")

      // Si le code est vide, utilisez un HTML par défaut
      if (!code || code.trim() === "") {
        console.warn("Le code généré est vide, utilisation d'un HTML par défaut")
        code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
  <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
    <h1 class="text-2xl font-bold text-center mb-4">Erreur de génération</h1>
    <p class="text-center text-gray-700">
      L'API Gemini n'a pas pu générer de code. Veuillez vérifier votre clé API et réessayer.
    </p>
  </div>
</body>
</html>`
      }

      setGenerationResult({ html: code, timestamp: Date.now() })
      setEditableCode(code)

      // Nettoyer le timeout car la génération est terminée
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    } catch (err) {
      console.error("Generation error:", err)

      // Nettoyer le timeout en cas d'erreur
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setError(err instanceof Error ? err.message : "An unknown error occurred during generation.")

      // Afficher un message d'erreur plus détaillé
      if (err instanceof Error && err.message.includes("Gemini API error")) {
        setError(
          `Erreur API Gemini: Veuillez vérifier que votre clé API est valide et que vous avez accès au modèle. Détails: ${err.message}`,
        )
      }
    } finally {
      // S'assurer que l'état de chargement est toujours désactivé
      setIsLoading(false)

      // Nettoyer le timeout par sécurité
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [mainPrompt, activeMode, imageFile, inputCode])

  const getButtonText = () => {
    if (isLoading) return "Generating..."
    if (activeMode === GenerationMode.Image) return "Generate from Image"
    if (activeMode === GenerationMode.Code) return "Transform Code"
    return "Generate Code"
  }

  const copyToClipboard = () => {
    if (editableCode) {
      navigator.clipboard
        .writeText(editableCode)
        .then(() => alert("Code copied to clipboard!"))
        .catch((err) => alert("Failed to copy code."))
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Input Section */}
      <section className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-purple-900/50">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-purple-300 mb-2">Create with AI</h2>
          <p className="text-gray-400 text-sm">Describe what you want to build or transform</p>
        </div>

        <textarea
          value={mainPrompt}
          onChange={(e) => setMainPrompt(e.target.value)}
          placeholder={
            activeMode === GenerationMode.Image
              ? "Describe what to build from the uploaded image (e.g., 'Replicate the hero section')..."
              : activeMode === GenerationMode.Code
                ? "Describe how to transform the pasted code (e.g., 'Convert to dark mode using Tailwind CSS')..."
                : "Describe the UI you want to build (e.g., 'A responsive hero section with a CTA button')..."
          }
          rows={activeMode === GenerationMode.Prompt ? 5 : 3}
          className="w-full p-4 font-sans text-base bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-500 transition-all duration-150 ease-in-out resize-y"
          aria-label="Main prompt input"
        />

        {/* Mode Selection Tabs */}
        <div className="flex mt-4 mb-2 border-b border-gray-800">
          <button
            onClick={() => handleModeSelection(GenerationMode.Prompt)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeMode === GenerationMode.Prompt
                ? "bg-purple-900/30 text-purple-300 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <WandIcon className="w-4 h-4 inline mr-2" />
            Text Prompt
          </button>
          <button
            onClick={() => handleModeSelection(GenerationMode.Image)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeMode === GenerationMode.Image
                ? "bg-purple-900/30 text-purple-300 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Image Input
          </button>
          <button
            onClick={() => handleModeSelection(GenerationMode.Code)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              activeMode === GenerationMode.Code
                ? "bg-purple-900/30 text-purple-300 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <CodeIcon className="w-4 h-4 inline mr-2" />
            Code Transform
          </button>
        </div>

        {/* Mode Specific Inputs */}
        <div className="space-y-4">
          {activeMode === GenerationMode.Image && (
            <div className="p-4 border border-dashed border-gray-700 rounded-lg bg-gray-800/50">
              <label htmlFor="image-upload-input" className="block text-sm font-medium text-purple-300 mb-2">
                Upload Image File:
              </label>
              <input
                id="image-upload-input"
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleImageFileChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                aria-describedby="image-upload-description"
              />
              <p id="image-upload-description" className="mt-1 text-xs text-gray-500">
                PNG, JPG, WEBP, GIF accepted.
              </p>
              {imagePreviewUrl && (
                <div className="mt-4 max-w-xs">
                  <img
                    src={imagePreviewUrl || "/placeholder.svg"}
                    alt="Image preview"
                    className="max-h-48 w-auto rounded-md shadow-md border border-gray-700"
                  />
                </div>
              )}
            </div>
          )}

          {activeMode === GenerationMode.Code && (
            <div className="p-4 border border-dashed border-gray-700 rounded-lg bg-gray-800/50">
              <label htmlFor="code-input-area" className="block text-sm font-medium text-purple-300 mb-2">
                Paste Existing Code:
              </label>
              <CodeInput
                id="code-input-area"
                value={inputCode}
                onChange={setInputCode}
                placeholder="Paste your HTML, CSS, or JS code here..."
                rows={8}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
            aria-live="polite"
          >
            {isLoading ? <LoadingSpinnerIcon className="h-5 w-5 mr-2" /> : <WandIcon className="w-5 h-5 mr-2" />}
            {getButtonText()}
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
      </section>

      {/* Output Section - Only show if loading or has results */}
      {(isLoading || generationResult) && (
        <section className="flex-grow flex flex-col space-y-6 min-h-[500px] md:min-h-[600px]">
          {isLoading && !generationResult && (
            <div className="flex-grow flex items-center justify-center bg-gray-900 rounded-xl shadow-inner border border-purple-900/30">
              <LoadingSpinner text="Gemini is weaving its magic..." />
            </div>
          )}
          {generationResult && (
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col bg-gray-900 rounded-xl shadow-2xl min-h-[300px] lg:min-h-0 border border-purple-900/30">
                <div className="flex justify-between items-center p-4 border-b border-gray-800">
                  <h2 className="text-xl font-semibold text-purple-300">Editable Code</h2>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
                    title="Copy code to clipboard"
                  >
                    Copy Code
                  </button>
                </div>
                <div className="flex-grow p-2">
                  <CodeInput
                    value={editableCode}
                    onChange={(newCode) => {
                      setEditableCode(newCode)
                      // Optionally debounce this update to generationResult for performance
                      setGenerationResult((prev) => (prev ? { ...prev, html: newCode, timestamp: Date.now() } : null))
                    }}
                    placeholder="Generated code will appear here..."
                    rows={20}
                  />
                </div>
              </div>
              <div className="flex flex-col bg-gray-900 rounded-xl shadow-2xl min-h-[300px] lg:min-h-0 border border-purple-900/30">
                <h2 className="text-xl font-semibold text-purple-300 p-4 border-b border-gray-800">Live Preview</h2>
                <div className="flex-grow p-2 relative">
                  <PreviewPane htmlContent={generationResult.html} key={generationResult.timestamp} />
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default InteractiveGeneratorPage
