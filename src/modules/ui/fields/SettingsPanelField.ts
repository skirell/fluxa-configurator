import { FieldClass, SpanClass } from '../../../data/enums/classNames';
import { SettingType } from '../../../data/enums/setting';
import { ViewId } from '../../../data/enums/view-id';
import {
	SETTING_FIELD_OPTIONS,
	SETTING_TYPE_OPTIONS,
	SettingFieldOption,
} from '../../../data/settings/options/setting-options';
import { ParamOption } from '../../../global/types/option';
import { showConfirm, showToast } from '../../../utils/alert-utils';
import {
	SettingValidationIssue,
	validateSettings,
} from '../../../utils/settings-validation';
import EventManager from '../../managers/EventManager/EventManager';
import BaseField from './BaseField';

type SettingRecord = Record<string, any>;

interface SettingItem {
	data: SettingRecord;
}

export interface SettingsInnerInvalidField {
	label: string;
	itemIndex: number;
	fieldKey: string;
	optionIndex?: number;
}

const RANGE_ABS_LIMIT = 1_000_000;

/**
 * Редактор обязательного упорядоченного массива `settings`.
 *
 * В отличие от FeaturePanelField элементы массива неоднородны: набор полей
 * зависит от `type`, а `enum` содержит ещё один упорядоченный массив options.
 */
export class SettingsPanelField extends BaseField<SettingRecord[]> {
	private readonly items: SettingItem[] = [];
	private selectedIndex = 0;
	private panelElement?: HTMLDivElement;

	constructor(
		fieldKey: string,
		option: ParamOption,
		initialValue?: SettingRecord[],
	) {
		super(fieldKey, option, Array.isArray(initialValue) ? initialValue : []);
		this.replaceItems(initialValue);
	}

	public init(): void {
		if (this.required && this.items.length === 0) this.addEmptyItem();
	}

	public render(): HTMLDivElement {
		const label = this.buildLabel();
		this.panelElement = document.createElement('div');
		this.panelElement.classList.add(
			ViewId.TABS_PANEL_CONTAINER,
			'settings-panel',
		);
		this.panelElement.dataset.key = this.key;

		this.rootElement = this.wrapField([label, this.panelElement]);
		this.inputElement = this.panelElement;
		this.refreshUI();
		return this.rootElement;
	}

	public setValue(value: any): void {
		const oldValue = this.value;
		this.replaceItems(value);
		this.value = this.getValue();
		if (this.value !== oldValue) this.notifyChange(this.value);
		this.refreshUI();
	}

	public getValue(): SettingRecord[] {
		return this.items.map(item => this.serializeItem(item));
	}

	public validate(): boolean {
		const issues = this.collectValidationIssues();
		this.clearValidationState();
		for (const issue of issues) this.markIssue(issue);
		return issues.length === 0;
	}

	public getInnerInvalidFields(): SettingsInnerInvalidField[] {
		const issues = this.collectValidationIssues();
		this.clearValidationState();
		for (const issue of issues) this.markIssue(issue);

		return issues.map(issue => ({
			itemIndex: issue.itemIndex,
			fieldKey: issue.fieldKey,
			optionIndex: issue.optionIndex,
			label:
				issue.itemIndex < 0
					? issue.message
					: `Настройка ${issue.itemIndex + 1} · ${issue.message}`,
		}));
	}

	public focusIssue(
		itemIndex: number,
		fieldKey: string,
		optionIndex?: number,
	): HTMLElement | null {
		if (itemIndex >= 0 && itemIndex < this.items.length) {
			this.selectedIndex = itemIndex;
			this.refreshUI();
		}

		let selector = `[data-setting-item="${itemIndex}"][data-setting-field="${fieldKey}"]`;
		if (optionIndex !== undefined)
			selector += `[data-setting-option="${optionIndex}"]`;
		return this.panelElement?.querySelector<HTMLElement>(selector) ?? null;
	}

	public refreshUI(): void {
		if (!this.panelElement) return;
		this.panelElement.innerHTML = '';

		if (this.items.length > 0) {
			this.selectedIndex = Math.max(
				0,
				Math.min(this.selectedIndex, this.items.length - 1),
			);
		}

		const tabs = document.createElement('div');
		tabs.classList.add('tabs-panel-tabs');
		this.items.forEach((item, index) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.classList.add(ViewId.TABS_PANEL_TAB);
			button.classList.toggle('active', index === this.selectedIndex);
			const prefix = index === this.selectedIndex ? 'Элемент · ' : '';
			button.textContent = `${prefix}${index + 1}`;
			button.title = this.getTypeLabel(item.data.type);
			button.addEventListener('click', () => {
				this.selectedIndex = index;
				this.refreshUI();
			});
			tabs.appendChild(button);
		});
		this.panelElement.appendChild(tabs);

