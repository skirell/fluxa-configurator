import { ipcRenderer } from 'electron';
import { CHANNELS } from '../../../data/constants/channels';
import { SerializedBlock } from '../../../global/types/block';
import { showMessage } from '../../../utils/alert-utils';
import { Page } from '../../components/page/Page';
import blockManager from '../BlockManager/BlockManager';
import eventManager from '../EventManager/EventManager';
import pageManager from '../PageManager/PageManager';
import { validateConfig } from './config-validations';

export type SaveResult = 'saved' | 'cancelled';
type LoadConfigResult =
	| { status: 'loaded'; data: string }
	| { status: 'cancelled' }
	| { status: 'error' };

class ConfigManager implements IJsonSerializable {
	private static instance: ConfigManager;
	private constructor() {}
	public static getInstance(): ConfigManager {
		if (!ConfigManager.instance) ConfigManager.instance = new ConfigManager();
		return ConfigManager.instance;
	}

	/**
	 * Сохранение без блокирующих подтверждений — «грязный» JSON тоже уходит в файл.
	 * Состояние ошибок отражается в правой панели «Ошибки».
	 */
	public async saveConfig(): Promise<SaveResult> {
		try {
			const config = this.toJSON();
			const success = await ipcRenderer.invoke(CHANNELS.SAVE_CONFIG_CHANNEL, config);

			if (success) {
				// Выгруженный файл содержит все обязательные ключи — предупреждения о
				// недостающих полях из ранее загруженного файла больше не актуальны.
				for (const page of pageManager.Pages) {
					for (const block of page.Blocks) block.loadIssues = [];
				}
				showMessage('Конфигурация успешно сохранена.');
			} else {
				showMessage('Сохранение отменено.');
			}

			return success ? 'saved' : 'cancelled';
		} catch (err: any) {
			console.error('Ошибка при сохранении:', err);
			showMessage('Не удалось сохранить конфигурацию.');
			return 'cancelled';
		}
	}

	public async loadConfig(): Promise<boolean> {
		try {
			const loadResult = await ipcRenderer.invoke(CHANNELS.LOAD_CONFIG_CHANNEL) as LoadConfigResult;
			if (loadResult.status === 'cancelled') return false;
			if (loadResult.status === 'error') {
				showMessage('Не удалось загрузить конфигурацию.');
				return false;
			}
			if (loadResult.data.trim() === '') { showMessage('Файл конфигурации пуст.'); return false; }

			let parsedConfig: Config;
			try { parsedConfig = JSON.parse(loadResult.data); }
			catch { showMessage('Ошибка при разборе JSON файла.'); return false; }

			const validation = validateConfig(parsedConfig);
			if (!validation.success) { showMessage(`Ошибка в конфигурации: ${validation.message}`); return false; }

			this.applyConfig(parsedConfig);
			showMessage('Конфигурация успешно загружена.');
			return true;
		} catch (err: any) {
			console.error('Ошибка при загрузке:', err);
			showMessage('Не удалось загрузить конфигурацию.');
			return false;
		}
	}

	public applyConfig(config: Config) {
		pageManager.clearPages();
		for (const serializedPage of config.screens) {
			const page = pageManager.addPage(false);
			if (page) this.loadBlocksTo(page, serializedPage.blocks);
		}
		blockManager.SelectedBlock = pageManager.Pages[0]?.Blocks[0] ?? null;
		eventManager.emit('pageAdded', undefined);
	}

	private loadBlocksTo(page: Page, blocks: SerializedBlock[]): void {
		for (const serializedBlock of blocks)
			blockManager.loadBlockToPage(page, serializedBlock);
	}

	public toJSON(): string {
		return JSON.stringify({
			screens: pageManager.Pages.map(page => page.toJSON()).filter(p => p.blocks.length > 0),
		}, null, 2);
	}
}

export default ConfigManager.getInstance();
