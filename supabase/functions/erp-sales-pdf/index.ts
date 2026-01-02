import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFRequest {
  action: 'generate_quote' | 'generate_order' | 'generate_delivery' | 'generate_invoice' | 'generate_credit_note';
  documentId: string;
  companyId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, documentId, companyId } = await req.json() as PDFRequest;

    console.log(`[erp-sales-pdf] Action: ${action}, Document: ${documentId}`);

    // Fetch company data
    const { data: company } = await supabase
      .from('erp_companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Company not found');
    }

    let document: Record<string, unknown> | null = null;
    let lines: Record<string, unknown>[] = [];
    let documentType = '';
    let documentTitle = '';

    // Fetch document based on type
    switch (action) {
      case 'generate_quote': {
        const { data } = await supabase.from('sales_quotes').select('*').eq('id', documentId).single();
        document = data;
        const { data: lineData } = await supabase.from('sales_quote_lines').select('*').eq('quote_id', documentId);
        lines = lineData || [];
        documentType = 'PRESUPUESTO';
        documentTitle = `Presupuesto ${data?.number || ''}`;
        break;
      }
      case 'generate_order': {
        const { data } = await supabase.from('sales_orders').select('*').eq('id', documentId).single();
        document = data;
        const { data: lineData } = await supabase.from('sales_order_lines').select('*').eq('order_id', documentId);
        lines = lineData || [];
        documentType = 'PEDIDO';
        documentTitle = `Pedido ${data?.number || ''}`;
        break;
      }
      case 'generate_delivery': {
        const { data } = await supabase.from('delivery_notes').select('*').eq('id', documentId).single();
        document = data;
        const { data: lineData } = await supabase.from('delivery_note_lines').select('*').eq('delivery_note_id', documentId);
        lines = lineData || [];
        documentType = 'ALBARÁN';
        documentTitle = `Albarán ${data?.number || ''}`;
        break;
      }
      case 'generate_invoice': {
        const { data } = await supabase.from('sales_invoices').select('*').eq('id', documentId).single();
        document = data;
        const { data: lineData } = await supabase.from('sales_invoice_lines').select('*').eq('invoice_id', documentId);
        lines = lineData || [];
        documentType = 'FACTURA';
        documentTitle = `Factura ${data?.number || ''}`;
        break;
      }
      case 'generate_credit_note': {
        const { data } = await supabase.from('sales_credit_notes').select('*').eq('id', documentId).single();
        document = data;
        const { data: lineData } = await supabase.from('sales_credit_note_lines').select('*').eq('credit_note_id', documentId);
        lines = lineData || [];
        documentType = 'ABONO';
        documentTitle = `Abono ${data?.number || ''}`;
        break;
      }
    }

    if (!document) {
      throw new Error('Document not found');
    }

    // Fetch customer
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', document.customer_id)
      .single();

    // Generate HTML for PDF
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: String(document?.currency || 'EUR')
      }).format(amount);
    };

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('es-ES');
    };

    const linesHtml = lines.map((line, i) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${line.description || ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${line.qty || 0}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(Number(line.unit_price) || 0)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${line.discount_total ? formatCurrency(Number(line.discount_total)) : '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Number(line.tax_rate) || 0}%</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(Number(line.line_total) || 0)}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${documentTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1f2937; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
    .company-info h1 { font-size: 24px; color: #1e3a8a; margin-bottom: 5px; }
    .company-info p { color: #6b7280; font-size: 11px; }
    .doc-info { text-align: right; }
    .doc-type { font-size: 28px; font-weight: bold; color: #3b82f6; text-transform: uppercase; }
    .doc-number { font-size: 16px; color: #1f2937; margin-top: 5px; }
    .doc-date { color: #6b7280; margin-top: 5px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { width: 48%; }
    .party-title { font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 1px; }
    .party-name { font-size: 14px; font-weight: 600; color: #1f2937; }
    .party-detail { font-size: 11px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f3f4f6; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
    th:nth-child(3), th:nth-child(4), th:nth-child(5), th:nth-child(6), th:nth-child(7) { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .total-row.grand { border-top: 2px solid #1f2937; border-bottom: none; padding-top: 12px; font-size: 16px; font-weight: bold; }
    .notes { margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .notes-title { font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1>${company.name}</h1>
        <p>${company.legal_name || ''}</p>
        <p>CIF: ${company.tax_id || 'N/A'}</p>
        <p>${company.address || ''}, ${company.city || ''} ${company.postal_code || ''}</p>
        <p>Tel: ${company.phone || ''} | ${company.email || ''}</p>
      </div>
      <div class="doc-info">
        <div class="doc-type">${documentType}</div>
        <div class="doc-number">Nº ${document.number}</div>
        <div class="doc-date">${formatDate(String(document.date || document.invoice_date || document.created_at))}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-title">Cliente</div>
        <div class="party-name">${customer?.name || 'N/A'}</div>
        <div class="party-detail">CIF: ${customer?.tax_id || 'N/A'}</div>
        <div class="party-detail">${customer?.address || ''}</div>
        <div class="party-detail">${customer?.city || ''} ${customer?.postal_code || ''}</div>
        <div class="party-detail">${customer?.email || ''}</div>
      </div>
      ${action === 'generate_delivery' ? `
      <div class="party">
        <div class="party-title">Dirección de Entrega</div>
        <div class="party-detail">${document.shipping_address || customer?.address || ''}</div>
        <div class="party-detail">${document.shipping_city || customer?.city || ''}</div>
      </div>
      ` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 35%;">Descripción</th>
          <th style="width: 10%;">Cant.</th>
          <th style="width: 15%;">Precio</th>
          <th style="width: 10%;">Dto.</th>
          <th style="width: 10%;">IVA</th>
          <th style="width: 15%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${linesHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatCurrency(Number(document.subtotal) || 0)}</span>
      </div>
      <div class="total-row">
        <span>Impuestos</span>
        <span>${formatCurrency(Number(document.tax_total) || 0)}</span>
      </div>
      <div class="total-row grand">
        <span>TOTAL</span>
        <span>${formatCurrency(Number(document.total) || 0)}</span>
      </div>
    </div>

    ${document.notes ? `
    <div class="notes">
      <div class="notes-title">Observaciones</div>
      <p>${document.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>${company.name} | ${company.website || ''}</p>
      <p>Documento generado el ${formatDate(new Date().toISOString())}</p>
    </div>
  </div>
</body>
</html>
    `;

    console.log(`[erp-sales-pdf] Generated HTML for ${documentTitle}`);

    return new Response(JSON.stringify({
      success: true,
      html,
      documentTitle,
      documentType,
      documentNumber: document.number
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-sales-pdf] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
