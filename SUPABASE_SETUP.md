# ASCode Supabase Setup Guide

This guide will help you set up Supabase for secure API key storage in ASCode.

## Prerequisites

1. A Supabase account (https://supabase.com/)
2. Node.js and npm installed
3. Git installed

## Step 1: Create a new Supabase project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Enter a name for your project (e.g., "ascode")
5. Set a secure database password
6. Choose a region close to you
7. Click "Create new project"

## Step 2: Set up the database

1. Once your project is ready, go to the SQL Editor in the Supabase dashboard
2. Click "New Query"
3. Copy the contents of `supabase/migrations/20240101000000_create_api_keys_table.sql`
4. Paste it into the query editor and run it

## Step 3: Configure Row Level Security (RLS)

1. Go to the "Authentication" section in the Supabase dashboard
2. Click on "Policies"
3. Enable Row Level Security (RLS) for the `api_keys` table

## Step 4: Get your API keys

1. Go to the "Project Settings" (gear icon) in the Supabase dashboard
2. Click on "API"
3. Note down your:
   - Project URL (e.g., `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`)
   - `anon` public key (starts with `ey...`)

## Step 5: Configure ASCode

Create a `.env` file in the root of your ASCode project with the following content:

```env
ASC_SUPABASE_URL=your_supabase_project_url
ASC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with the values from Step 4.

## Step 6: Run ASCode with Supabase

When you start ASCode, it will now use Supabase for secure API key storage. You can manage your API keys through the ASCode settings UI.

## Troubleshooting

1. **API key not saving**: Ensure that RLS is properly configured and the `api_keys` table has the correct permissions.
2. **Connection issues**: Verify that your Supabase project URL and anon key are correct.
3. **Migration errors**: If you encounter issues with the migration, you may need to manually create the table using the Supabase Table Editor.

For more information, refer to the [Supabase Documentation](https://supabase.com/docs).
