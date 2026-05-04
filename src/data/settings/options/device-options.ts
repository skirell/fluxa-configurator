import { EnumOption } from '../../../global/types/option';
import { Device } from '../../enums/device';

export const DEVICE_OPTIONS = new Map<Device, EnumOption>([
	[
		Device.scene,
		{
			label: 'Сценарий',
		},
	],

	[
		Device.light,
		{
			label: 'Освещение',
		},
	],

	[
		Device.climate,
		{
			label: 'Климат',
		},
	],

	[
		Device.cover,
		{
			label: 'Шторы',
		},
	],

	[
		Device.sensor,
		{
			label: 'Датчик',
		},
	],

	[
		Device.switch,
		{
			label: 'Переключатель',
		},
	],

	[
		Device.music,
		{
			label: 'Музыка',
		},
	],
]) as ReadonlyMap<Device, EnumOption>;

export const DEVICE_ORDER: Device[] = [
    Device.scene,
    Device.light,
    Device.climate,
    Device.cover,
    Device.sensor,
	Device.switch,
	Device.music,
];