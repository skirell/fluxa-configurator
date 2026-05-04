import { PathType } from '../../enums/path';

export const PATH_MAP = new Map<PathType, string>([
	[PathType.base, 'data'],
	[PathType.variant, 'data/variant'],
]) as ReadonlyMap<PathType, string>;
