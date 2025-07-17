import { Event } from 'vs/base/common/event';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  error?: {
    code: string;
    message: string;
  };
  metadata?: any;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface IAIClient {
  readonly onDidChangeStatus: Event<{ isAvailable: boolean }>;
  
  /**
   * Check if the client is properly configured and available
   */
  isAvailable(): boolean;

  /**
   * Get the display name of the AI model
   */
  getModelName(): string;

  /**
   * Get the maximum token limit for the model
   */
  getTokenLimit(): number;

  /**
   * Get the current API key (if available)
   */
  getApiKey(): string | undefined;

  /**
   * Set the API key for the client
   */
  setApiKey(apiKey: string): Promise<boolean>;

  /**
   * Test the API key and configuration
   */
  testConnection(): Promise<boolean>;

  /**
   * Generate a completion based on the conversation history
   */
  complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AIResponse>;

  /**
   * Stream a completion (for real-time responses)
   */
  streamComplete(
    messages: AIMessage[],
    onData: (chunk: string) => void,
    options?: AICompletionOptions
  ): Promise<AIResponse>;
}

export abstract class BaseAIClient implements IAIClient {
  protected _apiKey: string | undefined;
  protected _isAvailable: boolean = false;
  protected readonly _onDidChangeStatus = new Emitter<{ isAvailable: boolean }>();
  readonly onDidChangeStatus = this._onDidChangeStatus.event;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  abstract getModelName(): string;
  abstract getTokenLimit(): number;
  abstract testConnection(): Promise<boolean>;
  abstract complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AIResponse>;
  
  abstract streamComplete(
    messages: AIMessage[],
    onData: (chunk: string) => void,
    options?: AICompletionOptions
  ): Promise<AIResponse>;

  isAvailable(): boolean {
    return this._isAvailable && !!this._apiKey;
  }

  getApiKey(): string | undefined {
    return this._apiKey;
  }

  async setApiKey(apiKey: string): Promise<boolean> {
    const previousState = this._isAvailable;
    this._apiKey = apiKey;
    
    try {
      this._isAvailable = await this.testConnection();
      if (this._isAvailable !== previousState) {
        this._onDidChangeStatus.fire({ isAvailable: this._isAvailable });
      }
      return this._isAvailable;
    } catch (error) {
      this._isAvailable = false;
      if (previousState !== this._isAvailable) {
        this._onDidChangeStatus.fire({ isAvailable: false });
      }
      throw error;
    }
  }

  protected validateMessages(messages: AIMessage[]): void {
    if (!messages || messages.length === 0) {
      throw new Error('At least one message is required');
    }

    // Ensure messages alternate between user and assistant
    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];
      if (i > 0) {
        const previous = messages[i - 1];
        if (current.role === previous.role) {
          throw new Error(`Consecutive messages from the same role (${current.role}) are not allowed`);
        }
      }
    }
  }

  protected createErrorResponse(error: any): AIResponse {
    return {
      content: '',
      error: {
        code: error.code || 'unknown_error',
        message: error.message || 'An unknown error occurred'
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}
