# Future Scalability

**Last Updated:** February 4, 2026

## Phase 1: MVP (Current)
- **Target:** 50 shops, 150 users
- **Infrastructure:** Vercel Free Tier + Supabase Free Tier
- **Cost:** ~$0/month

## Phase 2: Growth (6-12 months)
- **Target:** 200 shops, 600 users
- **Upgrade:** Supabase Pro ($25/mo) + Vercel Pro ($20/mo)
- **New Features:**
  - Mobile native apps (React Native + Expo)
  - Advanced analytics (predictive stock forecasting)
  - SMS notifications (via Semaphore PH)
  - **Offline-first capabilities** (IndexedDB, Service Workers, background sync)
- **Cost:** ~$45/month

## Phase 3: Scale (12-24 months)
- **Target:** 1,000+ shops, 3,000+ users
- **Upgrade:** Supabase Team + Vercel Team + Upstash Redis Pro
- **Optimizations:**
  - Read replicas (Supabase)
  - CDN for product images (Cloudflare R2)
  - Database sharding (by region: Luzon, Visayas, Mindanao)
- **Cost:** ~$200/month

## Technical Debt to Address

| Issue | Impact | Timeline | Solution |
|-------|--------|----------|----------|
| **No automated tests** | 🟠 Medium | Phase 2 | Add Playwright (E2E) + Vitest (unit) |
| **Manual type generation** | 🟢 Low | Phase 2 | Automate via GitHub Actions |
| **No database backups** | 🔴 High | Immediate | Supabase auto-backups (enabled) |
| **Single region deployment** | 🟠 Medium | Phase 3 | Multi-region Supabase (Asia-Pacific) |
