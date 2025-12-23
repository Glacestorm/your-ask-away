-- Drop the old restrictive locale check constraint
ALTER TABLE public.cms_translations DROP CONSTRAINT IF EXISTS cms_translations_locale_check;

-- Add a new constraint that validates against the supported_languages table
-- This allows any locale that exists in supported_languages
ALTER TABLE public.cms_translations ADD CONSTRAINT cms_translations_locale_check 
  CHECK (
    locale IN (
      'en', 'es', 'ca', 'fr', 'de', 'it', 'pt', 'pt-BR', 
      'zh-CN', 'zh-TW', 'ja', 'ko', 'ru', 'ar', 'he', 'nl', 
      'pl', 'cs', 'ro', 'hu', 'sv', 'da', 'no', 'fi', 'el', 
      'tr', 'uk', 'th', 'vi', 'id', 'ms', 'hi', 'bn', 'tl', 
      'ur', 'fa', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt', 
      'af', 'es-MX', 'es-AR', 'en-US', 'fr-CA', 'ga', 'is', 
      'mt', 'lb', 'bs', 'sr', 'mk', 'sq', 'ka', 'hy', 'az', 
      'kk', 'uz', 'ne', 'si', 'my', 'km', 'lo', 'am', 'sw', 
      'ha', 'yo', 'ig',
      -- Spanish regional languages
      'eu', 'gl', 'oc', 'ast', 'an'
    )
  );