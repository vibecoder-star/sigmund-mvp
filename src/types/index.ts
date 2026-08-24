export type SafetyClassification =
  | 'NORMAL'
  | 'DISTRESS'
  | 'SELF_HARM'
  | 'SUICIDAL_IDEATION'
  | 'VIOLENCE'
  | 'PSYCHOSIS'
  | 'MEDICAL_EMERGENCY'
  | 'MEDICATION_QUESTION'
  | 'DIAGNOSIS_REQUEST';

export type MemoryCategory =
  | 'EXPLICIT_FACT'
  | 'INFERRED_PATTERN'
  | 'HYPOTHESIS'
  | 'UNCERTAINTY';

export interface MemoryEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  confidence: number;
  createdAt: number;
  sessionId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  safety?: SafetyClassification;
  evidence?: EvidenceSource[];
}

export interface EvidenceSource {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi?: string;
  pmid?: string;
  url?: string;
  studyType: StudyType;
  relevance: 'high' | 'medium' | 'low';
  evidenceLevel: 'strong' | 'moderate' | 'limited' | 'inconclusive';
}

export type StudyType =
  | 'systematic_review'
  | 'meta_analysis'
  | 'rct'
  | 'observational_study'
  | 'clinical_guideline'
  | 'expert_consensus'
  | 'theoretical'
  | 'historical';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  safety: SafetyClassification;
  evidence?: EvidenceSource[];
  memory?: MemoryEntry[];
}

export interface EvaluationScenario {
  id: number;
  category: string;
  input: string;
  expectNoDiagnosis?: boolean;
  expectSafety?: boolean;
  expectQuestion?: boolean;
  expectEvidence?: boolean;
}
