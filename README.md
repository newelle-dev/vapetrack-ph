# VapeTrack PH - Sales & Inventory Management SaaS

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

A **mobile-first Progressive Web App (PWA)** built specifically for Philippine vape shops. Eliminates manual logbooks and spreadsheets with real-time inventory tracking, sales analytics, and staff accountability—all accessible from any device with zero hardware dependencies.

---

## 🎯 What It Does

VapeTrack PH is a multi-tenant SaaS platform that enables vape shop owners to:

- ✅ **Track inventory in real-time** across multiple branches and variants (flavors, nicotine levels, colors)
- ✅ **Process sales in under 30 seconds** with an optimized Point of Sale interface
- ✅ **Monitor profits accurately** with automated capital vs. revenue calculations
- ✅ **Manage staff access** via role-based permissions and PIN authentication
- ✅ **Generate business insights** through comprehensive dashboards and reports
- ✅ **Scale operations** from single-location to multi-branch seamlessly

**Target Market:** Small to medium vape shops in the Philippines running on 4G/5G networks.

---

## 🚀 Day 1 Setup Guide

### Prerequisites

Before starting, ensure you have:

#### Required Software

| Tool | Version | Download Link | Purpose |
|------|---------|---------------|---------|
| **Node.js** | `20.x LTS` or higher | [nodejs.org](https://nodejs.org/) | Runtime environment |
| **npm** | `10.x` (bundled with Node) | — | Package manager |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) | Version control |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com/) | Code editor |

#### VS Code Extensions (Recommended)

Install these extensions for optimal developer experience:

```bash
# Install via VS Code Quick Open (Ctrl+P / Cmd+P)
ext install bradlc.vscode-tailwindcss          # Tailwind IntelliSense
ext install Prisma.prisma                       # Prisma (for schema viewing)
ext install dbaeumer.vscode-eslint              # ESLint
ext install esbenp.prettier-vscode              # Prettier (code formatting)
ext install usernamehw.errorlens                # Inline error highlighting
ext install mikestead.dotenv                    # .env syntax highlighting
ext install supabase.vscode-supabase            # Supabase integration
```

Or manually install from VS Code Marketplace:
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **ESLint** (dbaeumer.vscode-eslint)
- **Supabase** (supabase.vscode-supabase) - Optional but helpful

#### Accounts to Create

