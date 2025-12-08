-- Create junction table for many-to-many relationship between projects and clients
CREATE TABLE public.project_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant', -- 'primary', 'participant', 'sponsor', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, client_id)
);

-- Enable RLS
ALTER TABLE public.project_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies (access through project ownership)
CREATE POLICY "Users can view their own project-client links"
  ON public.project_clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_clients.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own project-client links"
  ON public.project_clients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_clients.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own project-client links"
  ON public.project_clients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_clients.project_id 
    AND projects.user_id = auth.uid()
  ));

-- Add index for faster lookups
CREATE INDEX idx_project_clients_project ON public.project_clients(project_id);
CREATE INDEX idx_project_clients_client ON public.project_clients(client_id);