/**
 * Barrel export for shared Maestros components
 * @version 2.0 - Componentes expandidos y mejorados
 */

// Tabla y datos
export { DataTable, type Column, type DataTableProps } from './DataTable';
export { SearchFilters, type FilterOption, type SearchFiltersProps } from './SearchFilters';

// Formularios y diálogos
export { EntityFormDialog, type FormTab, type EntityFormDialogProps } from './EntityFormDialog';
export { ConfirmationDialog, type ConfirmationDialogProps, type ConfirmationVariant } from './ConfirmationDialog';

// Estados visuales
export { StatusBadge, type StatusBadgeProps, type StatusType } from './StatusBadge';
export { StatsCard, type StatsCardProps } from './StatsCard';
export { 
  EmptyState, 
  NoSearchResults, 
  NoDataYet, 
  LoadError,
  type EmptyStateProps, 
  type EmptyStateVariant 
} from './EmptyState';

// Skeletons de carga
export {
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  StatsSkeleton,
  ListSkeleton,
  PageSkeleton,
} from './LoadingSkeleton';

// Acciones
export { ActionButtons, type ActionButtonsProps, type ActionConfig, type ActionType } from './ActionButtons';
