import { BaseAIClient, type AIMessage, type AICompletionOptions, type AIResponse } from 'vs/platform/ai/common/aiClient';

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqRequest {
  messages: GroqMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string | string[];
  stream?: boolean;
}

export class GroqClient extends BaseAIClient {
  private static readonly API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly DEFAULT_MODEL = 'mixtral-8x7b-32768';
  private static readonly DEFAULT_MAX_TOKENS = 32768;
  
  private _model: string;
  
  constructor(apiKey?: string, model: string = GroqClient.DEFAULT_MODEL) {
    super(apiKey);
    this._model = model;
  }

  getModelName(): string {
    return `Groq ${this._model}`;
  }

  getTokenLimit(): number {
    // Groq's models have different token limits, default to 32K
    return GroqClient.DEFAULT_MAX_TOKENS;
  }

  async testConnection(): Promise<boolean> {
    if (!this._apiKey) {
      return false;
    }

    try {
      const response = await fetch(GroqClient.API_ENDPOINT, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this._model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'Failed to connect to Groq API');
      }

      return true;
    } catch (error) {
      console.error('Groq connection test failed:', error);
      return false;
    }
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AIResponse> {
    this.validateMessages(messages);

    if (!this._apiKey) {
      throw new Error('Groq API key is not set');
    }

    try {
      const response = await fetch(GroqClient.API_ENDPOINT, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.createRequest(messages, { ...options, stream: false }))
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'Failed to generate completion');
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('Groq completion error:', error);
      return this.createErrorResponse(error);
    }
  }

  async streamComplete(
    messages: AIMessage[],
    onData: (chunk: string) => void,
    options: AICompletionOptions = {}
  ): Promise<AIResponse> {
    this.validateMessages(messages);

    if (!this._apiKey) {
      throw new Error('Groq API key is not set');
    }

    try {
      const response = await fetch(GroqClient.API_ENDPOINT, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.createRequest(messages, { ...options, stream: true }))
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'Failed to stream completion');
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
        
        for (const line of lines) {
          if (line.trim() === 'data: [DONE]') {
            continue;
          }
          
          try {
            const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              onData(content);
            }
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
          }
        }
      }

      return {
        content: fullText,
        metadata: {
          model: this._model,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Groq stream error:', error);
      return this.createErrorResponse(error);
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this._apiKey}`
    };
  }

  private createRequest(
    messages: AIMessage[],
    options: AICompletionOptions & { stream?: boolean }
  ): GroqRequest {
    // Convert AIMessages to Groq format
    const groqMessages: GroqMessage[] = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));

    return {
      messages: groqMessages,
      model: this._model,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stopSequences,
      stream: options.stream
    };
  }

  private parseResponse(response: any): AIResponse {
    try {
      const message = response.choices?.[0]?.message;
      if (!message || !message.content) {
        throw new Error('Invalid response format from Groq API');
      }

      return {
        content: message.content,
        metadata: {
          model: this._model,
          timestamp: new Date().toISOString(),
          usage: response.usage
        }
      };
    } catch (error) {
      console.error('Failed to parse Groq response:', error);
      return this.createErrorResponse({
        code: 'invalid_response',
        message: 'Failed to parse Groq API response'
      });
    }
  }
}
