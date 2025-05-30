"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import ErrorMessage from "./ErrorMessage"
import { ImageIcon, CodeIcon } from "../constants"
import { GenerationMode } from "../types"

interface DashboardProps {
  onStartGeneration?: (prompt: string, mode: GenerationMode, imageFile?: File | null, inputCode?: string) => void
}

export default function Dashboard({ onStartGeneration }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<string>("generate")
  const [mainPrompt, setMainPrompt] = useState<string>("")
  const [activeMode, setActiveMode] = useState<GenerationMode>(GenerationMode.Prompt)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputCode, setInputCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null)
  const themeInputRef = useRef<HTMLInputElement>(null)

  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false)

  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState<boolean>(false)
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState<boolean>(false)
  const [teamCode, setTeamCode] = useState<string>("")
  const [newTeamData, setNewTeamData] = useState({
    name: "",
    type: "design",
    maxMembers: 10,
    permissions: {
      canInvite: true,
      canEdit: true,
      canDelete: false,
    },
  })
  const [generatedCode, setGeneratedCode] = useState<string>("")

  const [teams, setTeams] = useState([
    {
      id: 1,
      name: "Design Team",
      type: "design",
      code: "123456",
      members: [
        { name: "Alice", email: "alice@example.com", role: "owner" },
        { name: "Bob", email: "bob@example.com", role: "member" },
        { name: "Charlie", email: "charlie@example.com", role: "member" },
      ],
      projects: 8,
      tasks: [
        { id: 1, title: "Design new landing page", assignee: "Alice", status: "in-progress" },
        { id: 2, title: "Create mobile mockups", assignee: "Bob", status: "todo" },
      ],
      messages: [
        { id: 1, sender: "Alice", message: "Hey team! Let's discuss the new project", timestamp: new Date() },
        { id: 2, sender: "Bob", message: "Sounds good! I'll prepare the mockups", timestamp: new Date() },
      ],
    },
  ])

  const [selectedTeam, setSelectedTeam] = useState(null)
  const [manageTeamModal, setManageTeamModal] = useState<{
    id: number
    name: string
    type: string
    code: string
    members: { name: string; email: string; role: string }[]
    projects: number
    tasks: { id: number; title: string; assignee: string; status: string }[]
    messages: { id: number; sender: string; content: string; timestamp: string }[]
  } | null>(null)
  const [inviteTeamModal, setInviteTeamModal] = useState(null)
  const [inviteEmail, setInviteEmail] = useState("")

  const handleInviteMember = (teamId: string) => {
    // Logic to invite a member
    alert(`Invite sent to ${inviteEmail} for team ${teamId}`)
    setInviteTeamModal(null)
    setInviteEmail("")
  }

  const [newMessage, setNewMessage] = useState("")

  const getTeamGradient = (type) => {
    switch (type) {
      case "design":
        return "from-purple-500 to-pink-500"
      case "development":
        return "from-green-500 to-blue-500"
      case "marketing":
        return "from-orange-500 to-red-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getTeamIcon = (type) => {
    switch (type) {
      case "design":
        return (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
            />
          </svg>
        )
      case "development":
        return (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        )
      case "marketing":
        return (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
    }
  }

  const getTeamTypeLabel = (type) => {
    switch (type) {
      case "design":
        return "UI/UX & Creative Design"
      case "development":
        return "Frontend & Backend Development"
      case "marketing":
        return "Growth & Content Marketing"
      default:
        return "General Team"
    }
  }

  const handleCreateTeam = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(randomCode)

    const newTeam = {
      id: teams.length + 1,
      name: newTeamData.name,
      type: newTeamData.type,
      code: randomCode,
      members: [{ name: "You", email: "you@example.com", role: "owner" }],
      projects: 0,
      tasks: [],
      messages: [],
    }

    setTeams([...teams, newTeam])
    setIsCreateTeamModalOpen(false)

    // Réinitialiser les données
    setNewTeamData({
      name: "",
      type: "design",
      maxMembers: 10,
      permissions: {
        canInvite: true,
        canEdit: true,
        canDelete: false,
      },
    })
  }

  const handleRemoveMember = (teamId, memberEmail) => {
    setTeams(
      teams.map((team) =>
        team.id === teamId ? { ...team, members: team.members.filter((member) => member.email !== memberEmail) } : team,
      ),
    )
  }

  const handleSendMessage = (teamId: string) => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: "You",
        message: newMessage,
        timestamp: new Date(),
      }

      setTeams(teams.map((team) => (team.id === teamId ? { ...team, messages: [...team.messages, message] } : team)))
      setNewMessage("")
    }
  }

  const handleJoinTeam = () => {
    if (teamCode.length === 6 && /^\d+$/.test(teamCode)) {
      // Logique pour rejoindre une équipe avec le code
      alert(`Équipe rejointe avec le code: ${teamCode}`)
      setIsJoinTeamModalOpen(false)
      setTeamCode("")
    } else {
      alert("Veuillez entrer un code valide à 6 chiffres")
    }
  }

  const generateTeamCode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(randomCode)
  }

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
          // Déclencher l'ouverture du file input après un petit délai
          setTimeout(() => {
            fileInputRef.current?.click()
          }, 100)
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

  const handleGenerate = useCallback(async () => {
    console.log("handleGenerate called!")
    console.log("mainPrompt:", mainPrompt)
    console.log("activeMode:", activeMode)
    console.log("imageFile:", imageFile)
    console.log("onStartGeneration function:", onStartGeneration)

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

    setError(null)
    setIsLoading(true)

    console.log("About to call onStartGeneration...")

    // Appeler la fonction de callback pour démarrer la génération
    if (onStartGeneration) {
      try {
        onStartGeneration(mainPrompt, activeMode, imageFile, inputCode)
        console.log("onStartGeneration called successfully!")
      } catch (error) {
        console.error("Error calling onStartGeneration:", error)
        setError("An error occurred while starting generation.")
      }
    } else {
      console.error("onStartGeneration is not defined!")
      setError("Generation function is not available.")
    }

    setIsLoading(false)
  }, [mainPrompt, activeMode, imageFile, inputCode, onStartGeneration])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  const getButtonText = () => {
    if (isLoading) return "Generating..."
    if (activeMode === GenerationMode.Image) return "Generate from Image"
    if (activeMode === GenerationMode.Code) return "Transform Code"
    return "Generate Code"
  }

  const handleDeleteTeam = (teamId: string) => {
    // Logic to delete team
    setManageTeamModal(null)
  }

  const handleLeaveTeam = (teamId: string, memberEmail: string) => {
    // Logic to leave team
    setManageTeamModal(null)
  }

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  return (
    <div className="bg-black h-screen overflow-hidden relative flex">
      {/* Glow effect */}
      <div
        className="fixed top-0 left-0 w-full h-[150px] z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(221, 249, 40, 0.4) 0%, rgba(221, 249, 40, 0.2) 50%, transparent 100%)",
          animation: "pulse 4s ease-in-out infinite alternate",
        }}
      />

      {/* CSS Styles */}
      <style jsx>{`
      .star {
        position: fixed;
        background: #ddf928;
        border-radius: 50%;
        opacity: 0;
        animation: rise 8s linear infinite;
        box-shadow: 0 0 25px #ddf928, 0 0 50px #ddf928, 0 0 75px #ddf928;
        z-index: 50;
      }
      
      .star::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 150%;
        height: 1px;
        background: #ddf928;
        border-radius: 2px;
      }
      
      .star::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(90deg);
        width: 150%;
        height: 1px;
        background: #ddf928;
        border-radius: 2px;
      }
      
      @keyframes rise {
        0% {
          transform: translateY(100vh) scale(0.3);
          opacity: 0;
        }
        15% {
          opacity: 0.8;
        }
        70% {
          opacity: 0.9;
        }
        85% {
          opacity: 0.5;
        }
        100% {
          transform: translateY(-50px) scale(0.8);
          opacity: 0;
        }
      }
      
      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        100% {
          opacity: 0.9;
        }
      }
    `}</style>

      <div className="w-60 h-screen flex flex-col bg-zinc-950 pb-4 overflow-auto relative z-10">
        {/* Header avec logo */}
        <div className="flex items-center h-[140px] px-5 flex-shrink-0">
          <a href="#" className="flex items-center h-full cursor-pointer transition-all duration-200">
            <div className="flex items-center gap-2 cursor-pointer transition-transform duration-200">
              <img
                src="/images/odro-logo-final.png"
                alt="Odro Logo"
                className="h-20 w-20 cursor-pointer transition-all duration-200 hover:scale-105"
                onError={(e) => {
                  console.error("Logo failed to load:", e)
                  e.target.style.display = "none"
                }}
              />
            </div>
          </a>
        </div>

        {/* Séparateur */}
        <div className="h-px px-5">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/6 to-transparent"></div>
        </div>

        {/* Navigation principale */}
        <div className="flex-1 mt-4 overflow-auto px-3">
          {/* Generate (actif) */}
          <button
            onClick={() => setActiveSection("generate")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden w-full ${
              activeSection === "generate"
                ? "bg-gradient-to-r from-[#ddf928]/15 to-[#ddf928]/5 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            {activeSection === "generate" && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[#ddf928] rounded-full"></div>
            )}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 ${
                activeSection === "generate" ? "bg-[#ddf928]/15" : "bg-white/6"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={activeSection === "generate" ? "text-[#ddf928]" : ""}
              >
                <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                <path d="m14 7 3 3"></path>
                <path d="M5 6v4"></path>
                <path d="M19 14v4"></path>
                <path d="M10 2v2"></path>
                <path d="M7 8H3"></path>
                <path d="M21 16h-4"></path>
                <path d="M11 3H9"></path>
              </svg>
            </div>
            <span className="text-sm font-medium">Generate</span>
          </button>

          {/* Projects */}
          <button
            onClick={() => setActiveSection("projects")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden mt-1 w-full ${
              activeSection === "projects"
                ? "bg-gradient-to-r from-[#ddf928]/15 to-[#ddf928]/5 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            {activeSection === "projects" && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[#ddf928] rounded-full"></div>
            )}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 ${
                activeSection === "projects" ? "bg-[#ddf928]/15" : "bg-white/6"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={activeSection === "projects" ? "text-[#ddf928]" : ""}
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                <path d="M8 10v4"></path>
                <path d="M12 10v2"></path>
                <path d="M16 10v6"></path>
              </svg>
            </div>
            <span className="text-sm font-medium">Projects</span>
          </button>

          {/* Layout avec badge NEW */}
          <button
            onClick={() => setActiveSection("layout")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden mt-1 w-full ${
              activeSection === "layout"
                ? "bg-gradient-to-r from-[#ddf928]/15 to-[#ddf928]/5 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            {activeSection === "layout" && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[#ddf928] rounded-full"></div>
            )}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 ${
                activeSection === "layout" ? "bg-[#ddf928]/15" : "bg-white/6"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={activeSection === "layout" ? "text-[#ddf928]" : ""}
              >
                <rect width="18" height="7" x="3" y="3" rx="1"></rect>
                <rect width="9" height="7" x="3" y="14" rx="1"></rect>
                <rect width="5" height="7" x="16" y="14" rx="1"></rect>
              </svg>
            </div>
            <span className="text-sm font-medium">Layout</span>
            <div className="ml-auto bg-[#ddf928] text-black text-xs font-medium px-2 py-0.5 rounded-full">NEW</div>
          </button>

          {/* Community */}
          <button
            onClick={() => setActiveSection("community")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden mt-1 w-full ${
              activeSection === "community"
                ? "bg-gradient-to-r from-[#ddf928]/15 to-[#ddf928]/5 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            {activeSection === "community" && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[#ddf928] rounded-full"></div>
            )}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 ${
                activeSection === "community" ? "bg-[#ddf928]/15" : "bg-white/6"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={activeSection === "community" ? "text-[#ddf928]" : ""}
              >
                <path d="M18 21a8 8 0 0 0-16 0"></path>
                <circle cx="10" cy="8" r="5"></circle>
                <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path>
              </svg>
            </div>
            <span className="text-sm font-medium">Community</span>
          </button>

          {/* Teams */}
          <button
            onClick={() => setActiveSection("teams")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden mt-1 w-full ${
              activeSection === "teams"
                ? "bg-gradient-to-r from-[#ddf928]/15 to-[#ddf928]/5 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            {activeSection === "teams" && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[#ddf928] rounded-full"></div>
            )}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 ${
                activeSection === "teams" ? "bg-[#ddf928]/15" : "bg-white/6"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={activeSection === "teams" ? "text-[#ddf928]" : ""}
              >
                <path d="M18 21a8 8 0 0 0-16 0"></path>
                <circle cx="10" cy="8" r="5"></circle>
                <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path>
              </svg>
            </div>
            <span className="text-sm font-medium">Teams</span>
          </button>

          {/* Subscribe */}
          <button
            onClick={() => setActiveSection("subscribe")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden mt-1 w-full ${
              activeSection === "subscribe"
                ? "bg-gradient-to-r from-[#ddf928]/15 to-[#ddf928]/5 text-white"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            {activeSection === "subscribe" && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[#ddf928] rounded-full"></div>
            )}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 ${
                activeSection === "subscribe" ? "bg-[#ddf928]/15" : "bg-white/6"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={activeSection === "subscribe" ? "text-[#ddf928]" : ""}
              >
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
            </div>
            <span className="text-sm font-medium">Subscribe</span>
          </button>
        </div>

        {/* Séparateur bas */}
        <div className="my-4 mx-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        {/* Section utilisateur */}
        <div className="mt-auto px-6 user-menu-container relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 p-2 rounded-lg w-full transition-all duration-200 hover:bg-white/5"
          >
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 overflow-hidden">
                <span className="text-white/80 text-sm font-medium">S</span>
              </div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <h3 className="text-white text-sm font-medium truncate">Spiros Nks</h3>
              <p className="text-white/60 text-xs truncate">spirosnks247@gmail.com</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/40 flex-shrink-0"
            >
              <path d="m18 15-6-6-6 6"></path>
            </svg>
          </button>

          {/* Menu utilisateur déroulant */}
          {isUserMenuOpen && (
            <div className="absolute bottom-20 left-6 right-6 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl z-50">
              <div className="mb-4">
                <h4 className="text-white font-bold text-sm mb-4 tracking-wide">MY ACCOUNT</h4>
              </div>

              <div className="space-y-1 mb-4">
                <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-.426-1.756-2.924-1.756 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </button>

                <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Subscribe</span>
                </button>

                <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Extension</span>
                </button>
              </div>

              {/* Ligne séparatrice */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-4"></div>

              {/* Bouton Logout */}
              <button className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 group">
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}

          {/* Bouton collapse */}
          <button
            className="flex items-center justify-center gap-2 w-full h-6 mt-4 rounded-full bg-gray-600/80 border border-white/3 transition-all duration-200 hover:bg-gray-600"
            aria-label="Collapse sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/60 flex-shrink-0"
            >
              <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              <path d="M9 3v18"></path>
            </svg>
            <span className="text-white/60 text-xs font-medium">Collapse sidebar</span>
          </button>
        </div>
      </div>

      {/* Script pour créer les étoiles - intégré directement */}
      <div
        ref={(el) => {
          if (el) {
            // Nettoyer les étoiles existantes
            const existingStars = document.querySelectorAll(".star")
            existingStars.forEach((star) => star.remove())

            const createStar = () => {
              const star = document.createElement("div")
              star.className = "star"

              const size = Math.random() * 4 + 3
              star.style.width = size + "px"
              star.style.height = size + "px"
              star.style.left = Math.random() * 100 + "%"
              star.style.animationDelay = Math.random() * 3 + "s"
              star.style.animationDuration = Math.random() * 4 + 6 + "s"

              document.body.appendChild(star)

              setTimeout(() => {
                if (star.parentNode) {
                  star.remove()
                }
              }, 12000)
            }

            const interval = setInterval(createStar, 600)

            // Créer quelques étoiles initiales
            for (let i = 0; i < 10; i++) {
              setTimeout(createStar, i * 200)
            }

            // Cleanup function
            return () => {
              clearInterval(interval)
              const stars = document.querySelectorAll(".star")
              stars.forEach((star) => star.remove())
            }
          }
        }}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex items-start justify-start p-8 relative z-10 overflow-hidden">
        {activeSection === "generate" ? (
          // Contenu Generate...
          <div className="w-full max-w-2xl mx-auto">
            {/* Titre */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Code Generator</h1>
              <p className="text-gray-400 text-lg">Transform your ideas into beautiful interfaces</p>
            </div>

            {/* Generator Interface - Même que la landing page */}
            <div className="w-full mb-16">
              <div
                className="relative backdrop-blur-2xl bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl shadow-2xl"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
              >
                {/* Image preview section - affiché au-dessus du textarea */}
                {imagePreviewUrl && (
                  <div className="p-6 border-b border-[rgba(42,42,42,0.5)]">
                    <div className="flex items-center gap-4 p-4 bg-[rgba(42,42,42,0.3)] rounded-xl border border-[rgba(42,42,42,0.5)]">
                      <div className="relative">
                        <img
                          src={imagePreviewUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-[#ddf928]/20 shadow-lg"
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-[#ddf928] rounded-full animate-pulse"></div>
                          <p className="text-white text-sm font-semibold">Image Ready</p>
                        </div>
                        <p className="text-gray-400 text-xs mb-3">Screenshot uploaded and ready for code generation</p>
                        <button
                          onClick={() => {
                            setImageFile(null)
                            setImagePreviewUrl(null)
                            setActiveMode(GenerationMode.Prompt)
                            setActiveQuickAction(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                          className="px-3 py-1.5 bg-[#ddf928] text-black text-xs font-medium rounded-lg hover:bg-[#ddf928]/90 transition-all duration-200 transform hover:scale-105"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Textarea */}
                <div className="overflow-auto">
                  <textarea
                    value={mainPrompt}
                    onChange={(e) => setMainPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      activeMode === GenerationMode.Image
                        ? "Describe what you want to build from this image..."
                        : "Describe the interface you want to create..."
                    }
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
                      onClick={() => {
                        console.log("=== GENERATE BUTTON CLICKED ===")
                        console.log("onStartGeneration exists:", !!onStartGeneration)
                        console.log("onStartGeneration type:", typeof onStartGeneration)
                        console.log("mainPrompt:", mainPrompt)
                        console.log("activeMode:", activeMode)
                        console.log("imageFile:", imageFile)
                        console.log("inputCode:", inputCode)

                        if (onStartGeneration) {
                          console.log("Calling onStartGeneration directly...")
                          onStartGeneration(mainPrompt, activeMode, imageFile, inputCode)
                        } else {
                          console.error("onStartGeneration is undefined!")
                          alert("Generation function not available. Please check the console for details.")
                        }
                      }}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-[#ddf928] text-black font-medium rounded-xl hover:bg-[#ddf928]/90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      )}
                      <span>{getButtonText()}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Input file caché pour les images */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageFileChange}
              />

              {/* Quick action buttons */}
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
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 2 0 002 2z"
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

              <input
                ref={themeInputRef}
                type="file"
                accept=".zip,.rar,.7z"
                style={{ display: "none" }}
                onChange={(e) => {
                  // Logique pour gérer l'import de thème
                  console.log("Theme file selected:", e.target.files?.[0])
                }}
              />

              {error && (
                <div className="mt-4">
                  <ErrorMessage message={error} />
                </div>
              )}
            </div>
          </div>
        ) : activeSection === "projects" ? (
          <div className="w-full max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white">Projects</h1>
                <span className="text-gray-400 text-lg">(2/3)</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Search bar */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="pl-10 pr-4 py-2 w-80 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ddf928] transition-colors"
                  />
                </div>

                {/* Filters button */}
                <button className="flex items-center gap-2 px-4 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                    />
                  </svg>
                  Filters
                </button>

                {/* New Project button */}
                <button className="flex items-center gap-2 px-4 py-2 bg-[#ddf928] text-black font-medium rounded-lg hover:bg-[#ddf928]/90 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Project
                </button>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Project Card 1 - Feastables */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl p-6 hover:border-[rgba(42,42,42,0.8)] transition-colors">
                {/* Header with title and menu */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">ecommerce</span>
                  <button className="text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Preview area */}
                <div className="flex flex-col items-center justify-center h-32 mb-4 border border-[rgba(42,42,42,0.5)] rounded-lg bg-[rgba(42,42,42,0.2)]">
                  <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9 9m9-9v18"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm text-center">No Preview Available</p>
                  <p className="text-gray-600 text-xs text-center">Click Resume to start building</p>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-gray-500 text-xs">2 days ago</span>
                </div>

                {/* Project title and URL */}
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-lg mb-1">Feastables</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>feastablermo7.rollout.site</span>
                    <button className="text-gray-400 hover:text-white">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-white">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 flex-1 px-3 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Resume
                  </button>
                  <button className="flex items-center gap-2 flex-1 px-3 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-.426-1.756-2.924-1.756 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </button>
                </div>
              </div>

              {/* Project Card 2 - Élégance Fashion */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl p-6 hover:border-[rgba(42,42,42,0.8)] transition-colors">
                {/* Header with title and menu */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">webpage</span>
                  <button className="text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Preview area */}
                <div className="flex flex-col items-center justify-center h-32 mb-4 border border-[rgba(42,42,42,0.5)] rounded-lg bg-[rgba(42,42,42,0.2)]">
                  <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9 9m9-9v18"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm text-center">No Preview Available</p>
                  <p className="text-gray-600 text-xs text-center">Click Resume to start building</p>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-gray-500 text-xs">about 1 month ago</span>
                </div>

                {/* Project title and URL */}
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-lg mb-1">Élégance Fashion</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>l-gance-fashiont3i7.rollout.site</span>
                    <button className="text-gray-400 hover:text-white">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-white">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 flex-1 px-3 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Resume
                  </button>
                  <button className="flex items-center gap-2 flex-1 px-3 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-.426-1.756-2.924-1.756 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </button>
                </div>
              </div>

              {/* Empty slot for third project */}
              <div
                onClick={() => setActiveSection("generate")}
                className="bg-[rgba(26,26,26,0.4)] border-2 border-dashed border-[rgba(42,42,42,0.5)] rounded-xl p-6 flex flex-col items-center justify-center h-80 hover:border-[#ddf928]/50 transition-colors cursor-pointer"
              >
                <svg className="w-12 h-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-400 text-lg font-medium mb-2">Create New Project</p>
                <p className="text-gray-500 text-sm text-center">Start building your next amazing project</p>
              </div>
            </div>
          </div>
        ) : activeSection === "layout" ? (
          <div className="w-full max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white">Layout Library</h1>
                <span className="text-gray-400 text-lg">(5 sections)</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Search bar */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  <input
                    type="text"
                    placeholder="Search layouts..."
                    className="pl-10 pr-4 py-2 w-80 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ddf928] transition-colors"
                  />
                </div>

                {/* Filters button */}
                <button className="flex items-center gap-2 px-4 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                    />
                  </svg>
                  Filters
                </button>

                {/* Import Layout button */}
                <button className="flex items-center gap-2 px-4 py-2 bg-[#ddf928] text-black font-medium rounded-lg hover:bg-[#ddf928]/90 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Import Layout
                </button>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Layout Card 1 - Hero Section */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl p-6 hover:border-[rgba(42,42,42,0.8)] transition-colors">
                {/* Header with title and menu */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">hero</span>
                  <button className="text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Preview area */}
                <div className="h-32 mb-4 border border-[rgba(42,42,42,0.5)] rounded-lg bg-[rgba(42,42,42,0.2)] p-4 overflow-hidden">
                  <div className="text-white text-xs font-mono leading-tight">
                    <div className="text-[#ddf928]">{'<footer className="site-footer">'}</div>
                    <div className="ml-2 text-blue-400">{'<div className="footer-content">'}</div>
                    <div className="ml-4 text-purple-400">{'<div className="links">'}</div>
                    <div className="ml-6 text-green-400">{'<a href="/privacy">Privacy</a>'}</div>
                    <div className="ml-4 text-purple-400">{"</div>"}</div>
                    <div className="ml-2 text-blue-400">{"</div>"}</div>
                    <div className="text-[#ddf928]">{"</footer>"}</div>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-gray-500 text-xs">1 week ago</span>
                </div>

                {/* Layout title and description */}
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-lg mb-1">Site Footer</h3>
                  <p className="text-gray-400 text-sm">Complete footer with links and social icons</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 flex-1 px-3 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Code
                  </button>
                  <button className="flex items-center gap-2 flex-1 px-3 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </button>
                </div>
              </div>

              {/* Layout Card 5 - Card Grid */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl p-6 hover:border-[rgba(42,42,42,0.8)] transition-colors">
                {/* Header with title and menu */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">grid</span>
                  <button className="text-gray-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Preview area */}
                <div className="h-32 mb-4 border border-[rgba(42,42,42,0.5)] rounded-lg bg-[rgba(42,42,42,0.2)] p-4 overflow-hidden">
                  <div className="text-white text-xs font-mono leading-tight">
                    <div className="text-[#ddf928]">{'<div className="card-grid">'}</div>
                    <div className="ml-2 text-blue-400">{'<div className="card">'}</div>
                    <div className="ml-4 text-purple-400">{"<h3>Feature 1</h3>"}</div>
                    <div className="ml-4 text-green-400">{"<p>Description</p>"}</div>
                    <div className="ml-2 text-blue-400">{"</div>"}</div>
                    <div className="ml-2 text-gray-400">{"// More cards..."}</div>
                    <div className="text-[#ddf928]">{"</div>"}</div>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-gray-500 text-xs">5 days ago</span>
                </div>

                {/* Layout title and description */}
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-lg mb-1">Feature Cards</h3>
                  <p className="text-gray-400 text-sm">Responsive grid layout with feature cards</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 flex-1 px-3 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Code
                  </button>
                  <button className="flex items-center gap-2 flex-1 px-3 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </button>
                </div>
              </div>

              {/* Empty slot for new layout */}
              <div className="bg-[rgba(26,26,26,0.4)] border-2 border-dashed border-[rgba(42,42,42,0.5)] rounded-xl p-6 flex flex-col items-center justify-center h-80 hover:border-[#ddf928]/50 transition-colors cursor-pointer">
                <svg className="w-12 h-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-400 text-lg font-medium mb-2">Import New Layout</p>
                <p className="text-gray-500 text-sm text-center">Copy and save your favorite sections</p>
              </div>
            </div>
          </div>
        ) : activeSection === "community" ? (
          <div className="w-full max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white">Community</h1>
                <span className="text-gray-400 text-lg">(Featured Projects)</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Search bar */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  <input
                    type="text"
                    placeholder="Search templates..."
                    className="pl-10 pr-4 py-2 w-80 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ddf928] transition-colors"
                  />
                </div>

                {/* Filters button */}
                <button className="flex items-center gap-2 px-4 py-2 bg-[rgba(42,42,42,0.5)] border border-[rgba(42,42,42,0.5)] rounded-lg text-gray-400 hover:text-white hover:border-[#ddf928] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                    />
                  </svg>
                  Filters
                </button>
              </div>
            </div>

            {/* Community Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Project 1 - Baquery */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl overflow-hidden hover:border-[rgba(42,42,42,0.8)] transition-colors group">
                {/* Project Preview */}
                <div className="relative h-48 bg-white overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-white p-6">
                    {/* Header */}
                    <div className="bg-red-500 text-white text-xs px-3 py-2 rounded mb-4 w-fit">
                      🍰 Special Offer: Free delivery on orders over $50!
                    </div>

                    {/* Content */}
                    <div className="text-center mt-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Testimonials</h2>
                      <div className="w-12 h-1 bg-red-500 mx-auto mb-6"></div>

                      {/* Testimonial cards */}
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="bg-white p-2 rounded shadow-sm border">
                          <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-1"></div>
                          <div className="text-xs text-gray-600">★★★★★</div>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border">
                          <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-1"></div>
                          <div className="text-xs text-gray-600">★★★★★</div>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm border">
                          <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-1"></div>
                          <div className="text-xs text-gray-600">★★★★★</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-[#ddf928] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#ddf928]/90 transition-colors">
                      View Project
                    </button>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg">Baquery - Online Bakery Delivery</h3>
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#ddf928]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-white font-medium">81%</span>
                    </div>
                    <span className="text-gray-400 text-sm bg-[rgba(42,42,42,0.5)] px-3 py-1 rounded-full">
                      ecommerce
                    </span>
                  </div>
                </div>
              </div>

              {/* Project 2 - DataAI Solutions */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl overflow-hidden hover:border-[rgba(42,42,42,0.8)] transition-colors group">
                {/* Premium Badge */}
                <div className="absolute top-4 right-4 z-10 bg-[#ddf928] text-black text-xs font-medium px-2 py-1 rounded">
                  Premium
                </div>

                {/* Project Preview */}
                <div className="relative h-48 bg-gray-900 overflow-hidden">
                  <div className="absolute inset-0 p-6">
                    {/* Dark dashboard layout */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="text-[#ddf928] text-xs font-bold">DO</div>
                        <div className="text-white text-xs">Data Operations Specialists</div>
                      </div>
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="text-[#ddf928] text-xs font-bold">LC</div>
                        <div className="text-white text-xs">Low-Code Specialists</div>
                      </div>
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="text-[#ddf928] text-xs font-bold">SA</div>
                        <div className="text-white text-xs">Solutions Architect</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="text-white text-xs font-semibold mb-1">Our Team Approach</div>
                        <div className="text-gray-400 text-xs">Collaborative solutions</div>
                      </div>
                      <div className="bg-gray-800 p-2 rounded">
                        <div className="text-white text-xs font-semibold mb-1">Join Our Team</div>
                        <div className="text-gray-400 text-xs">Career opportunities</div>
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-[#ddf928] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#ddf928]/90 transition-colors">
                      View Project
                    </button>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg">DataAI Solutions Australia</h3>
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#ddf928]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-white font-medium">79%</span>
                    </div>
                    <span className="text-gray-400 text-sm bg-[rgba(42,42,42,0.5)] px-3 py-1 rounded-full">
                      webpage
                    </span>
                  </div>
                </div>
              </div>

              {/* Project 3 - FinDiscuss India */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl overflow-hidden hover:border-[rgba(42,42,42,0.8)] transition-colors group">
                {/* Project Preview */}
                <div className="relative h-48 bg-gray-50 overflow-hidden">
                  <div className="absolute inset-0 p-4">
                    {/* Dashboard layout */}
                    <div className="bg-white rounded-lg shadow-sm p-3 h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-800">Dashboard</div>
                        <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-blue-50 p-2 rounded text-center">
                          <div className="text-blue-600 text-xs font-bold">12</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded text-center">
                          <div className="text-green-600 text-xs font-bold">8</div>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded text-center">
                          <div className="text-yellow-600 text-xs font-bold">24</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded text-center">
                          <div className="text-purple-600 text-xs font-bold">16</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-gray-100 p-2 rounded">
                          <div className="text-xs text-gray-600">Recent Activity Summary</div>
                        </div>
                        <div className="bg-gray-100 p-2 rounded">
                          <div className="text-xs text-gray-600">Investment Reports</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-[#ddf928] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#ddf928]/90 transition-colors">
                      View Project
                    </button>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg">FinDiscuss India</h3>
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#ddf928]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-white font-medium">89%</span>
                    </div>
                    <span className="text-gray-400 text-sm bg-[rgba(42,42,42,0.5)] px-3 py-1 rounded-full">webapp</span>
                  </div>
                </div>
              </div>

              {/* Project 4 - SD Wedding Photography */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl overflow-hidden hover:border-[rgba(42,42,42,0.8)] transition-colors group">
                {/* Premium Badge */}
                <div className="absolute top-4 right-4 z-10 bg-[#ddf928] text-black text-xs font-medium px-2 py-1 rounded">
                  Premium
                </div>

                {/* Project Preview */}
                <div className="relative h-48 bg-white overflow-hidden">
                  <div className="absolute inset-0 p-4">
                    {/* Photography portfolio layout */}
                    <div className="grid grid-cols-4 gap-1 h-full">
                      <div className="bg-gradient-to-br from-amber-200 to-amber-400 rounded"></div>
                      <div className="bg-gradient-to-br from-rose-200 to-rose-400 rounded"></div>
                      <div className="bg-gradient-to-br from-emerald-200 to-emerald-400 rounded"></div>
                      <div className="bg-gradient-to-br from-blue-200 to-blue-400 rounded"></div>
                      <div className="bg-gradient-to-br from-purple-200 to-purple-400 rounded"></div>
                      <div className="bg-gradient-to-br from-pink-200 to-pink-400 rounded"></div>
                      <div className="bg-gradient-to-br from-indigo-200 to-indigo-400 rounded"></div>
                      <div className="bg-gradient-to-br from-green-200 to-green-400 rounded"></div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-2 rounded">
                      <div className="text-sm font-semibold text-gray-800">Highlight Flow</div>
                      <div className="text-xs text-gray-600">Wedding Photography Portfolio</div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-[#ddf928] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#ddf928]/90 transition-colors">
                      View Project
                    </button>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg">SD Wedding Photography</h3>
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#ddf928]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-white font-medium">96%</span>
                    </div>
                    <span className="text-gray-400 text-sm bg-[rgba(42,42,42,0.5)] px-3 py-1 rounded-full">
                      webpage
                    </span>
                  </div>
                </div>
              </div>

              {/* Project 5 - BudgetTracker */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl overflow-hidden hover:border-[rgba(42,42,42,0.8)] transition-colors group">
                {/* Premium Badge */}
                <div className="absolute top-4 right-4 z-10 bg-[#ddf928] text-black text-xs font-medium px-2 py-1 rounded">
                  Premium
                </div>

                {/* Project Preview */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    {/* Mobile app mockup */}
                    <div className="bg-white rounded-3xl p-4 shadow-2xl border-8 border-gray-800 w-32 h-40">
                      <div className="bg-blue-500 text-white text-center py-2 rounded-lg mb-2">
                        <div className="text-xs font-bold">$2,450.35</div>
                        <div className="text-xs">Balance</div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Groceries</span>
                          <span className="text-green-600">-$45</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Salary</span>
                          <span className="text-blue-600">+$2500</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Coffee</span>
                          <span className="text-green-600">-$5</span>
                        </div>
                      </div>

                      <div className="mt-2 bg-blue-500 text-white text-center py-1 rounded text-xs">
                        Add Transaction
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-[#ddf928] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#ddf928]/90 transition-colors">
                      View Project
                    </button>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg">BudgetTracker</h3>
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#ddf928]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-white font-medium">99%</span>
                    </div>
                    <span className="text-gray-400 text-sm bg-[rgba(42,42,42,0.5)] px-3 py-1 rounded-full">
                      mobileapp
                    </span>
                  </div>
                </div>
              </div>

              {/* Project 6 - Second Brain */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-xl overflow-hidden hover:border-[rgba(42,42,42,0.8)] transition-colors group">
                {/* Project Preview */}
                <div className="relative h-48 bg-gray-900 overflow-hidden">
                  <div className="absolute inset-0 p-4">
                    {/* Dark knowledge hub layout */}
                    <div className="text-center mb-4">
                      <div className="text-orange-400 text-sm font-bold mb-1">Try Our Tools System</div>
                      <div className="text-white text-xs">Comprehensive knowledge management</div>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-gray-800 p-2 rounded flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <div className="text-white text-xs">Knowledge management and storage</div>
                      </div>
                      <div className="bg-gray-800 p-2 rounded flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <div className="text-white text-xs">Smart search and retrieval</div>
                      </div>
                      <div className="bg-gray-800 p-2 rounded flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <div className="text-white text-xs">AI-powered insights</div>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-gray-800 p-2 rounded text-center">
                        <div className="text-white text-xs font-semibold">Integrations</div>
                        <div className="text-gray-400 text-xs">Connect your favorite tools and services</div>
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-[#ddf928] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#ddf928]/90 transition-colors">
                      View Project
                    </button>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg">Second Brain - Your Digital Knowledge Hub</h3>
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#ddf928]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-white font-medium">89%</span>
                    </div>
                    <span className="text-gray-400 text-sm bg-[rgba(42,42,42,0.5)] px-3 py-1 rounded-full">
                      webpage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === "teams" ? (
          <div className="w-full max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Teams</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#ddf928] rounded-full"></div>
                  <span className="text-gray-400 text-sm">3 active teams</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Search bar */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  <input
                    type="text"
                    placeholder="Search teams..."
                    className="pl-10 pr-4 py-3 w-80 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#ddf928] focus:ring-1 focus:ring-[#ddf928] transition-all"
                  />
                </div>

                {/* Join Team button */}
                <button
                  onClick={() => setIsJoinTeamModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Join Team
                </button>

                {/* Create Team button */}
                <button
                  onClick={() => setIsCreateTeamModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#ddf928] text-black font-semibold rounded-xl hover:bg-[#ddf928]/90 transition-all transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Team
                </button>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Équipes créées dynamiquement */}
              {teams.map((team) => (
                <div key={team.id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div
                    className="relative bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedTeam(team)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 bg-gradient-to-br ${getTeamGradient(team.type)} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          {getTeamIcon(team.type)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{team.name}</h3>
                          <p className="text-gray-400 text-sm">{getTeamTypeLabel(team.type)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-[#ddf928]/20 text-[#ddf928] text-xs font-medium px-2 py-1 rounded-full">
                              OWNER
                            </span>
                            <span className="bg-green-500/20 text-green-400 text-xs font-medium px-2 py-1 rounded-full">
                              ACTIVE
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                        <div className="text-2xl font-bold text-white mb-1">{team.members.length}</div>
                        <div className="text-gray-400 text-xs">Members</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                        <div className="text-2xl font-bold text-white mb-1">{team.projects || 0}</div>
                        <div className="text-gray-400 text-xs">Projects</div>
                      </div>
                      <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                        <div className="text-2xl font-bold text-[#ddf928] mb-1">94%</div>
                        <div className="text-gray-400 text-xs">Activity</div>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">Team Members</span>
                        <span className="text-gray-400 text-sm">{team.members.length} total</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {team.members.slice(0, 3).map((member, index) => (
                            <div
                              key={index}
                              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-zinc-900 flex items-center justify-center"
                            >
                              <span className="text-white text-sm font-medium">{member.name.charAt(0)}</span>
                            </div>
                          ))}
                          {team.members.length > 3 && (
                            <div className="w-10 h-10 bg-zinc-800 border-2 border-zinc-900 rounded-full flex items-center justify-center">
                              <span className="text-gray-400 text-sm font-medium">+{team.members.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setManageTeamModal(team)
                        }}
                        className="flex items-center gap-2 flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                          />
                        </svg>
                        Manage
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setInviteTeamModal(team)
                        }}
                        className="flex items-center gap-2 flex-1 px-4 py-3 bg-[#ddf928] text-black font-medium rounded-lg hover:bg-[#ddf928]/90 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                        Invite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeSection === "subscribe" ? (
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
              <p className="text-gray-400 text-lg">Select the perfect plan for your needs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 hover:border-[rgba(42,42,42,0.8)] transition-all duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    $0<span className="text-lg text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-400 text-sm">For people looking to explore.</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    5 messages per day
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    1 generation mode
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 5 projects
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Export HTML/CSS
                  </li>
                </ul>

                <button className="w-full py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors">
                  Start Building
                </button>
              </div>

              {/* Premium Plan */}
              <div className="relative bg-gradient-to-br from-[#ddf928]/10 to-[#ddf928]/5 border-2 border-[#ddf928]/50 rounded-2xl p-8 hover:border-[#ddf928]/70 transition-all duration-300 transform hover:scale-105">
                {/* Recommended Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#ddf928] text-black text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    Recommended
                  </div>
                </div>

                <div className="text-center mb-8 mt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    $20<span className="text-lg text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-400 text-sm">For higher limits and power users.</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    100 generations per day
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    All generation modes
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited projects
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Export HTML/CSS
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Access to Clone extension
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Shopify theme import
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Project history
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                </ul>

                <button className="w-full py-3 bg-[#ddf928] text-black font-bold rounded-xl hover:bg-[#ddf928]/90 transition-colors shadow-lg">
                  Upgrade to Premium
                </button>
              </div>

              {/* Team Plan */}
              <div className="bg-[rgba(26,26,26,0.8)] border border-[rgba(42,42,42,0.5)] rounded-2xl p-8 hover:border-[rgba(42,42,42,0.8)] transition-all duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Team</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    $30<span className="text-lg text-gray-400">/user/month</span>
                  </div>
                  <p className="text-gray-400 text-sm">For fast moving teams and collaboration.</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Everything in Premium
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited generations
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Team collaboration
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Project sharing
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Centralized management
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Private API
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <svg
                      className="w-5 h-5 text-[#ddf928] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Dedicated 24/7 support
                  </li>
                </ul>

                <button className="w-full py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors">
                  Start a Team plan
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Section Not Found</h1>
            <p className="text-gray-400 text-lg">This section is under development.</p>
          </div>
        )}
      </div>

      {/* Join Team Modal */}
      {isJoinTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Join a Team</h3>
              <button onClick={() => setIsJoinTeamModalOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label htmlFor="teamCode" className="block text-sm font-medium text-gray-300 mb-2">
                Enter 6-digit Team Code
              </label>
              <input
                type="text"
                id="teamCode"
                maxLength={6}
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ddf928] focus:ring-1 focus:ring-[#ddf928] transition-all"
                placeholder="123456"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsJoinTeamModalOpen(false)}
                className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinTeam}
                className="flex-1 px-4 py-3 bg-[#ddf928] text-black font-medium rounded-lg hover:bg-[#ddf928]/90 transition-colors"
              >
                Join Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create a Team</h3>
              <button onClick={() => setIsCreateTeamModalOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-300 mb-2">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ddf928] focus:ring-1 focus:ring-[#ddf928] transition-all"
                placeholder="Enter team name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="teamType" className="block text-sm font-medium text-gray-300 mb-2">
                Team Type
              </label>
              <select
                id="teamType"
                value={newTeamData.type}
                onChange={(e) => setNewTeamData({ ...newTeamData, type: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-[#ddf928] focus:ring-1 focus:ring-[#ddf928] transition-all"
              >
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="marketing">Marketing</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-300 mb-2">
                Max Members
              </label>
              <input
                type="number"
                id="maxMembers"
                value={newTeamData.maxMembers}
                onChange={(e) =>
                  setNewTeamData({ ...newTeamData, maxMembers: Number.parseInt(e.target.value, 10) || 10 })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#ddf928] focus:ring-1 focus:ring-[#ddf928] transition-all"
                placeholder="Enter max members"
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">Permissions</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTeamData.permissions.canInvite}
                    onChange={(e) =>
                      setNewTeamData({
                        ...newTeamData,
                        permissions: { ...newTeamData.permissions, canInvite: e.target.checked },
                      })
                    }
                    className="rounded text-[#ddf928] focus:ring-[#ddf928]"
                  />
                  <span className="text-sm text-gray-300">Can Invite</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTeamData.permissions.canEdit}
                    onChange={(e) =>
                      setNewTeamData({
                        ...newTeamData,
                        permissions: { ...newTeamData.permissions, canEdit: e.target.checked },
                      })
                    }
                    className="rounded text-[#ddf928] focus:ring-[#ddf928]"
                  />
                  <span className="text-sm text-gray-300">Can Edit</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTeamData.permissions.canDelete}
                    onChange={(e) =>
                      setNewTeamData({
                        ...newTeamData,
                        permissions: { ...newTeamData.permissions, canDelete: e.target.checked },
                      })
                    }
                    className="rounded text-[#ddf928] focus:ring-[#ddf928]"
                  />
                  <span className="text-sm text-gray-300">Can Delete</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsCreateTeamModalOpen(false)}
                className="flex-1 px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                className="flex-1 px-4 py-3 bg-[#ddf928] text-black font-medium rounded-lg hover:bg-[#ddf928]/90 transition-colors"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Team Modal */}
      {manageTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Manage Team</h3>
              <button onClick={() => setManageTeamModal(null)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-white mb-2">Team Members</h4>
              <ul>
                {manageTeamModal.members.map((member) => (
                  <li key={member.email} className="flex items-center justify-between py-2 border-b border-zinc-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{member.name}</p>
                        <p className="text-gray-400 text-xs">{member.email}</p>
                      </div>
                    </div>
                    {member.role !== "owner" ? (
                      <button
                        onClick={() => handleRemoveMember(manageTeamModal.id, member.email)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">Owner</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => handleLeaveTeam(manageTeamModal.id, "you@example.com")}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Leave Team
              </button>
              <button
                onClick={() => handleDeleteTeam(manageTeamModal.id)}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Delete Team
              </button>
              <button
                onClick={() => setManageTeamModal(null)}
                className="px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Team Modal */}
      {inviteTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            {/* Contenu du modal */}
          </div>
        </div>
      )}
    </div>
  )
}
