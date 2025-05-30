import { GoogleGenAI, type GenerateContentResponse, type Part } from "@google/genai"
import { MODEL_TEXT, GEMINI_API_KEY_ENV_VAR } from "../constants"

let ai: GoogleGenAI | null = null

// Utilisez directement la clé API que vous avez fournie
const HARDCODED_API_KEY = "AIzaSyBLKl1rjGxznh516ccPhIhTuBidhs78mgc"

const getAiInstance = (): GoogleGenAI => {
  if (!ai) {
    // Utilisez la clé API codée en dur si aucune variable d'environnement n'est disponible
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || HARDCODED_API_KEY

    if (!apiKey) {
      throw new Error(`Gemini API key (${GEMINI_API_KEY_ENV_VAR}) is not configured.`)
    }

    console.log("Initialisation de l'API Gemini...")
    ai = new GoogleGenAI({ apiKey })
    console.log("API Gemini initialisée avec succès")
  }
  return ai
}

// Fonction pour détecter la langue du texte
const detectLanguage = (text: string): string => {
  const lowerText = text.toLowerCase()

  // Mots clés français
  const frenchKeywords = [
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "du",
    "de",
    "et",
    "ou",
    "mais",
    "donc",
    "car",
    "ni",
    "or",
    "je",
    "tu",
    "il",
    "elle",
    "nous",
    "vous",
    "ils",
    "elles",
    "mon",
    "ma",
    "mes",
    "ton",
    "ta",
    "tes",
    "son",
    "sa",
    "ses",
    "notre",
    "votre",
    "leur",
    "leurs",
    "ce",
    "cette",
    "ces",
    "cet",
    "bonjour",
    "salut",
    "merci",
    "oui",
    "non",
    "peut",
    "faire",
    "avoir",
    "être",
    "aller",
    "vouloir",
    "pouvoir",
    "devoir",
    "savoir",
    "voir",
    "dire",
    "prendre",
    "donner",
    "mettre",
    "modifie",
    "change",
    "ajoute",
    "supprime",
    "couleur",
    "texte",
    "bouton",
    "page",
  ]

  // Mots clés anglais
  const englishKeywords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "so",
    "because",
    "if",
    "when",
    "where",
    "what",
    "how",
    "i",
    "you",
    "he",
    "she",
    "we",
    "they",
    "my",
    "your",
    "his",
    "her",
    "our",
    "their",
    "this",
    "that",
    "these",
    "those",
    "hello",
    "hi",
    "thanks",
    "thank",
    "yes",
    "no",
    "can",
    "could",
    "would",
    "should",
    "will",
    "shall",
    "may",
    "might",
    "must",
    "make",
    "create",
    "build",
    "add",
    "remove",
    "change",
    "modify",
    "update",
    "color",
    "text",
    "button",
    "page",
  ]

  // Mots clés espagnols
  const spanishKeywords = [
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "y",
    "o",
    "pero",
    "porque",
    "si",
    "cuando",
    "yo",
    "tú",
    "él",
    "ella",
    "nosotros",
    "vosotros",
    "ellos",
    "ellas",
    "mi",
    "tu",
    "su",
    "nuestro",
    "hola",
    "gracias",
    "sí",
    "no",
    "puede",
    "hacer",
    "tener",
    "ser",
    "estar",
    "ir",
    "modificar",
    "cambiar",
    "añadir",
    "eliminar",
    "color",
    "texto",
    "botón",
    "página",
  ]

  const words = lowerText.split(/\s+/)
  let frenchScore = 0
  let englishScore = 0
  let spanishScore = 0

  words.forEach((word) => {
    if (frenchKeywords.includes(word)) frenchScore++
    if (englishKeywords.includes(word)) englishScore++
    if (spanishKeywords.includes(word)) spanishScore++
  })

  // Retourner la langue avec le score le plus élevé
  if (frenchScore > englishScore && frenchScore > spanishScore) {
    return "fr"
  } else if (spanishScore > englishScore && spanishScore > frenchScore) {
    return "es"
  } else {
    return "en" // Par défaut anglais
  }
}

