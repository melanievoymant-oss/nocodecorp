import { addDays, differenceInDays, isAfter, parseISO } from "date-fns"
import type { PriorityLevel, Ticket } from "../types"

export const calculatePriorityScore = (q1: number, q2: number, q3: number, q4: number): number => {
    // Formula: ROUND(({Question 1}*3 + {Question 2}*2 + {Question 3}*3 + {Question 4}*2) / 10, 1)
    const score = (q1 * 3 + q2 * 2 + q3 * 3 + q4 * 2) / 10
    return Math.round(score * 10) / 10
}

export const calculatePriorityLevel = (score: number): PriorityLevel => {
    // IF({Score} >= 4, "Forte", IF({Score} >= 2.5, "Moyenne", "Faible"))
    if (score >= 4) return "Forte"
    if (score >= 2.5) return "Moyenne"
    return "Faible"
}

export const calculateDeadline = (createdAt: Date, priority: PriorityLevel): Date => {
    // IF(Priorité = "Faible", +7, IF(Priorité = "Moyenne", +4, IF(Priorité = "Forte", +2)))
    if (priority === "Faible") return addDays(createdAt, 7)
    if (priority === "Moyenne") return addDays(createdAt, 4)
    return addDays(createdAt, 2) // Forte
}

export const isTicketLate = (ticket: Ticket): boolean => {
    // If status is explicitly "Hors délai", it is late.
    if (ticket.statut === "Hors délai") return true

    // Otherwise check date for active tickets
    const activeStatuses = ["En cours", "A traiter", "Nouveau"]
    if (!activeStatuses.includes(ticket.statut)) return false

    return isAfter(new Date(), parseISO(ticket.deadline))
}

export const getDaysRemaining = (deadline: string): number | string => {
    // IF(Deadline, DATETIME_DIFF(Deadline, TODAY(), 'days'), "")
    if (!deadline) return ""
    return differenceInDays(parseISO(deadline), new Date())
}
