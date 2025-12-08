import { CompanyWithDetails, MapFilters, StatusColor, MapColorMode } from '@/types/database';
import { MarkerStyle } from './markerStyles';

export interface MapContainerProps {
  companies: CompanyWithDetails[];
  statusColors: StatusColor[];
  filters: MapFilters;
  onSelectCompany: (company: CompanyWithDetails) => void;
  onUpdateCompanyLocation?: (companyId: string, lat: number, lng: number) => Promise<void>;
  mapStyle?: 'default' | 'satellite';
  view3D?: boolean;
  baseLayers?: {
    roads: boolean;
    labels: boolean;
    markers: boolean;
  };
  buildingOpacity?: number;
  buildingHeightMultiplier?: number;
  searchLocation?: {
    lat: number;
    lon: number;
    name: string;
  } | null;
  onSearchLocationClear?: () => void;
  colorMode: MapColorMode;
  markerStyle?: MarkerStyle;
  minZoomVinculacion?: number;
  onMinZoomVinculacionChange?: (zoom: number) => void;
  focusCompanyId?: string | null;
  onFocusCompanyHandled?: () => void;
  
  routeWaypoints?: { id: string; name: string; latitude: number; longitude: number }[];
  routeOrigin?: { latitude: number; longitude: number; name: string } | null;
  routeSelectedIds?: string[];
}
