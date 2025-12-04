-- Fix recursive RLS policies on announcements table
-- This script fixes common RLS recursion issues

-- Step 1: Drop existing problematic policies (if any)
-- Replace 'your_policy_name' with the actual policy name from the check above
-- DROP POLICY IF EXISTS "your_policy_name" ON announcements;

-- Step 2: Create proper RLS policies that don't cause recursion

-- Policy for public read access (published announcements only)
CREATE POLICY "Public can view published announcements"
ON announcements
FOR SELECT
TO public
USING (
  archived_at IS NULL 
  AND published_at IS NOT NULL
);

-- Policy for authenticated users to view all (for admin dashboard)
CREATE POLICY "Authenticated users can view all announcements"
ON announcements
FOR SELECT
TO authenticated
USING (true);

-- Policy for admins to insert (check role from profiles table, not announcements)
CREATE POLICY "Admins can insert announcements"
ON announcements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy for admins to update
CREATE POLICY "Admins can update announcements"
ON announcements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Policy for admins to delete
CREATE POLICY "Admins can delete announcements"
ON announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- Note: If you don't have a profiles table, you can check app_metadata instead:
-- WITH CHECK (
--   (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
-- )

