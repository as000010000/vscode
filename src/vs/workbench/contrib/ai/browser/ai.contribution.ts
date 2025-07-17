// Import VS Code API modules
import { Disposable } from 'vs/base/common/lifecycle';
import { Registry } from 'vs/platform/registry/common/platform';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IStorageService, StorageScope, StorageTarget } from 'vs/platform/storage/common/storage';
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService';
import { IViewDescriptorService, IViewsRegistry, Extensions as ViewExtensions } from 'vs/workbench/common/views';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { ILogService } from 'vs/platform/log/common/log';
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService';
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService';
import { IProductService } from 'vs/platform/product/common/productService';
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { IFileService } from 'vs/platform/files/common/files';
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles';
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { IHostService } from 'vs/workbench/services/host/browser/host';
import { IRemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService';
import { IRemoteAgentEnvironment } from 'vs/platform/remote/common/remoteAgentEnvironment';
import { IRemoteAuthorityResolverService } from 'vs/platform/remote/common/remoteAuthorityResolver';
import { IRemoteConnectionData } from 'vs/platform/remote/common/remoteAuthorityResolver';
import { IRemoteConsoleLog, parse, getFirstFrame } from 'vs/base/common/console';
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';

// Import workbench contributions
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions';
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle';
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar';

// Import AI components
import { IAIService } from 'vs/platform/ai/common/aiProviderService';
import { AIService } from 'vs/platform/ai/common/aiProviderService';
import { registerAIActions } from 'vs/workbench/contrib/ai/browser/aiCommands';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry';
import { AIChatView } from 'vs/workbench/contrib/ai/browser/aiChatView';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'vs/workbench/common/actions';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';
import { CATEGORIES } from 'vs/workbench/common/actions';
import { localize } from 'vs/nls';
import { IEditorGroupsService as IEditorGroupsServiceCommon } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IEditorService as IEditorServiceCommon } from 'vs/workbench/services/editor/common/editorService';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { IPanelService } from 'vs/workbench/services/panel/common/panelService';
import { ViewContainerLocation, IViewContainersRegistry, Extensions as ViewContainerExtensions, ViewContainer } from 'vs/workbench/common/views';
import { IEditorGroupsService as IEditorGroupsServiceWorkbench } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IEditorService as IEditorServiceWorkbench } from 'vs/workbench/services/editor/common/editorService';
import { IEditorGroupsService as IEditorGroupsServiceEditor } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IEditorService as IEditorServiceEditor } from 'vs/workbench/services/editor/common/editorService';

// Register the AI service
registerSingleton(IAIService, AIService, true);

// Register the AI chat view container
const AI_CHAT_VIEW_CONTAINER = 'workbench.view.ai.chat';
const container = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry).registerViewContainer(
  {
    id: AI_CHAT_VIEW_CONTAINER,
    title: localize('ai.chat.title', 'AI Chat'),
    icon: '$(comment-discussion)',
    order: 100,
    ctorDescriptor: { ctor: AIChatView },
    storageId: 'workbench.view.ai.chat',
    hideIfEmpty: true
  },
  ViewContainerLocation.Panel
);

// Register the chat view
Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews(
  [
    {
      id: 'ai.chat',
      name: localize('ai.chat.view', 'AI Chat'),
      ctorDescriptor: { ctor: AIChatView },
      canToggleVisibility: true,
      canMoveView: true,
      containerIcon: '$(comment-discussion)',
      weight: 100,
      order: 1,
      when: undefined,
    }
  ],
  container
);

class AIContribution extends Disposable implements IWorkbenchContribution {
  constructor(
    @IStatusbarService private readonly statusbarService: IStatusbarService,
    @IAIService private readonly aiService: IAIService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IViewletService private readonly viewletService: IViewletService,
    @IPanelService private readonly panelService: IPanelService,
    @IEditorService private readonly editorService: IEditorService,
    @IEditorGroupsService private readonly editorGroupService: IEditorGroupsService,
    @ICommandService private readonly commandService: ICommandService
  ) {
    super();
    
    // Register AI commands
    registerAIActions();
    
    // Register additional commands
    this.registerCommands();
    
    // Initialize the AI service
    this.initializeAIService();
  }
  
