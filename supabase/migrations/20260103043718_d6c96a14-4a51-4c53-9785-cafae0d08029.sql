-- =====================================================
-- MIGRACIÓN: Permisos contables específicos (corrección)
-- =====================================================

-- Insertar permisos contables específicos (corregido)
INSERT INTO public.erp_permissions (key, module, action, description)
VALUES 
  ('financing.edit_operations', 'financing', 'edit', 'Permite editar operaciones de financiación'),
  ('financing.delete_operations', 'financing', 'delete', 'Permite eliminar operaciones de financiación'),
  ('investments.edit_operations', 'investments', 'edit', 'Permite editar inversiones'),
  ('investments.delete_operations', 'investments', 'delete', 'Permite eliminar inversiones'),
  ('accounting.auto_post', 'accounting', 'create', 'Permite contabilizar operaciones automáticamente'),
  ('accounting.reverse_entries', 'accounting', 'delete', 'Permite revertir asientos contables')
ON CONFLICT (key) DO NOTHING;