# Yakoub Travaux — Waterproofing Solutions

Premium, high-performance web platform built for **Yakoub Travaux**, the leading official Derbigum partner for waterproofing solutions in Tunisia. This platform is designed to convert leads efficiently through a dynamic quote system while offering an aesthetic, modern luxury experience.

## ✨ Features

- **Modern Luxury UI**: Custom aesthetic with glassmorphism, dynamic gradients, and smooth Framer Motion animations.
- **Dynamic Content Management**: Fully integrated with Supabase. Manage settings, portfolio, testimonials, and leads directly from the secure Admin Dashboard.
- **Bilingual System**: Native support for French (LTR) and Arabic (RTL) with seamless switching and localized SEO.
- **Interactive Quote Wizard**: A 3-step dynamic quote generator designed to capture essential client data and funnel it straight into the CRM.
- **Kanban CRM**: Built-in drag-and-drop Kanban board to manage incoming leads and projects.
- **Advanced SEO**: Out-of-the-box OpenGraph, Twitter Cards, and JSON-LD structured data mapping.

## 🛠 Tech Stack

- **Frontend Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management & Data Fetching**: [React Query](https://tanstack.com/query)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL + Storage + Auth)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase Project

### 1. Clone the repository
```bash
git clone <repository-url>
cd yakoub-waterproofing-solutions
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Duplicate the `.env.example` file and rename it to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### 4. Database Setup
To configure the backend, you must run the SQL migrations in your Supabase project.

1. Navigate to your Supabase project dashboard.
2. Go to the **SQL Editor**.
3. Copy the contents of `supabase/migrations/00000_initial_schema.sql` and run it.
4. (Optional) Run the storage policies configuration if you are handling file uploads.

### 5. Start Development Server
```bash
npm run dev
```

## 📦 Deployment

The frontend is optimized for deployment on platforms like Vercel, Netlify, or Cloudflare Pages.

```bash
# Build for production
npm run build
```
Ensure your production deployment platform has the necessary `.env` variables mapped.

## 📄 License & Authorship

Developed exclusively for Yakoub Travaux. 
UI/UX and platform architecture crafted by Omar Abouajaja.
