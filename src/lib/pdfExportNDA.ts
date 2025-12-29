/**
 * NDA (Non-Disclosure Agreement) PDF Export Utility
 * Generates comprehensive confidentiality contracts
 */

import jsPDF from 'jspdf';
import { openPrintDialogForJsPdf } from './pdfPrint';

export interface NDAPDFData {
  companyName: string;
  companyAddress?: string;
  companyCIF?: string;
  companyRepresentative?: string;
  companyRepresentativeRole?: string;
  recipientName?: string;
  recipientID?: string;
  recipientAddress?: string;
  recipientRole?: string;
  effectiveDate?: string;
  expirationDate?: string;
  confidentialityPeriodYears?: number;
  jurisdiction?: string;
  relatedDocuments?: string[];
  includeNonCompete?: boolean;
  includeNonSolicitation?: boolean;
  returnDocumentsClause?: boolean;
  penaltyAmount?: number;
}

const PRIMARY_COLOR: [number, number, number] = [30, 41, 59]; // Slate-800
const SECONDARY_COLOR: [number, number, number] = [71, 85, 105]; // Slate-600
const TEXT_COLOR: [number, number, number] = [31, 41, 55];
const MUTED_COLOR: [number, number, number] = [107, 114, 128];
const ACCENT_COLOR: [number, number, number] = [79, 70, 229]; // Indigo

