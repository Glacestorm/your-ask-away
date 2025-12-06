-- Add DELETE policies for financial statements and related tables
-- Allow admins to delete financial statements
CREATE POLICY "Admins can delete financial statements"
ON public.company_financial_statements
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

-- Allow admins to delete balance sheets
CREATE POLICY "Admins can delete balance sheets"
ON public.balance_sheets
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

-- Allow admins to delete income statements
CREATE POLICY "Admins can delete income statements"
ON public.income_statements
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

-- Allow admins to delete cash flow statements
CREATE POLICY "Admins can delete cash flow statements"
ON public.cash_flow_statements
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));

-- Allow admins to delete equity changes statements
CREATE POLICY "Admins can delete equity changes statements"
ON public.equity_changes_statements
FOR DELETE
USING (is_admin_or_superadmin(auth.uid()));