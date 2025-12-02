import { CompanyWithDetails } from '@/types/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';

interface CompanyPrintReportProps {
  companies: CompanyWithDetails[];
  title?: string;
}

// Extended company type to include fields from database that may not be in local types
type ExtendedCompany = CompanyWithDetails & {
  facturacion_anual?: number | null;
  periodo_facturacion?: string | null;
  ingresos_creand?: number | null;
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
                  
                  <span className="text-gray-500">Ingresos Creand:</span>
                  <span>{formatCurrency(company.ingresos_creand)}</span>
                  
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
                  <span className="text-gray-500">Vinc. Creand:</span>
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
        <p>Informe generado automáticamente - Creand Business Management</p>
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
              <tr><td>Ingresos Creand:</td><td>${formatCurrency(company.ingresos_creand)}</td></tr>
              <tr><td>P&L Banco:</td><td>${formatCurrency(company.pl_banco)}</td></tr>
              <tr><td>Beneficios:</td><td>${formatCurrency(company.beneficios)}</td></tr>
              <tr><td>BP:</td><td>${company.bp || '-'}</td></tr>
            </table>
          </div>
          <div class="detail-column">
            <h3>Vinculación y Contacto</h3>
            <table>
              <tr><td>Vinc. Creand:</td><td class="highlight-green">${formatPercent(company.vinculacion_entidad_1)}</td></tr>
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
