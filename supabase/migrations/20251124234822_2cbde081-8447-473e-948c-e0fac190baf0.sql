-- Add tags column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_companies_tags ON public.companies USING GIN(tags);

-- Add comment
COMMENT ON COLUMN public.companies.tags IS 'Custom tags for flexible company categorization';