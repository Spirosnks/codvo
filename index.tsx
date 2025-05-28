import React from "react"
import { createRoot } from "react-dom/client" // Use named import instead
import App from "./App"

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Could not find root element to mount to")
}

const root = createRoot(rootElement) // Use named import
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
