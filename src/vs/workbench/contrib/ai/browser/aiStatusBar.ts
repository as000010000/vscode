import { Disposable } from 'vs/base/common/lifecycle';
import { localize } from 'vs/nls';
import { IStatusbarEntry, IStatusbarEntryAccessor, IStatusbarService, StatusbarAlignment } from 'vs/workbench/services/statusbar/browser/statusbar';
import { IAIService } from 'vs/platform/ai/common/aiProviderService';

export class AIStatusBar extends Disposable {
  private statusBarEntry: IStatusbarEntryAccessor | undefined;
  private readonly statusBarEntryId = 'ai.status';

  constructor(
    @IStatusbarService private readonly statusbarService: IStatusbarService,
    @IAIService private readonly aiService: IAIService
  ) {
    super();
    this._register(this.aiService.onDidChangeActiveClient(() => this.updateStatusBar()));
    this.updateStatusBar().catch(error => console.error('Failed to update AI status bar:', error));
  }

  private async updateStatusBar(): Promise<void> {
    const activeModel = this.aiService.getActiveModel();
    const modelName = activeModel === 'gemini' ? 'Gemini' : 'Groq';
    
    const entry: IStatusbarEntry = {
      name: localize('ai.status.name', 'AI Model'),
      text: `$(sparkle) ${modelName}`,
      tooltip: localize('ai.status.tooltip', 'Active AI Model: {0}', modelName),
      command: 'ascode.selectAIModel',
      showInAllWindows: true,
      ariaLabel: localize('ai.status.ariaLabel', 'AI Model: {0}', modelName)
    };

    if (!this.statusBarEntry) {
      this.statusBarEntry = this.statusbarService.addEntry(
        entry,
        this.statusBarEntryId,
        StatusbarAlignment.RIGHT,
        100 // Priority - higher numbers appear more to the left
      );
    } else {
      this.statusBarEntry.update(entry);
    }
  }

  dispose(): void {
    super.dispose();
    this.statusBarEntry?.dispose();
  }
}