		const content = document.createElement('div');
		content.classList.add('tabs-panel-content');

		const form = document.createElement('div');
		form.classList.add('tabs-panel-form');
		if (this.items.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'settings-panel-empty';
			empty.textContent = 'Добавьте минимум один элемент управления.';
			form.appendChild(empty);
		} else {
			this.renderSelectedItem(form);
		}
		content.appendChild(form);
		content.appendChild(this.buildItemButtons());
		this.panelElement.appendChild(content);
		this.validate();
	}

	private replaceItems(value: any): void {
		this.items.splice(0, this.items.length);
		if (Array.isArray(value)) {
			for (const raw of value) {
				this.items.push({
					data: this.cloneRecord(raw),
				});
			}
		}
		this.selectedIndex = 0;
	}

	private cloneRecord(value: any): SettingRecord {
		if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
		const result: SettingRecord = { ...value };
		if (Array.isArray(value.options)) {
			result.options = value.options.map((option: any) =>
				option && typeof option === 'object' && !Array.isArray(option)
					? { ...option }
					: {},
			);
		}
		return result;
	}

	private addEmptyItem(): void {
		this.items.push({ data: { type: '', title: '' } });
		this.selectedIndex = this.items.length - 1;
	}

	private renderSelectedItem(container: HTMLElement): void {
		const item = this.items[this.selectedIndex];
		container.appendChild(this.buildTypeField(item, this.selectedIndex));

		const type = item.data.type as SettingType;
		const fields = SETTING_FIELD_OPTIONS.get(type);
		if (!fields) return;

		for (const field of fields) {
			if (field.inputType === 'enum-options') {
				container.appendChild(
					this.buildEnumOptionsField(item, field, this.selectedIndex),
				);
			} else {
				container.appendChild(
					this.buildScalarField(item, field, this.selectedIndex),
				);
			}
		}
	}

	private buildTypeField(item: SettingItem, itemIndex: number): HTMLDivElement {
		const select = document.createElement('select');
		const id = `${this.key}-${itemIndex}-type`;
		select.id = id;
		select.required = true;
		this.setFieldData(select, itemIndex, 'type');

		const placeholder = document.createElement('option');
		placeholder.value = '';
		placeholder.textContent = 'Выберите тип элемента';
		placeholder.disabled = true;
		select.appendChild(placeholder);

		const current = item.data.type;
		if (
			typeof current === 'string' &&
			current !== '' &&
			!SETTING_TYPE_OPTIONS.has(current as SettingType)
		) {
			const invalid = document.createElement('option');
			invalid.value = current;
			invalid.textContent = `Недопустимый тип: ${current}`;
			select.appendChild(invalid);
		}

		SETTING_TYPE_OPTIONS.forEach((label, type) => {
			const option = document.createElement('option');
			option.value = type;
			option.textContent = label;
			select.appendChild(option);
		});
		select.value = typeof current === 'string' ? current : '';

		select.addEventListener('change', () => {
			const title = typeof item.data.title === 'string' ? item.data.title : '';
			item.data = { type: select.value, title };
			if (select.value === SettingType.enum) {
				item.data.options = [
					{ title: '', payload: '' },
					{ title: '', payload: '' },
				];
			}
			this.refreshUI();
			this.emitChange();
		});

		return this.wrapSettingField(
			'type — Тип элемента управления',
			select,
			id,
			true,
		);
	}

	private buildScalarField(
		item: SettingItem,
		field: SettingFieldOption,
		itemIndex: number,
	): HTMLDivElement {
		const input = document.createElement('input');
		const id = `${this.key}-${itemIndex}-${field.key}`;
		input.id = id;
		input.type = field.inputType;
		input.required = Boolean(field.required);
		input.placeholder = field.required
			? 'Обязательное поле'
			: 'Необязательное поле';
		this.setFieldData(input, itemIndex, field.key);

		const current = item.data[field.key];
		if (current !== undefined && current !== null) input.value = String(current);

		if (field.inputType === 'number') {
			input.min = String(-RANGE_ABS_LIMIT);
			input.max = String(RANGE_ABS_LIMIT);
			input.step = 'any';
		}

		input.addEventListener('input', () => {
			item.data[field.key] =
				field.inputType === 'number' && input.value !== ''
					? input.valueAsNumber
					: input.value;
			this.emitChange();
		});

		return this.wrapSettingField(
			field.label,
			input,
			id,
			Boolean(field.required),
		);
	}

	private buildEnumOptionsField(
		item: SettingItem,
		field: SettingFieldOption,
		itemIndex: number,
	): HTMLDivElement {
		const wrapper = document.createElement('div');
		wrapper.classList.add('field-container', 'settings-options-field');
		wrapper.dataset.settingItem = String(itemIndex);
		wrapper.dataset.settingField = field.key;

		const label = document.createElement('label');
		label.textContent = field.label;
		if (field.required) {
			const star = document.createElement('span');
			star.textContent = '*';
			star.classList.add(SpanClass.REQUIRED);
			label.appendChild(star);
		}
		wrapper.appendChild(label);

		const options = Array.isArray(item.data.options) ? item.data.options : [];
		const list = document.createElement('div');
		list.className = 'settings-options-list';

		options.forEach((rawOption: any, optionIndex: number) => {
			const option =
				rawOption &&
				typeof rawOption === 'object' &&
				!Array.isArray(rawOption)
					? rawOption
					: {};
			if (option !== rawOption) options[optionIndex] = option;

			const row = document.createElement('div');
			row.className = 'settings-option-row';
			row.dataset.settingOption = String(optionIndex);

			const title = this.buildEnumOptionInput(
				itemIndex,
				optionIndex,
				'title',
				'Название варианта',
				option.title,
				value => {
					option.title = value;
					this.emitChange();
				},
			);
			const payload = this.buildEnumOptionInput(
				itemIndex,
				optionIndex,
				'payload',
				'MQTT payload',
				option.payload,
				value => {
					option.payload = value;
					this.emitChange();
				},
			);

			const actions = document.createElement('div');
			actions.className = 'settings-option-actions';
			actions.append(
				this.makeSmallButton(
					'↑',
					'Переместить выше',
					optionIndex === 0,
					() => this.moveEnumOption(item, optionIndex, -1),
				),
				this.makeSmallButton(
					'↓',
					'Переместить ниже',
					optionIndex === options.length - 1,
					() => this.moveEnumOption(item, optionIndex, 1),
				),
				this.makeSmallButton(
					'×',
					'Удалить вариант',
					options.length <= 2,
					() => this.removeEnumOption(item, optionIndex),
				),
			);

			row.append(title, payload, actions);
			list.appendChild(row);
		});
		wrapper.appendChild(list);

		const add = this.makeSmallButton('+ Добавить вариант', '', false, () => {
			if (!Array.isArray(item.data.options)) item.data.options = [];
			item.data.options.push({ title: '', payload: '' });
			this.refreshUI();
			this.emitChange();
		});
		add.classList.add('settings-option-add');
		wrapper.appendChild(add);
		return wrapper;
	}

	private buildEnumOptionInput(
		itemIndex: number,
		optionIndex: number,
		key: 'title' | 'payload',
		placeholder: string,
		value: any,
		onInput: (value: string) => void,
	): HTMLInputElement {
		const input = document.createElement('input');
		input.type = 'text';
		input.required = true;
		input.placeholder = placeholder;
		input.setAttribute('aria-label', placeholder);
		input.value = value === undefined || value === null ? '' : String(value);
		this.setFieldData(input, itemIndex, key);
		input.dataset.settingOption = String(optionIndex);
		input.addEventListener('input', () => onInput(input.value));
		return input;
	}

	private wrapSettingField(
		labelText: string,
		input: HTMLElement,
		htmlFor: string,
		required: boolean,
	): HTMLDivElement {
		const wrapper = document.createElement('div');
		wrapper.classList.add('field-container');
		const label = document.createElement('label');
		label.htmlFor = htmlFor;
		label.textContent = labelText;
		if (required) {
			const star = document.createElement('span');
			star.textContent = '*';
			star.classList.add(SpanClass.REQUIRED);
			label.appendChild(star);
		}
		wrapper.append(label, input);
		return wrapper;
	}

	private setFieldData(
		element: HTMLElement,
		itemIndex: number,
		fieldKey: string,
	): void {
		element.dataset.key = this.key;
		element.dataset.settingItem = String(itemIndex);
		element.dataset.settingField = fieldKey;
	}

	private buildItemButtons(): HTMLDivElement {
		const buttons = document.createElement('div');
		buttons.classList.add(ViewId.TABS_PANEL_BUTTONS);
		const hasItem = this.items.length > 0;

		buttons.append(
			this.makePanelButton('Добавить', false, () => {
				this.addEmptyItem();
				this.refreshUI();
				this.emitChange();
			}),
			this.makePanelButton('Выше', !hasItem || this.selectedIndex === 0, () =>
				this.moveSelectedItem(-1),
			),
			this.makePanelButton(
				'Ниже',
				!hasItem || this.selectedIndex === this.items.length - 1,
				() => this.moveSelectedItem(1),
			),
			this.makePanelButton(
				'Удалить',
				!hasItem,
				() => void this.removeSelectedItem(),
			),
		);
		return buttons;
	}

	private makePanelButton(
		text: string,
		disabled: boolean,
		onClick: () => void,
	): HTMLButtonElement {
		const button = document.createElement('button');
		button.type = 'button';
		button.classList.add(ViewId.TABS_PANEL_BUTTON);
		button.textContent = text;
		button.disabled = disabled;
		button.addEventListener('click', onClick);
		return button;
	}

	private makeSmallButton(
		text: string,
		title: string,
		disabled: boolean,
		onClick: () => void,
	): HTMLButtonElement {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'settings-small-button';
		button.textContent = text;
		button.title = title;
		button.disabled = disabled;
		button.addEventListener('click', onClick);
		return button;
	}

	private moveSelectedItem(delta: -1 | 1): void {
		const target = this.selectedIndex + delta;
		if (target < 0 || target >= this.items.length) return;
		const [item] = this.items.splice(this.selectedIndex, 1);
		this.items.splice(target, 0, item);
		this.selectedIndex = target;
		this.refreshUI();
		this.emitChange();
	}

	private async removeSelectedItem(): Promise<void> {
		if (this.required && this.items.length <= 1) {
			showToast('В settings должен остаться минимум один элемент.', {
				type: 'warning',
			});
			return;
		}

		const success = await showConfirm({
			title: 'Удалить элемент settings?',
			message: `Элемент ${this.selectedIndex + 1} будет удалён.`,
			confirmText: 'Удалить',
			cancelText: 'Отмена',
			danger: true,
		});
		if (!success) return;

		this.items.splice(this.selectedIndex, 1);
		this.selectedIndex = Math.max(0, this.selectedIndex - 1);
		this.refreshUI();
		this.emitChange();
	}

	private moveEnumOption(
		item: SettingItem,
		optionIndex: number,
		delta: -1 | 1,
	): void {
		if (!Array.isArray(item.data.options)) return;
		const target = optionIndex + delta;
		if (target < 0 || target >= item.data.options.length) return;
		const [option] = item.data.options.splice(optionIndex, 1);
		item.data.options.splice(target, 0, option);
		this.refreshUI();
		this.emitChange();
	}

	private removeEnumOption(item: SettingItem, optionIndex: number): void {
		if (!Array.isArray(item.data.options)) return;
		if (item.data.options.length <= 2) {
			showToast('Для enum нужны минимум два варианта.', { type: 'warning' });
			return;
		}
		item.data.options.splice(optionIndex, 1);
		this.refreshUI();
		this.emitChange();
	}

	private emitChange(): void {
		this.value = this.getValue();
		this.notifyChange(this.value);
		this.validate();
		EventManager.emit('fieldChanged', this);
	}

	private serializeItem(item: SettingItem): SettingRecord {
		const type = item.data.type;
		const result: SettingRecord = {
			type: type ?? '',
			title: item.data.title ?? '',
		};
		const fields = SETTING_FIELD_OPTIONS.get(type as SettingType);
		if (!fields) return result;

		for (const field of fields) {
			if (field.key === 'title') continue;
			const value = item.data[field.key];
			if (
				field.optional &&
				(value === '' || value === null || value === undefined)
			)
				continue;
			if (field.inputType === 'enum-options') {
				result.options = Array.isArray(value)
					? value.map((option: any) => ({
							title: option?.title ?? '',
							payload: option?.payload ?? '',
						}))
					: [];
			} else {
				result[field.key] = value ?? '';
			}
		}
		return result;
	}

	private collectValidationIssues(): SettingValidationIssue[] {
		return validateSettings(this.items.map(item => item.data));
	}

	private clearValidationState(): void {
		this.panelElement?.classList.remove(FieldClass.INVALID);
		this.panelElement
			?.querySelectorAll(`.${FieldClass.INVALID}`)
			.forEach(element => element.classList.remove(FieldClass.INVALID));
	}

	private markIssue(issue: SettingValidationIssue): void {
		if (!this.panelElement) return;
		this.panelElement.classList.add(FieldClass.INVALID);
		if (issue.itemIndex < 0) {
			return;
		}
		if (issue.itemIndex !== this.selectedIndex) return;

		let selector = `[data-setting-item="${issue.itemIndex}"][data-setting-field="${issue.fieldKey}"]`;
		if (issue.optionIndex !== undefined) {
			selector += `[data-setting-option="${issue.optionIndex}"]`;
		}
		this.panelElement.querySelector(selector)?.classList.add(FieldClass.INVALID);
	}

	private getTypeLabel(value: any): string {
		return SETTING_TYPE_OPTIONS.get(value as SettingType) ?? 'Тип не выбран';
	}
}
