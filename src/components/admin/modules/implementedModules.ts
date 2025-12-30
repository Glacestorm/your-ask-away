// Central list of implemented module keys.
// Keep this list in sync with the modules registered in DynamicModuleRouter.

export const IMPLEMENTED_MODULE_KEYS = new Set<string>([
  'crm-companies',
]);

export function isModuleImplemented(moduleKey?: string | null) {
  return !!moduleKey && IMPLEMENTED_MODULE_KEYS.has(moduleKey);
}