  private registerCommands(): void {
    // Register command to open AI chat
    this._register(this.commandService.addCommand({
      id: 'ascode.openAIChat',
      handler: () => this.openAIChat()
    }));
    
    // Register keybinding for opening AI chat (Ctrl+Shift+P then type "AI Chat")
    const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
    registry.registerWorkbenchAction(
      new SyncActionDescriptor(
        class extends Action {
          constructor() {
            super('ascode.openAIChat', localize('ai.chat.open', 'Open AI Chat'), 'ascode.openAIChat');
          }
          
          async run(): Promise<void> {
            // The actual implementation is in the AIContribution class
          }
        },
        'ascode.openAIChat',
        localize('ai.chat.open', 'Open AI Chat'),
        {
          primary: 0,
          mac: {
            primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP,
            secondary: [KeyMod.CtrlCmd | KeyCode.KeyP]
          },
          linux: {
            primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP,
            secondary: [KeyMod.CtrlCmd | KeyCode.KeyP]
          },
          win: {
            primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP,
            secondary: [KeyMod.CtrlCmd | KeyCode.KeyP]
          }
        }
      ),
      'AI: Open Chat',
      CATEGORIES.Developer.value
    );
  }
  
  private async openAIChat(): Promise<void> {
    // Focus the AI chat panel if it's already open
    const panel = this.panelService.getActivePanel();
    if (panel && panel.getId() === 'workbench.view.ai.chat') {
      return;
    }
    
    // Otherwise, open the AI chat panel
    await this.panelService.openPanel(AI_CHAT_VIEW_CONTAINER, true);
  }
  
  private async initializeAIService(): Promise<void> {
    try {
      // Ensure the active client is initialized
      await this.aiService.getActiveClient();
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }
}

// Register the contribution
const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchRegistry.registerWorkbenchContribution(
  AIContribution,
  LifecyclePhase.Ready // Wait until the workbench is ready
);

// Register configuration
const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);

configurationRegistry.registerConfiguration({
  id: 'ascode',
  title: 'ASCode AI',
  type: 'object',
  properties: {
    'ascode.ai.activeModel': {
      type: 'string',
      enum: ['gemini', 'groq'],
      default: 'gemini',
      description: 'The active AI model to use for code assistance'
    },
    'ascode.ai.gemini': {
      type: 'object',
      default: {},
      description: 'Gemini AI settings',
      properties: {
        apiKey: {
          type: 'string',
          description: 'Your Gemini API key (stored securely)',
          default: '',
          scope: 'application',
          sensitive: true
        },
        model: {
          type: 'string',
          description: 'Gemini model to use',
          default: 'gemini-pro',
          enum: ['gemini-pro', 'gemini-1.5-pro-latest']
        },
        temperature: {
          type: 'number',
          description: 'Controls randomness (0.0 to 1.0)',
          default: 0.7,
          minimum: 0,
          maximum: 1
        },
        maxTokens: {
          type: 'number',
          description: 'Maximum number of tokens to generate',
          default: 2048,
          minimum: 1,
          maximum: 8192
        }
      }
    },
    'ascode.ai.groq': {
      type: 'object',
      default: {},
      description: 'Groq AI settings',
      properties: {
        apiKey: {
          type: 'string',
          description: 'Your Groq API key (stored securely)',
          default: '',
          scope: 'application',
          sensitive: true
        },
        model: {
          type: 'string',
          description: 'Groq model to use',
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
          description: 'Controls randomness (0.0 to 1.0)',
          default: 0.7,
          minimum: 0,
          maximum: 1
        },
        maxTokens: {
          type: 'number',
          description: 'Maximum number of tokens to generate',
          default: 2048,
          minimum: 1,
          maximum: 8192
        }
      }
    },
    'ascode.ai.supabase': {
      type: 'object',
      default: { enabled: false },
      description: 'Supabase configuration for secure storage',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Enable Supabase for secure API key storage',
          default: false
        },
        url: {
          type: 'string',
          description: 'Supabase project URL',
          default: ''
        },
        anonKey: {
          type: 'string',
          description: 'Supabase anonymous/public key',
          default: ''
        }
      }
    }
  }
});
