import { PLACEHOLDERS } from '../../../../data/constants/placeholders';
import { Feature } from '../../../../data/enums/feature';
import { ViewId } from '../../../../data/enums/view-id';
import { ParamOption } from '../../../../global/types/option';
import { showConfirm, showMessage } from '../../../../utils/alert-utils';
import { getFeatureParams, isFieldInFeature } from '../../../../utils/option-utils';
import BaseField from '../BaseField';
import FeaturePanelFieldUI from './FeaturePanelFieldUI';
import Tab from './Tab/Tab';

export interface InnerInvalidField {
	label: string;
}

export default class FeaturePanelField extends FeaturePanelFieldUI {
	protected readonly value: Map<string, any> = new Map();

	constructor(
		fieldKey: string,
		option: ParamOption,
		initialValue: string | undefined,
	) {
		super(fieldKey, option, initialValue);
	}

	public init() {
		this.ensureRequiredTabs();
	}

	protected ensureRequiredTabs(): void {
		if (!this.option.required) return;
		while (this.tabs.length < this.featureSettings.minCount) this.addTab();
	}

	protected prepareForRender(): void {
		this.ensureRequiredTabs();
	}

	public setValue(record: Record<string, any>): void {
		this.clearTabs();

		if (!record || typeof record !== 'object') {
			this.refreshUI();
			return;
		}

		// Берём все записи как есть — «грязные» вкладки (с пустыми обязательными полями)
		// тоже загружаем, чтобы пользователь увидел ошибки в панели и мог их исправить.
		const records = Object.values(record).map((tab: any) =>
			tab && typeof tab === 'object'
				? Object.fromEntries(
					Object.entries(tab).filter(([key]) =>
						isFieldInFeature(this.feature, key),
					),
				)
				: {},
		);

		for (const tabParams of records) {
			const tab = this.addTab();
			for (const [fieldKey, value] of Object.entries(tabParams))
				tab.setParam(fieldKey, value);
			tab.UI.populateFields();
		}

		this.refreshUI();
	}

	public getValue(): Record<string, any> | null {
		const result: Record<string, Record<string, any>> = {};
		const max = this.featureSettings.maxCount;

		for (let i = 0; i < Math.min(this.tabs.length, max); i++) {
			const idx = i + 1;
			const fullKey = `${this.keyPrefix}${idx}`;

			const tab = this.tabs[i];
			tab.save();
			const tabData = tab.toJSON();

			// Пропускаем только полностью пустые вкладки (чтобы не плодить мусор).
			const allEmpty = Object.values(tabData).every(
				v => v === '' || v === null || v === undefined,
			);
			if (allEmpty) continue;

			result[fullKey] = tabData;
		}

		return Object.keys(result).length > 0 ? result : null;
	}

	public validate(): boolean {
		// Required с 0 вкладок → невалидно (обычный required-check на value Map не работает).
		if (this.required && this.tabs.length === 0) return false;
		let success = true;
		this.tabs.forEach(tab => {
			if (!tab.validateFields()) success = false;
		});
		return success;
	}

	/** Перечисляет каждое невалидное поле внутри вкладок — для вывода в панель ошибок. */
	public getInnerInvalidFields(): InnerInvalidField[] {
		const result: InnerInvalidField[] = [];
		const tabLabel = this.tabLabel();
		this.tabs.forEach((tab, index) => {
			tab.UI.generateFields();
			tab.UI.getFields().forEach(field => {
				if (field.option.required && !field.validate()) {
					result.push({
						label: `${tabLabel} ${index + 1} · поле «${field.option.label}» не заполнено`,
					});
				}
			});
		});
		return result;
	}

	private tabLabel(): string {
		switch (this.feature) {
			case Feature.modes:
			case Feature.fan_mode:
				return 'Режим';
			case Feature.sensors:
				return 'Датчик';
			case Feature.channels:
				return 'Канал';
			default:
				return 'Запись';
		}
	}
}
