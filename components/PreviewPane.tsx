"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface PreviewPaneProps {
  htmlContent: string
  viewportSize: "desktop" | "tablet" | "mobile"
  isFullscreen: boolean
  isSelectMode: boolean
  onToggleSelectMode: () => void
  onEditPanelChange?: (isOpen: boolean) => void
  onViewportChange?: (size: "desktop" | "tablet" | "mobile") => void
  onAIRequest?: (message: string, imageFile?: File) => void
}

interface SelectedElementInfo {
  tagName: string
  className: string
  textContent: string
  outerHTML: string
  element: Element
}

const PreviewPane: React.FC<PreviewPaneProps> = ({
  htmlContent,
  viewportSize,
  isFullscreen,
  isSelectMode,
  onToggleSelectMode,
  onEditPanelChange,
  onViewportChange,
  onAIRequest,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null)
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null)

  // Ajouter un état pour l'édition inline
  const [isInlineEditing, setIsInlineEditing] = useState(false)
  const [editingElement, setEditingElement] = useState<Element | null>(null)

  // États pour la gestion des images
  const [isImageSectionOpen, setIsImageSectionOpen] = useState(false)
  const [detectedImages, setDetectedImages] = useState<
    Array<{
      element: HTMLImageElement
      src: string
      alt: string
      index: number
    }>
  >([])
  const [selectedImageToReplace, setSelectedImageToReplace] = useState<number | null>(null)
  const [imageReplaceMethod, setImageReplaceMethod] = useState<"upload" | "unsplash" | "url" | null>(null)
  const [newImageUrl, setNewImageUrl] = useState("")

  const [selectedImageForResize, setSelectedImageForResize] = useState<number | null>(null)
  const [imageWidth, setImageWidth] = useState("")
  const [imageHeight, setImageHeight] = useState("")

  // État pour le textarea AI
  const [aiPrompt, setAiPrompt] = useState("")
  const [applyOnlyToSection, setApplyOnlyToSection] = useState(true)
  const [selectedAIImage, setSelectedAIImage] = useState<File | null>(null)
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null)

  // États pour les dimensions
  const [isDimensionsSectionOpen, setIsDimensionsSectionOpen] = useState(false)
  const [elementWidth, setElementWidth] = useState("")
  const [elementHeight, setElementHeight] = useState("")

  // États pour la typographie
  const [isTypographySectionOpen, setIsTypographySectionOpen] = useState(false)
  const [fontSize, setFontSize] = useState("")
  const [fontWeight, setFontWeight] = useState("normal")
  const [fontStyle, setFontStyle] = useState("normal")
  const [textAlign, setTextAlign] = useState("left")
  const [textDecoration, setTextDecoration] = useState("none")
  const [lineHeight, setLineHeight] = useState("")
  const [letterSpacing, setLetterSpacing] = useState("")

  // États pour les couleurs
  const [isColorsSectionOpen, setIsColorsSectionOpen] = useState(false)
  const [textColor, setTextColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#f9fafb")
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false)

  const getViewportDimensions = () => {
    // VRAIES tailles selon viewport - même en mode édition !
    switch (viewportSize) {
      case "mobile":
        return { width: "375px", height: "667px" }
      case "tablet":
        return { width: "768px", height: "1024px" }
      default:
        return {
          width: isEditPanelOpen ? "calc(100vw - 320px - 32px)" : "100%",
          height: "100%",
        }
    }
  }

  const dimensions = getViewportDimensions()

  const openEditPanel = (elementInfo: SelectedElementInfo) => {
    setSelectedElement(elementInfo)
    setIsEditPanelOpen(true)
    onEditPanelChange?.(true)
  }

  const closeEditPanel = () => {
    // Sauvegarder les modifications dans le DOM principal ET les propager
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        // Nettoyer les classes de sélection avant de récupérer le HTML
        doc.querySelectorAll(".codro-selectable, .codro-selected, .codro-hover").forEach((el) => {
          el.classList.remove("codro-selectable", "codro-selected", "codro-hover")
        })

        // Récupérer le HTML modifié de l'iframe
        const updatedHTML = doc.documentElement.outerHTML

        // Déclencher un événement personnalisé pour notifier le parent des changements
        window.dispatchEvent(
          new CustomEvent("previewUpdated", {
            detail: { htmlContent: updatedHTML },
          }),
        )
      }
    }

    setIsEditPanelOpen(false)
    setSelectedElement(null)
    setIsImageSectionOpen(false)
    setDetectedImages([])
    setSelectedImageToReplace(null)
    setImageReplaceMethod(null)
    setAiPrompt("") // Reset du prompt AI
    setSelectedAIImage(null) // Reset de l'image AI
    setAiImagePreview(null) // Reset du preview AI
    onEditPanelChange?.(false)
  }

  const handleAIImageSelect = () => {
    fileInputRef.current?.click()
  }

  const handleAIImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedAIImage(file)

      // Créer un preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAiImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }

    // Reset l'input pour permettre de sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAIImage = () => {
    setSelectedAIImage(null)
    setAiImagePreview(null)
  }

  const handleAISubmit = () => {
    if ((aiPrompt.trim() || selectedAIImage) && onAIRequest) {
      let fullPrompt = aiPrompt.trim()

      // Si "Apply only to this section" est coché, ajouter le contexte de l'élément sélectionné
      if (applyOnlyToSection && selectedElement) {
        fullPrompt = `For the selected <${selectedElement.tagName}> element${
          selectedElement.className ? ` with class "${selectedElement.className}"` : ""
        }: ${fullPrompt}`
      }

      // Si pas de texte mais une image, utiliser un prompt par défaut
      if (!fullPrompt && selectedAIImage) {
        fullPrompt =
          applyOnlyToSection && selectedElement
            ? `Analyze this image and modify the selected <${selectedElement.tagName}> element accordingly`
            : "Analyze this image and modify the code accordingly"
      }

      // Envoyer la demande au chat avec l'image si présente
      onAIRequest(fullPrompt, selectedAIImage || undefined)

      // Reset du prompt et de l'image
      setAiPrompt("")
      setSelectedAIImage(null)
      setAiImagePreview(null)

      // Déclencher l'ouverture de l'onglet Code
      window.dispatchEvent(new CustomEvent("switchToCodeTab"))
    }
  }

  const handleViewportChange = (size: "desktop" | "tablet" | "mobile") => {
    onViewportChange?.(size)
    // NE PAS fermer le panneau d'édition ou perdre la sélection
    // Juste forcer le refresh du preview avec la nouvelle taille
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        // Re-appliquer les styles et la sélection
        const currentSelected = doc.querySelector(".codro-selected")
        if (currentSelected && selectedElement) {
          // Garder la sélection active
          setTimeout(() => {
            currentSelected.classList.add("codro-selected")
          }, 100)
        }
      }
    }
  }

  const detectImagesInSelection = () => {
    if (!selectedElement?.element) return []

    const images = selectedElement.element.querySelectorAll("img")
    const imageList: Array<{
      element: HTMLImageElement
      src: string
      alt: string
      index: number
    }> = []

    images.forEach((img, index) => {
      imageList.push({
        element: img as HTMLImageElement,
        src: img.src || img.getAttribute("src") || "",
        alt: img.alt || `Image ${index + 1}`,
        index,
      })
    })

    return imageList
  }

  const handleImageSectionToggle = () => {
    setIsImageSectionOpen(!isImageSectionOpen)
    if (!isImageSectionOpen) {
      // Détecter les images quand on ouvre la section
      const images = detectImagesInSelection()
      setDetectedImages(images)
      // Reset tous les états
      setSelectedImageToReplace(null)
      setImageReplaceMethod(null)
      setNewImageUrl("")
    }
  }

  const handleImageReplace = (imageIndex: number, newSrc: string) => {
    if (detectedImages[imageIndex]) {
      const imgElement = detectedImages[imageIndex].element
      imgElement.src = newSrc

      // Mettre à jour la liste des images détectées
      const updatedImages = [...detectedImages]
      updatedImages[imageIndex].src = newSrc
      setDetectedImages(updatedImages)

      // Réinitialiser les états
      setSelectedImageToReplace(null)
      setImageReplaceMethod(null)
      setNewImageUrl("")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && selectedImageToReplace !== null) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        handleImageReplace(selectedImageToReplace, result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlSubmit = () => {
    if (newImageUrl && selectedImageToReplace !== null) {
      handleImageReplace(selectedImageToReplace, newImageUrl)
    }
  }

  const addNewImage = (src: string) => {
    if (!selectedElement?.element) return

    const img = document.createElement("img")
    img.src = src
    img.alt = "New image"

    // Adapter l'image au conteneur parent
    img.style.width = "100%"
    img.style.height = "auto"
    img.style.maxWidth = "100%"
    img.style.objectFit = "cover"
    img.style.display = "block"

    selectedElement.element.appendChild(img)

    // Rafraîchir la liste des images
    const images = detectImagesInSelection()
    setDetectedImages(images)
  }

  const handleDimensionsToggle = () => {
    setIsDimensionsSectionOpen(!isDimensionsSectionOpen)
    if (!isDimensionsSectionOpen && selectedElement?.element) {
      // Récupérer les dimensions actuelles
      const computedStyle = window.getComputedStyle(selectedElement.element)
      setElementWidth(selectedElement.element.offsetWidth.toString())
      setElementHeight(selectedElement.element.offsetHeight.toString())
    }
  }

  const handleTypographyToggle = () => {
    setIsTypographySectionOpen(!isTypographySectionOpen)
    if (!isTypographySectionOpen && selectedElement?.element) {
      // Récupérer les styles typographiques actuels
      const computedStyle = window.getComputedStyle(selectedElement.element)
      setFontSize(Number.parseInt(computedStyle.fontSize).toString())
      setFontWeight(computedStyle.fontWeight)
      setFontStyle(computedStyle.fontStyle)
      setTextAlign(computedStyle.textAlign)
      setTextDecoration(computedStyle.textDecoration)
      setLineHeight(computedStyle.lineHeight === "normal" ? "" : Number.parseInt(computedStyle.lineHeight).toString())
      setLetterSpacing(
        computedStyle.letterSpacing === "normal" ? "" : Number.parseInt(computedStyle.letterSpacing).toString(),
      )
    }
  }

  const handleColorsToggle = () => {
    setIsColorsSectionOpen(!isColorsSectionOpen)
    if (!isColorsSectionOpen && selectedElement?.element) {
      // Récupérer les couleurs actuelles
      const computedStyle = window.getComputedStyle(selectedElement.element)
      const currentTextColor = computedStyle.color
      const currentBgColor = computedStyle.backgroundColor

      // Convertir en hex si possible
      if (currentTextColor.startsWith("rgb")) {
        setTextColor(rgbToHex(currentTextColor))
      }
      if (currentBgColor.startsWith("rgb")) {
        setBackgroundColor(rgbToHex(currentBgColor))
      }
    }
  }

  // Fonction utilitaire pour convertir RGB en HEX
  const rgbToHex = (rgb: string): string => {
    const result = rgb.match(/\d+/g)
    if (result && result.length >= 3) {
      const r = Number.parseInt(result[0])
      const g = Number.parseInt(result[1])
      const b = Number.parseInt(result[2])
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    }
    return "#000000"
  }

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document

      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()

        // TOUJOURS ajouter les styles de base pour un rendu correct
        const baseStyle = doc.createElement("style")
        baseStyle.textContent = `
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
        }
      `
        doc.head.appendChild(baseStyle)

        // Ajouter les styles de sélection seulement si le mode sélection est actif
        if (isSelectMode) {
          const selectStyle = doc.createElement("style")
          selectStyle.textContent = `
          .codro-selectable {
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }
          .codro-hover {
            outline: 2px solid #ddf928 !important;
            outline-offset: 2px !important;
          }
          .codro-selected {
            outline: 3px solid #ddf928 !important;
            outline-offset: 2px !important;
            /* Supprimer cette ligne : background-color: rgba(221, 249, 40, 0.1) !important; */
          }
        `
          doc.head.appendChild(selectStyle)

          // Event listeners pour la sélection
          const addSelectListeners = (element: Element) => {
            // Ignorer certains éléments (html, body, head, etc.)
            if (["html", "head", "body", "script", "style", "meta", "title"].includes(element.tagName.toLowerCase())) {
              return
            }

            element.classList.add("codro-selectable")

            // Hover effect - UN SEUL élément à la fois
            element.addEventListener("mouseenter", (e) => {
              e.stopPropagation()
              // Supprimer le hover précédent
              if (hoveredElement && hoveredElement !== element) {
                hoveredElement.classList.remove("codro-hover")
              }
              element.classList.add("codro-hover")
              setHoveredElement(element)
            })

            element.addEventListener("mouseleave", (e) => {
              e.stopPropagation()
              element.classList.remove("codro-hover")
              if (hoveredElement === element) {
                setHoveredElement(null)
              }
            })

            element.addEventListener("click", (e) => {
              e.preventDefault()
              e.stopPropagation()

              // Supprimer TOUTES les sélections précédentes
              doc.querySelectorAll(".codro-selected").forEach((el) => {
                el.classList.remove("codro-selected")
              })

              // Supprimer les hovers
              doc.querySelectorAll(".codro-hover").forEach((el) => {
                el.classList.remove("codro-hover")
              })

              // Ajouter la nouvelle sélection UNIQUEMENT à cet élément
              element.classList.add("codro-selected")

              // Créer les infos de l'élément sélectionné
              const elementInfo: SelectedElementInfo = {
                tagName: element.tagName.toLowerCase(),
                className: element.className || "",
                textContent: element.textContent?.slice(0, 100) || "",
                outerHTML: element.outerHTML.slice(0, 200) + "...",
                element: element,
              }

              openEditPanel(elementInfo)
            })

            element.addEventListener("dblclick", (e) => {
              e.preventDefault()
              e.stopPropagation()

              // Vérifier si l'élément contient du texte éditable
              if (element.textContent && element.textContent.trim()) {
                setIsInlineEditing(true)
                setEditingElement(element)

                // Créer un input temporaire pour l'édition
                const originalText = element.textContent
                const input = doc.createElement("input")
                input.type = "text"
                input.value = originalText

                // Copier EXACTEMENT les styles de l'élément original sans les modifier
                const computedStyle = doc.defaultView?.getComputedStyle(element)
                if (computedStyle) {
                  // Copier tous les styles SANS les modifier
                  input.style.cssText = `
                    width: ${element.offsetWidth}px !important;
                    height: ${element.offsetHeight}px !important;
                    background: transparent !important;
                    border: 1px solid #ddf928 !important;
                    padding: ${computedStyle.padding} !important;
                    margin: ${computedStyle.margin} !important;
                    font-family: ${computedStyle.fontFamily} !important;
                    font-size: ${computedStyle.fontSize} !important;
                    font-weight: ${computedStyle.fontWeight} !important;
                    color: ${computedStyle.color} !important;
                    text-align: ${computedStyle.textAlign} !important;
                    line-height: ${computedStyle.lineHeight} !important;
                    letter-spacing: ${computedStyle.letterSpacing} !important;
                    text-decoration: ${computedStyle.textDecoration} !important;
                    text-transform: ${computedStyle.textTransform} !important;
                    display: ${computedStyle.display} !important;
                    position: absolute !important;
                    top: ${element.offsetTop}px !important;
                    left: ${element.offsetLeft}px !important;
                    z-index: 9999 !important;
                    box-sizing: border-box !important;
                    outline: none !important;
                  `
                }

                // Masquer temporairement l'élément original
                const originalVisibility = element.style.visibility
                element.style.visibility = "hidden"

                // Ajouter l'input au document
                doc.body.appendChild(input)
                input.focus()
                input.select()

                // Gérer la validation/annulation
                const finishEditing = (save: boolean) => {
                  if (save) {
                    element.textContent = input.value
                  }
                  element.style.visibility = originalVisibility
                  doc.body.removeChild(input)
                  setIsInlineEditing(false)
                  setEditingElement(null)
                }

                input.addEventListener("blur", () => finishEditing(true))
                input.addEventListener("keydown", (e) => {
                  if (e.key === "Enter") {
                    finishEditing(true)
                  } else if (e.key === "Escape") {
                    finishEditing(false)
                  }
                })
              }
            })
          }

          // Appliquer aux éléments sélectionnables (sauf les éléments système)
          const selectableElements = doc.querySelectorAll("*")
          selectableElements.forEach(addSelectListeners)
        } else {
          // Nettoyer les classes de sélection
          doc.querySelectorAll(".codro-selectable, .codro-selected, .codro-hover").forEach((el) => {
            el.classList.remove("codro-selectable", "codro-selected", "codro-hover")
          })
          setSelectedElement(null)
          setIsEditPanelOpen(false)
          setHoveredElement(null)
        }
      }
    }
  }, [htmlContent, isSelectMode])

  // Effet pour rafraîchir la section Image quand on change de sélection
  useEffect(() => {
    if (isImageSectionOpen && selectedElement) {
      // Rafraîchir automatiquement les images détectées
      const images = detectImagesInSelection()
      setDetectedImages(images)
      // Reset les états de sélection
      setSelectedImageToReplace(null)
      setImageReplaceMethod(null)
      setNewImageUrl("")
    }
  }, [selectedElement, isImageSectionOpen])

  // Gestion du fullscreen avec une overlay complète
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white">
        {/* Bouton de fermeture - croix en haut à droite */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("exitFullscreen"))
            // Forcer le refresh après la sortie du fullscreen
            setTimeout(() => {
              if (iframeRef.current) {
                const iframe = iframeRef.current
                const doc = iframe.contentDocument || iframe.contentWindow?.document
                if (doc) {
                  doc.open()
                  doc.write(htmlContent)
                  doc.close()
                }
              }
            }, 100)
          }}
          className="fixed top-4 right-4 z-[10000] w-12 h-12 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
          title="Fermer le plein écran"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Iframe en plein écran avec le contenu HTML */}
        <iframe
          className="w-full h-full border-0"
          title="Preview Fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          srcDoc={htmlContent}
        />
      </div>
    )
  }

  return (
    <div className="h-full bg-[#1a1a1a] flex items-center justify-center p-4 relative">
      {/* Header avec contrôles viewport quand le panneau d'édition est ouvert */}
      {isEditPanelOpen && (
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-[#212121] rounded-lg p-2 shadow-lg border border-[#2a2a2a]">
          <button
            onClick={() => handleViewportChange("desktop")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
              viewportSize === "desktop"
                ? "bg-[#ddf928] text-[#1a1a1a] shadow-md font-medium"
                : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
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

          <button
            onClick={() => handleViewportChange("tablet")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
              viewportSize === "tablet"
                ? "bg-[#ddf928] text-[#1a1a1a] shadow-md font-medium"
                : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
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

          <button
            onClick={() => handleViewportChange("mobile")}
            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
              viewportSize === "mobile"
                ? "bg-[#ddf928] text-[#1a1a1a] shadow-md font-medium"
                : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
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
        </div>
      )}

      <div
        className="bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          maxWidth: isEditPanelOpen ? "calc(100vw - 320px - 32px)" : "100%",
          maxHeight: "100%",
        }}
      >
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>

      {/* Input caché pour les images AI */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAIImageChange} className="hidden" />

      {/* Panneau d'édition qui slide depuis la droite */}
      {isEditPanelOpen && selectedElement && (
        <div className="fixed inset-y-0 right-0 w-80 bg-[#171717] border-l border-[#404040] shadow-2xl z-50 flex flex-col">
          {/* Header du panneau avec logo */}
          <div className="flex items-center justify-between p-4 border-b border-[#404040] bg-gradient-to-r from-[#171717] to-[rgba(23,23,23,0.95)]">
            <div className="flex items-center justify-center flex-1">
              <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg">
                <img src="/images/new-logo.png" alt="Codro Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <button onClick={closeEditPanel} className="p-1 hover:bg-[#2a2a2a] rounded transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Zone de texte pour l'IA */}
            <div className="p-4">
              <div className="flex flex-col gap-3 relative">
                {/* Preview de l'image AI si sélectionnée */}
                {aiImagePreview && (
                  <div className="relative bg-[#262626]/40 border border-[#ddf928] rounded-md p-2 mb-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={aiImagePreview || "/placeholder.svg"}
                        alt="AI Analysis"
                        className="w-12 h-12 object-cover rounded border border-[#404040]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{selectedAIImage?.name}</p>
                        <p className="text-xs text-[#ddf928]">Image for AI analysis</p>
                      </div>
                      <button
                        onClick={removeAIImage}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full min-h-[110px] bg-[#262626]/40 border border-[#ddf928] rounded-md p-4 pr-16 text-sm font-medium text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50 transition-all"
                  placeholder="Describe changes you want to make..."
                />

                <div className="h-px bg-[#404040] my-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAIImageSelect}
                      className="w-8 h-8 bg-[#404040]/60 rounded-full flex items-center justify-center hover:bg-[#404040] transition-colors"
                      title="Add image for AI analysis"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </button>
                    <button className="w-8 h-8 bg-[#404040]/60 rounded-full flex items-center justify-center opacity-50 cursor-not-allowed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setApplyOnlyToSection(!applyOnlyToSection)}
                      className={`w-4 h-4 border border-gray-500 rounded ${applyOnlyToSection ? "bg-[#ddf928] border-[#ddf928]" : ""}`}
                    >
                      {applyOnlyToSection && (
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <label
                      className="text-xs font-medium text-gray-300 cursor-pointer"
                      onClick={() => setApplyOnlyToSection(!applyOnlyToSection)}
                    >
                      Apply only for this section
                    </label>
                  </div>
                  <button
                    onClick={handleAISubmit}
                    disabled={!aiPrompt.trim() && !selectedAIImage}
                    className="flex items-center gap-1.5 bg-[#ddf928] border border-[#ddf928] rounded-xl px-4 py-2 text-sm font-medium text-black hover:bg-[#b9cc21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                    </svg>
                    Submit
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-b border-[#262626]/50">
              <div className="border-b border-[#262626]/30 p-2">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 text-[#ddf928]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                  </svg>
                  Quick Actions
                </h3>
              </div>

              <div className="p-3">
                <div className="flex justify-center gap-3">
                  {/* Bouton Undo - Aller en arrière */}
                  <button
                    onClick={() => {
                      // Déclencher directement la suppression du dernier message
                      window.dispatchEvent(new CustomEvent("deleteLastMessage"))
                    }}
                    className="flex items-center justify-center w-12 h-10 border border-[#404040]/50 rounded-md hover:bg-[#2a2a2a] transition-colors"
                    title="Undo last change"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M9 14 4 9l5-5" />
                      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                    </svg>
                  </button>

                  {/* Bouton Redo - Revenir à la modification */}
                  <button
                    onClick={() => {
                      // Déclencher la restauration du dernier message supprimé
                      window.dispatchEvent(new CustomEvent("restoreLastMessage"))
                    }}
                    className="flex items-center justify-center w-12 h-10 border border-[#404040]/50 rounded-md hover:bg-[#2a2a2a] transition-colors"
                    title="Redo last change"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="m15 14 5-5-5-5" />
                      <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
                    </svg>
                  </button>

                  {/* Bouton Copy - Copier le code de la section sélectionnée */}
                  <button
                    onClick={() => {
                      if (selectedElement?.element) {
                        // Copier le HTML de l'élément sélectionné
                        const elementHTML = selectedElement.element.outerHTML
                        navigator.clipboard.writeText(elementHTML)
                      }
                    }}
                    className="flex items-center justify-center w-12 h-10 border border-[#404040]/50 rounded-md hover:bg-[#2a2a2a] transition-colors"
                    title="Copy selected section code"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Nouvelles sections additionnelles */}
            <div className="mt-2">
              {/* Image Section */}
              <div className="border-b border-[#262626]/50">
                <button
                  onClick={handleImageSectionToggle}
                  className="flex items-center justify-between w-full p-3 hover:bg-[#262626]/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span className="text-sm font-medium text-white">Image</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform ${isImageSectionOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isImageSectionOpen && (
                  <div className="p-3 bg-[#1a1a1a]">
                    {detectedImages.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-medium text-gray-400 uppercase">Images actuelles</h4>
                          <span className="text-xs text-gray-500">
                            {detectedImages.length} sur {detectedImages.length}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-[#ddf928] rounded-full flex items-center justify-center text-black text-xs font-bold">
                              1
                            </div>
                            <span className="text-sm font-medium text-white">Sélectionnez une image à remplacer</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Rechercher des images actuelles..."
                            className="w-full bg-[#262626] border border-[#404040] rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {detectedImages.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageToReplace(index)}
                              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                                selectedImageToReplace === index
                                  ? "border-[#ddf928] ring-2 ring-[#ddf928]/50"
                                  : "border-[#404040] hover:border-[#606060]"
                              }`}
                            >
                              <img
                                src={img.src || "/placeholder.svg"}
                                alt={img.alt}
                                className="w-full h-full object-cover"
                              />
                              {selectedImageToReplace === index && (
                                <div className="absolute inset-0 bg-[#ddf928]/20 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-[#ddf928] rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        {selectedImageToReplace !== null && (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 bg-[#ddf928] rounded-full flex items-center justify-center text-black text-xs font-bold">
                                2
                              </div>
                              <span className="text-sm font-medium text-white">
                                Choisissez la méthode de remplacement
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <button
                                onClick={() => setImageReplaceMethod("upload")}
                                className={`p-3 rounded-md border transition-all ${
                                  imageReplaceMethod === "upload"
                                    ? "border-[#ddf928] bg-[#ddf928]/10"
                                    : "border-[#404040] hover:border-[#606060]"
                                }`}
                              >
                                <svg
                                  className="w-6 h-6 mx-auto mb-2 text-gray-300"
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
                                <span className="text-xs text-white">Télécharger</span>
                              </button>

                              <button
                                onClick={() => setImageReplaceMethod("unsplash")}
                                className={`p-3 rounded-md border transition-all ${
                                  imageReplaceMethod === "unsplash"
                                    ? "border-[#ddf928] bg-[#ddf928]/10"
                                    : "border-[#404040] hover:border-[#606060]"
                                }`}
                              >
                                <svg
                                  className="w-6 h-6 mx-auto mb-2 text-gray-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                                <span className="text-xs text-white">Unsplash</span>
                              </button>

                              <button
                                onClick={() => setImageReplaceMethod("url")}
                                className={`p-3 rounded-md border transition-all ${
                                  imageReplaceMethod === "url"
                                    ? "border-[#ddf928] bg-[#ddf928]/10"
                                    : "border-[#404040] hover:border-[#606060]"
                                }`}
                              >
                                <svg
                                  className="w-6 h-6 mx-auto mb-2 text-gray-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                  />
                                </svg>
                                <span className="text-xs text-white">URL</span>
                              </button>
                            </div>

                            {imageReplaceMethod === "upload" && (
                              <div className="border-2 border-dashed border-[#404040] rounded-lg p-6 text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                  id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                  <div className="w-12 h-12 bg-[#404040] rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg
                                      className="w-6 h-6 text-[#ddf928]"
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
                                  </div>
                                  <p className="text-white mb-1">Déposez votre fichier ici ou cliquez pour parcourir</p>
                                  <p className="text-gray-400 text-sm">Prise en charge : JPG, PNG, GIF, WebP</p>
                                  <p className="text-gray-500 text-xs mt-1">Taille maximale du fichier : 10 Mo</p>
                                </label>
                              </div>
                            )}

                            {imageReplaceMethod === "url" && (
                              <div className="space-y-3">
                                <input
                                  type="url"
                                  placeholder="https://example.com/image.jpg"
                                  value={newImageUrl}
                                  onChange={(e) => setNewImageUrl(e.target.value)}
                                  className="w-full bg-[#262626] border border-[#404040] rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                                />
                                <button
                                  onClick={handleUrlSubmit}
                                  disabled={!newImageUrl}
                                  className="w-full bg-[#ddf928] hover:bg-[#b9cc21] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium py-2 px-4 rounded-md transition-colors"
                                >
                                  Remplacer l'image
                                </button>
                              </div>
                            )}

                            {imageReplaceMethod === "unsplash" && (
                              <div className="text-center py-4">
                                <p className="text-gray-400 text-sm">Intégration Unsplash à venir...</p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <svg
                          className="w-12 h-12 text-gray-500 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <p className="text-gray-400 text-sm mb-4">Aucune image trouvée dans cette section</p>
                        <button
                          onClick={() => setImageReplaceMethod("upload")}
                          className="bg-[#ddf928] hover:bg-[#b9cc21] text-black font-medium py-2 px-4 rounded-md transition-colors"
                        >
                          Ajouter une image
                        </button>

                        {imageReplaceMethod === "upload" && (
                          <div className="mt-4 border-2 border-dashed border-[#404040] rounded-lg p-6">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = (event) => {
                                    const result = event.target?.result as string
                                    addNewImage(result)
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="hidden"
                              id="add-image-upload"
                            />
                            <label htmlFor="add-image-upload" className="cursor-pointer">
                              <div className="w-12 h-12 bg-[#404040] rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg
                                  className="w-6 h-6 text-[#ddf928]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </div>
                              <p className="text-white text-sm">Cliquez pour ajouter une image</p>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dimensions Section */}
              <div className="border-b border-[#262626]/50">
                <button
                  onClick={handleDimensionsToggle}
                  className="flex items-center justify-between w-full p-3 hover:bg-[#262626]/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="m18 8 4 4-4 4" />
                      <path d="M2 12h20" />
                      <path d="m6 8-4 4 4 4" />
                    </svg>
                    <span className="text-sm font-medium text-white">Dimensions</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform ${isDimensionsSectionOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isDimensionsSectionOpen && (
                  <div className="p-3 bg-[#1a1a1a]">
                    <div className="flex items-center gap-4">
                      {/* Width Input */}
                      <div className="flex-1 relative">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            W
                          </span>
                          <input
                            type="text"
                            placeholder="Largeur"
                            maxLength={5}
                            value={elementWidth}
                            onChange={(e) => {
                              setElementWidth(e.target.value)
                              if (selectedElement?.element && e.target.value) {
                                ;(selectedElement.element as HTMLElement).style.width = e.target.value + "px"
                              }
                            }}
                            className="w-full bg-[#262626] border border-[#404040] rounded-md pl-7 pr-14 py-2 text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                          />
                          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm px-2 py-1 rounded">
                            px
                          </button>
                        </div>
                      </div>

                      {/* Height Input */}
                      <div className="flex-1 relative">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            H
                          </span>
                          <input
                            type="text"
                            placeholder="Hauteur"
                            maxLength={5}
                            value={elementHeight}
                            onChange={(e) => {
                              setElementHeight(e.target.value)
                              if (selectedElement?.element && e.target.value) {
                                ;(selectedElement.element as HTMLElement).style.height = e.target.value + "px"
                              }
                            }}
                            className="w-full bg-[#262626] border border-[#404040] rounded-md pl-7 pr-14 py-2 text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                          />
                          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm px-2 py-1 rounded">
                            px
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Typography Section */}
              <div className="border-b border-[#262626]/50">
                <button
                  onClick={handleTypographyToggle}
                  className="flex items-center justify-between w-full p-3 hover:bg-[#262626]/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <polyline points="4 7 4 4 20 4 20 7" />
                      <line x1="9" x2="15" y1="20" y2="20" />
                      <line x1="12" x2="12" y1="4" y2="20" />
                    </svg>
                    <span className="text-sm font-medium text-white">Typography</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform ${isTypographySectionOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isTypographySectionOpen && (
                  <div className="p-3 bg-[#1a1a1a] space-y-4">
                    {/* Font Settings */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Font Settings</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Size */}
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Size</label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="36"
                              value={fontSize}
                              onChange={(e) => {
                                setFontSize(e.target.value)
                                if (selectedElement?.element && e.target.value) {
                                  ;(selectedElement.element as HTMLElement).style.fontSize = e.target.value + "px"
                                }
                              }}
                              className="w-full bg-[#262626] border border-[#404040] rounded-md pr-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                              px
                            </span>
                          </div>
                        </div>

                        {/* Weight */}
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Weight</label>
                          <select
                            value={fontWeight}
                            onChange={(e) => {
                              setFontWeight(e.target.value)
                              if (selectedElement?.element) {
                                ;(selectedElement.element as HTMLElement).style.fontWeight = e.target.value
                              }
                            }}
                            className="w-full bg-[#262626] border border-[#404040] rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50 appearance-none"
                          >
                            <option value="100">Thin (100)</option>
                            <option value="200">Extra Light (200)</option>
                            <option value="300">Light (300)</option>
                            <option value="400">Normal (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semi Bold (600)</option>
                            <option value="700">Bold (700)</option>
                            <option value="800">Extra Bold (800)</option>
                            <option value="900">Black (900)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Text Style */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-3">Text Style</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Bold */}
                        <button
                          onClick={() => {
                            const newWeight = fontWeight === "700" || fontWeight === "bold" ? "400" : "700"
                            setFontWeight(newWeight)
                            if (selectedElement?.element) {
                              ;(selectedElement.element as HTMLElement).style.fontWeight = newWeight
                            }
                          }}
                          className={`p-3 rounded-lg border transition-all ${
                            fontWeight === "700" || fontWeight === "bold"
                              ? "border-[#ddf928] bg-[#ddf928]/10"
                              : "border-[#404040] hover:border-[#606060]"
                          }`}
                          title="Gras"
                        >
                          <span className="text-white text-lg font-bold">B</span>
                        </button>

                        {/* Italic */}
                        <button
                          onClick={() => {
                            const newStyle = fontStyle === "italic" ? "normal" : "italic"
                            setFontStyle(newStyle)
                            if (selectedElement?.element) {
                              ;(selectedElement.element as HTMLElement).style.fontStyle = newStyle
                            }
                          }}
                          className={`p-3 rounded-lg border transition-all ${
                            fontStyle === "italic"
                              ? "border-[#ddf928] bg-[#ddf928]/10"
                              : "border-[#404040] hover:border-[#606060]"
                          }`}
                          title="Italique"
                        >
                          <span className="text-white text-lg italic">I</span>
                        </button>

                        {/* Underline */}
                        <button
                          onClick={() => {
                            const newDecoration = textDecoration === "underline" ? "none" : "underline"
                            setTextDecoration(newDecoration)
                            if (selectedElement?.element) {
                              ;(selectedElement.element as HTMLElement).style.textDecoration = newDecoration
                            }
                          }}
                          className={`p-3 rounded-lg border transition-all ${
                            textDecoration === "underline"
                              ? "border-[#ddf928] bg-[#ddf928]/10"
                              : "border-[#404040] hover:border-[#606060]"
                          }`}
                          title="Souligné"
                        >
                          <span className="text-white text-lg underline">U</span>
                        </button>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-3">Text Alignment</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: "left", icon: "M3 6h18M3 12h12M3 18h18" },
                          { value: "center", icon: "M3 6h18M7 12h10M3 18h18" },
                          { value: "right", icon: "M3 6h18M9 12h12M3 18h18" },
                          { value: "justify", icon: "M3 6h18M3 12h18M3 18h18" },
                        ].map((align) => (
                          <button
                            key={align.value}
                            onClick={() => {
                              setTextAlign(align.value)
                              if (selectedElement?.element) {
                                ;(selectedElement.element as HTMLElement).style.textAlign = align.value
                              }
                            }}
                            className={`p-3 rounded-lg border transition-all ${
                              textAlign === align.value
                                ? "border-[#ddf928] bg-[#ddf928]/10"
                                : "border-[#404040] hover:border-[#606060]"
                            }`}
                          >
                            <svg
                              className="w-4 h-4 text-white mx-auto"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={align.icon} />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spacing Controls */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Spacing Controls
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Line Height */}
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Line</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="1.5"
                              value={lineHeight}
                              onChange={(e) => {
                                setLineHeight(e.target.value)
                                if (selectedElement?.element && e.target.value) {
                                  ;(selectedElement.element as HTMLElement).style.lineHeight = e.target.value
                                }
                              }}
                              className="w-full bg-[#262626] border border-[#404040] rounded-md pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                              x
                            </span>
                          </div>
                        </div>

                        {/* Letter Spacing */}
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-2">Letter</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              value={letterSpacing}
                              onChange={(e) => {
                                setLetterSpacing(e.target.value)
                                if (selectedElement?.element && e.target.value) {
                                  ;(selectedElement.element as HTMLElement).style.letterSpacing = e.target.value + "px"
                                }
                              }}
                              className="w-full bg-[#262626] border border-[#404040] rounded-md pr-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                              px
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Colors Section */}
              <div className="border-b border-[#262626]/50">
                <button
                  onClick={handleColorsToggle}
                  className="flex items-center justify-between w-full p-3 hover:bg-[#262626]/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                    </svg>
                    <span className="text-sm font-medium text-white">Colors</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform ${isColorsSectionOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isColorsSectionOpen && (
                  <div className="p-3 bg-[#1a1a1a] space-y-4">
                    {/* Text Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            value={textColor.replace("#", "")}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9a-fA-F]/g, "")
                              const newColor = "#" + value
                              setTextColor(newColor)
                              if (selectedElement?.element && value.length === 6) {
                                ;(selectedElement.element as HTMLElement).style.color = newColor
                              }
                            }}
                            className="w-20 bg-[#262626]/50 border border-[#404040] rounded-xl px-2 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50 transition-all"
                          />
                        </div>
                        <button
                          onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                          className="w-8 h-8 rounded-md border border-[#404040] cursor-pointer transition-all hover:border-[#606060]"
                          style={{ backgroundColor: textColor }}
                          title="Open color picker"
                        />
                      </div>

                      {/* Color Picker pour Text Color */}
                      {showTextColorPicker && (
                        <div className="mt-3 p-3 bg-[#262626]/30 rounded-lg border border-[#404040]">
                          <div
                            className="relative w-full h-32 mb-3 rounded-lg overflow-hidden cursor-crosshair"
                            style={{
                              background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${textColor})`,
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const x = (e.clientX - rect.left) / rect.width
                              const y = (e.clientY - rect.top) / rect.height

                              // Calculer la couleur basée sur la position
                              const saturation = Math.round(x * 100)
                              const lightness = Math.round((1 - y) * 50)
                              const hue = Number.parseInt(textColor.slice(1), 16) % 360

                              const newColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
                              setTextColor(newColor)
                              if (selectedElement?.element) {
                                ;(selectedElement.element as HTMLElement).style.color = newColor
                              }
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                          </div>

                          {/* Barre de couleurs */}
                          <div
                            className="w-full h-4 rounded-lg cursor-pointer"
                            style={{
                              background:
                                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const x = (e.clientX - rect.left) / rect.width
                              const hue = Math.round(x * 360)
                              const newColor = `hsl(${hue}, 100%, 50%)`
                              setTextColor(newColor)
                              if (selectedElement?.element) {
                                ;(selectedElement.element as HTMLElement).style.color = newColor
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="f9fafb"
                            maxLength={6}
                            value={backgroundColor.replace("#", "")}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9a-fA-F]/g, "")
                              const newColor = "#" + value
                              setBackgroundColor(newColor)
                              if (selectedElement?.element && value.length === 6) {
                                ;(selectedElement.element as HTMLElement).style.backgroundColor = newColor
                              }
                            }}
                            className="w-20 bg-[#262626]/50 border border-[#404040] rounded-xl px-2 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50 transition-all"
                          />
                        </div>
                        <button
                          onClick={() => setShowBackgroundColorPicker(!showBackgroundColorPicker)}
                          className="w-8 h-8 rounded-md border border-[#404040] cursor-pointer transition-all hover:border-[#606060]"
                          style={{ backgroundColor: backgroundColor }}
                          title="Open color picker"
                        />
                      </div>

                      {/* Color Picker pour Background Color */}
                      {showBackgroundColorPicker && (
                        <div className="mt-3 p-3 bg-[#262626]/30 rounded-lg border border-[#404040]">
                          <div
                            className="relative w-full h-32 mb-3 rounded-lg overflow-hidden cursor-crosshair"
                            style={{
                              background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${backgroundColor})`,
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const x = (e.clientX - rect.left) / rect.width
                              const y = (e.clientY - rect.top) / rect.height

                              // Calculer la couleur basée sur la position
                              const saturation = Math.round(x * 100)
                              const lightness = Math.round((1 - y) * 50)
                              const hue = Number.parseInt(backgroundColor.slice(1), 16) % 360

                              const newColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
                              setBackgroundColor(newColor)
                              if (selectedElement?.element) {
                                ;(selectedElement.element as HTMLElement).style.backgroundColor = newColor
                              }
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                          </div>

                          {/* Barre de couleurs */}
                          <div
                            className="w-full h-4 rounded-lg cursor-pointer"
                            style={{
                              background:
                                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const x = (e.clientX - rect.left) / rect.width
                              const hue = Math.round(x * 360)
                              const newColor = `hsl(${hue}, 100%, 50%)`
                              setBackgroundColor(newColor)
                              if (selectedElement?.element) {
                                ;(selectedElement.element as HTMLElement).style.backgroundColor = newColor
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Layout Section */}
              <div className="border-b border-[#262626]/50">
                <button className="flex items-center justify-between w-full p-3 hover:bg-[#262626]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                    <span className="text-sm font-medium text-white">Layout</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Alignment Section */}
              <div className="border-b border-[#262626]/50">
                <button className="flex items-center justify-between w-full p-3 hover:bg-[#262626]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <rect width="14" height="6" x="5" y="16" rx="2" />
                      <rect width="10" height="6" x="7" y="2" rx="2" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-sm font-medium text-white">Alignment</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Forms Section */}
              <div className="border-b border-[#262626]/50">
                <button className="flex items-center justify-between w-full p-3 hover:bg-[#262626]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-teal-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                      <path d="M3 12A9 3 0 0 0 21 12" />
                    </svg>
                    <span className="text-sm font-medium text-white">Forms</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contrôles de taille d'image */}
            {detectedImages.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    3
                  </div>
                  <span className="text-sm font-medium text-white">Ajuster la taille (optionnel)</span>
                </div>

                <div className="space-y-3">
                  <select
                    value={selectedImageForResize || ""}
                    onChange={(e) => {
                      const index = Number.parseInt(e.target.value)
                      setSelectedImageForResize(index)
                      if (detectedImages[index]) {
                        const img = detectedImages[index].element
                        setImageWidth(img.offsetWidth.toString())
                        setImageHeight(img.offsetHeight.toString())
                      }
                    }}
                    className="w-full bg-[#262626] border border-[#404040] rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                  >
                    <option value="">Sélectionner une image à redimensionner</option>
                    {detectedImages.map((img, index) => (
                      <option key={index} value={index}>
                        Image {index + 1} - {img.alt || `Image ${index + 1}`}
                      </option>
                    ))}
                  </select>

                  {selectedImageForResize !== null && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Largeur</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Auto"
                            value={imageWidth}
                            onChange={(e) => {
                              setImageWidth(e.target.value)
                              if (detectedImages[selectedImageForResize] && e.target.value) {
                                detectedImages[selectedImageForResize].element.style.width = e.target.value + "px"
                              }
                            }}
                            className="w-full bg-[#262626] border border-[#404040] rounded-md pr-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            px
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Hauteur</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Auto"
                            value={imageHeight}
                            onChange={(e) => {
                              setImageHeight(e.target.value)
                              if (detectedImages[selectedImageForResize] && e.target.value) {
                                detectedImages[selectedImageForResize].element.style.height = e.target.value + "px"
                              }
                            }}
                            className="w-full bg-[#262626] border border-[#404040] rounded-md pr-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ddf928]/50"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            px
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedImageForResize !== null && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (detectedImages[selectedImageForResize]) {
                            const img = detectedImages[selectedImageForResize].element
                            img.style.width = "100%"
                            img.style.height = "auto"
                            setImageWidth("100%")
                            setImageHeight("auto")
                          }
                        }}
                        className="flex-1 bg-[#404040] hover:bg-[#505050] text-white text-xs py-2 px-3 rounded-md transition-colors"
                      >
                        Adapter au conteneur
                      </button>
                      <button
                        onClick={() => {
                          if (detectedImages[selectedImageForResize]) {
                            const img = detectedImages[selectedImageForResize].element
                            img.style.width = "auto"
                            img.style.height = "auto"
                            setImageWidth("auto")
                            setImageHeight("auto")
                          }
                        }}
                        className="flex-1 bg-[#404040] hover:bg-[#505050] text-white text-xs py-2 px-3 rounded-md transition-colors"
                      >
                        Taille originale
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations sur l'élément sélectionné */}
            <div className="p-4 border-b border-[#262626]/50">
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Selected Element</h4>
              <div className="bg-[#262626]/30 rounded-md p-3">
                <div className="text-sm font-medium text-white mb-1">&lt;{selectedElement?.tagName}&gt;</div>
                {selectedElement?.className && (
                  <div className="text-xs text-blue-400 mb-1">.{selectedElement.className.split(" ").join(".")}</div>
                )}
                <div className="text-xs text-gray-400 truncate">
                  {selectedElement?.textContent || "No text content"}
                </div>
              </div>
            </div>
          </div>

          {/* Footer avec bouton Save Update */}
          <div className="border-t border-[#262626]/50 p-3">
            <button
              onClick={closeEditPanel}
              className="w-full flex items-center justify-center gap-2 bg-[#ddff00] hover:bg-[#b9cc21] text-black font-medium py-3 px-4 rounded-xl transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save Update
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviewPane
