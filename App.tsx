"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ApiKeyMissingError } from "./types"
import { GEMINI_API_KEY_ENV_VAR } from "./constants"
import LandingPage from "./components/LandingPage"
import Header from "./components/Header"
import ResultsPage from "./components/ResultsPage"
import Dashboard from "./components/Dashboard"
import { GenerationMode } from "./types"

const App: React.FC = () => {
  const [apiKeyError, setApiKeyError] = useState<ApiKeyMissingError | null>(null)
  const [currentPage, setCurrentPage] = useState<"landing" | "results">("landing")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // Paramètres pour la génération
  const [generationPrompt, setGenerationPrompt] = useState<string>("")
  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.Prompt)
  const [generationImageFile, setGenerationImageFile] = useState<File | null>(null)
  const [generationInputCode, setGenerationInputCode] = useState<string>("")

  useEffect(() => {
    // Check for both environment variables to be more flexible
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY

    if (!apiKey) {
      setApiKeyError({
        isApiKeyMissing: true,
        message: `Error: The ${GEMINI_API_KEY_ENV_VAR} environment variable is not set. Please ensure it is configured to use Gemini API.`,
      })
    } else {
      // Clear any existing error if the API key is found
      setApiKeyError(null)
    }

    // Log to help debug (will only be visible in development)
    console.log("Environment check:", {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasApiKey: !!process.env.API_KEY,
    })
  }, [])

  const handleStartGeneration = (prompt: string, mode: GenerationMode, imageFile: File | null, inputCode: string) => {
    console.log("=== handleStartGeneration called in App.tsx ===")
    console.log("Prompt:", prompt)
    console.log("Mode:", mode)
    console.log("ImageFile:", imageFile)
    console.log("InputCode:", inputCode)

    // Stocker les paramètres de génération
    setGenerationPrompt(prompt)
    setGenerationMode(mode)
    setGenerationImageFile(imageFile)
    setGenerationInputCode(inputCode)

    // IMPORTANT: Naviguer vers la page de résultats
    console.log("Changing page to results...")
    setCurrentPage("results")

    // Scroll to top
    window.scrollTo(0, 0)

    console.log("Page should now be 'results'")
  }

  const handleBackToLanding = () => {
    setCurrentPage("landing")
    window.scrollTo(0, 0)
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleSignUp = () => {
    setIsAuthenticated(true)
  }

  // Déterminer quel contenu afficher en fonction de l'état d'authentification et de la page actuelle
  let content
  if (currentPage === "results") {
    // Toujours afficher ResultsPage quand currentPage est "results", peu importe l'authentification
    content = (
      <main className="flex-grow w-full flex flex-col">
        <ResultsPage
          prompt={generationPrompt}
          mode={generationMode}
          imageFile={generationImageFile}
          inputCode={generationInputCode}
          onBackToLanding={handleBackToLanding}
        />
      </main>
    )
  } else {
    // currentPage est "landing"
    if (isAuthenticated) {
      // Utilisateur authentifié -> afficher Dashboard
      content = <Dashboard onStartGeneration={handleStartGeneration} />
    } else {
      // Utilisateur non authentifié -> afficher LandingPage avec Header
      content = (
        <>
          <Header onLogin={handleLogin} onSignUp={handleSignUp} />
          <main className="flex-grow w-full flex flex-col">
            <LandingPage onStartGeneration={handleStartGeneration} />
          </main>
        </>
      )
    }
  }

  return <div className="min-h-screen bg-[#121212] text-gray-100 flex flex-col">{content}</div>
}

export default App
