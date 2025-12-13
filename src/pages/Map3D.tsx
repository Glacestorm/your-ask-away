import React, { useEffect } from 'react';
import Map3DBuildings from '@/components/map/Map3DBuildings';

const Map3D: React.FC = () => {
  useEffect(() => {
    document.title = 'Mapa 3D - ObelixIA';
  }, []);

  return <Map3DBuildings />;
};

export default Map3D;
