-- Add columns for tracking cue order relationships
alter table public.cues
add column if not exists previous_cue_id uuid references public.cues(id) on delete set null,
add column if not exists next_cue_id uuid references public.cues(id) on delete set null;

-- Add constraint to ensure a cue can't reference itself
alter table public.cues
drop constraint if exists cue_self_reference_check;

alter table public.cues
add constraint cue_self_reference_check 
check (id != previous_cue_id and id != next_cue_id);

-- Add constraint to ensure proper cue number format
alter table public.cues
drop constraint if exists cue_number_format;

alter table public.cues
add constraint cue_number_format 
check (cue_number ~ '^[A-Z][0-9]{3}[a-z]?$');

-- Update RLS policies to include new columns
drop policy if exists "Users can update their own cues previous_cue_id and next_cue_id" on public.cues;

create policy "Users can update their own cues previous_cue_id and next_cue_id"
on public.cues
for update using (
    exists (
        select 1 from public.show_collaborators sc
        where sc.show_id = cues.show_id
        and sc.user_id = auth.uid()
        and sc.can_edit = true
    )
)
with check (
    exists (
        select 1 from public.show_collaborators sc
        where sc.show_id = cues.show_id
        and sc.user_id = auth.uid()
        and sc.can_edit = true
    )
);

-- Add indexes for better performance
create index if not exists cues_previous_cue_id_idx on public.cues(previous_cue_id);
create index if not exists cues_next_cue_id_idx on public.cues(next_cue_id);
