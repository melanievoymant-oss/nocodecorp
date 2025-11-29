import { useState, useEffect, useCallback } from "react"
import { Dashboard } from "./components/Dashboard"
import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_TICKETS } from "./lib/mockData"
import type { Ticket, Project, TicketStatus } from "./types"
import { LogOut, User } from "lucide-react"
import { Button } from "./components/ui/button"

import { sendTicketToMake, fetchFullClientData } from "./lib/api"
import type { Client } from "./types"

const SESSION_KEY = "nocodecorp_session"
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

function App() {
  // State for authentication
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientData, setClientData] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Data state
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)

  // URL for the Airtable Form to update contact info
  const UPDATE_INFO_FORM_URL = "https://tally.so/r/VLpLqj"


  // Helper to process login data
  const processLoginData = useCallback((data: any, email: string) => {
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
  }, [])

  const loginUser = useCallback(async (params: { email?: string; clientId?: string }) => {
    try {
      // 1. Try to fetch from API (Real Data)
      const data = await fetchFullClientData(params)
      console.log("API Response (Raw):", data)

      if (processLoginData(data, params.email || "")) {
        return
      }

      // 2. Fallback to Mock Data (for demo/testing if API fails or returns nothing)
      const foundMock = MOCK_CLIENTS.find(c =>
        (params.email && c.email.toLowerCase() === params.email) ||
        (params.clientId && c.id === params.clientId)
      )
      if (foundMock) {
        setClientId(foundMock.id)
        // Save session for mock login too
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          email: foundMock.email,
          lastActive: Date.now()
        }))
        return
      }

      // 3. Not found
    } catch (error: any) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [processLoginData])

  const handleLogout = useCallback(() => {
    setClientId(null)
    setClientData(null)
    setClientData(null)
    localStorage.removeItem(SESSION_KEY)
    // Clear URL params
    window.history.replaceState({}, document.title, window.location.pathname)
  }, [])

  // Check URL for clientId on mount or restore session
  useEffect(() => {
    const initSession = async () => {
      const params = new URLSearchParams(window.location.search)
      const urlClientId = params.get("clientId")

      if (urlClientId) {
        await loginUser({ clientId: urlClientId })
      } else {
        // Restore session
        const storedSession = localStorage.getItem(SESSION_KEY)
        let sessionRestored = false
        if (storedSession) {
          try {
            const { email, lastActive } = JSON.parse(storedSession)
            if (email && lastActive) {
              // Check inactivity
              if (Date.now() - lastActive < INACTIVITY_TIMEOUT) {
                await loginUser({ email })
                sessionRestored = true
              } else {
                localStorage.removeItem(SESSION_KEY) // Expired
              }
            }
          } catch (e) {
            localStorage.removeItem(SESSION_KEY)
          }
        }

        if (!sessionRestored) {
          setIsLoading(false)
        }
      }
    }

    initSession()
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

  // Auto-refresh data when window becomes visible (more reliable than focus)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && clientId) {
        console.log("Tab became visible, refreshing data...")
        // Small delay to allow Airtable/Make to finish processing
        setTimeout(() => {
          loginUser({ clientId })
        }, 1000)
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [clientId, loginUser])

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
    // Determine status based on email validity
    const emailStatus = currentClient.statutEmail ? currentClient.statutEmail.trim().toLowerCase() : ""
    console.log("Creating ticket. Client Email Status:", currentClient.statutEmail, "Normalized:", emailStatus)

    const isInvalidEmail = emailStatus === "invalid" || emailStatus === "invalide"
    const status: TicketStatus = isInvalidEmail ? "Stand-By" : "Nouveau"

    // Override clientId with the actual logged-in ID and set correct status
    const ticketWithAuth = {
      ...newTicket,
      clientId: clientId || "unknown",
      statut: status
    }

    // 1. Update local UI immediately (Optimistic UI)
    setTickets(prev => [ticketWithAuth, ...prev])

    // 2. Send to Make
    try {
      await sendTicketToMake(ticketWithAuth)

      // 3. Refresh data to ensure backend sync (with a small delay for Make to process)
      setTimeout(() => {
        if (clientId) loginUser({ clientId })
      }, 1000)

    } catch (error) {
      console.error("Failed to sync with Make")
    }
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Login Screen
  if (!clientId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex items-center justify-center mb-6">
              <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="NoCodeCorp Logo" className="h-24 w-24 rounded-xl object-cover shadow-md" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Accès Restreint</h1>
            <p className="text-muted-foreground">
              Pour accéder à votre espace client, veuillez utiliser le <strong>lien personnel</strong> qui vous a été envoyé par email.
            </p>
            <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
              Si vous avez perdu votre lien, contactez-nous directement.
            </div>
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
            <span>NoCodeCorp <span className="text-xs font-normal text-muted-foreground">v2.0</span></span>
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
        {(() => {
          const emailStatus = currentClient.statutEmail ? currentClient.statutEmail.trim().toLowerCase() : ""
          const isInvalid = emailStatus === "invalid" || emailStatus === "invalide"

          if (isInvalid) {
            return (
              <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6 mx-6 mt-6 rounded-r shadow-sm animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                      <LogOut className="h-5 w-5 text-destructive rotate-180" />
                    </div>
                    <div>
                      <h3 className="font-bold text-destructive">Action requise : Email Invalide</h3>
                      <p className="text-sm text-destructive/80">
                        Nous n'arrivons plus à vous contacter. Vos tickets sont mis en attente.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loginUser({ clientId: clientId || "" })}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      Rafraîchir
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => window.open(`${UPDATE_INFO_FORM_URL}?record_id=${clientId}`, '_blank')}
                      className="shadow-md hover:scale-105 transition-transform"
                    >
                      Mettre à jour mes infos
                    </Button>
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}
        <Dashboard
          projects={projects}
          tickets={tickets}
          clientId={currentClient.id}
          statutEmail={currentClient.statutEmail}
          onTicketCreate={handleTicketCreate}
        />
      </main>
    </div>
  )
}

export default App
