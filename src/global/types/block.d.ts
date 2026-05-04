import { Device, DeviceVariant } from '../../data/enums/device';
import { PathType } from '../../data/enums/path';

type Path = PathType | string;

interface BlockData {
	[key: string]: any;
	variant_type?: DeviceVariant;
	variant?: {
		[key: string]: any;
	};
}

interface SerializedBlock {
	block: number;
	type: Device;
	data: Partial<BlockData>;
}
