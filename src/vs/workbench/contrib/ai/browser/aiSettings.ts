import { localize } from 'vs/nls';
import { Registry } from 'vs/platform/registry/common/platform';
import { Extensions as ConfigurationExtensions, IConfigurationNode, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { Disposable } from 'vs/base/common/lifecycle';
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions';
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle';

const configuration: IConfigurationNode = {
  id: 'ascode',
  title: localize('ai.configuration.title', 'ASCode AI Settings'),
  type: 'object',
  properties: {
    'ascode.ai.activeModel': {
      type: 'string',
      enum: ['gemini', 'groq'],
      default: 'gemini',
      description: localize('ai.configuration.activeModel', 'The active AI model to use for code assistance')
    },
    'ascode.ai.gemini': {
      type: 'object',
      default: {},
      description: localize('ai.configuration.gemini', 'Gemini AI settings'),
      properties: {
        apiKey: {
          type: 'string',
          description: localize('ai.configuration.gemini.apiKey', 'Your Gemini API key (stored securely)'),
          default: '',
          scope: 'application',
          sensitive: true
        },
        model: {
          type: 'string',
          description: localize('ai.configuration.gemini.model', 'Gemini model to use'),
          default: 'gemini-pro',
          enum: ['gemini-pro', 'gemini-1.5-pro-latest']
        },
        temperature: {
          type: 'number',
          description: localize('ai.configuration.gemini.temperature', 'Controls randomness (0.0 to 1.0)'),
          default: 0.7,
          minimum: 0,
          maximum: 1
        }
      }
    },
    'ascode.ai.groq': {
      type: 'object',
      default: {},
      description: localize('ai.configuration.groq', 'Groq AI settings'),
      properties: {
        apiKey: {
          type: 'string',
          description: localize('ai.configuration.groq.apiKey', 'Your Groq API key (stored securely)'),
          default: '',
          scope: 'application',
          sensitive: true
        },
        model: {
          type: 'string',
          description: localize('ai.configuration.groq.model', 'Groq model to use'),
          default: 'mixtral-8x7b-32768',
          enum: [
            'mixtral-8x7b-32768',
            'llama2-70b-4096',
            'llama3-70b-8192',
            'llama3-8b-8192'
          ]
        },
        temperature: {
          type: 'number',
          description: localize('ai.configuration.groq.temperature', 'Controls randomness (0.0 to 1.0)'),
          default: 0.7,
          minimum: 0,
          maximum: 1
        }
      }
    },
    'ascode.ai.supabase': {
      type: 'object',
      default: {},
      description: localize('ai.configuration.supabase', 'Supabase settings for secure storage'),
      properties: {
        enabled: {
          type: 'boolean',
          description: localize('ai.configuration.supabase.enabled', 'Enable Supabase for secure API key storage'),
          default: true
        },
        url: {
          type: 'string',
          description: localize('ai.configuration.supabase.url', 'Supabase project URL'),
          default: ''
        },
        anonKey: {
          type: 'string',
          description: localize('ai.configuration.supabase.anonKey', 'Supabase anonymous/public key'),
          default: ''
        }
      }
    },
    'ascode.ai.completions': {
      type: 'object',
      default: {},
      description: localize('ai.configuration.completions', 'Code completion settings'),
      properties: {
        enabled: {
          type: 'boolean',
          description: localize('ai.configuration.completions.enabled', 'Enable AI-powered code completions'),
          default: true
        },
        maxSuggestions: {
          type: 'number',
          description: localize('ai.configuration.completions.maxSuggestions', 'Maximum number of suggestions to show'),
          default: 5,
          minimum: 1,
          maximum: 10
        },
        debounce: {
          type: 'number',
          description: localize('ai.configuration.completions.debounce', 'Debounce time in milliseconds'),
          default: 300,
          minimum: 100,
          maximum: 2000
        }
      }
    }
  }
};

class AIConfigurationContribution extends Disposable implements IWorkbenchContribution {
  constructor(
    @IConfigurationService private readonly configurationService: IConfigurationService
  ) {
    super();
    this.registerConfiguration();
  }

  private registerConfiguration(): void {
    const registry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);
    registry.registerConfiguration(configuration);
  }
}

// Register the configuration contribution
const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchRegistry.registerWorkbenchContribution(
  AIConfigurationContribution,
  LifecyclePhase.Ready
);
