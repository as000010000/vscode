import { localize } from 'vs/nls';

export const aiConfigurationSchemaId = 'ascode.ai';

export const aiConfigurationSchema = {
  id: aiConfigurationSchemaId,
  title: localize('aiConfiguration', 'AI Configuration'),
  type: 'object',
  properties: {
    'ai.activeModel': {
      type: 'string',
      enum: ['gemini', 'groq'],
      default: 'gemini',
      description: localize('ai.activeModel', 'The active AI model to use for code assistance')
    },
    'ai.gemini.apiKey': {
      type: 'string',
      default: '',
      description: localize('ai.gemini.apiKey', 'API key for Google Gemini')
    },
    'ai.groq.apiKey': {
      type: 'string',
      default: '',
      description: localize('ai.groq.apiKey', 'API key for Groq')
    },
    'ai.useSecureStorage': {
      type: 'boolean',
      default: true,
      description: localize('ai.useSecureStorage', 'Store API keys securely using Supabase')
    },
    'ai.supabaseUrl': {
      type: 'string',
      default: '',
      description: localize('ai.supabaseUrl', 'Supabase project URL (required for secure storage)')
    },
    'ai.supabaseAnonKey': {
      type: 'string',
      default: '',
      description: localize('ai.supabaseAnonKey', 'Supabase anonymous/public key (required for secure storage)')
    }
  }
};

export interface AIConfiguration {
  ai: {
    activeModel: 'gemini' | 'groq';
    gemini: {
      apiKey: string;
    };
    groq: {
      apiKey: string;
    };
    useSecureStorage: boolean;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  };
}
