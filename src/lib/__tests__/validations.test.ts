import { describe, it, expect } from 'vitest';
import {
  companySchema,
  companyContactSchema,
  visitSchema,
  productSchema,
  userProfileSchema,
  statusColorSchema,
  conceptSchema,
  visitSheetUpdateSchema,
} from '../validations';

describe('Validation Schemas', () => {
  describe('companySchema', () => {
    const validCompany = {
      name: 'Test Company',
      address: 'Test Address 123',
      latitude: 42.5063,
      longitude: 1.5218,
      parroquia: 'Andorra la Vella',
    };

    it('validates a valid company', () => {
      const result = companySchema.safeParse(validCompany);
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = companySchema.safeParse({ ...validCompany, name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects name over 200 characters', () => {
      const result = companySchema.safeParse({ ...validCompany, name: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('rejects invalid latitude', () => {
      const result = companySchema.safeParse({ ...validCompany, latitude: 100 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid longitude', () => {
      const result = companySchema.safeParse({ ...validCompany, longitude: 200 });
      expect(result.success).toBe(false);
    });

    it('validates optional email', () => {
      const result = companySchema.safeParse({ ...validCompany, email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = companySchema.safeParse({ ...validCompany, email: 'invalid-email' });
      expect(result.success).toBe(false);
    });

    it('allows empty email', () => {
      const result = companySchema.safeParse({ ...validCompany, email: '' });
      expect(result.success).toBe(true);
    });

    it('validates client_type enum', () => {
      const result = companySchema.safeParse({ ...validCompany, client_type: 'cliente' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid client_type', () => {
      const result = companySchema.safeParse({ ...validCompany, client_type: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('companyContactSchema', () => {
    it('validates a valid contact', () => {
      const result = companyContactSchema.safeParse({
        contact_name: 'John Doe',
        email: 'john@example.com',
        is_primary: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty contact name', () => {
      const result = companyContactSchema.safeParse({
        contact_name: '',
      });
      expect(result.success).toBe(false);
    });

    it('defaults is_primary to false', () => {
      const result = companyContactSchema.safeParse({
        contact_name: 'John Doe',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_primary).toBe(false);
      }
    });
  });

  describe('visitSchema', () => {
    const validVisit = {
      company_id: '550e8400-e29b-41d4-a716-446655440000',
      gestor_id: '550e8400-e29b-41d4-a716-446655440001',
      visit_date: '2024-01-15',
    };

    it('validates a valid visit', () => {
      const result = visitSchema.safeParse(validVisit);
      expect(result.success).toBe(true);
    });

    it('rejects invalid company_id UUID', () => {
      const result = visitSchema.safeParse({ ...validVisit, company_id: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('rejects porcentaje_vinculacion over 100', () => {
      const result = visitSchema.safeParse({ ...validVisit, porcentaje_vinculacion: 150 });
      expect(result.success).toBe(false);
    });

    it('accepts valid porcentaje_vinculacion', () => {
      const result = visitSchema.safeParse({ ...validVisit, porcentaje_vinculacion: 75 });
      expect(result.success).toBe(true);
    });
  });

  describe('productSchema', () => {
    it('validates a valid product', () => {
      const result = productSchema.safeParse({
        name: 'Test Product',
        price: 99.99,
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative price', () => {
      const result = productSchema.safeParse({
        name: 'Test Product',
        price: -10,
      });
      expect(result.success).toBe(false);
    });

    it('defaults active to true', () => {
      const result = productSchema.safeParse({ name: 'Test Product' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });
  });

  describe('userProfileSchema', () => {
    it('validates a valid profile', () => {
      const result = userProfileSchema.safeParse({
        full_name: 'John Doe',
        cargo: 'Manager',
        oficina: 'Andorra la Vella',
      });
      expect(result.success).toBe(true);
    });

    it('allows all optional fields', () => {
      const result = userProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('statusColorSchema', () => {
    it('validates a valid status color', () => {
      const result = statusColorSchema.safeParse({
        status_name: 'Active',
        color_hex: '#FF5500',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid hex color', () => {
      const result = statusColorSchema.safeParse({
        status_name: 'Active',
        color_hex: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short hex color', () => {
      const result = statusColorSchema.safeParse({
        status_name: 'Active',
        color_hex: '#FFF',
      });
      expect(result.success).toBe(false);
    });

    it('defaults display_order to 0', () => {
      const result = statusColorSchema.safeParse({
        status_name: 'Active',
        color_hex: '#FF5500',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_order).toBe(0);
      }
    });
  });

  describe('conceptSchema', () => {
    it('validates a valid concept', () => {
      const result = conceptSchema.safeParse({
        concept_type: 'category',
        concept_key: 'test_key',
        concept_value: 'Test Value',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty required fields', () => {
      const result = conceptSchema.safeParse({
        concept_type: '',
        concept_key: 'key',
        concept_value: 'value',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('visitSheetUpdateSchema', () => {
    it('validates a valid visit sheet update', () => {
      const result = visitSheetUpdateSchema.safeParse({
        tipo_visita: 'Comercial',
        probabilidad_cierre: 75,
        potencial_anual_estimado: 50000,
      });
      expect(result.success).toBe(true);
    });

    it('rejects probabilidad_cierre over 100', () => {
      const result = visitSheetUpdateSchema.safeParse({
        probabilidad_cierre: 150,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative potencial_anual_estimado', () => {
      const result = visitSheetUpdateSchema.safeParse({
        potencial_anual_estimado: -1000,
      });
      expect(result.success).toBe(false);
    });

    it('allows all optional fields', () => {
      const result = visitSheetUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
