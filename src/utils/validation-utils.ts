export function makeError(message: string): IValidationResult {
	return { success: false, message: message };
}

export function makeSuccess(message?: string): IValidationResult {
	return { success: true, message: message };
}
