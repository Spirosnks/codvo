import type React from "react"

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1a1a1a] text-center p-6 text-sm text-gray-400 border-t border-[#2a2a2a]">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="font-bold text-white">
              Code<span className="text-[#ddf928]">Weaver</span>
            </span>{" "}
            - Transform ideas into code instantly
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-[#ddf928] transition-colors">
              Contact
            </a>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">© {new Date().getFullYear()} CodeWeaver. All rights reserved.</div>
      </div>
    </footer>
  )
}

export default Footer
