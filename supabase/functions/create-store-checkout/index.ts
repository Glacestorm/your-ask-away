import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  moduleKey: string;
  moduleName: string;
  price: number;
  quantity: number;
  licenseType: 'annual' | 'perpetual' | 'monthly';
}

interface CustomerData {
  companyName: string;
  taxId: string;
  email: string;
  phone?: string;
  country: string;
  billingAddress?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STORE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { items, customer, promoCode, subtotal, discount, tax, total } = body as {
      items: CartItem[];
      customer: CustomerData;
      promoCode?: string;
      subtotal: number;
      discount: number;
      tax: number;
      total: number;
    };

    logStep("Request parsed", { itemCount: items.length, customer: customer.email });

    // Validate required fields
    if (!items?.length || !customer?.email || !customer?.companyName || !customer?.taxId) {
      throw new Error("Missing required fields");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: customer.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      // Create new Stripe customer
      const newCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.companyName,
        phone: customer.phone,
        address: {
          country: customer.country,
          line1: customer.billingAddress,
        },
        metadata: {
          tax_id: customer.taxId,
        },
      });
      customerId = newCustomer.id;
      logStep("New Stripe customer created", { customerId });
    }

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from('store_orders')
      .insert({
        customer_email: customer.email,
        customer_name: customer.companyName,
        company_name: customer.companyName,
        tax_id: customer.taxId,
        country: customer.country,
        billing_address: customer.billingAddress,
        phone: customer.phone,
        subtotal,
        discount_amount: discount,
        tax_amount: tax,
        total,
        promo_code: promoCode,
        license_type: items[0]?.licenseType || 'annual',
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      logStep("Error creating order", { error: orderError });
      throw new Error("Failed to create order");
    }

    logStep("Order created", { orderId: order.id, orderNumber: order.order_number });

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      module_key: item.moduleKey,
      module_name: item.moduleName,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      license_duration_months: item.licenseType === 'perpetual' ? 0 : item.licenseType === 'monthly' ? 1 : 12,
    }));

    const { error: itemsError } = await supabaseClient
      .from('store_order_items')
      .insert(orderItems);

    if (itemsError) {
      logStep("Error creating order items", { error: itemsError });
    }

    // Create Stripe line items
    const lineItems = items.map(item => {
      let unitAmount = Math.round(item.price * 100); // Convert to cents
      
      if (item.licenseType === 'perpetual') {
        unitAmount = unitAmount * 5;
      } else if (item.licenseType === 'monthly') {
        unitAmount = Math.round(unitAmount / 10);
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.moduleName,
            description: `Licencia ${item.licenseType === 'perpetual' ? 'Perpetua' : item.licenseType === 'monthly' ? 'Mensual' : 'Anual'} - ObelixIA`,
            metadata: {
              module_key: item.moduleKey,
              license_type: item.licenseType,
            },
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session
    const origin = req.headers.get("origin") || "https://lovable.dev";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/checkout`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: {
            order_id: order.id,
          },
        },
      },
      billing_address_collection: 'auto',
      payment_method_types: ['card', 'sepa_debit'],
    });

    // Update order with Stripe session ID
    await supabaseClient
      .from('store_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, orderId: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
