/**
 * KB 4.5 - Schema Validation Layer
 * Enterprise-grade schema validation with Zod integration
 * 
 * Features:
 * - useKBSchema: Runtime validation with Zod
 * - useKBFormSchema: Form validation with field-level errors
 * - useKBAsyncSchema: Async validation support
 * - Transform and coercion support
 * - KB Error integration
 */

import { 
  useState, 
  useCallback, 
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { z, ZodSchema, ZodError, ZodIssue } from 'zod';
import type { KBError, KBStatus } from './types';
import { KB_ERROR_CODES } from './types';
import { createKBError, collectTelemetry } from './useKBBase';

// ============================================================================
// Types
// ============================================================================

export interface KBSchemaOptions<T> {
  /** Schema to validate against */
  schema: ZodSchema<T>;
  /** Called when validation fails */
  onValidationError?: (error: KBSchemaError) => void;
  /** Called when validation succeeds */
  onValidationSuccess?: (data: T) => void;
  /** Debounce validation in ms */
  debounceMs?: number;
  /** Transform data before validation */
  preTransform?: (data: unknown) => unknown;
  /** Transform data after validation */
  postTransform?: (data: T) => T;
  /** Enable telemetry */
  enableTelemetry?: boolean;
  /** Operation name for telemetry */
  operationName?: string;
  /** Abort on first error */
  abortEarly?: boolean;
}

export interface KBSchemaError {
  /** Flattened field errors */
  fieldErrors: Record<string, string[]>;
  /** Form-level errors */
  formErrors: string[];
  /** All Zod issues */
  issues: ZodIssue[];
  /** KB Error wrapper */
  kbError: KBError;
  /** Raw Zod error */
  zodError: ZodError;
}

export interface KBSchemaReturn<T> {
  /** Validate data synchronously */
  validate: (data: unknown) => T | null;
  /** Validate data and return result object */
  validateSafe: (data: unknown) => { success: true; data: T } | { success: false; error: KBSchemaError };
  /** Validate single field */
  validateField: (fieldPath: string, value: unknown, context?: Record<string, unknown>) => string | null;
  /** Last validation error */
  error: KBSchemaError | null;
  /** Last validation status */
  status: KBStatus;
  /** Whether validation is pending */
  isPending: boolean;
  /** Clear validation errors */
  clearErrors: () => void;
  /** Get field error */
  getFieldError: (fieldPath: string) => string | undefined;
  /** Check if field has error */
  hasFieldError: (fieldPath: string) => boolean;
  /** Check if form is valid (based on last validation) */
  isValid: boolean;
}

export interface KBFormSchemaOptions<T> extends Omit<KBSchemaOptions<T>, 'schema'> {
  /** Schema to validate against */
  schema: ZodSchema<T>;
  /** Initial values */
  initialValues?: Partial<T>;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Validate on submit */
  validateOnSubmit?: boolean;
  /** Reset on submit success */
  resetOnSuccess?: boolean;
}

export interface KBFormSchemaReturn<T> extends KBSchemaReturn<T> {
  /** Current form values */
  values: Partial<T>;
  /** Set single field value */
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Set multiple values */
  setValues: (values: Partial<T>) => void;
  /** Reset form to initial values */
  reset: () => void;
  /** Get field props for form binding */
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K] | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error: string | undefined;
    'aria-invalid': boolean;
  };
  /** Handle form submission */
  handleSubmit: (onSubmit: (data: T) => void | Promise<void>) => (e?: React.FormEvent) => Promise<void>;
  /** Touched fields */
  touched: Record<string, boolean>;
  /** Mark field as touched */
  setTouched: (field: string, touched?: boolean) => void;
  /** Is form dirty */
  isDirty: boolean;
  /** Is form submitting */
  isSubmitting: boolean;
}

export interface KBAsyncSchemaOptions<T> extends KBSchemaOptions<T> {
  /** Async validation function */
  asyncValidate?: (data: T) => Promise<void>;
  /** Async field validators */
  asyncFieldValidators?: Record<string, (value: unknown, data: T) => Promise<string | null>>;
  /** Timeout for async validation in ms */
  asyncTimeout?: number;
}

export interface KBAsyncSchemaReturn<T> extends KBSchemaReturn<T> {
  /** Validate data asynchronously */
  validateAsync: (data: unknown) => Promise<T | null>;
  /** Validate field asynchronously */
  validateFieldAsync: (fieldPath: string, value: unknown, context?: Record<string, unknown>) => Promise<string | null>;
  /** Pending async validations */
  pendingFields: Set<string>;
}

