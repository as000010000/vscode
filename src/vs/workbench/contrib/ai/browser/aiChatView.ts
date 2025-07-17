import { Disposable } from 'vs/base/common/lifecycle';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IViewletViewOptions } from 'vs/workbench/browser/parts/views/viewsViewlet';
import { IViewDescriptorService } from 'vs/workbench/common/views';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IViewPaneOptions, ViewPane } from 'vs/workbench/browser/parts/views/viewPane';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { IWebviewService, WebviewOverlay } from 'vs/workbench/contrib/webview/browser/webview';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService';
import { CancellationTokenSource } from 'vs/base/common/cancellation';
import { IFileService } from 'vs/platform/files/common/files';
import { URI } from 'vs/base/common/uri';
import { localize } from 'vs/nls';
import { IProgressService, ProgressLocation } from 'vs/platform/progress/common/progress';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { ILogService } from 'vs/platform/log/common/log';
import { IMarkdownString, MarkdownString } from 'vs/base/common/htmlContent';
import { IMarkdownRenderResult, MarkdownRenderer } from 'vs/editor/browser/core/markdownRenderer';
import { IModeService } from 'vs/editor/common/services/modeService';
import { IOpenerService as IBaseOpenerService } from 'vs/editor/browser/editorBrowser';
import { IModelService } from 'vs/editor/common/services/modelService';
import { ITextModelService } from 'vs/editor/common/services/resolverService';
import { IAccessibilityService } from 'vs/platform/accessibility/common/accessibility';
import { IListVirtualDelegate, IListRenderer, IListContextMenuEvent } from 'vs/base/browser/ui/list/list';
import { IListOptions, List } from 'vs/base/browser/ui/list/listWidget';
import { IAsyncDataSource, ITreeRenderer, ITreeNode } from 'vs/base/browser/ui/tree/tree';
import { IAsyncDataTreeOptions, AsyncDataTree } from 'vs/base/browser/ui/tree/asyncDataTree';
import { IEditorOptions } from 'vs/editor/common/config/editorOptions';
import { IEditorWorkerService } from 'vs/editor/common/services/editorWorkerService';
import { IMenuService, MenuId } from 'vs/platform/actions/common/actions';
import { IAction, Action } from 'vs/base/common/actions';
import { createAndFillInContextMenuActions } from 'vs/platform/actions/browser/menuEntryActionViewItem';
import { ICodeEditor } from 'vs/editor/browser/editorBrowser';
import { MenuItemAction } from 'vs/platform/actions/common/actions';
import { IMenu, IMenuService } from 'vs/platform/actions/common/actions';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { CancellationToken } from 'vs/base/common/cancellation';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles';
import { IHostService } from 'vs/workbench/services/host/browser/host';
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService';
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService';
import { IProductService } from 'vs/platform/product/common/productService';
import { IExtensionManagementService } from 'vs/platform/extensionManagement/common/extensionManagement';
import { IExtensionGalleryService } from 'vs/platform/extensionManagement/common/extensionManagement';
import { IExtensionEnablementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement';
import { IExtensionService as IWorkbenchExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { IExtensionRecommendationsService } from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations';
import { IExtensionTipsService } from 'vs/platform/extensionManagement/common/extensionTips';
import { IExtensionManagementServerService } from 'vs/workbench/services/extensionManagement/common/extensionManagement';
import { IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService';
import { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations';
import { IExtensionBisectService } from 'vs/workbench/services/extensionManagement/common/extensionBisect';
import { IExtensionStorageService } from 'vs/platform/extensionManagement/common/extensionStorage';
import { IExtensionManifest } from 'vs/platform/extensions/common/extensions';
import { IExtensionService, IExtensionDescription } from 'vs/workbench/services/extensions/common/extensions';
import { IExtensionHostProfile } from 'vs/workbench/services/extensions/common/extensionHostProfile';
import { IExtensionHostProfileService } from 'vs/workbench/contrib/extensions/electron-sandbox/runtimeExtensionsEditor';
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug';
import { IRemoteConsoleLog } from 'vs/base/common/console';
import { IExtensionHostProfileService as IExtensionHostProfileServiceCommon } from 'vs/workbench/services/extensions/common/extensionHostProfile';
import { IExtensionHostProfileService as IExtensionHostProfileServiceWorkbench } from 'vs/workbench/contrib/extensions/common/extensions';
import { IExtensionHostProfileService as IExtensionHostProfileServiceElectron } from 'vs/workbench/contrib/extensions/electron-sandbox/runtimeExtensionsEditor';
import { IExtensionHostProfileService as IExtensionHostProfileServiceWeb } from 'vs/workbench/contrib/extensions/browser/runtimeExtensionsEditor';
import { IExtensionHostProfileService as IExtensionHostProfileServiceBase } from 'vs/workbench/services/extensions/common/extensionHostProfile';
import { IExtensionHostProfileService as IExtensionHostProfileServiceWorkbenchBase } from 'vs/workbench/contrib/extensions/common/extensions';
import { IExtensionHostProfileService as IExtensionHostProfileServiceElectronBase } from 'vs/workbench/contrib/extensions/electron-sandbox/runtimeExtensionsEditor';
import { IExtensionHostProfileService as IExtensionHostProfileServiceWebBase } from 'vs/workbench/contrib/extensions/browser/runtimeExtensionsEditor';
import { IExtensionHostProfileService as IExtensionHostProfileServiceCommonBase } from 'vs/workbench/services/extensions/common/extensionHostProfile';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export class AIChatView extends ViewPane {
  static readonly ID = 'workbench.view.ai.chat';
  static readonly TITLE = localize('ai.chat.title', 'AI Chat');
  
  private messages: ChatMessage[] = [];
  private messageList!: List<ChatMessage>;
  private inputBox!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private webview: WebviewOverlay | undefined;
  private currentRequest: CancellationTokenSource | undefined;
  
  constructor(
    options: IViewletViewOptions,
    @IInstantiationService instantiationService: IInstantiationService,
    @IViewDescriptorService viewDescriptorService: IViewDescriptorService,
    @IContextMenuService contextMenuService: IContextMenuService,
    @IConfigurationService configurationService: IConfigurationService,
    @IContextKeyService contextKeyService: IContextKeyService,
    @IKeybindingService keybindingService: IKeybindingService,
    @IOpenerService openerService: IOpenerService,
    @IThemeService themeService: IThemeService,
    @ITelemetryService telemetryService: ITelemetryService,
    @IWorkspaceContextService contextService: IWorkspaceContextService,
    @IStorageService storageService: IStorageService,
    @IExtensionService extensionService: IExtensionService,
    @IWebviewService private readonly webviewService: IWebviewService,
    @IEditorService private readonly editorService: IEditorService,
    @IEditorGroupsService private readonly editorGroupService: IEditorGroupsService,
    @IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
    @IFileService private readonly fileService: IFileService,
    @IProgressService private readonly progressService: IProgressService,
    @INotificationService private readonly notificationService: INotificationService,
    @ILogService private readonly logService: ILogService,
    @IModeService private readonly modeService: IModeService,
    @IModelService private readonly modelService: IModelService,
    @ITextModelService private readonly textModelService: ITextModelService,
    @IEditorWorkerService private readonly editorWorkerService: IEditorWorkerService,
    @IMenuService private readonly menuService: IMenuService,
    @ICommandService private readonly commandService: ICommandService,
    @ITextFileService private readonly textFileService: ITextFileService,
    @IHostService private readonly hostService: IHostService,
    @IWorkbenchEnvironmentService private readonly environmentService: IWorkbenchEnvironmentService,
    @IRemoteAgentService private readonly remoteAgentService: IRemoteAgentService,
    @IProductService private readonly productService: IProductService,
    @IExtensionManagementService private readonly extensionManagementService: IExtensionManagementService,
    @IExtensionGalleryService private readonly extensionGalleryService: IExtensionGalleryService,
    @IExtensionEnablementService private readonly extensionEnablementService: IExtensionEnablementService,
    @IWorkbenchExtensionService private readonly workbenchExtensionService: IWorkbenchExtensionService,
    @IExtensionRecommendationsService private readonly extensionRecommendationsService: IExtensionRecommendationsService,
    @IExtensionTipsService private readonly extensionTipsService: IExtensionTipsService,
    @IExtensionManagementServerService private readonly extensionManagementServerService: IExtensionManagementServerService,
    @IExtensionManifestPropertiesService private readonly extensionManifestPropertiesService: IExtensionManifestPropertiesService,
    @IExtensionRecommendationNotificationService private readonly extensionRecommendationNotificationService: IExtensionRecommendationNotificationService,
    @IExtensionBisectService private readonly extensionBisectService: IExtensionBisectService,
    @IExtensionStorageService private readonly extensionStorageService: IExtensionStorageService,
    @IExtensionHostProfileServiceCommon private readonly extensionHostProfileService: IExtensionHostProfileServiceCommon,
    @IExtensionHostDebugService private readonly extensionHostDebugService: IExtensionHostDebugService
  ) {
    super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, contextService, storageService);
  }

  protected renderBody(container: HTMLElement): void {
    super.renderBody(container);
    
    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'ai-chat-container';
    container.appendChild(chatContainer);
    
    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'ai-chat-messages';
    chatContainer.appendChild(messagesContainer);
    
    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'ai-chat-input-container';
    chatContainer.appendChild(inputContainer);
    
    // Create input box
    this.inputBox = document.createElement('textarea');
    this.inputBox.className = 'ai-chat-input';
    this.inputBox.placeholder = localize('ai.chat.placeholder', 'Type a message...');
    this.inputBox.rows = 1;
    this.inputBox.addEventListener('keydown', (e) => this.onInputKeyDown(e));
    this.inputBox.addEventListener('input', () => this.adjustInputHeight());
    inputContainer.appendChild(this.inputBox);
    
    // Create send button
    this.sendButton = document.createElement('button');
    this.sendButton.className = 'ai-chat-send-button';
    this.sendButton.textContent = localize('ai.chat.send', 'Send');
    this.sendButton.addEventListener('click', () => this.sendMessage());
    inputContainer.appendChild(this.sendButton);
    
    // Initialize message list
    this.messageList = new List<ChatMessage>('AIChatMessages', messagesContainer, {
      keyboardSupport: true,
      mouseSupport: true,
      multipleSelectionSupport: false,
      accessibilityProvider: {
        getAriaLabel: (element: ChatMessage) => {
          return `${element.role === 'user' ? 'You' : 'AI'}: ${element.content}`;
        },
        getRole: () => 'listbox',
        getWidgetAriaLabel: () => localize('ai.chat.ariaLabel', 'AI Chat Messages'),
        getWidgetRole: () => 'region'
      }
    } as IListOptions<ChatMessage>);
    
    // Set up message list renderer
    this.messageList.onContextMenu(this.onContextMenu, this);
    
    // Load any saved messages
    this.loadMessages();
  }
  
  private onContextMenu(e: IListContextMenuEvent<ChatMessage>): void {
    if (!e.element) {
      return;
    }
    
    const menu = this.menuService.createMenu(MenuId.ChatMessageContext, this.contextKeyService);
    const actions: IAction[] = [];
    const context = { message: e.element };
    
    createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, actions, this.contextMenuService, g => /^inline/.test(g));
    
    this.contextMenuService.showContextMenu({
      getAnchor: () => e.anchor,
      getActions: () => actions,
      getActionsContext: () => context,
      onHide: () => menu.dispose()
    });
  }
  
  private onInputKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }
  
  private adjustInputHeight(): void {
    this.inputBox.style.height = 'auto';
    this.inputBox.style.height = `${Math.min(this.inputBox.scrollHeight, 200)}px`;
  }
  
  private async sendMessage(): Promise<void> {
    const message = this.inputBox.value.trim();
    if (!message) {
      return;
    }
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    this.addMessage(userMessage);
    this.inputBox.value = '';
    this.adjustInputHeight();
    
    // Create a placeholder for the AI response
    const responseId = `response-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: responseId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };
    
    this.addMessage(assistantMessage);
    
    // Cancel any existing request
    if (this.currentRequest) {
      this.currentRequest.cancel();
      this.currentRequest.dispose();
    }
    
    const cancellationToken = new CancellationTokenSource();
    this.currentRequest = cancellationToken;
    
    try {
      await this.progressService.withProgress(
        {
          location: ProgressLocation.Notification,
          title: localize('ai.chat.generating', 'Generating response...'),
          cancellable: true
        },
        async (progress, token) => {
          // TODO: Integrate with AI service to get the response
          // For now, we'll just simulate a response
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (token.isCancellationRequested) {
            return;
          }
          
          // Update the message with the response
          const response = "This is a simulated response from the AI. In a real implementation, this would come from the AI service.";
          this.updateMessage(responseId, response);
        },
        () => {
          cancellationToken.cancel();
        }
      );
    } catch (error) {
      if (!cancellationToken.token.isCancellationRequested) {
        this.notificationService.error(localize('ai.chat.error', 'Failed to generate response: {0}', error.message));
      }
    } finally {
      cancellationToken.dispose();
      this.currentRequest = undefined;
    }
  }
  
  private addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.messageList.splice(this.messages.length - 1, 0, [message]);
    this.saveMessages();
    this.scrollToBottom();
  }
  
  private updateMessage(id: string, content: string): void {
    const message = this.messages.find(m => m.id === id);
    if (message) {
      message.content = content;
      message.isStreaming = false;
      this.messageList.splice(this.messages.indexOf(message), 1, [message]);
      this.saveMessages();
      this.scrollToBottom();
    }
  }
  
  private scrollToBottom(): void {
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }
  
  private saveMessages(): void {
    // TODO: Save messages to storage
    // For now, we'll just log them
    console.log('Saved messages:', this.messages);
  }
  
  private loadMessages(): void {
    // TODO: Load messages from storage
    // For now, we'll just show a welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'system',
      content: localize('ai.chat.welcome', 'Welcome to ASCode AI Chat! How can I help you today?'),
      timestamp: Date.now()
    };
    
    this.addMessage(welcomeMessage);
  }
  
  protected layoutBody(height: number, width: number): void {
    super.layoutBody(height, width);
    
    if (this.messageList) {
      const inputHeight = this.inputBox.offsetHeight + 20; // Add some padding
      this.messageList.layout(height - inputHeight, width);
    }
  }
  
  dispose(): void {
    if (this.currentRequest) {
      this.currentRequest.dispose();
      this.currentRequest = undefined;
    }
    
    super.dispose();
  }
}
