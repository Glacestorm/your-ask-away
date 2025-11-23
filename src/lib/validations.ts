import { z } from 'zod';

// Company validation schema
export const companySchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "El nombre es obligatorio" })
    .max(200, { message: "El nombre debe tener menos de 200 caracteres" }),
  address: z.string()
    .trim()
    .min(1, { message: "La dirección es obligatoria" })
    .max(500, { message: "La dirección debe tener menos de 500 caracteres" }),
  latitude: z.number()
    .min(-90, { message: "Latitud inválida" })
    .max(90, { message: "Latitud inválida" }),
  longitude: z.number()
    .min(-180, { message: "Longitud inválida" })
    .max(180, { message: "Longitud inválida" }),
  parroquia: z.string()
    .trim()
    .min(1, { message: "La parroquia es obligatoria" })
    .max(100, { message: "La parroquia debe tener menos de 100 caracteres" }),
  cnae: z.string()
    .trim()
    .max(10, { message: "El CNAE debe tener menos de 10 caracteres" })
    .optional()
    .nullable(),
  oficina: z.string()
    .trim()
    .max(100, { message: "La oficina debe tener menos de 100 caracteres" })
    .optional()
    .nullable(),
  status_id: z.string().uuid({ message: "ID de estado inválido" }).optional().nullable(),
  gestor_id: z.string().uuid({ message: "ID de gestor inválido" }).optional().nullable(),
  phone: z.string()
    .trim()
    .max(20, { message: "El teléfono debe tener menos de 20 caracteres" })
    .optional()
    .nullable(),
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "El email debe tener menos de 255 caracteres" })
    .optional()
    .nullable()
    .or(z.literal('')),
  website: z.string()
    .trim()
    .url({ message: "URL inválida" })
    .max(500, { message: "La URL debe tener menos de 500 caracteres" })
    .optional()
    .nullable()
    .or(z.literal('')),
  employees: z.number()
    .int({ message: "Debe ser un número entero" })
    .min(0, { message: "No puede ser negativo" })
    .max(1000000, { message: "Valor demasiado alto" })
    .optional()
    .nullable(),
  turnover: z.number()
    .min(0, { message: "No puede ser negativo" })
    .max(999999999999, { message: "Valor demasiado alto" })
    .optional()
    .nullable(),
  sector: z.string()
    .trim()
    .max(100, { message: "El sector debe tener menos de 100 caracteres" })
    .optional()
    .nullable(),
  tax_id: z.string()
    .trim()
    .max(20, { message: "El NIF debe tener menos de 20 caracteres" })
    .optional()
    .nullable(),
  registration_number: z.string()
    .trim()
    .max(50, { message: "El número de registro debe tener menos de 50 caracteres" })
    .optional()
    .nullable(),
  legal_form: z.string()
    .trim()
    .max(100, { message: "La forma legal debe tener menos de 100 caracteres" })
    .optional()
    .nullable(),
  observaciones: z.string()
    .trim()
    .max(2000, { message: "Las observaciones deben tener menos de 2000 caracteres" })
    .optional()
    .nullable(),
  bp: z.string()
    .trim()
    .max(34, { message: "El número de cuenta debe tener menos de 34 caracteres" })
    .optional()
    .nullable(),
  client_type: z.enum(['cliente', 'potencial_cliente'], {
    errorMap: () => ({ message: "Debe seleccionar cliente o potencial cliente" })
  }).optional().nullable(),
});

// Company contact validation schema
export const companyContactSchema = z.object({
  contact_name: z.string()
    .trim()
    .min(1, { message: "El nombre es obligatorio" })
    .max(200, { message: "El nombre debe tener menos de 200 caracteres" }),
  position: z.string()
    .trim()
    .max(100, { message: "El cargo debe tener menos de 100 caracteres" })
    .optional()
    .nullable(),
  phone: z.string()
    .trim()
    .max(20, { message: "El teléfono debe tener menos de 20 caracteres" })
    .optional()
    .nullable(),
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "El email debe tener menos de 255 caracteres" })
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .max(1000, { message: "Las notas deben tener menos de 1000 caracteres" })
    .optional()
    .nullable(),
  is_primary: z.boolean().default(false),
});

