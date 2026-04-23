/**
 * Yakoub Travaux – API Client
 * 
 * All data operations via Supabase directly.
 * Python backend is used only for:
 *   - Image upload (storage)
 *   - Legacy endpoints (if available)
 * 
 * Supabase is the primary data source for all CRUD.
 */

import { supabase } from '@/lib/supabase';
import { compressImageForStorage } from './image-utils';
import { getLeadNotificationHtml } from './email-templates';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LeadData {
  client_name: string;
  phone: string;
  problem_type: string;
  surface_area?: number;
  is_urgent: boolean;
  message?: string;
}

export interface Lead {
  id: string;
  client_name: string;
  name?: string;
  phone: string;
  problem_type: string;
  surface_area: number | null;
  is_urgent: boolean;
  message: string | null;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  created_at: string;
  updated_at?: string;
  location?: string;
}

export interface LeadResponse {
  id: string;
  message: string;
}

export interface Project {
  id: string;
  category: string;
  title: string;
  description: string;
  cover_image: string | null;
  image_before: string | null;
  image_after: string | null;
  location_gov: string | null;
  gallery_images?: string[];
  project_type?: string;
  display_order?: number;
  created_at?: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
}

export interface ApiError {
  detail: string;
}

// ─── Emails ──────────────────────────────────────────────────────────────────

export interface Email {
  id: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  from_email: string;
  to_email: string;
  direction: 'inbound' | 'outbound';
  is_read: boolean;
  created_at: string;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// ─── Leads (Supabase) ────────────────────────────────────────────────────────

/**
 * Submit a lead from the public Quote Wizard
 * Writes directly to Supabase — no backend required
 */
export async function submitLead(data: LeadData): Promise<LeadResponse> {
  // Use RPC function to safely handle duplicate phone numbers (upsert)
  const { data: leadId, error } = await supabase
    .rpc('submit_lead_with_upsert', {
      p_client_name: data.client_name,
      p_phone: data.phone,
      p_problem_type: data.problem_type,
      p_surface_area: data.surface_area ?? null,
      p_is_urgent: data.is_urgent,
      p_message: data.message ?? null
    });

  if (error) {
    console.error('submitLead error:', error);
    throw new Error(error.message || 'Échec de l\'envoi. Veuillez réessayer.');
  }

  // Attempt to send email notification
  try {
    const { data: settings } = await supabase.from('site_settings').select('email, enable_email_notifications').single();
    
    // Default to true if not explicitly set to false
    if (settings?.enable_email_notifications !== false) {
      const dashboardUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yakoub-etancheite.com.tn';
      const emailHtml = getLeadNotificationHtml(data, dashboardUrl);
      
      const toEmail = settings?.email || 'team@yakoub-etancheite.com.tn';

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: toEmail,
          subject: `${data.is_urgent ? '⚡ URGENT' : '📋 Nouveau'} Prospect: ${data.client_name} — ${data.problem_type}`,
          html: emailHtml
        })
      });
    }
  } catch (emailError) {
    console.error("Failed to send email notification:", emailError);
  }

  return { id: leadId, message: 'Lead submitted successfully' };
}

/**
 * Fetch all leads for dashboard (authenticated)
 */
export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getLeads error:', error);
    return [];
  }

  return (data as Lead[]) || [];
}

/**
 * Update lead status (Kanban drag-drop)
 */
export async function updateLeadStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Impossible de mettre à jour le statut.');
  }
}

/**
 * Update lead fields (full edit from detail sidebar)
 */
export async function updateLead(id: string, data: Partial<{
  client_name: string;
  phone: string;
  problem_type: string;
  surface_area: number | null;
  message: string;
  status: string;
}>): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update(data)
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Impossible de modifier le prospect.');
  }
}

// ─── Projects (Supabase) ─────────────────────────────────────────────────────

/**
 * Fetch all portfolio projects (public)
 */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProjects error:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new project (admin dashboard)
 */
