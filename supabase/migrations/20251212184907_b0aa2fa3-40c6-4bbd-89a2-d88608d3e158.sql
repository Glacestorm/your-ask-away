-- Enable realtime for sales_achievements table to enable live notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_achievements;