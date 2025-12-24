import { CompanyWithDetails } from '@/types/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompanyPrintReportProps {
  companies: CompanyWithDetails[];
  title?: string;
}

// Extended company type to include fields from database that may not be in local types
type ExtendedCompany = CompanyWithDetails & {
  facturacion_anual?: number | null;
  periodo_facturacion?: string | null;
  ingresos_entidad_principal?: number | null;
  tags?: string[] | null;
};

export const CompanyPrintReport = ({ companies, title = "Informe de Empresas" }: CompanyPrintReportProps) => {
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return '-';
    return `${value.toFixed(1)}%`;
  };

  const extendedCompanies = companies as ExtendedCompany[];

  return (
    <div className="print-report bg-white text-black p-8 max-w-[210mm] mx-auto">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
        </p>
        <p className="text-sm text-gray-600">
          Total de empresas: {companies.length}
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-center">
        <div className="border rounded p-3">
          <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
          <div className="text-xs text-gray-600">Total Empresas</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(extendedCompanies.reduce((sum, c) => sum + (c.facturacion_anual || c.turnover || 0), 0))}
          </div>
          <div className="text-xs text-gray-600">Facturación Total</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-2xl font-bold text-gray-900">
            {formatPercent(companies.reduce((sum, c) => sum + (c.vinculacion_entidad_1 || 0), 0) / companies.length)}
          </div>
          <div className="text-xs text-gray-600">Vinculación Media</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-2xl font-bold text-gray-900">
            {companies.filter(c => c.fecha_ultima_visita).length}
          </div>
          <div className="text-xs text-gray-600">Con Visitas</div>
        </div>
      </div>

      {/* Companies List */}
      {extendedCompanies.map((company, index) => (
        <div 
          key={company.id} 
          className="mb-6 border rounded-lg overflow-hidden break-inside-avoid"
          style={{ pageBreakInside: 'avoid' }}
        >
          {/* Company Header */}
          <div className="bg-gray-100 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {index + 1}. {company.name}
                </h2>
                <p className="text-sm text-gray-600">{company.address}</p>
              </div>
              {company.status && (
                <span 
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: company.status.color_hex + '30',
                    color: company.status.color_hex
                  }}
                >
                  {company.status.status_name}
                </span>
              )}
            </div>
          </div>

          {/* Company Details Grid */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              {/* Column 1: Basic Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 border-b pb-1">Información Básica</h3>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-gray-500">Parroquia:</span>
                  <span>{company.parroquia || '-'}</span>
                  
                  <span className="text-gray-500">Sector:</span>
                  <span>{company.sector || '-'}</span>
                  
                  <span className="text-gray-500">CNAE:</span>
                  <span className="text-xs">{company.cnae ? formatCnaeWithDescription(company.cnae) : '-'}</span>
                  
                  <span className="text-gray-500">CIF/NIF:</span>
                  <span>{company.tax_id || '-'}</span>
                  
                  <span className="text-gray-500">Tipo Cliente:</span>
                  <span>{company.client_type === 'cliente' ? 'Cliente' : company.client_type === 'potencial_cliente' ? 'Potencial' : '-'}</span>
                  
                  <span className="text-gray-500">Empleados:</span>
                  <span>{company.employees || '-'}</span>
                </div>
              </div>

              {/* Column 2: Financial Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 border-b pb-1">Información Financiera</h3>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-gray-500">Facturación:</span>
                  <span>{formatCurrency(company.facturacion_anual || company.turnover)}</span>
                  
                  <span className="text-gray-500">Período:</span>
                  <span>{company.periodo_facturacion || '-'}</span>
                  
                  <span className="text-gray-500">Ingresos Entidad Principal:</span>
                  <span>{formatCurrency(company.ingresos_entidad_principal)}</span>
                  
                  <span className="text-gray-500">P&L Banco:</span>
                  <span>{formatCurrency(company.pl_banco)}</span>
                  
                  <span className="text-gray-500">Beneficios:</span>
                  <span>{formatCurrency(company.beneficios)}</span>
                  
                  <span className="text-gray-500">BP:</span>
                  <span>{company.bp || '-'}</span>
                </div>
              </div>

              {/* Column 3: Vinculación & Contact */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 border-b pb-1">Vinculación y Contacto</h3>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-gray-500">Vinc. Entidad 1:</span>
                  <span className="font-medium text-green-700">{formatPercent(company.vinculacion_entidad_1)}</span>
                  
                  <span className="text-gray-500">Vinc. Morabanc:</span>
                  <span>{formatPercent(company.vinculacion_entidad_2)}</span>
                  
                  <span className="text-gray-500">Vinc. Andbank:</span>
                  <span>{formatPercent(company.vinculacion_entidad_3)}</span>
                  
                  <span className="text-gray-500">Teléfono:</span>
                  <span>{company.phone || '-'}</span>
                  
                  <span className="text-gray-500">Email:</span>
                  <span className="text-xs truncate">{company.email || '-'}</span>
                  
                  <span className="text-gray-500">Web:</span>
                  <span className="text-xs truncate">{company.website || '-'}</span>
                </div>
              </div>
            </div>

            {/* Gestor & Visit Info */}
            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Gestor asignado: </span>
                <span className="font-medium">{company.gestor?.full_name || 'Sin asignar'}</span>
              </div>
              <div>
                <span className="text-gray-500">Última visita: </span>
                <span>
                  {company.fecha_ultima_visita 
                    ? format(new Date(company.fecha_ultima_visita), "d MMM yyyy", { locale: es })
                    : 'Sin visitas'}
                </span>
              </div>
            </div>

            {/* Observations */}
            {company.observaciones && (
              <div className="mt-3 pt-3 border-t text-sm">
                <span className="text-gray-500">Observaciones: </span>
                <span className="text-gray-700">{company.observaciones}</span>
              </div>
            )}

            {/* Products */}
            {company.products && company.products.length > 0 && (
              <div className="mt-3 pt-3 border-t text-sm">
                <span className="text-gray-500">Productos contratados: </span>
                <span className="text-gray-700">
                  {company.products.map(p => p.name).join(', ')}
                </span>
              </div>
            )}

            {/* Tags */}
            {company.tags && company.tags.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {company.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>Informe generado automáticamente - ObelixIA Business Management</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print-report {
            padding: 0;
            max-width: 100%;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export const printCompaniesReport = (companies: CompanyWithDetails[], title?: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para imprimir el informe.');
    return;
  }

  type ExtendedCompany = CompanyWithDetails & {
    facturacion_anual?: number | null;
    periodo_facturacion?: string | null;
    ingresos_entidad_principal?: number | null;
    tags?: string[] | null;
  };

  const extendedCompanies = companies as ExtendedCompany[];

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return '-';
    return `${value.toFixed(1)}%`;
  };

  const reportTitle = title || 'Informe de Empresas';
  const generatedDate = new Date().toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalFacturacion = extendedCompanies.reduce((sum, c) => sum + (c.facturacion_anual || c.turnover || 0), 0);
  const avgVinculacion = companies.length > 0 
    ? companies.reduce((sum, c) => sum + (c.vinculacion_entidad_1 || 0), 0) / companies.length 
    : 0;
  const companiesWithVisits = companies.filter(c => c.fecha_ultima_visita).length;

  const companiesHtml = extendedCompanies.map((company, index) => {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return 'Sin visitas';
      return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return `
      <div class="company-card">
        <div class="company-header">
          <div>
            <h2>${index + 1}. ${company.name}</h2>
            <p class="address">${company.address}</p>
          </div>
          ${company.status ? `
            <span class="status-badge" style="background-color: ${company.status.color_hex}30; color: ${company.status.color_hex};">
              ${company.status.status_name}
            </span>
          ` : ''}
        </div>
        <div class="company-details">
          <div class="detail-column">
            <h3>Información Básica</h3>
            <table>
              <tr><td>Parroquia:</td><td>${company.parroquia || '-'}</td></tr>
              <tr><td>Sector:</td><td>${company.sector || '-'}</td></tr>
              <tr><td>CNAE:</td><td>${company.cnae || '-'}</td></tr>
              <tr><td>CIF/NIF:</td><td>${company.tax_id || '-'}</td></tr>
              <tr><td>Tipo:</td><td>${company.client_type === 'cliente' ? 'Cliente' : company.client_type === 'potencial_cliente' ? 'Potencial' : '-'}</td></tr>
              <tr><td>Empleados:</td><td>${company.employees || '-'}</td></tr>
            </table>
          </div>
          <div class="detail-column">
            <h3>Información Financiera</h3>
            <table>
              <tr><td>Facturación:</td><td>${formatCurrency(company.facturacion_anual || company.turnover)}</td></tr>
              <tr><td>Período:</td><td>${company.periodo_facturacion || '-'}</td></tr>
              <tr><td>Ingresos Entidad Principal:</td><td>${formatCurrency(company.ingresos_entidad_principal)}</td></tr>
              <tr><td>P&L Banco:</td><td>${formatCurrency(company.pl_banco)}</td></tr>
              <tr><td>Beneficios:</td><td>${formatCurrency(company.beneficios)}</td></tr>
              <tr><td>BP:</td><td>${company.bp || '-'}</td></tr>
            </table>
          </div>
          <div class="detail-column">
            <h3>Vinculación y Contacto</h3>
            <table>
              <tr><td>Vinc. Entidad 1:</td><td class="highlight-green">${formatPercent(company.vinculacion_entidad_1)}</td></tr>
              <tr><td>Vinc. Morabanc:</td><td>${formatPercent(company.vinculacion_entidad_2)}</td></tr>
              <tr><td>Vinc. Andbank:</td><td>${formatPercent(company.vinculacion_entidad_3)}</td></tr>
              <tr><td>Teléfono:</td><td>${company.phone || '-'}</td></tr>
              <tr><td>Email:</td><td>${company.email || '-'}</td></tr>
              <tr><td>Web:</td><td>${company.website || '-'}</td></tr>
            </table>
          </div>
        </div>
        <div class="company-footer">
          <div><strong>Gestor:</strong> ${company.gestor?.full_name || 'Sin asignar'}</div>
          <div><strong>Última visita:</strong> ${formatDate(company.fecha_ultima_visita)}</div>
        </div>
        ${company.observaciones ? `<div class="observations"><strong>Observaciones:</strong> ${company.observaciones}</div>` : ''}
        ${company.products && company.products.length > 0 ? `
          <div class="products"><strong>Productos:</strong> ${company.products.map(p => p.name).join(', ')}</div>
        ` : ''}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #1a1a1a;
          padding: 20px;
        }
        .header { 
          border-bottom: 2px solid #333; 
          padding-bottom: 15px; 
          margin-bottom: 20px;
        }
        .header h1 { font-size: 24px; color: #1a1a1a; }
        .header p { color: #666; margin-top: 5px; }
        .stats { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 15px; 
          margin-bottom: 25px;
        }
        .stat-card { 
          border: 1px solid #ddd; 
          border-radius: 8px; 
          padding: 12px; 
          text-align: center;
        }
        .stat-card .value { font-size: 20px; font-weight: bold; color: #1a1a1a; }
        .stat-card .label { font-size: 10px; color: #666; margin-top: 4px; }
        .company-card { 
          border: 1px solid #ddd; 
          border-radius: 8px; 
          margin-bottom: 20px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .company-header { 
          background: #f5f5f5; 
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .company-header h2 { font-size: 14px; color: #1a1a1a; }
        .company-header .address { font-size: 11px; color: #666; margin-top: 3px; }
        .status-badge { 
          padding: 3px 8px; 
          border-radius: 4px; 
          font-size: 10px; 
          font-weight: 500;
        }
        .company-details { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 15px; 
          padding: 15px;
        }
        .detail-column h3 { 
          font-size: 11px; 
          color: #555; 
          border-bottom: 1px solid #eee; 
          padding-bottom: 5px;
          margin-bottom: 8px;
        }
        .detail-column table { width: 100%; }
        .detail-column td { 
          padding: 2px 0; 
          vertical-align: top;
        }
        .detail-column td:first-child { 
          color: #777; 
          width: 45%;
        }
        .highlight-green { color: #16a34a; font-weight: 600; }
        .company-footer { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px;
          padding: 10px 15px;
          border-top: 1px solid #eee;
          font-size: 11px;
        }
        .observations, .products { 
          padding: 8px 15px;
          border-top: 1px solid #eee;
          font-size: 10px;
          color: #555;
        }
        .footer { 
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #888;
          font-size: 10px;
        }
        @media print {
          body { padding: 0; }
          .company-card { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportTitle}</h1>
        <p>Generado el ${generatedDate}</p>
        <p>Total de empresas: ${companies.length}</p>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <div class="value">${companies.length}</div>
          <div class="label">Total Empresas</div>
        </div>
        <div class="stat-card">
          <div class="value">${formatCurrency(totalFacturacion)}</div>
          <div class="label">Facturación Total</div>
        </div>
        <div class="stat-card">
          <div class="value">${formatPercent(avgVinculacion)}</div>
          <div class="label">Vinculación Media</div>
        </div>
        <div class="stat-card">
          <div class="value">${companiesWithVisits}</div>
          <div class="label">Con Visitas</div>
        </div>
      </div>

      ${companiesHtml}

      <div class="footer">
        <p>Informe generado automáticamente - Creand Business Management</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
};

export interface PDFFieldOptions {
  parroquia: boolean;
  sector: boolean;
  cnae: boolean;
  taxId: boolean;
  clientType: boolean;
  employees: boolean;
  phone: boolean;
  email: boolean;
  website: boolean;
  facturacion: boolean;
  periodoFacturacion: boolean;
  ingresosCreand: boolean;
  plBanco: boolean;
  beneficios: boolean;
  bp: boolean;
  vinculacionCreand: boolean;
  vinculacionMorabanc: boolean;
  vinculacionAndbank: boolean;
  gestor: boolean;
  ultimaVisita: boolean;
  observaciones: boolean;
  productos: boolean;
  status: boolean;
}

const defaultPDFFields: PDFFieldOptions = {
  parroquia: true,
  sector: true,
  cnae: true,
  taxId: true,
  clientType: true,
  employees: true,
  phone: true,
  email: true,
  website: false,
  facturacion: true,
  periodoFacturacion: false,
  ingresosCreand: true,
  plBanco: true,
  beneficios: true,
  bp: false,
  vinculacionCreand: true,
  vinculacionMorabanc: true,
  vinculacionAndbank: true,
  gestor: true,
  ultimaVisita: true,
  observaciones: true,
  productos: true,
  status: true,
};

export const exportCompaniesToPDF = (companies: CompanyWithDetails[], title?: string, fieldOptions?: PDFFieldOptions) => {
  const fields = fieldOptions || defaultPDFFields;
  
  type ExtendedCompany = CompanyWithDetails & {
    facturacion_anual?: number | null;
    periodo_facturacion?: string | null;
    ingresos_creand?: number | null;
    tags?: string[] | null;
  };

  const extendedCompanies = companies as ExtendedCompany[];

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return '-';
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin visitas';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const reportTitle = title || 'Informe de Empresas';
  const generatedDate = new Date().toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalFacturacion = extendedCompanies.reduce((sum, c) => sum + (c.facturacion_anual || c.turnover || 0), 0);
  const avgVinculacion = companies.length > 0 
    ? companies.reduce((sum, c) => sum + (c.vinculacion_entidad_1 || 0), 0) / companies.length 
    : 0;
  const companiesWithVisits = companies.filter(c => c.fecha_ultima_visita).length;

  // Create PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generado el ${generatedDate}`, 14, y);
  y += 5;
  doc.text(`Total de empresas: ${companies.length}`, 14, y);
  y += 10;

  // Stats summary
  doc.setTextColor(0);
  doc.setFontSize(9);
  const statsY = y;
  const statsWidth = (pageWidth - 28) / 4;
  
  const stats = [
    { label: 'Total Empresas', value: companies.length.toString() },
    { label: 'Facturación Total', value: formatCurrency(totalFacturacion) },
    { label: 'Vinculación Media', value: formatPercent(avgVinculacion) },
    { label: 'Con Visitas', value: companiesWithVisits.toString() }
  ];

  stats.forEach((stat, i) => {
    const x = 14 + (i * statsWidth);
    doc.setDrawColor(200);
    doc.rect(x, statsY, statsWidth - 2, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(stat.value, x + (statsWidth - 2) / 2, statsY + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(stat.label, x + (statsWidth - 2) / 2, statsY + 12, { align: 'center' });
    doc.setTextColor(0);
  });

  y = statsY + 20;

  // Build dynamic table columns based on selected fields
  const tableHeaders: string[] = ['Empresa'];
  const getTableRow = (company: ExtendedCompany, index: number): string[] => {
    const row: string[] = [`${index + 1}. ${company.name}`];
    if (fields.parroquia) row.push(company.parroquia || '-');
    if (fields.status) row.push(company.status?.status_name || '-');
    if (fields.facturacion) row.push(formatCurrency(company.facturacion_anual || company.turnover));
    if (fields.vinculacionCreand) row.push(formatPercent(company.vinculacion_entidad_1));
    if (fields.gestor) row.push(company.gestor?.full_name || 'Sin asignar');
    if (fields.ultimaVisita) row.push(formatDate(company.fecha_ultima_visita));
    return row;
  };

  if (fields.parroquia) tableHeaders.push('Parroquia');
  if (fields.status) tableHeaders.push('Estado');
  if (fields.facturacion) tableHeaders.push('Facturación');
  if (fields.vinculacionCreand) tableHeaders.push('Vinc. Creand');
  if (fields.gestor) tableHeaders.push('Gestor');
  if (fields.ultimaVisita) tableHeaders.push('Última Visita');

  const tableData = extendedCompanies.map((company, index) => getTableRow(company, index));

  autoTable(doc, {
    startY: y,
    head: [tableHeaders],
    body: tableData,
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    margin: { left: 14, right: 14 }
  });

  // Detailed company info on new pages
  extendedCompanies.forEach((company, index) => {
    doc.addPage();
    let detailY = 15;

    // Company header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${company.name}`, 14, detailY);
    detailY += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(company.address, 14, detailY);
    detailY += 5;

    if (fields.status && company.status) {
      doc.text(`Estado: ${company.status.status_name}`, 14, detailY);
      detailY += 8;
    } else {
      detailY += 3;
    }

    doc.setTextColor(0);

    // Three columns of info
    const colWidth = (pageWidth - 42) / 3;
    const startX = 14;

    // Column 1: Basic Info
    const basicInfo: [string, string][] = [];
    if (fields.parroquia) basicInfo.push(['Parroquia:', company.parroquia || '-']);
    if (fields.sector) basicInfo.push(['Sector:', company.sector || '-']);
    if (fields.cnae) basicInfo.push(['CNAE:', company.cnae || '-']);
    if (fields.taxId) basicInfo.push(['CIF/NIF:', company.tax_id || '-']);
    if (fields.clientType) basicInfo.push(['Tipo:', company.client_type === 'cliente' ? 'Cliente' : company.client_type === 'potencial_cliente' ? 'Potencial' : '-']);
    if (fields.employees) basicInfo.push(['Empleados:', company.employees?.toString() || '-']);
    if (fields.phone) basicInfo.push(['Teléfono:', company.phone || '-']);
    if (fields.email) basicInfo.push(['Email:', company.email || '-']);
    if (fields.website) basicInfo.push(['Web:', company.website || '-']);

    if (basicInfo.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Información Básica', startX, detailY);
      detailY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      basicInfo.forEach(([label, value]) => {
        doc.setTextColor(100);
        doc.text(label, startX, detailY);
        doc.setTextColor(0);
        doc.text(value, startX + 25, detailY);
        detailY += 4;
      });
    }

    // Column 2: Financial Info
    const financialInfo: [string, string][] = [];
    if (fields.facturacion) financialInfo.push(['Facturación:', formatCurrency(company.facturacion_anual || company.turnover)]);
    if (fields.periodoFacturacion) financialInfo.push(['Período:', company.periodo_facturacion || '-']);
    if (fields.ingresosCreand) financialInfo.push(['Ingresos Creand:', formatCurrency(company.ingresos_creand)]);
    if (fields.plBanco) financialInfo.push(['P&L Banco:', formatCurrency(company.pl_banco)]);
    if (fields.beneficios) financialInfo.push(['Beneficios:', formatCurrency(company.beneficios)]);
    if (fields.bp) financialInfo.push(['BP:', company.bp || '-']);

    if (financialInfo.length > 0) {
      let finY = 15 + 6 + 5 + (fields.status && company.status ? 8 : 3);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Información Financiera', startX + colWidth + 7, finY);
      finY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      financialInfo.forEach(([label, value]) => {
        doc.setTextColor(100);
        doc.text(label, startX + colWidth + 7, finY);
        doc.setTextColor(0);
        doc.text(value, startX + colWidth + 35, finY);
        finY += 4;
      });
    }

    // Column 3: Vinculación
    const vincInfo: [string, string][] = [];
    if (fields.vinculacionCreand) vincInfo.push(['Vinc. Creand:', formatPercent(company.vinculacion_entidad_1)]);
    if (fields.vinculacionMorabanc) vincInfo.push(['Vinc. Morabanc:', formatPercent(company.vinculacion_entidad_2)]);
    if (fields.vinculacionAndbank) vincInfo.push(['Vinc. Andbank:', formatPercent(company.vinculacion_entidad_3)]);

    if (vincInfo.length > 0) {
      let vincY = 15 + 6 + 5 + (fields.status && company.status ? 8 : 3);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Vinculación', startX + (colWidth * 2) + 14, vincY);
      vincY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      vincInfo.forEach(([label, value]) => {
        doc.setTextColor(100);
        doc.text(label, startX + (colWidth * 2) + 14, vincY);
        doc.setTextColor(0);
        doc.text(value, startX + (colWidth * 2) + 42, vincY);
        vincY += 4;
      });
    }

    // Gestor and Visit info
    const baseY = Math.max(
      detailY,
      financialInfo.length > 0 ? 15 + 6 + 5 + (fields.status && company.status ? 8 : 3) + 5 + (financialInfo.length * 4) : 0,
      vincInfo.length > 0 ? 15 + 6 + 5 + (fields.status && company.status ? 8 : 3) + 5 + (vincInfo.length * 4) : 0
    ) + 5;
    
    let currentY = baseY;
    doc.setFontSize(9);

    if (fields.gestor) {
      doc.setTextColor(100);
      doc.text('Gestor asignado:', 14, currentY);
      doc.setTextColor(0);
      doc.text(company.gestor?.full_name || 'Sin asignar', 50, currentY);
    }
    
    if (fields.ultimaVisita) {
      doc.setTextColor(100);
      doc.text('Última visita:', 100, currentY);
      doc.setTextColor(0);
      doc.text(formatDate(company.fecha_ultima_visita), 130, currentY);
    }

    if (fields.gestor || fields.ultimaVisita) currentY += 6;

    // Observations
    if (fields.observaciones && company.observaciones) {
      doc.setTextColor(100);
      doc.text('Observaciones:', 14, currentY);
      doc.setTextColor(0);
      const obsLines = doc.splitTextToSize(company.observaciones, pageWidth - 28);
      doc.text(obsLines, 14, currentY + 4);
      currentY += 4 + (obsLines.length * 4);
    }

    // Products
    if (fields.productos && company.products && company.products.length > 0) {
      doc.setTextColor(100);
      doc.text('Productos contratados:', 14, currentY);
      doc.setTextColor(0);
      doc.text(company.products.map(p => p.name).join(', '), 55, currentY);
    }
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Informe generado automáticamente - Creand Business Management | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `informe_empresas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
  doc.save(filename);
};
