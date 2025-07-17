import { Event, Emitter } from 'vs/base/common/event';
import { Disposable } from 'vs/base/common/lifecycle';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IStorageService, StorageScope, StorageTarget } from 'vs/platform/storage/common/storage';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { GeminiClient } from 'vs/platform/ai/common/geminiClient';
import { GroqClient } from 'vs/platform/ai/common/groqClient';
import { IAIClient, AIMessage, AICompletionOptions, AIResponse } from 'vs/platform/ai/common/aiClient';

export const IAIService = createDecorator<IAIService>('aiService');

export interface IAIService {
  readonly _serviceBrand: undefined;
  
  /**
   * The currently active AI client
   */
  readonly activeClient: IAIClient | undefined;
  
  /**
   * Event fired when the active client changes
   */
  readonly onDidChangeActiveClient: Event<void>;
  
  /**
   * Get the active AI client
   */
  getActiveClient(): Promise<IAIClient | undefined>;
  
  /**
   * Set the active AI model
   */
  setActiveModel(model: 'gemini' | 'groq'): Promise<void>;
  
  /**
   * Get the active AI model
   */
  getActiveModel(): 'gemini' | 'groq';
  
  /**
   * Get the Gemini client
   */
  getGeminiClient(): Promise<IAIClient>;
  
  /**
   * Get the Groq client
   */
  getGroqClient(): Promise<IAIClient>;
  
  /**
   * Generate a completion using the active AI model
   */
  complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AIResponse>;
  
  /**
   * Stream a completion using the active AI model
   */
  streamComplete(
    messages: AIMessage[],
    onData: (chunk: string) => void,
    options?: AICompletionOptions
  ): Promise<AIResponse>;
  
  /**
   * Test the connection to the specified AI provider
   */
  testConnection(provider: 'gemini' | 'groq', apiKey: string): Promise<boolean>;
}

export class AIService extends Disposable implements IAIService {
  declare readonly _serviceBrand: undefined;
  
  private _activeClient: IAIClient | undefined;
  private _geminiClient: GeminiClient | undefined;
  private _groqClient: GroqClient | undefined;
  
  private readonly _onDidChangeActiveClient = this._register(new Emitter<void>());
  readonly onDidChangeActiveClient = this._onDidChangeActiveClient.event;
  
  constructor(
    @IConfigurationService private readonly configurationService: IConfigurationService,
    @IStorageService private readonly storageService: IStorageService
  ) {
    super();
    
    // Initialize the active client when the configuration changes
    this._register(this.configurationService.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('ascode.ai')) {
        this.initializeActiveClient();
      }
    }));
    
    // Initialize the active client
    this.initializeActiveClient();
  }
  
  get activeClient(): IAIClient | undefined {
    return this._activeClient;
  }
  
  async getActiveClient(): Promise<IAIClient | undefined> {
    if (!this._activeClient) {
      await this.initializeActiveClient();
    }
    return this._activeClient;
  }
  
  getActiveModel(): 'gemini' | 'groq' {
    return this.configurationService.getValue<'gemini' | 'groq'>('ascode.ai.activeModel') || 'gemini';
  }
  
  async setActiveModel(model: 'gemini' | 'groq'): Promise<void> {
    await this.configurationService.updateValue('ascode.ai.activeModel', model);
    await this.initializeActiveClient();
  }
  
  async getGeminiClient(): Promise<IAIClient> {
    if (!this._geminiClient) {
      const config = this.configurationService.getValue('ascode.ai.gemini');
      this._geminiClient = new GeminiClient(
        config.apiKey,
        config.model || 'gemini-pro'
      );
      
      if (config.apiKey) {
        await this._geminiClient.setApiKey(config.apiKey);
      }
    }
    return this._geminiClient;
  }
  
  async getGroqClient(): Promise<IAIClient> {
    if (!this._groqClient) {
      const config = this.configurationService.getValue('ascode.ai.groq');
      this._groqClient = new GroqClient(
        config.apiKey,
        config.model || 'mixtral-8x7b-32768'
      );
      
      if (config.apiKey) {
        await this._groqClient.setApiKey(config.apiKey);
      }
    }
    return this._groqClient;
  }
  
  async complete(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<AIResponse> {
    const client = await this.getActiveClient();
    if (!client) {
      throw new Error('No active AI client available');
    }
    
    // Apply any model-specific options from configuration
    const model = this.getActiveModel();
    const modelConfig = this.configurationService.getValue(`ascode.ai.${model}`);
    
    const completionOptions: AICompletionOptions = {
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      ...options
    };
    
    return client.complete(messages, completionOptions);
  }
  
  async streamComplete(
    messages: AIMessage[],
    onData: (chunk: string) => void,
    options: AICompletionOptions = {}
  ): Promise<AIResponse> {
    const client = await this.getActiveClient();
    if (!client) {
      throw new Error('No active AI client available');
    }
    
    // Apply any model-specific options from configuration
    const model = this.getActiveModel();
    const modelConfig = this.configurationService.getValue(`ascode.ai.${model}`);
    
    const completionOptions: AICompletionOptions = {
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      ...options
    };
    
    return client.streamComplete(messages, onData, completionOptions);
  }
  
  async testConnection(provider: 'gemini' | 'groq', apiKey: string): Promise<boolean> {
    try {
      let client: IAIClient;
      
      if (provider === 'gemini') {
        client = new GeminiClient(apiKey);
      } else {
        client = new GroqClient(apiKey);
      }
      
      return await client.testConnection();
    } catch (error) {
      console.error(`Failed to test ${provider} connection:`, error);
      return false;
    }
  }
  
  private async initializeActiveClient(): Promise<void> {
    const activeModel = this.getActiveModel();
    let newClient: IAIClient | undefined;
    
    try {
      if (activeModel === 'gemini') {
        newClient = await this.getGeminiClient();
      } else if (activeModel === 'groq') {
        newClient = await this.getGroqClient();
      }
      
      // Only update if the client has changed
      if (newClient !== this._activeClient) {
        this._activeClient = newClient;
        this._onDidChangeActiveClient.fire();
      }
    } catch (error) {
      console.error('Failed to initialize AI client:', error);
      this._activeClient = undefined;
      this._onDidChangeActiveClient.fire();
    }
  }
  
  private getStorageKey(provider: 'gemini' | 'groq'): string {
    return `ascode.ai.${provider}.apiKey`;
  }
  
  private async getSecureApiKey(provider: 'gemini' | 'groq'): Promise<string | undefined> {
    // First try to get from configuration (in-memory)
    const config = this.configurationService.getValue(`ascode.ai.${provider}`);
    if (config?.apiKey) {
      return config.apiKey;
    }
    
    // Then try to get from secure storage
    const key = this.getStorageKey(provider);
    return this.storageService.get(key, StorageScope.APPLICATION);
  }
  
  private async setSecureApiKey(provider: 'gemini' | 'groq', apiKey: string): Promise<void> {
    const key = this.getStorageKey(provider);
    await this.storageService.store(key, apiKey, StorageScope.APPLICATION, StorageTarget.MACHINE);
    
    // Also update the in-memory configuration
    await this.configurationService.updateValue(
      `ascode.ai.${provider}.apiKey`,
      apiKey
    );
  }
  
  private async clearSecureApiKey(provider: 'gemini' | 'groq'): Promise<void> {
    const key = this.getStorageKey(provider);
    await this.storageService.remove(key, StorageScope.APPLICATION);
    
    // Also clear from in-memory configuration
    await this.configurationService.updateValue(
      `ascode.ai.${provider}.apiKey`,
      undefined
    );
  }
}
