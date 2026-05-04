type Listener<T = any> = (payload: T) => void;

class EventManager {
	private static instance: EventManager;
	private listeners = new Map<string, Listener[]>();

	public static getInstance(): EventManager {
		if (!EventManager.instance) EventManager.instance = new EventManager();
		return EventManager.instance;
	}

	/**
	 * Подписаться на событие.
	 * @param eventName имя события
	 * @param listener колбэк
	 * @returns функцию отписки
	 */
	public on<T = any>(eventName: string, listener: Listener<T>): () => void {
		if (!this.listeners.has(eventName)) this.listeners.set(eventName, []);
		this.listeners.get(eventName)!.push(listener as Listener);
		return () => this.off(eventName, listener);
	}

	/**
	 * Отписаться от события.
	 * @param eventName имя события
	 * @param listener ранее добавленный колбэк
	 */
	public off<T = any>(eventName: string, listener: Listener<T>): void {
		const arr = this.listeners.get(eventName);
		if (!arr) return;
		this.listeners.set(
			eventName,
			arr.filter(l => l !== listener),
		);
	}

	/**
	 * Эмитить (вызывать) событие с полезной нагрузкой.
	 * @param eventName имя события
	 * @param payload данные, которые передаются слушателям
	 */
	public emit<T = any>(eventName: string, payload: T): void {
		const arr = this.listeners.get(eventName);
		if (!arr || arr.length === 0) return;
		for (const listener of arr) {
			try {
				listener(payload);
			} catch (e) {
				console.error(`Ошибка слушателя на событии - "${eventName}":`, e);
			}
		}
	}
}

export default EventManager.getInstance();
