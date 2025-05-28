"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface SignUpModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulation d'une requête API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    onSuccess()
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
        .google-button {
          background: #000;
          color: white;
          border: 1px solid #262626;
          transition: all 0.3s ease;
        }
        .google-button:hover {
          background: #111;
          border-color: #404040;
        }
        .github-button {
          background: #000;
          color: white;
          border: 1px solid #262626;
          transition: all 0.3s ease;
        }
        .github-button:hover {
          background: #111;
          border-color: #404040;
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
                  CREATE ACCOUNT
                </span>
                <h2 className="text-2xl font-bold text-white">Sign Up</h2>
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
                  REGISTRATION
                </span>
                <h3 className="text-xl font-semibold text-neutral-200 mb-4">Create Account</h3>

                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="signup-email" className="lime-accent text-xs font-medium block mb-1">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      id="signup-email"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-2 lime-focus text-sm"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="lime-accent text-xs font-medium block mb-1">
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      id="signup-password"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-200 focus:outline-none focus:ring-2 lime-focus text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      className="w-4 h-4 bg-neutral-800 border-neutral-700 rounded mr-2 mt-0.5 accent-[#ddf928]"
                      required
                    />
                    <label htmlFor="terms" className="text-neutral-400 text-xs">
                      I agree to the{" "}
                      <a href="#" className="lime-accent hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="lime-accent hover:underline">
                        Privacy Policy
                      </a>
                    </label>
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
                          Creating account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </button>

                    <div className="divider-gradient my-4"></div>

                    <button
                      type="button"
                      className="w-full px-4 py-2.5 google-button rounded-lg flex items-center justify-center font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign up with Google
                    </button>

                    <button
                      type="button"
                      className="w-full px-4 py-2.5 github-button rounded-lg flex items-center justify-center font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      Sign up with GitHub
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-6 pt-4 text-center">
                <div className="divider-gradient mb-4"></div>
                <p className="text-neutral-400 text-xs">
                  Already have an account?{" "}
                  <a href="#" className="lime-accent hover:underline">
                    Sign In
                  </a>
                </p>
                <div className="flex items-center justify-center mt-4 space-x-2">
                  <span className="w-2 h-2 rounded-full lime-bg"></span>
                  <span className="text-neutral-400 text-xs">System Status: Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignUpModal
