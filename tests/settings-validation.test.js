const test = require('node:test');
const assert = require('node:assert/strict');

const { Device, DeviceVariant } = require('../out/data/enums/device');
const { Feature } = require('../out/data/enums/feature');
const {
	DEVICE_VARIANT_MAP,
} = require('../out/data/settings/maps/device-variant-map');
const {
	BASE_PARAM_OPTIONS,
} = require('../out/data/settings/param-options/base-param-options');
const {
	FEATURE_PARAM_OPTIONS,
} = require('../out/data/settings/param-options/feature-param-options');
const {
	VARIANT_PARAM_OPTIONS,
} = require('../out/data/settings/param-options/variant-param-options');
const Block = require('../out/modules/components/block/Block').default;
const { getBlockIssues } = require('../out/data/settings/block-rules');
const {
	buildOrderedFeatureKeys,
	getOrderedFeatureRecords,
	isFeatureFieldValueValid,
} = require('../out/utils/feature-validation');
const { validateSettings } = require('../out/utils/settings-validation');
const { isLoadedValueValid } = require('../out/utils/field-value-validation');

const allSettingTypes = [
	{
		type: 'pushbutton',
		title: 'Перезапустить',
		command_topic: 'device/restart/set',
		payload: 'PRESS',
	},
	{
		type: 'switch',
		title: 'Экорежим',
		state_topic: 'device/eco/state',
		command_topic: 'device/eco/set',
		payload_on: 'ON',
		payload_off: 'OFF',
	},
	{
		type: 'text',
		title: 'Название',
		state_topic: 'device/name/state',
		command_topic: 'device/name/set',
	},
	{
		type: 'text_read_only',
		title: 'Версия',
		state_topic: 'device/version',
	},
	{
		type: 'enum',
		title: 'Профиль',
		state_topic: 'device/profile/state',
		command_topic: 'device/profile/set',
		options: [
			{ title: 'Дом', payload: 'home' },
			{ title: 'Ночь', payload: 'night' },
		],
	},
	{
		type: 'range',
		title: 'Коррекция',
		state_topic: 'device/offset/state',
		command_topic: 'device/offset/set',
		min: -5,
		max: 5,
		step: 0.1,
		measure: '°C',
	},
];

test('все шесть документированных типов settings проходят проверку', () => {
	assert.deepEqual(validateSettings(allSettingTypes), []);
});

test('settings обязателен и не может быть пустым', () => {
	assert.equal(validateSettings([])[0].itemIndex, -1);
	assert.equal(validateSettings(null)[0].fieldKey, 'settings');
});

test('switch требует разные payload_on и payload_off', () => {
	const issues = validateSettings([
		{
			type: 'switch',
			title: 'Питание',
			state_topic: 'state',
			command_topic: 'set',
			payload_on: '1',
			payload_off: '1',
		},
	]);
	assert.ok(issues.some(issue => issue.message.includes('не должны совпадать')));
});

test('enum требует минимум два полностью заполненных варианта', () => {
	const issues = validateSettings([
		{
			type: 'enum',
			title: 'Режим',
			state_topic: 'state',
			command_topic: 'set',
			options: [{ title: '', payload: 'one' }],
		},
	]);
	assert.ok(issues.some(issue => issue.fieldKey === 'options'));
	assert.ok(
		issues.some(issue => issue.optionIndex === 0 && issue.fieldKey === 'title'),
	);
});

test('range применяет границы, точность, положительный шаг и лимит шагов', () => {
	const makeRange = overrides => ({
		type: 'range',
		title: 'Диапазон',
		state_topic: 'state',
		command_topic: 'set',
		min: 0,
		max: 10,
		step: 1,
		...overrides,
	});

	assert.ok(
		validateSettings([makeRange({ max: 0 })]).some(issue =>
			issue.message.includes('строго больше'),
		),
	);
	assert.ok(
		validateSettings([makeRange({ step: 0 })]).some(issue =>
			issue.message.includes('больше нуля'),
		),
	);
	assert.ok(
		validateSettings([makeRange({ min: -1_000_001 })]).some(issue =>
			issue.message.includes('-1000000'),
		),
	);
	assert.ok(
		validateSettings([makeRange({ step: 0.0001 })]).some(issue =>
			issue.message.includes('трёх знаков'),
		),
	);
	assert.ok(
		validateSettings([makeRange({ max: 100_000, step: 1 })]).some(issue =>
			issue.message.includes('10000 шагов'),
		),
	);
	assert.ok(
		validateSettings([makeRange({ measure: 42 })]).some(
			issue => issue.fieldKey === 'measure',
		),
	);
	assert.deepEqual(
		validateSettings([makeRange({ min: -1, max: 1409, step: 0.141 })]),
		[],
	);
});