// ============================================================================
// Utility Functions
// ============================================================================

function createSchemaError(zodError: ZodError): KBSchemaError {
  const flattened = zodError.flatten();
  
  return {
    fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    formErrors: flattened.formErrors,
    issues: zodError.issues,
    zodError,
    kbError: createKBError(
      KB_ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      {
        details: {
          fieldErrors: flattened.fieldErrors,
          formErrors: flattened.formErrors,
          issueCount: zodError.issues.length,
        },
        retryable: true,
      }
    ),
  };
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

function setNestedValue<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const result = { ...obj } as Record<string, unknown>;
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = { ...(current[key] as Record<string, unknown> || {}) };
    current = current[key] as Record<string, unknown>;
  }
  
  current[keys[keys.length - 1]] = value;
  return result as T;
}

// ============================================================================
// useKBSchema
// ============================================================================

/**
 * Schema validation hook with Zod integration
 * 
 * @example
 * ```tsx
 * const userSchema = z.object({
 *   name: z.string().min(2).max(100),
 *   email: z.string().email(),
 *   age: z.number().min(18),
 * });
 * 
 * const { validate, validateSafe, error, getFieldError } = useKBSchema({
 *   schema: userSchema,
 *   onValidationError: (err) => console.error(err.fieldErrors),
 * });
 * 
 * const handleSubmit = (data: unknown) => {
 *   const result = validateSafe(data);
 *   if (result.success) {
 *     // data is typed as User
 *     saveUser(result.data);
 *   }
 * };
 * ```
 */
