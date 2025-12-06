-- Add DELETE policies for provisional financial statements tables
CREATE POLICY "Admins can delete provisional financial statements"
ON public.provisional_financial_statements
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Users can delete their own provisional statements"
ON public.provisional_financial_statements
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = provisional_financial_statements.company_id
    AND c.gestor_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete provisional balance sheets"
ON public.provisional_balance_sheets
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Admins can delete provisional income statements"
ON public.provisional_income_statements
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));