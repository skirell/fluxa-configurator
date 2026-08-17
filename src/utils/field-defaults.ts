import { ParamOption } from '../global/types/option';

/**
 * Возвращает значение по умолчанию для поля — используется, когда
 * ключ отсутствует в JSON или нужно гарантировать его наличие в выгрузке.
 */
export function getDefaultValueForField(option: ParamOption): any {
	switch (option.fieldType) {
		case 'number':
			return 0;
		case 'boolean':
			return false;
		case 'feature':
		case 'lameli':
			return null;
		case 'settings':
			return [];
		case 'text':
		case 'color':
		case 'color_type':
		case 'options':
		case 'icon':
		default:
			return '';
	}
}
