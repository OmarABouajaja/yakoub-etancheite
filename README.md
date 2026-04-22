# 🏗️ Yakoub Travaux — Expert Étanchéité Tunisie

<div align="center">

![Yakoub Travaux](public/og-preview.png)

**Plateforme web premium pour la première entreprise d'étanchéité en Tunisie.**

[![Cloudflare Pages](https://img.shields.io/badge/Deployed_on-Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white)](https://yakoub-etancheite.com.tn)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

🌐 **[yakoub-etancheite.com.tn](https://yakoub-etancheite.com.tn)** · 📞 +216 25 589 419

</div>

---

## ✨ Fonctionnalités

### 🌍 Site Public
- **Hero Section** avec animation de pluie interactive (Canvas)
- **Grille Bento** pour les services d'étanchéité
- **Portfolio** avec slider Avant/Après interactif
- **Formulaire de devis** multi-étapes (Quote Wizard) avec persistance Supabase
- **Blog CMS** avec éditeur Markdown et SEO automatique
- **Bilingue** français/arabe avec gestion RTL automatique
- **PWA** installable avec mode offline et mise à jour automatique

### 📊 Dashboard Admin
- **CRM intégré** — gestion complète des prospects avec Kanban
- **Trésorerie** — graphiques financiers (revenus, coûts, marges)
- **Gestion d'équipe** — RBAC (Admin vs Éditeur), invitations par email
- **Realtime Presence** — voir qui est connecté et sur quelle page
- **Journal d'activité** — traçabilité des actions administrateurs
- **Blog CMS** — éditeur riche, brouillons, publication
- **Avis clients** & **Partenaires** — gestion avec affichage dynamique
- **Paramètres du site** — modification en temps réel (contact, stats, réseaux)

### 🔒 Sécurité & Performance
- **Row Level Security** (RLS) sur toutes les tables
- **Edge Functions** (Cloudflare) pour emails et invitations
- **Code-splitting** avec lazy loading sur toutes les routes
- **Lighthouse 90+** — optimisé Core Web Vitals
- **SEO complet** — JSON-LD, OpenGraph, Twitter Cards, sitemap, robots.txt

---

## 🛠️ Stack Technique

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Glassmorphism |
| **Animations** | Framer Motion, Canvas API |
| **State** | TanStack Query, Context API |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Emails** | Resend via Cloudflare Edge Functions |
| **i18n** | i18next + react-i18next (FR/AR + RTL) |
| **PWA** | vite-plugin-pwa (Workbox, skipWaiting) |
| **Hosting** | Cloudflare Pages |
| **Icons** | Lucide React |

---

## 🚀 Quick Start

### Prérequis
- **Node.js** ≥ 18
- **npm** ou **bun**
- Un projet **Supabase**

### 1. Cloner le repository
```bash
git clone <repository-url>
cd yakoub-etancheite
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration environnement
```bash
cp .env.example .env
```
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_API_URL=https://your-domain.com
```

### 4. Base de données
1. Ouvrir **Supabase Dashboard → SQL Editor**
2. Copier-coller le contenu de `supabase/migrations/00000_initial_schema.sql`
3. Exécuter la requête — toutes les tables, RLS et storage sont créés

### 5. Lancer le serveur de développement
```bash
npm run dev
```

---

## 📦 Déploiement (Cloudflare Pages)

```bash
npm run build
```

**Variables d'environnement Cloudflare :**
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (pour Edge Functions) |
| `RESEND_API_KEY` | Clé API Resend (emails) |

---

## 📁 Structure du Projet

```
src/
├── components/          # Composants réutilisables (Navbar, Footer, SEO...)
│   ├── dashboard/       # Composants admin (DashboardLayout, StatsCard...)
│   └── ui/              # shadcn/ui components
├── contexts/            # AuthContext, LanguageContext
├── hooks/               # useActiveUsers, useSiteSettings, useUnsavedChanges
├── lib/                 # API clients (api.ts, blog-api.ts, activity-api.ts)
├── pages/               # Routes (Index, About, Blog, Dashboard...)
│   ├── auth/            # Login, UpdatePassword
│   └── dashboard/       # Pages admin (Leads, Finance, Team...)
└── index.css            # Design system + CSS variables

functions/api/           # Cloudflare Edge Functions
public/                  # Assets statiques (logo, OG image, sitemap...)
supabase/migrations/     # SQL schema complet
```

---

## 📄 Licence

Développé exclusivement pour **Yakoub Travaux**.
Architecture & UI/UX par **Omar Abouajaja** ([@OmarABouajaja](https://github.com/OmarABouajaja)).
