import { Device, DeviceVariant } from '../../enums/device';

export const DEVICE_VARIANT_MAP = new Map<Device, DeviceVariant[]>([
	[
		Device.light,
		[
			DeviceVariant.light_variant_OnOff,
			DeviceVariant.light_variant_color,
			DeviceVariant.light_variant_dimmer,
			DeviceVariant.light_variant_temperature,
		]
	],
    
    [
		Device.climate,
		[
			DeviceVariant.climate_variant_cond,
			DeviceVariant.climate_variant_thermostat,
		]
	],

	[
        Device.cover, 
        [
            DeviceVariant.cover_variant_slider,
			DeviceVariant.cover_variant_buttons,
        ]
    ]
]);
