import { Event, Emitter } from 'vs/base/common/event';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { ApiKeyService } from './supabase/supabaseClient';

export type AIModelType = 'gemini' | 'groq';

export interface AIModelConfig {
  id: AIModelType;
  name: string;
  description: string;
  apiKey: string | null;
  isConfigured: boolean;
}

export interface IAIService {
  readonly onDidChangeModelConfig: Event<void>;
  getAvailableModels(): AIModelConfig[];
  getActiveModel(): AIModelType;
  setActiveModel(model: AIModelType): Promise<void>;
  setApiKey(model: AIModelType, apiKey: string): Promise<void>;
  removeApiKey(model: AIModelType): Promise<void>;
  validateApiKey(model: AIModelType, apiKey: string): Promise<boolean>;
}

export class AIService implements IAIService {
  private _onDidChangeModelConfig = new Emitter<void>();
  readonly onDidChangeModelConfig: Event<void> = this._onDidChangeModelConfig.event;

  private activeModel: AIModelType = 'gemini';
  private userId: string;

  constructor(
    @IConfigurationService private readonly configurationService: IConfigurationService
  ) {
    this.userId = this.getUserId();
    this.initialize().catch(console.error);
  }

  private async initialize(): Promise<void> {
    // Load active model from configuration
    const config = this.configurationService.getValue<{ ai: { activeModel: AIModelType } }>('ascode');
    if (config?.ai?.activeModel) {
      this.activeModel = config.ai.activeModel;
    }
  }

  private getUserId(): string {
    // In a real implementation, this would get the current user's ID
    // For now, we'll use a placeholder
    return 'local-user';
  }

  getAvailableModels(): AIModelConfig[] {
    return [
      {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Google\'s advanced AI model',
        apiKey: null, // Will be loaded on demand
        isConfigured: false // Will be updated when checking configuration
      },
      {
        id: 'groq',
        name: 'Groq',
        description: 'High-performance AI inference',
        apiKey: null, // Will be loaded on demand
        isConfigured: false // Will be updated when checking configuration
      }
    ];
  }

  getActiveModel(): AIModelType {
    return this.activeModel;
  }

  async setActiveModel(model: AIModelType): Promise<void> {
    if (this.activeModel !== model) {
      this.activeModel = model;
      await this.configurationService.updateValue(
        'ascode.ai.activeModel',
        model,
        true // Global scope
      );
      this._onDidChangeModelConfig.fire();
    }
  }

  async setApiKey(model: AIModelType, apiKey: string): Promise<void> {
    if (!['gemini', 'groq'].includes(model)) {
      throw new Error(`Unsupported model: ${model}`);
    }

    // Validate the API key before saving
    const isValid = await this.validateApiKey(model, apiKey);
    if (!isValid) {
      throw new Error(`Invalid API key for ${model}`);
    }

    await ApiKeyService.saveApiKey(this.userId, model, apiKey);
    this._onDidChangeModelConfig.fire();
  }

  async removeApiKey(model: AIModelType): Promise<void> {
    await ApiKeyService.deleteApiKey(this.userId, model);
    this._onDidChangeModelConfig.fire();
  }

  async validateApiKey(model: AIModelType, apiKey: string): Promise<boolean> {
    try {
      // Basic validation for now - in a real app, you would make an actual API call
      if (model === 'gemini') {
        return apiKey.startsWith('AIza') && apiKey.length > 30;
      } else if (model === 'groq') {
        return apiKey.startsWith('gsk_') && apiKey.length > 30;
      }
      return false;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}

// Register the service
export const aiServiceDescriptor = {
  id: 'aiService',
  ctor: AIService,
  decorators: [
    { id: 'IConfigurationService' }
  ]
};
