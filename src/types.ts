export type PriorityLevel = "Faible" | "Moyenne" | "Forte"
export type TicketStatus = "Nouveau" | "Stand-By" | "A traiter" | "En cours" | "Hors délai" | "Traité"
export type TicketType = "Bug" | "Nouvelle fonctionnalité" | "Support" | "Design" | "Développement"
export type ProjectStatus = "En cours" | "Terminé" | "En pause"
export type ClientEmailStatus = "Valid" | "Invalid" | "En attente de mise à jour"

export interface Client {
    id: string
    nom: string
    prenom: string
    email: string
    entreprise: string
    statutEmail: ClientEmailStatus
    projectIds: string[]
}

export interface ChefDeProjet {
    id: string
    nom: string
    prenom: string
    email: string
    telephone: string
    specialite: "Web" | "Mobile" | "Data" | "E-commerce"
}

export interface Freelance {
    id: string
    nom: string
    prenom: string
    email: string
    telephone: string
    domaine: "Développement" | "Graphisme" | "Design" | "SEO" | "Marketing"
    ticketIds: string[]
}

export interface Project {
    id: string
    nom: string
    description: string
    clientId: string
    chefDeProjetId: string
    statut: ProjectStatus
    ticketIds: string[]
}

export interface Ticket {
    id: string
    titre: string
    description: string
    type: TicketType
    projectId: string
    projectName?: string // Fallback if ID lookup fails
    clientId: string
    freelanceId?: string

    // Priority Questions
    q1: number // Impact activité (1-5)
    q2: number // Nb utilisateurs (1-5)
    q3: number // Blocage total (1-5)
    q4: number // Délai souhaité (1-5)

    priorityScore: number
    priorityLevel: PriorityLevel

    createdAt: string // ISO Date
    deadline: string // ISO Date

    statut: TicketStatus
    notes?: string
}
