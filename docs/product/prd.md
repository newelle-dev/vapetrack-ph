# Product Requirements Document (PRD)
## VapeTrack PH - SaaS Sales & Inventory Management

**Version:** 1.0  
**Last Updated:** February 3, 2026  
**Document Owner:** VapeTrack PH Team

---

## 📋 Table of Contents
- [Executive Summary](#executive-summary)
- [Product Overview](#product-overview)
- [Goals & Objectives](#goals--objectives)
- [Target Audience](#target-audience)
- [User Roles & Personas](#user-roles--personas)
- [Core Features](#core-features)
- [Technical Requirements](#technical-requirements)
- [Success Criteria](#success-criteria)
- [Out of Scope](#out-of-scope)
- [Assumptions & Constraints](#assumptions--constraints)
- [Future Considerations](#future-considerations)

---

## Executive Summary

VapeTrack PH is a cloud-based **Sales & Inventory Management SaaS** platform designed specifically for small to medium vape shops in the Philippines. The platform addresses the critical pain points of manual logbooks and unwieldy spreadsheets by providing real-time inventory tracking, sales analytics, staff accountability, and multi-branch management—all accessible via web browsers on any device, with zero installation required.

### What the App Does

VapeTrack PH enables vape shop owners to:
- **Manage inventory** in real-time across multiple branches
- **Track sales and profits** with automated capital and revenue calculations
- **Monitor staff activities** through comprehensive audit logs
- **Generate reports and analytics** for data-driven business decisions
- **Access their business data** from anywhere via cloud-based architecture
- **Scale operations** with multi-branch and multi-user support
- **Pay as they grow** through subscription-based pricing

The platform operates on a **multi-tenant SaaS model**, where each shop receives a secure, isolated workspace with subscription-based access, eliminating the need for expensive hardware, barcode scanners, or receipt printers.

---

## Product Overview

### Problem Statement

Many vape shops in the Philippines face significant operational challenges:
- **Manual tracking:** Reliance on handwritten logbooks leads to errors and inefficiency
- **Spreadsheet chaos:** Excel/Google Sheets become unwieldy as inventory grows
- **Inventory inaccuracy:** No real-time visibility into stock levels
- **Lost profits:** Difficulty tracking cost of goods sold vs. revenue
- **Staff accountability gaps:** Limited visibility into employee actions
- **Multi-branch complexity:** No unified system to manage multiple locations
- **Capital constraints:** High upfront costs for traditional POS systems

### Solution

VapeTrack PH provides a modern, affordable, cloud-based solution that:
- Eliminates manual processes with automated tracking
- Provides real-time inventory visibility
- Enables accurate profit calculations
- Creates comprehensive audit trails for staff activities
- Supports multi-branch operations from a single dashboard
- Requires zero upfront hardware investment
- Offers flexible subscription pricing

---

## Goals & Objectives

### Primary Goals

1. **Operational Efficiency**
   - Reduce time spent on manual inventory tracking by 80%
   - Eliminate inventory discrepancies through real-time updates
   - Enable instant sales recording with minimal clicks

2. **Financial Visibility**
   - Provide accurate profit margins on every transaction
   - Track capital vs. revenue in real-time
   - Generate comprehensive financial reports (daily/weekly/monthly/yearly)

3. **Staff Accountability**
   - Create complete audit logs of all staff actions
   - Enable PIN-based authentication for quick staff login
   - Track individual staff performance and sales

4. **Business Growth**
   - Support multi-branch expansion seamlessly
   - Scale from single-user to multi-staff operations
   - Provide analytics to identify best-selling products and trends

5. **Accessibility & Affordability**
   - Deliver a mobile-responsive interface usable on any device
   - Eliminate hardware dependencies (no scanners, no printers)
   - Offer subscription-based pricing accessible to small shops

### Secondary Goals

- Achieve sub-second response times for common operations
- Maintain 99.9% uptime for business continuity
- Provide self-service onboarding to reduce support overhead
- Enable data export for backup and compliance
- Build a scalable multi-tenant architecture supporting 1000+ shops

---

## Target Audience

### Primary Users
- **Small to medium vape shop owners** in the Philippines
- **Shop managers** responsible for daily operations
- **Staff members** handling sales and inventory

### Market Characteristics
- Shops with 1-5 branches
- 1-10 staff members per shop
- Limited technical expertise
- Budget-conscious (prefer subscription over capital expense)
- Mobile-first (often manage business from smartphones)

---

## User Roles & Personas

### 1. Shop Owner
**Role Description:** Full administrative access to their shop's workspace

**Key Responsibilities:**
- Manage branches, products, and staff
- View comprehensive analytics and reports
- Configure shop settings and preferences
- Manage subscription and billing
- Access all audit logs and activity history

**Technical Profile:**
- Moderate technical literacy
- Primarily uses mobile devices
- Values data security and business insights

### 2. Staff (Taga-bantay)
**Role Description:** Limited access focused on daily sales operations

**Key Responsibilities:**
- Select branch at login
- Record sales transactions
- View product information
- Basic inventory lookup

**Technical Profile:**
- Basic technical literacy
- Uses PIN-based quick login
- Needs simple, task-focused interface

**Restrictions:**
- Cannot view profit margins or capital costs
- Cannot access analytics or reports
- Cannot modify inventory or product settings
- Cannot view other staff activities

### 3. Platform Admin (Internal)
**Role Description:** SaaS platform administrator (VapeTrack PH team)

**Key Responsibilities:**
- Manage tenant accounts
- Monitor platform health and usage
- Process billing and subscriptions
- Provide technical support
- Manage platform-wide settings

**Technical Profile:**
- High technical expertise
- Full system access
- Internal VapeTrack PH staff only

---

## Core Features

### 1. Authentication & User Management

#### Shop Owner Authentication
- Email/password login
- Password reset flow
- Session management

#### Staff Authentication
- PIN-based quick login (4-6 digits)
- Branch selection at login
- Auto-logout on inactivity

#### User Management
- Create/edit/deactivate staff accounts
- Assign PINs and permissions
- View user activity logs

### 2. Multi-Tenant Architecture

#### Workspace Isolation
- Each shop gets a secure, isolated workspace
- Data segregation at database level
- No cross-tenant data leakage

#### Self-Service Onboarding
- Shop owner registration
- Workspace creation wizard
- Initial setup guide (first branch, first product, first staff)

#### Subscription Management
- View current plan and usage
- Upgrade/downgrade plans
- Payment method management
- Billing history

### 3. Branch Management

#### Branch CRUD Operations
- Create new branches
- Edit branch details (name, location, contact)
- Deactivate branches
- Set default branch

#### Branch-Level Data
- Inventory levels per branch
- Sales per branch
- Staff assignments per branch
- Branch performance analytics

### 4. Inventory Management

#### Product Management
- Add products (name, SKU, category, unit price, capital cost)
- Edit product details
- Archive products
- Product categories/tags
- Product images (optional)

#### Stock Management
- Set initial stock levels per branch
- Stock transfer between branches
- Stock adjustments (wastage, damage, returns)
- Real-time stock levels
- Low-stock alerts (configurable thresholds)

#### Inventory Tracking
- Stock-in operations
- Stock-out operations (on sales)
- Inventory history and audit trail
- Stock valuation reports

### 5. Sales Management

#### Point of Sale (POS)
- Quick product search/selection
- Add multiple items to cart
- Calculate totals automatically
- Record payment method (cash, GCash, card, etc.)
- Complete transaction (updates inventory immediately)

#### Sales Recording
- Timestamp all transactions
- Link to staff member
- Link to branch
- Record payment method
- Optional customer name/notes

#### Sales Validation
- Prevent negative inventory
- Validate stock availability before sale
- Confirm sufficient stock at branch

### 6. Financial Tracking

#### Profit Calculation
- Automatic profit calculation: `(Selling Price - Capital Cost) × Quantity`
- Real-time profit updates
- Profit margins per product
- Profit margins per transaction

#### Financial Reports
- Total revenue
- Total capital cost (COGS)
- Gross profit
- Profit margin percentage
- Breakdown by product, branch, staff, or date range

#### Capital Tracking
- Track capital cost per product
- Update capital costs
- Calculate inventory value
- Capital cost history

### 7. Analytics & Reporting

#### Dashboard
- Today's sales summary
- Top-selling products
- Low-stock alerts
- Branch performance overview
- Staff performance highlights

#### Time-Based Reports
- Daily sales reports
- Weekly summaries
- Monthly analytics
- Yearly trends
- Custom date ranges

#### Product Analytics
- Best-selling products
- Slow-moving inventory
- Product profit margins
- Product sales trends

#### Staff Analytics
- Sales per staff member
- Transactions per staff
- Performance comparisons
- Activity timelines

### 8. Audit Logs & Activity Tracking

#### Comprehensive Logging
- All user actions logged
- Timestamp and user attribution
- Action type (create, update, delete, sale)
- Before/after values for edits

#### Audit Trail Features
- Searchable logs
- Filterable by user, action type, date
- Export logs for compliance
- Immutable log entries

#### Staff Monitoring
- Login/logout times
- Sales recorded
- Inventory actions
- Branch access history

### 9. Alerts & Notifications

#### Low-Stock Alerts
- Configurable thresholds per product
- Dashboard notifications
- Email alerts (optional)

#### Business Alerts
- Daily sales summary
- Low-stock warnings
- Unusual activity detection

### 10. Multi-Branch Support

#### Centralized Management
- Manage all branches from one dashboard
- View consolidated reports
- Compare branch performance

#### Branch-Specific Views
- Filter data by branch
- Branch-specific reports
- Branch inventory levels

#### Inter-Branch Operations
- Stock transfers
- Branch comparisons
- Unified product catalog

### 11. Mobile-Responsive Interface

#### Responsive Design
- Optimized for mobile phones
- Tablet-friendly layouts
- Desktop full-featured interface

#### Touch-Optimized
- Large tap targets
- Swipe gestures where appropriate
- Mobile-friendly forms

### 12. Data Management

#### Export Functionality
- Export sales data (CSV, Excel)
- Export inventory reports
- Export financial summaries
- Export audit logs

#### Cloud Backups
- Automatic daily backups
- Data redundancy
- Disaster recovery

#### Data Security
- Encrypted data in transit (HTTPS)
- Encrypted data at rest
- Role-based access control
- Secure authentication

---

## Technical Requirements

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5.x (strict mode)
- **Target:** ES2022

### Backend
- **Platform:** Next.js API Routes
- **Real-time:** Supabase Realtime
- **Database:** Supabase (PostgreSQL with type safety)

### Authentication
- **Provider:** Supabase Auth
- **Methods:** Email/password, PIN-based

### Payments
- **Gateway:** PayMongo (Philippine payment processor)
- **Methods:** Credit/debit cards, GCash, bank transfers

### Deployment
- **Frontend:** Vercel
- **Backend:** Supabase (Database + Auth + Storage)
- **CDN:** Vercel Edge Network

### Performance Requirements
- **Page Load:** < 2 seconds on 3G connection
- **Time to Interactive:** < 3 seconds
- **API Response:** < 500ms for common operations
- **Real-time Updates:** < 1 second latency

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Minimum: Last 2 major versions

### Security Requirements
- HTTPS only
- Content Security Policy
- XSS protection
- CSRF protection
- Rate limiting on authentication
- Data encryption at rest and in transit

---

## Success Criteria

### User Acquisition Metrics

| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|---------------------|
| Active Shops | 50 | 200 |
| Total Users | 150 | 600 |
| MRR (Monthly Recurring Revenue) | ₱50,000 | ₱200,000 |
| User Retention Rate | 80% | 85% |

### User Engagement Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users (DAU) | 60% of total users |
| Average Session Duration | > 5 minutes |
| Sales Transactions per Day (per shop) | > 10 |
| Feature Adoption (using 3+ core features) | > 70% |

### Product Performance Metrics

| Metric | Target |
|--------|--------|
| Uptime | > 99.9% |
| Page Load Time (P95) | < 2 seconds |
| API Response Time (P95) | < 500ms |
| Error Rate | < 0.1% |
| Mobile Traffic | > 60% |

### Business Impact Metrics (Customer Success)

| Metric | Target |
|--------|--------|
| Time Saved vs. Manual Tracking | > 80% |
| Inventory Accuracy Improvement | > 90% |
| User Satisfaction (NPS) | > 50 |
| Customer Support Tickets per User | < 0.5/month |

### Feature Success Criteria

#### Inventory Management
- ✅ 100% of transactions update inventory in real-time
- ✅ Low-stock alerts trigger when threshold reached
- ✅ Inventory accuracy matches physical count > 95%

#### Sales Tracking
- ✅ Sales recording takes < 30 seconds per transaction
- ✅ Profit calculation accurate to 2 decimal places
- ✅ Payment methods recorded for > 95% of transactions

#### Reporting & Analytics
- ✅ Reports generate in < 5 seconds
- ✅ Data exportable in multiple formats (CSV, Excel)
- ✅ 80% of shop owners access reports weekly

#### Multi-Branch
- ✅ Support for up to 10 branches per shop
- ✅ Stock transfers processed in < 2 seconds
- ✅ Branch performance comparable in single view

#### Staff Management
- ✅ PIN login takes < 5 seconds
- ✅ Audit logs capture 100% of user actions
- ✅ Staff can complete sales without owner assistance

#### Mobile Experience
- ✅ All core features accessible on mobile
- ✅ Mobile app load time < 3 seconds
- ✅ Touch targets meet accessibility guidelines (44x44px)

---

## Out of Scope

To maintain simplicity, affordability, and focus, the following features are **explicitly excluded** from the initial release:

### Hardware Integration
- ❌ **Barcode scanning** (manual SKU entry or search only)
- ❌ **Receipt printing** (digital receipts only)
- ❌ **Cash drawer integration**
- ❌ **Card reader hardware**
- ❌ **Label printers**

### Advanced Features
- ❌ **Customer loyalty programs** (future consideration)
- ❌ **Purchase order management** (future consideration)
- ❌ **Supplier management** (future consideration)
- ❌ **Advanced accounting integration** (QuickBooks, Xero)
- ❌ **E-commerce integration**
- ❌ **Marketing automation**

### Deployment Options
- ❌ **On-premise/self-hosted version** (cloud-only)
- ❌ **White-label reselling**
- ❌ **Offline mode** (requires internet connection for Phase 1)

### Payment Methods
- ❌ **Split payments** (single payment method per transaction)
- ❌ **Credit/layaway sales**
- ❌ **Gift cards**

---

## Assumptions & Constraints

### Assumptions
1. Target users have internet connectivity (3G minimum)
2. Users have access to smartphones, tablets, or computers
3. Users are comfortable with basic web applications
4. Philippine market prefers subscription over one-time purchase
5. GCash and PayMongo are widely adopted in target market
6. Shop owners will invest 30-60 minutes in initial setup

### Constraints
1. **Budget:** Limited development budget requires lean MVP approach
2. **Timeline:** 6-month target for initial launch
3. **Team:** Small development team (2-3 developers)
4. **Market:** Philippines-specific features (GCash, PayMongo, localized UI)
5. **Technology:** Committed to Next.js + Supabase stack
6. **Compliance:** Must comply with Philippine data privacy laws

---

## Future Considerations

### Phase 2 Features (Post-Launch)
- Customer database and purchase history
- Loyalty programs and discounts
- SMS notifications for low stock
- Advanced analytics (cohort analysis, forecasting)
- Purchase order management
- Supplier tracking
- Multi-currency support (for international expansion)
- **Offline mode with background sync** (IndexedDB, Service Workers)

### Phase 3 Features
- Mobile native apps (iOS, Android)
- E-commerce integration
- API for third-party integrations
- Advanced reporting (custom report builder)
- Enhanced offline capabilities with conflict resolution
- Franchise/multi-shop management (one owner, multiple independent shops)

### Scaling Considerations
- Support for large shops (10+ branches, 50+ staff)
- Enterprise features (SSO, custom integrations)
- White-label opportunities
- Expansion to other Southeast Asian markets

---

## Appendix

### Glossary
- **SaaS:** Software as a Service
- **SKU:** Stock Keeping Unit (unique product identifier)
- **COGS:** Cost of Goods Sold
- **MRR:** Monthly Recurring Revenue
- **NPS:** Net Promoter Score
- **DAU:** Daily Active Users
- **Taga-bantay:** Filipino term for "shop attendant" or "staff"

### References
- [README.md](../README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SCHEMA.md](./SCHEMA.md) - Database schema
- [API_SPEC.md](./API_SPEC.md) - API specification

---

**Document History:**
- **v1.0** (Feb 3, 2026): Initial PRD created based on README.md

**Next Review Date:** March 3, 2026