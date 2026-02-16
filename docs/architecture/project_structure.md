# Project Structure

**Last Updated:** February 4, 2026

## Folder Organization (Feature-Based)

```
vapetrack-ph/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group (shared layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── pin-login/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Auth layout (centered card)
│   │
│   ├── (dashboard)/              # Route group (authenticated)
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Owner dashboard
│   │   ├── pos/
│   │   │   ├── page.tsx          # POS screen
│   │   │   └── checkout/
│   │   │       └── page.tsx
│   │   ├── inventory/
│   │   │   ├── page.tsx          # Product list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Product detail
│   │   │   └── new/
│   │   │       └── page.tsx      # Add product
│   │   ├── branches/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── staff/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── sales/
│   │   │   ├── products/
│   │   │   └── staff/
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── billing/
│   │   │   └── preferences/
│   │   └── layout.tsx            # Authenticated layout (navbar, sidebar)
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── pin/
│   │   │   │   └── route.ts
│   │   │   └── signout/
│   │   │       └── route.ts
│   │   ├── transactions/
│   │   │   ├── route.ts          # POST /api/transactions (create sale)
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET /api/transactions/:id
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── inventory/
│   │   │   ├── route.ts
│   │   │   └── adjust/
│   │   │       └── route.ts
│   │   ├── billing/
│   │   │   ├── create-checkout/
│   │   │   │   └── route.ts
│   │   │   └── portal/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   └── paymongo/
│   │   │       └── route.ts
│   │   └── revalidate/
│   │       └── route.ts
│   │
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── globals.css               # Global styles (Tailwind)
│   └── error.tsx                 # Global error boundary
│
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layout components
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   └── bottom-nav.tsx
│   │
│   └── features/                 # Feature-specific components
│       ├── pos/
│       │   ├── ProductGrid.tsx
│       │   ├── CartSheet.tsx
│       │   ├── VariantSelector.tsx
│       │   └── CheckoutForm.tsx
│       ├── inventory/
│       │   ├── ProductForm.tsx
│       │   ├── VariantManager.tsx
│       │   └── StockAdjustment.tsx
│       ├── dashboard/
│       │   ├── SalesCard.tsx
│       │   ├── QuickStats.tsx
│       │   └── LowStockAlert.tsx
│       └── reports/
│           ├── SalesChart.tsx
│           └── DateRangePicker.tsx
│
├── lib/                          # Core utilities
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Middleware client
│   ├── db/
│   │   ├── schema.ts             # IndexedDB schema (Dexie)
│   │   └── offline-sync.ts       # Offline queue handler
│   ├── api/
│   │   ├── client.ts             # API client wrapper
│   │   └── endpoints.ts          # Typed API endpoints
│   ├── utils/
│   │   ├── cn.ts                 # Tailwind class merger
│   │   ├── format.ts             # Date/currency formatters
│   │   └── validation.ts         # Zod schemas
│   └── constants.ts              # App constants
│
├── hooks/                        # Custom React hooks
│   ├── useOnlineStatus.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useAuth.ts
│   └── queries/                  # TanStack Query hooks
│       ├── useProducts.ts
│       ├── useTransactions.ts
│       ├── useInventory.ts
│       └── useBranches.ts
│
├── types/                        # TypeScript types
│   ├── database.ts               # Auto-generated Supabase types
│   ├── api.ts                    # API request/response types
│   ├── models.ts                 # Domain models
│   └── index.ts
│
├── actions/                      # Server Actions
│   ├── auth.ts                   # signIn, signOut, signUp
│   ├── transactions.ts           # createSale, getSales
│   ├── products.ts               # createProduct, updateProduct
│   └── inventory.ts              # adjustStock, transferStock
│
├── providers/                    # React Context providers
│   ├── QueryProvider.tsx         # TanStack Query provider
│   ├── ThemeProvider.tsx         # Dark mode provider
│   └── ToastProvider.tsx         # Toast notifications
│
├── middleware.ts                 # Next.js middleware (auth, headers)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Example env vars (committed)
└── README.md
```

## File Naming Conventions

- **Components:** PascalCase (`ProductGrid.tsx`)
- **Utilities:** camelCase (`formatCurrency.ts`)
- **Route Segments:** kebab-case (`pin-login/`)
- **Hooks:** camelCase with `use` prefix (`useOnlineStatus.ts`)
- **Actions:** camelCase (`createSale.ts`)
- **Types:** PascalCase (`Product`, `Transaction`)
