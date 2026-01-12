-- Beta Feedback System

-- Table for user feedback on different app sections
CREATE TABLE public.beta_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL, -- e.g., 'dashboard', 'expenses', 'income', 'mentorship', etc.
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  ease_of_use INTEGER CHECK (ease_of_use >= 1 AND ease_of_use <= 5),
  usefulness INTEGER CHECK (usefulness >= 1 AND usefulness <= 5),
  design_rating INTEGER CHECK (design_rating >= 1 AND design_rating <= 5),
  comment TEXT,
  suggestions TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for tracking feature usage
CREATE TABLE public.feature_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL, -- e.g., 'quick_capture', 'voice_assistant', 'receipt_scan', etc.
  page_path TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'click', 'create', 'update', 'delete'
  metadata JSONB,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for general bug reports / suggestions
CREATE TABLE public.beta_bug_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'bug', -- 'bug', 'suggestion', 'question'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_path TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'reviewed', 'in_progress', 'resolved', 'wont_fix'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON public.beta_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.beta_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON public.beta_feedback
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.user_role));

-- Users can log their own usage
CREATE POLICY "Users can log own usage" ON public.feature_usage_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all usage logs
CREATE POLICY "Admins can view all usage" ON public.feature_usage_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.user_role));

-- Users can create bug reports
CREATE POLICY "Users can create bug reports" ON public.beta_bug_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports" ON public.beta_bug_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all bug reports
CREATE POLICY "Admins can view all bug reports" ON public.beta_bug_reports
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.user_role));

-- Admins can update bug reports (to add notes, change status)
CREATE POLICY "Admins can update bug reports" ON public.beta_bug_reports
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::public.user_role));

-- Create indexes for performance
CREATE INDEX idx_beta_feedback_user ON public.beta_feedback(user_id);
CREATE INDEX idx_beta_feedback_section ON public.beta_feedback(section);
CREATE INDEX idx_beta_feedback_created ON public.beta_feedback(created_at DESC);
CREATE INDEX idx_feature_usage_user ON public.feature_usage_logs(user_id);
CREATE INDEX idx_feature_usage_feature ON public.feature_usage_logs(feature_name);
CREATE INDEX idx_feature_usage_created ON public.feature_usage_logs(created_at DESC);
CREATE INDEX idx_bug_reports_status ON public.beta_bug_reports(status);
CREATE INDEX idx_bug_reports_created ON public.beta_bug_reports(created_at DESC);

-- Function to get user session stats
CREATE OR REPLACE FUNCTION public.get_user_beta_stats(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_actions', COUNT(*),
    'unique_features', COUNT(DISTINCT feature_name),
    'unique_pages', COUNT(DISTINCT page_path),
    'first_activity', MIN(created_at),
    'last_activity', MAX(created_at),
    'days_active', COUNT(DISTINCT DATE(created_at))
  ) INTO result
  FROM public.feature_usage_logs
  WHERE user_id = target_user_id;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_beta_stats(UUID) TO authenticated;