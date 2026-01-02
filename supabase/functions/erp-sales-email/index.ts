import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  action: 'send_document' | 'queue_email';
  documentType: 'quote' | 'order' | 'delivery' | 'invoice' | 'credit_note';
  documentId: string;
  companyId: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  body?: string;
  attachHtml?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      action, 
      documentType, 
      documentId, 
      companyId,
      recipientEmail,
      recipientName,
      subject: customSubject,
      body: customBody,
      attachHtml
    } = await req.json() as EmailRequest;

    console.log(`[erp-sales-email] Action: ${action}, Type: ${documentType}, Doc: ${documentId}`);

    // Fetch company
    const { data: company } = await supabase
      .from('erp_companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Company not found');
    }

    // Document type labels
    const typeLabels: Record<string, string> = {
      quote: 'Presupuesto',
      order: 'Pedido',
      delivery: 'Albarán',
      invoice: 'Factura',
      credit_note: 'Abono'
    };

    // Fetch document info for subject/body defaults
    let docNumber = '';
    let docTotal = 0;
    let docCurrency = 'EUR';

    const tableMap: Record<string, string> = {
      quote: 'sales_quotes',
      order: 'sales_orders',
      delivery: 'delivery_notes',
      invoice: 'sales_invoices',
      credit_note: 'sales_credit_notes'
    };

    const { data: doc } = await supabase
      .from(tableMap[documentType])
      .select('number, total, currency')
      .eq('id', documentId)
      .single();

    if (doc) {
      docNumber = doc.number || '';
      docTotal = doc.total || 0;
      docCurrency = doc.currency || 'EUR';
    }

    const subject = customSubject || `${typeLabels[documentType]} ${docNumber} - ${company.name}`;
    
    const defaultBody = `
Estimado/a ${recipientName || 'cliente'},

Le adjuntamos ${typeLabels[documentType].toLowerCase()} nº ${docNumber} por un importe de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: docCurrency }).format(docTotal)}.

Quedamos a su disposición para cualquier consulta.

Atentamente,
${company.name}
${company.phone ? `Tel: ${company.phone}` : ''}
${company.email || ''}
    `.trim();

    const body = customBody || defaultBody;

    if (action === 'queue_email') {
      // Queue email for later sending
      const { data: queuedEmail, error: queueError } = await supabase
        .from('email_outbox')
        .insert([{
          company_id: companyId,
          to_email: recipientEmail,
          to_name: recipientName,
          subject,
          body,
          html_content: attachHtml || null,
          document_type: documentType,
          document_id: documentId,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (queueError) throw queueError;

      console.log(`[erp-sales-email] Queued email ${queuedEmail.id}`);

      return new Response(JSON.stringify({
        success: true,
        queued: true,
        emailId: queuedEmail.id,
        message: 'Email añadido a la cola'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email immediately
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .doc-info { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .doc-number { font-size: 18px; font-weight: bold; color: #1e3a8a; }
    .doc-amount { font-size: 24px; font-weight: bold; color: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${company.name}</h1>
    </div>
    <div class="content">
      <p>Estimado/a ${recipientName || 'cliente'},</p>
      <div class="doc-info">
        <div class="doc-number">${typeLabels[documentType]} Nº ${docNumber}</div>
        <div class="doc-amount">${new Intl.NumberFormat('es-ES', { style: 'currency', currency: docCurrency }).format(docTotal)}</div>
      </div>
      <p>${body.replace(/\n/g, '<br>')}</p>
    </div>
    <div class="footer">
      <p>${company.name}</p>
      <p>${company.address || ''}, ${company.city || ''}</p>
      <p>${company.phone || ''} | ${company.email || ''}</p>
    </div>
  </div>
</body>
</html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${company.name} <onboarding@resend.dev>`,
        to: [recipientEmail],
        subject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('[erp-sales-email] Resend error:', errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const resendData = await resendResponse.json();
    console.log(`[erp-sales-email] Email sent: ${resendData.id}`);

    // Log to email_outbox as sent
    await supabase
      .from('email_outbox')
      .insert([{
        company_id: companyId,
        to_email: recipientEmail,
        to_name: recipientName,
        subject,
        body,
        document_type: documentType,
        document_id: documentId,
        status: 'sent',
        sent_at: new Date().toISOString(),
        external_id: resendData.id,
        created_at: new Date().toISOString()
      }]);

    return new Response(JSON.stringify({
      success: true,
      sent: true,
      emailId: resendData.id,
      message: 'Email enviado correctamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-sales-email] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
