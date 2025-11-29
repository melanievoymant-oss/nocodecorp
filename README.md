# NoCodeCorp - Espace Client

Bienvenue sur le dépôt du **Tableau de Bord Client NoCodeCorp**.
Cette application permet aux clients de suivre leurs projets, de gérer leurs tickets de support/demande, et d'interagir avec l'équipe NoCodeCorp.

## 🌟 Fonctionnalités

### 🔐 Authentification & Session
*   **Connexion par Lien Magique** : Les clients se connectent via un lien unique contenant leur `clientId`.
*   **Persistance de Session** : La session est maintenue active même après rafraîchissement (stockage local sécurisé).
*   **Déconnexion Automatique** : Sécurité accrue avec une déconnexion automatique après 30 minutes d'inactivité.
*   **Protection** : Redirection automatique vers la page "Accès Restreint" si aucun client n'est identifié.

### 📊 Tableau de Bord
*   **Vue d'ensemble** : Liste des projets en cours et terminés.
*   **Tickets Récents** : Tableau triable et filtrable des derniers tickets.
*   **Indicateurs Visuels** :
    *   Badges de statut colorés (Nouveau, En cours, Traité, etc.).
    *   Indicateur de priorité (Faible, Moyenne, Forte).
    *   **Alerte Retard** : Badge "OUI" rouge clignotant pour les tickets hors délai.
*   **Recherche** : Filtrage dynamique des projets et tickets par mot-clé.

### 🎫 Gestion des Tickets
*   **Création de Ticket** : Formulaire multi-étapes intuitif (inspiré de Fillout).
*   **Calcul de Priorité** : Algorithme intelligent qui suggère une priorité basée sur 4 questions clés (Impact, Utilisateurs, Blocage, Délai).
*   **Validation** : Vérification des champs obligatoires avant soumission.
*   **Feedback** : Messages de succès ou d'erreur clairs.

### 🔄 Mises à jour & Intégrations
*   **Auto-Refresh** : Les données se rafraîchissent automatiquement lorsque l'onglet redevient actif (ex: après une mise à jour d'email).
*   **Bannière Email Invalide** : Avertissement bloquant si l'email du client est invalide, avec lien vers un formulaire de mise à jour (Tally).
*   **Mode Stand-By** : Blocage de la création de tickets si le client est en statut "Stand-By".

## 🛠️ Stack Technique

*   **Framework** : [React](https://react.dev/) (v18+)
*   **Langage** : [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool** : [Vite](https://vitejs.dev/)
*   **Styling** : [Tailwind CSS](https://tailwindcss.com/)
*   **Icônes** : [Lucide React](https://lucide.dev/)
*   **Dates** : [date-fns](https://date-fns.org/)
*   **Formulaires** : [React Hook Form](https://react-hook-form.com/)

## 📂 Structure du Projet

```
src/
├── components/         # Composants React réutilisables
│   ├── ui/             # Composants d'interface de base (Boutons, Cards, Inputs...)
│   ├── Dashboard.tsx   # Vue principale
│   └── CreateTicketModal.tsx # Formulaire de création
├── lib/
│   ├── api.ts          # Fonctions d'appel API (Make.com)
│   ├── formulas.ts     # Logique métier (Calcul priorité, Retard...)
│   ├── mockData.ts     # Données de test (pour le dév local)
│   └── utils.ts        # Utilitaires (classes CSS...)
├── types.ts            # Définitions TypeScript (Interfaces Client, Ticket, Projet...)
└── App.tsx             # Point d'entrée & Gestion de l'authentification
```

## 🚀 Accès & Déploiement

### 🌍 Accès Client (En ligne)
L'application est hébergée sur GitHub Pages.
Pour y accéder, utilisez votre lien personnel (envoyé par email) ou le format suivant :

**`https://melanievoymant-oss.github.io/nocodecorp/?clientId=recXXXXXXXXXXXXXX`**

*(Remplacez `recXXXXXXXXXXXXXX` par l'ID Airtable du client)*

### 🛠️ Maintenance (Pour les développeurs)

**Installation des dépendances :**
```bash
npm install
```

**Mise en ligne (Déploiement) :**
```bash
npm run deploy
```
*Cette commande construit le projet et met à jour le site en ligne.*

## 🤖 Automatisations (Make.com)

Le système repose sur 5 scénarios Make.com clés qui orchestrent toute la logique métier.

### 1. Récupération des données (Connexion)
**Déclencheur** : Webhook (Appel depuis le frontend avec `clientId`).
**Action** : Récupère les infos du client, ses projets et ses tickets depuis Airtable.
**Sortie** : Renvoie un JSON complet au frontend.

### 2. Création du ticket
**Déclencheur** : Webhook (Soumission du formulaire).
**Action** :
*   Vérifie l'email du client.
*   Crée le ticket dans Airtable.
*   Envoie une notification de confirmation au client.

### 3. Vérification et attribution
**Déclencheur** : Création d'un ticket (via Router du scénario 2).
**Action** :
*   Analyse le type de ticket (Dev, Design...).
*   Cherche un freelance disponible et compétent.
*   Assigne le ticket automatiquement (Load Balancing).

### 4. Ticket traité
**Déclencheur** : Airtable (Changement de statut à "Traité").
**Action** : Envoie un email automatique au client pour le prévenir que sa demande est terminée.

### 5. Deadline dépassée
**Déclencheur** : Planifié (Tous les jours).
**Action** :
*   Scanne les tickets non traités dont la date est passée.
*   Passe le statut à "Hors délai".
*   Notifie le client (excuses) et l'équipe (urgence).

## 🔗 Intégrations Backend

Ce frontend est connecté à un backend No-Code via **Make.com** et **Airtable**.

*   **Base de données** : Airtable (Clients, Projets, Tickets, Freelances).
*   **Logique métier** : Scénarios Make.com (Réception des tickets, Notifications, Assignation auto).
*   **Formulaires externes** : Tally.so (Mise à jour profil client).

📄 **Pour plus de détails sur la configuration Backend, consultez le guide d'intégration :**
👉 [Guide d'Intégration (Make & Airtable)](./integration_guide.md)

---
*Développé pour NoCodeCorp.*