// Fonction pour obtenir les messages de réponse selon la langue
const getResponseMessages = (language: string, isModification = false) => {
  const messages = {
    fr: {
      codeGenerated: isModification
        ? "J'ai modifié le code selon votre demande."
        : "Voici le code généré selon votre demande. Vous pouvez le modifier ou me demander des ajustements.",
      timeout: "Désolé, la génération a pris trop de temps. Veuillez réessayer ou reformuler votre demande.",
      error: "Désolé, une erreur s'est produite lors de la génération:",
      imageAnalysis: "Voici une image à analyser:",
    },
    en: {
      codeGenerated: isModification
        ? "I've modified the code according to your request."
        : "Here's the generated code according to your request. You can modify it or ask me for adjustments.",
      timeout: "Sorry, the generation took too long. Please try again or rephrase your request.",
      error: "Sorry, an error occurred during generation:",
      imageAnalysis: "Here's an image to analyze:",
    },
    es: {
      codeGenerated: isModification
        ? "He modificado el código según tu solicitud."
        : "Aquí está el código generado según tu solicitud. Puedes modificarlo o pedirme ajustes.",
      timeout: "Lo siento, la generación tardó demasiado. Por favor, inténtalo de nuevo o reformula tu solicitud.",
      error: "Lo siento, ocurrió un error durante la generación:",
      imageAnalysis: "Aquí hay una imagen para analizar:",
    },
  }

  return messages[language as keyof typeof messages] || messages.en
}

const cleanGeneratedCode = (text: string): string => {
  let cleanedText = text.trim()
  const fenceRegex = /^```(\w*html)?\s*\n?(.*?)\n?\s*```$/s
  const match = cleanedText.match(fenceRegex)
  if (match && match[2]) {
    cleanedText = match[2].trim()
  }
  // Sometimes the response might still include "HTML Code:" or similar preamble
  cleanedText = cleanedText.replace(/^Generated HTML Code:\s*/i, "")
  return cleanedText
}

// Fonction pour détecter si c'est une petite modification
const isSmallModification = (userPrompt: string, existingCode: string): boolean => {
  if (!existingCode) return false

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

  const lowerPrompt = userPrompt.toLowerCase()
  return smallModKeywords.some((keyword) => lowerPrompt.includes(keyword))
}

export const generateCodeFromPrompt = async (
  userPrompt: string,
  existingCode = "",
  conversationHistory: Array<{ role: string; content: string }> = [],
): Promise<string> => {
  try {
    console.log("🚀 Début de la génération - timestamp:", Date.now())
    console.log("Génération de code à partir du prompt:", userPrompt.substring(0, 50) + "...")
    const genAI = getAiInstance()

    // Détecter la langue du prompt utilisateur
    const detectedLanguage = detectLanguage(userPrompt)
    console.log("Langue détectée:", detectedLanguage)

    // Construire le contexte de la conversation
    let contextPrompt = ""
    if (conversationHistory.length > 0) {
      contextPrompt = "Previous conversation:\n"
      conversationHistory.forEach((msg) => {
        contextPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`
      })
      contextPrompt += "\n"
    }

    // Détecter si c'est une petite modification
    const isSmallMod = isSmallModification(userPrompt, existingCode)

    // Ajouter le code existant au contexte si disponible
    let codeContext = ""
    if (existingCode) {
      if (isSmallMod) {
        // Pour les petites modifications, être très spécifique
        codeContext = `
IMPORTANT: This is a SMALL MODIFICATION request. DO NOT rewrite the entire code.
Only make the specific change requested and return the COMPLETE modified HTML code.

Current HTML code:
\`\`\`html
${existingCode}
\`\`\`

Please make ONLY the specific modification requested: "${userPrompt}"
Return the complete HTML code with just this change applied.
`
      } else {
        // Pour les gros changements
        codeContext = `
Current HTML code:
\`\`\`html
${existingCode}
\`\`\`

Please modify the above code according to the user's request. Return the complete modified HTML code.
`
      }
    }

    // Instructions de langue selon la langue détectée
    const languageInstructions = {
      fr: "IMPORTANT: Répondez UNIQUEMENT en français. Tous vos commentaires et explications doivent être en français.",
      en: "IMPORTANT: Respond ONLY in English. All your comments and explanations must be in English.",
      es: "IMPORTANT: Responde ÚNICAMENTE en español. Todos tus comentarios y explicaciones deben estar en español.",
    }

    const prompt = `You are an expert web developer specialized in creating BEAUTIFUL, MODERN designs. 

${languageInstructions[detectedLanguage as keyof typeof languageInstructions] || languageInstructions.en}

CRITICAL REQUIREMENTS:
- Generate ONLY HTML code with embedded CSS
- NO explanations, NO text descriptions, NO comments
- Create BEAUTIFUL, MODERN, PROFESSIONAL designs
- Use attractive color schemes, gradients, shadows, animations
- Make it visually stunning and responsive
- Include modern UI elements (cards, buttons, hover effects)
- Use Google Fonts for typography
- Add CSS animations and transitions

SHOPIFY COMPATIBILITY:
- Use Liquid template syntax when appropriate ({{ }}, {% %})
- Ensure Shopify theme compatibility
- Follow Shopify design patterns

${contextPrompt}
${codeContext}

USER REQUEST: ${userPrompt}

Generate ONLY beautiful HTML/CSS code:`

    console.log("Envoi de la requête à l'API Gemini...")
    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    })

    console.log("Réponse reçue de l'API Gemini")
    const cleanedCode = cleanGeneratedCode(response.text)
    console.log("✅ Génération terminée - timestamp:", Date.now())
    return cleanedCode
  } catch (error) {
    console.error("Erreur lors de la génération:", error)

    // Vérifier si c'est spécifiquement une erreur 429 (rate limit)
    if (error instanceof Error && error.message.includes("429") && error.message.includes("rate")) {
      throw new Error("Trop de requêtes. Veuillez patienter quelques secondes et réessayer.")
    }

    // Pour les erreurs de contenu trop long, message spécifique
    if (
      error instanceof Error &&
      (error.message.includes("too long") ||
        error.message.includes("too large") ||
        error.message.includes("content length") ||
        error.message.includes("INVALID_ARGUMENT"))
    ) {
      throw new Error("Le message est trop long. Veuillez raccourcir votre demande et réessayer.")
    }

    // Pour toutes les autres erreurs, message générique
    throw new Error("Une erreur s'est produite lors de la génération. Veuillez réessayer.")
  }
}

