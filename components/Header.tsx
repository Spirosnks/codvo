"use client"

import type React from "react"
import { useState, useEffect } from "react"
import LoginModal from "./LoginModal"
import SignUpModal from "./SignUpModal"

interface HeaderProps {
  onLogin?: () => void
  onSignUp?: () => void
}

const Header: React.FC<HeaderProps> = ({ onLogin, onSignUp }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)

  const handleGetStarted = () => {
    setIsSignUpModalOpen(true)
  }

  const handleLogin = () => {
    setIsLoginModalOpen(true)
  }

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false)
    onLogin?.()
  }

  const handleSignUpSuccess = () => {
    setIsSignUpModalOpen(false)
    onSignUp?.()
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isScrolled ? "py-4" : "py-6"
      }`}
    >
      <div className="flex justify-center">
        <div
          className={`flex items-center justify-between backdrop-blur-xl bg-[rgba(26,26,26,0.8)] rounded-full shadow-2xl transition-all duration-500 ease-in-out ${
            isScrolled ? "px-4 py-2 max-w-4xl w-[90%]" : "px-6 py-3 max-w-5xl w-[95%]"
          }`}
          style={{
            boxShadow:
              "rgba(34, 42, 53, 0.06) 0px 0px 24px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px, rgba(34, 42, 53, 0.04) 0px 0px 0px 1px, rgba(34, 42, 53, 0.08) 0px 0px 4px 0px, rgba(47, 48, 55, 0.05) 0px 16px 68px 0px, rgba(255, 255, 255, 0.1) 0px 1px 0px 0px inset",
          }}
        >
          {/* Logo Section */}
          <div className="flex items-center">
            <div
              className={`rounded-full overflow-hidden shadow-lg transition-all duration-500 ease-in-out ${
                isScrolled ? "w-12 h-12" : "w-16 h-16"
              }`}
            >
              <img src="/images/new-logo.png" alt="Codro Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center justify-center flex-1 absolute left-0 right-0 pointer-events-none">
            <div className="flex items-center space-x-8 pointer-events-auto">
              <a
                href="#features"
                className={`text-gray-300 hover:text-[#ddf928] transition-all duration-300 font-medium relative flex items-center ${
                  isScrolled ? "text-sm" : "text-base"
                }`}
              >
                Features
                <span className="ml-2 bg-[rgba(221,249,40,0.1)] text-[#ddf928] text-xs font-bold px-2 py-0.5 rounded-full border border-[#ddf928] shadow-[0_0_10px_rgba(221,249,40,0.3)]">
                  NEW
                </span>
              </a>
              <a
                href="#how-it-works"
                className={`text-gray-300 hover:text-[#ddf928] transition-all duration-300 font-medium relative ${
                  isScrolled ? "text-sm" : "text-base"
                }`}
              >
                How It Works
              </a>
              <a
                href="#examples"
                className={`text-gray-300 hover:text-[#ddf928] transition-all duration-300 font-medium relative ${
                  isScrolled ? "text-sm" : "text-base"
                }`}
              >
                Examples
              </a>
              <a
                href="#pricing"
                className={`text-gray-300 hover:text-[#ddf928] transition-all duration-300 font-medium relative ${
                  isScrolled ? "text-sm" : "text-base"
                }`}
              >
                Pricing
              </a>
            </div>
          </div>

          {/* Auth Buttons - Right */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogin}
              className={`text-[#ddf928] transition-all duration-300 font-medium ${
                isScrolled ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-base"
              }`}
            >
              Login
            </button>
            <button
              onClick={handleGetStarted}
              className={`bg-[#ddf928] hover:bg-[#b9cc21] text-[#1a1a1a] rounded-full font-medium transition-all duration-500 shadow-md hover:shadow-lg transform hover:scale-105 ${
                isScrolled ? "px-4 py-2 text-sm" : "px-6 py-2.5 text-base"
              }`}
              style={{
                filter: "drop-shadow(rgba(221, 249, 40, 0.4) 2px 0px 10px)",
              }}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onSuccess={handleLoginSuccess} />

      {/* SignUp Modal */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSuccess={handleSignUpSuccess}
      />
    </header>
  )
}

export default Header
