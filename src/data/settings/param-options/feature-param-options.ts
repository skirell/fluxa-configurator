import { ParamOption } from '../../../global/types/option';
import { Feature } from '../../enums/feature';

export const FEATURE_PARAM_OPTIONS = new Map<Feature, Map<string, ParamOption>>([
	[
		Feature.modes,
		new Map<string, ParamOption>([
			[
				'title',
				{
					label: 'title — названия в настройках',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'color',
				{
					label: 'color — цвет кругового ползунка',
					fieldType: 'color',
					required: true,
				},
			],
			[
				'icon',
				{
					label: 'icon — иконка',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
			[
				'payload',
				{
					label: 'payload — сообщение для MQTT-топиков',
					fieldType: 'text',
					required: true,
				},
			],
		]),
	],
	[
		Feature.fan_mode,
		new Map<string, ParamOption>([
			[
				'icon',
				{
					label: 'icon — иконка',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
			[
				'payload',
				{
					label: 'payload — сообщение для MQTT-топиков',
					fieldType: 'text',
					required: true,
				},
			],
		]),
	],
	[
		Feature.fan_mode_extended,
		new Map<string, ParamOption>([
			[
				'title',
				{
					label: 'title — название скорости вентилятора',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload',
				{
					label: 'payload — сообщение для MQTT-топиков',
					fieldType: 'text',
					required: true,
				},
			],
		]),
	],
	[
		Feature.sensors,
		new Map<string, ParamOption>([
			[
				'icon',
				{
					label: 'icon — иконка, отображаемая в настройках',
					fieldType: 'icon',
                    placeholder: '',
					required: true,
				},
			],
			[
				'measure',
				{
					label: 'measure — единица измерения',
					fieldType: 'text',
				},
			],
			[
				'state_topic',
				{
					label: 'state_topic — MQTT-топик обратной связи',
					fieldType: 'text',
					required: true,
				},
			],
		]),
	],
	[
		Feature.channels,
		new Map<string, ParamOption>([
			[
				'icon',
				{
					label: 'icon — иконка канала',
					fieldType: 'icon',
					placeholder: '',
					required: true,
				},
			],
			[
				'title',
				{
					label: 'title — название канала',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'command_topic',
				{
					label: 'command_topic — командный MQTT-топик переключения на канал',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'state_topic',
				{
					label: 'state_topic — MQTT-топик обратной связи активного канала',
					fieldType: 'text',
					required: true,
				},
			],
			[
				'payload',
				{
					label: 'payload — сообщение для переключения на канал',
					fieldType: 'text',
					required: true,
				},
			],
		]),
	],
]) as ReadonlyMap<Feature, ReadonlyMap<string, ParamOption>>;