export function useKBSchema<T>(
  options: KBSchemaOptions<T>
): KBSchemaReturn<T> {
  const {
    schema,
    onValidationError,
    onValidationSuccess,
    preTransform,
    postTransform,
    enableTelemetry = true,
    operationName = 'schema_validation',
  } = options;

  const [error, setError] = useState<KBSchemaError | null>(null);
  const [status, setStatus] = useState<KBStatus>('idle');
  const [isPending, setIsPending] = useState(false);

  const validate = useCallback((data: unknown): T | null => {
    const startTime = Date.now();
    setIsPending(true);
    setStatus('loading');

    try {
      // Pre-transform
      const transformedInput = preTransform ? preTransform(data) : data;
      
      // Validate
      const result = schema.parse(transformedInput);
      
      // Post-transform
      const finalResult = postTransform ? postTransform(result) : result;
      
      setError(null);
      setStatus('success');
      onValidationSuccess?.(finalResult);

      if (enableTelemetry) {
        collectTelemetry('useKBSchema', operationName, 'success', Date.now() - startTime);
      }

      return finalResult;
    } catch (err) {
      if (err instanceof ZodError) {
        const schemaError = createSchemaError(err);
        setError(schemaError);
        setStatus('error');
        onValidationError?.(schemaError);

        if (enableTelemetry) {
          collectTelemetry('useKBSchema', operationName, 'error', Date.now() - startTime, schemaError.kbError);
        }
      }
      return null;
    } finally {
      setIsPending(false);
    }
  }, [schema, preTransform, postTransform, onValidationError, onValidationSuccess, enableTelemetry, operationName]);

  const validateSafe = useCallback((data: unknown): { success: true; data: T } | { success: false; error: KBSchemaError } => {
    const result = validate(data);
    if (result !== null) {
      return { success: true, data: result };
    }
    return { success: false, error: error! };
  }, [validate, error]);

  const validateField = useCallback((fieldPath: string, value: unknown, context?: Record<string, unknown>): string | null => {
    try {
      // Build partial object for field validation
      const partialData = context ? { ...context } : {};
      const keys = fieldPath.split('.');
      let current = partialData as Record<string, unknown>;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;

      // Try partial validation
      schema.parse(partialData);
      return null;
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldIssue = err.issues.find(issue => 
          issue.path.join('.') === fieldPath || 
          issue.path[issue.path.length - 1]?.toString() === fieldPath.split('.').pop()
        );
        return fieldIssue?.message || null;
      }
      return null;
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  const getFieldError = useCallback((fieldPath: string): string | undefined => {
    if (!error) return undefined;
    const errors = error.fieldErrors[fieldPath];
    return errors?.[0];
  }, [error]);

  const hasFieldError = useCallback((fieldPath: string): boolean => {
    if (!error) return false;
    return !!error.fieldErrors[fieldPath]?.length;
  }, [error]);

  const isValid = useMemo(() => status === 'success' && !error, [status, error]);

  return {
    validate,
    validateSafe,
    validateField,
    error,
    status,
    isPending,
    clearErrors,
    getFieldError,
    hasFieldError,
    isValid,
  };
}

// ============================================================================
// useKBFormSchema
// ============================================================================

/**
 * Form-specific schema validation with field bindings
 * 
 * @example
 * ```tsx
 * const { values, getFieldProps, handleSubmit, isValid } = useKBFormSchema({
 *   schema: userSchema,
 *   initialValues: { name: '', email: '' },
 *   validateOnBlur: true,
 * });
 * 
 * return (
 *   <form onSubmit={handleSubmit(onSubmit)}>
 *     <input {...getFieldProps('name')} />
 *     <input {...getFieldProps('email')} />
 *     <button disabled={!isValid}>Submit</button>
 *   </form>
 * );
 * ```
 */
export function useKBFormSchema<T extends Record<string, unknown>>(
  options: KBFormSchemaOptions<T>
): KBFormSchemaReturn<T> {
  const {
    schema,
    initialValues = {} as Partial<T>,
    validateOnChange = false,
    validateOnBlur = true,
    validateOnSubmit = true,
    resetOnSuccess = false,
    onValidationError,
    onValidationSuccess,
    ...schemaOptions
  } = options;

  const baseSchema = useKBSchema<T>({
    schema,
    onValidationError,
    onValidationSuccess,
    ...schemaOptions,
  });

  const [values, setValuesState] = useState<Partial<T>>(initialValues);
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValuesRef = useRef(initialValues);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    
    if (validateOnChange) {
      baseSchema.validateField(field as string, value, values as Record<string, unknown>);
    }
  }, [validateOnChange, baseSchema, values]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  const reset = useCallback(() => {
    setValuesState(initialValuesRef.current);
    setTouchedState({});
    baseSchema.clearErrors();
  }, [baseSchema]);

  const setTouched = useCallback((field: string, isTouched = true) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    const fieldPath = field as string;
    const fieldError = touched[fieldPath] ? baseSchema.getFieldError(fieldPath) : undefined;
    
    return {
      value: values[field] as T[K] | undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newValue = e.target.type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked
          : e.target.type === 'number'
            ? Number(e.target.value)
            : e.target.value;
        setValue(field, newValue as T[K]);
      },
      onBlur: () => {
        setTouched(fieldPath, true);
        if (validateOnBlur) {
          baseSchema.validateField(fieldPath, values[field], values as Record<string, unknown>);
        }
      },
      error: fieldError,
      'aria-invalid': !!fieldError,
    };
  }, [values, touched, baseSchema, setValue, setTouched, validateOnBlur]);

  const handleSubmit = useCallback((onSubmit: (data: T) => void | Promise<void>) => {
    return async (e?: React.FormEvent) => {
      e?.preventDefault();
      setIsSubmitting(true);

      try {
        // Mark all fields as touched
        const allTouched: Record<string, boolean> = {};
        Object.keys(values).forEach(key => {
          allTouched[key] = true;
        });
        setTouchedState(allTouched);

        if (validateOnSubmit) {
          const result = baseSchema.validateSafe(values);
          if (!result.success) {
            return;
          }
          
          await onSubmit(result.data);
          
          if (resetOnSuccess) {
            reset();
          }
        } else {
          await onSubmit(values as T);
          
          if (resetOnSuccess) {
            reset();
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateOnSubmit, baseSchema, reset, resetOnSuccess]);

  return {
    ...baseSchema,
    values,
    setValue,
    setValues,
    reset,
    getFieldProps,
    handleSubmit,
    touched,
    setTouched,
    isDirty,
    isSubmitting,
  };
}

// ============================================================================
// useKBAsyncSchema
// ============================================================================

/**
 * Async schema validation with debouncing and field-level async validators
 * 
 * @example
 * ```tsx
 * const { validateAsync, validateFieldAsync, pendingFields } = useKBAsyncSchema({
 *   schema: userSchema,
 *   asyncFieldValidators: {
 *     email: async (value) => {
 *       const exists = await checkEmailExists(value);
 *       return exists ? 'Email already in use' : null;
 *     },
 *   },
 * });
 * ```
 */
export function useKBAsyncSchema<T>(
  options: KBAsyncSchemaOptions<T>
): KBAsyncSchemaReturn<T> {
  const {
    asyncValidate,
    asyncFieldValidators = {},
    asyncTimeout = 5000,
    debounceMs = 300,
    ...schemaOptions
  } = options;

  const baseSchema = useKBSchema<T>(schemaOptions);
  const [pendingFields, setPendingFields] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const validateAsync = useCallback(async (data: unknown): Promise<T | null> => {
    // First, run sync validation
    const syncResult = baseSchema.validate(data);
    if (syncResult === null) return null;

    // Then run async validation if provided
    if (asyncValidate) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Async validation timeout')), asyncTimeout);
        });

        await Promise.race([
          asyncValidate(syncResult),
          timeoutPromise,
        ]);

        return syncResult;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
        }
        throw err;
      }
    }

    return syncResult;
  }, [baseSchema, asyncValidate, asyncTimeout]);

  const validateFieldAsync = useCallback(async (
    fieldPath: string, 
    value: unknown, 
    context?: Record<string, unknown>
  ): Promise<string | null> => {
    // First run sync validation
    const syncError = baseSchema.validateField(fieldPath, value, context);
    if (syncError) return syncError;

    // Check for async validator
    const asyncValidator = asyncFieldValidators[fieldPath];
    if (!asyncValidator) return null;

    // Debounce async validation
    return new Promise((resolve) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setPendingFields(prev => new Set([...prev, fieldPath]));

        try {
          const fullData = context ? { ...context, [fieldPath]: value } : { [fieldPath]: value };
          const error = await asyncValidator(value, fullData as T);
          resolve(error);
        } catch (err) {
          resolve(err instanceof Error ? err.message : 'Async validation failed');
        } finally {
          setPendingFields(prev => {
            const next = new Set(prev);
            next.delete(fieldPath);
            return next;
          });
        }
      }, debounceMs);
    });
  }, [baseSchema, asyncFieldValidators, debounceMs]);

  return {
    ...baseSchema,
    validateAsync,
    validateFieldAsync,
    pendingFields,
  };
}

