export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log("🖼️ Conversion du fichier en base64:", file.name, file.type, file.size)

    const reader = new FileReader()

    reader.onload = () => {
      try {
        const result = reader.result as string
        // Extraire seulement la partie base64 (après la virgule)
        const base64Data = result.split(",")[1]
        console.log("✅ Conversion réussie, taille base64:", base64Data.length)
        resolve(base64Data)
      } catch (error) {
        console.error("❌ Erreur lors de l'extraction base64:", error)
        reject(error)
      }
    }

    reader.onerror = () => {
      console.error("❌ Erreur lors de la lecture du fichier")
      reject(new Error("Erreur lors de la lecture du fichier"))
    }

    // Lire le fichier comme Data URL
    reader.readAsDataURL(file)
  })
}
