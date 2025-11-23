// Mapa de descripciones de códigos CNAE comunes en Andorra
export const cnaeDescriptions: Record<string, string> = {
  '4711': 'Comercio al por menor en establecimientos no especializados',
  '4719': 'Comercio al por menor en establecimientos no especializados',
  '4730': 'Comercio al por menor de combustible',
  '4778': 'Comercio al por menor de otros productos',
  '5610': 'Restaurantes y puestos de comidas',
  '5630': 'Establecimientos de bebidas',
  '5510': 'Hoteles y alojamientos similares',
  '5520': 'Alojamientos turísticos',
  '6201': 'Actividades de programación informática',
  '6202': 'Actividades de consultoría informática',
  '6209': 'Otros servicios relacionados con las tecnologías',
  '6311': 'Proceso de datos, hosting y actividades relacionadas',
  '6312': 'Portales web',
  '6419': 'Otra intermediación monetaria',
  '6420': 'Actividades de las sociedades holding',
  '6430': 'Inversiones colectivas',
  '6499': 'Otros servicios financieros',
  '6612': 'Mediación en operaciones financieras',
  '6619': 'Actividades auxiliares a los servicios financieros',
  '6810': 'Compraventa de bienes inmobiliarios por cuenta propia',
  '6820': 'Alquiler de bienes inmobiliarios por cuenta propia',
  '6831': 'Agencias inmobiliarias',
  '6832': 'Gestión de bienes inmobiliarios por cuenta de terceros',
  '6910': 'Actividades jurídicas',
  '6920': 'Actividades de contabilidad, teneduría de libros, auditoría y asesoría fiscal',
  '7010': 'Actividades de las sedes centrales',
  '7020': 'Actividades de consultoría de gestión empresarial',
  '7111': 'Servicios técnicos de arquitectura',
  '7112': 'Servicios técnicos de ingeniería y otras actividades relacionadas',
  '7120': 'Ensayos y análisis técnicos',
  '7220': 'Investigación y desarrollo experimental en ciencias sociales',
  '7311': 'Agencias de publicidad',
  '7312': 'Servicios de representación de medios de comunicación',
  '7410': 'Actividades de diseño especializado',
  '7420': 'Actividades de fotografía',
  '7490': 'Otras actividades profesionales, científicas y técnicas',
  '7711': 'Alquiler de automóviles y vehículos de motor ligeros',
  '7729': 'Alquiler de otros efectos personales y artículos de uso doméstico',
  '7820': 'Actividades de las empresas de trabajo temporal',
  '7830': 'Otra provisión de recursos humanos',
  '8121': 'Limpieza general de edificios',
  '8129': 'Otras actividades de limpieza',
  '8130': 'Actividades de jardinería',
  '8211': 'Servicios administrativos combinados',
  '8219': 'Actividades de fotocopiado, preparación de documentos y otras actividades especializadas de oficina',
  '8230': 'Organización de convenciones y ferias de muestras',
  '8299': 'Otras actividades de apoyo a las empresas',
  '8510': 'Educación preprimaria',
  '8520': 'Educación primaria',
  '8531': 'Educación secundaria general',
  '8532': 'Educación secundaria técnica y profesional',
  '8542': 'Educación superior',
  '8551': 'Educación deportiva y recreativa',
  '8552': 'Educación cultural',
  '8559': 'Otra educación',
  '8560': 'Actividades de apoyo a la educación',
  '8610': 'Actividades hospitalarias',
  '8621': 'Actividades de medicina general',
  '8622': 'Actividades de medicina especializada',
  '8623': 'Actividades odontológicas',
  '8690': 'Otras actividades sanitarias',
  '8710': 'Asistencia en establecimientos residenciales con cuidados sanitarios',
  '8720': 'Asistencia en establecimientos residenciales para personas con discapacidad intelectual',
  '8730': 'Asistencia en establecimientos residenciales para personas mayores',
  '8790': 'Otras actividades de asistencia en establecimientos residenciales',
  '8810': 'Actividades de servicios sociales sin alojamiento para personas mayores',
  '8891': 'Actividades de cuidado diurno de niños',
  '8899': 'Otras actividades de servicios sociales sin alojamiento',
  '9001': 'Artes escénicas',
  '9002': 'Actividades auxiliares a las artes escénicas',
  '9003': 'Creación artística y literaria',
  '9004': 'Gestión de salas de espectáculos',
  '9102': 'Actividades de museos',
  '9103': 'Gestión de lugares y edificios históricos',
  '9104': 'Actividades de los jardines botánicos, parques zoológicos y reservas naturales',
  '9200': 'Actividades de juegos de azar y apuestas',
  '9311': 'Gestión de instalaciones deportivas',
  '9312': 'Actividades de los clubes deportivos',
  '9313': 'Actividades de los gimnasios',
  '9319': 'Otras actividades deportivas',
  '9321': 'Actividades de los parques de atracciones y los parques temáticos',
  '9329': 'Otras actividades recreativas y de entretenimiento',
  '9411': 'Actividades de organizaciones empresariales y patronales',
  '9412': 'Actividades de organizaciones profesionales',
  '9420': 'Actividades de sindicatos',
  '9491': 'Actividades de organizaciones religiosas',
  '9492': 'Actividades de organizaciones políticas',
  '9499': 'Otras actividades asociativas',
  '9511': 'Reparación de ordenadores y equipos periféricos',
  '9512': 'Reparación de equipos de comunicación',
  '9521': 'Reparación de aparatos electrónicos de audio y vídeo de uso doméstico',
  '9522': 'Reparación de aparatos electrodomésticos y de equipamiento doméstico y de jardinería',
  '9523': 'Reparación de calzado y artículos de cuero',
  '9524': 'Reparación de muebles y artículos de menaje',
  '9529': 'Reparación de otros efectos personales y artículos de uso doméstico',
  '9601': 'Lavado y limpieza de prendas textiles y de piel',
  '9602': 'Peluquería y otros tratamientos de belleza',
  '9603': 'Servicios funerarios y actividades relacionadas',
  '9604': 'Actividades de mantenimiento físico',
  '9609': 'Otros servicios personales',
};

export function getCnaeDescription(cnaeCode: string | null | undefined): string {
  if (!cnaeCode) return '';
  
  // Remove any non-numeric characters and get first 4 digits
  const cleanCode = cnaeCode.replace(/\D/g, '').slice(0, 4);
  
  return cnaeDescriptions[cleanCode] || '';
}

export function formatCnaeWithDescription(cnaeCode: string | null | undefined): string {
  if (!cnaeCode) return '';
  
  const description = getCnaeDescription(cnaeCode);
  
  if (description) {
    return `${cnaeCode} - ${description}`;
  }
  
  return cnaeCode;
}
