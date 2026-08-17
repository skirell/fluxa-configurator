import { Color } from '../data/enums/color';
import { ColorFormat } from '../data/enums/color-format';
import { ParamOption } from '../global/types/option';

/**
 * Проверяет, допустимо ли значение, загруженное из JSON.
 * Пустая строка / null / undefined считаются «отсутствием» — валидируются отдельно (presence),
 * здесь возвращаем true, чтобы не дублировать проверку.
 *
 * Возвращает false для «мусора» (например, `color: "xyz"` или `color_type: "abc"`):
 * такое значение нужно сбросить к пустому и показать предупреждение.
 */
export function isLoadedValueValid(option: ParamOption, value: any): boolean {
	if (value === null || value === undefined) return true;
	if (value === '') {
		return !['feature', 'lameli', 'settings'].includes(option.fieldType);
	}

	switch (option.fieldType) {
		case 'color':
			return typeof value === 'string' && (Object.values(Color) as string[]).includes(value);
		case 'color_type':
			return typeof value === 'string' && (Object.values(ColorFormat) as string[]).includes(value);
		case 'options':
			if (!Array.isArray(option.fieldOptions) || option.fieldOptions.length === 0) return true;
			return option.fieldOptions.some(o => o.value === value);
		case 'boolean':
			return typeof value === 'boolean';
		case 'number':
			return typeof value === 'number' && Number.isFinite(value);
		case 'text':
		case 'icon':
			return typeof value === 'string';
		case 'feature':
			return typeof value === 'object' && !Array.isArray(value);
		case 'lameli':
			// вложенные структуры — проверяются отдельно при обработке
			return typeof value === 'object' && !Array.isArray(value);
		case 'settings':
			// Содержимое массива проверяет специализированное поле редактора.
			return Array.isArray(value);
		default:
			return true;
	}
}
