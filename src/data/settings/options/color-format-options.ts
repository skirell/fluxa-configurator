import { EnumOption } from '../../../global/types/option';
import { ColorFormat } from '../../enums/color-format';

export const COLOR_FORMAT_OPTIONS = new Map<ColorFormat, EnumOption>([
	[
		ColorFormat.rgb,
		{
			label: 'RGB',
		},
	],
	[
		ColorFormat.hex,
		{
			label: 'HEX',
		},
	],
	[
		ColorFormat.hsv,
		{
			label: 'HSV',
		},
	],
	[
		ColorFormat.hsl,
		{
			label: 'HSL',
		},
	],
]) as ReadonlyMap<ColorFormat, EnumOption>;

export const COLOR_FORMAT_ORDER: ColorFormat[] = [
	ColorFormat.rgb,
	ColorFormat.hex,
	ColorFormat.hsv,
	ColorFormat.hsl,
];