// ============================================================================
// Pre-built Schema Helpers
// ============================================================================

/**
 * Common validation patterns
 */
export const KBSchemaPatterns = {
  /** Email validation */
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  
  /** Password validation (8+ chars, mixed case, number, special) */
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
  
  /** Simple password (8+ chars) */
  simplePassword: z.string().min(8, 'Password must be at least 8 characters'),
  
  /** Phone number (international format) */
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  
  /** URL validation */
  url: z.string().url('Invalid URL'),
  
  /** UUID validation */
  uuid: z.string().uuid('Invalid UUID'),
  
  /** Non-empty string */
  required: z.string().trim().min(1, 'This field is required'),
  
  /** Positive number */
  positiveNumber: z.number().positive('Must be a positive number'),
  
  /** Non-negative number */
  nonNegativeNumber: z.number().nonnegative('Must be zero or greater'),
  
  /** Date in the future */
  futureDate: z.date().refine(date => date > new Date(), 'Date must be in the future'),
  
  /** Date in the past */
  pastDate: z.date().refine(date => date < new Date(), 'Date must be in the past'),
  
  /** Safe string (no HTML) */
  safeString: z.string().transform(s => s.replace(/<[^>]*>/g, '')),
  
  /** Slug format */
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  
  /** Alphanumeric only */
  alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/, 'Only letters and numbers allowed'),
};

/**
 * Create a refinement that checks for profanity
 */
export function noProfanity(message = 'Content contains inappropriate language') {
  const profanityList = ['badword1', 'badword2']; // Add actual words
  return z.string().refine(
    (val) => !profanityList.some(word => val.toLowerCase().includes(word)),
    message
  );
}

/**
 * Create a refinement for max file size
 */
export function maxFileSize(maxBytes: number, message?: string) {
  return z.instanceof(File).refine(
    (file) => file.size <= maxBytes,
    message || `File size must be less than ${Math.round(maxBytes / 1024 / 1024)}MB`
  );
}

/**
 * Create a refinement for allowed file types
 */
export function allowedFileTypes(types: string[], message?: string) {
  return z.instanceof(File).refine(
    (file) => types.includes(file.type),
    message || `Allowed file types: ${types.join(', ')}`
  );
}

// Default export
export default {
  useKBSchema,
  useKBFormSchema,
  useKBAsyncSchema,
  KBSchemaPatterns,
  noProfanity,
  maxFileSize,
  allowedFileTypes,
};
