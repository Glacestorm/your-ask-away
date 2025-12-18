-- Phase 1 CMS: Complete missing tables for full content management

-- Posts table for blog/news content
CREATE TABLE IF NOT EXISTS public.cms_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title JSONB NOT NULL DEFAULT '{}',
  excerpt JSONB DEFAULT '{}',
  content JSONB NOT NULL DEFAULT '{}',
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id),
  category_id UUID,
  reading_time_minutes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,
  meta_title JSONB DEFAULT '{}',
  meta_description JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.cms_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL DEFAULT '{}',
  description JSONB DEFAULT '{}',
  parent_id UUID REFERENCES public.cms_categories(id),
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key for posts category
ALTER TABLE public.cms_posts 
ADD CONSTRAINT cms_posts_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.cms_categories(id) ON DELETE SET NULL;

-- Tags table
CREATE TABLE IF NOT EXISTS public.cms_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL DEFAULT '{}',
  description JSONB DEFAULT '{}',
  color TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Post-Tags junction table
CREATE TABLE IF NOT EXISTS public.cms_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.cms_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.cms_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, tag_id)
);

-- Page revisions for version history
CREATE TABLE IF NOT EXISTS public.cms_page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL DEFAULT 1,
  title JSONB NOT NULL DEFAULT '{}',
  content JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  change_summary TEXT,
  UNIQUE(page_id, revision_number)
);

-- Post revisions for version history
CREATE TABLE IF NOT EXISTS public.cms_post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.cms_posts(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL DEFAULT 1,
  title JSONB NOT NULL DEFAULT '{}',
  content JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  change_summary TEXT,
  UNIQUE(post_id, revision_number)
);

-- Comments table for posts
CREATE TABLE IF NOT EXISTS public.cms_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.cms_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.cms_comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'trash')),
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON public.cms_posts(slug);
CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON public.cms_posts(status);
CREATE INDEX IF NOT EXISTS idx_cms_posts_published_at ON public.cms_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_posts_author ON public.cms_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_cms_posts_category ON public.cms_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_cms_categories_slug ON public.cms_categories(slug);
CREATE INDEX IF NOT EXISTS idx_cms_tags_slug ON public.cms_tags(slug);
CREATE INDEX IF NOT EXISTS idx_cms_comments_post ON public.cms_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_cms_comments_status ON public.cms_comments(status);
CREATE INDEX IF NOT EXISTS idx_cms_page_revisions_page ON public.cms_page_revisions(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_post_revisions_post ON public.cms_post_revisions(post_id);

-- Enable RLS on all new tables
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cms_posts
CREATE POLICY "Published posts are public" ON public.cms_posts
  FOR SELECT USING (status = 'published' AND published_at <= now());

CREATE POLICY "Admins can manage all posts" ON public.cms_posts
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Authors can manage own posts" ON public.cms_posts
  FOR ALL USING (auth.uid() = author_id);

-- RLS Policies for cms_categories
CREATE POLICY "Active categories are public" ON public.cms_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.cms_categories
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for cms_tags
CREATE POLICY "Active tags are public" ON public.cms_tags
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tags" ON public.cms_tags
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for cms_post_tags
CREATE POLICY "Post tags are readable" ON public.cms_post_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage post tags" ON public.cms_post_tags
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for cms_page_revisions
CREATE POLICY "Page revisions viewable by authenticated" ON public.cms_page_revisions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage page revisions" ON public.cms_page_revisions
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for cms_post_revisions
CREATE POLICY "Post revisions viewable by authenticated" ON public.cms_post_revisions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage post revisions" ON public.cms_post_revisions
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for cms_comments
CREATE POLICY "Approved comments are public" ON public.cms_comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Admins can manage comments" ON public.cms_comments
  FOR ALL USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can create comments" ON public.cms_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON public.cms_comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Update triggers
CREATE OR REPLACE FUNCTION public.update_cms_posts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cms_posts_updated_at
BEFORE UPDATE ON public.cms_posts
FOR EACH ROW EXECUTE FUNCTION public.update_cms_posts_timestamp();

CREATE TRIGGER update_cms_categories_updated_at
BEFORE UPDATE ON public.cms_categories
FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_cms_tags_updated_at
BEFORE UPDATE ON public.cms_tags
FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();

CREATE TRIGGER update_cms_comments_updated_at
BEFORE UPDATE ON public.cms_comments
FOR EACH ROW EXECUTE FUNCTION public.update_cms_updated_at();