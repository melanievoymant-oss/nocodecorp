import { useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, Search, AlertCircle, Clock } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { CreateTicketModal } from "./CreateTicketModal"
import type { Project, Ticket, TicketStatus } from "../types"
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

    const filteredTickets = tickets.filter(t =>
        t.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

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

    const getPriorityBadgeVariant = (level: string) => {
        switch (level) {
            case "Forte": return "destructive"
            case "Moyenne": return "warning"
            case "Faible": return "success"
            default: return "outline"
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
                    <p className="text-muted-foreground">Bienvenue sur votre espace client NoCodeCorp.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nouveau Ticket
                </Button>
            </div>

            {/* Projects Section */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Mes Projets Actifs</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map(project => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{project.nom}</CardTitle>
                                    <Badge variant={project.statut === "En cours" ? "default" : "secondary"}>
                                        {project.statut}
                                    </Badge>
                                </div>
                                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {project.ticketIds.length} tickets associés
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Tickets Section */}
            <section>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold">Tickets Récents</h2>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un ticket..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-card">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
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
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Aucun ticket trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map(ticket => {
                                        const project = projects.find(p => p.id === ticket.projectId)
                                        const isLate = isTicketLate(ticket)
                                        const daysRemaining = getDaysRemaining(ticket.deadline)

                                        return (
                                            <tr key={ticket.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{ticket.titre}</span>
                                                        <span className="text-xs text-muted-foreground md:hidden">{project?.nom}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle hidden md:table-cell">{project?.nom}</td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={getPriorityBadgeVariant(ticket.priorityLevel)}>
                                                        {ticket.priorityLevel} ({ticket.priorityScore})
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={getStatusBadgeVariant(ticket.statut)}>
                                                        {ticket.statut}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span>{format(parseISO(ticket.deadline), "dd MMM", { locale: fr })}</span>
                                                        <span className="text-xs text-muted-foreground">({daysRemaining}j)</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {isLate ? (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <AlertCircle className="h-3 w-3" /> OUI
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
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
