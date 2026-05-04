import { ipcRenderer } from 'electron';
import { CHANNELS } from '../data/constants/channels';

export async function showMessage(message: string): Promise<void> {
	return await ipcRenderer.invoke(CHANNELS.SHOW_MESSAGE_CHANNEL, message);
}

export async function showConfirm(message: string): Promise<boolean> {
	return await ipcRenderer.invoke(CHANNELS.SHOW_CONFIRM_CHANNEL, message);
}
