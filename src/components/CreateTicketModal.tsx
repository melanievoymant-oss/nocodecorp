import { useState, useEffect } from "react"
import { useForm, type UseFormRegister, type FieldErrors, type UseFormWatch, type UseFormSetValue } from "react-hook-form"
import { Dialog, DialogContent } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select } from "./ui/select"
import {
    Bug,
    Sparkles,
    LifeBuoy,
    Palette,
    Monitor,
    ChevronLeft,
    CheckCircle2,
    AlertTriangle
} from "lucide-react"
import type { Project, Ticket, TicketType, ClientEmailStatus } from "../types"
import { calculateDeadline, calculatePriorityLevel, calculatePriorityScore } from "../lib/formulas"
import { cn } from "../lib/utils"

interface CreateTicketModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projects: Project[]
    clientId: string
    statutEmail: ClientEmailStatus
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

const TICKET_TYPES: { value: TicketType; label: string; icon: React.ElementType; color: string; bg: string }[] = [
    { value: "Bug", label: "Bug", icon: Bug, color: "text-red-500", bg: "bg-red-50" },
    { value: "Nouvelle fonctionnalité", label: "Nouvelle fonctionnalité", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-50" },
    { value: "Support", label: "Support", icon: LifeBuoy, color: "text-blue-500", bg: "bg-blue-50" },
    { value: "Design", label: "Design", icon: Palette, color: "text-pink-500", bg: "bg-pink-50" },
    { value: "Développement", label: "Développement", icon: Monitor, color: "text-cyan-500", bg: "bg-cyan-50" },
]

const RatingInput = ({
    id,
    label,
    legend,
    watch,
    setValue,
    register,
    errors
}: {
    id: "q1" | "q2" | "q3" | "q4",
    label: string,
    legend: string[],
    watch: UseFormWatch<FormData>,
    setValue: UseFormSetValue<FormData>,
    register: UseFormRegister<FormData>,
    errors: FieldErrors<FormData>
}) => {
    const value = watch(id)
    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: `${parseInt(id[1]) * 50}ms` }}>
            <Label className="text-sm font-semibold text-primary flex items-center gap-2">
                {label}
                {value && <CheckCircle2 className="w-4 h-4 text-secondary animate-in zoom-in duration-300" />}
                {!value && <span className="text-secondary">*</span>}
            </Label>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex gap-2 mb-2 justify-start">
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                            key={rating}
                            type="button"
                            onClick={() => setValue(id, rating)}
                            className={cn(
                                "w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-bold transition-all duration-200 ease-out",
                                value === rating
                                    ? "border-secondary bg-secondary text-white shadow-md scale-105"
                                    : "border-gray-200 bg-white text-gray-500 hover:border-secondary/50 hover:text-secondary hover:bg-white"
                            )}
                        >
                            {rating}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pl-1">
                    {legend.map((l, i) => (
                        <div key={i} className={cn(
                            "flex gap-2 items-start transition-opacity duration-300",
                            value === i + 1 ? "opacity-100 font-medium text-primary" : "opacity-60"
                        )}>
                            <span className={cn(
                                "font-bold whitespace-nowrap min-w-[20px] text-center rounded px-0.5",
                                value === i + 1 ? "bg-secondary/10 text-secondary" : "bg-gray-100 text-gray-400"
                            )}>{i + 1}</span>
                            <span className="leading-tight">{l}</span>
                        </div>
                    ))}
                </div>
            </div>
            <input type="hidden" {...register(id, { required: true, min: 1 })} />
            {errors[id] && <span className="text-[10px] text-destructive font-medium animate-pulse">Requis</span>}
        </div>
    )
}

