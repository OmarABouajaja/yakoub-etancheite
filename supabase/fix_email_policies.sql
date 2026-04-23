-- ============================================================
-- FIX: Email RLS Policies — Run this in Supabase SQL Editor
-- ============================================================
-- This is required to fix the "No email found" issue. 
-- Without this, Supabase blocks incoming emails from Resend.

-- 1. Drop old restrictive policies
DROP POLICY IF EXISTS "Admins can view all emails" ON public.emails;
DROP POLICY IF EXISTS "Admins can insert outbound emails" ON public.emails;
DROP POLICY IF EXISTS "Admins can update emails (mark as read)" ON public.emails;
DROP POLICY IF EXISTS "Admins can delete emails" ON public.emails;
DROP POLICY IF EXISTS "Service role full access emails" ON public.emails;
DROP POLICY IF EXISTS "Authenticated full access on emails" ON public.emails;
DROP POLICY IF EXISTS "Authenticated insert emails" ON public.emails;

-- 2. Authenticated users: read all emails
CREATE POLICY "Admins can view all emails" 
    ON public.emails FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 3. Authenticated users: insert any direction
CREATE POLICY "Authenticated insert emails" 
    ON public.emails FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 4. Service role: full access for webhook inbound inserts
CREATE POLICY "Service role full access emails"
    ON public.emails FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 5. Authenticated users: update (mark as read)
CREATE POLICY "Admins can update emails (mark as read)" 
    ON public.emails FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- 6. Authenticated users: delete
CREATE POLICY "Admins can delete emails" 
    ON public.emails FOR DELETE 
    USING (auth.role() = 'authenticated');
