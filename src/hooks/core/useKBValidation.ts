/**
 * KB 4.5 - Data Validation & Schema Evolution
 * Fase 14 - Validación runtime y migraciones
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { z, ZodType, ZodError } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export interface KBValidationResult<T> {
  success: boolean;
  data?: T;
  errors: KBValidationError[];
}

export interface KBValidationError {
  path: string[];
  message: string;
  code: string;
  expected?: string;
  received?: string;
}

export interface KBSchemaVersion<T> {
  version: number;
  schema: ZodType<T>;
  migrate?: (data: unknown) => unknown;
}

export interface KBSchemaRegistry<T> {
  versions: KBSchemaVersion<T>[];
  currentVersion: number;
}

export interface KBValidationConfig<T> {
  schema: ZodType<T>;
  mode?: 'strict' | 'partial' | 'passthrough';
  abortEarly?: boolean;
  context?: Record<string, unknown>;
}

export interface KBFormValidationState<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Convierte ZodError a KBValidationError[]
 */
function zodErrorToKBErrors(error: ZodError): KBValidationError[] {
  return error.errors.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
    code: issue.code,
    expected: 'expected' in issue ? String(issue.expected) : undefined,
    received: 'received' in issue ? String(issue.received) : undefined,
  }));
}

/**
 * Valida datos contra un schema Zod
 */
export function validateWithSchema<T>(
  schema: ZodType<T>,
  data: unknown,
  options: { mode?: 'strict' | 'partial' | 'passthrough' } = {}
): KBValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
      errors: [],
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: zodErrorToKBErrors(error),
      };
    }
    throw error;
  }
}

/**
 * Validación asíncrona con schema
 */
export async function validateWithSchemaAsync<T>(
  schema: ZodType<T>,
  data: unknown
): Promise<KBValidationResult<T>> {
  try {
    const result = await schema.parseAsync(data);
    return {
      success: true,
      data: result,
      errors: [],
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: zodErrorToKBErrors(error),
      };
    }
    throw error;
  }
}

// ============================================================================
// VALIDATION HOOK
// ============================================================================

/**
 * Hook principal de validación
 */
export function useKBValidation<T>(
  config: KBValidationConfig<T>
): {
  validate: (data: unknown) => KBValidationResult<T>;
  validateAsync: (data: unknown) => Promise<KBValidationResult<T>>;
  validateField: (field: string, value: unknown) => KBValidationResult<unknown>;
  isValid: (data: unknown) => boolean;
  getFieldSchema: (field: string) => ZodType | undefined;
} {
  const { schema, mode = 'strict' } = config;

  const validate = useCallback((data: unknown): KBValidationResult<T> => {
    return validateWithSchema(schema, data, { mode });
  }, [schema, mode]);

  const validateAsync = useCallback(async (data: unknown): Promise<KBValidationResult<T>> => {
    return validateWithSchemaAsync(schema, data);
  }, [schema]);

  const validateField = useCallback((field: string, value: unknown): KBValidationResult<unknown> => {
    try {
      const schemaAny = schema as unknown as { shape?: Record<string, ZodType> };
      if (schemaAny.shape && schemaAny.shape[field]) {
        return validateWithSchema(schemaAny.shape[field], value);
      }
    } catch {
      // Schema doesn't have shape property
    }
    return { success: true, errors: [] };
  }, [schema]);

  const isValid = useCallback((data: unknown): boolean => {
    return schema.safeParse(data).success;
  }, [schema]);

  const getFieldSchema = useCallback((field: string): ZodType | undefined => {
    try {
      const schemaAny = schema as unknown as { shape?: Record<string, ZodType> };
      return schemaAny.shape?.[field];
    } catch {
      return undefined;
    }
  }, [schema]);

  return {
    validate,
    validateAsync,
    validateField,
    isValid,
    getFieldSchema,
  };
}

// ============================================================================
// SCHEMA EVOLUTION HOOK
// ============================================================================

/**
 * Hook para manejo de versiones de schema y migraciones
 */
