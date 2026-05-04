import { ParamOption } from '../../../global/types/option';

// Параметры для ламели в варианте slider (с position полями, без stop)
export const LAMELI_SLIDER_PARAM_OPTIONS = new Map<string, ParamOption>([
	[
		'open_command_topic',
		{
			label: 'open_command_topic — командный MQTT-топик для открытия',
			fieldType: 'text',
			required: true,
		},
	],
	[
		'close_command_topic',
		{
			label: 'close_command_topic — командный MQTT-топик для закрытия',
			fieldType: 'text',
			required: true,
		},
	],
	[
		'payload_open',
		{
			label: 'payload_open — сообщение для открытия',
			fieldType: 'text',
			required: true,
		},
	],
	[
		'payload_close',
		{
			label: 'payload_close — сообщение для закрытия',
			fieldType: 'text',
			required: true,
		},
	],
	[
		'position_command_topic',
		{
			label: 'position_command_topic — командный MQTT-топик для установки позиции',
			fieldType: 'text',
            required: true,
		},
	],
	[
		'position_state_topic',
		{
			label: 'position_state_topic — MQTT-топик обратной связи для позиции',
			fieldType: 'text',
            required: true,
		},
	],
	[
		'position_open',
		{
			label: 'position_open — конечная позиция в положении открыто',
			fieldType: 'number',
            required: true,
		},
	],
	[
		'position_close',
		{
			label: 'position_close — конечная позиция в положении закрыто',
			fieldType: 'number',
            required: true,
		},
	],
]) as ReadonlyMap<string, ParamOption>;

// Параметры для ламели в варианте buttons (без position полей, со stop)
export const LAMELI_BUTTONS_PARAM_OPTIONS = new Map<string, ParamOption>([
	[
		'open_command_topic',
		{
			label: 'open_command_topic — командный MQTT-топик для открытия',
			fieldType: 'text',
			required: true,
		},
	],
	[
		'close_command_topic',
		{
			label: 'close_command_topic — командный MQTT-топик для закрытия',
			fieldType: 'text',
			required: true,
		},
	],
	[
		'stop_command_topic',
		{
			label: 'stop_command_topic — командный MQTT-топик для остановки',
			fieldType: 'text',
		},
	],
	[
		'payload_open',
		{
			label: 'payload_open — сообщение для открытия',
			fieldType: 'text',
			required: true,
		},
	],
	[
		'payload_close',
		{
			label: 'payload_close — сообщение для закрытия',
			fieldType: 'text',
			required: true,
		},
	],
	[
		'payload_stop',
		{
			label: 'payload_stop — сообщение для остановки',
			fieldType: 'text',
		},
	],
]) as ReadonlyMap<string, ParamOption>;

export function getLameliParamOptions(
	lameliType?: 'slider' | 'buttons',
): ReadonlyMap<string, ParamOption> {
	if (lameliType === 'slider') {
		return LAMELI_SLIDER_PARAM_OPTIONS;
	}
	return LAMELI_BUTTONS_PARAM_OPTIONS;
}
