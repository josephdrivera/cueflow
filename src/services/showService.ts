import { supabase } from '@/lib/supabase';

const TABLE_NAME = 'shows';

export interface Show {
  id: string;
  title: string;
  description?: string;
  creator_id?: string;
  is_template?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface NewShow {
  title: string;
  description?: string;
  is_template?: boolean;
  metadata?: Record<string, any>;
}

export async function createShow(show: NewShow): Promise<Show> {
  try {
    const newShow = {
      title: show.title,
      description: show.description,
      is_template: show.is_template || false,
      metadata: show.metadata || {}
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([newShow])
      .select()
      .single();

    if (error) {
      console.error('Error creating show:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from show creation');
    }
    
    return data;
  } catch (error) {
    console.error('Error in createShow:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function getShowById(id: string): Promise<Show> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting show:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error(`Show not found with id: ${id}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in getShowById:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function getAllShows(): Promise<Show[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting shows:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllShows:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function updateShow(id: string, show: Partial<Show>): Promise<Show> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(show)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating show:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error(`Show not found with id: ${id}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateShow:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function deleteShow(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting show:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteShow:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}