export function CreateTicketModal({ open, onOpenChange, projects, clientId, statutEmail, onSubmit }: CreateTicketModalProps) {
    const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } = useForm<FormData>()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(1)
    const [progress, setProgress] = useState(0)

    // Watch values
    const selectedType = watch("type")

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                if (step === 1) setProgress(33)
                else if (step === 2) setProgress(66)
                else if (step === 3) setProgress(100)
                else setProgress(0)
            }, 100)
        } else {
            setProgress(0)
        }
    }, [open, step])

    const handleNext = async () => {
        const isValid = await trigger(["title", "type", "projectId", "description"])
        if (isValid) {
            setStep(2)
        }
    }

    const handleClose = () => {
        setStep(1)
        reset()
        onOpenChange(false)
    }

    const onFormSubmit = async (data: FormData) => {
        setIsSubmitting(true)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))

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
        setIsSubmitting(false)
        setStep(3)
        setProgress(100)
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => {
                if (!val) handleClose()
                onOpenChange(val)
            }}
            className="w-[95vw] max-w-[1000px] sm:w-full"
        >
            <DialogContent className="p-0 gap-0 bg-[#fafafa] overflow-hidden border-none shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col">
                {/* Progress Bar */}
                <div className="h-1 w-full bg-gray-100 shrink-0">
                    <div
                        className="h-full bg-secondary transition-all duration-700 ease-in-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Header */}
                <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                        <Bug className="w-24 h-24 rotate-12" />
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        {step === 1 ? (
                            <div className="flex items-center gap-3 text-primary animate-in slide-in-from-left-4 fade-in duration-500">
                                <div className="p-2 bg-primary/5 rounded-xl">
                                    <Bug className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-primary">Création d'un ticket</h2>
                                    <p className="text-muted-foreground text-xs">Détaillez votre demande pour une intervention rapide.</p>
                                </div>
                            </div>
                        ) : step === 2 ? (
                            <div className="flex items-center gap-3 text-primary animate-in slide-in-from-right-4 fade-in duration-500">
                                <div className="p-2 bg-primary/5 rounded-xl">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-primary">Priorisation</h2>
                                    <p className="text-muted-foreground text-xs">Évaluez l'urgence de votre demande.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-primary animate-in slide-in-from-right-4 fade-in duration-500">
                                <div className="p-2 bg-green-50 rounded-xl">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-primary">Confirmation</h2>
                                    <p className="text-muted-foreground text-xs">Votre ticket a été créé avec succès.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="p-4 sm:p-6 overflow-y-auto scroll-smooth flex-1">
                    {step === 1 ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out lg:h-full flex flex-col">
                            {/* Step 1 Content */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:flex-1">
                                {/* Left Column: Inputs */}
                                <div className="lg:col-span-7 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2 group">
                                            <Label className="text-sm font-semibold text-primary group-focus-within:text-secondary transition-colors">
                                                Titre <span className="text-secondary">*</span>
                                            </Label>
                                            <Input
                                                {...register("title", { required: true })}
                                                placeholder="Ex: Bug connexion"
                                                className="h-10 text-sm bg-white border-gray-200 focus:border-secondary focus:ring-secondary/10 rounded-lg"
                                            />
                                            {errors.title && <span className="text-[10px] text-destructive">Requis</span>}
                                        </div>

                                        <div className="space-y-2 group">
                                            <Label className="text-sm font-semibold text-primary group-focus-within:text-secondary transition-colors">
                                                Projet <span className="text-secondary">*</span>
                                            </Label>
                                            <Select
                                                {...register("projectId", { required: true })}
                                                className="w-full h-10 px-3 bg-white border-gray-200 focus:border-secondary focus:ring-secondary/10 rounded-lg text-sm"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.nom}</option>
                                                ))}
                                            </Select>
                                            {errors.projectId && <span className="text-[10px] text-destructive">Requis</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-2 group lg:h-full flex flex-col">
                                        <Label className="text-sm font-semibold text-primary group-focus-within:text-secondary transition-colors">
                                            Description <span className="text-secondary">*</span>
                                        </Label>
                                        <Textarea
                                            {...register("description", { required: true })}
                                            placeholder="Expliquez le contexte..."
                                            className="lg:flex-1 min-h-[120px] bg-white border-gray-200 focus:border-secondary focus:ring-secondary/10 rounded-lg text-sm p-3 resize-none"
                                        />
                                        {errors.description && <span className="text-[10px] text-destructive">Requis</span>}
                                    </div>
                                </div>

                                {/* Right Column: Type Selection */}
                                <div className="lg:col-span-5 space-y-2">
                                    <Label className="text-sm font-semibold text-primary">Type <span className="text-secondary">*</span></Label>
                                    <div className="grid gap-2">
                                        {TICKET_TYPES.map((type, idx) => (
                                            <div
                                                key={type.value}
                                                onClick={() => setValue("type", type.value)}
                                                className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all duration-200 group relative overflow-hidden",
                                                    selectedType === type.value
                                                        ? "border-secondary bg-secondary/5 shadow-sm"
                                                        : "border-gray-100 bg-white hover:border-secondary/30 hover:bg-gray-50"
                                                )}
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                                                    selectedType === type.value ? "bg-secondary text-white" : `${type.bg} ${type.color}`
                                                )}>
                                                    <type.icon className="w-4 h-4" />
                                                </div>
                                                <span className={cn(
                                                    "font-medium text-sm flex-1 transition-colors",
                                                    selectedType === type.value ? "text-primary" : "text-gray-600"
                                                )}>{type.label}</span>

                                                {selectedType === type.value && (
                                                    <CheckCircle2 className="w-4 h-4 text-secondary animate-in zoom-in" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <input type="hidden" {...register("type", { required: true })} />
                                    {errors.type && <span className="text-[10px] text-destructive">Requis</span>}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 shrink-0">
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-secondary text-white h-10 px-6 text-sm font-semibold rounded-full shadow-lg hover:bg-secondary/90 hover:scale-105 transition-all duration-300 group"
                                >
                                    Suivant <ChevronLeft className="ml-1 w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    ) : step === 2 ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 ease-out h-full flex flex-col">
                            {/* Step 2 Content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 flex-1">
                                <RatingInput
                                    id="q1"
                                    label="Quel est l'impact sur votre activité ?"
                                    watch={watch}
                                    setValue={setValue}
                                    register={register}
                                    errors={errors}
                                    legend={[
                                        "Mineur",
                                        "Gênant",
                                        "Moyen",
                                        "Important",
                                        "Bloquant"
                                    ]}
                                />

                                <RatingInput
                                    id="q2"
                                    label="Combien d'utilisateurs sont affectés ?"
                                    watch={watch}
                                    setValue={setValue}
                                    register={register}
                                    errors={errors}
                                    legend={[
                                        "< 5",
                                        "5 - 20",
                                        "20 - 50",
                                        "50 - 100",
                                        "> 100"
                                    ]}
                                />

                                <RatingInput
                                    id="q3"
                                    label="S'agit-il d'un blocage total ?"
                                    watch={watch}
                                    setValue={setValue}
                                    register={register}
                                    errors={errors}
                                    legend={[
                                        "Amélioration",
                                        "Contournable",
                                        "Difficile",
                                        "Critique",
                                        "Total"
                                    ]}
                                />

                                <RatingInput
                                    id="q4"
                                    label="Quelle est l'urgence ?"
                                    watch={watch}
                                    setValue={setValue}
                                    register={register}
                                    errors={errors}
                                    legend={[
                                        "Pas urgent",
                                        "Cette semaine",
                                        "3-4 jours",
                                        "48h",
                                        "Immédiat"
                                    ]}
                                />
                            </div>

                            <div className="flex justify-between pt-4 border-t border-gray-100 items-center shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors h-9 px-4 rounded-full text-sm"
                                >
                                    <ChevronLeft className="mr-1 h-3 w-3" /> Retour
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-secondary text-white h-10 px-8 text-sm font-bold rounded-full shadow-lg hover:bg-secondary/90 hover:scale-105 transition-all duration-300"
                                >
                                    {isSubmitting ? "Envoi..." : "Confirmer"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
                            {(statutEmail === "Invalid" || statutEmail === "Invalide") ? (
                                <>
                                    <div className="h-24 w-24 bg-amber-50 rounded-full flex items-center justify-center mb-2 animate-in bounce-in duration-700 delay-200">
                                        <AlertTriangle className="h-12 w-12 text-amber-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-amber-600">Ticket en attente</h2>
                                        <p className="text-muted-foreground max-w-xs mx-auto">
                                            Votre ticket a été créé mais mis en <strong>Stand-By</strong> car votre email est invalide.
                                        </p>
                                        <p className="text-sm text-amber-600/80 bg-amber-50 p-3 rounded-lg">
                                            Veuillez mettre à jour vos informations via la bannière sur votre tableau de bord pour qu'il soit traité.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mb-2 animate-in bounce-in duration-700 delay-200">
                                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-primary">Ticket créé avec succès !</h2>
                                        <p className="text-muted-foreground max-w-xs mx-auto">
                                            Votre demande a bien été enregistrée. Notre équipe va l'analyser dans les plus brefs délais.
                                        </p>
                                    </div>
                                </>
                            )}
                            <Button
                                type="button"
                                onClick={handleClose}
                                className="bg-secondary text-white h-10 px-8 text-sm font-bold rounded-full shadow-lg hover:bg-secondary/90 hover:scale-105 transition-all duration-300"
                            >
                                Fermer
                            </Button>
                        </div>
                    )}
                </form>
            </DialogContent>
        </Dialog >
    )
}
