export enum GenerationMode {
  Prompt = 'Prompt',
  Image = 'Image',
  Code = 'Code',
}

export interface ApiKeyMissingError {
  isApiKeyMissing: boolean;
  message: string;
}

export interface GenerationResult {
  html: string;
  timestamp: number; // To help trigger iframe updates
}
