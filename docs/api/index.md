# API Specification
## VapeTrack PH - Backend API Documentation

**Version:** 1.0  
**Last Updated:** February 4, 2026  
**Backend:** Supabase (PostgreSQL) with Row Level Security  
**Interaction Model:** Direct client-to-database queries + Postgres Functions (RPCs)  
**Author:** Backend Development Team

---

## 📋 Table of Contents
- [Overview](#overview)
- [Types](types.md)
- [Database Functions (RPCs)](../database/functions.md)
- [Security (RLS)](security.md)
- [Error Handling](errors.md)
- [Usage Examples](usage.md)

---

## Overview

### Architecture Philosophy

VapeTrack PH uses a **database-centric architecture** where:

1. **Simple Reads:** Direct queries via Supabase JS Client
2. **Complex Writes:** Postgres Functions (RPCs) for atomic operations
3. **Security:** Row Level Security (RLS) enforces multi-tenancy at database layer
4. **Type Safety:** Auto-generated TypeScript types from Supabase schema

### Why This Approach?

✅ **Atomic Transactions:** Critical operations (sales, inventory) cannot be split across multiple client calls  
✅ **Data Integrity:** Inventory deductions are validated and rolled back if insufficient stock  
✅ **Performance:** Database functions run closer to data (no network round trips)  
✅ **Security:** RLS ensures users can only access their organization's data  
✅ **Simplicity:** No separate API server to maintain
