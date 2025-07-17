import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.ASC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.ASC_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase URL and Anon Key must be provided in environment variables');
    }
    
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }
  
  return supabaseClient;
}

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  provider: 'gemini' | 'groq';
  api_key: string;
  created_at: string;
  updated_at: string;
}

export const ApiKeyService = {
  async getApiKey(userId: string, provider: 'gemini' | 'groq'): Promise<string | null> {
    const { data, error } = await getSupabaseClient()
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !data) {
      return null;
    }

    return data.api_key;
  },

  async saveApiKey(userId: string, provider: 'gemini' | 'groq', apiKey: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('api_keys')
      .upsert(
        {
          user_id: userId,
          provider,
          api_key: apiKey,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) {
      throw new Error(`Failed to save API key: ${error.message}`);
    }
  },

  async deleteApiKey(userId: string, provider: 'gemini' | 'groq'): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('api_keys')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }
  }
};

export default ApiKeyService;