export function useKBSchemaEvolution<T>(
  registry: KBSchemaRegistry<T>
): {
  currentVersion: number;
  migrate: (data: unknown, fromVersion: number) => KBValidationResult<T>;
  validate: (data: unknown) => KBValidationResult<T>;
  getVersion: (data: unknown) => number | null;
  canMigrate: (fromVersion: number) => boolean;
} {
  const { versions, currentVersion } = registry;

  const sortedVersions = useMemo(() => 
    [...versions].sort((a, b) => a.version - b.version),
    [versions]
  );

  const migrate = useCallback((data: unknown, fromVersion: number): KBValidationResult<T> => {
    let currentData = data;
    
    // Find migrations to apply
    const migrationsToApply = sortedVersions.filter(
      v => v.version > fromVersion && v.version <= currentVersion
    );

    // Apply migrations in order
    for (const version of migrationsToApply) {
      if (version.migrate) {
        try {
          currentData = version.migrate(currentData);
        } catch (error) {
          return {
            success: false,
            errors: [{
              path: [],
              message: `Migration to version ${version.version} failed: ${error}`,
              code: 'migration_error',
            }],
          };
        }
      }
    }

    // Validate with current schema
    const currentSchema = sortedVersions.find(v => v.version === currentVersion)?.schema;
    if (!currentSchema) {
      return {
        success: false,
        errors: [{
          path: [],
          message: 'Current version schema not found',
          code: 'schema_not_found',
        }],
      };
    }

    return validateWithSchema(currentSchema, currentData);
  }, [sortedVersions, currentVersion]);

  const validate = useCallback((data: unknown): KBValidationResult<T> => {
    const currentSchema = sortedVersions.find(v => v.version === currentVersion)?.schema;
    if (!currentSchema) {
      return {
        success: false,
        errors: [{
          path: [],
          message: 'Current version schema not found',
          code: 'schema_not_found',
        }],
      };
    }
    return validateWithSchema(currentSchema, data);
  }, [sortedVersions, currentVersion]);

  const getVersion = useCallback((data: unknown): number | null => {
    // Try to validate against each version, starting from newest
    for (const version of [...sortedVersions].reverse()) {
      if (version.schema.safeParse(data).success) {
        return version.version;
      }
    }
    return null;
  }, [sortedVersions]);

  const canMigrate = useCallback((fromVersion: number): boolean => {
    return fromVersion < currentVersion && 
           sortedVersions.some(v => v.version === fromVersion);
  }, [sortedVersions, currentVersion]);

  return {
    currentVersion,
    migrate,
    validate,
    getVersion,
    canMigrate,
  };
}

// ============================================================================
// FORM VALIDATION HOOK
// ============================================================================

/**
 * Hook para validación de formularios
 */
export function useKBFormValidation<T extends Record<string, unknown>>(
  schema: ZodType<T>,
  initialValues: Partial<T> = {}
): KBFormValidationState<T> & {
  setFieldValue: (field: keyof T, value: unknown) => void;
  setFieldTouched: (field: keyof T) => void;
  validateField: (field: keyof T) => string | null;
  validateForm: () => boolean;
  resetForm: (values?: Partial<T>) => void;
  submitForm: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>;
  getFieldProps: (field: keyof T) => {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    error: string | undefined;
  };
} {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialValuesRef = useRef(initialValues);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && schema.safeParse(values).success;
  }, [errors, values, schema]);

  const setFieldValue = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Validate field on change
    try {
      const schemaAny = schema as unknown as { shape?: Record<string, ZodType> };
      const fieldSchema = schemaAny.shape?.[field as string];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          setErrors(prev => ({ 
            ...prev, 
            [field]: result.error.errors[0]?.message || 'Invalid value' 
          }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as string];
            return newErrors;
          });
        }
      }
    } catch {
      // Schema doesn't have shape
    }
  }, [schema]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback((field: keyof T): string | null => {
    try {
      const schemaAny = schema as unknown as { shape?: Record<string, ZodType> };
      const fieldSchema = schemaAny.shape?.[field as string];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(values[field]);
        if (!result.success) {
          const error = result.error.errors[0]?.message || 'Invalid value';
          setErrors(prev => ({ ...prev, [field]: error }));
          return error;
        }
      }
    } catch {
      // Schema doesn't have shape
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
    return null;
  }, [schema, values]);

  const validateForm = useCallback((): boolean => {
    const result = schema.safeParse(values);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.errors) {
        const path = issue.path.join('.');
        if (!newErrors[path]) {
          newErrors[path] = issue.message;
        }
      }
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [schema, values]);

  const resetForm = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues ?? initialValuesRef.current;
    setValues(resetValues);
    setErrors({});
    setTouched({});
    initialValuesRef.current = resetValues;
  }, []);

  const submitForm = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    for (const key of Object.keys(values)) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values as T);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm]);

  const getFieldProps = useCallback((field: keyof T) => ({
    value: values[field],
    onChange: (value: unknown) => setFieldValue(field, value),
    onBlur: () => setFieldTouched(field),
    error: touched[field as string] ? errors[field as string] : undefined,
  }), [values, errors, touched, setFieldValue, setFieldTouched]);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    submitForm,
    getFieldProps,
  };
}