1. **Supabase Account** (Free Tier)
   - Visit: [supabase.com](https://supabase.com/)
   - Create account and new project
   - Note: Free tier includes 500MB database, 1GB file storage, 2GB bandwidth

2. **Vercel Account** (Free Tier) - _Deployment only_
   - Visit: [vercel.com](https://vercel.com/)
   - Sign up with GitHub account

---

## 📦 Installation Commands

### Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/yourusername/vapetrack-ph.git
cd vapetrack-ph
```

### Step 2: Install Dependencies

```bash
# Install all packages (~200MB download, 1-2 minutes)
npm install
```

This installs:
- **Next.js 16** (App Router)
- **Tailwind CSS 4** (styling framework)
- **Supabase JS Client** (database SDK)
- **TanStack Query v5** (server state management)
- **Lucide React** (icon library)
- **shadcn/ui components** (via manual copy)
- **TypeScript 5** (type safety)

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only
```

**Where to find these:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** → **API**
4. Copy **Project URL** and **anon public** key

### Step 4: Initialize Supabase Schema

```bash
# Option A: Using Supabase CLI (Recommended)
# Install Supabase CLI
npm install supabase --save-dev

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Apply database migrations
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --project-id your-project-ref > types/database.ts
```

```bash
# Option B: Manual SQL Execution
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy contents of `supabase/migrations/001_initial_schema.sql`
# 3. Execute the SQL script
# 4. Manually copy `types/database.example.ts` to `types/database.ts`
```

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Expected behavior:**
- ✅ Sign-up page loads
- ✅ Tailwind styles applied (dark theme)
- ✅ No console errors related to Supabase connection

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | App Router, RSC, Server Actions |
| **React** | 19.2 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.0 | Utility-first styling |
| **shadcn/ui** | Latest | Component library (copy-paste) |
| **TanStack Query** | 5.x | Server state management |
| **Lucide React** | Latest | Icon library (2000+ icons) |
| **Zustand** | 5.x | Client state (cart, UI) |

### Backend & Database

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database + Auth + Realtime |
| **PostgreSQL** | Primary database (v15) |
| **Row Level Security (RLS)** | Multi-tenant data isolation |
| **Postgres Functions** | Complex transactions (RPCs) |

### Infrastructure

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Vercel** | Hosting + Edge Network | 100GB bandwidth/month |
| **Supabase** | Database + Auth | 500MB DB, 2GB bandwidth |
| **Vercel Analytics** | Performance monitoring | 2,500 events/month |

---

## 📂 Project Structure

```
vapetrack-ph/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: Authentication pages
│   │   ├── login/                # Login page
│   │   └── signup/               # Sign-up page
│   ├── (dashboard)/              # Route group: Protected pages
│   │   ├── dashboard/            # Analytics dashboard
│   │   ├── pos/                  # Point of Sale
│   │   ├── inventory/            # Inventory management
│   │   ├── branches/             # Branch management
│   │   ├── staff/                # Staff management
│   │   └── reports/              # Reports & analytics
│   ├── api/                      # API routes (serverless functions)
│   │   └── webhooks/             # External webhooks (PayMongo, etc.)
│   ├── actions/                  # Server Actions (mutations)
│   │   ├── auth.ts               # Authentication actions
│   │   ├── products.ts           # Product CRUD
│   │   └── sales.ts              # Sales processing
│   ├── layout.tsx                # Root layout (PWA manifest, fonts)
│   ├── page.tsx                  # Landing page (redirects to login)
│   └── globals.css               # Global styles + Tailwind imports
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components (Button, Card, etc.)
│   ├── pos/                      # POS-specific components
│   │   ├── ProductGrid.tsx       # Product selection interface
│   │   ├── POSCart.tsx           # Shopping cart display
│   │   └── CheckoutModal.tsx     # Checkout flow
│   ├── inventory/                # Inventory components
│   │   ├── ProductForm.tsx       # Add/Edit product
│   │   └── VariantManager.tsx    # Manage product variants
│   └── layouts/                  # Shared layouts
│       ├── DashboardLayout.tsx   # Main app layout
│       └── POSLayout.tsx         # Fullscreen POS layout
│
├── lib/                          # Shared utilities
│   ├── supabase/                 # Supabase client factories
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server-side client (with auth)
│   │   └── middleware.ts         # Auth middleware
│   ├── utils/                    # Helper functions
│   │   ├── cn.ts                 # Tailwind class merger
│   │   ├── formatters.ts         # Currency, date formatting
│   │   └── validators.ts         # Form validation
│   └── hooks/                    # Custom React hooks
│       ├── useAuth.ts            # Authentication hook
│       ├── useCart.ts            # POS cart state (Zustand)
│       └── useProducts.ts        # TanStack Query hooks
│
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Auto-generated Supabase types
│   └── index.ts                  # Application-specific types
│
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations (SQL)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_rpcs.sql
│   └── seed.sql                  # Sample data for testing
│
├── public/                       # Static assets
│   ├── icons/                    # PWA icons (192x192, 512x512)
│   ├── manifest.json             # PWA manifest
│   └── favicon.ico               # Browser favicon
│
├── docs/                         # Documentation
│   ├── PRD.md                    # Product requirements
│   ├── ARCHITECTURE.md           # Technical architecture
│   ├── SCHEMA.md                 # Database schema
│   ├── API_SPEC.md               # Backend API spec
│   ├── UI_UX.md                  # Design system
│   ├── ROADMAP.md                # Implementation roadmap
│   └── README.md                 # This file
│
├── .env.example                  # Environment variables template
├── .env.local                    # Your local env vars (git-ignored)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
└── package.json                  # Dependencies
```

---

## 🔑 Core Concepts

### 1. Multi-Tenancy via Row-Level Security (RLS)

**Every table has an `organization_id` column.** Supabase RLS policies automatically filter queries:

```typescript
// Application code - NO manual filtering needed
const { data: products } = await supabase
  .from('products')
  .select('*');  // Returns ONLY current user's organization products

// RLS policy enforces:
// WHERE organization_id = current_user.organization_id
```

**Key Rules:**
- ✅ Never write `WHERE organization_id = X` in application code
- ✅ Trust RLS policies to enforce tenant isolation
- ✅ Test with multiple organizations to verify RLS works

### 2. Product Variants Pattern

**Two-table approach:** `products` (base info) → `product_variants` (SKUs, prices, stock)

```typescript
// Example: Vape juice with 3 nicotine levels
Product: {
  id: "prod-001",
  name: "Premium Mango Juice",
  brand: "Cloud9",
  category_id: "juice"
}

Variants: [
  { sku: "PMJ-3MG", name: "3mg", price: 450, capital_cost: 300, stock: 10 },
  { sku: "PMJ-6MG", name: "6mg", price: 450, capital_cost: 300, stock: 5 },
  { sku: "PMJ-12MG", name: "12mg", price: 500, capital_cost: 330, stock: 8 }
]
```

**Critical Rules:**
- ✅ All sales reference `product_variants`, NOT `products`
- ✅ Single-variant products still need one variant (e.g., "Standard")
- ✅ Inventory tracked per variant, not per product

### 3. Server Actions for Mutations

Use Next.js Server Actions (not API routes) for database writes:

```typescript
// app/actions/products.ts
'use server';

export async function createProduct(formData: FormData) {
  const supabase = createServerClient(); // Auto-includes auth
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: formData.get('name'),
      // organization_id injected by RLS automatically
    });
  
  if (error) throw error;
  return data;
}
```

**Benefits:**
- Type-safe by default
- No CSRF tokens needed
- Works with React 19's `useFormState`

### 4. Optimistic UI with TanStack Query

For fast POS interactions, assume success and rollback on error:

```typescript
const { mutate } = useMutation({
  mutationFn: createSale,
  onMutate: async (newSale) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ['sales'] });
    
    // Optimistically update UI
    queryClient.setQueryData(['sales'], (old) => [...old, newSale]);
  },
  onError: (_, __, context) => {
    // Rollback on failure
    queryClient.setQueryData(['sales'], context.previousSales);
    toast.error('Sale failed. Please retry.');
  }
});
```

---

## 🧪 Development Workflow

### Common Tasks

```bash
# Start development server
npm run dev

# Run type checking (catches errors before runtime)
npm run build

# Run linter
npm run lint

# Generate Supabase types (after schema changes)
npx supabase gen types typescript --project-id <your-project-ref> > types/database.ts
```

### Adding a New Feature

1. **Read documentation first** (PRD, Schema, API Spec)
2. **Check RLS policies** (ensure new tables have tenant isolation)
3. **Use Server Actions** for mutations
4. **Implement optimistic UI** for interactive features
5. **Test with multiple organizations** to verify RLS

### Adding shadcn/ui Components

```bash
# Copy components into your project (don't install as dependency)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog

# Components are copied to components/ui/
# Customize freely - you own the code
```

---

## 📱 Mobile Testing

**Target devices:** Android phones (5.5" - 6.7" screens)

### Chrome DevTools Emulation

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select **iPhone SE** (375×667) or **Pixel 5** (393×851)
4. Test touch interactions (click = tap)

### Testing on Real Devices

1. Ensure dev server is running: `npm run dev`
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access from phone: `http://192.168.x.x:3000`
4. **Note:** Phone and PC must be on same WiFi network

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

**Or use GitHub integration:**
1. Push code to GitHub
2. Import repo in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables (Supabase keys)
4. Deploy automatically on every push

**Environment Variables to Set:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

---

## 📚 Documentation

- **[PRD.md](docs/PRD.md)** - Product requirements and user stories
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical architecture and decisions
- **[SCHEMA.md](docs/SCHEMA.md)** - Complete database schema + RLS policies
- **[API_SPEC.md](docs/API_SPEC.md)** - Backend API and TypeScript types
- **[UI_UX.md](docs/UI_UX.md)** - Design system and mobile-first patterns
- **[ROADMAP.md](docs/ROADMAP.md)** - 4-week implementation plan

---

## 🐛 Troubleshooting

### Common Issues

**❌ `Error: Invalid API key`**
- Check `.env.local` has correct Supabase keys
- Restart dev server after changing env vars: `npm run dev`

**❌ `Module not found: Can't resolve 'types/database'`**
- Generate types: `npx supabase gen types typescript --project-id <ref> > types/database.ts`

**❌ RLS policies blocking queries**
- Verify user's JWT contains `organization_id` claim
- Check RLS policies in Supabase Dashboard → Authentication → Policies

**❌ Styles not loading**
- Clear `.next` cache: `rm -rf .next` (Mac/Linux) or `rmdir /s .next` (Windows)
- Restart dev server

---

## 🛠️ Validation & Quality

To ensure code quality and consistency, we use ESLint and Next.js built-in validation tools.

```bash
# Run linting
npm run lint

# Run type-checking and build validation
npm run build
```

---

## 🚀 SaaS Project Overview

Many vape shops in the Philippines still rely on manual logbooks or unwieldy spreadsheets, leading to inaccurate inventory, lost profits, and limited visibility over staff actions. VapeTrack PH SaaS streamlines retail operations with:

- Real-time inventory tracking
- Sales and profit analytics
- Staff accountability and activity logs
- Multi-branch management
- Multi-tenant (each shop has its own secure workspace)
- Subscription management and billing
- Self-service onboarding and account management

All via a **cloud-based, web interface** accessible from phones, tablets, or PCs. No installation or server setup required.

---


## ❌ Out of Scope

To ensure affordability and simplicity:
- ❌ No barcode scanning
- ❌ No receipt printing
- ❌ No hardware dependencies
- ❌ No on-premise/self-hosted version

---


## 👥 User Roles

- **Shop Owner:** Full access to their shop's workspace, branch and staff management, analytics, subscription management, reporting.
- **Staff (Taga-bantay):** PIN login, branch selection, sales recording, view limited product info.
- **Platform Admin (SaaS):** Manages tenants, billing, and platform-wide settings (internal use).

---


## ✨ Key Features (SaaS)

- 🔐 Role-based authentication (Owner, Staff, Platform Admin)
- 🏬 Multi-branch support per tenant
- 📦 Inventory and product management
- 💰 Sales, profit, and capital tracking
- 📊 Advanced analytics and reporting (Daily/Weekly/Monthly/Yearly)
- 🧾 Staff audit logs
- ⚠️ Low-stock alerts
- 🏢 Multi-tenant architecture (each shop is isolated)
- 💳 Subscription & billing management
- 📝 Self-service onboarding and workspace creation
- 🔄 Cloud backups and data security
- 📱 Fully mobile-responsive UI

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Nextjs API route, Supabase (serverless backend with real-time queries)
- **Database**: Supabase(Postgresql)
- **Authentication**: Supabase Auth
- **Payments**: PayMongo
- **Deployment**: Vercel (frontend) + Supabase (Database)

---

## 🚦 Getting Started (For Developers)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/vapetrack-ph.git
cd vapetrack-ph
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

Copy `.env.example` to `.env.local` and fill in Supabase credentials, PayMongo keys, and other SaaS configs.

### 4. Run Development Server

```bash
npm run dev
```
Visit `http://localhost:3000` to access the app.

---

## 🚢 Deployment

### Frontend (Vercel)
The frontend is optimized for deployment on the [Vercel Platform](https://vercel.com/new).

1. Connect your GitHub repository to Vercel.
2. Configure environment variables (refer to `.env.local`).
3. Deploy!

### Backend (Supabase)
The backend is powered by [Supabase](https://supabase.com/).

1. Create a new project on Supabase.
2. Set up your database schema using the Supabase dashboard or migrations.
3. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Vercel project settings.

---

## 📚 Documentation
- [**API_SPEC.md**](./docs/API_SPEC.md) - Complete API specification
- [**API_IMPLEMENTATION.md**](./docs/API_IMPLEMENTATION.md) - Implementation details
- [**API_USAGE_EXAMPLES.md**](./docs/API_USAGE_EXAMPLES.md) - Code examples
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - System architecture
- [**SCHEMA.md**](./docs/SCHEMA.md) - Database schema
- [**PRD.md**](./docs/PRD.md) - Product requirements document

---
## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🕒 Changelog

Stay updated with the latest changes in the [GitHub Releases](https://github.com/4lecboy/vapetrack-ph/releases) page.

---
## 💡 Contribution

Contributions, feedback, and bug reports are welcome! Please open Issues and Pull Requests.

---