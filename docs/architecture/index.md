# Architecture Document
## VapeTrack PH - Technical Strategy & System Design

**Version:** 1.0  
**Last Updated:** February 4, 2026  
**Author:** Technical Lead - VapeTrack PH  
**Target Audience:** Development Team, Technical Stakeholders

---

## 📋 Table of Contents
- [Executive Summary](#executive-summary)
- [Stack](stack.md)
- [Project Structure](project_structure.md)
- [Security](security.md)
- [Deployment](deployment.md)
- [Authentication](authentication.md)
- [Payments](payments.md)
- [Development Workflow](workflow.md)
- [Monitoring & Operations](monitoring.md)

---

## Executive Summary

VapeTrack PH is a **Progressive Web App (PWA)** built with a modern, serverless architecture optimized for the **Philippine market**. The system is designed to:

✅ **Operate efficiently on 4G/5G networks** via aggressive caching strategies  
✅ **Scale from day one** using multi-tenant SaaS architecture with row-level security  
✅ **Minimize operational costs** by leveraging free tiers (Vercel, Supabase)  
✅ **Enable solo developer productivity** through type-safe, full-stack TypeScript  
✅ **Deliver sub-second interactions** via edge caching and optimistic UI updates

### Core Architectural Principles

1. **Mobile-First PWA:** Installable, app-like experience with responsive design
2. **Edge-First Rendering:** Static generation + ISR for instant page loads
3. **Database-Driven Security:** Row-level security (RLS) enforces multi-tenancy at the database layer
4. **Optimistic UI:** Assume success, sync in background, handle failures gracefully
5. **Type Safety End-to-End:** TypeScript everywhere, auto-generated DB types from Supabase

---

## High-Level Architecture

### System Architecture Diagram

```mermaid
graph TD
    subgraph "Client Layer - Philippines"
        A[Mobile Browser / PWA]
        B[Service Worker]
        C[IndexedDB / LocalStorage]
        A --> B
        B --> C
    end

    subgraph "Edge Network - Vercel Edge"
        D[Vercel Edge Functions]
        E[CDN Cache]
        F[Static Assets]
    end

    subgraph "Application Layer - Vercel Serverless"
        G[Next.js App Router]
        H[API Routes]
        I[Server Components]
        J[Server Actions]
        G --> I
        G --> H
        G --> J
    end

    subgraph "Data Layer - Supabase"
        K[PostgreSQL + RLS]
        L[Supabase Auth]
        M[Realtime Subscriptions]
        N[Storage Buckets]
    end

    subgraph "External Services"
        O[PayMongo Payment Gateway]
        P[Resend Email Service]
        Q[Vercel Analytics]
    end

    %% Client to Edge
    A -->|HTTPS| D
    A -->|Cache First| E
    A -->|Static Assets| F

    %% Edge to Application
    D -->|SSR/ISR| G
    E -->|Cache Miss| G

    %% Application to Data
    H -->|SQL Queries| K
    J -->|Mutations| K
    I -->|Data Fetching| K
    H -->|Auth Tokens| L
    G -->|Real-time Events| M
    H -->|File Uploads| N

    %% Application to External
    J -->|Process Payments| O
    H -->|Send Emails| P
    A -->|Analytics| Q

    %% Offline Handling
    B -.->|Offline Queue| C
    B -.->|Sync on Reconnect| H

    style A fill:#3b82f6,stroke:#2563eb,stroke-width:3px,color:#fff
    style K fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
    style G fill:#8b5cf6,stroke:#7c3aed,stroke-width:3px,color:#fff
    style B fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

### Data Flow: Recording a Sale (Happy Path)

```mermaid
sequenceDiagram
    participant Staff as Staff (Mobile)
    participant SW as Service Worker
    participant Next as Next.js App
    participant API as API Route
    participant SB as Supabase
    participant DB as PostgreSQL

    Staff->>Next: Tap "Complete Sale"
    Note over Staff,Next: Optimistic UI Update
    Next->>Staff: Show "Processing..." + Checkmark
    
    Next->>API: POST /api/transactions
    API->>SB: Auth.getUser() (verify token)
    SB-->>API: User + org_id
    
    API->>DB: BEGIN TRANSACTION
    
    API->>DB: INSERT INTO transactions (...)
    DB-->>API: transaction_id
    
    API->>DB: INSERT INTO transaction_items (...)
    API->>DB: UPDATE inventory SET quantity = quantity - X
    API->>DB: INSERT INTO stock_movements (...)
    
    API->>DB: COMMIT TRANSACTION
    DB-->>API: Success
    
    API->>SB: Broadcast realtime event
    SB-->>Next: Realtime update (other clients)
    
    API-->>Next: 200 OK { transaction }
    Next->>Staff: Navigate to Success Screen
    
    Note over Staff,DB: Total Time: ~500ms
```
