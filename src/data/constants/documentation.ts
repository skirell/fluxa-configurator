interface DocEntry {
	title: string;
	description: string;
	fields: Record<string, { description: string; example?: string; required?: boolean }>;
}

export const DEVICE_DOCS: Record<string, DocEntry> = {
	scene: {
		title: 'Сценарий (scene)',
		description:
			'Блок сценария отображает кнопку на панели. При нажатии отправляет заданное сообщение в MQTT-топик для запуска сценариев и отправки команд.',
		fields: {
			param_1: {
				description: 'Маленький текст, отображаемый на блоке. Можно оставить пустым.',
				example: '"Спальня"',
			},
			param_2: {
				description: 'Средний текст, отображаемый на блоке. Можно оставить пустым.',
				example: '"Свет"',
			},
			param_3: {
				description: 'Большой текст, отображаемый на блоке. Можно оставить пустым.',
				example: '"Вкл"',
			},
			icon: {
				description: 'Иконка блока. Скопируйте символ с сайта pictogrammers.com/library/mdi/',
				required: true,
			},
			command_topic: {
				description: 'MQTT-топик, в который панель отправит сообщение при нажатии на блок.',
				example: '"panel/scenes/1"',
				required: true,
			},
			payload: {
				description: 'Сообщение (команда), которое будет отправлено в MQTT-топик.',
				example: '"1"',
				required: true,
			},
		},
	},

	switch: {
		title: 'Переключатель (switch)',
		description:
			'Управляет устройствами с двумя состояниями (вкл/выкл). При нажатии отправляет команду, по обратной связи обновляет отображение.',
		fields: {
			param_1: {
				description: 'Маленький текст на блоке.',
				example: '"Кровать"',
			},
			param_2: {
				description: 'Средний текст на блоке.',
				example: '"Розетка"',
			},
			icon: {
				description: 'Иконка блока с сайта pictogrammers.com/library/mdi/',
				required: true,
			},
			color: {
				description: 'Цвет блока во включённом состоянии. В выключенном — серый.',
				required: true,
			},
			OnOff_command_topic: {
				description: 'MQTT-топик для отправки команды включения/выключения.',
				example: '"panel/switch/1/OnOff_command"',
				required: true,
			},
			OnOff_state_topic: {
				description: 'MQTT-топик для получения текущего состояния устройства.',
				example: '"panel/switch/1/OnOff_state"',
				required: true,
			},
			payload_on: {
				description: 'Сообщение, означающее «включено».',
				example: '"1", "ON", "true"',
				required: true,
			},
			payload_off: {
				description: 'Сообщение, означающее «выключено».',
				example: '"0", "OFF", "false"',
				required: true,
			},
		},
	},

	sensor: {
		title: 'Датчик (sensor)',
		description:
			'Отображает значение с датчика (температура, влажность и т.д.) с цветовой индикацией по трём диапазонам.',
		fields: {
			param_1: {
				description: 'Подпись к датчику.',
				example: '"Температура"',
			},
			measure: {
				description: 'Единица измерения, отображается рядом со значением.',
				example: '"°C", "%", "ppm"',
			},
			min: {
				description: 'Нижняя граница отображаемого диапазона. Должно быть: min < stage_1 < stage_2 < max.',
				example: '10',
				required: true,
			},
			stage_1: {
				description: 'Граница между первым и вторым диапазонами цвета.',
				example: '20',
				required: true,
			},
			stage_2: {
				description: 'Граница между вторым и третьим диапазонами цвета.',
				example: '30',
				required: true,
			},
			max: {
				description: 'Верхняя граница отображаемого диапазона.',
				example: '40',
				required: true,
			},
			color_1: {
				description: 'Цвет индикатора, когда значение ниже stage_1.',
				required: true,
			},
			color_2: {
				description: 'Цвет индикатора, когда значение между stage_1 и stage_2.',
				required: true,
			},
			color_3: {
				description: 'Цвет индикатора, когда значение выше stage_2.',
				required: true,
			},
			state_topic: {
				description: 'MQTT-топик для чтения текущего значения датчика.',
				example: '"panel/sensor/1/state"',
				required: true,
			},
		},
	},

	light: {
		title: 'Освещение (light)',
		description:
			'Управление освещением. Короткое нажатие — вкл/выкл. Долгое нажатие — страница настройки яркости, цвета или температуры (зависит от подтипа).',
		fields: {
			param_1: { description: 'Маленький текст на блоке.' },
			param_2: { description: 'Средний текст на блоке.' },
			setting_name: {
				description: 'Заголовок на странице управления.',
				required: true,
			},
			icon: {
				description: 'Иконка блока.',
				required: true,
			},
		},
	},

	cover: {
		title: 'Шторы (cover)',
		description:
			'Управление шторами, жалюзи и воротами. Нажатие открывает страницу управления.',
		fields: {
			param_1: { description: 'Маленький текст на блоке.' },
			param_2: { description: 'Средний текст на блоке.' },
			setting_name: {
				description: 'Заголовок на странице управления.',
				required: true,
			},
			icon_open: {
				description: 'Иконка для открытого состояния.',
				required: true,
			},
			icon_close: {
				description: 'Иконка для закрытого состояния.',
				required: true,
			},
		},
	},

	climate: {
		title: 'Климат (climate)',
		description:
			'Управление кондиционером, термостатом, тёплым полом. Круговой слайдер для установки температуры.',
		fields: {
			param_1: { description: 'Маленький текст на блоке.' },
			param_2: { description: 'Средний текст на блоке.' },
			setting_name: {
				description: 'Заголовок на странице управления.',
				required: true,
			},
			icon: {
				description: 'Иконка блока.',
				required: true,
			},
			measure: {
				description: 'Единица измерения уставки.',
				example: '"°C", "%"',
			},
			color: {
				description: 'Цвет блока и слайдера в активном состоянии.',
				required: true,
			},
		},
	},
};

