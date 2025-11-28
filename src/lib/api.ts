import type { Ticket } from "../types"

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/o2o41k4k8djqiyavt6s7l0ymd4j3um41"
const GET_FULL_DATA_WEBHOOK_URL = "https://hook.eu1.make.com/ssiuxe3b8xp35mwy2npummimjfhjn1or"

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

export async function fetchFullClientData(params: { email?: string; clientId?: string }) {
    if (!GET_FULL_DATA_WEBHOOK_URL) {
        console.warn("⚠️ Aucune URL de Webhook de lecture configurée.")
        return null
    }

    try {
        const response = await fetch(GET_FULL_DATA_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...params, _t: Date.now() }), // Add timestamp to prevent caching
        })

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
        }

        const text = await response.text()
        console.log("🔍 Raw API Response:", text) // Debug log

        try {
            const data = JSON.parse(text)
            return data
        } catch (jsonError) {
            console.error("❌ JSON Parse Error. Raw text:", text)
            throw new Error("Invalid JSON from server: " + (jsonError as Error).message)
        }
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données:", error)
        throw error
    }
}
