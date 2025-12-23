-- Enable realtime for supported_languages table
ALTER TABLE public.supported_languages REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.supported_languages;