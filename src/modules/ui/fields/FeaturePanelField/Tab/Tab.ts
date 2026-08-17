import { VALUES } from '../../../../../data/constants/values';
import { Feature } from '../../../../../data/enums/feature';
import { PathType } from '../../../../../data/enums/path';
import { PATH_MAP } from '../../../../../data/settings/maps/path-map';
import { isFeatureFieldValueValid } from '../../../../../utils/feature-validation';
import { setByPath } from '../../../../../utils/path-utils';
import BaseField from '../../BaseField';
import TabUI from './TabUI';

export default class Tab implements IJsonSerializable {
	private readonly data: TabData = {};
	public readonly UI: TabUI = new TabUI(this);

	constructor(private readonly feature: Feature) {}

	public get Feature(): typeof this.feature {
		return this.feature;
	}

	public setParam(fieldKey: string, value: any): void {
		this.data[fieldKey] = value;
	}

	public getParam(fieldKey: string): any {
		return this.data[fieldKey];
	}

	public dispose(): void {
		this.UI.clearFields();
	}

	public validateFields(): boolean {
		this.UI.generateFields();
		const fields = this.UI.getFields();
		let valid = true;
		fields.forEach(field => {
			if (!this.validateField(field)) valid = false;
		});
		return valid;
	}

	public getInvalidFields(): BaseField[] {
		this.UI.generateFields();
		return [...this.UI.getFields().values()].filter(
			field => !this.validateField(field),
		);
	}

	public save(): boolean {
		// Записываем значения всегда (в т.ч. невалидные / пустые) — это позволяет
		// сохранить «грязный» JSON и увидеть ошибки в панели, а не терять данные молча.
		this.UI.generateFields();
		const fields = this.UI.getFields();
		fields.forEach(field => {
			const option = field.option;
			const value = field.getValue() ?? '';
			const path = option.savePath ?? PATH_MAP.get(PathType.base);

			setByPath(this, `${path}${VALUES.PATH_SEPARATOR}${field.key}`, value);
		});

		return this.validateFields();
	}

	public toJSON(): SerializedTab {
		return {
			...this.data,
		};
	}

	private validateField(field: BaseField): boolean {
		const valid =
			field.validate() &&
			isFeatureFieldValueValid(field.option, field.getValue());
		field.setInvalidState(!valid);
		return valid;
	}
}