export const generateCodeFromImage = async (
  base64Image: string,
  mimeType: string,
  userInstruction: string,
  existingCode = "",
): Promise<string> => {
  try {
    console.log("🚀 Début de la génération - timestamp:", Date.now())
    console.log("Génération de code à partir de l'image avec instruction:", userInstruction.substring(0, 50) + "...")
    console.log("Type MIME de l'image:", mimeType)
    console.log("Taille de l'image base64:", base64Image.length, "caractères")

    const genAI = getAiInstance()

    // Détecter la langue de l'instruction utilisateur
    const detectedLanguage = detectLanguage(userInstruction)
    console.log("Langue détectée:", detectedLanguage)

    // Valider l'image base64
    if (!base64Image || base64Image.length === 0) {
      throw new Error("Image base64 vide ou invalide")
    }

    // Nettoyer le base64 si nécessaire
    let cleanBase64 = base64Image
    if (base64Image.includes(",")) {
      cleanBase64 = base64Image.split(",")[1]
    }

    console.log("Image base64 nettoyée, taille:", cleanBase64.length)

    const imagePart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    }

    console.log("ImagePart créé:", { mimeType, dataLength: cleanBase64.length })

    // Détecter si c'est une petite modification
    const isSmallMod = isSmallModification(userInstruction, existingCode)

    // Ajouter le code existant au contexte si disponible
    let codeContext = ""
    if (existingCode) {
      if (isSmallMod) {
        codeContext = `
IMPORTANT: This is a SMALL MODIFICATION request. DO NOT rewrite the entire code.
Only make the specific change requested and return the COMPLETE modified HTML code.

Current HTML code:
\`\`\`html
${existingCode}
\`\`\`

Please make ONLY the specific modification requested based on the image and instructions.
Return the complete HTML code with just this change applied.
`
      } else {
        codeContext = `
Current HTML code:
\`\`\`html
${existingCode}
\`\`\`

Please modify the above code according to the user's request. Return the complete modified HTML code.
`
      }
    }

    // Instructions de langue selon la langue détectée
    const languageInstructions = {
      fr: "IMPORTANT: Répondez UNIQUEMENT en français. Tous vos commentaires et explications doivent être en français.",
      en: "IMPORTANT: Respond ONLY in English. All your comments and explanations must be in English.",
      es: "IMPORTANT: Responde ÚNICAMENTE en español. Todos tus comentarios y explicaciones deben estar en español.",
    }

    const textPart: Part = {
      text: `You are an expert web developer. Create a BEAUTIFUL, PIXEL-PERFECT Shopify-compatible HTML/CSS design from this image.

${languageInstructions[detectedLanguage as keyof typeof languageInstructions] || languageInstructions.en}

CRITICAL REQUIREMENTS:
- Output ONLY HTML code with embedded CSS
- NO explanations, NO descriptions, NO comments
- Create STUNNING visual designs with modern aesthetics
- Match the image exactly but make it more beautiful
- Use attractive gradients, shadows, animations
- Extract exact colors and fonts from the image
- Add hover effects and smooth transitions
- Make it responsive and interactive

${codeContext}

SHOPIFY REQUIREMENTS:
- Use Liquid syntax where appropriate
- Ensure Shopify theme compatibility
- Follow Shopify design standards

User instruction: ${userInstruction}

Generate ONLY beautiful Shopify-compatible HTML/CSS code:`,
    }

    const optimizedPrompt = {
      parts: [imagePart, textPart],
    }

    console.log("Envoi de la requête à l'API Gemini (mode multimodal)...")
    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: MODEL_TEXT,
      contents: optimizedPrompt,
    })

    console.log("Réponse reçue de l'API Gemini")
    const cleanedCode = cleanGeneratedCode(response.text)
    console.log("✅ Génération terminée - timestamp:", Date.now())
    return cleanedCode
  } catch (error) {
    console.error("Erreur lors de la génération:", error)

    // Vérifier si c'est spécifiquement une erreur 429 (rate limit)
    if (error instanceof Error && error.message.includes("429") && error.message.includes("rate")) {
      throw new Error("Trop de requêtes. Veuillez patienter quelques secondes et réessayer.")
    }

    // Pour les erreurs de contenu trop long, message spécifique
    if (
      error instanceof Error &&
      (error.message.includes("too long") ||
        error.message.includes("too large") ||
        error.message.includes("content length") ||
        error.message.includes("INVALID_ARGUMENT"))
    ) {
      throw new Error("Le message est trop long. Veuillez raccourcir votre demande et réessayer.")
    }

    // Pour toutes les autres erreurs, message générique
    throw new Error("Une erreur s'est produite lors de la génération. Veuillez réessayer.")
  }
}

