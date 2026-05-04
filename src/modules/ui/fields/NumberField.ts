import { ParamOption } from '../../../global/types/option';
import BaseField from './BaseField';

export class NumberField<T> extends BaseField {
	protected inputElement!: HTMLInputElement;

	constructor(fieldKey: string, option: ParamOption, initialValue?: T) {
		super(fieldKey, option, initialValue);
	}

	public render(): HTMLElement {
		const label = this.buildLabel();
		const input = this.buildInputElement('number');
		input.addEventListener('input', () => this.onInput(input.value));

		this.rootElement = this.wrapField([label, input]);
		this.inputElement = input;
		return this.rootElement;
	}

	public getValue(): number {
		return Number(this.inputElement.value);
	}
}
