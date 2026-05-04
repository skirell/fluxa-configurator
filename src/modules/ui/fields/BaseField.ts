import { LIMITS } from '../../../data/constants/limits';
import { FieldClass, SpanClass } from '../../../data/enums/classNames';
import { FieldSettings } from '../../../global/types/field';
import { ParamOption } from '../../../global/types/option';
import EventManager from '../../managers/EventManager/EventManager';

function createRequiredSpan(): HTMLElement {
	const requiredSpan = document.createElement('span');
	requiredSpan.textContent = '*';
	requiredSpan.classList.add(SpanClass.REQUIRED);
	return requiredSpan;
}

export default abstract class BaseField<T = any> {
	public settings: FieldSettings;
	protected value: T;
	protected required: boolean = false;
	protected listeners: Array<(newValue: any) => void> = [];

	protected rootElement!: HTMLDivElement;
	protected inputElement?: HTMLElement;
	protected labelElement?: HTMLLabelElement;

	constructor(
		public readonly key: string,
		public readonly option: ParamOption,
		initialValue?: T,
	) {
		this.value = initialValue as T;
		this.required = option.required ?? false;
		this.settings = option.fieldSettings ?? {};
	}

	abstract render(): HTMLElement;

	init(): void {}

	getRootElement(): HTMLDivElement {
		return this.rootElement;
	}

	getValue(): T {
		return this.value;
	}

	setValue(newValue: any): void {
		const oldValue = this.value;
		this.value = newValue;
		if (newValue !== oldValue) this.notifyChange(newValue);

		this.refreshUI();
	}

	setState(key: string, value: any) {
		if (key === 'required') {
			this.required = !!value;

			if (this.inputElement && this.inputElement instanceof HTMLInputElement) {
				this.inputElement.required = this.required;
				this.inputElement.placeholder =
					this.option.placeholder ??
					`${this.required ? 'Обязательное' : 'Необязательное'} поле`;
			}

			if (this.labelElement) {
				const existing = this.labelElement.querySelector(
					`.${SpanClass.REQUIRED}`,
				);
				if (this.required && !existing) {
					this.labelElement.appendChild(createRequiredSpan());
				} else if (!this.required && existing) {
					existing.remove();
				}
			}

            this.validate();
		}
	}

	onChange(callback: (newValue: any) => void): void {
		this.listeners.push(callback);
	}

	validate(): boolean {
        const isEmpty =
            this.value === null ||
            this.value === undefined ||
            this.value === '' ||
            (Array.isArray(this.value) && this.value.length === 0);

        if (this.required && isEmpty) {
            this.inputElement?.classList.add(FieldClass.INVALID);
            return false;
        }

        this.inputElement?.classList.remove(FieldClass.INVALID);
        return true;
    }

	protected refreshUI(): void {
	}

	protected onInput(value: T): void {
		this.setValue(value);
		this.validate();
		EventManager.emit('fieldChanged', this);
	}

	protected buildLabel(htmlFor?: string): HTMLLabelElement {
		const label = document.createElement('label');
		label.htmlFor = htmlFor ?? this.key;

		const textSpan = document.createElement('span');
		textSpan.textContent = this.option.label;
		label.appendChild(textSpan);

		if (this.required) label.appendChild(createRequiredSpan());

		const helpBtn = document.createElement('button');
		helpBtn.type = 'button';
		helpBtn.className = 'field-help-btn';
		helpBtn.title = 'Показать документацию';
		helpBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1"/><path d="M4.5 4.5a1.5 1.5 0 0 1 2.83.7c0 1-1.33 1.15-1.33 2.3" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><circle cx="6" cy="9" r="0.5" fill="currentColor"/></svg>';
		helpBtn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			EventManager.emit('showFieldDocs', this.key);
		});
		label.appendChild(helpBtn);

		this.labelElement = label;
		return label;
	}

    protected updateLabel(newOption: ParamOption): void {
        if (this.labelElement) {
            const existingStar = this.labelElement.querySelector(
                `.${SpanClass.REQUIRED}`
            );
            if (existingStar) existingStar.remove();

			const textSpan = this.labelElement.querySelector('span:first-child');
			if (textSpan) textSpan.textContent = newOption.label;

            if (newOption.required) {
                const helpBtn = this.labelElement.querySelector('.field-help-btn');
                if (helpBtn) {
                    this.labelElement.insertBefore(createRequiredSpan(), helpBtn);
                } else {
                    this.labelElement.appendChild(createRequiredSpan());
                }
            }
        }
    }

    public setOption(option: ParamOption): void {
        this.required = option.required ?? false;
        this.settings = option.fieldSettings ?? {};

        this.updateLabel(option);

        if (this.inputElement && this.inputElement instanceof HTMLInputElement) {
            this.inputElement.placeholder =
                this.option.placeholder ??
                `${this.required ? 'Обязательное' : 'Необязательное'} поле`;
            this.inputElement.required = this.required;
        }

        this.refreshUI();
    }

	protected buildInputElement(type: string): HTMLInputElement {
		const input = document.createElement('input');
		input.type = type;
		input.id = this.key;
		input.value = (this.value ?? '') as any;
		input.required = this.required;
		input.placeholder =
			this.option.placeholder ??
			`${this.required ? 'Обязательное' : 'Необязательное'} поле`;

		const settings = this.settings;
		input.maxLength = settings.maxLength ?? LIMITS.MAX_FIELD_LENGTH;
		input.minLength = settings.minLength ?? LIMITS.MIN_FIELD_LENGTH;
		input.step = settings.step?.toString() ?? 'any';
		input.dataset.key = this.key;
		input.max = (settings.maxNumber ?? LIMITS.MAX_FIELD_NUMBER).toString();
		input.min = (settings.minNumber ?? LIMITS.MIN_FIELD_NUMBER).toString();

		this.inputElement = input;

		return input;
	}

	protected wrapField(
		elements: HTMLElement[],
		classNames?: string[],
	): HTMLDivElement {
		const wrapper = document.createElement('div');
		wrapper.classList.add(FieldClass.FIELD_CONTAINER, ...(classNames ?? []));
		wrapper.append(...elements);
		return wrapper;
	}

	private notifyChange(newValue: any): void {
		for (const listener of this.listeners) {
			try {
				listener(newValue);
			} catch (err) {
				console.error(
					`Ошибка в onChange-колбэке для поля "${this.key}":`,
					err,
				);
			}
		}
	}
}
