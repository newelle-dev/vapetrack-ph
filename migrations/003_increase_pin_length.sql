-- Migration: 003_increase_pin_length.sql
-- Description: Increase the length of the users.pin column to accommodate hashed PINs.
-- Created: 2026-02-18

ALTER TABLE public.users ALTER COLUMN pin TYPE character varying(255);