test('новые реестры устройств и подтипов согласованы', () => {
	assert.ok(BASE_PARAM_OPTIONS.has(Device.device));
	for (const key of ['param_1', 'param_2', 'param_3', 'state_topic'])
		assert.equal(BASE_PARAM_OPTIONS.get(Device.device).get(key).optional, true);
	assert.deepEqual(
		DEVICE_VARIANT_MAP.get(Device.climate).includes(
			DeviceVariant.climate_variant_cond_extended,
		),
		true,
	);
	assert.ok(
		VARIANT_PARAM_OPTIONS.has(DeviceVariant.climate_variant_cond_extended),
	);
	assert.deepEqual(
		[...FEATURE_PARAM_OPTIONS.get(Feature.fan_mode_extended).keys()],
		['title', 'payload'],
	);
});

test('feature-записи сортируются как в панели и строго проверяют типы', () => {
	assert.deepEqual(
		getOrderedFeatureRecords({
			mode_10: { title: '10' },
			mode_2: { title: '2' },
			mode_1: { title: '1' },
		}).map(item => item.title),
		['1', '10', '2'],
	);

	const modeOptions = FEATURE_PARAM_OPTIONS.get(Feature.modes);
	assert.equal(isFeatureFieldValueValid(modeOptions.get('title'), 42), false);
	assert.equal(
		isFeatureFieldValueValid(modeOptions.get('color'), 'unknown_color'),
		false,
	);
	assert.equal(
		isFeatureFieldValueValid(modeOptions.get('color'), 'color_blue'),
		true,
	);
	const featureOption = VARIANT_PARAM_OPTIONS.get(
		DeviceVariant.climate_variant_cond_extended,
	).get('fan_modes');
	assert.equal(isLoadedValueValid(featureOption, []), false);
	assert.equal(isLoadedValueValid(featureOption, ''), false);
	assert.equal(isLoadedValueValid(featureOption, null), true);

	const tenModes = Object.fromEntries(
		buildOrderedFeatureKeys('mode_', 10).map((key, index) => [
			key,
			{ title: String(index + 1) },
		]),
	);
	assert.deepEqual(
		getOrderedFeatureRecords(tenModes).map(item => item.title),
		['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
	);
});

test('settings сериализуется в data у device и в data.variant у extended climate', () => {
	const device = new Block({});
	device.Device = Device.device;
	const deviceOption = BASE_PARAM_OPTIONS.get(Device.device).get('settings');
	device.UI.fields.set('settings', { key: 'settings', option: deviceOption });
	device.setParam('settings', allSettingTypes);
	assert.deepEqual(device.toJSON().data.settings, allSettingTypes);
	assert.equal(device.toJSON().data.variant, undefined);

	const climate = new Block({});
	climate.Device = Device.climate;
	climate.DeviceVariant = DeviceVariant.climate_variant_cond_extended;
	const variantOptions = VARIANT_PARAM_OPTIONS.get(
		DeviceVariant.climate_variant_cond_extended,
	);
	const settingsOption = variantOptions.get('settings');
	const fanTopicOption = variantOptions.get('fan_command_topic');
	climate.UI.fields.set('settings', { key: 'settings', option: settingsOption });
	climate.UI.fields.set('fan_command_topic', {
		key: 'fan_command_topic',
		option: fanTopicOption,
	});
	climate.setParam('settings', allSettingTypes);
	climate.setParam('fan_command_topic', '');

	const data = climate.toJSON().data;
	assert.equal(data.variant_type, DeviceVariant.climate_variant_cond_extended);
	assert.deepEqual(data.variant.settings, allSettingTypes);
	assert.equal(data.variant.fan_command_topic, undefined);
});

test('fan-топики обязательны только при заполненных fan_modes', () => {
	const climate = new Block({});
	climate.Device = Device.climate;
	climate.DeviceVariant = DeviceVariant.climate_variant_cond_extended;

	const values = {
		payload_on: 'ON',
		payload_off: 'OFF',
		min_target: null,
		max_target: null,
		fan_command_topic: '',
		fan_state_topic: '',
		fan_modes: {
			mode_1: { title: 'Авто', payload: 'auto' },
			mode_2: { title: 'Низкая', payload: 'low' },
		},
	};
	for (const [key, value] of Object.entries(values)) {
		climate.UI.fields.set(key, { getValue: () => value });
	}

	const issues = getBlockIssues(climate);
	assert.deepEqual(
		issues
			.filter(issue => issue.message.includes('fan_'))
			.map(issue => issue.fieldKeys[0]),
		['fan_command_topic', 'fan_state_topic'],
	);
	assert.equal(
		issues.some(issue => issue.message.includes('больше «min_target»')),
		false,
	);
});
