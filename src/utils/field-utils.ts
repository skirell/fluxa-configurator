import { FIELD_CONSTRUCTORS_MAP } from '../data/settings/maps/field-constructors-map';
import { ParamOption } from '../global/types/option';
import BaseField from '../modules/ui/fields/BaseField';
import FeaturePanelField from '../modules/ui/fields/FeaturePanelField/FeaturePanelField';

export function createFieldInstance(
	fieldKey: string,
	option: ParamOption,
	initialValue?: any,
): BaseField | undefined {
	if (option.fieldType === 'feature') {
		return new FeaturePanelField(fieldKey, option, initialValue);
	}

	const FieldClass = FIELD_CONSTRUCTORS_MAP[option.fieldType];
	if (!FieldClass) {
		console.warn(`Поле для типа ${option.fieldType} не предусмотрено!`);
		return;
	}
	return new FieldClass(fieldKey, option, initialValue);
}