export function generateNDAPDF(data: NDAPDFData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;
  let clauseNumber = 1;

  // Helper functions
  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 10) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  const drawClauseTitle = (title: string) => {
    addNewPageIfNeeded(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`CLÁUSULA ${clauseNumber}ª. ${title.toUpperCase()}`, margin, yPos);
    yPos += 8;
    clauseNumber++;
    doc.setTextColor(...TEXT_COLOR);
  };

  const drawSubClause = (number: string, text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(`${number} ${text}`, contentWidth - 5);
    lines.forEach((line: string) => {
      addNewPageIfNeeded(6);
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 3;
  };

  const drawParagraph = (text: string, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      addNewPageIfNeeded(6);
      doc.text(line, margin + indent, yPos);
      yPos += 5;
    });
    yPos += 4;
  };

  const formatDate = (date?: string) => date || new Date().toLocaleDateString('es-ES', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  const formatCurrency = (amount?: number) => 
    amount ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount) : '50.000 €';

  const jurisdiction = data.jurisdiction || 'Barcelona, España';
  const confidentialityYears = data.confidentialityPeriodYears || 5;
  const relatedDocs = data.relatedDocuments?.length 
    ? data.relatedDocuments.join(', ') 
    : 'Plan de Negocio, Estudio de Viabilidad, Proyecciones Financieras y toda documentación estratégica';

  // === COVER PAGE ===
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Header band
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE CONFIDENCIALIDAD', pageWidth / 2, 35, { align: 'center' });
  doc.setFontSize(14);
  doc.text('(Acuerdo de No Divulgación - NDA)', pageWidth / 2, 47, { align: 'center' });

  // Company info
  yPos = 80;
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName || 'ObelixIA Technologies S.L.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setTextColor(...SECONDARY_COLOR);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`CIF: ${data.companyCIF || 'B-12345678'}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 30;
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(margin + 30, yPos, contentWidth - 60, 0.5, 'F');
  
  yPos += 20;
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(12);
  doc.text('ENTRE', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('PARTE DIVULGADORA:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyName || 'ObelixIA Technologies S.L.', margin + 55, yPos);
  
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('PARTE RECEPTORA:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.recipientName || '[NOMBRE DEL RECEPTOR]', margin + 50, yPos);

  // Document info
  yPos = pageHeight - 50;
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(margin + 30, yPos, contentWidth - 60, 0.5, 'F');
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Fecha de Efecto: ${formatDate(data.effectiveDate)}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Jurisdicción: ${jurisdiction}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Footer
  yPos = pageHeight - 15;
  doc.setFontSize(9);
  doc.text('Documento legalmente vinculante - ObelixIA Contabilidad Pro', pageWidth / 2, yPos, { align: 'center' });

  // === PAGE 2: PARTIES AND RECITALS ===
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  yPos = margin;

  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(margin, yPos, contentWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE CONFIDENCIALIDAD', margin + 5, yPos + 7);
  yPos += 20;
  doc.setTextColor(...TEXT_COLOR);

  // Parties identification
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('COMPARECEN', margin, yPos);
  yPos += 10;

  drawParagraph(`De una parte, D./Dña. ${data.companyRepresentative || '[REPRESENTANTE LEGAL]'}, mayor de edad, con DNI/NIE número [DNI], en calidad de ${data.companyRepresentativeRole || 'Administrador Único'}, en nombre y representación de ${data.companyName || 'ObelixIA Technologies S.L.'} (en adelante, "LA PARTE DIVULGADORA" o "LA EMPRESA"), con domicilio social en ${data.companyAddress || 'Barcelona, España'} y CIF ${data.companyCIF || 'B-12345678'}.`);

  drawParagraph(`De otra parte, D./Dña. ${data.recipientName || '[NOMBRE COMPLETO DEL RECEPTOR]'}, mayor de edad, con DNI/NIE número ${data.recipientID || '[DNI/NIE]'}, ${data.recipientRole ? `en calidad de ${data.recipientRole}` : ''}, con domicilio en ${data.recipientAddress || '[DIRECCIÓN DEL RECEPTOR]'} (en adelante, "LA PARTE RECEPTORA").`);

  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('EXPONEN', margin, yPos);
  yPos += 10;

  drawParagraph(`PRIMERO.- Que LA PARTE DIVULGADORA es una empresa tecnológica especializada en el desarrollo de soluciones de software empresarial con inteligencia artificial, particularmente en el sector financiero y bancario, siendo titular de información confidencial, secretos empresariales, know-how, desarrollos tecnológicos, planes de negocio, estudios de viabilidad, proyecciones financieras y estrategias comerciales de alto valor competitivo.`);

  drawParagraph(`SEGUNDO.- Que LA PARTE RECEPTORA está interesada en acceder a la siguiente información confidencial de LA EMPRESA: ${relatedDocs}, así como cualquier otra documentación que LA EMPRESA considere revelar en el marco de las conversaciones entre las partes.`);

  drawParagraph(`TERCERO.- Que para que LA PARTE RECEPTORA pueda evaluar adecuadamente la propuesta de colaboración, inversión, asociación o cualquier otra relación comercial o profesional con LA EMPRESA, resulta necesario que LA PARTE DIVULGADORA le facilite información de carácter confidencial y estratégico.`);

  drawParagraph(`CUARTO.- Que ambas partes reconocen que la divulgación no autorizada de dicha información confidencial podría causar un daño irreparable a LA PARTE DIVULGADORA, afectando gravemente a su posición competitiva, imagen empresarial y viabilidad económica.`);

  drawParagraph(`QUINTO.- Que en consecuencia, las partes acuerdan celebrar el presente Contrato de Confidencialidad (en adelante, "NDA" o "el Contrato") que se regirá por las siguientes:`);

  // === CLAUSES ===
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('CLÁUSULAS', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  doc.setTextColor(...TEXT_COLOR);

  // Clause 1: Purpose
  drawClauseTitle('OBJETO DEL CONTRATO');
  drawParagraph(`El presente Contrato tiene por objeto establecer los términos y condiciones bajo los cuales LA PARTE DIVULGADORA facilitará información confidencial a LA PARTE RECEPTORA, así como las obligaciones que esta última asume respecto a la protección, uso limitado y no divulgación de dicha información.`);

  // Clause 2: Definition of Confidential Information
  drawClauseTitle('DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL');
  drawSubClause('2.1', 'A los efectos del presente Contrato, se entenderá por "Información Confidencial" toda aquella información, datos, conocimientos, documentos, materiales, técnicas, procesos, metodologías, estrategias y know-how, ya sea de naturaleza técnica, comercial, financiera, operativa o de cualquier otra índole, que:');
  
  drawParagraph(`a) Sea proporcionada, comunicada o puesta a disposición de LA PARTE RECEPTORA por LA PARTE DIVULGADORA, sus empleados, directivos, asesores o colaboradores, ya sea de forma oral, escrita, visual, electrónica o por cualquier otro medio;`, 5);
  drawParagraph(`b) Sea desarrollada, creada o generada durante o como resultado de las conversaciones, negociaciones o cualquier tipo de relación entre las partes;`, 5);
  drawParagraph(`c) Sea identificable como confidencial por su propia naturaleza o por las circunstancias de su revelación;`, 5);
  drawParagraph(`d) Esté marcada, designada o tratada como "confidencial", "reservada", "secreta" o con términos equivalentes.`, 5);

  drawSubClause('2.2', 'Sin carácter limitativo, se considerará Información Confidencial:');
  drawParagraph(`• Planes de negocio, estudios de viabilidad y proyecciones financieras`, 5);
  drawParagraph(`• Estrategias comerciales, de marketing y de expansión`, 5);
  drawParagraph(`• Información técnica sobre productos, servicios, software y tecnologías`, 5);
  drawParagraph(`• Código fuente, algoritmos, arquitecturas de sistemas y diseños técnicos`, 5);
  drawParagraph(`• Listas de clientes, proveedores, partners y contactos comerciales`, 5);
  drawParagraph(`• Información financiera, contable, fiscal y de tesorería`, 5);
  drawParagraph(`• Precios, tarifas, márgenes, costes y condiciones comerciales`, 5);
  drawParagraph(`• Información sobre personal, organización y políticas internas`, 5);
  drawParagraph(`• Acuerdos con terceros, contratos y condiciones negociadas`, 5);
  drawParagraph(`• Datos personales de clientes, empleados o terceros relacionados`, 5);
  drawParagraph(`• Cualquier otra información que razonablemente deba considerarse confidencial`, 5);

  drawSubClause('2.3', 'No se considerará Información Confidencial aquella que LA PARTE RECEPTORA pueda demostrar fehacientemente que:');
  drawParagraph(`a) Era de dominio público en el momento de su revelación o que posteriormente se haya convertido en tal sin mediar incumplimiento de la presente obligación de confidencialidad;`, 5);
  drawParagraph(`b) Ya obraba en poder de LA PARTE RECEPTORA con anterioridad a su revelación, sin estar sujeta a obligación de confidencialidad;`, 5);
  drawParagraph(`c) Ha sido recibida de un tercero que tenía derecho a revelarla sin restricciones de confidencialidad;`, 5);
  drawParagraph(`d) Ha sido desarrollada de forma independiente por LA PARTE RECEPTORA sin utilizar la Información Confidencial.`, 5);

  // Clause 3: Obligations
  drawClauseTitle('OBLIGACIONES DE LA PARTE RECEPTORA');
  drawSubClause('3.1', 'LA PARTE RECEPTORA se compromete y obliga expresamente a:');
  drawParagraph(`a) Mantener la más estricta confidencialidad sobre toda la Información Confidencial recibida, aplicando al menos las mismas medidas de protección que emplea para salvaguardar su propia información confidencial, y en todo caso, medidas razonables acordes con la naturaleza de la información;`, 5);
  drawParagraph(`b) No revelar, divulgar, publicar, comunicar, transferir, ceder ni poner a disposición de terceras personas o entidades, directa o indirectamente, la Información Confidencial, salvo autorización previa, expresa y por escrito de LA PARTE DIVULGADORA;`, 5);
  drawParagraph(`c) Utilizar la Información Confidencial exclusivamente para el propósito específico para el cual fue revelada, esto es, la evaluación de una potencial relación comercial, de inversión o colaboración con LA EMPRESA;`, 5);
  drawParagraph(`d) No realizar ningún tipo de explotación comercial, industrial o de cualquier otra naturaleza de la Información Confidencial;`, 5);
  drawParagraph(`e) No realizar copias, reproducciones, adaptaciones, traducciones o modificaciones de la Información Confidencial sin autorización previa y por escrito;`, 5);
  drawParagraph(`f) Adoptar todas las medidas técnicas, organizativas y de seguridad necesarias para garantizar la protección de la Información Confidencial frente a accesos no autorizados, pérdida, destrucción o alteración;`, 5);
  drawParagraph(`g) Limitar el acceso a la Información Confidencial únicamente a aquellos empleados, colaboradores o asesores que necesiten conocerla para el propósito autorizado, garantizando que dichas personas quedan sujetas a obligaciones de confidencialidad equivalentes a las establecidas en el presente Contrato;`, 5);
  drawParagraph(`h) Comunicar de inmediato a LA PARTE DIVULGADORA cualquier uso o divulgación no autorizada de la Información Confidencial de la que tenga conocimiento;`, 5);
  drawParagraph(`i) No realizar ingeniería inversa, descompilación, desensamblaje o cualquier otro intento de obtener el código fuente o los secretos comerciales contenidos en cualquier software o tecnología proporcionada;`, 5);
  drawParagraph(`j) Cumplir con todas las normativas aplicables en materia de protección de datos personales, incluyendo el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos y Garantía de los Derechos Digitales (LOPDGDD).`, 5);

  // Clause 4: Duration
  drawClauseTitle('DURACIÓN Y VIGENCIA');
  drawSubClause('4.1', `El presente Contrato entrará en vigor en la fecha de su firma por ambas partes y permanecerá vigente durante un período de CINCO (5) años a contar desde dicha fecha.`);
  drawSubClause('4.2', `No obstante lo anterior, las obligaciones de confidencialidad establecidas en el presente Contrato permanecerán en vigor durante un período adicional de ${confidentialityYears} (${numeroALetras(confidentialityYears)}) años tras la terminación del mismo, o de forma indefinida respecto a aquella información que constituya secreto empresarial conforme a la Ley 1/2019 de Secretos Empresariales.`);
  drawSubClause('4.3', `LA PARTE DIVULGADORA podrá dar por terminado el presente Contrato en cualquier momento mediante comunicación por escrito a LA PARTE RECEPTORA, sin que dicha terminación libere a esta última de sus obligaciones de confidencialidad.`);

  // Clause 5: Return of Documents
  drawClauseTitle('DEVOLUCIÓN Y DESTRUCCIÓN DE INFORMACIÓN');
  drawSubClause('5.1', `A la terminación del presente Contrato o en cualquier momento a requerimiento de LA PARTE DIVULGADORA, LA PARTE RECEPTORA se obliga a:`);
  drawParagraph(`a) Devolver inmediatamente toda la Información Confidencial recibida en formato físico, incluyendo documentos, informes, prototipos, muestras y cualquier otro material;`, 5);
  drawParagraph(`b) Destruir de forma segura e irreversible todas las copias, reproducciones y registros de la Información Confidencial en formato electrónico o digital;`, 5);
  drawParagraph(`c) Eliminar la Información Confidencial de todos los sistemas informáticos, dispositivos de almacenamiento, servicios en la nube y copias de seguridad bajo su control;`, 5);
  drawParagraph(`d) Certificar por escrito a LA PARTE DIVULGADORA el cumplimiento de las obligaciones anteriores en un plazo máximo de diez (10) días hábiles.`, 5);

  // Clause 6: Intellectual Property
  drawClauseTitle('PROPIEDAD INTELECTUAL E INDUSTRIAL');
  drawSubClause('6.1', `La revelación de Información Confidencial en virtud del presente Contrato no supone la concesión de licencia, derecho de uso, cesión o transferencia de ningún derecho de propiedad intelectual o industrial a favor de LA PARTE RECEPTORA.`);
  drawSubClause('6.2', `Todos los derechos de propiedad intelectual e industrial sobre la Información Confidencial, incluyendo patentes, marcas, diseños, derechos de autor, secretos empresariales y know-how, continuarán siendo propiedad exclusiva de LA PARTE DIVULGADORA.`);
  drawSubClause('6.3', `LA PARTE RECEPTORA no adquiere ningún derecho sobre la Información Confidencial más allá del derecho limitado a examinarla para el propósito específico acordado entre las partes.`);

  // Clause 7: Non-compete (optional)
  if (data.includeNonCompete !== false) {
    drawClauseTitle('CLÁUSULA DE NO COMPETENCIA');
    drawSubClause('7.1', `LA PARTE RECEPTORA se compromete a no desarrollar, directa o indirectamente, actividades empresariales que compitan con LA PARTE DIVULGADORA utilizando la Información Confidencial recibida.`);
    drawSubClause('7.2', `Esta obligación de no competencia se mantendrá vigente durante el período de confidencialidad establecido en la Cláusula 4ª.`);
    drawSubClause('7.3', `En caso de que LA PARTE RECEPTORA infrinja esta cláusula, deberá indemnizar a LA PARTE DIVULGADORA por todos los daños y perjuicios causados, sin perjuicio de las demás acciones legales que pudieran corresponder.`);
  }

  // Clause 8: Non-solicitation (optional)
  if (data.includeNonSolicitation !== false) {
    drawClauseTitle('CLÁUSULA DE NO CAPTACIÓN');
    drawSubClause('8.1', `Durante la vigencia del presente Contrato y durante un período de dos (2) años tras su terminación, LA PARTE RECEPTORA se compromete a no contratar, intentar contratar, solicitar o inducir la contratación de ningún empleado, directivo, consultor o colaborador de LA PARTE DIVULGADORA.`);
    drawSubClause('8.2', `Asimismo, LA PARTE RECEPTORA se compromete a no interferir en las relaciones comerciales de LA PARTE DIVULGADORA con sus clientes, proveedores o socios comerciales.`);
  }

  // Clause 9: Liability and Penalties
  drawClauseTitle('RESPONSABILIDAD E INDEMNIZACIÓN');
  drawSubClause('9.1', `LA PARTE RECEPTORA reconoce que el incumplimiento de las obligaciones establecidas en el presente Contrato podría causar daños irreparables a LA PARTE DIVULGADORA, difícilmente cuantificables en términos monetarios.`);
  drawSubClause('9.2', `En caso de incumplimiento total o parcial de las obligaciones de confidencialidad, LA PARTE RECEPTORA se obliga a indemnizar a LA PARTE DIVULGADORA por todos los daños y perjuicios directos e indirectos causados, incluyendo el lucro cesante, el daño emergente, los costes de defensa jurídica y cualquier otro gasto derivado del incumplimiento.`);
  drawSubClause('9.3', `Las partes acuerdan que, sin perjuicio de la indemnización por daños y perjuicios reales, en caso de incumplimiento de las obligaciones de confidencialidad, LA PARTE RECEPTORA abonará a LA PARTE DIVULGADORA una cantidad mínima en concepto de cláusula penal de ${formatCurrency(data.penaltyAmount || 50000)}, sin que dicho pago exonere a LA PARTE RECEPTORA de su obligación de indemnizar los daños adicionales que excedan de dicha cantidad.`);
  drawSubClause('9.4', `LA PARTE DIVULGADORA tendrá derecho a solicitar ante los tribunales competentes las medidas cautelares que considere necesarias para proteger su Información Confidencial, incluyendo el cese inmediato de cualquier uso o divulgación no autorizada.`);

  // Clause 10: Legal Requirements
  drawClauseTitle('OBLIGACIONES LEGALES DE DIVULGACIÓN');
  drawSubClause('10.1', `Si LA PARTE RECEPTORA fuera legalmente obligada a revelar Información Confidencial en virtud de una orden judicial, requerimiento administrativo o cualquier otra disposición legal, deberá:`);
  drawParagraph(`a) Notificar inmediatamente y por escrito a LA PARTE DIVULGADORA antes de realizar dicha revelación, siempre que legalmente sea posible;`, 5);
  drawParagraph(`b) Cooperar con LA PARTE DIVULGADORA en cualquier intento razonable de obtener un tratamiento confidencial o una orden de protección respecto a la Información Confidencial;`, 5);
  drawParagraph(`c) Limitar la revelación al mínimo estrictamente necesario para cumplir con el requerimiento legal;`, 5);
  drawParagraph(`d) Informar a la autoridad requirente del carácter confidencial de la información revelada.`, 5);

  // Clause 11: Miscellaneous
  drawClauseTitle('DISPOSICIONES GENERALES');
  drawSubClause('11.1', `INTEGRIDAD DEL ACUERDO: El presente Contrato constituye el acuerdo completo entre las partes en relación con su objeto y sustituye a cualquier acuerdo, entendimiento o negociación previa, ya sea oral o escrita, sobre la misma materia.`);
  drawSubClause('11.2', `MODIFICACIONES: Cualquier modificación del presente Contrato deberá realizarse por escrito y ser firmada por ambas partes para tener validez.`);
  drawSubClause('11.3', `CESIÓN: LA PARTE RECEPTORA no podrá ceder, transferir o transmitir sus derechos u obligaciones bajo el presente Contrato sin el consentimiento previo y por escrito de LA PARTE DIVULGADORA.`);
  drawSubClause('11.4', `RENUNCIA: La renuncia por cualquiera de las partes a exigir el cumplimiento de cualquier disposición del presente Contrato no se interpretará como una renuncia a su derecho a exigir el cumplimiento posterior de dicha o cualquier otra disposición.`);
  drawSubClause('11.5', `NULIDAD PARCIAL: Si alguna disposición del presente Contrato fuera declarada nula, inválida o inaplicable, las restantes disposiciones permanecerán en pleno vigor y efecto.`);
  drawSubClause('11.6', `NOTIFICACIONES: Todas las notificaciones bajo el presente Contrato deberán realizarse por escrito y enviarse a las direcciones indicadas en el encabezamiento, o a cualquier otra dirección que las partes comuniquen por escrito.`);

  // Clause 12: Jurisdiction
  drawClauseTitle('LEY APLICABLE Y JURISDICCIÓN');
  drawSubClause('12.1', `El presente Contrato se regirá e interpretará de conformidad con la legislación española, y en particular con la Ley 1/2019, de 20 de febrero, de Secretos Empresariales.`);
  drawSubClause('12.2', `Para la resolución de cualquier controversia que pudiera derivarse del presente Contrato, las partes se someten expresamente a la jurisdicción de los Juzgados y Tribunales de ${jurisdiction}, con renuncia a cualquier otro fuero que pudiera corresponderles.`);

  // Clause 13: Data Protection
  drawClauseTitle('PROTECCIÓN DE DATOS PERSONALES');
  drawSubClause('13.1', `Las partes se comprometen a tratar cualquier dato personal contenido en la Información Confidencial de conformidad con el Reglamento (UE) 2016/679 General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).`);
  drawSubClause('13.2', `LA PARTE RECEPTORA únicamente tratará los datos personales contenidos en la Información Confidencial para los fines expresamente autorizados en el presente Contrato, absteniéndose de utilizarlos para cualquier otra finalidad.`);
  drawSubClause('13.3', `En caso de que LA PARTE RECEPTORA tenga acceso a datos personales, aplicará las medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo.`);

  // === SIGNATURE PAGE ===
  addNewPageIfNeeded(100);
  yPos += 20;
  
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(margin, yPos, contentWidth, 0.5, 'F');
  yPos += 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('FIRMAS DE LAS PARTES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_COLOR);
  drawParagraph(`Y en prueba de conformidad con todo lo expuesto, las partes firman el presente Contrato de Confidencialidad por duplicado ejemplar y a un solo efecto, en ${jurisdiction}, a ${formatDate(data.effectiveDate)}.`);

  yPos += 10;

  // Signature boxes
  const boxWidth = (contentWidth - 20) / 2;
  const boxHeight = 50;
  
  // Left signature (Company)
  doc.setDrawColor(...SECONDARY_COLOR);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, boxWidth, boxHeight);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LA PARTE DIVULGADORA', margin + 5, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyName || 'ObelixIA Technologies S.L.', margin + 5, yPos + 15);
  doc.text(`Rep. por: ${data.companyRepresentative || '_____________________'}`, margin + 5, yPos + 22);
  
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_COLOR);
  doc.text('Firma:', margin + 5, yPos + 35);
  doc.line(margin + 20, yPos + 45, margin + boxWidth - 10, yPos + 45);

  // Right signature (Recipient)
  doc.setTextColor(...TEXT_COLOR);
  doc.rect(margin + boxWidth + 20, yPos, boxWidth, boxHeight);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LA PARTE RECEPTORA', margin + boxWidth + 25, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(data.recipientName || '_____________________', margin + boxWidth + 25, yPos + 15);
  doc.text(`DNI/NIE: ${data.recipientID || '_____________________'}`, margin + boxWidth + 25, yPos + 22);
  
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_COLOR);
  doc.text('Firma:', margin + boxWidth + 25, yPos + 35);
  doc.line(margin + boxWidth + 40, yPos + 45, margin + boxWidth + boxWidth + 10, yPos + 45);

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    if (i > 1) {
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      doc.text('NDA - ObelixIA Technologies S.L.', margin, pageHeight - 8);
    }
  }

  return doc;
}

function numeroALetras(num: number): string {
  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ'];
  return unidades[num] || num.toString();
}

export function downloadNDAPDF(data: NDAPDFData, filename?: string) {
  const doc = generateNDAPDF(data);
  const name = filename || `contrato-confidencialidad-${data.companyName?.toLowerCase().replace(/\s+/g, '-') || 'nda'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(name);
}

export function printNDAPDF(data: NDAPDFData) {
  const doc = generateNDAPDF(data);
  openPrintDialogForJsPdf(doc);
}
