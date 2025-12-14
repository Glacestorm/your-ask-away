import { useDemoContext } from '@/contexts/DemoContext';
import { useCallback } from 'react';

/**
 * Hook to filter demo data from real data
 * In demo mode: only show data with DEMO_ prefix
 * In normal mode: hide all DEMO_ prefixed data
 */
export const useDemoDataFilter = () => {
  const { isDemoMode, demoUserId, demoSessionId } = useDemoContext();

  /**
   * Filter companies - only show demo companies in demo mode
   */
  const filterCompanies = useCallback((companies: any[]) => {
    if (!companies) return [];
    
    if (isDemoMode) {
      // In demo mode, only show DEMO_ prefixed companies
      return companies.filter(c => c.name?.startsWith('DEMO_'));
    } else {
      // In normal mode, hide all DEMO_ prefixed companies
      return companies.filter(c => !c.name?.startsWith('DEMO_'));
    }
  }, [isDemoMode]);

  /**
   * Filter visits based on demo mode
   */
  const filterVisits = useCallback((visits: any[]) => {
    if (!visits) return [];
    
    if (isDemoMode) {
      // In demo mode, only show visits with DEMO in notes or from demo user
      return visits.filter(v => 
        v.notes?.includes('DEMO') || 
        v.gestor_id === demoUserId
      );
    } else {
      // In normal mode, hide visits with DEMO in notes
      return visits.filter(v => !v.notes?.includes('DEMO'));
    }
  }, [isDemoMode, demoUserId]);

  /**
   * Filter goals based on demo mode
   */
  const filterGoals = useCallback((goals: any[]) => {
    if (!goals) return [];
    
    if (isDemoMode) {
      return goals.filter(g => g.title?.startsWith('DEMO'));
    } else {
      return goals.filter(g => !g.title?.startsWith('DEMO'));
    }
  }, [isDemoMode]);

  /**
   * Filter notifications based on demo mode
   */
  const filterNotifications = useCallback((notifications: any[]) => {
    if (!notifications) return [];
    
    if (isDemoMode) {
      return notifications.filter(n => 
        n.title?.startsWith('DEMO') || 
        n.user_id === demoUserId
      );
    } else {
      return notifications.filter(n => !n.title?.startsWith('DEMO'));
    }
  }, [isDemoMode, demoUserId]);

  /**
   * Filter contacts based on demo mode
   */
  const filterContacts = useCallback((contacts: any[]) => {
    if (!contacts) return [];
    
    if (isDemoMode) {
      return contacts.filter(c => c.contact_name?.startsWith('DEMO_'));
    } else {
      return contacts.filter(c => !c.contact_name?.startsWith('DEMO_'));
    }
  }, [isDemoMode]);

  /**
   * Filter opportunities based on demo mode
   */
  const filterOpportunities = useCallback((opportunities: any[]) => {
    if (!opportunities) return [];
    
    if (isDemoMode) {
      return opportunities.filter(o => o.title?.startsWith('DEMO_'));
    } else {
      return opportunities.filter(o => !o.title?.startsWith('DEMO_'));
    }
  }, [isDemoMode]);

  /**
   * Filter action plans based on demo mode
   */
  const filterActionPlans = useCallback((plans: any[]) => {
    if (!plans) return [];
    
    if (isDemoMode) {
      return plans.filter(p => p.title?.startsWith('DEMO'));
    } else {
      return plans.filter(p => !p.title?.startsWith('DEMO'));
    }
  }, [isDemoMode]);

  /**
   * Filter best practices based on demo mode
   */
  const filterBestPractices = useCallback((practices: any[]) => {
    if (!practices) return [];
    
    if (isDemoMode) {
      return practices.filter(p => p.title?.startsWith('DEMO'));
    } else {
      return practices.filter(p => !p.title?.startsWith('DEMO'));
    }
  }, [isDemoMode]);

  /**
   * Filter alerts based on demo mode
   */
  const filterAlerts = useCallback((alerts: any[]) => {
    if (!alerts) return [];
    
    if (isDemoMode) {
      return alerts.filter(a => a.alert_name?.startsWith('DEMO'));
    } else {
      return alerts.filter(a => !a.alert_name?.startsWith('DEMO'));
    }
  }, [isDemoMode]);

  /**
   * Get SQL filter for companies query
   */
  const getCompanyFilter = useCallback(() => {
    if (isDemoMode) {
      return { column: 'name', operator: 'ilike', value: 'DEMO_%' };
    }
    return null;
  }, [isDemoMode]);

  /**
   * Check if current mode is demo
   */
  const isInDemoMode = isDemoMode;

  return {
    isDemoMode: isInDemoMode,
    demoUserId,
    demoSessionId,
    filterCompanies,
    filterVisits,
    filterGoals,
    filterNotifications,
    filterContacts,
    filterOpportunities,
    filterActionPlans,
    filterBestPractices,
    filterAlerts,
    getCompanyFilter,
  };
};
