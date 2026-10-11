export interface SourceExcerpt {
  chunk_id: string;
  document_id: string;
  title: string;
  guest?: string;
  post_url?: string;
  doc_type: string;
  speaker: string;
  timestamp: string;
  excerpt: string;
  full_content?: string;
  score: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceExcerpt[];
  model_provider?: string;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface KnowledgeStats {
  total_documents: number;
  total_chunks: number;
}

export interface ModelProviderInfo {
  status: string;
  base_url?: string;
  configured_model?: string;
  available_models?: string[];
  model?: string;
}

export interface ModelsConfig {
  default_provider: string;
  ollama: ModelProviderInfo;
  anthropic: ModelProviderInfo;
  openai: ModelProviderInfo;
}

export interface Artifact {
  id: string;
  session_id?: string;
  title: string;
  content_type: 'markdown' | 'html' | 'essay';
  content: string;
  created_at: string;
}
