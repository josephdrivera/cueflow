# Fix for Infinite Recursion in Show Collaborators Policy

The error `infinite recursion detected in policy for relation "show_collaborators"` is occurring because the current Row Level Security (RLS) policy for the `show_collaborators` table has a circular reference.

Additionally, there's an issue with the shows table policies that prevents users from creating new shows.

## How to Fix

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project: "mebjhqdsirqulitgmdhf"
3. Go to the SQL Editor
4. Create a new query and paste the contents of the `fix_show_collaborators_policy.sql` file to fix the show collaborators issue
5. Create another query and paste the contents of the `fix_shows_policy.sql` file to fix the shows table issue
6. Run the queries

### Option 2: Use the fix_permissions.js Script

If you want to run the full permissions fix script:

1. Get your Supabase service role key from the Supabase dashboard:
   - Go to Project Settings > API
   - Copy the "service_role" key (keep this secure, it has admin privileges)

2. Add the service role key to your .env.local file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. Run the script:
   ```bash
   cd /Users/josephrivera/Desktop/Web\ Dev/cueflow
   node fix_permissions.js
   ```

## What Was Fixed

### 1. Show Collaborators Policy

The original policy had a circular reference:

```sql
CREATE POLICY "Show collaborators are viewable by show members" ON public.show_collaborators
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = show_id AND sc.user_id = auth.uid()
            )
        )
    )
);
```

The fixed policy removes the circular reference:

```sql
CREATE POLICY "Show collaborators are viewable by show members" ON public.show_collaborators
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND (
            user_id = auth.uid()
        )
    ) OR 
    user_id = auth.uid()
);
```

### 2. Shows Table Policies

The shows table was missing proper policies, which has been fixed by adding:

```sql
-- Shows policies
CREATE POLICY "Shows are viewable by creator and collaborators"
ON public.shows FOR SELECT
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.show_collaborators
        WHERE show_id = id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can create shows"
ON public.shows FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shows are editable by creator and collaborators with edit permission"
ON public.shows FOR UPDATE
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.show_collaborators
        WHERE show_id = id AND user_id = auth.uid() AND can_edit = true
    )
);

CREATE POLICY "Users can delete their own shows"
ON public.shows FOR DELETE
USING (auth.uid() = user_id);
```

After applying these fixes, both the "Failed to fetch collaborations" error and the "Error creating show" issues should be resolved.
