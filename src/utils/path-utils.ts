import { VALUES } from '../data/constants/values';
import { DeviceVariant } from '../data/enums/device';
import { PathType } from '../data/enums/path';
import { PATH_MAP } from '../data/settings/maps/path-map';
import { isFieldInVariant } from './option-utils';

export function setByPath(object: any, path: string, value: any) {
	const keys = path.split(VALUES.PATH_SEPARATOR);
	let current = object;

	keys.forEach((key: string, index: number) => {
		if (index === keys.length - 1) current[key] = value;
		else {
			if (!current[key]) current[key] = {};
			current = current[key];
		}
	});
}

export function getByPath(object: any, path: string): any {
	return path
		.split(VALUES.PATH_SEPARATOR)
		.reduce((acc: any, key: string) => acc?.[key], object);
}
