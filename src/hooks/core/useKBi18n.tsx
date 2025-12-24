/**
 * KB 4.5 i18n & Localization System
 * Internationalization integrated with KB hooks
 */

import { useState, useCallback, useEffect, useRef, createContext, useContext, ReactNode } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type Locale = string;
export type TranslationKey = string;
export type TranslationValue = string | Record<string, unknown>;

export interface TranslationDictionary {
  [key: string]: TranslationValue | TranslationDictionary;
}

export interface LocaleConfig {
  /** Locale code (e.g., 'en', 'es', 'fr') */
  code: Locale;
  /** Display name */
  name: string;
  /** Native name */
  nativeName: string;
  /** Text direction */
  direction: 'ltr' | 'rtl';
  /** Number format */
  numberFormat?: Intl.NumberFormatOptions;
  /** Date format */
  dateFormat?: Intl.DateTimeFormatOptions;
  /** Currency code */
  currency?: string;
}

export interface I18nConfig {
  /** Default locale */
  defaultLocale: Locale;
  /** Supported locales */
  locales: LocaleConfig[];
  /** Fallback locale */
  fallbackLocale?: Locale;
  /** Translation loader */
  loadTranslations?: (locale: Locale) => Promise<TranslationDictionary>;
  /** Persist locale selection */
  persistLocale?: boolean;
  /** Storage key for persistence */
  storageKey?: string;
  /** Missing translation handler */
  onMissingTranslation?: (key: TranslationKey, locale: Locale) => string;
  /** Debug mode */
  debug?: boolean;
}

export interface I18nState {
  locale: Locale;
  translations: TranslationDictionary;
  isLoading: boolean;
  error: Error | null;
}

export interface InterpolationOptions {
  [key: string]: string | number | boolean;
}

export interface PluralRules {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_LOCALES: LocaleConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', currency: 'USD' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', currency: 'EUR' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', currency: 'EUR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', currency: 'EUR' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', currency: 'BRL' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', currency: 'EUR' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', currency: 'CNY' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', currency: 'JPY' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', currency: 'KRW' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', currency: 'SAR' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', currency: 'ILS' },
];

const DEFAULT_STORAGE_KEY = 'kb_locale';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get nested translation value by dot notation key
 */
function getNestedValue(obj: TranslationDictionary, key: string): TranslationValue | undefined {
  const keys = key.split('.');
  let current: TranslationDictionary | TranslationValue = obj;

  for (const k of keys) {
    if (current === undefined || current === null) return undefined;
    if (typeof current === 'string') return undefined;
    current = (current as TranslationDictionary)[k];
  }

  return current as TranslationValue;
}

/**
 * Interpolate variables in translation string
 */
function interpolate(text: string, options?: InterpolationOptions): string {
  if (!options) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return options[key] !== undefined ? String(options[key]) : match;
  });
}

/**
 * Select plural form based on count
 */
function selectPluralForm(count: number, rules: PluralRules, locale: Locale): string {
  const pluralRules = new Intl.PluralRules(locale);
  const category = pluralRules.select(count);

  switch (category) {
    case 'zero':
      return rules.zero || rules.other;
    case 'one':
      return rules.one || rules.other;
    case 'two':
      return rules.two || rules.other;
    case 'few':
      return rules.few || rules.other;
    case 'many':
      return rules.many || rules.other;
    default:
      return rules.other;
  }
}

/**
 * Detect browser locale
 */
function detectBrowserLocale(supportedLocales: string[]): string | null {
  if (typeof navigator === 'undefined') return null;

  const browserLocales = navigator.languages || [navigator.language];

  for (const browserLocale of browserLocales) {
    const code = browserLocale.split('-')[0].toLowerCase();
    if (supportedLocales.includes(code)) {
      return code;
    }
  }

  return null;
}

// ============================================================================
// I18N CONTEXT
// ============================================================================

