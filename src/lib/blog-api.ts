import { supabase } from './supabase';

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  status: 'draft' | 'published';
  author_id: string | null;
  author_name?: string;
  meta_keywords?: string;
  created_at: string;
  updated_at: string;
}



export const getBlogs = async (): Promise<Blog[]> => {
  try {
    const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to fetch blogs:", err);
    return [];
  }
};

export const getBlogBySlug = async (slug: string): Promise<Blog | null> => {
  try {
    const { data, error } = await supabase.from('blogs').select('*').eq('slug', slug).single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to fetch blog by slug:", err);
    return null;
  }
};

export const createBlog = async (blog: Partial<Blog>): Promise<void> => {
  try {
    const { error } = await supabase.from('blogs').insert([{
      ...blog,
      slug: blog.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    }]);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to create blog:", err);
    throw err;
  }
};

export const updateBlog = async (id: string, updates: Partial<Blog>): Promise<void> => {
  try {
    // Automatically update slug if title changes
    if (updates.title) {
      updates.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    const { error } = await supabase.from('blogs').update(updates).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to update blog:", err);
    throw err;
  }
};

export const deleteBlog = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to delete blog:", err);
    throw err;
  }
};
