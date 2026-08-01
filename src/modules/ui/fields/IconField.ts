import { ParamOption } from '../../../global/types/option';
import BaseField from './BaseField';

interface IconEntry {
	n: string;
	c: string;
}

/**
 * Поле иконки: текстовый инпут (можно вставить символ с pictogrammers.com/library/mdi/)
 * + выпадающая сетка со всеми иконками шрифта MDI (поиск по имени).
 * Формат хранимого значения — сам символ-глиф (как и раньше), чтобы не ломать совместимость с JSON панели.
 */
export class IconField<T> extends BaseField {
	private static readonly RECENT_STORAGE_KEY = 'skirell-recent-icons';
	private static readonly RECENT_LIMIT = 12;
	private static readonly SUGGESTION_LIMIT = 8;
	private static allIcons: IconEntry[] = [];
	private static loadingPromise: Promise<void> | null = null;

	private dropdown!: HTMLDivElement;
	private searchInput!: HTMLInputElement;
	private recentSection!: HTMLDivElement;
	private recentList!: HTMLDivElement;
	private suggestionsSection!: HTMLDivElement;
	private suggestionsList!: HTMLDivElement;
	private gridScroll!: HTMLDivElement;
	private gridInner!: HTMLDivElement;
	private filteredIcons: IconEntry[] = [];
	private isOpen = false;
	private columns = 1;
	private resizeObserver?: ResizeObserver;

	private readonly cellSize = 36;
	private readonly gap = 4;

	constructor(fieldKey: string, option: ParamOption, initialValue?: T) {
		super(fieldKey, option, initialValue);
	}

	public render(): HTMLElement {
		const label = this.buildLabel();
		const input = this.buildInputElement('text');
		input.classList.add('icon-field');
		input.placeholder = '';
		input.addEventListener('input', () => void this.onMainInput(input.value));
		input.addEventListener('keydown', e => {
			if (e.key === 'Escape') this.closeDropdown();
			if (e.key === 'Enter' && this.filteredIcons[0]) {
				e.preventDefault();
				this.selectIcon(this.filteredIcons[0]);
			}
		});
		input.addEventListener('focus', () => this.openDropdown());
		input.addEventListener('click', () => this.openDropdown());

		this.dropdown = this.buildDropdown();

		const wrapper = this.wrapField([label, input, this.dropdown], ['icon-picker']);
		this.rootElement = wrapper;
		this.inputElement = input;
		this.updateInputTextMode(input, input.value);

		document.addEventListener('click', e => {
			if (this.isOpen && !wrapper.contains(e.target as Node)) this.closeDropdown();
		});

		// Пересчитываем количество колонок при изменении ширины dropdown'а
		// (например, когда пользователь меняет ширину правой панели).
		if (typeof ResizeObserver !== 'undefined') {
			this.resizeObserver = new ResizeObserver(() => {
				if (!this.isOpen) return;
				if (this.recomputeColumns()) this.renderGrid();
			});
			this.resizeObserver.observe(this.gridInner);
		}

		return wrapper;
	}

	private buildDropdown(): HTMLDivElement {
		const root = document.createElement('div');
		root.classList.add('icon-dropdown');
		root.style.display = 'none';

		const search = document.createElement('input');
		search.type = 'text';
		search.classList.add('icon-search');
		search.placeholder = 'Поиск по имени (англ., напр. home, lightbulb)';
		search.addEventListener('input', () => this.onSearchInput());
		search.addEventListener('keydown', e => {
			if (e.key === 'Escape') this.closeDropdown();
		});
		// Клик по строке поиска не должен закрывать dropdown.
		search.addEventListener('click', e => e.stopPropagation());
		this.searchInput = search;

		this.recentSection = this.buildIconStripSection(
			'Недавно использованные',
			'icon-recent-section',
		);
		this.recentList = this.recentSection.querySelector('.icon-strip-list') as HTMLDivElement;

		this.suggestionsSection = document.createElement('div');
		this.suggestionsSection.classList.add('icon-suggestions-section');
		this.suggestionsList = document.createElement('div');
		this.suggestionsList.classList.add('icon-suggestions-list');
		this.suggestionsSection.appendChild(this.suggestionsList);

		const scroll = document.createElement('div');
		scroll.classList.add('icon-grid-scroll');
		scroll.addEventListener('scroll', () => this.renderVisibleCells());

		const inner = document.createElement('div');
		inner.classList.add('icon-grid-inner');
		scroll.appendChild(inner);

		this.gridScroll = scroll;
		this.gridInner = inner;

		root.appendChild(search);
		root.appendChild(this.recentSection);
		root.appendChild(this.suggestionsSection);
		root.appendChild(scroll);
		return root;
	}

