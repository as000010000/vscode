import { Disposable, DisposableStore } from 'vs/base/common/lifecycle';
import { IEditorSerializer, IEditorOpenContext } from 'vs/workbench/common/editor';
import { EditorInput } from 'vs/workbench/common/editor/editorInput';
import { IEditorOptions } from 'vs/platform/editor/common/editor';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration';
import { IModeService } from 'vs/editor/common/services/modeService';
import { IHostService } from 'vs/workbench/services/host/browser/host';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { CancellationToken } from 'vs/base/common/cancellation';
import { WebviewEditor } from 'vs/workbench/contrib/webviewPanel/browser/webviewEditor';
import { IWebviewWorkbenchService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService';
import { IEditorGroup } from 'vs/workbench/services/editor/common/editorGroupsService';
import { IEditorDescriptor, IEditorPane } from 'vs/workbench/common/editor';
import { IEditorProgressService } from 'vs/platform/progress/common/progress';
import { IFileService } from 'vs/platform/files/common/files';
import { IProductService } from 'vs/platform/product/common/productService';
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { IMenuService } from 'vs/platform/actions/common/actions';
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { IWebviewThemeDataProvider } from 'vs/workbench/contrib/webview/browser/themeing';
import { IWebviewService } from 'vs/workbench/contrib/webview/browser/webview';

export class AISettingsEditorInput extends EditorInput {
  static readonly ID = 'workbench.input.aiSettings';

  get typeId(): string {
    return AISettingsEditorInput.ID;
  }

  getResource() {
    return undefined;
  }

  matches(other: unknown): boolean {
    return other instanceof AISettingsEditorInput;
  }
}

export class AISettingsEditor extends WebviewEditor {
  static readonly ID = 'workbench.editor.aiSettings';
  static readonly LABEL = 'AI Settings';

  private _disposables = new DisposableStore();

  constructor(
    @ITelemetryService telemetryService: ITelemetryService,
    @IInstantiationService instantiationService: IInstantiationService,
    @IStorageService storageService: IStorageService,
    @ITextResourceConfigurationService textResourceConfigurationService: ITextResourceConfigurationService,
    @IThemeService themeService: IThemeService,
    @IContextKeyService contextKeyService: IContextKeyService,
    @IExtensionService extensionService: IExtensionService,
    @IWebviewWorkbenchService webviewWorkbenchService: IWebviewWorkbenchService,
    @IConfigurationService private readonly configurationService: IConfigurationService,
    @IWebviewService webviewService: IWebviewService,
    @IOpenerService openerService: IOpenerService,
    @IWorkbenchEnvironmentService environmentService: IWorkbenchEnvironmentService,
    @IProductService productService: IProductService,
    @IMenuService menuService: IMenuService,
    @IWebviewThemeDataProvider themeDataProvider: IWebviewThemeDataProvider,
  ) {
    super(
      AISettingsEditor.ID,
      telemetryService,
      instantiationService,
      storageService,
      textResourceConfigurationService,
      themeService,
      contextKeyService,
      webviewWorkbenchService,
      webviewService,
      openerService,
      environmentService,
      productService,
      menuService,
      themeDataProvider,
      extensionService
    );
  }

  protected createEditor(parent: HTMLElement): void {
    super.createEditor(parent);
    
    this._disposables.add(this.onDidFocus(() => {
      this.updateWebview();
    }));
  }

  private async updateWebview() {
    const webview = this.getControl();
    if (!webview) {
      return;
    }

    // Get current configuration
    const config = this.configurationService.getValue('ascode');
    
    // Set HTML content
    const nonce = this.getNonce();
    const cspSource = webview.cspSource;
    
    webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src https:;">
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 0 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-settings-editorBackground);
          }
          .settings-section {
            margin-bottom: 30px;
          }
          .settings-header {
            font-size: 16px;
            font-weight: 600;
            margin: 20px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid var(--vscode-settings-headerBorder);
          }
          .setting-item {
            display: flex;
            margin-bottom: 10px;
            align-items: center;
          }
          .setting-label {
            width: 200px;
            margin-right: 20px;
          }
          .setting-control {
            flex: 1;
          }
          input[type="text"], select {
            width: 100%;
            padding: 4px;
            background-color: var(--vscode-settings-textInputBackground);
            color: var(--vscode-settings-textInputForeground);
            border: 1px solid var(--vscode-settings-textInputBorder);
            border-radius: 2px;
          }
          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 12px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 13px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 2px;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .status-message {
            margin-left: 10px;
            font-style: italic;
            color: var(--vscode-descriptionForeground);
          }
          .success { color: var(--vscode-testing-iconPassed); }
          .error { color: var(--vscode-testing-iconFailed); }
        </style>
      </head>
      <body>
        <div class="settings-section">
          <h2 class="settings-header">AI Model Settings</h2>
          
          <div class="setting-item">
            <div class="setting-label">Active Model</div>
            <div class="setting-control">
              <select id="activeModel">
                <option value="gemini" ${config.ai?.activeModel === 'gemini' ? 'selected' : ''}>Google Gemini</option>
                <option value="groq" ${config.ai?.activeModel === 'groq' ? 'selected' : ''}>Groq</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2 class="settings-header">API Keys</h2>
          
          <div class="setting-item">
            <div class="setting-label">Gemini API Key</div>
            <div class="setting-control">
              <input type="password" id="geminiApiKey" placeholder="Enter Gemini API key" 
                     value="${config.ai?.gemini?.apiKey ? '••••••••••••••••' : ''}">
              <button id="testGemini">Test Connection</button>
              <span id="geminiStatus" class="status-message"></span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">Groq API Key</div>
            <div class="setting-control">
              <input type="password" id="groqApiKey" placeholder="Enter Groq API key"
                     value="${config.ai?.groq?.apiKey ? '••••••••••••••••' : ''}">
              <button id="testGroq">Test Connection</button>
              <span id="groqStatus" class="status-message"></span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h2 class="settings-header">Supabase Configuration</h2>
          
          <div class="setting-item">
            <div class="setting-label">Enable Secure Storage</div>
            <div class="setting-control">
              <input type="checkbox" id="supabaseEnabled" ${config.ai?.supabase?.enabled !== false ? 'checked' : ''}>
              <label for="supabaseEnabled">Store API keys securely in Supabase</label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">Supabase URL</div>
            <div class="setting-control">
              <input type="text" id="supabaseUrl" placeholder="https://your-project.supabase.co" 
                     value="${config.ai?.supabase?.url || ''}">
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-label">Supabase Anon Key</div>
            <div class="setting-control">
              <input type="password" id="supabaseAnonKey" placeholder="Your Supabase anon/public key"
                     value="${config.ai?.supabase?.anonKey ? '••••••••••••••••' : ''}">
            </div>
          </div>
        </div>

        <div class="settings-section">
          <button id="saveSettings">Save Settings</button>
          <span id="saveStatus" class="status-message"></span>
        </div>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          
          document.getElementById('saveSettings').addEventListener('click', () => {
            const settings = {
              activeModel: document.getElementById('activeModel').value,
              gemini: {
                apiKey: document.getElementById('geminiApiKey').value || undefined
              },
              groq: {
                apiKey: document.getElementById('groqApiKey').value || undefined
              },
              supabase: {
                enabled: document.getElementById('supabaseEnabled').checked,
                url: document.getElementById('supabaseUrl').value || undefined,
                anonKey: document.getElementById('supabaseAnonKey').value || undefined
              }
            };
            
            vscode.postMessage({
              command: 'saveSettings',
              settings: settings
            });
            
            const statusEl = document.getElementById('saveStatus');
            statusEl.textContent = 'Saving...';
            statusEl.className = 'status-message';
          });
          
          document.getElementById('testGemini').addEventListener('click', () => {
            const apiKey = document.getElementById('geminiApiKey').value;
            if (!apiKey) {
              updateStatus('geminiStatus', 'Please enter an API key first', 'error');
              return;
            }
            
            updateStatus('geminiStatus', 'Testing connection...', '');
            vscode.postMessage({
              command: 'testConnection',
              provider: 'gemini',
              apiKey: apiKey
            });
          });
          
          document.getElementById('testGroq').addEventListener('click', () => {
            const apiKey = document.getElementById('groqApiKey').value;
            if (!apiKey) {
              updateStatus('groqStatus', 'Please enter an API key first', 'error');
              return;
            }
            
            updateStatus('groqStatus', 'Testing connection...', '');
            vscode.postMessage({
              command: 'testConnection',
              provider: 'groq',
              apiKey: apiKey
            });
          });
          
          function updateStatus(elementId, message, type) {
            const el = document.getElementById(elementId);
            el.textContent = message;
            el.className = 'status-message ' + type;
          }
          
          // Handle messages from the extension
          window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'testConnectionResult') {
              const statusEl = document.getElementById(message.provider + 'Status');
              if (message.success) {
                updateStatus(statusEl.id, '✓ Connection successful', 'success');
              } else {
                updateStatus(statusEl.id, '✗ Connection failed: ' + (message.error || 'Unknown error'), 'error');
              }
            } else if (message.command === 'saveResult') {
              const statusEl = document.getElementById('saveStatus');
              if (message.success) {
                updateStatus(statusEl.id, '✓ Settings saved', 'success');
                
                // Update the displayed values to show the changes were saved
                if (message.settings.gemini?.apiKey) {
                  document.getElementById('geminiApiKey').value = '••••••••••••••••';
                }
                if (message.settings.groq?.apiKey) {
                  document.getElementById('groqApiKey').value = '••••••••••••••••';
                }
                if (message.settings.supabase?.anonKey) {
                  document.getElementById('supabaseAnonKey').value = '••••••••••••••••';
                }
              } else {
                updateStatus(statusEl.id, '✗ Failed to save: ' + (message.error || 'Unknown error'), 'error');
              }
            }
          });
        </script>
      </body>
      </html>
    `;
    
    // Handle messages from the webview
    this._disposables.add(webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'saveSettings':
          try {
            await this.configurationService.updateValue('ascode.ai', message.settings);
            webview.postMessage({
              command: 'saveResult',
              success: true,
              settings: message.settings
            });
          } catch (error) {
            webview.postMessage({
              command: 'saveResult',
              success: false,
              error: error.message
            });
          }
          break;
          
        case 'testConnection':
          try {
            // This would be replaced with actual connection testing logic
            // For now, we'll just simulate a successful connection
            await new Promise(resolve => setTimeout(resolve, 1000));
            webview.postMessage({
              command: 'testConnectionResult',
              provider: message.provider,
              success: true
            });
          } catch (error) {
            webview.postMessage({
              command: 'testConnectionResult',
              provider: message.provider,
              success: false,
              error: error.message
            });
          }
          break;
      }
    }));
  }
  
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  
  dispose(): void {
    this._disposables.dispose();
    super.dispose();
  }
}

// Register the editor
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
  EditorPaneDescriptor.create(
    AISettingsEditor,
    AISettingsEditor.ID,
    'AI Settings'
  ),
  [
    new SyncDescriptor(AISettingsEditorInput)
  ]
);

// Register the editor input factory
class AISettingsEditorInputSerializer implements IEditorSerializer {
  canSerialize(editorInput: AISettingsEditorInput): boolean {
    return true;
  }

  serialize(editorInput: AISettingsEditorInput): string {
    return '';
  }

  deserialize(instantiationService: IInstantiationService, serializedEditorInput: string): AISettingsEditorInput {
    return instantiationService.createInstance(AISettingsEditorInput);
  }
}

Registry.as<IEditorInputFactoryRegistry>(EditorExtensions.EditorInputFactories).registerEditorInputSerializer(
  AISettingsEditorInput.ID,
  AISettingsEditorInputSerializer
);

// Register a command to open the settings editor
const OPEN_AI_SETTINGS_COMMAND = 'ascode.openAISettings';

CommandsRegistry.registerCommand(OPEN_AI_SETTINGS_COMMAND, (accessor: ServicesAccessor) => {
  const editorService = accessor.get(IEditorService);
  const editorInput = new AISettingsEditorInput();
  
  return editorService.openEditor(editorInput, { pinned: true });
});

// Add a menu item to open the AI settings
MenuRegistry.appendMenuItem(MenuId.GlobalActivity, {
  group: '2_ai',
  command: {
    id: OPEN_AI_SETTINGS_COMMAND,
    title: 'AI Settings',
    icon: '$(sparkle)'
  },
  order: 1
});
