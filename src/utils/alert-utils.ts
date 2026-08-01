export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type DialogButtonVariant = 'primary' | 'danger' | 'ghost';

export interface ToastOptions {
	type?: ToastType;
	title?: string;
	durationMs?: number;
}

export interface ConfirmOptions {
	title: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	danger?: boolean;
}

export interface ChoiceOption<T extends string> {
	value: T;
	label: string;
	variant?: DialogButtonVariant;
}

export interface ChoiceOptions<T extends string> {
	title: string;
	message?: string;
	choices: ChoiceOption<T>[];
	cancelText?: string;
}

const DEFAULT_TOAST_DURATION: Record<ToastType, number> = {
	success: 2400,
	info: 3200,
	warning: 4200,
	error: 6400,
};

export async function showMessage(message: string, options?: ToastOptions): Promise<void> {
	showToast(message, options);
}

export function showToast(message: string, options: ToastOptions = {}): void {
	const type = options.type ?? 'info';
	const container = ensureToastContainer();

	const toast = document.createElement('div');
	toast.className = `app-toast app-toast-${type}`;
	toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

	const content = document.createElement('div');
	content.className = 'app-toast-content';

	if (options.title) {
		const title = document.createElement('div');
		title.className = 'app-toast-title';
		title.textContent = options.title;
		content.appendChild(title);
	}

	const messageEl = document.createElement('div');
	messageEl.className = 'app-toast-message';
	messageEl.textContent = message;
	content.appendChild(messageEl);

	const closeBtn = document.createElement('button');
	closeBtn.type = 'button';
	closeBtn.className = 'app-toast-close';
	closeBtn.setAttribute('aria-label', 'Закрыть уведомление');
	closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

	let timeoutId: number | undefined;
	const remove = () => {
		if (timeoutId !== undefined) window.clearTimeout(timeoutId);
		toast.classList.remove('show');
		window.setTimeout(() => toast.remove(), 180);
	};

	closeBtn.addEventListener('click', remove);
	toast.append(content, closeBtn);
	container.appendChild(toast);

	requestAnimationFrame(() => toast.classList.add('show'));
	timeoutId = window.setTimeout(
		remove,
		options.durationMs ?? DEFAULT_TOAST_DURATION[type],
	);
}

export async function showConfirm(input: ConfirmOptions | string): Promise<boolean> {
	const options: ConfirmOptions =
		typeof input === 'string'
			? {
				title: 'Подтверждение',
				message: input,
				confirmText: 'Да',
				cancelText: 'Отмена',
			}
			: input;

	const result = await showDialog<'confirm'>({
		title: options.title,
		message: options.message,
		choices: [
			{
				value: 'confirm',
				label: options.confirmText ?? 'Подтвердить',
				variant: options.danger ? 'danger' : 'primary',
			},
		],
		cancelText: options.cancelText ?? 'Отмена',
		cancelFirst: true,
		focusCancel: options.danger ?? false,
	});

	return result === 'confirm';
}

export async function showChoice<T extends string>(
	options: ChoiceOptions<T>,
): Promise<T | null> {
	return showDialog(options);
}

function ensureToastContainer(): HTMLDivElement {
	const existing = document.querySelector<HTMLDivElement>('.app-toast-stack');
	if (existing) return existing;

	const container = document.createElement('div');
	container.className = 'app-toast-stack';
	document.body.appendChild(container);
	return container;
}

function showDialog<T extends string>(
	options: ChoiceOptions<T> & {
		cancelFirst?: boolean;
		focusCancel?: boolean;
	},
): Promise<T | null> {
	return new Promise(resolve => {
		const overlay = document.createElement('div');
		overlay.className = 'app-dialog-overlay';

		const dialog = document.createElement('div');
		dialog.className = 'app-dialog';
		dialog.setAttribute('role', 'dialog');
		dialog.setAttribute('aria-modal', 'true');

		const title = document.createElement('h2');
		title.className = 'app-dialog-title';
		title.textContent = options.title;
		dialog.appendChild(title);

		if (options.message) {
			const message = document.createElement('div');
			message.className = 'app-dialog-message';
			message.textContent = options.message;
			dialog.appendChild(message);
		}

		const actions = document.createElement('div');
		actions.className = 'app-dialog-actions';

		let settled = false;
		const close = (value: T | null) => {
			if (settled) return;
			settled = true;
			document.removeEventListener('keydown', onKeyDown);
			overlay.remove();
			resolve(value);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close(null);
		};

		const cancelBtn = document.createElement('button');
		cancelBtn.type = 'button';
		cancelBtn.className = 'app-dialog-btn app-dialog-btn-ghost';
		cancelBtn.textContent = options.cancelText ?? 'Отмена';
		cancelBtn.addEventListener('click', () => close(null));

		const choiceButtons = options.choices.map(choice => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = `app-dialog-btn app-dialog-btn-${choice.variant ?? 'ghost'}`;
			btn.textContent = choice.label;
			btn.addEventListener('click', () => close(choice.value));
			return btn;
		});

		if (options.cancelFirst) {
			actions.append(cancelBtn, ...choiceButtons);
		} else {
			actions.append(...choiceButtons, cancelBtn);
		}

		overlay.addEventListener('mousedown', e => {
			if (e.target === overlay) close(null);
		});

		dialog.appendChild(actions);
		overlay.appendChild(dialog);
		document.body.appendChild(overlay);
		document.addEventListener('keydown', onKeyDown);

		const focusTarget = options.focusCancel
			? cancelBtn
			: actions.querySelector<HTMLButtonElement>('.app-dialog-btn-primary') ?? choiceButtons[0] ?? cancelBtn;
		focusTarget.focus();
	});
}