	private buildIconStripSection(title: string, className: string): HTMLDivElement {
		const section = document.createElement('div');
		section.classList.add(className, 'icon-strip-section');

		const label = document.createElement('div');
		label.classList.add('icon-section-title');
		label.textContent = title;

		const list = document.createElement('div');
		list.classList.add('icon-strip-list');

		section.append(label, list);
		return section;
	}

	private async openDropdown(): Promise<void> {
		if (this.isOpen) return;
		this.isOpen = true;
		this.dropdown.style.display = 'flex';

		try {
			await IconField.loadIcons();
		} catch (err) {
			console.error('Не удалось загрузить список иконок MDI:', err);
			this.gridInner.innerHTML =
				'<div class="icon-error">Не удалось загрузить иконки</div>';
			return;
		}

		this.syncSearchWithMainInput();
		this.refreshIconLists();
	}

	private closeDropdown(): void {
		if (!this.isOpen) return;
		this.isOpen = false;
		this.dropdown.style.display = 'none';
	}

	private static async loadIcons(): Promise<void> {
		if (IconField.allIcons.length > 0) return;
		if (IconField.loadingPromise) {
			await IconField.loadingPromise;
			return;
		}
		IconField.loadingPromise = (async () => {
			const res = await fetch('../../assets/icons/mdi-icons.json');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			IconField.allIcons = (await res.json()) as IconEntry[];
		})();
		await IconField.loadingPromise;
	}

	private onSearchInput(): void {
		this.refreshIconLists();
	}

	private async onMainInput(value: string): Promise<void> {
		this.onInput(value);
		this.updateInputTextMode(this.inputElement as HTMLInputElement, value);
		await this.openDropdown();
		this.syncSearchWithMainInput();
		this.refreshIconLists();
	}

	private updateInputTextMode(input: HTMLInputElement, value: string): void {
		input.classList.toggle(
			'icon-field--searching',
			Boolean(this.getSearchQueryFromInputValue(value)),
		);
	}

	private syncSearchWithMainInput(): void {
		const query = this.getSearchQueryFromInputValue(
			(this.inputElement as HTMLInputElement | undefined)?.value ?? '',
		);
		this.searchInput.value = query;
	}

	private refreshIconLists(): void {
		const q = this.getActiveQuery();
		this.filteredIcons = q ? this.applyFilter(q) : IconField.allIcons;
		this.gridScroll.scrollTop = 0;
		this.renderRecentIcons();
		this.renderSuggestions(q);
		this.renderGrid();
	}

	private applyFilter(q: string): IconEntry[] {
		const normalizedQuery = this.normalizeIconName(q);
		return IconField.allIcons.filter(icon => {
			if (icon.n.includes(q)) return true;
			return this.normalizeIconName(icon.n).includes(normalizedQuery);
		});
	}

	private getActiveQuery(): string {
		return this.searchInput.value.trim().toLowerCase();
	}

	private getSearchQueryFromInputValue(value: string): string {
		const query = value.trim().toLowerCase();
		return /[a-z]/i.test(query) ? query : '';
	}

	private normalizeIconName(value: string): string {
		return value.toLowerCase().replace(/[^a-z0-9]/g, '');
	}

	private renderRecentIcons(): void {
		const recentIcons = this.getRecentIcons();
		this.recentSection.style.display = recentIcons.length ? 'block' : 'none';
		this.recentList.innerHTML = '';

		for (const icon of recentIcons) {
			const button = this.buildIconButton(icon, 'icon-recent-cell');
			this.recentList.appendChild(button);
		}
	}

