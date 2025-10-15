import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MainContent } from "@/components/layout/main-content"
import type { DashboardPlugin } from "@/plugins/plugin"

function App() {
  const [selectedPlugin, setSelectedPlugin] = useState<DashboardPlugin | null>(
    null
  )

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex h-screen">
        <Sidebar onSelectPlugin={setSelectedPlugin} />
        <div className="flex flex-col flex-1">
          <Header />
          <MainContent selectedPlugin={selectedPlugin} />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