interface I18nContextValue {
  state: I18nState;
  config: I18nConfig;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, options?: InterpolationOptions) => string;
  tn: (key: TranslationKey, count: number, options?: InterpolationOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (date: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => string;
  getLocaleConfig: () => LocaleConfig | undefined;
  getSupportedLocales: () => LocaleConfig[];
  isRTL: () => boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ============================================================================
// I18N PROVIDER
// ============================================================================

export interface I18nProviderProps {
  config: I18nConfig;
  children: ReactNode;
  initialTranslations?: TranslationDictionary;
}

export function I18nProvider({ config, children, initialTranslations }: I18nProviderProps) {
  const [state, setState] = useState<I18nState>({
    locale: config.defaultLocale,
    translations: initialTranslations || {},
    isLoading: false,
    error: null,
  });

  const loadedLocalesRef = useRef<Set<Locale>>(new Set());

  // Load persisted locale
  useEffect(() => {
    if (config.persistLocale) {
      const stored = localStorage.getItem(config.storageKey || DEFAULT_STORAGE_KEY);
      if (stored && config.locales.some(l => l.code === stored)) {
        setLocale(stored);
        return;
      }
    }

    // Try to detect browser locale
    const detected = detectBrowserLocale(config.locales.map(l => l.code));
    if (detected && detected !== state.locale) {
      setLocale(detected);
    }
  }, []);

  const loadTranslationsForLocale = useCallback(async (locale: Locale) => {
    if (loadedLocalesRef.current.has(locale) || !config.loadTranslations) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const translations = await config.loadTranslations(locale);
      loadedLocalesRef.current.add(locale);
      setState(prev => ({
        ...prev,
        translations: { ...prev.translations, [locale]: translations },
        isLoading: false,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: e instanceof Error ? e : new Error(String(e)),
      }));
    }
  }, [config.loadTranslations]);

  const setLocale = useCallback(async (locale: Locale) => {
    const localeConfig = config.locales.find(l => l.code === locale);
    if (!localeConfig) {
      console.warn(`[i18n] Unsupported locale: ${locale}`);
      return;
    }

    await loadTranslationsForLocale(locale);

    setState(prev => ({ ...prev, locale }));

    if (config.persistLocale) {
      localStorage.setItem(config.storageKey || DEFAULT_STORAGE_KEY, locale);
    }

    // Update document direction
    document.documentElement.dir = localeConfig.direction;
    document.documentElement.lang = locale;
  }, [config, loadTranslationsForLocale]);

  const t = useCallback((key: TranslationKey, options?: InterpolationOptions): string => {
    const localeTranslations = state.translations[state.locale] as TranslationDictionary | undefined;
    let value = localeTranslations ? getNestedValue(localeTranslations, key) : undefined;

    // Try fallback locale
    if (value === undefined && config.fallbackLocale) {
      const fallbackTranslations = state.translations[config.fallbackLocale] as TranslationDictionary | undefined;
      value = fallbackTranslations ? getNestedValue(fallbackTranslations, key) : undefined;
    }

    if (value === undefined) {
      if (config.debug) {
        console.warn(`[i18n] Missing translation: ${key} (${state.locale})`);
      }
      if (config.onMissingTranslation) {
        return config.onMissingTranslation(key, state.locale);
      }
      return key;
    }

    if (typeof value === 'string') {
      return interpolate(value, options);
    }

    return key;
  }, [state.translations, state.locale, config]);

  const tn = useCallback((key: TranslationKey, count: number, options?: InterpolationOptions): string => {
    const localeTranslations = state.translations[state.locale] as TranslationDictionary | undefined;
    const value = localeTranslations ? getNestedValue(localeTranslations, key) : undefined;

    if (value && typeof value === 'object' && 'other' in (value as Record<string, unknown>)) {
      const text = selectPluralForm(count, value as unknown as PluralRules, state.locale);
      return interpolate(text, { ...options, count });
    }

    return t(key, { ...options, count });
  }, [state.translations, state.locale, t]);

  const formatNumber = useCallback((value: number, options?: Intl.NumberFormatOptions): string => {
    const localeConfig = config.locales.find(l => l.code === state.locale);
    const mergedOptions = { ...localeConfig?.numberFormat, ...options };
    return new Intl.NumberFormat(state.locale, mergedOptions).format(value);
  }, [state.locale, config.locales]);

  const formatCurrency = useCallback((value: number, currency?: string): string => {
    const localeConfig = config.locales.find(l => l.code === state.locale);
    const curr = currency || localeConfig?.currency || 'USD';
    return new Intl.NumberFormat(state.locale, {
      style: 'currency',
      currency: curr,
    }).format(value);
  }, [state.locale, config.locales]);

  const formatDate = useCallback((date: Date | number, options?: Intl.DateTimeFormatOptions): string => {
    const localeConfig = config.locales.find(l => l.code === state.locale);
    const mergedOptions = { ...localeConfig?.dateFormat, ...options };
    return new Intl.DateTimeFormat(state.locale, mergedOptions).format(date);
  }, [state.locale, config.locales]);

  const formatRelativeTime = useCallback((value: number, unit: Intl.RelativeTimeFormatUnit): string => {
    return new Intl.RelativeTimeFormat(state.locale, { numeric: 'auto' }).format(value, unit);
  }, [state.locale]);

  const getLocaleConfig = useCallback((): LocaleConfig | undefined => {
    return config.locales.find(l => l.code === state.locale);
  }, [config.locales, state.locale]);

  const getSupportedLocales = useCallback((): LocaleConfig[] => {
    return config.locales;
  }, [config.locales]);

  const isRTL = useCallback((): boolean => {
    return getLocaleConfig()?.direction === 'rtl';
  }, [getLocaleConfig]);

  const contextValue: I18nContextValue = {
    state,
    config,
    setLocale,
    t,
    tn,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    getLocaleConfig,
    getSupportedLocales,
    isRTL,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

// ============================================================================
// HOOK: useKBi18n
// ============================================================================

export function useKBi18n() {
  const context = useContext(I18nContext);
  
  if (!context) {
    // Return a fallback that doesn't break when used outside provider
    return {
      locale: 'en',
      isLoading: false,
      error: null,
      setLocale: async () => {},
      t: (key: string) => key,
      tn: (key: string) => key,
      formatNumber: (value: number) => String(value),
      formatCurrency: (value: number) => `$${value}`,
      formatDate: (date: Date) => date.toLocaleDateString(),
      formatRelativeTime: (value: number, unit: string) => `${value} ${unit}`,
      getLocaleConfig: () => DEFAULT_LOCALES[0],
      getSupportedLocales: () => DEFAULT_LOCALES,
      isRTL: () => false,
    };
  }

  return {
    locale: context.state.locale,
    isLoading: context.state.isLoading,
    error: context.state.error,
    setLocale: context.setLocale,
    t: context.t,
    tn: context.tn,
    formatNumber: context.formatNumber,
    formatCurrency: context.formatCurrency,
    formatDate: context.formatDate,
    formatRelativeTime: context.formatRelativeTime,
    getLocaleConfig: context.getLocaleConfig,
    getSupportedLocales: context.getSupportedLocales,
    isRTL: context.isRTL,
  };
}

// ============================================================================
// HOOK: useKBTranslation (shorthand)
// ============================================================================

export function useKBTranslation(namespace?: string) {
  const { t, tn, locale, isLoading } = useKBi18n();

  const prefixedT = useCallback((key: string, options?: InterpolationOptions): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey, options);
  }, [t, namespace]);

  const prefixedTn = useCallback((key: string, count: number, options?: InterpolationOptions): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return tn(fullKey, count, options);
  }, [tn, namespace]);

  return {
    t: prefixedT,
    tn: prefixedTn,
    locale,
    isLoading,
  };
}

