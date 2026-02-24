
CREATE TABLE public.user_library_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_key)
);

ALTER TABLE public.user_library_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.user_library_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.user_library_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.user_library_favorites FOR DELETE USING (auth.uid() = user_id);
