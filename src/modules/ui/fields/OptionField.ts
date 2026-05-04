import { FieldOption } from '../../../global/types/field';
import { ParamOption } from '../../../global/types/option';
import BaseField from './BaseField';

export class OptionField extends BaseField<string> {
	constructor(
		fieldKey: string,
		option: ParamOption,
		initialValue: string | undefined,
	) {
		super(fieldKey, option, initialValue ?? '');
	}

	public render(): HTMLDivElement {
		const label = this.buildLabel();
		const select = this.buildSelect();
		this.inputElement = select;
		this.rootElement = this.wrapField([label, select]);
		this.value = select.value;

		select.addEventListener('change', () => this.onInput(select.value));

		return this.rootElement;
	}

	private buildSelect(): HTMLSelectElement {
		const select = document.createElement('select');
		select.id = this.key;
		select.dataset.key = this.key;
		select.required = Boolean(this.option.required);

		(this.option.fieldOptions ?? []).forEach((fieldOption: FieldOption) => {
			const option = document.createElement('option');
			option.value = fieldOption.value;
			option.textContent = fieldOption.label;
			if (fieldOption.value === this.value) option.selected = true;
			select.appendChild(option);
		});

		return select;
	}
}
