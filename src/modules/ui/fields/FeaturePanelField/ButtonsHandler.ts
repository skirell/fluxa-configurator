import { Feature } from '../../../../data/enums/feature';
import { showConfirm, showToast } from '../../../../utils/alert-utils';
import dirtyStateManager from '../../../managers/DirtyStateManager/DirtyStateManager';
import FeaturePanelFieldUI from './FeaturePanelFieldUI';

export default class ButtonsHandler {
	constructor(private readonly UI: FeaturePanelFieldUI) {}

	public onAdd(): void {
		if (this.UI.Tabs.length >= this.UI.featureSettings.maxCount) {
			showToast(`Можно добавить не больше ${this.UI.featureSettings.maxCount} вкладок.`, { type: 'warning' });
			return;
		}

		const count =
			this.UI.featureSettings.minOrEmpty && this.UI.Tabs.length <= 0
				? this.UI.featureSettings.minCount
				: 1;
		for (let i = 0; i < count; i++) this.UI.addTab();

		this.UI.refreshUI();
		dirtyStateManager.markDirty();
	}

	public onSave(): void {
		if (this.UI.Tabs.length <= 0) {
			showToast('Нет вкладок для сохранения.', { type: 'warning' });
			return;
		}
		if (!this.UI.SelectedTab) {
			showToast('Выберите вкладку для сохранения.', { type: 'warning' });
			return;
		}
		if (!this.UI.SelectedTab.save()) {
			showToast('Проверьте поля выбранной вкладки.', { type: 'warning' });
			return;
		}
		dirtyStateManager.markDirty();
	}

	public async onDelete(): Promise<void> {
		if (this.UI.Tabs.length <= 0) {
			showToast('Нет вкладок для удаления.', { type: 'warning' });
			return;
		}
		if (!this.UI.SelectedTab) {
			showToast('Выберите вкладку для удаления.', { type: 'warning' });
			return;
		}
		if (
			this.UI.option.required &&
			this.UI.Tabs.length <= this.UI.featureSettings.minCount
		) {
			showToast(`Нельзя оставить меньше ${this.UI.featureSettings.minCount} вкладок.`, { type: 'warning' });
			return;
		}

		const index = this.UI.Tabs.indexOf(this.UI.SelectedTab!);
		if (index < 0) return;

		const label = this.getItemLabel();
		const success = await showConfirm({
			title: `Удалить ${label.toLowerCase()}?`,
			message: `${label} ${index + 1} будет удален.`,
			confirmText: 'Удалить',
			cancelText: 'Отмена',
			danger: true,
		});
		if (!success) return;

		const featureSettings = this.UI.featureSettings;
		if (
			featureSettings.minOrEmpty &&
			this.UI.Tabs.length <= featureSettings.minCount
		) {
			this.UI.Tabs.splice(0).forEach(tab => tab.dispose());
		} else {
			this.UI.Tabs.splice(index, 1)[0]?.dispose();
		}

		this.UI.SelectedTab = this.UI.Tabs[0];
		this.UI.refreshUI();
		dirtyStateManager.markDirty();
	}

	private getItemLabel(): string {
		switch (this.UI.feature) {
			case Feature.modes:
			case Feature.fan_mode:
			case Feature.fan_mode_extended:
				return 'Режим';
			case Feature.sensors:
				return 'Датчик';
			case Feature.channels:
				return 'Канал';
			default:
				return 'Вкладка';
		}
	}
}
