"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "code" | "password">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")

  useEffect(() => {
    if (isOpen && vantaRef.current && typeof window !== "undefined") {
      // Charger les scripts Vanta.js dynamiquement
      const loadVanta = async () => {
        // Charger Three.js
        if (!window.THREE) {
          const threeScript = document.createElement("script")
          threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
          document.head.appendChild(threeScript)
          await new Promise((resolve) => (threeScript.onload = resolve))
        }

        // Charger Vanta.js
        if (!window.VANTA) {
          const vantaScript = document.createElement("script")
          vantaScript.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"
          document.head.appendChild(vantaScript)
          await new Promise((resolve) => (vantaScript.onload = resolve))
        }

        // Initialiser l'effet Vanta
        if (window.VANTA && vantaRef.current) {
          vantaEffect.current = window.VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 150,
            minWidth: 200,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0xddf928,
            backgroundColor: 0x171717,
            points: 8,
            maxDistance: 20.0,
            spacing: 18.0,
            showDots: true,
          })
        }
      }

      loadVanta()
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulation d'envoi d'email
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    setStep("code")
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulation de vérification du code
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    setStep("password")
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulation de changement de mot de passe
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    onSuccess()
  }

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Reset Password"
      case "code":
        return "Verify Code"
      case "password":
        return "New Password"
      default:
        return "Reset Password"
    }
  }

  const getStepSubtitle = () => {
    switch (step) {
      case "email":
        return "Enter your email to receive a reset code"
      case "code":
        return `Enter the code sent to ${email}`
      case "password":
        return "Create your new password"
      default:
        return "Password Recovery"
    }
  }

  return (
    <>
      <style jsx>{`
        .card-container {
          position: relative;
          z-index: 0;
        }
        .card-container::before {
          content: "";
          position: absolute;
          inset: -1px;
          background: linear-gradient(to bottom right, #ddf928, rgba(221, 249, 40, 0.3), #262626);
          border-radius: 0.75rem;
          z-index: -1;
        }
        .card-content {
          border-radius: 0.75rem;
          overflow: hidden;
          background: #171717;
        }
        .divider-gradient {
          height: 1px;
          background: linear-gradient(to right, transparent, #ddf928, transparent);
        }
        .lime-accent {
          color: #ddf928;
        }
        .lime-bg {
          background-color: #ddf928;
        }
        .lime-border {
          border-color: #ddf928;
        }
        .lime-focus:focus {
          ring-color: #ddf928;
          border-color: #ddf928;
        }
        .lime-button {
          background: linear-gradient(135deg, #ddf928, #c4e821);
          color: #000;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(221, 249, 40, 0.2);
        }
        .lime-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        .lime-button:hover::before {
          left: 100%;
        }
        .lime-button:hover {
          background: linear-gradient(135deg, #c4e821, #ddf928);
          box-shadow: 0 6px 20px rgba(221, 249, 40, 0.3);
          transform: translateY(-1px);
        }
        .secondary-button {
          background: #262626;
          color: #ddf928;
          border: 1px solid #404040;
          transition: all 0.3s ease;
        }
        .secondary-button:hover {
          background: #333;
          border-color: #ddf928;
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        {/* Backdrop flou */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
          }}
        />

        {/* Modal content */}
        <div className="relative max-w-md w-full card-container">
          <div className="card-content shadow-lg backdrop-blur-sm">
            <div className="h-[150px] relative" ref={vantaRef}>
              <div className="absolute top-4 left-4 z-10">
                <span className="px-2 py-1 bg-neutral-800/80 rounded-full text-xs lime-accent mb-2 inline-block">
                  PASSWORD RECOVERY
                </span>
                <h2 className="text-2xl font-bold text-white">{getStepTitle()}</h2>
                <div className="h-1 w-12 lime-bg mt-2 rounded-full"></div>
              </div>

              {/* Bouton de fermeture */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 text-white hover:text-[#ddf928] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex flex-col bg-neutral-900">
              <div>
                <span className="px-2 py-1 bg-neutral-800 rounded-full text-xs lime-accent mb-2 inline-block">
                  STEP {step === "email" ? "1" : step === "code" ? "2" : "3"} OF 3
                </span>
                <h3 className="text-xl font-semibold text-neutral-200 mb-2">{getStepTitle()}</h3>
                <p className="text-neutral-400 text-sm mb-6">{getStepSubtitle()}</p>

                {/* Step 1: Email */}
                {step === "email" && (
                  <form onSubmit={handleEmailSubmit} className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="reset-email" className="lime-accent text-xs font-medium block mb-1">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        id="reset-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-2 lime-focus text-sm"
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2.5 lime-button rounded-lg flex items-center justify-center font-medium disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
                            Sending Code...
                          </div>
                        ) : (
                          "Send Reset Code"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-4 py-2.5 secondary-button rounded-lg flex items-center justify-center font-medium"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: Code Verification */}
                {step === "code" && (
                  <form onSubmit={handleCodeSubmit} className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="verification-code" className="lime-accent text-xs font-medium block mb-1">
                        VERIFICATION CODE
                      </label>
                      <input
                        type="text"
                        id="verification-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-2 lime-focus text-sm text-center tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                      <p className="text-neutral-500 text-xs mt-1">Check your email for the 6-digit code</p>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={isLoading || code.length !== 6}
                        className="w-full px-4 py-2.5 lime-button rounded-lg flex items-center justify-center font-medium disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
                            Verifying...
                          </div>
                        ) : (
                          "Verify Code"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="w-full px-4 py-2.5 secondary-button rounded-lg flex items-center justify-center font-medium"
                      >
                        Back to Email
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: New Password */}
                {step === "password" && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="new-password" className="lime-accent text-xs font-medium block mb-1">
                        NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-2 lime-focus text-sm"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="lime-accent text-xs font-medium block mb-1">
                        CONFIRM PASSWORD
                      </label>
                      <input
                        type="password"
                        id="confirm-password"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-2 lime-focus text-sm"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2.5 lime-button rounded-lg flex items-center justify-center font-medium disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
                            Updating Password...
                          </div>
                        ) : (
                          "Update Password"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="mt-6 pt-4 text-center">
                <div className="divider-gradient mb-4"></div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 rounded-full lime-bg"></span>
                  <span className="text-neutral-400 text-xs">Secure Password Recovery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ForgotPasswordModal
