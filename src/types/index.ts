export interface Message {
  type: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

export interface CodeHistory {
  id: string;
  code: GeneratedCode;
  message: string;
  timestamp: Date;
}

export interface AppState {
  messages: Message[];
  generatedCode: GeneratedCode;
  isLoading: boolean;
  error: string | null;
  codeHistory: CodeHistory[];
  currentHistoryIndex: number;
}

export interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error: string | null;
}

export interface CodePanelProps {
  code: GeneratedCode;
  onCodeChange: (code: GeneratedCode) => void;
  onCodeHistory?: (direction: 'prev' | 'next') => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onValidate?: () => void;
}

export interface ApiResponse {
  success: boolean;
  code?: GeneratedCode;
  explanation?: string;
  error?: string;
  rawResponse?: string;
}

export interface OllamaConfig {
  url: string;
  model: string;
  running: boolean;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  ollama: OllamaConfig;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CodeValidationResult {
  html: ValidationResult;
  css: ValidationResult;
  js: ValidationResult;
}
