import { Color } from '../data/enums/color';
import { COLOR_OPTIONS } from '../data/settings/options/color-options';
import { ParamOption } from '../global/types/option';

/**
 * Панель обрабатывает feature-объекты в том же порядке, что и прошивка:
 * обычной лексикографической сортировкой ключей (`mode_10` перед `mode_2`).
 */
export function getOrderedFeatureRecords(value: any): Record<string, any>[] {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

	return Object.entries(value)
		.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
		.map(([, record]) =>
			record && typeof record === 'object' && !Array.isArray(record)
				? record
				: {},
		);
}

/**
 * Возвращает последовательный набор ключей уже в порядке прошивки. Благодаря
 * этому даже при 10+ элементах каждая вкладка сохраняет своё место после
 * повторной лексикографической сортировки объекта на панели.
 */
export function buildOrderedFeatureKeys(prefix: string, total: number): string[] {
	return Array.from({ length: total }, (_, index) => `${prefix}${index + 1}`).sort(
		(left, right) => (left < right ? -1 : left > right ? 1 : 0),
	);
}

/** Проверяет тип и, где применимо, допустимое значение feature-поля. */
export function isFeatureFieldValueValid(option: ParamOption, value: any): boolean {
	const empty =
		value === null ||
		value === undefined ||
		value === '' ||
		(typeof value === 'string' && value.trim() === '');
	if (empty) return !option.required;

	switch (option.fieldType) {
		case 'text':
		case 'icon':
			return typeof value === 'string';
		case 'color':
			return typeof value === 'string' && COLOR_OPTIONS.has(value as Color);
		case 'number':
			return typeof value === 'number' && Number.isFinite(value);
		case 'boolean':
			return typeof value === 'boolean';
		case 'options':
			return (option.fieldOptions ?? []).some(item => item.value === value);
		default:
			return true;
	}
}
