import { ColorFormat } from '../../../data/enums/color-format';
import { COLOR_FORMAT_OPTIONS, COLOR_FORMAT_ORDER } from '../../../data/settings/options/color-format-options';
import { ParamOption } from '../../../global/types/option';
import BaseField from './BaseField';

export class ColorFormatField extends BaseField<string> {
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

		if (!this.option.required) {
			const emptyOption = document.createElement('option');
			emptyOption.value = '';
			emptyOption.textContent = 'Выберите формат';
			select.appendChild(emptyOption);
		}

		COLOR_FORMAT_ORDER.forEach((format: ColorFormat) => {
			const optionData = COLOR_FORMAT_OPTIONS.get(format);
			if (optionData) {
				const option = document.createElement('option');
				option.value = format;
				option.textContent = optionData.label;
				if (format === this.value) option.selected = true;
				select.appendChild(option);
			}
		});

		return select;
	}
}
