/**
 * Enhanced Audit Logger for ISO 27001 Compliance
 * Logs all security-relevant events with IP, user-agent, and context
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditCategory = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'system'
  | 'security'
  | 'compliance';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  action: string;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  category?: AuditCategory;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

/**
 * Get client IP address (best effort from headers)
 */
function getClientIP(): string | null {
  // In browser context, we can't directly get IP
  // This would be populated by the server/edge function
  return null;
}

/**
 * Get user agent string
 */
function getUserAgent(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return 'unknown';
}

/**
 * Get session ID from storage
 */
function getSessionId(): string {
  if (typeof sessionStorage !== 'undefined') {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }
  return 'no-session';
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_audit_event', {
      p_action: event.action,
      p_table_name: event.tableName,
      p_record_id: event.recordId || null,
      p_old_data: event.oldData ? JSON.stringify(event.oldData) : null,
      p_new_data: event.newData ? JSON.stringify(event.newData) : null,
      p_ip_address: getClientIP(),
      p_user_agent: getUserAgent(),
      p_category: event.category || 'general',
      p_severity: event.severity || 'info',
    });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  action: 'login' | 'logout' | 'login_failed' | 'mfa_challenge' | 'mfa_success' | 'mfa_failed' | 'password_change' | 'session_expired',
  metadata?: Record<string, any>
): Promise<void> {
  const severity: AuditSeverity = 
    action === 'login_failed' || action === 'mfa_failed' ? 'warning' : 'info';
  
  await logAuditEvent({
    action,
    tableName: 'auth',
    category: 'authentication',
    severity,
    newData: {
      ...metadata,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
    },
  });
}

/**
 * Log data access events
 */
export async function logDataAccess(
  tableName: string,
  recordId: string,
  accessType: 'view' | 'export' | 'print',
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action: `data_${accessType}`,
    tableName,
    recordId,
    category: 'data_access',
    severity: 'info',
    newData: metadata,
  });
}

/**
 * Log data modification events
 */
export async function logDataModification(
  tableName: string,
  recordId: string,
  action: 'create' | 'update' | 'delete',
  oldData?: Record<string, any>,
  newData?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action: `data_${action}`,
    tableName,
    recordId,
    category: 'data_modification',
    severity: action === 'delete' ? 'warning' : 'info',
    oldData,
    newData,
  });
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  action: string,
  severity: AuditSeverity,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action,
    tableName: 'security',
    category: 'security',
    severity,
    newData: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log compliance-related events
 */
export async function logComplianceEvent(
  action: string,
  details: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action,
    tableName: 'compliance',
    category: 'compliance',
    severity: 'info',
    newData: details,
  });
}