	private renderSuggestions(query: string): void {
		this.suggestionsSection.style.display = query ? 'block' : 'none';
		this.suggestionsList.innerHTML = '';
		if (!query) return;

		const suggestions = this.filteredIcons.slice(0, IconField.SUGGESTION_LIMIT);
		if (suggestions.length === 0) {
			const empty = document.createElement('div');
			empty.classList.add('icon-suggestions-empty');
			empty.textContent = 'Подходящих иконок не найдено';
			this.suggestionsList.appendChild(empty);
			return;
		}

		for (const icon of suggestions) {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'icon-suggestion-btn';
			button.title = icon.n;

			const glyph = document.createElement('span');
			glyph.className = 'icon-suggestion-glyph';
			glyph.textContent = this.toGlyph(icon);

			const name = document.createElement('span');
			name.className = 'icon-suggestion-name';
			name.textContent = icon.n;

			button.append(glyph, name);
			button.addEventListener('click', e => {
				e.preventDefault();
				e.stopPropagation();
				this.selectIcon(icon);
			});
			this.suggestionsList.appendChild(button);
		}
	}

	private buildIconButton(icon: IconEntry, className: string): HTMLButtonElement {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = className;
		button.title = icon.n;
		button.textContent = this.toGlyph(icon);
		button.addEventListener('click', e => {
			e.preventDefault();
			e.stopPropagation();
			this.selectIcon(icon);
		});
		return button;
	}

	private getRecentIcons(): IconEntry[] {
		const iconsByName = new Map(IconField.allIcons.map(icon => [icon.n, icon]));
		return IconField.loadRecentIconNames()
			.map(name => iconsByName.get(name))
			.filter((icon): icon is IconEntry => Boolean(icon));
	}

	private static loadRecentIconNames(): string[] {
		try {
			const raw = localStorage.getItem(IconField.RECENT_STORAGE_KEY);
			const parsed = raw ? JSON.parse(raw) : [];
			return Array.isArray(parsed)
				? parsed.filter(name => typeof name === 'string')
				: [];
		} catch {
			return [];
		}
	}

	private static rememberIcon(icon: IconEntry): void {
		try {
			const names = IconField.loadRecentIconNames()
				.filter(name => name !== icon.n);
			names.unshift(icon.n);
			localStorage.setItem(
				IconField.RECENT_STORAGE_KEY,
				JSON.stringify(names.slice(0, IconField.RECENT_LIMIT)),
			);
		} catch {
		}
	}

	private recomputeColumns(): boolean {
		const availW = this.gridInner.clientWidth;
		if (availW <= 0) return false;
		const n = Math.max(1, Math.floor((availW + this.gap) / (this.cellSize + this.gap)));
		if (n === this.columns) return false;
		this.columns = n;
		return true;
	}

	private renderGrid(): void {
		this.recomputeColumns();
		const rowH = this.cellSize + this.gap;
		const rowCount = Math.ceil(this.filteredIcons.length / this.columns);
		this.gridInner.style.height = rowCount * rowH + 'px';
		this.renderVisibleCells();
	}

	private renderVisibleCells(): void {
		const rowH = this.cellSize + this.gap;
		const scrollTop = this.gridScroll.scrollTop;
		const viewH = this.gridScroll.clientHeight;

		const firstRow = Math.max(0, Math.floor(scrollTop / rowH) - 2);
		const lastRow = Math.min(
			Math.ceil((scrollTop + viewH) / rowH) + 2,
			Math.ceil(this.filteredIcons.length / this.columns),
		);

		this.gridInner.innerHTML = '';
		for (let row = firstRow; row < lastRow; row++) {
			for (let col = 0; col < this.columns; col++) {
				const idx = row * this.columns + col;
				if (idx >= this.filteredIcons.length) break;
				const icon = this.filteredIcons[idx];
				const cell = document.createElement('button');
				cell.type = 'button';
				cell.className = 'icon-cell';
				cell.title = icon.n;
				cell.style.top = row * rowH + 'px';
				cell.style.left = col * (this.cellSize + this.gap) + 'px';
				cell.textContent = this.toGlyph(icon);
				cell.addEventListener('click', e => {
					e.preventDefault();
					e.stopPropagation();
					this.selectIcon(icon);
				});
				this.gridInner.appendChild(cell);
			}
		}
	}

	private selectIcon(icon: IconEntry): void {
		const glyph = this.toGlyph(icon);
		const input = this.inputElement as HTMLInputElement;
		input.value = glyph;
		this.updateInputTextMode(input, glyph);
		IconField.rememberIcon(icon);
		this.onInput(glyph);
		this.renderRecentIcons();
		this.closeDropdown();
	}

	private toGlyph(icon: IconEntry): string {
		return String.fromCodePoint(parseInt(icon.c, 16));
	}
}
