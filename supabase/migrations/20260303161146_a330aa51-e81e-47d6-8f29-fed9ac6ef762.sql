-- Create a security definer function to check admin role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Drop the recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;

-- Recreate with security definer function (no recursion)
CREATE POLICY "Profiles viewable by own or admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- Also fix hearings policies that reference profiles directly
DROP POLICY IF EXISTS "Admins can insert hearings" ON public.hearings;
DROP POLICY IF EXISTS "Admins can update hearings" ON public.hearings;
DROP POLICY IF EXISTS "Admins can delete hearings" ON public.hearings;

CREATE POLICY "Admins can insert hearings" ON public.hearings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update hearings" ON public.hearings
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete hearings" ON public.hearings
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));