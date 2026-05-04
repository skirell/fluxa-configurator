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
	private static allIcons: IconEntry[] = [];
	private static loadingPromise: Promise<void> | null = null;

	private dropdown!: HTMLDivElement;
	private searchInput!: HTMLInputElement;
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
		input.addEventListener('input', () => this.onInput(input.value));
		input.addEventListener('focus', () => this.openDropdown());
		input.addEventListener('click', () => this.openDropdown());

		this.dropdown = this.buildDropdown();

		const wrapper = this.wrapField([label, input, this.dropdown], ['icon-picker']);
		this.rootElement = wrapper;
		this.inputElement = input;

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

		const scroll = document.createElement('div');
		scroll.classList.add('icon-grid-scroll');
		scroll.addEventListener('scroll', () => this.renderVisibleCells());

		const inner = document.createElement('div');
		inner.classList.add('icon-grid-inner');
		scroll.appendChild(inner);

		this.gridScroll = scroll;
		this.gridInner = inner;

		root.appendChild(search);
		root.appendChild(scroll);
		return root;
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

		const q = this.searchInput.value.trim().toLowerCase();
		this.filteredIcons = q ? this.applyFilter(q) : IconField.allIcons;
		this.renderGrid();
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
		const q = this.searchInput.value.trim().toLowerCase();
		this.filteredIcons = q ? this.applyFilter(q) : IconField.allIcons;
		this.gridScroll.scrollTop = 0;
		this.renderGrid();
	}

	private applyFilter(q: string): IconEntry[] {
		return IconField.allIcons.filter(i => i.n.includes(q));
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
				cell.textContent = String.fromCodePoint(parseInt(icon.c, 16));
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
		const glyph = String.fromCodePoint(parseInt(icon.c, 16));
		const input = this.inputElement as HTMLInputElement;
		input.value = glyph;
		this.onInput(glyph);
		this.closeDropdown();
	}
}
