/**
 * Универсальный перебор перечислений.
 * Работает только с string-based Enum (не числовым).
 */
export function forEachEnum<T extends Record<string, string>>(
	enumObj: T,
	callback: (key: keyof T, value: T[keyof T]) => void,
): void {
	for (const key in enumObj) {
		if (Object.prototype.hasOwnProperty.call(enumObj, key))
			callback(key as keyof T, enumObj[key]);
	}
}
