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
        isScrolled ? "py-0 backdrop-blur-xl bg-[rgba(26,26,26,0.8)] shadow-2xl" : "py-0 bg-transparent"
      }`}
      style={{
        backdropFilter: isScrolled ? "blur(20px) saturate(180%)" : "none",
      }}
    >
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`rounded-xl overflow-hidden shadow-lg transition-all duration-500 ease-in-out ${
                isScrolled ? "w-28 h-28" : "w-32 h-32"
              }`}
            >
              <img src="/images/new-logo.png" alt="Codro Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="hidden md:flex space-x-6">
            <a
              href="#features"
              className={`text-gray-300 hover:text-[#ddf928] transition-all duration-300 font-medium ${
                isScrolled ? "text-sm" : "text-base"
              }`}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className={`text-gray-300 hover:text-[#ddf928] transition-all duration-300 font-medium ${
                isScrolled ? "text-sm" : "text-base"
              }`}
            >
              How It Works
            </a>
            <a
              href="#examples"
              className={`text-gray-300 hover:text-[#ddf928] transition-all duration-300 font-medium ${
                isScrolled ? "text-sm" : "text-base"
              }`}
            >
              Examples
            </a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleGetStarted}
              className={`bg-[#ddf928] hover:bg-[#b9cc21] text-[#1a1a1a] rounded-md font-medium transition-all duration-500 shadow-md hover:shadow-lg transform hover:scale-105 ${
                isScrolled ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-base"
              }`}
            >
              Get Started
            </button>
            <button
              onClick={handleLogin}
              className={`bg-[#1a1a1a] hover:bg-[#ddf928] hover:text-[#1a1a1a] text-[#ddf928] border border-[#ddf928] rounded-md font-medium transition-all duration-500 shadow-md hover:shadow-lg hover:shadow-[#ddf928]/20 transform hover:scale-105 ${
                isScrolled ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-base"
              }`}
            >
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Effet de particules/gradient subtil */}
      {isScrolled && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(221, 249, 40, 0.1) 0%, transparent 70%)",
          }}
        />
      )}

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
