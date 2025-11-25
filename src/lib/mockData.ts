import type { ChefDeProjet, Client, Freelance, Project, Ticket } from "../types"

export const MOCK_CLIENTS: Client[] = [
    {
        id: "cli_1",
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@startup.io",
        entreprise: "Startup IO",
        statutEmail: "Valid",
        projectIds: ["proj_1", "proj_2"]
    }
]

export const MOCK_PMS: ChefDeProjet[] = [
    {
        id: "pm_1",
        nom: "Martin",
        prenom: "Sophie",
        email: "sophie.martin@nocodecorp.com",
        telephone: "0600000000",
        specialite: "Web"
    }
]

export const MOCK_FREELANCES: Freelance[] = [
    {
        id: "free_1",
        nom: "Bernard",
        prenom: "Lucas",
        email: "lucas.bernard@freelance.com",
        telephone: "0611111111",
        domaine: "Développement",
        ticketIds: ["tick_1"]
    },
    {
        id: "free_2",
        nom: "Petit",
        prenom: "Marie",
        email: "marie.petit@design.com",
        telephone: "0622222222",
        domaine: "Design",
        ticketIds: []
    }
]

export const MOCK_PROJECTS: Project[] = [
    {
        id: "proj_1",
        nom: "Refonte Site Web",
        description: "Refonte complète du site vitrine avec React.",
        clientId: "cli_1",
        chefDeProjetId: "pm_1",
        statut: "En cours",
        ticketIds: ["tick_1", "tick_2"]
    },
    {
        id: "proj_2",
        nom: "Application Mobile MVP",
        description: "Développement du MVP de l'application mobile.",
        clientId: "cli_1",
        chefDeProjetId: "pm_1",
        statut: "En pause",
        ticketIds: []
    }
]

export const MOCK_TICKETS: Ticket[] = [
    {
        id: "tick_1",
        titre: "Bug affichage menu mobile",
        description: "Le menu hamburger ne s'ouvre pas sur iPhone.",
        type: "Bug",
        projectId: "proj_1",
        clientId: "cli_1",
        freelanceId: "free_1",
        q1: 5, // Impact fort
        q2: 5, // Tous utilisateurs
        q3: 5, // Blocage total
        q4: 5, // Urgent
        priorityScore: 5.0,
        priorityLevel: "Forte",
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
        deadline: new Date(Date.now() - 86400000).toISOString(), // Yesterday (Late!)
        statut: "En cours"
    },
    {
        id: "tick_2",
        titre: "Ajout page contact",
        description: "Créer une page de contact avec formulaire.",
        type: "Nouvelle fonctionnalité",
        projectId: "proj_1",
        clientId: "cli_1",
        q1: 2,
        q2: 1,
        q3: 1,
        q4: 2,
        priorityScore: 1.5,
        priorityLevel: "Faible",
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        statut: "Nouveau"
    }
]
