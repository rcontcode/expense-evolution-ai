
DROP VIEW IF EXISTS public.published_testimonials;

CREATE OR REPLACE FUNCTION public.get_published_testimonials()
RETURNS TABLE(
  id uuid,
  rating integer,
  comment text,
  suggestions text,
  created_at timestamptz,
  display_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bf.id,
    bf.rating,
    bf.comment,
    bf.suggestions,
    bf.created_at,
    COALESCE(bf.display_name_override, p.full_name, 'Early User') AS display_name
  FROM public.beta_feedback bf
  LEFT JOIN public.profiles p ON p.id = bf.user_id
  WHERE bf.is_published_testimonial = true
  ORDER BY bf.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_published_testimonials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_testimonials() TO anon, authenticated;
