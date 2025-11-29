-- Add assigned_to field to goals table to allow assigning goals to specific users
ALTER TABLE goals ADD COLUMN assigned_to uuid REFERENCES profiles(id);

-- Add index for better query performance
CREATE INDEX idx_goals_assigned_to ON goals(assigned_to);

-- Update RLS policies for goals
DROP POLICY IF EXISTS "Usuarios pueden ver objetivos" ON goals;
DROP POLICY IF EXISTS "Admins pueden gestionar objetivos" ON goals;

-- Gestores can view goals assigned to them or global goals (assigned_to is null)
CREATE POLICY "Users can view assigned or global goals"
ON goals
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() 
  OR assigned_to IS NULL
  OR is_admin_or_superadmin(auth.uid())
);

-- Only admins can create, update, and delete goals
CREATE POLICY "Only admins can manage goals"
ON goals
FOR ALL
TO authenticated
USING (is_admin_or_superadmin(auth.uid()))
WITH CHECK (is_admin_or_superadmin(auth.uid()));