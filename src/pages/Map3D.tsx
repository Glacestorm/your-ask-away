// Ejemplo de inyección dinámica del CSS del mapa en el componente Map3D
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl'; // o la librería que uses

export default function Map3D(props: any) {
  useEffect(() => {
    const href = 'https://api.mapbox.com/mapbox-gl-js/v3.8.0/mapbox-gl.css';
    let linkEl = document.querySelector(`link[href="${href}"]`) as HTMLLinkElement | null;
    let created = false;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = href;
      linkEl.crossOrigin = '';
      document.head.appendChild(linkEl);
      created = true;
    }
    // Inicializa mapa aquí (asegúrate de hacerlo cuando la CSS esté disponible si es necesario)
    // const map = new mapboxgl.Map({...});

    return () => {
      // opcional: eliminar el link cuando se desmonta si lo creamos nosotros
      if (created && linkEl && linkEl.parentNode) {
        linkEl.parentNode.removeChild(linkEl);
      }
      // map?.remove();
    };
  }, []);

  return (
    <div id="map-root" style={{ width: '100%', height: '100%' }}>
      {/* Placeholder hasta que el mapa se inicialice */}
    </div>
  );
}
