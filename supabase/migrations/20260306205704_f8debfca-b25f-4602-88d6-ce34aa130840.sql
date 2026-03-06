
DROP POLICY IF EXISTS "Users can read all leaderboard entries" ON public.ecosystem_leaderboard;

CREATE POLICY "Authenticated users can read leaderboard"
ON public.ecosystem_leaderboard
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
