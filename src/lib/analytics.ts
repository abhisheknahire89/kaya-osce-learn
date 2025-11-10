import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "assignment_start"
  | "student_message"
  | "action_order_labs"
  | "action_order_exam"
  | "action_physical_exam"
  | "action_request_nadi"
  | "run_submit"
  | "run_scored"
  | "case_generate"
  | "case_approve"
  | "case_assign"
  | "case_edit"
  | "case_preview"
  | "faculty_review"
  | "cbdc_upload"
  | "simulation_started"
  | "simulation_paused"
  | "export_debrief"
  | "share_debrief"
  | "run_retry"
  | "approve_swipe"
  | "reject_swipe"
  | "bulk_approve"
  | "diagnosis_submitted"
  | "management_submitted"
  | "proceed_to_diagnosis";

interface AnalyticsPayload {
  event: AnalyticsEvent;
  actor_id: string;
  actor_role?: string;
  case_id?: string;
  run_id?: string;
  cohort_id?: string;
  assignment_id?: string;
  duration_ms?: number;
  extra?: Record<string, any>;
}

/**
 * Log an analytics event
 * All user actions should emit events for tracking and audit purposes
 */
export const logAnalyticsEvent = async (payload: AnalyticsPayload) => {
  try {
    const eventData = {
      event_type: payload.event,
      actor_id: payload.actor_id,
      actor_role: payload.actor_role,
      case_id: payload.case_id,
      run_id: payload.run_id,
      cohort_id: payload.cohort_id,
      assignment_id: payload.assignment_id,
      duration_ms: payload.duration_ms,
      metadata: payload.extra || {},
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log("📊 Analytics Event:", eventData);
    }

    // Store in analytics table (you'll need to create this table)
    // For now, we'll just log to console
    // TODO: Create analytics_events table and uncomment below
    /*
    const { error } = await supabase
      .from("analytics_events")
      .insert(eventData);

    if (error) {
      console.error("Failed to log analytics event:", error);
    }
    */

    return { success: true };
  } catch (error) {
    console.error("Error logging analytics event:", error);
    return { success: false, error };
  }
};

// Alias for convenience
export const trackEvent = logAnalyticsEvent;

/**
 * Generate a request ID for tracking related events
 */
export const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
