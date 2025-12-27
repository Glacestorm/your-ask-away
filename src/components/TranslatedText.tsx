import React, { useState, useEffect, ElementType } from 'react';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TranslatedTextProps {
  /** The original text to translate */
  text: string;
  /** Source locale of the text (default: 'es') */
  sourceLocale?: string;
  /** Unique identifier for caching */
  id?: string;
  /** Additional className for styling */
  className?: string;
  /** Render as specific element */
  as?: ElementType;
  /** Show loading indicator while translating */
  showLoading?: boolean;
  /** Fallback content while loading */
  fallback?: React.ReactNode;
  /** Disable translation */
  disabled?: boolean;
}

/**
 * Component that automatically translates text when the app language changes.
 * Perfect for dynamic content like product descriptions, news, etc.
 */
export function TranslatedText({
  text,
  sourceLocale = 'es',
  id,
  className,
  as: Component = 'span',
  showLoading = false,
  fallback,
  disabled = false,
}: TranslatedTextProps) {
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const { translate, isSourceLanguage } = useDynamicTranslation({ sourceLocale, enabled: !disabled });

  useEffect(() => {
    let isMounted = true;

    const translateContent = async () => {
      if (disabled || isSourceLanguage || !text) {
        setTranslatedText(text);
        return;
      }

      setIsLoading(true);
      try {
        const result = await translate(text, id);
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('[TranslatedText] Translation error:', error);
        if (isMounted) {
          setTranslatedText(text);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    translateContent();

    return () => {
      isMounted = false;
    };
  }, [text, translate, id, disabled, isSourceLanguage]);

  if (isLoading && showLoading) {
    return (
      <Component className={cn("inline-flex items-center gap-1", className)}>
        {fallback || text}
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      </Component>
    );
  }

  return (
    <Component className={className}>
      {translatedText}
    </Component>
  );
}

export default TranslatedText;
