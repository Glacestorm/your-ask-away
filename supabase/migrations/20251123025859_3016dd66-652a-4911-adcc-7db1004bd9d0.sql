-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Set replica identity to full to get complete row data in realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;