import type { Ticket } from "../types"

// ------------------------------------------------------------------
// CONFIGURATION
// Collez votre URL de Webhook Make ici
// ------------------------------------------------------------------
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/o2o41k4k8djqiyavt6s7l0ymd4j3um41"

export async function sendTicketToMake(ticket: Ticket) {
    if (!MAKE_WEBHOOK_URL) {
        console.warn("⚠️ Aucune URL de Webhook configurée. Les données ne sont pas envoyées.")
        console.log("Payload:", ticket)
        return
    }

    try {
        const response = await fetch(MAKE_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(ticket),
        })

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
        }

        console.log("✅ Ticket envoyé à Make avec succès !")
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi à Make:", error)
        throw error
    }
}
