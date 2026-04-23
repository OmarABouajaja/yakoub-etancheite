-- ============================================================
--  YAKOUB TRAVAUX Ã¢â‚¬â€ Supabase Database Schema
--  YAKOUB TRAVAUX â€” Supabase Database Schema
--  Version: 2.0 â€” Production Ready
--  Updated: 2026-04
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard â†’ SQL Editor â†’ New Query)
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ============================================================
-- UTILITY: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. BLOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blogs (
    id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title        TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    excerpt      TEXT,
    content      TEXT NOT NULL,
    cover_image  TEXT,
    status       TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    author_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name  TEXT,
    meta_keywords TEXT,
    reading_time  INTEGER DEFAULT 3,  -- estimated minutes to read
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_slug   ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_created ON public.blogs(created_at DESC);

DROP TRIGGER IF EXISTS set_blogs_updated_at ON public.blogs;
CREATE TRIGGER set_blogs_updated_at
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 2. LEADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_name      TEXT NOT NULL,
    phone            TEXT NOT NULL,
    problem_type     TEXT NOT NULL DEFAULT 'Inconnu',
    surface_area     INTEGER,
    is_urgent        BOOLEAN DEFAULT FALSE,
    message          TEXT,
    status           TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
    -- Finance fields (added inline, safe to include from the start)
    revenue          NUMERIC(10,2) DEFAULT NULL,
    cost_material    NUMERIC(10,2) DEFAULT NULL,
    cost_transport   NUMERIC(10,2) DEFAULT NULL,
    payment_status   TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idempotent: add columns if they don't exist (for existing deployments)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS revenue         NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cost_material   NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cost_transport  NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS payment_status  TEXT DEFAULT 'pending';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraint if not already there (safe with DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_status_check'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_status_check
      CHECK (status IN ('new', 'contacted', 'converted', 'lost'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_payment_status_check'
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_payment_status_check
      CHECK (payment_status IN ('pending', 'partial', 'paid'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_status    ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created   ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone     ON public.leads(phone);

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category         TEXT NOT NULL DEFAULT 'roof' CHECK (category IN ('roof', 'wall', 'pool', 'basement', 'other')),
    title            TEXT NOT NULL,
    title_fr         TEXT,
    title_ar         TEXT,
    description      TEXT NOT NULL DEFAULT '',
    description_fr   TEXT,
    description_ar   TEXT,
    cover_image      TEXT,
    image_before     TEXT,
    image_after      TEXT,
    location_gov     TEXT,
    gallery_images   TEXT[] DEFAULT '{}',
    project_type     TEXT DEFAULT 'before_after' CHECK (project_type IN ('before_after', 'gallery')),
    display_order    INTEGER DEFAULT 0,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS display_order  INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_type   TEXT DEFAULT 'before_after';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_projects_category  ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_created   ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_order     ON public.projects(display_order ASC);

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. SITE SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id                INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton
    phone_primary     TEXT DEFAULT '+21625589419',
    email             TEXT DEFAULT '',
    address           TEXT DEFAULT 'Tunis â€” Toute la Tunisie',
    whatsapp_number   TEXT DEFAULT '21625589419',
    instagram_url     TEXT DEFAULT 'https://www.instagram.com/yakoub_etanche',
    facebook_url      TEXT DEFAULT 'https://www.facebook.com/yakoubetanche',
    tiktok_url        TEXT DEFAULT 'https://www.tiktok.com/@yakoub_etanche',
    stat_projects     TEXT DEFAULT '500+',
    stat_experience   TEXT DEFAULT '15',
    stat_guarantee    TEXT DEFAULT '10',
    stat_satisfaction TEXT DEFAULT '98%',
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Ensure at least one settings row exists (seed)
INSERT INTO public.site_settings (id, phone_primary, email, address, whatsapp_number, instagram_url, facebook_url, tiktok_url, stat_projects, stat_experience, stat_guarantee, stat_satisfaction)
VALUES (
    1,
    '+21625589419',
    'yakoub.etanche@gmail.com',
    'Tunis â€” Toute la Tunisie ðŸ‡¹ðŸ‡³',
    '21625589419',
    'https://www.instagram.com/yakoub_etanche',
    'https://www.facebook.com/yakoubetanche',
    'https://www.tiktok.com/@yakoub_etanche',
    '500+',
    '15',
    '10',
    '98%'
)
ON CONFLICT (id) DO NOTHING;  -- Don't overwrite existing settings

-- ============================================================
-- 5. TEAM MEMBERS TABLE
--    NOTE: Code uses 'team_members' (not 'team') Ã¢â‚¬â€ fixed here
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    role       TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_team_members_updated_at ON public.team_members;
CREATE TRIGGER set_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 6. PARTNERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partners (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name          TEXT NOT NULL,
    logo_url      TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_partners_order ON public.partners(display_order ASC);

-- ============================================================
-- 7. TESTIMONIALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_name TEXT NOT NULL,
    content     TEXT NOT NULL,
    rating      INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    city        TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

DROP TRIGGER IF EXISTS set_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER set_testimonials_updated_at
    BEFORE UPDATE ON public.testimonials
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_testimonials_rating   ON public.testimonials(rating DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON public.testimonials(is_featured);

-- ============================================================
-- 8. EXPENSES TABLE (general overhead costs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category    TEXT NOT NULL CHECK (category IN ('food', 'salary', 'transport', 'material', 'equipment', 'rent', 'utilities', 'other')),
    description TEXT NOT NULL,
    amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    reference   TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date     ON public.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.expenses;
CREATE TRIGGER set_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.blogs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses       ENABLE ROW LEVEL SECURITY;

-- â”€â”€ Public Read Policies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Drop existing policies (safe re-run)
DROP POLICY IF EXISTS "Public read projects"      ON public.projects;
DROP POLICY IF EXISTS "Public read blogs"         ON public.blogs;
DROP POLICY IF EXISTS "Public read partners"      ON public.partners;
DROP POLICY IF EXISTS "Public read testimonials"  ON public.testimonials;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read access"        ON public.projects;
DROP POLICY IF EXISTS "Public read access"        ON public.blogs;
DROP POLICY IF EXISTS "Public read access"        ON public.partners;
DROP POLICY IF EXISTS "Public read access"        ON public.testimonials;
DROP POLICY IF EXISTS "Public read access"        ON public.site_settings;

CREATE POLICY "Public read projects"      ON public.projects      FOR SELECT USING (true);
CREATE POLICY "Public read blogs"         ON public.blogs         FOR SELECT USING (status = 'published');
CREATE POLICY "Public read partners"      ON public.partners      FOR SELECT USING (true);
CREATE POLICY "Public read testimonials"  ON public.testimonials  FOR SELECT USING (true);
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

-- â”€â”€ Public Insert (Quote Wizard â†’ leads) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Public insert leads"
    ON public.leads FOR INSERT
    WITH CHECK (true);

-- â”€â”€ Authenticated Admin Policies (full access) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Leads full admin access
DROP POLICY IF EXISTS "Authenticated full access on leads" ON public.leads;
CREATE POLICY "Authenticated full access on leads"
    ON public.leads
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Projects full admin access
DROP POLICY IF EXISTS "Authenticated full access on projects" ON public.projects;
CREATE POLICY "Authenticated full access on projects"
    ON public.projects
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Blogs full admin access
DROP POLICY IF EXISTS "Authenticated full access on blogs" ON public.blogs;
CREATE POLICY "Authenticated full access on blogs"
    ON public.blogs
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Testimonials full admin access
DROP POLICY IF EXISTS "Authenticated full access on testimonials" ON public.testimonials;
CREATE POLICY "Authenticated full access on testimonials"
    ON public.testimonials
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Partners full admin access
DROP POLICY IF EXISTS "Authenticated full access on partners" ON public.partners;
CREATE POLICY "Authenticated full access on partners"
    ON public.partners
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Site settings full admin access
DROP POLICY IF EXISTS "Authenticated full access on site_settings" ON public.site_settings;
CREATE POLICY "Authenticated full access on site_settings"
    ON public.site_settings
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Team members full admin access (no public read â€” it's sensitive)
DROP POLICY IF EXISTS "Authenticated full access on team_members" ON public.team_members;
CREATE POLICY "Authenticated full access on team_members"
    ON public.team_members
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Expenses admin only
DROP POLICY IF EXISTS "Authenticated full access on expenses" ON public.expenses;
CREATE POLICY "Authenticated full access on expenses"
    ON public.expenses
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET SETUP
-- ============================================================
-- Creates the public "images" bucket and grants access policies

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: public read (anyone can view uploaded images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read storage'
  ) THEN
    CREATE POLICY "Public read storage"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'images');
  END IF;
END $$;

-- Storage policy: authenticated admins can upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload'
  ) THEN
    CREATE POLICY "Authenticated upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Storage policy: authenticated admins can delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated delete'
  ) THEN
    CREATE POLICY "Authenticated delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'images' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- RLS POLICIES: Ensure UPDATE access for all admin tables
-- (Idempotent Ã¢â‚¬â€ safe to re-run)
-- ============================================================

-- LEADS: full CRUD for authenticated admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'Authenticated full access to leads'
  ) THEN
    CREATE POLICY "Authenticated full access to leads"
      ON public.leads FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- PROJECTS: full CRUD for authenticated admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Authenticated full access to projects'
  ) THEN
    CREATE POLICY "Authenticated full access to projects"
      ON public.projects FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- PARTNERS: full CRUD for authenticated admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'partners' AND policyname = 'Authenticated full access to partners'
  ) THEN
    CREATE POLICY "Authenticated full access to partners"
      ON public.partners FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- BLOGS: full CRUD for authenticated admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blogs' AND policyname = 'Authenticated full access to blogs'
  ) THEN
    CREATE POLICY "Authenticated full access to blogs"
      ON public.blogs FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- SAMPLE / SEED DATA (Optional Ã¢â‚¬â€ uncomment to insert demo data)
-- ============================================================

-- Demo testimonial
-- INSERT INTO public.testimonials (client_name, content, rating, city, is_featured)
-- VALUES
--   ('Ahmed B.', 'Service exceptionnel ! Mon toit ne fuit plus depuis 2 ans.', 5, 'Tunis', TRUE),
--   ('Sami L.',  'Ã‰quipe professionnelle, travail soignÃ© et rapide. TrÃ¨s satisfait !', 5, 'Sousse', TRUE)
-- ON CONFLICT DO NOTHING;

-- Demo partner
-- INSERT INTO public.partners (name, logo_url, display_order)
-- VALUES ('Derbigum', 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Derbigum_logo.svg', 1)
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES (run after to confirm everything is OK)
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE schemaname IN ('public', 'storage') ORDER BY schemaname, tablename;
-- SELECT * FROM public.site_settings;

-- Activity Log table for admin action tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'invite', 'status_change', 'publish')),
  entity TEXT NOT NULL,          -- e.g. 'lead', 'project', 'blog', 'team_member', 'expense'
  entity_id TEXT,                -- ID of the affected row (nullable for general actions)
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries ordered by time
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read activity logs
CREATE POLICY "Authenticated users can view activity log"
  ON activity_log FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity log"
  ON activity_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Auto-cleanup: keep only last 500 entries (run periodically or via trigger)
-- Optional: uncomment if you want automatic pruning
-- CREATE OR REPLACE FUNCTION prune_activity_log()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   DELETE FROM activity_log
--   WHERE id NOT IN (
--     SELECT id FROM activity_log ORDER BY created_at DESC LIMIT 500
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- CREATE TRIGGER trigger_prune_activity_log
--   AFTER INSERT ON activity_log
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION prune_activity_log();
-- ============================================================
-- 9. EMAILS TABLE (inbound/outbound via Resend)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    html_body TEXT,
    text_body TEXT,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emails_direction ON public.emails(direction);
CREATE INDEX IF NOT EXISTS idx_emails_created   ON public.emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_is_read   ON public.emails(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Drop old policies (safe re-run)
DROP POLICY IF EXISTS "Admins can view all emails" ON public.emails;
DROP POLICY IF EXISTS "Admins can insert outbound emails" ON public.emails;
DROP POLICY IF EXISTS "Admins can update emails (mark as read)" ON public.emails;
DROP POLICY IF EXISTS "Admins can delete emails" ON public.emails;
DROP POLICY IF EXISTS "Service role full access emails" ON public.emails;
DROP POLICY IF EXISTS "Authenticated full access on emails" ON public.emails;
DROP POLICY IF EXISTS "Authenticated insert emails" ON public.emails;

-- Authenticated users: read all emails
CREATE POLICY "Admins can view all emails" 
    ON public.emails FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Authenticated users: insert any direction (outbound from dashboard)
CREATE POLICY "Authenticated insert emails" 
    ON public.emails FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Service role: full access for webhook inbound inserts
CREATE POLICY "Service role full access emails"
    ON public.emails FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users: update (mark as read)
CREATE POLICY "Admins can update emails (mark as read)" 
    ON public.emails FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Authenticated users: delete
CREATE POLICY "Admins can delete emails" 
    ON public.emails FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Add realtime subscription (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'emails'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emails;
  END IF;
END $$;

-- ============================================================
-- UPSERT LEAD LOGIC (ANTI-DUPLICATE)
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_lead_with_upsert(
  p_client_name TEXT,
  p_phone TEXT,
  p_problem_type TEXT,
  p_surface_area INTEGER,
  p_is_urgent BOOLEAN,
  p_message TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_id UUID;
  v_existing_status TEXT;
  v_existing_msg TEXT;
BEGIN
  -- Check if phone exists
  SELECT id, status, message INTO v_lead_id, v_existing_status, v_existing_msg
  FROM public.leads 
  WHERE phone = p_phone 
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    -- Upsert/Update case
    UPDATE public.leads
    SET 
      client_name = p_client_name,
      problem_type = p_problem_type,
      surface_area = p_surface_area,
      is_urgent = p_is_urgent,
      status = 'new',
      message = '[RELANCE/MISE À JOUR] ' || p_message || CHR(10) || '--- Ancien message ---' || CHR(10) || COALESCE(v_existing_msg, ''),
      updated_at = NOW()
    WHERE id = v_lead_id;
    RETURN v_lead_id;
  ELSE
    -- Insert new
    INSERT INTO public.leads (client_name, phone, problem_type, surface_area, is_urgent, message, status)
    VALUES (p_client_name, p_phone, p_problem_type, p_surface_area, p_is_urgent, p_message, 'new')
    RETURNING id INTO v_lead_id;
    RETURN v_lead_id;
  END IF;
END;
$$;