// Visit validation schema
export const visitSchema = z.object({
  company_id: z.string()
    .uuid({ message: "ID de empresa inválido" }),
  gestor_id: z.string()
    .uuid({ message: "ID de gestor inválido" }),
  visit_date: z.string()
    .min(1, { message: "La fecha es obligatoria" }),
  notes: z.string()
    .trim()
    .max(2000, { message: "Las notas deben tener menos de 2000 caracteres" })
    .optional()
    .nullable(),
  result: z.string()
    .trim()
    .max(500, { message: "El resultado debe tener menos de 500 caracteres" })
    .optional()
    .nullable(),
  productos_ofrecidos: z.array(z.string()).optional().nullable(),
  porcentaje_vinculacion: z.number()
    .min(0, { message: "El porcentaje no puede ser negativo" })
    .max(100, { message: "El porcentaje no puede ser mayor a 100" })
    .optional()
    .nullable(),
  pactos_realizados: z.string()
    .trim()
    .max(1000, { message: "Los pactos deben tener menos de 1000 caracteres" })
    .optional()
    .nullable(),
});

// Product validation schema
export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "El nombre es obligatorio" })
    .max(200, { message: "El nombre debe tener menos de 200 caracteres" }),
  description: z.string()
    .trim()
    .max(1000, { message: "La descripción debe tener menos de 1000 caracteres" })
    .optional()
    .nullable(),
  category: z.string()
    .trim()
    .max(100, { message: "La categoría debe tener menos de 100 caracteres" })
    .optional()
    .nullable(),
  price: z.number()
    .min(0, { message: "El precio no puede ser negativo" })
    .max(999999999, { message: "Precio demasiado alto" })
    .optional()
    .nullable(),
  active: z.boolean().default(true),
});

// User/Profile validation schema
export const userProfileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, { message: "El nombre es obligatorio" })
    .max(200, { message: "El nombre debe tener menos de 200 caracteres" })
    .optional()
    .nullable(),
  cargo: z.string()
    .trim()
    .max(100, { message: "El cargo debe tener menos de 100 caracteres" })
    .optional()
    .nullable(),
  oficina: z.string()
    .trim()
    .max(100, { message: "La oficina debe tener menos de 100 caracteres" })
    .optional()
    .nullable(),
  gestor_number: z.string()
    .trim()
    .max(20, { message: "El número debe tener menos de 20 caracteres" })
    .optional()
    .nullable(),
});

// Status color validation schema
export const statusColorSchema = z.object({
  status_name: z.string()
    .trim()
    .min(1, { message: "El nombre es obligatorio" })
    .max(100, { message: "El nombre debe tener menos de 100 caracteres" }),
  color_hex: z.string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color hexadecimal inválido (formato: #RRGGBB)" }),
  description: z.string()
    .trim()
    .max(500, { message: "La descripción debe tener menos de 500 caracteres" })
    .optional()
    .nullable(),
  display_order: z.number()
    .int({ message: "Debe ser un número entero" })
    .min(0, { message: "No puede ser negativo" })
    .default(0),
});

// Concept validation schema
export const conceptSchema = z.object({
  concept_type: z.string()
    .trim()
    .min(1, { message: "El tipo es obligatorio" })
    .max(100, { message: "El tipo debe tener menos de 100 caracteres" }),
  concept_key: z.string()
    .trim()
    .min(1, { message: "La clave es obligatoria" })
    .max(100, { message: "La clave debe tener menos de 100 caracteres" }),
  concept_value: z.string()
    .trim()
    .min(1, { message: "El valor es obligatorio" })
    .max(500, { message: "El valor debe tener menos de 500 caracteres" }),
  description: z.string()
    .trim()
    .max(1000, { message: "La descripción debe tener menos de 1000 caracteres" })
    .optional()
    .nullable(),
  active: z.boolean().default(true),
});

// Document upload validation schema
export const documentUploadSchema = z.object({
  document_name: z.string()
    .trim()
    .min(1, { message: "El nombre del documento es obligatorio" })
    .max(255, { message: "El nombre debe tener menos de 255 caracteres" }),
  document_type: z.string()
    .trim()
    .max(100, { message: "El tipo debe tener menos de 100 caracteres" })
    .optional()
    .nullable(),
  notes: z.string()
    .trim()
    .max(1000, { message: "Las notas deben tener menos de 1000 caracteres" })
    .optional()
    .nullable(),
  file: z.instanceof(File, { message: "Debe seleccionar un archivo" })
    .refine((file) => file.size <= 10485760, { message: "El archivo no debe superar 10MB" })
    .refine(
      (file) => [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/webp'
      ].includes(file.type),
      { message: "Tipo de archivo no permitido. Solo PDF, Word, Excel e imágenes" }
    ),
});

export type CompanyFormData = z.infer<typeof companySchema>;
export type CompanyContactFormData = z.infer<typeof companyContactSchema>;
export type VisitFormData = z.infer<typeof visitSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type StatusColorFormData = z.infer<typeof statusColorSchema>;
export type ConceptFormData = z.infer<typeof conceptSchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
