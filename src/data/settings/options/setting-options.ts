import { SettingType } from '../../enums/setting';

export type SettingInputType = 'text' | 'number' | 'enum-options';

export interface SettingFieldOption {
	key: string;
	label: string;
	inputType: SettingInputType;
	required?: true;
	optional?: true;
}

export const SETTING_TYPE_OPTIONS = new Map<SettingType, string>([
	[SettingType.pushbutton, 'Кнопка действия'],
	[SettingType.switch, 'Переключатель'],
	[SettingType.text, 'Редактируемый текст'],
	[SettingType.text_read_only, 'Текст только для чтения'],
	[SettingType.enum, 'Выбор из списка'],
	[SettingType.range, 'Числовой регулятор'],
]) as ReadonlyMap<SettingType, string>;

const TITLE_FIELD: SettingFieldOption = {
	key: 'title',
	label: 'title — Подпись элемента',
	inputType: 'text',
	required: true,
};

const STATE_TOPIC_FIELD: SettingFieldOption = {
	key: 'state_topic',
	label: 'state_topic — MQTT-топик текущего состояния',
	inputType: 'text',
	required: true,
};

const COMMAND_TOPIC_FIELD: SettingFieldOption = {
	key: 'command_topic',
	label: 'command_topic — MQTT-топик для отправки команды',
	inputType: 'text',
	required: true,
};

export const SETTING_FIELD_OPTIONS = new Map<
	SettingType,
	readonly SettingFieldOption[]
>([
	[
		SettingType.pushbutton,
		[
			TITLE_FIELD,
			COMMAND_TOPIC_FIELD,
			{
				key: 'payload',
				label: 'payload — Сообщение при нажатии',
				inputType: 'text',
				required: true,
			},
		],
	],
	[
		SettingType.switch,
		[
			TITLE_FIELD,
			STATE_TOPIC_FIELD,
			COMMAND_TOPIC_FIELD,
			{
				key: 'payload_on',
				label: 'payload_on — Команда включения',
				inputType: 'text',
				required: true,
			},
			{
				key: 'payload_off',
				label: 'payload_off — Команда выключения',
				inputType: 'text',
				required: true,
			},
		],
	],
	[SettingType.text, [TITLE_FIELD, STATE_TOPIC_FIELD, COMMAND_TOPIC_FIELD]],
	[SettingType.text_read_only, [TITLE_FIELD, STATE_TOPIC_FIELD]],
	[
		SettingType.enum,
		[
			TITLE_FIELD,
			STATE_TOPIC_FIELD,
			COMMAND_TOPIC_FIELD,
			{
				key: 'options',
				label: 'options — Варианты выбора',
				inputType: 'enum-options',
				required: true,
			},
		],
	],
	[
		SettingType.range,
		[
			TITLE_FIELD,
			STATE_TOPIC_FIELD,
			COMMAND_TOPIC_FIELD,
			{
				key: 'min',
				label: 'min — Нижняя граница',
				inputType: 'number',
				required: true,
			},
			{
				key: 'max',
				label: 'max — Верхняя граница',
				inputType: 'number',
				required: true,
			},
			{
				key: 'step',
				label: 'step — Шаг изменения',
				inputType: 'number',
				required: true,
			},
			{
				key: 'measure',
				label: 'measure — Единица измерения',
				inputType: 'text',
				optional: true,
			},
		],
	],
]) as ReadonlyMap<SettingType, readonly SettingFieldOption[]>;
