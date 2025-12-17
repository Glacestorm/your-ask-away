import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  coverLetter?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { invoiceId, recipientEmail, coverLetter }: SendInvoiceRequest = await req.json();

    console.log(`Sending invoice ${invoiceId} to ${recipientEmail}`);

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('obelixia_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Format price
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR' 
      }).format(price);
    };

    // Parse items if string
    const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 20px; 
      background: #f5f5f5;
    }
    .container { 
      max-width: 700px; 
      margin: 0 auto; 
      background: #fff; 
      border-radius: 12px; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #1e3a5f 0%, #0d7377 100%); 
      color: white; 
      padding: 40px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 300;
      letter-spacing: 2px;
    }
    .header .invoice-number { 
      font-size: 16px; 
      opacity: 0.9; 
      margin-top: 10px;
      font-family: monospace;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 15px;
      background: linear-gradient(90deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .cover-letter {
      padding: 30px 40px;
      background: #f8fafb;
      border-bottom: 1px solid #e5e7eb;
      white-space: pre-line;
      font-size: 14px;
      color: #4b5563;
    }
    .content { 
      padding: 40px; 
    }
    .client-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .client-info div {
      flex: 1;
    }
    .client-info h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #9ca3af;
      margin: 0 0 8px 0;
      letter-spacing: 1px;
    }
    .client-info p {
      margin: 0;
      color: #1f2937;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
    }
    th { 
      background: #f3f4f6; 
      padding: 12px 15px; 
      text-align: left; 
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.5px;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    td { 
      padding: 15px; 
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }
    .totals {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 280px;
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .totals-row.total {
      border-top: 2px solid #e5e7eb;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
    }
    .totals-row.total .amount {
      color: #059669;
    }
    .dates-row {
      display: flex;
      gap: 20px;
      margin-top: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .date-item {
      flex: 1;
      text-align: center;
    }
    .date-item .label {
      font-size: 11px;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 5px;
    }
    .date-item .value {
      font-weight: 500;
      color: #1f2937;
    }
    .footer { 
      background: #1e3a5f; 
      padding: 30px; 
      text-align: center; 
      color: white;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .footer .company {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .payment-info {
      margin-top: 30px;
      padding: 20px;
      background: #ecfdf5;
      border-radius: 8px;
      border-left: 4px solid #10b981;
    }
    .payment-info h4 {
      margin: 0 0 10px 0;
      color: #059669;
      font-size: 14px;
    }
    .payment-info p {
      margin: 0;
      font-size: 13px;
      color: #047857;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ObelixIA</div>
      <h1>FACTURA</h1>
      <div class="invoice-number">${invoice.invoice_number}</div>
    </div>
    
    ${coverLetter ? `
    <div class="cover-letter">
      ${coverLetter}
    </div>
    ` : ''}
    
    <div class="content">
      <div class="client-info">
        <div>
          <h3>Facturar a</h3>
          <p><strong>${invoice.customer_company || invoice.customer_name || 'Cliente'}</strong></p>
          ${invoice.customer_name && invoice.customer_company ? `<p>${invoice.customer_name}</p>` : ''}
          <p>${invoice.customer_email}</p>
          ${invoice.customer_tax_id ? `<p>CIF/NIF: ${invoice.customer_tax_id}</p>` : ''}
          ${invoice.customer_address ? `<p>${invoice.customer_address}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <h3>Emitida por</h3>
          <p><strong>ObelixIA S.L.</strong></p>
          <p>CIF: B12345678</p>
          <p>León, España</p>
          <p>info@obelixia.com</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cant.</th>
            <th>Precio Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td><strong>${item.module_name}</strong></td>
              <td>${item.quantity}</td>
              <td>${formatPrice(item.unit_price)}</td>
              <td><strong>${formatPrice(item.total)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatPrice(invoice.subtotal)}</span>
          </div>
          <div class="totals-row">
            <span>IVA (${invoice.tax_rate}%)</span>
            <span>${formatPrice(invoice.tax_amount)}</span>
          </div>
          <div class="totals-row total">
            <span>Total</span>
            <span class="amount">${formatPrice(invoice.total)}</span>
          </div>
        </div>
      </div>
      
      <div class="dates-row">
        <div class="date-item">
          <div class="label">Fecha de Emisión</div>
          <div class="value">${new Date(invoice.issue_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="date-item">
          <div class="label">Fecha de Vencimiento</div>
          <div class="value">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
        </div>
      </div>
      
      <div class="payment-info">
        <h4>Información de Pago</h4>
        <p>Para realizar el pago, por favor contacte con nuestro equipo comercial o realice una transferencia bancaria indicando el número de factura como referencia.</p>
      </div>
      
      ${invoice.notes ? `
      <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Notas:</strong> ${invoice.notes}</p>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p class="company">ObelixIA - CRM Bancario Inteligente</p>
      <p>Jaime Fernández García | Director Comercial</p>
      <p>jfernandez@obelixia.com | +34 606 770 033</p>
      <p style="margin-top: 15px; font-size: 11px; opacity: 0.7;">
        Este documento es una factura electrónica válida según la normativa vigente.
      </p>
    </div>
  </div>
</body>
</html>
`;

    // Send email
    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ObelixIA Facturación <facturacion@obelixia.com>',
          to: [recipientEmail],
          subject: `Factura ${invoice.invoice_number} - ObelixIA`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }

      console.log(`Invoice email sent to ${recipientEmail}`);
    } else {
      console.log('RESEND_API_KEY not configured - simulating email send');
    }

    // Update invoice status
    await supabase
      .from('obelixia_invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    return new Response(JSON.stringify({
      success: true,
      message: `Invoice sent to ${recipientEmail}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending invoice:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
