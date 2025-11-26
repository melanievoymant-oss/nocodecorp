import { useState, useEffect, useCallback } from "react"
import { Dashboard } from "./components/Dashboard"
import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_TICKETS } from "./lib/mockData"
import type { Ticket, Project } from "./types"
import { LogOut, User, Loader2 } from "lucide-react"
import { Input } from "./components/ui/input"
import { Button } from "./components/ui/button"

import { sendTicketToMake, fetchFullClientData } from "./lib/api"
import type { Client } from "./types"

const SESSION_KEY = "nocodecorp_session"
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

function App() {
  // State for authentication
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientData, setClientData] = useState<Client | null>(null)
  const [inputEmail, setInputEmail] = useState("")
  const [loginError, setLoginError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)


  // Data state
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)

  // URL for the Airtable Form to update contact info
  // URL for the Airtable Form to update contact info
  const UPDATE_INFO_FORM_URL = "https://tally.so/r/VLpLqj"

  // Helper to process login data
  const processLoginData = (data: any, email: string) => {
    // On accepte si 'found' est vrai OU si on a reçu un ID
    // On gère aussi le cas où 'client' est directement à la racine (si l'utilisateur a mal mappé)
    const clientInfo = data.client || (data.id ? data : null)

    if (data && (data.found || (clientInfo && clientInfo.id))) {
      setClientData(clientInfo)
      setClientId(clientInfo.id)

      // Helper to safely parse array data
      const safeParse = (input: any) => {
        if (Array.isArray(input)) return input
        if (typeof input === "string") {
          try { return JSON.parse(input) } catch (e) { console.error("JSON Parse Error:", e); return [] }
        }
        return []
      }

      // Helper to normalize dates (handles DD/MM/YYYY from Airtable)
      const normalizeDate = (dateStr: string) => {
        if (!dateStr) return new Date().toISOString()

        // Check for DD/MM/YYYY format
        const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy
          return `${year}-${month}-${day}`
        }

        return dateStr
      }

      // Helper to normalize IDs (Airtable often returns arrays for linked records)
      const normalizeId = (id: any) => {
        if (Array.isArray(id)) return id[0] || ""
        return id || ""
      }

      const parsedProjects = safeParse(data.projects).map((p: any) => ({
        ...p,
        ticketIds: p.ticketIds || [],
        description: p.description || "",
        clientId: normalizeId(p.clientId) || clientInfo.id,
        statut: p.statut || "En cours"
      }))

      const parsedTickets = safeParse(data.tickets).map((t: any) => ({
        ...t,
        priorityLevel: t.priorityLevel || "Moyenne",
        priorityScore: t.priorityScore || 0,
        statut: t.statut || "Nouveau",
        deadline: normalizeDate(t.deadline),
        projectId: normalizeId(t.projectId),
        projectName: t.projectName || "" // Capture project name if provided
      }))

      if (parsedProjects.length > 0) setProjects(parsedProjects)
      if (parsedTickets.length > 0) setTickets(parsedTickets)

      // Save session
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        email,
        lastActive: Date.now()
      }))

      return true
    }
    return false
  }

  const loginUser = async (email: string) => {
    setIsLoading(true)
    try {
      // 1. Try to fetch from API (Real Data)
      const data = await fetchFullClientData(email)
      console.log("API Response (Raw):", data)

      if (processLoginData(data, email)) {
        setIsLoading(false)
        return
      }

      // 2. Fallback to Mock Data (for demo/testing if API fails or returns nothing)
      const foundMock = MOCK_CLIENTS.find(c => c.email.toLowerCase() === email)
      if (foundMock) {
        setClientId(foundMock.id)
        // Save session for mock login too
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          email,
          lastActive: Date.now()
        }))
        setIsLoading(false)
        return
      }

      // 3. Not found
      setLoginError(true)
    } catch (error: any) {
      console.error("Login error:", error)
      setLoginError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = useCallback(() => {
    setClientId(null)
    setClientData(null)
    setInputEmail("")
    setLoginError(false)
    localStorage.removeItem(SESSION_KEY)
    // Clear URL params
    window.history.replaceState({}, document.title, window.location.pathname)
  }, [])

  // Check URL for clientId on mount or restore session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlClientId = params.get("clientId")

    if (urlClientId) {
      setClientId(urlClientId)
    } else {
      // Restore session
      const storedSession = localStorage.getItem(SESSION_KEY)
      if (storedSession) {
        try {
          const { email, lastActive } = JSON.parse(storedSession)
          if (email && lastActive) {
            // Check inactivity
            if (Date.now() - lastActive < INACTIVITY_TIMEOUT) {
              loginUser(email)
            } else {
              localStorage.removeItem(SESSION_KEY) // Expired
            }
          }
        } catch (e) {
          localStorage.removeItem(SESSION_KEY)
        }
      }
    }
  }, [])

  // Inactivity Timer
  useEffect(() => {
    if (!clientId) return

    const updateActivity = () => {
      const storedSession = localStorage.getItem(SESSION_KEY)
      if (storedSession) {
        const session = JSON.parse(storedSession)
        session.lastActive = Date.now()
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      }
    }

    const checkInactivity = () => {
      const storedSession = localStorage.getItem(SESSION_KEY)
      if (storedSession) {
        const { lastActive } = JSON.parse(storedSession)
        if (Date.now() - lastActive > INACTIVITY_TIMEOUT) {
          handleLogout()
        }
      }
    }

    // Listeners for activity
    window.addEventListener("mousemove", updateActivity)
    window.addEventListener("keydown", updateActivity)
    window.addEventListener("click", updateActivity)

    // Check every minute
    const interval = setInterval(checkInactivity, 60000)

    return () => {
      window.removeEventListener("mousemove", updateActivity)
      window.removeEventListener("keydown", updateActivity)
      window.removeEventListener("click", updateActivity)
      clearInterval(interval)
    }
  }, [clientId, handleLogout])

  // Determine current client (API data > Mock data > Guest fallback)
  const currentClient = clientData ? {
    ...clientData,
    projectIds: clientData.projectIds || [] // Ensure projectIds exists
  } : (MOCK_CLIENTS.find(c => c.id === clientId) || {
    id: clientId || "guest",
    nom: "Client",
    prenom: "Invité",
    email: "client@example.com",
    entreprise: "Entreprise",
    statutEmail: "Valid",
    projectIds: []
  })

  const handleTicketCreate = async (newTicket: Ticket) => {
    // Override clientId with the actual logged-in ID
    const ticketWithAuth = { ...newTicket, clientId: clientId || "unknown" }

    // 1. Update local UI immediately (Optimistic UI)
    setTickets(prev => [ticketWithAuth, ...prev])

    // 2. Send to Make
    try {
      await sendTicketToMake(ticketWithAuth)
    } catch (error) {
      console.error("Failed to sync with Make")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(false)
    const email = inputEmail.trim().toLowerCase()
    await loginUser(email)
  }

  // Login Screen
  if (!clientId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}


        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center mb-6">
                <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="NoCodeCorp Logo" className="h-24 w-24 rounded-xl object-cover shadow-md" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Bienvenue</h1>
              <p className="text-muted-foreground">Entrez votre email pour accéder à votre espace.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="nom@entreprise.com"
                  value={inputEmail}
                  onChange={(e) => {
                    setInputEmail(e.target.value)
                    setLoginError(false)
                  }}
                  className={loginError ? "border-destructive" : ""}
                />
                {loginError && (
                  <div className="space-y-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium">
                      Email non reconnu.
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => window.open(UPDATE_INFO_FORM_URL, '_blank')}
                    >
                      Mettre à jour mes infos
                    </Button>

                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4 px-6 mx-auto">
          <div className="flex items-center gap-3 font-bold text-xl text-primary">
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="NoCodeCorp Logo" className="h-10 w-10 rounded-lg object-cover" />
            <span>NoCodeCorp</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{currentClient.prenom} {currentClient.nom}</span>
              <span className="hidden sm:inline text-xs border px-1 rounded">{currentClient.entreprise}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
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
