import { BaseAIClient, type AIMessage, type AICompletionOptions, type AIResponse } from 'vs/platform/ai/common/aiClient';
import { Emitter } from 'vs/base/common/event';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    stopSequences?: string[];
  };
}

export class GeminiClient extends BaseAIClient {
  private static readonly API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private static readonly STREAM_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent';
  
  private static readonly DEFAULT_MODEL = 'gemini-pro';
  private static readonly DEFAULT_MAX_TOKENS = 2048;
  
  private _model: string;
  
  constructor(apiKey?: string, model: string = GeminiClient.DEFAULT_MODEL) {
    super(apiKey);
    this._model = model;
  }

  getModelName(): string {
    return `Google ${this._model}`;
  }

  getTokenLimit(): number {
    // Gemini Pro has a 30,720 token limit
    return 30720;
  }

  async testConnection(): Promise<boolean> {
    if (!this._apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${GeminiClient.API_ENDPOINT}?key=${this._apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Hello' }]
          }],
          generationConfig: {
            maxOutputTokens: 5
          }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'Failed to connect to Gemini API');
      }

      return true;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AIResponse> {
    this.validateMessages(messages);

    if (!this._apiKey) {
      throw new Error('Gemini API key is not set');
    }

    try {
      const response = await fetch(`${GeminiClient.API_ENDPOINT}?key=${this._apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.createRequest(messages, options))
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'Failed to generate completion');
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('Gemini completion error:', error);
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
      throw new Error('Gemini API key is not set');
    }

    try {
      const response = await fetch(`${GeminiClient.STREAM_API_ENDPOINT}?alt=sse&key=${this._apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.createRequest(messages, options))
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
          try {
            const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const text = data.candidates[0].content.parts[0].text;
              fullText += text;
              onData(text);
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
      console.error('Gemini stream error:', error);
      return this.createErrorResponse(error);
    }
  }

  private createRequest(messages: AIMessage[], options: AICompletionOptions): GeminiRequest {
    const geminiMessages: GeminiMessage[] = [];
    
    // Convert AIMessages to Gemini format
    for (const msg of messages) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      geminiMessages.push({
        role,
        parts: [{ text: msg.content }]
      });
    }

    return {
      contents: geminiMessages,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? GeminiClient.DEFAULT_MAX_TOKENS,
        topP: options.topP,
        stopSequences: options.stopSequences
      }
    };
  }

  private parseResponse(response: any): AIResponse {
    try {
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return {
        content: text,
        metadata: {
          model: this._model,
          timestamp: new Date().toISOString(),
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount,
            completionTokens: response.usageMetadata?.candidatesTokenCount,
            totalTokens: response.usageMetadata?.totalTokenCount
          }
        }
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return this.createErrorResponse({
        code: 'invalid_response',
        message: 'Failed to parse Gemini API response'
      });
    }
  }
}
