"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  generateCodeFromPrompt,
  generateCodeFromImage,
  generateCodeFromCode,
  detectLanguage,
  getResponseMessages,
} from "../services/geminiService"
import { convertFileToBase64 } from "../services/fileHelper"
import ChatInterface from "./ChatInterface"
import type { ChatMessageProps } from "./ChatMessage"
import { GenerationMode } from "../types"
import ErrorMessage from "./ErrorMessage"
import CodeInput from "./CodeInput"
import PreviewPane from "./PreviewPane"

interface ResultsPageProps {
  prompt: string
  mode: GenerationMode
  imageFile: File | null
  inputCode: string
  onBackToLanding: () => void
}

interface ProjectState {
  id: string
  name: string
  code: string
  messages: ChatMessageProps[]
  lastUpdated: number
}

interface CodeVersion {
  code: string
  messageIndex: number
  timestamp: number
}

const ResultsPage: React.FC<ResultsPageProps> = ({ prompt, mode, imageFile, inputCode, onBackToLanding }) => {
  // État du projet actuel
  const [projectState, setProjectState] = useState<ProjectState>({
    id: `project-${Date.now()}`,
    name: "Nouveau projet",
    code: "",
    messages: [],
    lastUpdated: Date.now(),
  })

  // Historique des versions du code
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([])
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false)
  const [editableCode, setEditableCode] = useState<string>("")
  const [previewTimestamp, setPreviewTimestamp] = useState<number>(Date.now())
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code")
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [streamedCode, setStreamedCode] = useState<string>("")
  const [viewportSize, setViewportSize] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [generationComplete, setGenerationComplete] = useState<boolean>(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [chatWidth, setChatWidth] = useState<number>(30)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const [isEditPanelOpen, setIsEditPanelOpen] = useState<boolean>(false)

  const [isShopifyModalOpen, setIsShopifyModalOpen] = useState(false)
  const [shopifyDomain, setShopifyDomain] = useState("")
  const [shopifyApiKey, setShopifyApiKey] = useState("")

  // Référence pour le timeout et le streaming
  const timeoutRef = useRef<number | null>(null)
  const streamIntervalRef = useRef<number | null>(null)

  // Empêcher le défilement de la page entière
  useEffect(() => {
    // Bloquer complètement le défilement au montage du composant
    document.body.style.overflow = "hidden"
    document.body.style.height = "100vh"
    document.body.style.width = "100vw"
    document.body.style.margin = "0"
    document.body.style.padding = "0"
    document.documentElement.style.overflow = "hidden"
    document.documentElement.style.height = "100vh"
    document.documentElement.style.width = "100vw"
    document.documentElement.style.margin = "0"
    document.documentElement.style.padding = "0"

    // Empêcher le défilement avec les touches du clavier
    const preventScroll = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "PageDown" ||
        e.key === "PageUp" ||
        e.key === "Home" ||
        e.key === "End"
      ) {
        e.preventDefault()
      }
    }

    // Empêcher le défilement avec la molette
    const preventWheel = (e: WheelEvent) => {
      if (e.target === document.body || e.target === document.documentElement) {
        e.preventDefault()
      }
    }

    document.addEventListener("keydown", preventScroll)
    document.addEventListener("wheel", preventWheel, { passive: false })

    // Restaurer le défilement au démontage du composant
    return () => {
      document.body.style.overflow = "auto"
      document.body.style.height = "auto"
      document.body.style.width = "auto"
      document.body.style.margin = ""
      document.body.style.padding = ""
      document.documentElement.style.overflow = "auto"
      document.documentElement.style.height = "auto"
      document.documentElement.style.width = "auto"
      document.documentElement.style.margin = ""
      document.documentElement.style.padding = ""
      document.removeEventListener("keydown", preventScroll)
      document.removeEventListener("wheel", preventWheel)
    }
  }, [])

  useEffect(() => {
    // Ajouter cet useEffect pour écouter les mises à jour du preview
    const handlePreviewUpdate = (event: CustomEvent) => {
      const { htmlContent } = event.detail
      console.log("🔄 Mise à jour du code depuis le preview")

      // Mettre à jour le code dans tous les états
      setEditableCode(htmlContent)
      setStreamedCode(htmlContent)
      setProjectState((prev) => ({
        ...prev,
        code: htmlContent,
        lastUpdated: Date.now(),
      }))

      // Forcer le refresh du preview
      setPreviewTimestamp(Date.now())
    }

    // Ajouter l'écouteur pour basculer vers l'onglet Code
    const handleSwitchToCodeTab = () => {
      setActiveTab("code")
    }

    window.addEventListener("previewUpdated", handlePreviewUpdate as EventListener)
    window.addEventListener("switchToCodeTab", handleSwitchToCodeTab as EventListener)

    return () => {
      window.removeEventListener("previewUpdated", handlePreviewUpdate as EventListener)
      window.removeEventListener("switchToCodeTab", handleSwitchToCodeTab as EventListener)
    }
  }, [])

  useEffect(() => {
    // Si nous avons un fichier image, créer une URL pour la prévisualisation
    if (imageFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(imageFile)
    }

    // Nettoyer le timeout et l'intervalle lors du démontage du composant
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
      if (streamIntervalRef.current) {
        window.clearInterval(streamIntervalRef.current)
      }
    }
  }, [imageFile])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing])

  // Ajouter cet useEffect pour écouter l'événement exitFullscreen
  useEffect(() => {
    const handleExitFullscreen = () => {
      setIsFullscreen(false)
      // Forcer le refresh du preview après la sortie du fullscreen
      setTimeout(() => {
        setPreviewTimestamp(Date.now())
      }, 100)
    }

    window.addEventListener("exitFullscreen", handleExitFullscreen)

    return () => {
      window.removeEventListener("exitFullscreen", handleExitFullscreen)
    }
  }, [])

  useEffect(() => {
    // Fonction pour initialiser les messages une fois que l'image est prête
    const initializeMessages = () => {
      const initialMessage: ChatMessageProps = {
        role: "user",
        content: prompt,
        timestamp: Date.now(),
      }

      // Ajouter l'image si elle existe ET que l'URL de prévisualisation est prête
      if (imageFile && imagePreviewUrl) {
        initialMessage.attachments = [
          {
            type: imageFile.type,
            url: imagePreviewUrl,
            name: imageFile.name,
          },
        ]
      }

      // Mettre à jour l'état du projet
      setProjectState((prev) => ({
        ...prev,
        messages: [initialMessage],
        lastUpdated: Date.now(),
      }))

      // Ajouter un message "en attente" de l'assistant
      setProjectState((prev) => ({
        ...prev,
        messages: [...prev.messages, { role: "assistant", content: "", isLoading: true }],
      }))

      // Lancer la génération immédiatement
      generateCode()
    }

    // Si on a une image, attendre que l'URL de prévisualisation soit prête
    if (imageFile && !imagePreviewUrl) {
      // L'URL sera définie dans l'autre useEffect, on attend
      return
    }

    // Sinon, initialiser immédiatement
    initializeMessages()
  }, [imagePreviewUrl])

  // Fonction pour sauvegarder une version du code
  const saveCodeVersion = (code: string, messageIndex: number) => {
    setCodeVersions((prev) => [
      ...prev,
      {
        code,
        messageIndex,
        timestamp: Date.now(),
      },
    ])
  }

  // Fonction pour restaurer une version précédente du code
  const restoreCodeVersion = (messageIndex: number) => {
    // Trouver la dernière version du code AVANT ce message
    const previousVersion = codeVersions
      .filter((version) => version.messageIndex < messageIndex)
      .sort((a, b) => b.messageIndex - a.messageIndex)[0]

    if (previousVersion) {
      console.log(`🔄 Restauration du code à la version du message ${previousVersion.messageIndex}`)
      setEditableCode(previousVersion.code)
      setStreamedCode(previousVersion.code)
      setProjectState((prev) => ({
        ...prev,
        code: previousVersion.code,
        lastUpdated: Date.now(),
      }))
      setPreviewTimestamp(Date.now())
    } else {
      console.log("🔄 Restauration du code à l'état initial (vide)")
      // Si pas de version précédente, revenir à l'état initial
      setEditableCode("")
      setStreamedCode("")
      setProjectState((prev) => ({
        ...prev,
        code: "",
        lastUpdated: Date.now(),
      }))
      setPreviewTimestamp(Date.now())
    }

    // Supprimer les versions du code postérieures à ce message
    setCodeVersions((prev) => prev.filter((version) => version.messageIndex < messageIndex))
  }

  // Fonction pour simuler l'écriture rapide du code
  const simulateTyping = (finalCode: string, isModification = false, userLanguage = "en", messageIndex?: number) => {
    setActiveTab("code") // S'assurer que l'onglet Code est actif
    setIsGenerating(true)
    setStreamedCode("")

    // Nettoyer tout intervalle existant
    if (streamIntervalRef.current) {
      window.clearInterval(streamIntervalRef.current)
    }

    const words = finalCode.split(" ")
    let currentWordIndex = 0
    let currentText = ""

    // Vitesse d'écriture rapide (plusieurs mots à la fois)
    streamIntervalRef.current = window.setInterval(() => {
      if (currentWordIndex < words.length) {
        // Ajouter 3-5 mots à la fois pour un effet rapide mais visible
        const wordsToAdd = Math.min(5, words.length - currentWordIndex)
        for (let i = 0; i < wordsToAdd; i++) {
          currentText += words[currentWordIndex] + " "
          currentWordIndex++
        }

        setStreamedCode(currentText.trim())

        // Si on a fini
        if (currentWordIndex >= words.length) {
          if (streamIntervalRef.current) {
            window.clearInterval(streamIntervalRef.current)
          }

          // Finaliser
          setEditableCode(finalCode)
          setProjectState((prev) => ({
            ...prev,
            code: finalCode,
            lastUpdated: Date.now(),
          }))
          setIsGenerating(false)
          setGenerationComplete(true)

          // Sauvegarder cette version du code
          if (messageIndex !== undefined) {
            saveCodeVersion(finalCode, messageIndex)
          }

          // Obtenir le message approprié selon la langue
          const responseMessages = getResponseMessages(userLanguage, isModification)
          updateAssistantMessage(responseMessages.codeGenerated)

          // IMPORTANT: Basculer vers la prévisualisation AVEC la colonne ouverte si on est en mode édition
          setTimeout(() => {
            setActiveTab("preview")
            setPreviewTimestamp(Date.now())
            // GARDER la colonne ouverte si on était en mode édition
            // Ne pas changer isEditPanelOpen ici
          }, 800)
        }
      }
    }, 50) // 50ms entre chaque ajout de mots = très rapide mais visible
  }

  const updateAssistantMessage = (content: string, isLoading = false) => {
    setProjectState((prev) => {
      const newMessages = [...prev.messages]
      // Remplacer le dernier message de l'assistant ou en ajouter un nouveau
      const lastAssistantIndex = newMessages
        .map((msg, index) => ({ role: msg.role, index }))
        .reverse()
        .find((msg) => msg.role === "assistant")?.index

      if (lastAssistantIndex !== undefined && newMessages[lastAssistantIndex].isLoading) {
        newMessages[lastAssistantIndex] = {
          role: "assistant",
          content,
          isLoading,
          timestamp: Date.now(),
        }
      } else {
        // Ajouter un nouveau message
        newMessages.push({
          role: "assistant",
          content,
          isLoading,
          timestamp: Date.now(),
        })
      }
      return {
        ...prev,
        messages: newMessages,
        lastUpdated: Date.now(),
      }
    })
  }

  const generateCode = async () => {
    setIsGenerating(true)
    setError(null)
    setStreamedCode("") // Reset du code streamé
    setGenerationComplete(false)
    setActiveTab("code") // S'assurer que l'onglet Code est actif

    // Détecter la langue du prompt initial
    const userLanguage = detectLanguage(prompt)
    const responseMessages = getResponseMessages(userLanguage)

    try {
      console.log("Début de la génération avec Gemini API...")

      // Extraire l'historique de conversation pour le contexte
      const conversationHistory = projectState.messages
        .filter((msg) => !msg.isLoading)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      let code = ""
      if (mode === GenerationMode.Image && imageFile) {
        console.log("Mode: Image-to-Code")
        const base64Image = await convertFileToBase64(imageFile)
        code = await generateCodeFromImage(base64Image, imageFile.type, prompt, projectState.code)
      } else if (mode === GenerationMode.Code && inputCode) {
        console.log("Mode: Code-to-Code")
        code = await generateCodeFromCode(inputCode, prompt, conversationHistory)
      } else {
        console.log("Mode: Prompt-to-Code")
        code = await generateCodeFromPrompt(prompt, projectState.code, conversationHistory)
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
  <h1 class="text-2xl font-bold text-center mb-4">Generated Page</h1>
  <p class="text-center text-gray-700">
    Here's your generated page. You can now edit it according to your needs.
  </p>
</div>
</body>
</html>`
      }

      // Commencer l'animation de frappe rapide
      simulateTyping(code, false, userLanguage, 0) // Message initial = index 0
    } catch (err) {
      console.error("Generation error:", err)

      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during generation."
      setError(errorMessage)
      setIsGenerating(false)

      // Mettre à jour le message de l'assistant en cas d'erreur
      updateAssistantMessage(`${responseMessages.error} ${errorMessage}`)

      // Afficher un message d'erreur générique
      setStreamedCode(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generation Error</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold text-center mb-4 text-red-600">Generation Error</h1>
        <p class="text-center text-gray-700">
            An error occurred during code generation. Please try again.
        </p>
        <p class="text-sm text-red-500 mt-4 text-center">
            ${errorMessage}
        </p>
    </div>
</body>
</html>`)
    }
  }

  // Fonction pour détecter si c'est une petite modification
  const isSmallModification = (message: string): boolean => {
    const smallModKeywords = [
      "change",
      "modifie",
      "remplace",
      "couleur",
      "color",
      "texte",
      "text",
      "titre",
      "title",
      "bouton",
      "button",
      "ajoute",
      "add",
      "supprime",
      "remove",
      "enlève",
      "taille",
      "size",
      "police",
      "font",
      "marge",
      "margin",
      "padding",
      "border",
      "bordure",
      "background",
      "fond",
      "cambiar",
      "modificar",
      "añadir",
      "eliminar",
      "tamaño",
      "fuente",
      "margen",
      "fondo",
    ]

    const lowerMessage = message.toLowerCase()
    return smallModKeywords.some((keyword) => lowerMessage.includes(keyword))
  }

  const handleAIRequest = (message: string, imageFile?: File) => {
    // Cette fonction sera appelée depuis PreviewPane quand on clique sur Submit
    if (imageFile) {
      // Créer un attachment pour l'image
      const reader = new FileReader()
      reader.onload = () => {
        const attachments = [
          {
            type: imageFile.type,
            url: reader.result as string,
            name: imageFile.name,
            file: imageFile,
          },
        ]
        handleNewMessage(message, attachments)
      }
      reader.readAsDataURL(imageFile)
    } else {
      handleNewMessage(message)
    }
  }

  const handleNewMessage = async (
    message: string,
    attachments?: { type: string; url: string; name?: string; file?: File }[],
  ) => {
    // Détecter la langue du message utilisateur
    const userLanguage = detectLanguage(message)
    const responseMessages = getResponseMessages(userLanguage)

    // Sauvegarder la version actuelle du code avant la modification
    const currentMessageIndex = projectState.messages.length
    if (projectState.code) {
      saveCodeVersion(projectState.code, currentMessageIndex - 1)
    }

    // Ajouter le message de l'utilisateur
    setProjectState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role: "user",
          content: message,
          timestamp: Date.now(),
          attachments: attachments || [],
        },
      ],
      lastUpdated: Date.now(),
    }))

    // Ajouter un message "en attente" de l'assistant
    setProjectState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role: "assistant",
          content: "",
          isLoading: true,
        },
      ],
    }))

    try {
      // Générer une réponse en utilisant le code existant comme contexte
      setIsGenerating(true)

      // Extraire l'historique de conversation pour le contexte
      const conversationHistory = projectState.messages
        .filter((msg) => !msg.isLoading)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      // Ajouter le nouveau message à l'historique
      conversationHistory.push({
        role: "user",
        content: message,
      })

      // Utiliser le code modifié le plus récent comme contexte
      const existingCode = editableCode || projectState.code || streamedCode

      let response = ""

      // Détecter si c'est une petite modification
      const isSmallMod = isSmallModification(message)

      // Si le message contient des attachments avec des images, utiliser generateCodeFromImage
      if (attachments && attachments.length > 0 && attachments[0].type.startsWith("image/")) {
        console.log("🖼️ Génération à partir d'une image dans le chat")
        console.log("Attachment reçu:", attachments[0])

        // Utiliser le fichier original si disponible
        if (attachments[0].file) {
          console.log("📁 Utilisation du fichier original:", attachments[0].file.name, attachments[0].file.type)
          try {
            const base64Data = await convertFileToBase64(attachments[0].file)
            console.log("✅ Base64 converti, taille:", base64Data.length)
            response = await generateCodeFromImage(base64Data, attachments[0].file.type, message, existingCode)
          } catch (error) {
            console.error("❌ Erreur conversion base64:", error)
            throw error
          }
        } else {
          console.log("🔗 Utilisation de l'URL data")
          // Convertir l'URL data en base64
          const base64Data = attachments[0].url.split(",")[1]
          if (!base64Data) {
            throw new Error("Impossible d'extraire les données base64 de l'image")
          }
          response = await generateCodeFromImage(base64Data, attachments[0].type, message, existingCode)
        }
      } else {
        // Sinon, utiliser generateCodeFromPrompt normal
        response = await generateCodeFromPrompt(message, existingCode, conversationHistory)
      }

      // Si c'est une petite modification, utiliser l'animation de frappe rapide
      if (isSmallMod) {
        simulateTyping(response, true, userLanguage, currentMessageIndex)
      } else {
        // Pour les gros changements, afficher immédiatement
        setEditableCode(response)
        setStreamedCode(response)
        setProjectState((prev) => ({
          ...prev,
          code: response,
          lastUpdated: Date.now(),
        }))
        setIsGenerating(false)
        setGenerationComplete(true)
        setPreviewTimestamp(Date.now())

        // Sauvegarder cette version du code
        saveCodeVersion(response, currentMessageIndex)

        updateAssistantMessage(responseMessages.codeGenerated)

        // IMPORTANT: Si on est en mode édition, rester en mode preview avec la colonne
        setActiveTab("preview")
        // Ne pas fermer la colonne d'édition
      }
    } catch (err) {
      console.error("Error generating response:", err)
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setError("Error generating response: " + errorMessage)
      setIsGenerating(false)

      // Mettre à jour le message de l'assistant en cas d'erreur
      updateAssistantMessage(`${responseMessages.error} ${errorMessage}`)
    }
  }

  const handleDeleteMessage = (messageIndex: number) => {
    console.log(`🗑️ Suppression du message à l'index ${messageIndex}`)

    setProjectState((prev) => {
      const newMessages = [...prev.messages]

      // Supprimer le message utilisateur
      const deletedMessage = newMessages[messageIndex]
      newMessages.splice(messageIndex, 1)

      // Si c'était un message utilisateur, supprimer aussi la réponse de l'assistant qui suit
      if (
        deletedMessage.role === "user" &&
        messageIndex < newMessages.length &&
        newMessages[messageIndex].role === "assistant"
      ) {
        newMessages.splice(messageIndex, 1)
      }

      return {
        ...prev,
        messages: newMessages,
        lastUpdated: Date.now(),
      }
    })

    // Restaurer la version du code précédente
    restoreCodeVersion(messageIndex)
  }

  const handleEditMessage = async (
    messageIndex: number,
    newContent: string,
    attachments?: { type: string; url: string; name?: string; file?: File }[],
  ) => {
    console.log(`✏️ Édition du message à l'index ${messageIndex}`)

    // Mettre à jour le message existant (ne pas créer un nouveau)
    setProjectState((prev) => {
      const newMessages = [...prev.messages]
      newMessages[messageIndex] = {
        ...newMessages[messageIndex],
        content: newContent,
        attachments: attachments || [],
      }

      // Supprimer la réponse de l'assistant qui suit si elle existe
      if (messageIndex + 1 < newMessages.length && newMessages[messageIndex + 1].role === "assistant") {
        newMessages.splice(messageIndex + 1, 1)
      }

      return {
        ...prev,
        messages: newMessages,
        lastUpdated: Date.now(),
      }
    })

    // Restaurer le code à la version précédente avant de régénérer
    restoreCodeVersion(messageIndex)

    // Attendre un peu pour que la restauration soit effective
    setTimeout(async () => {
      // Ajouter un message "en attente" de l'assistant
      setProjectState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "assistant",
            content: "",
            isLoading: true,
          },
        ],
      }))

      // Régénérer la réponse avec le nouveau contenu
      try {
        setIsGenerating(true)

        // Extraire l'historique de conversation jusqu'à ce message
        const conversationHistory = projectState.messages
          .slice(0, messageIndex + 1)
          .filter((msg) => !msg.isLoading)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))

        // Mettre à jour le dernier message avec le nouveau contenu
        conversationHistory[conversationHistory.length - 1].content = newContent

        // Utiliser le code restauré comme contexte
        const existingCode = projectState.code || editableCode || streamedCode

        let response = ""
        const userLanguage = detectLanguage(newContent)
        const responseMessages = getResponseMessages(userLanguage)

        // Si le message contient des attachments avec des images
        if (attachments && attachments.length > 0 && attachments[0].type.startsWith("image/")) {
          if (attachments[0].file) {
            const base64Data = await convertFileToBase64(attachments[0].file)
            response = await generateCodeFromImage(base64Data, attachments[0].file.type, newContent, existingCode)
          } else {
            const base64Data = attachments[0].url.split(",")[1]
            if (!base64Data) {
              throw new Error("Impossible d'extraire les données base64 de l'image")
            }
            response = await generateCodeFromImage(base64Data, attachments[0].type, newContent, existingCode)
          }
        } else {
          response = await generateCodeFromPrompt(newContent, existingCode, conversationHistory)
        }

        // Détecter si c'est une petite modification
        const isSmallMod = isSmallModification(newContent)

        if (isSmallMod) {
          simulateTyping(response, true, userLanguage, messageIndex)
        } else {
          setEditableCode(response)
          setStreamedCode(response)
          setProjectState((prev) => ({
            ...prev,
            code: response,
            lastUpdated: Date.now(),
          }))
          setIsGenerating(false)
          setGenerationComplete(true)
          setPreviewTimestamp(Date.now())

          // Sauvegarder cette nouvelle version du code
          saveCodeVersion(response, messageIndex)

          updateAssistantMessage(responseMessages.codeGenerated)

          // IMPORTANT: Si on est en mode édition, rester en mode preview avec la colonne
          setActiveTab("preview")
          // Ne pas fermer la colonne d'édition
        }
      } catch (err) {
        console.error("Error regenerating response:", err)
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
        setError("Error regenerating response: " + errorMessage)
        setIsGenerating(false)

        const userLanguage = detectLanguage(newContent)
        const responseMessages = getResponseMessages(userLanguage)
        updateAssistantMessage(`${responseMessages.error} ${errorMessage}`)
      }
    }, 100)
  }

  // Cette fonction n'est plus utilisée car on gère tout dans handleNewMessage
  const handleFileUpload = async (file: File) => {
    // Cette fonction peut être supprimée ou laissée vide
    // car maintenant on gère les images directement dans ChatInterface
  }

  const copyToClipboard = () => {
    const codeToCopy = editableCode || streamedCode
    if (codeToCopy) {
      navigator.clipboard
        .writeText(codeToCopy)
        .then(() => {
          // Flash message
          const flashMessage = document.createElement("div")
          flashMessage.className =
            "fixed top-4 right-4 bg-[#ddf928] text-[#1a1a1a] px-4 py-2 rounded shadow-lg z-50 font-medium"
          flashMessage.textContent = "Code copied!"
          document.body.appendChild(flashMessage)
          setTimeout(() => {
            document.body.removeChild(flashMessage)
          }, 2000)

          // Ajouter un message système
          setProjectState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                role: "system",
                content: "Code has been copied to clipboard.",
                timestamp: Date.now(),
              },
            ],
            lastUpdated: Date.now(),
          }))
        })
        .catch((err) => {
          setError("Failed to copy code.")
        })
    }
  }

  const downloadCode = () => {
    const codeToDownload = editableCode || streamedCode
    if (codeToDownload) {
      const blob = new Blob([codeToDownload], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "generated-code.html"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Flash message
      const flashMessage = document.createElement("div")
      flashMessage.className =
        "fixed top-4 right-4 bg-[#ddf928] text-[#1a1a1a] px-4 py-2 rounded shadow-lg z-50 font-medium"
      flashMessage.textContent = "Code downloaded!"
      document.body.appendChild(flashMessage)
      setTimeout(() => {
        document.body.removeChild(flashMessage)
      }, 2000)

      // Ajouter un message système
      setProjectState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "system",
            content: "Code has been downloaded as HTML file.",
            timestamp: Date.now(),
          },
        ],
        lastUpdated: Date.now(),
      }))
    }
  }

  const updatePreview = () => {
    const codeToPreview = isGenerating ? streamedCode : editableCode
    setEditableCode(codeToPreview)
    setPreviewTimestamp(Date.now())
    setActiveTab("preview")

    // Mettre à jour le code du projet
    setProjectState((prev) => ({
      ...prev,
      code: codeToPreview,
      lastUpdated: Date.now(),
    }))

    // Ajouter un message système
    setProjectState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role: "system",
          content: "Preview updated with current code.",
          timestamp: Date.now(),
        },
      ],
      lastUpdated: Date.now(),
    }))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleCodeChange = (newCode: string) => {
    if (!isGenerating) {
      setEditableCode(newCode)
      // Mettre à jour le code du projet
      setProjectState((prev) => ({
        ...prev,
        code: newCode,
        lastUpdated: Date.now(),
      }))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return

    const containerWidth = window.innerWidth
    const newWidth = (e.clientX / containerWidth) * 100

    // Limiter entre 20% et 60%
    if (newWidth >= 20 && newWidth <= 60) {
      setChatWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  const handleViewportChange = (size: "desktop" | "tablet" | "mobile") => {
    setViewportSize(size)
    // NE PAS changer previewTimestamp pour éviter de perdre la sélection
    // setPreviewTimestamp(Date.now()) // SUPPRIMER cette ligne
  }

  const handleShopifySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Shopify Domain:", shopifyDomain)
    console.log("Shopify API Key:", shopifyApiKey)
    setIsShopifyModalOpen(false)
  }

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-[#1a1a1a] overflow-hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 px-6 py-4 bg-[#1a1a1a]">
          <ErrorMessage message={error} />
        </div>
      )}

      <div className="flex w-full h-full">
        {/* Chat Interface - CACHÉ quand le panneau d'édition est ouvert */}
        {!isEditPanelOpen && (
          <div style={{ width: `${chatWidth}%` }} className="flex flex-col h-full">
            {/* Header compact avec logo plus grand */}
            <div className="p-0.5 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-lg overflow-hidden mr-2 shadow-lg">
                  <img src="/images/new-logo.png" alt="Codro Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <button
                onClick={onBackToLanding}
                className="px-2 py-1 bg-[#212121] hover:bg-[#2a2a2a] text-white rounded-md transition-colors shadow-md border border-[#2a2a2a] text-xs"
              >
                ← Back
              </button>
            </div>

            <div className="flex-grow h-full overflow-hidden">
              <ChatInterface
                messages={projectState.messages}
                onNewMessage={handleNewMessage}
                onFileUpload={handleFileUpload}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={handleEditMessage}
                isGenerating={isGenerating}
                initialPrompt=""
              />
            </div>
          </div>
        )}

        {/* Diviseur - CACHÉ quand le panneau d'édition est ouvert */}
        {!isEditPanelOpen && (
          <div
            className={`w-1 bg-[#2a2a2a] hover:bg-[#ddf928] cursor-col-resize flex-shrink-0 ${isResizing ? "bg-[#ddf928]" : ""}`}
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Code and Preview - Prend toute la largeur quand le panneau d'édition est ouvert */}
        <div
          style={{ width: isEditPanelOpen ? "100%" : `${100 - chatWidth}%` }}
          className="flex flex-col bg-[#1a1a1a] shadow-xl border-l border-[#2a2a2a] overflow-hidden h-full"
        >
          <div className="flex border-b border-[#2a2a2a] bg-[#212121] flex-shrink-0">
            <button
              onClick={() => setActiveTab("code")}
              className={`px-6 py-3 font-medium transition-all duration-200 ${
                activeTab === "code"
                  ? "bg-[#1a1a1a] text-[#ddf928] border-b-2 border-[#ddf928]"
                  : "text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]"
              }`}
            >
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Code {isGenerating && <span className="ml-2 text-[#ddf928] animate-pulse">✍️</span>}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-6 py-3 font-medium transition-all duration-200 ${
                activeTab === "preview"
                  ? "bg-[#1a1a1a] text-[#ddf928] border-b-2 border-[#ddf928]"
                  : "text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]"
              }`}
            >
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview
              </span>
            </button>

            {/* Contrôles dans le header - alignés à droite */}
            <div className="ml-auto flex items-center pr-4 space-x-2">
              {activeTab === "code" && (
                <>
                  {/* Boutons pour l'onglet Code */}
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 text-xs font-medium bg-[#212121] hover:bg-[#2a2a2a] text-gray-300 rounded-md transition-all duration-200 shadow-md border border-[#2a2a2a]"
                    title="Copy Code"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-4 bg-[#2a2a2a]"></div>

                  <button
                    onClick={downloadCode}
                    className="px-3 py-1.5 text-xs font-medium bg-[#212121] hover:bg-[#2a2a2a] text-gray-300 rounded-md transition-all duration-200 shadow-md border border-[#2a2a2a]"
                    title="Download Code"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-4 bg-[#2a2a2a]"></div>

                  <button
                    onClick={updatePreview}
                    className="px-3 py-1.5 text-xs font-medium bg-[#ddf928] hover:bg-[#b9cc21] text-[#1a1a1a] rounded-md transition-all duration-200 shadow-md"
                    title="Update Preview"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </>
              )}

              {activeTab === "preview" && !isEditPanelOpen && (
                <>
                  {/* Contrôles de viewport - garder juste les icônes */}
                  <button
                    onClick={() => setViewportSize("desktop")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                      viewportSize === "desktop"
                        ? "bg-[#ddf928] text-[#1a1a1a] shadow-md font-medium"
                        : "bg-[#212121] text-gray-300 hover:bg-[#2a2a2a]"
                    }`}
                    title="Desktop"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-4 bg-[#2a2a2a]"></div>

                  <button
                    onClick={() => setViewportSize("tablet")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                      viewportSize === "tablet"
                        ? "bg-[#ddf928] text-[#1a1a1a] shadow-md font-medium"
                        : "bg-[#212121] text-gray-300 hover:bg-[#2a2a2a]"
                    }`}
                    title="Tablet"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-4 bg-[#2a2a2a]"></div>

                  <button
                    onClick={() => setViewportSize("mobile")}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                      viewportSize === "mobile"
                        ? "bg-[#ddf928] text-[#1a1a1a] shadow-md font-medium"
                        : "bg-[#212121] text-gray-300 hover:bg-[#2a2a2a]"
                    }`}
                    title="Mobile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-4 bg-[#2a2a2a]"></div>

                  {/* Sélecteur d'éléments */}
                  <button
                    onClick={() => setIsSelectMode(!isSelectMode)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
                      isSelectMode
                        ? "bg-[#ddf928] text-[#1a1a1a] shadow-md font-medium"
                        : "bg-[#212121] text-gray-300 hover:bg-[#2a2a2a]"
                    }`}
                    title={isSelectMode ? "Désactiver le sélecteur" : "Activer le sélecteur d'éléments"}
                  >
                    <svg
                      data-testid="geist-icon"
                      height="16"
                      strokeLinejoin="round"
                      viewBox="0 0 16 16"
                      width="16"
                      className="w-3 h-3"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.5 2V0H7V2H5.5ZM0.96967 2.03033L2.46967 3.53033L3.53033 2.46967L2.03033 0.96967L0.96967 2.03033ZM4.24592 4.24592L4.79515 5.75631L7.79516 14.0063L8.46663 15.8529L9.19636 14.0285L10.2739 11.3346L13.4697 14.5303L14.5303 13.4697L11.3346 10.2739L14.0285 9.19636L15.8529 8.46663L14.0063 7.79516L5.75631 4.79516L4.24592 4.24592ZM11.6471 8.53337L10.1194 9.14447C9.6747 9.32235 9.32235 9.6747 9.14447 10.1194L8.53337 11.6471L6.75408 6.75408L11.6471 8.53337ZM0 7H2V5.5H0V7Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-4 bg-[#2a2a2a]"></div>

                  {/* Bouton plein écran */}
                  <button
                    onClick={toggleFullscreen}
                    className="px-3 py-1.5 text-xs bg-[#212121] text-gray-300 rounded-md hover:bg-[#2a2a2a] transition-all duration-200"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                      />
                    </svg>
                  </button>

                  <div className="w-px h-4 bg-[#2a2a2a]"></div>

                  <button
                    onClick={() => setIsShopifyModalOpen(true)}
                    className="flex items-center gap-2 bg-[#ddf928] hover:bg-[#b9cc21] text-[#1a1a1a] px-3 py-1.5 text-xs rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                    title="Deploy to Shopify"
                  >
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/shopify-logo-png_seeklogo-445424-hdvLD5XG3sBKC1nP4xDp6p5JfKtsbX.png"
                      alt="Shopify"
                      className="w-3 h-3"
                    />
                    <span className="font-medium">Deploy Shopify</span>
                  </button>
                </>
              )}

              {activeTab === "preview" && isEditPanelOpen && (
                <>
                  {/* Indicateur de mode édition */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ddf928]/10 rounded-md border border-[#ddf928]/20">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-[#ddf928]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"
                      />
                    </svg>
                    <span className="text-xs text-[#ddf928] font-medium">Edit Mode</span>
                  </div>

                  <div className="w-px h-4 bg-[#2a2a2a]"></div>
                </>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-grow overflow-hidden h-full">
            {activeTab === "code" ? (
              <div className="h-full p-4">
                <CodeInput
                  value={isGenerating ? streamedCode : editableCode}
                  onChange={handleCodeChange}
                  placeholder="Generated code will appear here..."
                  rows={30}
                  readOnly={isGenerating}
                />
              </div>
            ) : (
              <div className="h-full">
                <PreviewPane
                  htmlContent={editableCode || streamedCode}
                  viewportSize={viewportSize}
                  isFullscreen={isFullscreen}
                  isSelectMode={isSelectMode}
                  onToggleSelectMode={() => setIsSelectMode(!isSelectMode)}
                  onEditPanelChange={setIsEditPanelOpen}
                  onViewportChange={handleViewportChange}
                  onAIRequest={handleAIRequest}
                  key={previewTimestamp}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Shopify */}
      {isShopifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsShopifyModalOpen(false)} />
          <div className="relative w-full max-w-md mx-4">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
              <div className="relative p-6 pb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-[#ddf928]/10 to-transparent" />
                <div className="relative">
                  <button
                    onClick={() => setIsShopifyModalOpen(false)}
                    className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#ddf928] to-[#b9cc21] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <img
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/shopify-logo-png_seeklogo-445424-hdvLD5XG3sBKC1nP4xDp6p5JfKtsbX.png"
                        alt="Shopify"
                        className="w-10 h-10"
                      />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Deploy to Shopify</h2>
                    <p className="text-gray-400">Connect your Shopify store to deploy your theme</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <form onSubmit={handleShopifySubmit} className="space-y-4">
                  <div>
                    <label htmlFor="shopifyDomain" className="block text-sm font-medium text-gray-300 mb-2">
                      Store Domain
                    </label>
                    <input
                      type="text"
                      id="shopifyDomain"
                      value={shopifyDomain}
                      onChange={(e) => setShopifyDomain(e.target.value)}
                      placeholder="your-store.myshopify.com"
                      className="w-full px-4 py-3 bg-[#212121] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#ddf928] focus:border-[#ddf928] transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="shopifyApiKey" className="block text-sm font-medium text-gray-300 mb-2">
                      Private API Key
                    </label>
                    <input
                      type="password"
                      id="shopifyApiKey"
                      value={shopifyApiKey}
                      onChange={(e) => setShopifyApiKey(e.target.value)}
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-[#212121] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#ddf928] focus:border-[#ddf928] transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="bg-[#212121] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">How to get your API key:</h4>
                        <ol className="text-xs text-gray-400 space-y-1">
                          <li>1. Go to your Shopify Admin → Apps → Develop apps</li>
                          <li>2. Create a private app with Theme permissions</li>
                          <li>3. Copy the Admin API access token</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#ddf928] to-[#b9cc21] hover:from-[#b9cc21] hover:to-[#ddf928] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#ddf928]/20"
                  >
                    Connect & Deploy
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">Your credentials are encrypted and stored securely</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsPage
