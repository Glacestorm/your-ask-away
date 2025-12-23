-- Add columns for machine translation tracking and batch processing
ALTER TABLE public.cms_translations 
ADD COLUMN IF NOT EXISTS is_machine_translated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS source_locale text,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 1;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cms_translations_locale_namespace 
ON public.cms_translations(locale, namespace);

CREATE INDEX IF NOT EXISTS idx_cms_translations_key_locale 
ON public.cms_translations(translation_key, locale);

-- Create supported_languages table to manage 65+ languages
CREATE TABLE IF NOT EXISTS public.supported_languages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locale text NOT NULL UNIQUE,
  name text NOT NULL,
  native_name text NOT NULL,
  flag_emoji text,
  is_rtl boolean DEFAULT false,
  tier integer DEFAULT 3,
  is_active boolean DEFAULT true,
  translation_progress integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supported_languages ENABLE ROW LEVEL SECURITY;

-- Public read access for languages
CREATE POLICY "Anyone can view supported languages"
ON public.supported_languages FOR SELECT
USING (true);

-- Insert base languages (Tier 1 - Current)
INSERT INTO public.supported_languages (locale, name, native_name, flag_emoji, is_rtl, tier, is_active, translation_progress) VALUES
  ('es', 'Spanish', 'Español', '🇪🇸', false, 1, true, 100),
  ('en', 'English', 'English', '🇬🇧', false, 1, true, 100),
  ('fr', 'French', 'Français', '🇫🇷', false, 1, true, 100),
  ('ca', 'Catalan', 'Català', '🇦🇩', false, 1, true, 100)
ON CONFLICT (locale) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  flag_emoji = EXCLUDED.flag_emoji,
  is_rtl = EXCLUDED.is_rtl,
  tier = EXCLUDED.tier,
  is_active = EXCLUDED.is_active;

-- Insert Tier 1 expansion languages (High priority markets)
INSERT INTO public.supported_languages (locale, name, native_name, flag_emoji, is_rtl, tier, is_active, translation_progress) VALUES
  ('de', 'German', 'Deutsch', '🇩🇪', false, 1, true, 0),
  ('pt', 'Portuguese', 'Português', '🇵🇹', false, 1, true, 0),
  ('pt-BR', 'Portuguese (Brazil)', 'Português (Brasil)', '🇧🇷', false, 1, true, 0),
  ('it', 'Italian', 'Italiano', '🇮🇹', false, 1, true, 0),
  ('zh-CN', 'Chinese (Simplified)', '简体中文', '🇨🇳', false, 1, true, 0),
  ('ja', 'Japanese', '日本語', '🇯🇵', false, 1, true, 0),
  ('ko', 'Korean', '한국어', '🇰🇷', false, 1, true, 0),
  ('ru', 'Russian', 'Русский', '🇷🇺', false, 1, true, 0)
ON CONFLICT (locale) DO NOTHING;

-- Insert Tier 2 languages (Medium priority)
INSERT INTO public.supported_languages (locale, name, native_name, flag_emoji, is_rtl, tier, is_active, translation_progress) VALUES
  ('nl', 'Dutch', 'Nederlands', '🇳🇱', false, 2, true, 0),
  ('pl', 'Polish', 'Polski', '🇵🇱', false, 2, true, 0),
  ('cs', 'Czech', 'Čeština', '🇨🇿', false, 2, true, 0),
  ('ro', 'Romanian', 'Română', '🇷🇴', false, 2, true, 0),
  ('hu', 'Hungarian', 'Magyar', '🇭🇺', false, 2, true, 0),
  ('sv', 'Swedish', 'Svenska', '🇸🇪', false, 2, true, 0),
  ('da', 'Danish', 'Dansk', '🇩🇰', false, 2, true, 0),
  ('no', 'Norwegian', 'Norsk', '🇳🇴', false, 2, true, 0),
  ('fi', 'Finnish', 'Suomi', '🇫🇮', false, 2, true, 0),
  ('el', 'Greek', 'Ελληνικά', '🇬🇷', false, 2, true, 0),
  ('tr', 'Turkish', 'Türkçe', '🇹🇷', false, 2, true, 0),
  ('uk', 'Ukrainian', 'Українська', '🇺🇦', false, 2, true, 0),
  ('ar', 'Arabic', 'العربية', '🇸🇦', true, 2, true, 0),
  ('he', 'Hebrew', 'עברית', '🇮🇱', true, 2, true, 0)
ON CONFLICT (locale) DO NOTHING;

-- Insert Tier 3 languages (Global coverage)
INSERT INTO public.supported_languages (locale, name, native_name, flag_emoji, is_rtl, tier, is_active, translation_progress) VALUES
  ('zh-TW', 'Chinese (Traditional)', '繁體中文', '🇹🇼', false, 3, true, 0),
  ('th', 'Thai', 'ไทย', '🇹🇭', false, 3, true, 0),
  ('vi', 'Vietnamese', 'Tiếng Việt', '🇻🇳', false, 3, true, 0),
  ('id', 'Indonesian', 'Bahasa Indonesia', '🇮🇩', false, 3, true, 0),
  ('ms', 'Malay', 'Bahasa Melayu', '🇲🇾', false, 3, true, 0),
  ('hi', 'Hindi', 'हिन्दी', '🇮🇳', false, 3, true, 0),
  ('bn', 'Bengali', 'বাংলা', '🇧🇩', false, 3, true, 0),
  ('tl', 'Filipino', 'Filipino', '🇵🇭', false, 3, true, 0),
  ('ur', 'Urdu', 'اردو', '🇵🇰', true, 3, true, 0),
  ('fa', 'Persian', 'فارسی', '🇮🇷', true, 3, true, 0),
  ('bg', 'Bulgarian', 'Български', '🇧🇬', false, 3, true, 0),
  ('hr', 'Croatian', 'Hrvatski', '🇭🇷', false, 3, true, 0),
  ('sk', 'Slovak', 'Slovenčina', '🇸🇰', false, 3, true, 0),
  ('sl', 'Slovenian', 'Slovenščina', '🇸🇮', false, 3, true, 0),
  ('et', 'Estonian', 'Eesti', '🇪🇪', false, 3, true, 0),
  ('lv', 'Latvian', 'Latviešu', '🇱🇻', false, 3, true, 0),
  ('lt', 'Lithuanian', 'Lietuvių', '🇱🇹', false, 3, true, 0),
  ('es-MX', 'Spanish (Mexico)', 'Español (México)', '🇲🇽', false, 3, true, 0),
  ('es-AR', 'Spanish (Argentina)', 'Español (Argentina)', '🇦🇷', false, 3, true, 0),
  ('en-US', 'English (US)', 'English (US)', '🇺🇸', false, 3, true, 0),
  ('fr-CA', 'French (Canada)', 'Français (Canada)', '🇨🇦', false, 3, true, 0),
  ('af', 'Afrikaans', 'Afrikaans', '🇿🇦', false, 3, true, 0)
ON CONFLICT (locale) DO NOTHING;

-- Insert Tier 4 languages (Extended coverage for 65+)
INSERT INTO public.supported_languages (locale, name, native_name, flag_emoji, is_rtl, tier, is_active, translation_progress) VALUES
  ('ga', 'Irish', 'Gaeilge', '🇮🇪', false, 4, false, 0),
  ('is', 'Icelandic', 'Íslenska', '🇮🇸', false, 4, false, 0),
  ('mt', 'Maltese', 'Malti', '🇲🇹', false, 4, false, 0),
  ('lb', 'Luxembourgish', 'Lëtzebuergesch', '🇱🇺', false, 4, false, 0),
  ('bs', 'Bosnian', 'Bosanski', '🇧🇦', false, 4, false, 0),
  ('sr', 'Serbian', 'Српски', '🇷🇸', false, 4, false, 0),
  ('mk', 'Macedonian', 'Македонски', '🇲🇰', false, 4, false, 0),
  ('sq', 'Albanian', 'Shqip', '🇦🇱', false, 4, false, 0),
  ('ka', 'Georgian', 'ქართული', '🇬🇪', false, 4, false, 0),
  ('hy', 'Armenian', 'Հայերdelays', '🇦🇲', false, 4, false, 0),
  ('az', 'Azerbaijani', 'Azərbaycan', '🇦🇿', false, 4, false, 0),
  ('kk', 'Kazakh', 'Қазақ', '🇰🇿', false, 4, false, 0),
  ('uz', 'Uzbek', 'Oʻzbek', '🇺🇿', false, 4, false, 0),
  ('ne', 'Nepali', 'नेपाली', '🇳🇵', false, 4, false, 0),
  ('si', 'Sinhala', 'සිංහල', '🇱🇰', false, 4, false, 0),
  ('my', 'Burmese', 'မြန်မာ', '🇲🇲', false, 4, false, 0),
  ('km', 'Khmer', 'ខ្មែរ', '🇰🇭', false, 4, false, 0),
  ('lo', 'Lao', 'ລາວ', '🇱🇦', false, 4, false, 0),
  ('am', 'Amharic', 'አማርኛ', '🇪🇹', false, 4, false, 0),
  ('sw', 'Swahili', 'Kiswahili', '🇰🇪', false, 4, false, 0),
  ('ha', 'Hausa', 'Hausa', '🇳🇬', false, 4, false, 0),
  ('yo', 'Yoruba', 'Yorùbá', '🇳🇬', false, 4, false, 0),
  ('ig', 'Igbo', 'Igbo', '🇳🇬', false, 4, false, 0)
ON CONFLICT (locale) DO NOTHING;

-- Create function to update translation progress
CREATE OR REPLACE FUNCTION public.update_translation_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update progress for the affected locale
  UPDATE public.supported_languages 
  SET translation_progress = (
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN ct.value IS NOT NULL AND ct.value != '' THEN 1 END)::numeric / 
        NULLIF((SELECT COUNT(*) FROM public.cms_translations WHERE locale = 'es'), 0)) * 100
      ), 0
    )
    FROM public.cms_translations ct 
    WHERE ct.locale = NEW.locale
  ),
  updated_at = now()
  WHERE locale = NEW.locale;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update progress
DROP TRIGGER IF EXISTS trigger_update_translation_progress ON public.cms_translations;
CREATE TRIGGER trigger_update_translation_progress
AFTER INSERT OR UPDATE ON public.cms_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_translation_progress();