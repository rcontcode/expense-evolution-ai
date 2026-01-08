-- Add display_preferences column to profiles table for Dashboard view modes
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_preferences JSONB 
DEFAULT '{
  "view_mode": "classic",
  "active_areas": ["negocio", "familia", "diadia", "crecimiento", "impuestos"],
  "collapsed_areas": [],
  "show_focus_dialog": false
}'::jsonb;