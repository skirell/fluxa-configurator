import { ParamOption } from '../../../global/types/option';
import BaseField from './BaseField';

export default class BooleanField extends BaseField {
	constructor(
		fieldKey: string,
		option: ParamOption,
		initialValue: string | undefined,
	) {
		super(fieldKey, option, initialValue);
	}

	render(): HTMLElement {
		const label = this.buildLabel();
		const toggle = this.buildToggle();

		this.rootElement = this.wrapField([label, toggle], ['toggle-switch']);
		this.inputElement = toggle;

		return this.rootElement;
	}

	private buildToggle(): HTMLElement {
		const toggleWrapper = document.createElement('label');
		toggleWrapper.id = 'toggle-switch';
		toggleWrapper.className = 'toggle-switch';

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = Boolean(this.value);
		checkbox.id = this.key;
		checkbox.addEventListener('change', () => {
			this.onInput(checkbox.checked);
		});

		const slider = document.createElement('span');
		slider.className = 'slider';

		toggleWrapper.appendChild(checkbox);
		toggleWrapper.appendChild(slider);
		return toggleWrapper;
	}
}
