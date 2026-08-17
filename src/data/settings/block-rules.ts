import { Device, DeviceVariant } from '../enums/device';
import type Block from '../../modules/components/block/Block';

export interface CrossFieldIssue {
	// поля, к которым относится проблема (первое используется для навигации по клику)
	fieldKeys: string[];
	// сообщение для панели ошибок
	message: string;
}

type BlockRule = (block: Block) => CrossFieldIssue[];

/** Текущее значение поля из UI (живое, в отличие от block.getParam — тот обновляется только при save/load). */
function getValue(block: Block, fieldKey: string): any {
	const field = block.UI.getFields().get(fieldKey);
	return field ? field.getValue() : undefined;
}

function asNum(block: Block, fieldKey: string): number | null {
	const v = getValue(block, fieldKey);
	return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** payload_on ≠ payload_off (switch + все варианты light + оба варианта climate) */
function checkPayloadOnOff(block: Block): CrossFieldIssue[] {
	const on = getValue(block, 'payload_on');
	const off = getValue(block, 'payload_off');
	if (on && off && on === off) {
		return [{
			fieldKeys: ['payload_on', 'payload_off'],
			message: 'Поля «payload_on» и «payload_off» не должны совпадать',
		}];
	}
	return [];
}

/** Числовое поле строго > 0. Используется для brightness_scale (light) и volume_step (music). */
function checkPositive(block: Block, key: string): CrossFieldIssue[] {
	const v = asNum(block, key);
	if (v !== null && v <= 0) {
		return [{
			fieldKeys: [key],
			message: `«${key}» должно быть больше 0`,
		}];
	}
	return [];
}

/** Строго `max > min`. Используется в light_variant_temperature (max_temp/min_temp)
 *  и в climate_variant_* (max_target/min_target). */
function checkStrictGreater(block: Block, maxKey: string, minKey: string): CrossFieldIssue[] {
	const max = asNum(block, maxKey);
	const min = asNum(block, minKey);
	if (max !== null && min !== null && max <= min) {
		return [{
			fieldKeys: [maxKey, minKey],
			message: `«${maxKey}» должно быть больше «${minKey}»`,
		}];
	}
	return [];
}

/** Два числовых поля не должны совпадать (cover_variant_slider: позиции). */
function checkNotEqualNumbers(block: Block, keyA: string, keyB: string): CrossFieldIssue[] {
	const a = asNum(block, keyA);
	const b = asNum(block, keyB);
	if (a !== null && b !== null && a === b) {
		return [{
			fieldKeys: [keyA, keyB],
			message: `«${keyA}» и «${keyB}» не должны совпадать`,
		}];
	}
	return [];
}

function checkInteger(block: Block, key: string): CrossFieldIssue[] {
	const value = asNum(block, key);
	if (value !== null && !Number.isInteger(value)) {
		return [{
			fieldKeys: [key],
			message: `«${key}» должно быть целым числом`,
		}];
	}
	return [];
}

function checkExtendedFanTopics(block: Block): CrossFieldIssue[] {
	const fanModes = getValue(block, 'fan_modes');
	const hasFanModes =
		fanModes &&
		typeof fanModes === 'object' &&
		!Array.isArray(fanModes) &&
		Object.keys(fanModes).length > 0;
	if (!hasFanModes) return [];

	const issues: CrossFieldIssue[] = [];
	for (const key of ['fan_command_topic', 'fan_state_topic']) {
		const value = getValue(block, key);
		if (typeof value !== 'string' || value.trim() === '') {
			issues.push({
				fieldKeys: [key, 'fan_modes'],
				message: `«${key}» обязательно при заполненном «fan_modes»`,
			});
		}
	}
	return issues;
}

/**
 * Правила валидации, которые затрагивают несколько полей сразу —
 * их нельзя выразить через `required`/`optional`/`fieldType` на одном поле.
 * Проверяются для текущего состояния блока и попадают в панель ошибок (красные).
 */
const BASE_RULES: Partial<Record<Device, BlockRule>> = {
	[Device.switch]: checkPayloadOnOff,
	[Device.sensor]: (block) => {
		const issues: CrossFieldIssue[] = [];
		const min = asNum(block, 'min');
		const s1 = asNum(block, 'stage_1');
		const s2 = asNum(block, 'stage_2');
		const max = asNum(block, 'max');
		if (min !== null && s1 !== null && min > s1)
			issues.push({ fieldKeys: ['min', 'stage_1'], message: '«min» не может быть больше «stage_1»' });
		if (s1 !== null && s2 !== null && s1 > s2)
			issues.push({ fieldKeys: ['stage_1', 'stage_2'], message: '«stage_1» не может быть больше «stage_2»' });
		if (s2 !== null && max !== null && s2 > max)
			issues.push({ fieldKeys: ['stage_2', 'max'], message: '«stage_2» не может быть больше «max»' });
		return issues;
	},
	[Device.music]: (block) => [
		...checkPositive(block, 'volume_step'),
		...checkStrictGreater(block, 'volume_max', 'volume_min'),
		// Условное правило про PlayPause_state_topic → pause_command_topic/payload_pause
		// работает автоматически через DependencyManager (см. base-param-options.ts):
		// когда PlayPause_state_topic непустой, required у этих полей становится true,
		// и обычная проверка required-empty даёт нужную ошибку.
	],
};

const VARIANT_RULES: Partial<Record<DeviceVariant, BlockRule>> = {
	[DeviceVariant.light_variant_OnOff]: checkPayloadOnOff,
	[DeviceVariant.light_variant_dimmer]: (block) => [
		...checkPayloadOnOff(block),
		...checkPositive(block, 'brightness_scale'),
	],
	[DeviceVariant.light_variant_color]: (block) => [
		...checkPayloadOnOff(block),
		...checkPositive(block, 'brightness_scale'),
	],
	[DeviceVariant.light_variant_temperature]: (block) => [
		...checkPayloadOnOff(block),
		...checkPositive(block, 'brightness_scale'),
		...checkStrictGreater(block, 'max_temp', 'min_temp'),
	],
	[DeviceVariant.climate_variant_thermostat]: (block) => [
		...checkPayloadOnOff(block),
		...checkStrictGreater(block, 'max_target', 'min_target'),
	],
	[DeviceVariant.climate_variant_cond]: (block) => [
		...checkPayloadOnOff(block),
		...checkStrictGreater(block, 'max_target', 'min_target'),
	],
	[DeviceVariant.climate_variant_cond_extended]: (block) => [
		...checkPayloadOnOff(block),
		...checkStrictGreater(block, 'max_target', 'min_target'),
		...checkInteger(block, 'min_target'),
		...checkInteger(block, 'max_target'),
		...checkExtendedFanTopics(block),
	],
	[DeviceVariant.cover_variant_slider]: (block) => [
		...checkNotEqualNumbers(block, 'position_open', 'position_close'),
		...checkNotEqualNumbers(block, 'help_position_open', 'help_position_close'),
		...checkNotEqualNumbers(block, 'position_open', 'help_position_close'),
		...checkNotEqualNumbers(block, 'help_position_open', 'position_close'),
	],
	// cover_variant_buttons: кросс-полевых правил нет — orientation валидируется
	// автоматически через fieldType: 'options', payload_open/close не проверяются Java на различие.
};

export function getBlockIssues(block: Block): CrossFieldIssue[] {
	const issues: CrossFieldIssue[] = [];
	if (block.Device) {
		const rule = BASE_RULES[block.Device];
		if (rule) issues.push(...rule(block));
	}
	if (block.DeviceVariant) {
		const rule = VARIANT_RULES[block.DeviceVariant];
		if (rule) issues.push(...rule(block));
	}
	return issues;
}
