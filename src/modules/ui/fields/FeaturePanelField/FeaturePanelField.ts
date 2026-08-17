import { PLACEHOLDERS } from '../../../../data/constants/placeholders';
import { Feature } from '../../../../data/enums/feature';
import { ViewId } from '../../../../data/enums/view-id';
import { ParamOption } from '../../../../global/types/option';
import {
	buildOrderedFeatureKeys,
	getOrderedFeatureRecords,
} from '../../../../utils/feature-validation';
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
		const records = getOrderedFeatureRecords(record).map((tab: any) =>
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
		const outputKeys = buildOrderedFeatureKeys(
			this.keyPrefix,
			this.tabs.length,
		);
		for (let i = 0; i < this.tabs.length; i++) {
			const fullKey = outputKeys[i];

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
		// Для обязательных панелей соблюдаем minCount. Для optional + minOrEmpty
		// допустимы либо 0 вкладок, либо не меньше minCount.
		if (this.required && this.tabs.length < this.featureSettings.minCount)
			return false;
		if (
			!this.required &&
			this.tabs.length > 0 &&
			this.tabs.length < this.featureSettings.minCount
		)
			return false;
		if (this.tabs.length > this.featureSettings.maxCount) return false;
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
		if (
			(this.required && this.tabs.length < this.featureSettings.minCount) ||
			(!this.required &&
				this.tabs.length > 0 &&
				this.tabs.length < this.featureSettings.minCount)
		) {
			result.push({
				label: `${tabLabel}: требуется минимум ${this.featureSettings.minCount}`,
			});
		}
		if (this.tabs.length > this.featureSettings.maxCount) {
			result.push({
				label: `${tabLabel}: допускается максимум ${this.featureSettings.maxCount}`,
			});
		}
		this.tabs.forEach((tab, index) => {
			tab.getInvalidFields().forEach(field => {
				result.push({
					label: `${tabLabel} ${index + 1} · поле «${field.option.label}» заполнено некорректно`,
				});
			});
		});
		return result;
	}

	private tabLabel(): string {
		switch (this.feature) {
			case Feature.modes:
			case Feature.fan_mode:
			case Feature.fan_mode_extended:
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
