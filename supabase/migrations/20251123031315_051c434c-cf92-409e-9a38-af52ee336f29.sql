-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can view active templates"
  ON public.email_templates
  FOR SELECT
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default monthly report template
INSERT INTO public.email_templates (template_name, template_type, subject, html_content, variables) VALUES (
  'monthly_performance_report',
  'monthly_report',
  '📊 Tu Reporte de Rendimiento - {{month}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Mensual de Rendimiento</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📊 Reporte de Rendimiento</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{month}}</p>
  </div>

  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <div style="margin-bottom: 30px;">
      <h2 style="color: #667eea; margin: 0 0 10px 0;">Hola {{gestor_name}} {{badge_emoji}}</h2>
      <p style="margin: 0; color: #666; font-size: 14px;">Aquí está tu resumen de rendimiento del mes pasado</p>
    </div>

    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
      <div style="font-size: 48px; margin-bottom: 10px;">{{badge_emoji}}</div>
      <div style="font-size: 18px; opacity: 0.9; margin-bottom: 5px;">Tu Posición</div>
      <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">#{{rank}}</div>
      <div style="font-size: 14px; opacity: 0.8;">de {{total_gestores}} gestores</div>
      {{top_3_badge}}
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">📈 Tus Métricas</h3>
      
      <div style="display: table; width: 100%; margin-bottom: 15px;">
        <div style="display: table-row;">
          <div style="display: table-cell; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Visitas Realizadas</div>
            <div style="font-size: 28px; font-weight: bold; color: {{visits_color}};">{{total_visits}}</div>
            <div style="font-size: 11px; color: #999; margin-top: 5px;">Promedio equipo: {{avg_visits}}</div>
          </div>
        </div>
      </div>

      <div style="display: table; width: 100%; margin-bottom: 15px;">
        <div style="display: table-row;">
          <div style="display: table-cell; padding: 15px; background: #f8f9fa; border-radius: 8px; width: 48%;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Tasa de Conversión</div>
            <div style="font-size: 24px; font-weight: bold; color: {{conversion_color}};">{{conversion_rate}}%</div>
            <div style="font-size: 11px; color: #999; margin-top: 5px;">Promedio: {{avg_conversion}}%</div>
          </div>
          <div style="display: table-cell; width: 4%;"></div>
          <div style="display: table-cell; padding: 15px; background: #f8f9fa; border-radius: 8px; width: 48%;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Vinculación Media</div>
            <div style="font-size: 24px; font-weight: bold; color: {{vinculacion_color}};">{{avg_vinculacion}}%</div>
            <div style="font-size: 11px; color: #999; margin-top: 5px;">Promedio: {{avg_team_vinculacion}}%</div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🏆 Tus Logros</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        {{achievements}}
      </div>
    </div>

    {{top_performer_section}}

    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">{{motivation_title}}</div>
      <div style="font-size: 14px; opacity: 0.9;">{{motivation_message}}</div>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">Este reporte se genera automáticamente cada mes</p>
      <p style="margin: 0;">¿Preguntas? Contacta a tu supervisor</p>
    </div>

  </div>
</body>
</html>',
  '{"gestor_name": "Nombre del gestor", "month": "Mes y año", "rank": "Posición en ranking", "total_gestores": "Total de gestores", "badge_emoji": "Emoji de insignia", "total_visits": "Total de visitas", "conversion_rate": "Porcentaje de conversión", "avg_vinculacion": "Porcentaje promedio de vinculación", "avg_visits": "Promedio de visitas del equipo", "avg_conversion": "Promedio de conversión del equipo", "avg_team_vinculacion": "Promedio de vinculación del equipo", "visits_color": "Color para visitas", "conversion_color": "Color para conversión", "vinculacion_color": "Color para vinculación", "achievements": "HTML de logros", "top_3_badge": "HTML de badge top 3", "top_performer_section": "HTML de top performer", "motivation_title": "Título motivacional", "motivation_message": "Mensaje motivacional"}'::jsonb
);