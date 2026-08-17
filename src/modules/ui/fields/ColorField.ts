import { FieldClass } from '../../../data/enums/classNames';
import { Color } from '../../../data/enums/color';
import { ViewId } from '../../../data/enums/view-id';
import { COLOR_OPTIONS } from '../../../data/settings/options/color-options';
import { ColorOption, ParamOption } from '../../../global/types/option';
import BaseField from './BaseField';

export default class ColorField extends BaseField<string> {
	private outsideClickHandler?: (event: MouseEvent) => void;

	constructor(
		fieldKey: string,
		option: ParamOption,
		initialValue: string | undefined,
	) {
		super(fieldKey, option, initialValue);
	}

	public render(): HTMLDivElement {
		const label = this.buildLabel();
		const button = this.buildButton();
		const list = this.buildList();

		this.rootElement = this.buildDropdown(label, button, list);
		this.inputElement = button;
		return this.rootElement;
	}

	public validate(): boolean {
		const ok = super.validate();
		if (!ok || (this.option.required && !this.value && this.value === '')) {
			this.inputElement!.classList.add(FieldClass.INVALID);
			return false;
		}
		this.inputElement!.classList.remove(FieldClass.INVALID);
		return ok;
	}

	private buildDropdown(
		label: HTMLLabelElement,
		button: HTMLButtonElement,
		list: HTMLDivElement,
	): HTMLDivElement {
		const wrapper = this.wrapField(
			[label, button, list],
			[ViewId.COLOR_DROPDOWN],
		);
		this.attachToggle(button, list, wrapper);
		this.attachOutsideClick(wrapper, list);

		return wrapper;
	}

	private buildButton(): HTMLButtonElement {
		const button = document.createElement('button');
		button.type = 'button';
		button.classList.add('color-dropdown-button');
        
		if (this.value) {
			const option = COLOR_OPTIONS.get(this.value as Color);
			button.innerHTML = `<div class="color-box" style="background-color:${option?.color}"></div><span class="color-label">${option?.label ?? '???'}</span>`;
		} else {
			button.innerHTML = '<span class="color-label">Выберите цвет</span>';
		}
		return button;
	}

	private buildList(): HTMLDivElement {
		const dropdownList = document.createElement('div');
		dropdownList.classList.add(ViewId.COLOR_DROPDOWN_CONTENT);
		dropdownList.style.display = 'none';

		COLOR_OPTIONS.forEach((option: ColorOption, color: Color) => {
			dropdownList.appendChild(
				this.buildOption(option, () => this.selectColor(color, option)),
			);
		});

		return dropdownList;
	}

	private buildOption(
		colorOption: ColorOption,
		onClick: () => void,
	): HTMLDivElement {
		const option = document.createElement('div');
		option.classList.add(ViewId.COLOR_OPTION);

		const box = document.createElement('div');
		box.classList.add(ViewId.COLOR_BOX);
		box.style.backgroundColor = colorOption.color;

		const lbl = document.createElement('span');
		lbl.classList.add(ViewId.COLOR_LABEL);
		lbl.textContent = colorOption.label;

		option.append(box, lbl);
		option.addEventListener('click', onClick);
		return option;
	}

	private selectColor(color: Color, option: ColorOption) {
		this.onInput(color);
		const btn = this.rootElement.querySelector('.color-dropdown-button')!;
		btn.innerHTML = `<div class="color-box" style="background-color:${option.color}"></div><span class="color-label">${option.label}</span>`;
		const list = this.rootElement.querySelector(
			'.color-dropdown-content',
		) as HTMLDivElement;
		list.style.display = 'none';
	}

	private attachToggle(
		button: HTMLButtonElement,
		list: HTMLDivElement,
		wrapper: HTMLDivElement,
	) {
		button.addEventListener('click', () => {
			list.style.display = list.style.display === 'none' ? 'block' : 'none';
		});
	}

	private attachOutsideClick(wrapper: HTMLDivElement, list: HTMLDivElement) {
		this.outsideClickHandler = e => {
			if (!wrapper.contains(e.target as Node)) {
				list.style.display = 'none';
			}
		};
		document.addEventListener('click', this.outsideClickHandler);
	}

	public dispose(): void {
		if (this.outsideClickHandler)
			document.removeEventListener('click', this.outsideClickHandler);
		this.outsideClickHandler = undefined;
		super.dispose();
	}
}