// ============================================================================
// RUNTIME TYPE GUARDS
// ============================================================================

/**
 * Crea un type guard a partir de un schema Zod
 */
export function createTypeGuard<T>(schema: ZodType<T>): (data: unknown) => data is T {
  return (data: unknown): data is T => schema.safeParse(data).success;
}

/**
 * Crea un assertion function a partir de un schema Zod
 */
export function createAssertion<T>(schema: ZodType<T>): (data: unknown) => asserts data is T {
  return (data: unknown): asserts data is T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(`Assertion failed: ${result.error.message}`);
    }
  };
}

// ============================================================================
// SCHEMA BUILDERS
// ============================================================================

/**
 * Builder para schemas con validación condicional
 */
export function createConditionalSchema<T extends z.ZodRawShape>(
  baseShape: T,
  conditions: Array<{
    when: (data: z.infer<z.ZodObject<T>>) => boolean;
    then: Partial<T>;
  }>
): z.ZodEffects<z.ZodObject<T>> {
  const baseSchema = z.object(baseShape);

  return baseSchema.superRefine((data, ctx) => {
    for (const condition of conditions) {
      if (condition.when(data)) {
        for (const [key, schema] of Object.entries(condition.then)) {
          const value = (data as Record<string, unknown>)[key];
          const result = (schema as ZodType).safeParse(value);
          if (!result.success) {
            for (const issue of result.error.issues) {
              ctx.addIssue({
                ...issue,
                path: [key, ...issue.path],
              });
            }
          }
        }
      }
    }
  });
}

/**
 * Schema con transformación y validación
 */
export function createTransformSchema<TInput, TOutput>(
  inputSchema: ZodType<TInput>,
  transform: (input: TInput) => TOutput
) {
  return inputSchema.transform(transform);
}

// ============================================================================
// COERCION HELPERS
// ============================================================================

export const coerce = {
  string: z.coerce.string(),
  number: z.coerce.number(),
  boolean: z.coerce.boolean(),
  date: z.coerce.date(),
  bigint: z.coerce.bigint(),
  
  /**
   * Coerce to trimmed non-empty string
   */
  trimmedString: z.string().transform(s => s.trim()).pipe(z.string().min(1)),
  
  /**
   * Coerce to integer
   */
  integer: z.coerce.number().int(),
  
  /**
   * Coerce to positive number
   */
  positiveNumber: z.coerce.number().positive(),
  
  /**
   * Coerce string to array (comma-separated)
   */
  stringToArray: z.string().transform(s => s.split(',').map(item => item.trim()).filter(Boolean)),
  
  /**
   * Coerce string to JSON
   */
  json: z.string().transform((s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }),
};

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const commonSchemas = {
  email: z.string().email(),
  url: z.string().url(),
  uuid: z.string().uuid(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  
  /**
   * ISO date string
   */
  isoDate: z.string().datetime(),
  
  /**
   * Password with complexity requirements
   */
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  /**
   * Non-empty string
   */
  nonEmptyString: z.string().min(1),
  
  /**
   * Positive integer
   */
  positiveInt: z.number().int().positive(),
  
  /**
   * Pagination params
   */
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }),
  
  /**
   * Sort params
   */
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc'),
  }),
};

export default useKBValidation;
