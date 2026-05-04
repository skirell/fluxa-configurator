import { VALUES } from '../../../../../data/constants/values';
import { Feature } from '../../../../../data/enums/feature';
import { PathType } from '../../../../../data/enums/path';
import { PATH_MAP } from '../../../../../data/settings/maps/path-map';
import { setByPath } from '../../../../../utils/path-utils';
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

	public validateFields(): boolean {
		let allValid = true;

		const fields = this.UI.getFields();
		fields.forEach(field => {
			if (!field.validate()) allValid = false;
		});

		return allValid;
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
}
