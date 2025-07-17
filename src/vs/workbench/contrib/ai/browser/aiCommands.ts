import { localize } from 'vs/nls';
import { IQuickInputService, IQuickPickItem } from 'vs/platform/quickinput/common/quickInput';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { IAIService } from 'vs/platform/ai/common/aiProviderService';
import { Action2, MenuId, registerAction2 } from 'vs/platform/actions/common/actions';
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';

class SelectAIModelAction extends Action2 {
  static readonly ID = 'ascode.selectAIModel';
  static readonly LABEL = localize('selectAIModel', 'Select AI Model');

  private readonly models = [
    { id: 'gemini', name: 'Google Gemini', description: 'Google\'s advanced AI model' },
    { id: 'groq', name: 'Groq', description: 'High-performance AI models' }
  ] as const;

  constructor() {
    super({
      id: SelectAIModelAction.ID,
      title: { value: SelectAIModelAction.LABEL, original: 'Select AI Model' },
      menu: [
        {
          id: MenuId.StatusBarWindowIndicatorMenu,
          group: '1_ai',
          order: 1
        }
      ]
    });
  }

  async run(accessor: ServicesAccessor): Promise<void> {
    const aiService = accessor.get(IAIService);
    const quickInputService = accessor.get(IQuickInputService);

    try {
      const activeModel = aiService.getActiveModel();
      
      const items = this.models.map(model => ({
        label: model.name,
        description: model.description,
        detail: model.id === activeModel ? localize('activeModel', 'Currently Active') : '',
        modelId: model.id,
        picked: model.id === activeModel
      }));

      const selected = await quickInputService.pick(
        items,
        {
          placeHolder: localize('selectAIModelPlaceholder', 'Select AI Model'),
          canPickMany: false
        }
      );

      if (selected) {
        await aiService.setActiveModel(selected.modelId as 'gemini' | 'groq');
      }
    } catch (error) {
      console.error('Failed to select AI model:', error);
      // Show error to user
      const notificationService = accessor.get(INotificationService);
      notificationService.error(localize('selectAIModelError', 'Failed to select AI model: {0}', error.message));
    }
  }
}

class ConfigureAPIKeyAction extends Action2 {
  static readonly ID = 'ascode.configureAPIKey';
  static readonly LABEL = localize('configureAPIKey', 'Configure API Key...');

  constructor() {
    super({
      id: ConfigureAPIKeyAction.ID,
      title: { value: ConfigureAPIKeyAction.LABEL, original: 'Configure API Key...' },
      menu: [
        {
          id: MenuId.StatusBarWindowIndicatorMenu,
          group: '1_ai',
          order: 2
        }
      ]
    });
  }

  async run(accessor: ServicesAccessor): Promise<void> {
    const commandService = accessor.get(ICommandService);
    try {
      // Open the settings UI to the AI configuration section
      await commandService.executeCommand('workbench.action.openSettings', 'ascode.ai');
      
      // Show a helpful notification
      const notificationService = accessor.get(INotificationService);
      notificationService.info({
        message: localize('configureAPIKeyMessage', 'Configure your AI API keys in the settings'),
        actions: {
          primary: [
            {
              label: localize('openSettings', 'Open Settings'),
              run: () => commandService.executeCommand('workbench.action.openSettings', 'ascode.ai')
            }
          ]
        }
      });
    } catch (error) {
      console.error('Failed to open AI settings:', error);
      const notificationService = accessor.get(INotificationService);
      notificationService.error(localize('openSettingsError', 'Failed to open AI settings: {0}', error.message));
    }
  }
}

// Command to test AI connection
export class TestAIConnectionAction extends Action2 {
  static readonly ID = 'ascode.testAIConnection';
  static readonly LABEL = localize('testAIConnection', 'Test AI Connection');

  constructor() {
    super({
      id: TestAIConnectionAction.ID,
      title: { value: TestAIConnectionAction.LABEL, original: 'Test AI Connection' },
      menu: [
        {
          id: MenuId.StatusBarWindowIndicatorMenu,
          group: '1_ai',
          order: 3
        }
      ]
    });
  }

  async run(accessor: ServicesAccessor): Promise<void> {
    const aiService = accessor.get(IAIService);
    const notificationService = accessor.get(INotificationService);
    const quickInputService = accessor.get(IQuickInputService);

    try {
      const activeModel = aiService.getActiveModel();
      const modelName = activeModel === 'gemini' ? 'Google Gemini' : 'Groq';
      
      // Show progress notification
      const progressNotification = notificationService.notify({
        severity: Severity.Info,
        message: localize('testingConnection', 'Testing connection to {0}...', modelName),
        sticky: true
      });

      // Test the connection
      const isConnected = await aiService.testConnection(activeModel);
      
      // Update notification with result
      progressNotification.close();
      
      if (isConnected) {
        notificationService.info(localize('connectionSuccess', 'Successfully connected to {0}', modelName));
      } else {
        notificationService.error(localize('connectionFailed', 'Failed to connect to {0}. Please check your API key and internet connection.', modelName));
      }
    } catch (error) {
      notificationService.error(localize('testConnectionError', 'Error testing AI connection: {0}', error.message));
    }
  }
}

export function registerAIActions(): void {
  registerAction2(SelectAIModelAction);
  registerAction2(ConfigureAPIKeyAction);
  registerAction2(TestAIConnectionAction);
}
