import { Device } from '../../../data/enums/device';
import { BlockData, SerializedBlock } from '../../../global/types/block';
import { makeError, makeSuccess } from '../../../utils/validation-utils';

export function validateConfig(config: Config): IValidationResult {
	if (!config || typeof config !== 'object')
		return makeError('⚠️ Конфиг должен быть объектом');
	if (!Array.isArray(config.screens))
		return makeError('⚠️ В конфиге отсутствует массив screens');

	for (const screen of config.screens) {
		const validation = validatePage(screen);
		if (!validation.success) return validation;
	}

	return makeSuccess();
}

function validatePage(page: SerializedPage): IValidationResult {
	if (!page || typeof page !== 'object')
		return makeError('⚠️ Страница должна быть объектом');
	if (typeof page.page !== 'number' || page.page < 1)
		return makeError('⚠️ Номер страницы должен быть положительным числом');
	if (!Array.isArray(page.blocks))
		return makeError('⚠️ В странице отсутствует массив blocks');

	for (const block of page.blocks) {
		const validation = validateBlock(block);
		if (!validation.success) return validation;
	}

	return makeSuccess();
}

function validateBlock(block: SerializedBlock): IValidationResult {
	if (!block || typeof block !== 'object')
		return makeError('⚠️ Блок должен быть объектом');
	if (typeof block.block !== 'number' || block.block < 1)
		return makeError('⚠️ Номер блока должен быть положительным числом');
	if (!block.type || !Device[block.type])
		return makeError(`⚠️ Неверный тип блока: ${block.type}`);
	return validateBlockData(block.type, block.data);
}

function validateBlockData(device: Device, data: BlockData): IValidationResult {
	if (!data || typeof data !== 'object')
		return makeError('⚠️ В блоке отсутствует объект data');
	// Неверный variant_type / незнакомые ключи не отвергаем — даём BlockManager'у
	// загрузить блок «по максимуму» и пометить проблемы как warnings/errors
	// в панели ошибок. Это соответствует требованию: «по максимуму сохранить то, что верно».
	if (data.variant && typeof data.variant !== 'object')
		return makeError('⚠️ variant должен быть объектом');
	return makeSuccess();
}
