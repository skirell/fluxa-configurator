import { PLACEHOLDERS } from '../../../../data/constants/placeholders';
import { showConfirm, showMessage } from '../../../../utils/alert-utils';
import FeaturePanelFieldUI from './FeaturePanelFieldUI';

export default class ButtonsHandler {
	constructor(private readonly UI: FeaturePanelFieldUI) {}

	public onAdd(): void {
		if (this.UI.Tabs.length >= this.UI.featureSettings.maxCount) {
			showMessage(`${PLACEHOLDERS.LIMIT_REACHED} вкладок!`);
			return;
		}

		const count =
			this.UI.featureSettings.minOrEmpty && this.UI.Tabs.length <= 0
				? this.UI.featureSettings.minCount
				: 1;
		for (let i = 0; i < count; i++) this.UI.addTab();

		this.UI.refreshUI();
	}

	public onSave(): void {
		if (this.UI.Tabs.length <= 0) {
			showMessage('Нет режимов для сохранения.');
			return;
		}
		if (!this.UI.SelectedTab) {
			showMessage('Вы не выбрали режим для сохранения.');
			return;
		}
		if (!this.UI.SelectedTab.validateFields()) {
			showMessage('Проверьте правильность ввода полей!');
			return;
		}

		this.UI.SelectedTab.save();

		showMessage('Режим успешно сохранен!');
	}

	public async onDelete(): Promise<void> {
		if (this.UI.Tabs.length <= 0) {
			showMessage('Нет режимов для удаления.');
			return;
		}
		if (!this.UI.SelectedTab) {
			showMessage('Вы не выбрали режим для удаления.');
			return;
		}
		if (
			this.UI.option.required &&
			this.UI.Tabs.length <= this.UI.featureSettings.minCount
		) {
			showMessage(
				`Режимов не может быть меньше ${this.UI.featureSettings.minCount}!`,
			);
			return;
		}

		const index = this.UI.Tabs.indexOf(this.UI.SelectedTab!);
		if (index < 0) return;

		const success = await showConfirm(PLACEHOLDERS.CONFIRM_DELETE);
		if (!success) return;

		const featureSettings = this.UI.featureSettings;
		if (
			featureSettings.minOrEmpty &&
			this.UI.Tabs.length <= featureSettings.minCount
		)
			this.UI.Tabs.splice(0);
		else this.UI.Tabs.splice(index, 1);

		this.UI.SelectedTab = this.UI.Tabs[0];
		this.UI.refreshUI();
	}
}