export const generateCodeFromCode = async (
  existingCode: string,
  userInstruction: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
): Promise<string> => {
  try {
    console.log("🚀 Début de la génération - timestamp:", Date.now())
    console.log(
      "Génération de code à partir du code existant avec instruction:",
      userInstruction.substring(0, 50) + "...",
    )
    const genAI = getAiInstance()

    // Détecter la langue de l'instruction utilisateur
    const detectedLanguage = detectLanguage(userInstruction)
    console.log("Langue détectée:", detectedLanguage)

    // Construire le contexte de la conversation
    let contextPrompt = ""
    if (conversationHistory.length > 0) {
      contextPrompt = "Previous conversation:\n"
      conversationHistory.forEach((msg) => {
        contextPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`
      })
      contextPrompt += "\n"
    }

    // Détecter si c'est une petite modification
    const isSmallMod = isSmallModification(userInstruction, existingCode)

    // Instructions de langue selon la langue détectée
    const languageInstructions = {
      fr: "IMPORTANT: Répondez UNIQUEMENT en français. Tous vos commentaires et explications doivent être en français.",
      en: "IMPORTANT: Respond ONLY in English. All your comments and explanations must be in English.",
      es: "IMPORTANT: Responde ÚNICAMENTE en español. Todos tus comentarios y explicaciones deben estar en español.",
    }

    const prompt = `You are an expert web developer. Modify this code to create a BEAUTIFUL, MODERN Shopify-compatible design.

${languageInstructions[detectedLanguage as keyof typeof languageInstructions] || languageInstructions.en}

CRITICAL REQUIREMENTS:
- Output ONLY modified HTML code with embedded CSS
- NO explanations, NO descriptions, NO comments
- Make the design STUNNING and MODERN
- Add beautiful colors, gradients, shadows
- Include smooth animations and hover effects
- Use modern typography and spacing
- Make it responsive and interactive

${contextPrompt}

SHOPIFY REQUIREMENTS:
- Maintain/add Liquid template syntax
- Ensure Shopify theme compatibility
- Follow modern Shopify design patterns

${isSmallMod ? "Make ONLY the requested change while keeping the design beautiful." : "Enhance the entire design while making the requested modifications."}

Current Code:
${existingCode}

User Instruction: ${userInstruction}

Generate ONLY beautiful Shopify-compatible HTML/CSS code:`

    console.log("Envoi de la requête à l'API Gemini...")
    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    })

    console.log("Réponse reçue de l'API Gemini")
    const cleanedCode = cleanGeneratedCode(response.text)
    console.log("✅ Génération terminée - timestamp:", Date.now())
    return cleanedCode
  } catch (error) {
    console.error("Erreur lors de la génération:", error)

    // Vérifier si c'est spécifiquement une erreur 429 (rate limit)
    if (error instanceof Error && error.message.includes("429") && error.message.includes("rate")) {
      throw new Error("Trop de requêtes. Veuillez patienter quelques secondes et réessayer.")
    }

    // Pour les erreurs de contenu trop long, message spécifique
    if (
      error instanceof Error &&
      (error.message.includes("too long") ||
        error.message.includes("too large") ||
        error.message.includes("content length") ||
        error.message.includes("INVALID_ARGUMENT"))
    ) {
      throw new Error("Le message est trop long. Veuillez raccourcir votre demande et réessayer.")
    }

    // Pour toutes les autres erreurs, message générique
    throw new Error("Une erreur s'est produite lors de la génération. Veuillez réessayer.")
  }
}

// Exporter la fonction de détection de langue et les messages pour utilisation dans d'autres composants
export { detectLanguage, getResponseMessages }