// ============================================================================
// HOOK: useKBLocaleDirection
// ============================================================================

export function useKBLocaleDirection() {
  const { isRTL, locale } = useKBi18n();
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    setDirection(isRTL() ? 'rtl' : 'ltr');
  }, [locale, isRTL]);

  return {
    direction,
    isRTL: direction === 'rtl',
    isLTR: direction === 'ltr',
    textAlign: direction === 'rtl' ? 'right' : 'left',
    marginStart: direction === 'rtl' ? 'marginRight' : 'marginLeft',
    marginEnd: direction === 'rtl' ? 'marginLeft' : 'marginRight',
    paddingStart: direction === 'rtl' ? 'paddingRight' : 'paddingLeft',
    paddingEnd: direction === 'rtl' ? 'paddingLeft' : 'paddingRight',
  };
}

// ============================================================================
// UTILITY: createTranslations
// ============================================================================

export function createTranslations(translations: TranslationDictionary): TranslationDictionary {
  return translations;
}

// ============================================================================
// UTILITY: createI18nConfig
// ============================================================================

export function createI18nConfig(overrides?: Partial<I18nConfig>): I18nConfig {
  return {
    defaultLocale: 'en',
    locales: DEFAULT_LOCALES,
    fallbackLocale: 'en',
    persistLocale: true,
    storageKey: DEFAULT_STORAGE_KEY,
    debug: process.env.NODE_ENV === 'development',
    ...overrides,
  };
}

export { DEFAULT_LOCALES };
export default useKBi18n;
