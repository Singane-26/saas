# JangiBoutik 🏪

> Caisse, stock, facturation et catalogue en ligne pour commerçants au Sénégal.

## Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v14+

### Installation

```bash
# 1. Cloner et installer les dépendances
git clone <repo-url> jangiboutik
cd jangiboutik
npm install

# 2. Configurer la base de données
cp .env.example .env
# → Modifier DATABASE_URL dans .env avec vos identifiants PostgreSQL

# 3. Initialiser la base de données
npx prisma migrate dev --name init
# ou pour le développement rapide :
npx prisma db push

# 4. Remplir avec les données de démonstration
npx prisma db seed

# 5. Lancer l'application
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

### Compte de démonstration
- **Téléphone** : `+221771234567`
- **Mot de passe** : `demo1234`
- **Catalogue public** : [http://localhost:3000/c/boutique-diouf](http://localhost:3000/c/boutique-diouf)

## Structure du projet

```
jangiboutik/
├── prisma/
│   ├── schema.prisma      # Modèle de données (18 tables)
│   └── seed.js            # Données de démonstration
├── public/
│   └── manifest.json      # Configuration PWA
├── src/
│   ├── app/
│   │   ├── api/           # Routes API REST
│   │   │   ├── auth/      # Login & Register
│   │   │   ├── dashboard/ # Statistiques du tableau de bord
│   │   │   ├── products/  # CRUD Produits
│   │   │   ├── sales/     # Création & liste des ventes
│   │   │   └── customers/ # CRUD Clients
│   │   ├── c/[slug]/      # Catalogue public (SSR)
│   │   ├── dashboard/     # Tableau de bord
│   │   ├── sale/          # Écran de vente rapide
│   │   ├── products/      # Liste des produits / Stock
│   │   ├── customers/     # Liste des clients
│   │   ├── reports/       # Rapports & statistiques
│   │   ├── more/          # Menu secondaire
│   │   ├── globals.css    # Design system complet
│   │   ├── layout.js      # Layout racine (PWA + SEO)
│   │   └── page.js        # Page de connexion
│   ├── components/
│   │   ├── BottomNav.js   # Navigation mobile (barre du bas)
│   │   └── Toast.js       # Notifications toast
│   └── lib/
│       ├── api.js         # Helpers de réponse API
│       ├── auth.js        # JWT + bcrypt
│       ├── format.js      # Formatage FCFA, téléphone, dates
│       └── prisma.js      # Client Prisma singleton
├── .env.example           # Variables d'environnement
├── next.config.js         # Configuration Next.js + PWA
└── package.json
```

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) |
| Styling | Vanilla CSS (design system custom) |
| Backend | Next.js API Routes |
| Base de données | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| PWA | next-pwa (installable sur mobile) |
| Validation | Zod |

## Fonctionnalités

### Produit A — Caisse & Stock
- ✅ Catalogue de produits (nom, prix d'achat/vente, stock, catégorie)
- ✅ Écran de vente rapide (recherche, panier, paiement)
- ✅ Gestion du stock automatique à chaque vente
- ✅ Alertes stock bas
- ✅ Fiches clients avec historique et solde dû
- ✅ Relance client par WhatsApp (lien pré-rempli)
- ✅ Tableau de bord (chiffres du jour/mois, bénéfice estimé)
- ✅ Rapports simples
- ⬜ Facturation PDF
- ⬜ Mode hors ligne partiel
- ⬜ Export PDF/CSV

### Produit B — Catalogue en ligne
- ✅ Page publique avec lien partageable
- ✅ Grille de produits avec photos
- ✅ Bouton "Commander" → WhatsApp
- ✅ Filtrage par catégorie
- ✅ SEO (SSR)
- ⬜ Suivi des commandes
- ⬜ Relances automatiques
- ⬜ Intégration API WhatsApp Business

## Licence

Projet privé — © Joseph Singane Diouf, 2026.
