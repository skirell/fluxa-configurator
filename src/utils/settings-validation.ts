import { SettingType } from '../data/enums/setting';
import {
	SETTING_FIELD_OPTIONS,
	SETTING_TYPE_OPTIONS,
} from '../data/settings/options/setting-options';

export interface SettingValidationIssue {
	itemIndex: number;
	fieldKey: string;
	message: string;
	optionIndex?: number;
}

const RANGE_ABS_LIMIT = 1_000_000;
const RANGE_MAX_STEPS = 10_000;

export function validateSettings(value: any): SettingValidationIssue[] {
	const issues: SettingValidationIssue[] = [];
	if (!Array.isArray(value) || value.length === 0) {
		issues.push({
			itemIndex: -1,
			fieldKey: 'settings',
			message: 'Добавьте минимум один элемент в settings',
		});
		return issues;
	}

	value.forEach((rawItem: any, itemIndex: number) => {
		const item =
			rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
				? rawItem
				: {};
		const type = item.type;
		if (!SETTING_TYPE_OPTIONS.has(type as SettingType)) {
			issues.push({
				itemIndex,
				fieldKey: 'type',
				message: 'выберите допустимый type',
			});
		}

		const fields = SETTING_FIELD_OPTIONS.get(type as SettingType) ?? [
			{
				key: 'title',
				label: 'title',
				inputType: 'text' as const,
				required: true as const,
			},
		];
		for (const field of fields) {
			const fieldValue = item[field.key];
			if (
				!field.required &&
				(fieldValue === undefined ||
					fieldValue === null ||
					fieldValue === '')
			)
				continue;
			if (field.inputType === 'enum-options') {
				if (!Array.isArray(fieldValue) || fieldValue.length < 2) {
					issues.push({
						itemIndex,
						fieldKey: field.key,
						message: 'options должен содержать минимум два варианта',
					});
				}
				continue;
			}

			const valid =
				field.inputType === 'number'
					? typeof fieldValue === 'number' && Number.isFinite(fieldValue)
					: typeof fieldValue === 'string' && fieldValue.trim() !== '';
			if (!valid) {
				issues.push({
					itemIndex,
					fieldKey: field.key,
					message: field.required
						? `поле «${field.key}» обязательно`
						: `поле «${field.key}» должно иметь тип ${field.inputType}`,
				});
			}
		}

		if (type === SettingType.switch) validateSwitch(item, itemIndex, issues);
		if (type === SettingType.enum) validateEnumOptions(item, itemIndex, issues);
		if (type === SettingType.range) validateRange(item, itemIndex, issues);
	});

	return issues;
}

function validateSwitch(
	item: Record<string, any>,
	itemIndex: number,
	issues: SettingValidationIssue[],
): void {
	const on = item.payload_on;
	const off = item.payload_off;
	if (
		typeof on === 'string' &&
		on !== '' &&
		typeof off === 'string' &&
		off !== '' &&
		on === off
	) {
		issues.push({
			itemIndex,
			fieldKey: 'payload_on',
			message: 'payload_on и payload_off не должны совпадать',
		});
	}
}

function validateEnumOptions(
	item: Record<string, any>,
	itemIndex: number,
	issues: SettingValidationIssue[],
): void {
	if (!Array.isArray(item.options)) return;
	item.options.forEach((option: any, optionIndex: number) => {
		for (const key of ['title', 'payload'] as const) {
			if (
				!option ||
				typeof option !== 'object' ||
				typeof option[key] !== 'string' ||
				option[key].trim() === ''
			) {
				issues.push({
					itemIndex,
					optionIndex,
					fieldKey: key,
					message: `вариант ${optionIndex + 1} · поле «${key}» обязательно`,
				});
			}
		}
	});
}

function validateRange(
	item: Record<string, any>,
	itemIndex: number,
	issues: SettingValidationIssue[],
): void {
	const numericKeys = ['min', 'max', 'step'] as const;
	const values = numericKeys.map(key => item[key]);

	numericKeys.forEach((key, index) => {
		const fieldValue = values[index];
		if (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue)) return;
		if (fieldValue < -RANGE_ABS_LIMIT || fieldValue > RANGE_ABS_LIMIT) {
			issues.push({
				itemIndex,
				fieldKey: key,
				message: `«${key}» должен быть от -1000000 до 1000000`,
			});
		}
		if (decimalPlaces(fieldValue) > 3) {
			issues.push({
				itemIndex,
				fieldKey: key,
				message: `«${key}» допускает не более трёх знаков после точки`,
			});
		}
	});

	const [min, max, step] = values;
	if (
		typeof min !== 'number' ||
		!Number.isFinite(min) ||
		typeof max !== 'number' ||
		!Number.isFinite(max) ||
		typeof step !== 'number' ||
		!Number.isFinite(step)
	)
		return;

	if (max <= min) {
		issues.push({
			itemIndex,
			fieldKey: 'max',
			message: 'max должен быть строго больше min',
		});
	}
	if (step <= 0) {
		issues.push({
			itemIndex,
			fieldKey: 'step',
			message: 'step должен быть больше нуля',
		});
	}
	const scaledSpan = Math.round((max - min) * 1000);
	const scaledStep = Math.round(step * 1000);
	if (
		max > min &&
		step > 0 &&
		scaledStep > 0 &&
		scaledSpan / scaledStep > RANGE_MAX_STEPS
	) {
		issues.push({
			itemIndex,
			fieldKey: 'step',
			message: 'диапазон должен содержать не более 10000 шагов',
		});
	}
}

function decimalPlaces(value: number): number {
	const [coefficient, exponentText] = value.toString().toLowerCase().split('e');
	const fractionLength = coefficient.split('.')[1]?.length ?? 0;
	const exponent = exponentText ? Number(exponentText) : 0;
	return Math.max(0, fractionLength - exponent);
}
