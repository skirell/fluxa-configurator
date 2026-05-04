import { ParamOption } from '../../../global/types/option';
import { Device } from '../../enums/device';
import { Feature } from '../../enums/feature';
import { Action } from '../../enums/action';
import { Operator } from '../../enums/operator';

export const BASE_PARAM_OPTIONS = new Map<Device, Map<string, ParamOption>>([
	[
		Device.scene,
		new Map<string, ParamOption>([
			[
				'param_1',
				{
					label: 'param_1 — Маленький текст',
					fieldType: 'text',
				},
			],
			[
				'param_2',
				{
					label: 'param_2 — Средний текст',
					fieldType: 'text',
				},
			],
			[
				'param_3',
				{
					label: 'param_3 — Большой текст',
					fieldType: 'text',
				},
			],
			[
				'icon',
				{
					label: 'icon — Иконка блока',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
			[
				'command_topic',
				{
					label: 'command_topic — MQTT-топик для отправки команды',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload',
				{
					label: 'payload — Команда(Сообщение) для отправки в MQTT-топик',
					fieldType: 'text',
					required: true,
				},
			],
		]),
	],
	[
		Device.sensor,
		new Map<string, ParamOption>([
			[
				'param_1',
				{
					label: 'param_1 — Подпись к датчику',
					fieldType: 'text',
				},
			],
			[
				'measure',
				{
					label: 'measure — Единица измерения',
					fieldType: 'text',
				},
			],
			[
				'min',
				{
					label: 'min — Минимальная граница диапазона',
					fieldType: 'number',
					required: true,
				},
			],
			[
				'stage_1',
				{
					label: 'stage_1 — Граница между 1-м и 2-м диапазонами',
					fieldType: 'number',
					required: true,
				},
			],
			[
				'stage_2',
				{
					label: 'stage_2 — Граница между 2-м и 3-м диапазонами',
					fieldType: 'number',
					required: true,
				},
			],
			[
				'max',
				{
					label: 'max — Максимальная граница диапазона',
					fieldType: 'number',
					required: true,
				},
			],
			[
				'color_1',
				{
					label: 'color_1 — Цвет при значении ниже stage_1',
					fieldType: 'color',
					required: true,
				},
			],
			[
				'color_2',
				{
					label: 'color_2 — Цвет при значении между stage_1 и stage_2',
					fieldType: 'color',
					required: true,
				},
			],
			[
				'color_3',
				{
					label: 'color_3 — Цвет при значении выше stage_2',
					fieldType: 'color',
					required: true,
				},
			],
			[
				'state_topic',
				{
					label: 'state_topic — MQTT-топик состояния датчика',
					fieldType: 'text',
					required: true,
				},
			],
		]),
	],
	[
		Device.light,
		new Map<string, ParamOption>([
			[
				'param_1',
				{
					label: 'param_1 — Маленький текст',
					fieldType: 'text',
				},
			],
			[
				'param_2',
				{
					label: 'param_2 — Средний текст',
					fieldType: 'text',
				},
			],
			[
				'setting_name',
				{
					label: 'setting_name — Заголовок страницы управления',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'icon',
				{
					label: 'icon — Иконка блока',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
		]),
	],
	[
		Device.cover,
		new Map<string, ParamOption>([
			[
				'param_1',
				{
					label: 'param_1 — Маленький текст',
					fieldType: 'text',
				},
			],
			[
				'param_2',
				{
					label: 'param_2 — Средний текст',
					fieldType: 'text',
				},
			],
			[
				'setting_name',
				{
					label: 'setting_name — Заголовок страницы управления',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'icon_open',
				{
					label: 'icon_open — Иконка (открыто)',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
			[
				'icon_close',
				{
					label: 'icon_close — Иконка (закрыто)',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
		]),
	],
	[
		Device.climate,
		new Map<string, ParamOption>([
			[
				'param_1',
				{
					label: 'param_1 — Маленький текст',
					fieldType: 'text',
				},
			],
			[
				'param_2',
				{
					label: 'param_2 — Средний текст',
					fieldType: 'text',
				},
			],
			[
				'setting_name',
				{
					label: 'setting_name — Заголовок страницы управления',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'icon',
				{
					label: 'icon — Иконка блока',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
			[
				'measure',
				{
					label: 'measure — Единица измерения уставки',
					fieldType: 'text',
				},
			],
			[
				'color',
				{
					label: 'color — Цвет в активном состоянии',
					fieldType: 'color',
					required: true,
				},
			],
		]),
	],
	[
		Device.switch,
		new Map<string, ParamOption>([
			[
				'param_1',
				{
					label: 'param_1 — Маленький текст',
					fieldType: 'text',
				},
			],
			[
				'param_2',
				{
					label: 'param_2 — Средний текст',
					fieldType: 'text',
				},
			],
			[
				'icon',
				{
					label: 'icon — Иконка блока',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
			[
				'color',
				{
					label: 'color — Цвет в активном состоянии',
					fieldType: 'color',
					required: true,
				},
			],
			[
				'OnOff_command_topic',
				{
					label: 'OnOff_command_topic — MQTT-топик для отправки команды',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'OnOff_state_topic',
				{
					label: 'OnOff_state_topic — MQTT-топик обратной связи для получения команды',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload_on',
				{
					label: 'payload_on — команда включения',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload_off',
				{
					label: 'payload_off — команда выключения',
					fieldType: 'text',
					required: true,
				},
			],
		]),
	],
	[
		Device.music,
		new Map<string, ParamOption>([
			[
				'param_1',
				{
					label: 'param_1 — Маленький текст',
					fieldType: 'text',
				},
			],
			[
				'param_2',
				{
					label: 'param_2 — Средний текст',
					fieldType: 'text',
				},
			],
			[
				'param_3',
				{
					label: 'param_3 — Крупный текст',
					fieldType: 'text',
				},
			],
			[
				'icon',
				{
					label: 'icon — Иконка блока',
					fieldType: 'icon',
					placeholder: '',
					required: true,
				},
			],
			[
				'setting_name',
				{
					label: 'setting_name — Название в экране настроек',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'mute_command_topic',
				{
					label: 'mute_command_topic — MQTT-топик для отправки команды mute',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'mute_state_topic',
				{
					label: 'mute_state_topic — MQTT-топик для получения состояния mute',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload_mute_on',
				{
					label: 'payload_mute_on — Сообщение включения mute',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload_mute_off',
				{
					label: 'payload_mute_off — Сообщение выключения mute',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'artist_state_topic',
				{
					label: 'artist_state_topic — MQTT-топик для получения имени исполнителя',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'name_state_topic',
				{
					label: 'name_state_topic — MQTT-топик для получения названия трека',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'channels',
				{
					// В Java channels — опциональный Map (null / отсутствие / пустой = OK).
					label: 'channels — Список каналов / пресетов',
					fieldType: 'feature',
					feature: Feature.channels,
					featurePanelSettings: {
						maxCount: 5,
						minCount: 0,
						keyPrefix: '',
					},
					optional: true,
				},
			],
			[
				'prev_command_topic',
				{
					label: 'prev_command_topic — MQTT-топик для команды предыдущий трек',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'PlayPause_state_topic',
				{
					label: 'PlayPause_state_topic — MQTT-топик для получения состояния воспроизведения',
					fieldType: 'text',
				},
			],
			[
				'play_command_topic',
				{
					label: 'play_command_topic — MQTT-топик для команды воспроизвести',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'pause_command_topic',
				{
					label: 'pause_command_topic — MQTT-топик для команды пауза',
					fieldType: 'text',
					fieldSettings: {
						behavior: {
							dependencies: [
								{
									fieldKey: 'PlayPause_state_topic',
									operator: Operator.empty,
								},
							],
							actions: {
								true: [{ type: Action.setState, key: 'required', value: false }],
								false: [{ type: Action.setState, key: 'required', value: true }],
							},
						},
					},
				},
			],
			[
				'next_command_topic',
				{
					label: 'next_command_topic — MQTT-топик для команды следующий трек',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload_prev',
				{
					label: 'payload_prev — Сообщение для предыдущего трека',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload_play',
				{
					label: 'payload_play — Сообщение для воспроизведения',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload_pause',
				{
					label: 'payload_pause — Сообщение для паузы',
					fieldType: 'text',
					fieldSettings: {
						behavior: {
							dependencies: [
								{
									fieldKey: 'PlayPause_state_topic',
									operator: Operator.empty,
								},
							],
							actions: {
								true: [{ type: Action.setState, key: 'required', value: false }],
								false: [{ type: Action.setState, key: 'required', value: true }],
							},
						},
					},
				},
			],
			[
				'payload_next',
				{
					label: 'payload_next — Сообщение для следующего трека',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'volume_command_topic',
				{
					label: 'volume_command_topic — MQTT-топик для отправки команды громкости',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'volume_state_topic',
				{
					label: 'volume_state_topic — MQTT-топик для получения текущей громкости',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'volume_step',
				{
					label: 'volume_step — Шаг изменения громкости',
					fieldType: 'number',
					required: true,
				},
			],
			[
				'volume_min',
				{
					label: 'volume_min — Минимальное значение громкости',
					fieldType: 'number',
					required: true,
				},
			],
			[
				'volume_max',
				{
					label: 'volume_max — Максимальное значение громкости',
					fieldType: 'number',
					required: true,
				},
			],
		]),
	],
]) as ReadonlyMap<Device, ReadonlyMap<string, ParamOption>>;
