-- Enable Row Level Security
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.api_keys;

-- Create API keys table
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'groq')),
    api_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure each user can only have one API key per provider
    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_provider ON public.api_keys(provider);

-- Set up Row Level Security policies
CREATE POLICY "Users can manage their own API keys" 
ON public.api_keys
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row update
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated_user;
GRANT USAGE, SELECT ON SEQUENCE public.api_keys_id_seq TO authenticated_user;
