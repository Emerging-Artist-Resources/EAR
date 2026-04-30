-- 1. Drop ALL dependent policies

-- listing_occurrences
drop policy if exists "Admins can insert occurrences for parent events from pieces"
on public.listing_occurrences;

drop policy if exists "Admins can insert occurrences for parent workshops from classes"
on public.listing_occurrences;

-- listing_relationships
drop policy if exists "Admins have full access to relationships"
on public.listing_relationships;

-- profiles
drop policy if exists "Users can update their own profile"
on public.profiles;


-- 2. Alter the column

alter table "public"."profiles" alter column "role" drop default;

alter table "public"."profiles"
alter column role type "public"."user_role"
using role::text::"public"."user_role";

alter table "public"."profiles"
alter column "role" set default 'user'::public.user_role;


-- 3. Recreate policies

-- listing_occurrences
create policy "Admins can insert occurrences for parent events from pieces"
on public.listing_occurrences
for insert
to authenticated
with check (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

create policy "Admins can insert occurrences for parent workshops from classes"
on public.listing_occurrences
for insert
to authenticated
with check (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- listing_relationships
create policy "Admins have full access to relationships"
on public.listing_relationships
for all
to authenticated
using (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
with check (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- profiles (IMPORTANT: restore original logic exactly)
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  (id = auth.uid())
  AND (role = (
    SELECT profiles_1.role
    FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid()
  ))
  AND (artist_status = (
    SELECT profiles_1.artist_status
    FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid()
  ))
  AND (
    NOT (
      artist_status_reviewed_at IS DISTINCT FROM (
        SELECT profiles_1.artist_status_reviewed_at
        FROM profiles profiles_1
        WHERE profiles_1.id = auth.uid()
      )
    )
  )
  AND (
    NOT (
      artist_status_reviewed_by IS DISTINCT FROM (
        SELECT profiles_1.artist_status_reviewed_by
        FROM profiles profiles_1
        WHERE profiles_1.id = auth.uid()
      )
    )
  )
);