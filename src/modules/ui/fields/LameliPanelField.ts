import { PLACEHOLDERS } from '../../../data/constants/placeholders';
import { ViewId } from '../../../data/enums/view-id';
import { getLameliParamOptions } from '../../../data/settings/param-options/lameli-param-options';
import { ParamOption } from '../../../global/types/option';
import { showConfirm } from '../../../utils/alert-utils';
import { createFieldInstance } from '../../../utils/field-utils';
import EventManager from '../../managers/EventManager/EventManager';
import BaseField from './BaseField';

export class LameliPanelField extends BaseField<Record<string, any> | null> {
	private fieldsContainer!: HTMLElement;
	private contentContainer!: HTMLElement;
	private fields = new Map<string, BaseField>();
	private isEnabled: boolean = false;

	constructor(
		fieldKey: string,
		option: ParamOption,
		initialValue: Record<string, any> | null | undefined,
	) {
		super(fieldKey, option, initialValue ?? null);
		this.isEnabled = this.value !== null && this.value !== undefined;
	}

	public render(): HTMLDivElement {
		const label = this.buildLabel();
		const panel = this.buildPanel();

		this.rootElement = this.wrapField([label, panel]);
		this.inputElement = this.fieldsContainer;
		return this.rootElement;
	}

	public refreshUI(): void {
		this.updateUI();
	}

	public getValue(): Record<string, any> | null {
		if (!this.isEnabled) return null;

		const result: Record<string, any> = {};
		for (const [key, field] of this.fields) {
			result[key] = field.getValue() || '';
		}

		return result;
	}

	public setValue(value: Record<string, any> | null): void {
		this.value = value;
		this.isEnabled = value !== null && value !== undefined;
		this.updateUI();
	}

	public setOption(option: ParamOption): void {
		const oldLameliType = (this.option as any).lameliType;
		
		(this.option as any) = option;
		
		this.required = option.required ?? false;
		this.settings = option.fieldSettings ?? {};
		this.updateLabel(option);
		
		if (oldLameliType !== option.lameliType && this.isEnabled) {
			const currentValues = this.getValue();
			
			this.fieldsContainer.innerHTML = '';
			this.fields.clear();
			
			this.renderFields();
			
			if (currentValues) {
				const newValues: Record<string, any> = {};
				const lameliOptions = getLameliParamOptions(option.lameliType);
				for (const [key] of lameliOptions) {
					if (currentValues[key] !== undefined) {
						newValues[key] = currentValues[key];
					}
				}
				if (Object.keys(newValues).length > 0) {
					this.value = newValues;
					for (const [key, field] of this.fields) {
						if (newValues[key] !== undefined) {
							field.setValue(newValues[key]);
						}
					}
				} else {
					this.value = {};
				}
			}
		}
	}

	public validate(): boolean {
		if (!this.isEnabled) return super.validate();

		let allValid = true;
		for (const field of this.fields.values()) {
			if (!field.validate()) allValid = false;
		}
		return allValid;
	}

	/** Перечисляет невалидные поля внутри ламели — для вывода в панель ошибок. */
	public getInnerInvalidFields(): { label: string }[] {
		if (!this.isEnabled) return [];
		const result: { label: string }[] = [];
		for (const field of this.fields.values()) {
			if (field.option.required && !field.validate()) {
				result.push({
					label: `Ламели · поле «${field.option.label}» не заполнено`,
				});
			}
		}
		return result;
	}

	private buildPanel(): HTMLDivElement {
		const container = document.createElement('div');
		container.classList.add(ViewId.TABS_PANEL_CONTAINER);

		this.contentContainer = document.createElement('div');
		this.contentContainer.classList.add('tabs-panel-content');
		container.appendChild(this.contentContainer);

		this.fieldsContainer = document.createElement('div');
		this.fieldsContainer.classList.add('tabs-panel-form');
		this.contentContainer.appendChild(this.fieldsContainer);

		const buttonsContainer = this.buildButtons();
		this.contentContainer.appendChild(buttonsContainer);

		this.updateUI();

		return container;
	}

	private buildButtons(): HTMLElement {
		const buttonsContainer = document.createElement('div');
		buttonsContainer.classList.add(ViewId.TABS_PANEL_BUTTONS);

		const addButton = document.createElement('button');
		addButton.type = 'button';
		addButton.textContent = 'Добавить';
		addButton.classList.add(ViewId.TABS_PANEL_BUTTON);
		addButton.setAttribute('data-lameli-button', 'add');
		addButton.addEventListener('click', () => this.enableLameli());

		const removeButton = document.createElement('button');
		removeButton.type = 'button';
		removeButton.textContent = 'Удалить';
		removeButton.classList.add(ViewId.TABS_PANEL_BUTTON);
		removeButton.setAttribute('data-lameli-button', 'remove');
		removeButton.addEventListener('click', () => this.disableLameli());

		buttonsContainer.appendChild(addButton);
		buttonsContainer.appendChild(removeButton);

		return buttonsContainer;
	}

	private async enableLameli(): Promise<void> {
		this.isEnabled = true;
		if (this.value === null || this.value === undefined) {
			this.value = {};
		}
		this.updateUI();
	}

	private async disableLameli(): Promise<void> {
		const success = await showConfirm(PLACEHOLDERS.CONFIRM_DELETE);
		if (!success) return;

		this.isEnabled = false;
		this.value = null;
		this.clearFields();
		this.updateUI();
	}

	private updateUI(): void {
		if (!this.fieldsContainer) return;

		this.fieldsContainer.innerHTML = '';
		this.fields.clear();

		const addButton = this.rootElement?.querySelector(
			`[data-lameli-button="add"]`,
		) as HTMLElement;
		const removeButton = this.rootElement?.querySelector(
			`[data-lameli-button="remove"]`,
		) as HTMLElement;

		if (addButton && removeButton) {
			addButton.style.display = this.isEnabled ? 'none' : 'inline-block';
			removeButton.style.display = this.isEnabled ? 'inline-block' : 'none';
		}

		if (this.isEnabled) {
			this.renderFields();
		}
	}

	private renderFields(): void {
		const lameliOptions = getLameliParamOptions(this.option.lameliType);

		for (const [key, option] of lameliOptions) {
			const initialValue = this.value?.[key];
			const field = createFieldInstance(key, option, initialValue);
			if (field) {
				field.onChange(() => {
					this.updateValueFromFields();
				});
				field.init();
				field.render();
				this.fields.set(key, field);
				this.fieldsContainer.appendChild(field.getRootElement());

				// Кнопка «?» на вложенном поле ведёт на раздел «Ламели» целиком —
				// отдельных якорей у подполей в документации нет, они все сводятся к одному заголовку.
				this.rewireHelpButton(field);
			}
		}
	}

	private rewireHelpButton(field: BaseField): void {
		const helpBtn = field.getRootElement().querySelector('.field-help-btn') as HTMLElement | null;
		if (!helpBtn) return;
		const cloned = helpBtn.cloneNode(true) as HTMLElement;
		helpBtn.replaceWith(cloned);
		const parentKey = this.key;
		cloned.addEventListener('click', e => {
			e.preventDefault();
			e.stopPropagation();
			EventManager.emit('showFieldDocs', parentKey);
		});
	}

	private updateValueFromFields(): void {
		const result: Record<string, any> = {};
		for (const [key, field] of this.fields) {
			const value = field.getValue();
			if (value !== null && value !== undefined && value !== '') {
				result[key] = value;
			}
		}
		this.value = Object.keys(result).length > 0 ? result : null;
	}

	private clearFields(): void {
		this.fields.clear();
	}
}