export const VARIANT_DOCS: Record<string, DocEntry> = {
	light_variant_OnOff: {
		title: 'Вкл/Выкл',
		description: 'Простое включение и выключение света без регулировки.',
		fields: {
			OnOff_command_topic: { description: 'MQTT-топик для команды вкл/выкл.', required: true },
			OnOff_state_topic: { description: 'MQTT-топик для получения состояния.', required: true },
			payload_on: { description: 'Сообщение для включения.', example: '"1"', required: true },
			payload_off: { description: 'Сообщение для выключения.', example: '"0"', required: true },
		},
	},
	light_variant_dimmer: {
		title: 'Диммер',
		description: 'Включение/выключение + регулировка яркости.',
		fields: {
			OnOff_command_topic: { description: 'MQTT-топик для команды вкл/выкл.', required: true },
			OnOff_state_topic: { description: 'MQTT-топик для получения состояния.', required: true },
			payload_on: { description: 'Сообщение для включения.', required: true },
			payload_off: { description: 'Сообщение для выключения.', required: true },
			brightness_command_topic: { description: 'MQTT-топик для отправки яркости.', required: true },
			brightness_state_topic: { description: 'MQTT-топик для получения яркости.', required: true },
			brightness_scale: { description: 'Максимальное значение яркости.', example: '255 или 100', required: true },
		},
	},
	light_variant_color: {
		title: 'Диммер + RGB',
		description: 'Диммер с возможностью выбора цвета через палитру RGB.',
		fields: {
			OnOff_command_topic: { description: 'MQTT-топик для команды вкл/выкл.', required: true },
			OnOff_state_topic: { description: 'MQTT-топик для получения состояния.', required: true },
			payload_on: { description: 'Сообщение для включения.', required: true },
			payload_off: { description: 'Сообщение для выключения.', required: true },
			brightness_command_topic: { description: 'MQTT-топик для отправки яркости.', required: true },
			brightness_state_topic: { description: 'MQTT-топик для получения яркости.', required: true },
			brightness_scale: { description: 'Максимальное значение яркости.', required: true },
			color_command_topic: { description: 'MQTT-топик для отправки цвета.', required: true },
			color_type: { description: 'Формат цвета (RGB, HEX, HSV, HSL).', required: true },
		},
	},
	light_variant_temperature: {
		title: 'Диммер + Температура цвета',
		description: 'Диммер с регулировкой температуры цвета (тёплый/холодный).',
		fields: {
			OnOff_command_topic: { description: 'MQTT-топик для команды вкл/выкл.', required: true },
			OnOff_state_topic: { description: 'MQTT-топик для получения состояния.', required: true },
			payload_on: { description: 'Сообщение для включения.', required: true },
			payload_off: { description: 'Сообщение для выключения.', required: true },
			brightness_command_topic: { description: 'MQTT-топик для отправки яркости.', required: true },
			brightness_state_topic: { description: 'MQTT-топик для получения яркости.', required: true },
			brightness_scale: { description: 'Максимальное значение яркости.', required: true },
			temp_command_topic: { description: 'MQTT-топик для отправки температуры цвета.', required: true },
			temp_state_topic: { description: 'MQTT-топик для получения температуры цвета.', required: true },
			max_temp: { description: 'Максимальная температура цвета.', required: true },
			min_temp: { description: 'Минимальная температура цвета.', required: true },
			temp_measure: { description: 'Единица измерения температуры.', example: '"%"' },
		},
	},
	cover_variant_slider: {
		title: 'Слайдер (с позицией)',
		description: 'Управление шторами с отображением процента открытия и позиционным слайдером.',
		fields: {
			orientation: { description: 'Направление: Horizontal или Vertical.', required: true },
			open_command_topic: { description: 'MQTT-топик для команды открытия.', required: true },
			close_command_topic: { description: 'MQTT-топик для команды закрытия.', required: true },
			stop_command_topic: { description: 'MQTT-топик для команды остановки.' },
			payload_open: { description: 'Сообщение для открытия.', required: true },
			payload_close: { description: 'Сообщение для закрытия.', required: true },
			payload_stop: { description: 'Сообщение для остановки.' },
			position_command_topic: { description: 'MQTT-топик для установки позиции.', required: true },
			position_state_topic: { description: 'MQTT-топик для получения текущей позиции.', required: true },
			position_open: { description: 'Значение позиции в полностью открытом состоянии.', required: true },
			position_close: { description: 'Значение позиции в полностью закрытом состоянии.', required: true },
			help_position_open: { description: 'Порог округления для полностью открытого состояния.', required: true },
			help_position_close: { description: 'Порог округления для полностью закрытого состояния.', required: true },
			lameli: { description: 'Дополнительные настройки управления ламелями.' },
		},
	},
	cover_variant_buttons: {
		title: 'Кнопки (без позиции)',
		description: 'Три кнопки управления (открыть/закрыть/стоп) без обратной связи по позиции.',
		fields: {
			orientation: { description: 'Направление: Horizontal или Vertical.', required: true },
			open_command_topic: { description: 'MQTT-топик для команды открытия.', required: true },
			close_command_topic: { description: 'MQTT-топик для команды закрытия.', required: true },
			stop_command_topic: { description: 'MQTT-топик для команды остановки.' },
			payload_open: { description: 'Сообщение для открытия.', required: true },
			payload_close: { description: 'Сообщение для закрытия.', required: true },
			payload_stop: { description: 'Сообщение для остановки.' },
			lameli: { description: 'Дополнительные настройки управления ламелями.' },
		},
	},
	climate_variant_cond: {
		title: 'Расширенный термостат',
		description: 'Кондиционер/приточка с 2-5 режимами работы и опциональным управлением вентилятором.',
		fields: {
			OnOff_command_topic: { description: 'MQTT-топик для команды вкл/выкл.', required: true },
			OnOff_state_topic: { description: 'MQTT-топик для получения состояния.', required: true },
			payload_on: { description: 'Сообщение для включения.', required: true },
			payload_off: { description: 'Сообщение для выключения.', required: true },
			modes: { description: 'Массив режимов работы (2-5 шт): иконка, название, цвет, payload.', required: true },
			mode_command_topic: { description: 'MQTT-топик для отправки выбранного режима.', required: true },
			mode_state_topic: { description: 'MQTT-топик для получения текущего режима.', required: true },
			currentTemp_state_topic: { description: 'MQTT-топик для чтения текущей температуры.', required: true },
			targetTemp_command_topic: { description: 'MQTT-топик для отправки уставки.', required: true },
			targetTemp_state_topic: { description: 'MQTT-топик для получения текущей уставки.', required: true },
			max_target: { description: 'Максимальное значение уставки.', required: true },
			min_target: { description: 'Минимальное значение уставки.', required: true },
			fan_command_topic: { description: 'MQTT-топик для режимов вентилятора.', required: true },
			fan_state_topic: { description: 'MQTT-топик для получения режима вентилятора.', required: true },
			fan_modes: { description: 'Массив дополнительных режимов вентилятора (0-5 шт).' },
		},
	},
	climate_variant_thermostat: {
		title: 'Термостат',
		description: 'Простой термостат с вкл/выкл, уставкой и до 3 дополнительных датчиков.',
		fields: {
			OnOff_command_topic: { description: 'MQTT-топик для команды вкл/выкл.', required: true },
			OnOff_state_topic: { description: 'MQTT-топик для получения состояния.', required: true },
			payload_on: { description: 'Сообщение для включения.', required: true },
			payload_off: { description: 'Сообщение для выключения.', required: true },
			targetTemp_command_topic: { description: 'MQTT-топик для отправки уставки.', required: true },
			targetTemp_state_topic: { description: 'MQTT-топик для получения текущей уставки.', required: true },
			max_target: { description: 'Максимальное значение уставки.', required: true },
			min_target: { description: 'Минимальное значение уставки.', required: true },
			sensors: { description: 'Массив дополнительных датчиков (0-3 шт): иконка, единица измерения, state_topic.' },
		},
	},
};
