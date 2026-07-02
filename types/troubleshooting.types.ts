export interface TroubleshootingKnowledge {
  id: string;
  category: string;
  symptom: string;
  root_cause?: string;
  severity?: string;
  keywords?: string;
  resolution_protocol: string;
  sop_reference: string;
  video_url?: string;
  created_at?: string;
  updated_at?: string;
}