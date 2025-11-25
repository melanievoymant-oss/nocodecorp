import { useState } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select } from "./ui/select"
import type { Project, Ticket, TicketType } from "../types"
import { calculateDeadline, calculatePriorityLevel, calculatePriorityScore } from "../lib/formulas"

interface CreateTicketModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projects: Project[]
    clientId: string
    onSubmit: (ticket: Ticket) => void
}

interface FormData {
    title: string
    description: string
    type: TicketType
    projectId: string
    q1: number
    q2: number
    q3: number
    q4: number
}

export function CreateTicketModal({ open, onOpenChange, projects, clientId, onSubmit }: CreateTicketModalProps) {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Watch priority questions to calculate score in real-time (optional, but good UX)
    const q1 = watch("q1")
    const q2 = watch("q2")
    const q3 = watch("q3")
    const q4 = watch("q4")

    const currentScore = calculatePriorityScore(Number(q1) || 0, Number(q2) || 0, Number(q3) || 0, Number(q4) || 0)
    const currentLevel = calculatePriorityLevel(currentScore)

    const onFormSubmit = async (data: FormData) => {
        setIsSubmitting(true)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        const q1 = Number(data.q1)
        const q2 = Number(data.q2)
        const q3 = Number(data.q3)
        const q4 = Number(data.q4)

        const priorityScore = calculatePriorityScore(q1, q2, q3, q4)
        const priorityLevel = calculatePriorityLevel(priorityScore)
        const createdAt = new Date()
        const deadline = calculateDeadline(createdAt, priorityLevel)

        const newTicket: Ticket = {
            id: `tick_${Date.now()}`,
            titre: data.title,
            description: data.description,
            type: data.type,
            projectId: data.projectId,
            clientId: clientId,
            q1, q2, q3, q4,
            priorityScore,
            priorityLevel,
            createdAt: createdAt.toISOString(),
            deadline: deadline.toISOString(),
            statut: "Nouveau"
        }

        onSubmit(newTicket)
        reset()
        onOpenChange(false)
        setIsSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau ticket</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" {...register("title", { required: true })} placeholder="Ex: Bug sur la page d'accueil" />
                        {errors.title && <span className="text-xs text-red-500">Ce champ est requis</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="type">Type de demande</Label>
                        <Select id="type" {...register("type", { required: true })}>
                            <option value="Bug">Bug</option>
                            <option value="Nouvelle fonctionnalité">Nouvelle fonctionnalité</option>
                            <option value="Support">Support</option>
                            <option value="Design">Design</option>
                            <option value="Développement">Développement</option>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="project">Projet concerné</Label>
                        <Select id="project" {...register("projectId", { required: true })}>
                            <option value="">Sélectionner un projet</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                        </Select>
                        {errors.projectId && <span className="text-xs text-red-500">Veuillez sélectionner un projet</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description détaillée</Label>
                        <Textarea id="description" {...register("description", { required: true })} placeholder="Décrivez votre besoin..." />
                        {errors.description && <span className="text-xs text-red-500">Ce champ est requis</span>}
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-3">Évaluation de la priorité</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="q1">Impact activité (1-5)</Label>
                                <Input type="number" min="1" max="5" id="q1" {...register("q1", { required: true, min: 1, max: 5 })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="q2">Nb utilisateurs (1-5)</Label>
                                <Input type="number" min="1" max="5" id="q2" {...register("q2", { required: true, min: 1, max: 5 })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="q3">Blocage total (1-5)</Label>
                                <Input type="number" min="1" max="5" id="q3" {...register("q3", { required: true, min: 1, max: 5 })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="q4">Délai souhaité (1-5)</Label>
                                <Input type="number" min="1" max="5" id="q4" {...register("q4", { required: true, min: 1, max: 5 })} />
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-muted rounded-md flex justify-between items-center">
                            <span className="text-sm font-medium">Score estimé: {currentScore}</span>
                            <span className={`text-sm font-bold px-2 py-1 rounded ${currentLevel === "Forte" ? "bg-red-100 text-red-700" :
                                currentLevel === "Moyenne" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-green-100 text-green-700"
                                }`}>
                                Priorité {currentLevel}
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Création..." : "Créer le ticket"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
