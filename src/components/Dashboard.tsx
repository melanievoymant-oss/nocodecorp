import { useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, Search, AlertCircle, Clock } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { CreateTicketModal } from "./CreateTicketModal"
import type { Project, Ticket, TicketStatus, ProjectStatus } from "../types"
import { getDaysRemaining, isTicketLate } from "../lib/formulas"

interface DashboardProps {
    projects: Project[]
    tickets: Ticket[]
    clientId: string
    onTicketCreate: (ticket: Ticket) => void
}

export function Dashboard({ projects, tickets, clientId, onTicketCreate }: DashboardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [projectSearchTerm, setProjectSearchTerm] = useState("")
    const [projectFilter, setProjectFilter] = useState<"active" | "all">("active")
    const [ticketFilter, setTicketFilter] = useState<"active" | "all">("active")

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.nom.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(projectSearchTerm.toLowerCase())

        if (!matchesSearch) return false
        if (projectFilter === "active") return p.statut !== "Terminé"
        return true
    })

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false
        if (ticketFilter === "active") return t.statut !== "Traité"
        return true
    })

    const getStatusBadgeVariant = (status: TicketStatus) => {
        switch (status) {
            case "Nouveau": return "secondary"
            case "En cours": return "default" // Blue
            case "A traiter": return "warning"
            case "Stand-By": return "outline"
            case "Traité": return "success"
            case "Hors délai": return "destructive"
            default: return "outline"
        }
    }

    const getProjectStatusBadgeVariant = (status: ProjectStatus) => {
        switch (status) {
            case "En cours": return "default" // Blue
            case "Terminé": return "success" // Green
            case "En pause": return "secondary" // Gray
            default: return "outline"
        }
    }

    const getPriorityBadgeVariant = (level: string) => {
        switch (level) {
            case "Forte": return "destructive"
            case "Moyenne": return "warning"
            case "Faible": return "success"
            default: return "outline"
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Tableau de bord</h1>
                    <p className="text-muted-foreground">Bienvenue sur votre espace client NoCodeCorp.</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto bg-secondary hover:bg-secondary/90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                >
                    <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> Nouveau Ticket
                </Button>
            </div>

            {/* Projects Section */}
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-primary">Mes Projets</h2>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => setProjectFilter("active")}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-300 ${projectFilter === "active"
                                    ? "bg-white text-primary shadow-sm scale-105"
                                    : "text-muted-foreground hover:text-primary hover:bg-white/50"
                                    }`}
                            >
                                En cours
                            </button>
                            <button
                                onClick={() => setProjectFilter("all")}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-300 ${projectFilter === "all"
                                    ? "bg-white text-primary shadow-sm scale-105"
                                    : "text-muted-foreground hover:text-primary hover:bg-white/50"
                                    }`}
                            >
                                Tous
                            </button>
                        </div>
                    </div>
                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                        <Input
                            placeholder="Rechercher un projet..."
                            className="pl-8 transition-all duration-300 focus:ring-secondary/20 focus:border-secondary"
                            value={projectSearchTerm}
                            onChange={(e) => setProjectSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50">
                            Aucun projet {projectFilter === "active" ? "en cours" : ""} trouvé.
                        </div>
                    ) : (
                        filteredProjects.map((project, idx) => (
                            <Card
                                key={project.id}
                                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-l-4 border-l-transparent hover:border-l-secondary group animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.nom}</CardTitle>
                                        <Badge variant={getProjectStatusBadgeVariant(project.statut)} className="transition-transform group-hover:scale-105">
                                            {project.statut}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-secondary/50" />
                                        {tickets.filter(t => t.projectId === project.id || (t.projectName && t.projectName === project.nom)).length} tickets associés
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </section>

            {/* Tickets Section */}
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-primary">Tickets Récents</h2>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => setTicketFilter("active")}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-300 ${ticketFilter === "active"
                                    ? "bg-white text-primary shadow-sm scale-105"
                                    : "text-muted-foreground hover:text-primary hover:bg-white/50"
                                    }`}
                            >
                                En cours
                            </button>
                            <button
                                onClick={() => setTicketFilter("all")}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-300 ${ticketFilter === "all"
                                    ? "bg-white text-primary shadow-sm scale-105"
                                    : "text-muted-foreground hover:text-primary hover:bg-white/50"
                                    }`}
                            >
                                Tous
                            </button>
                        </div>
                    </div>
                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                        <Input
                            placeholder="Rechercher un ticket..."
                            className="pl-8 transition-all duration-300 focus:ring-secondary/20 focus:border-secondary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b bg-slate-50/50">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Titre</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Projet</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Priorité</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Statut</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Deadline</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Retard</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-32 text-center text-muted-foreground">
                                            Aucun ticket trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((ticket, idx) => {
                                        const project = projects.find(p => p.id === ticket.projectId)
                                        const projectName = project?.nom || ticket.projectName || "Projet inconnu"
                                        const isLate = isTicketLate(ticket)
                                        const daysRemaining = getDaysRemaining(ticket.deadline)

                                        return (
                                            <tr
                                                key={ticket.id}
                                                className="border-b transition-all duration-200 hover:bg-slate-50 hover:scale-[1.002] cursor-default animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <td className="p-4 align-middle font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="text-primary font-semibold">{ticket.titre}</span>
                                                        <span className="text-xs text-muted-foreground md:hidden">{projectName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle hidden md:table-cell text-muted-foreground">{projectName}</td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={getPriorityBadgeVariant(ticket.priorityLevel)} className="hover:scale-105 transition-transform">
                                                        {ticket.priorityLevel} ({ticket.priorityScore})
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={getStatusBadgeVariant(ticket.statut)} className="hover:scale-105 transition-transform">
                                                        {ticket.statut}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{format(parseISO(ticket.deadline), "dd MMM", { locale: fr })}</span>
                                                        <span className="text-xs">({daysRemaining}j)</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {isLate ? (
                                                        <Badge variant="destructive" className="gap-1 animate-pulse">
                                                            <AlertCircle className="h-3 w-3" /> OUI
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs font-mono">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <CreateTicketModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                projects={projects}
                clientId={clientId}
                onSubmit={onTicketCreate}
            />
        </div>
    )
}
