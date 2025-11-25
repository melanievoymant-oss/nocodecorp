import { useState } from "react"
import { Dashboard } from "./components/Dashboard"
import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_TICKETS } from "./lib/mockData"
import type { Ticket } from "./types"
import { LogOut, User } from "lucide-react"

import { sendTicketToMake } from "./lib/api"

function App() {
  // Simulate logged-in client
  const currentClient = MOCK_CLIENTS[0]

  const [projects] = useState(MOCK_PROJECTS)
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)

  const handleTicketCreate = async (newTicket: Ticket) => {
    // 1. Update local UI immediately (Optimistic UI)
    setTickets(prev => [newTicket, ...prev])

    // 2. Send to Make
    try {
      await sendTicketToMake(newTicket)
    } catch (error) {
      // Optional: Show error notification
      console.error("Failed to sync with Make")
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4 px-6 mx-auto">
          <div className="flex items-center gap-3 font-bold text-xl text-primary">
            <img src="/logo.jpg" alt="NoCodeCorp Logo" className="h-10 w-10 rounded-lg object-cover" />
            <span>NoCodeCorp</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{currentClient.prenom} {currentClient.nom}</span>
              <span className="hidden sm:inline text-xs border px-1 rounded">{currentClient.entreprise}</span>
            </div>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Dashboard
          projects={projects}
          tickets={tickets}
          clientId={currentClient.id}
          onTicketCreate={handleTicketCreate}
        />
      </main>
    </div>
  )
}

export default App