export async function createProject(data: {
  title: string;
  description: string;
  category: string;
  image_before?: string;
  image_after?: string;
  gallery_images?: string[];
  project_type?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .insert([{
      title: data.title,
      description: data.description,
      category: data.category,
      image_before: data.image_before ?? null,
      image_after: data.image_after ?? null,
      gallery_images: data.gallery_images ?? [],
      project_type: data.project_type ?? 'before_after',
    }]);

  if (error) {
    throw new Error(error.message || 'Impossible de créer le projet.');
  }
}

/**
 * Delete a project (admin dashboard)
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Impossible de supprimer le projet.');
  }
}

/**
 * Update a project (admin dashboard)
 */
export async function updateProject(id: string, data: Partial<{
  title: string;
  description: string;
  category: string;
  image_before: string;
  image_after: string;
  gallery_images: string[];
  project_type: string;
}>): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Impossible de modifier le projet.');
  }
}

// ─── Image Upload ────────────────────────────────────────────────────────────

/**
 * Upload image to Supabase Storage bucket 'images'.
 * Falls back to Python backend if Supabase storage not configured.
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const compressedFile = await compressImageForStorage(file);

  // Try Supabase Storage first
  try {
    const ext = compressedFile.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, compressedFile, {
        cacheControl: '3600',
        contentType: compressedFile.type,
        upsert: false,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return { url: publicData.publicUrl, filename };
  } catch (supabaseErr) {
    console.warn('Supabase storage unavailable, falling back to backend:', supabaseErr);
  }

  // Fallback: Python backend upload
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};

  const formData = new FormData();
  formData.append('file', compressedFile);

  const response = await fetch(`${BACKEND_URL}/api/admin/upload`, {
    method: 'POST',
    headers: authHeader,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Échec du téléchargement de l\'image' }));
    throw new Error(err.detail);
  }

  return response.json();
}

// ─── Health Check ────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('site_settings').select('id').limit(1).single();
    return !error;
  } catch {
    return false;
  }
}

// ─── Legacy / unused exports kept for compatibility ──────────────────────────
export async function getProjectsByLang(lang: 'fr' | 'ar'): Promise<Project[]> {
  return getProjects();
}

export interface Settings {
  whatsapp_number: string;
  admin_email: string;
  enable_email_notifications: boolean;
  enable_whatsapp_notifications: boolean;
  default_language: 'fr' | 'ar';
}

export async function getSettings(): Promise<Settings> {
  const { data } = await supabase.from('site_settings').select('*').single();
  return {
    whatsapp_number: data?.whatsapp_number ?? '',
    admin_email: data?.email ?? '',
    enable_email_notifications: data?.enable_email_notifications !== false,
    enable_whatsapp_notifications: true,
    default_language: 'fr',
  };
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  return settings;
}

// ─── Email Management ────────────────────────────────────────────────────────

/**
 * Fetch all emails (inbox + sent)
 */
export async function getEmails(): Promise<Email[]> {
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getEmails error:', error);
    return [];
  }

  return (data as Email[]) || [];
}

/**
 * Mark an email as read
 */
export async function markEmailAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('emails')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('markEmailAsRead error:', error);
  }
}

/**
 * Send an email from the admin dashboard and log it to Supabase
 */
export async function sendAdminEmail(payload: SendEmailPayload): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Not authenticated');

  // 1. Get admin email from settings (or fallback)
  const { data: settings } = await supabase.from('site_settings').select('email').single();
  const fromEmail = settings?.email || 'team@yakoub-etancheite.com.tn'; 

  // 2. Call the Edge Function to dispatch via Resend
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to send email' }));
    throw new Error(err.error || 'Failed to send email');
  }

  // 3. Log outbound email to Supabase
  const toEmailStr = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
  
  await supabase.from('emails').insert([{
    subject: payload.subject,
    html_body: payload.html,
    text_body: payload.text,
    from_email: fromEmail,
    to_email: toEmailStr,
    direction: 'outbound',
    is_read: true
  }]);
}

/**
 * Delete an email
 */
export async function deleteEmail(id: string): Promise<void> {
  const { error } = await supabase
    .from('emails')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteEmail error:', error);
    throw new Error(error.message);
  }
}


