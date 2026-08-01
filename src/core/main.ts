import { app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron';
import { promises as fs } from 'fs';
import * as path from 'path';
import { CHANNELS } from '../data/constants/channels';

let mainWindow: BrowserWindow | null = null;

type LoadConfigResult =
	| { status: 'loaded'; data: string }
	| { status: 'cancelled' }
	| { status: 'error' };

function createWindow() {
    const baseIconPath = path.resolve(__dirname, '../../icons');

    let iconPath = path.join(baseIconPath, 'linux/icon.png'); // fallback

    if (process.platform === 'win32') {
        iconPath = path.join(baseIconPath, 'win/icon.ico');
    } else if (process.platform === 'darwin') {
        iconPath = path.join(baseIconPath, 'mac/icon.icns');
    }

	mainWindow = new BrowserWindow({
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			webviewTag: true,
		},
        icon: iconPath,
		minWidth: 1230,
		minHeight: 620,
	});

	mainWindow.maximize();
	mainWindow.loadFile(path.join(__dirname, 'html', 'index.html'));
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

app.whenReady().then(() => {
	createWindow();
});

app.on('window-all-closed', () => {
	// на macOS принято держать приложение открытым до ручного выхода
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
	// на macOS перезапускаем окно при повторной активации и отсутствии окон
	if (mainWindow === null) createWindow();
});

ipcMain.handle(
	CHANNELS.GET_APP_VERSION_CHANNEL,
	async (): Promise<string> => app.getVersion(),
);

ipcMain.handle(
	CHANNELS.SAVE_CONFIG_CHANNEL,
	async (_event: IpcMainInvokeEvent, jsonData: string): Promise<boolean> => {
		try {
			const { canceled, filePath } = await dialog.showSaveDialog({
				title: 'Сохранить конфигурацию',
				defaultPath: path.join(app.getPath('documents'), 'DATA.json'),
				filters: [
					{ name: 'JSON Files', extensions: ['json'] },
					{ name: 'All Files', extensions: ['*'] },
				],
			});

			if (canceled || !filePath) return false;

			await fs.writeFile(filePath, jsonData, 'utf8');
			return true;
		} catch (err: any) {
			console.error('Ошибка при сохранении конфига:', err);
			return false;
		}
	},
);

ipcMain.handle(
	CHANNELS.LOAD_CONFIG_CHANNEL,
	async (_event: IpcMainInvokeEvent): Promise<LoadConfigResult> => {
		try {
			const { canceled, filePaths } = await dialog.showOpenDialog({
				title: 'Загрузить конфигурацию',
				defaultPath: path.join(app.getPath('documents')),
				filters: [
					{ name: 'JSON Files', extensions: ['json'] },
					{ name: 'All Files', extensions: ['*'] },
				],
				properties: ['openFile'],
			});

			if (canceled || !filePaths.length) return { status: 'cancelled' };

			const filePath = filePaths[0];
			const jsonData = await fs.readFile(filePath, 'utf8');
			return { status: 'loaded', data: jsonData };
		} catch (err: any) {
			console.error('Ошибка при загрузке конфига:', err);
			return { status: 'error' };
		}
	},
);
