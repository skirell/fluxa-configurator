import { LIMITS } from '../../../data/constants/limits';
import { PLACEHOLDERS } from '../../../data/constants/placeholders';
import { ViewId } from '../../../data/enums/view-id';
import { DEVICE_OPTIONS } from '../../../data/settings/options/device-options';
import { showConfirm } from '../../../utils/alert-utils';
import BlockManager from '../../managers/BlockManager/BlockManager';
import EventManager from '../../managers/EventManager/EventManager';
import PageManager from '../../managers/PageManager/PageManager';
import App from '../app';
import Block from '../block/Block';
import { Page } from '../page/Page';
import { SidebarView } from './SidebarView';

const SVG = {
	chevron: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	drag: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="3" cy="2" r="0.9" fill="currentColor"/><circle cx="7" cy="2" r="0.9" fill="currentColor"/><circle cx="3" cy="5" r="0.9" fill="currentColor"/><circle cx="7" cy="5" r="0.9" fill="currentColor"/><circle cx="3" cy="8" r="0.9" fill="currentColor"/><circle cx="7" cy="8" r="0.9" fill="currentColor"/></svg>',
	close: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
	closeSmall: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
	copy: '<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.1"/><path d="M8 4V2.5A1.5 1.5 0 006.5 1h-4A1.5 1.5 0 001 2.5v4A1.5 1.5 0 002.5 8H4" stroke="currentColor" stroke-width="1.1"/></svg>',
	plus: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
};

export class SiderbarRenderer {
	private collapsedPages = new Set<number>();
	private dragData: { type: 'block' | 'page'; block?: Block; page?: Page } | null = null;

	constructor(private readonly view: SidebarView) {}

	public render() {
		this.view.elements.menu.innerHTML = '';
		this.renderPages();
		this.renderAddPageButton();
		this.setupEmptyAreaDrop();
	}

	private setupEmptyAreaDrop(): void {
		const nav = this.view.elements.menu.closest('.sidebar-nav') as HTMLElement;
		if (!nav) return;

		nav.ondragover = (e) => {
			if (this.dragData?.type === 'block') {
				e.preventDefault();
			}
		};
		nav.ondrop = (e) => {
			if (this.dragData?.type === 'block' && this.dragData.block) {
				// Only trigger if drop is on the nav itself (not on a child element)
				if (e.target === nav || e.target === this.view.elements.menu) {
					e.preventDefault();
					const block = this.dragData.block;
					const newPage = PageManager.addPage(false);
					if (newPage) {
						this.doMoveBlock(block, newPage, 0);
						BlockManager.SelectedBlock = block;
						EventManager.emit('pageAdded', newPage);
					}
				}
			}
		};
	}

	private renderPages(): void {
		PageManager.Pages.forEach((page: Page) => {
			this.view.elements.menu.appendChild(this.createPageElement(page));
		});
	}

	private createPageElement(page: Page): HTMLElement {
		const li = document.createElement('li');
		li.className = 'page-item';
		li.draggable = true;

		li.addEventListener('dragstart', (e) => {
			if ((e.target as HTMLElement).closest('.block-item')) return;
			this.dragData = { type: 'page', page };
			li.classList.add('dragging');
			e.dataTransfer!.effectAllowed = 'move';
		});
		li.addEventListener('dragend', () => {
			li.classList.remove('dragging');
			this.dragData = null;
			this.clearAllIndicators();
		});
		li.addEventListener('dragover', (e) => {
			if (this.dragData?.type === 'page' && this.dragData.page !== page) {
				e.preventDefault();
				const rect = li.getBoundingClientRect();
				const mid = rect.top + rect.height / 2;
				li.classList.remove('drag-over-top', 'drag-over-bottom');
				li.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
			}
		});
		li.addEventListener('dragleave', () => li.classList.remove('drag-over-top', 'drag-over-bottom'));
		li.addEventListener('drop', (e) => {
			e.preventDefault();
			const before = li.classList.contains('drag-over-top');
			li.classList.remove('drag-over-top', 'drag-over-bottom');
			if (this.dragData?.type === 'page' && this.dragData.page !== page) {
				this.reorderPage(this.dragData.page!, page, before);
			}
		});

		li.appendChild(this.createPageHeader(page));
		li.appendChild(this.createBlocksList(page));
		return li;
	}

	private createPageHeader(page: Page): HTMLElement {
		const header = document.createElement('div');
		header.className = 'page-header';
		const collapsed = this.collapsedPages.has(page.Index);

		const chevron = document.createElement('span');
		chevron.className = `chevron${collapsed ? ' collapsed' : ''}`;
		chevron.innerHTML = SVG.chevron;

		const label = document.createElement('span');
		label.className = 'page-label';
		label.textContent = `Страница ${page.Index}`;

		const count = document.createElement('span');
		count.className = 'page-count';
		count.textContent = `${page.Blocks.length}`;

		const actions = document.createElement('div');
		actions.className = 'page-actions';

		const copyBtn = this.makeActionBtn('Копировать страницу', SVG.copy, async (e) => {
			e.stopPropagation();
			await this.copyPage(page);
		});

		const deleteBtn = this.makeActionBtn('Удалить страницу', SVG.close, async (e) => {
			e.stopPropagation();
			const ok = await showConfirm(`Удалить страницу ${page.Index} со всеми блоками?`);
			if (!ok) return;
			PageManager.removePage(page);
			if (BlockManager.SelectedBlock?.PrimaryPage === page) {
				const first = PageManager.Pages[0];
				BlockManager.SelectedBlock = first?.Blocks[0] ?? null;
				if (!BlockManager.SelectedBlock) App.Controller.showStartPage();
			}
			App.Controller.render();
		});

		actions.append(copyBtn, deleteBtn);
		header.append(chevron, label, count, actions);

		header.addEventListener('click', (e) => {
			if ((e.target as HTMLElement).closest('.page-actions')) return;
			if (this.collapsedPages.has(page.Index)) {
				this.collapsedPages.delete(page.Index);
			} else {
				this.collapsedPages.add(page.Index);
			}
			this.render();
		});

		return header;
	}

	private createBlocksList(page: Page): HTMLElement {
		const ul = document.createElement('ul');
		ul.className = `block-list${this.collapsedPages.has(page.Index) ? ' collapsed' : ''}`;

		page.Blocks.forEach(block => ul.appendChild(this.createBlockElement(block, page)));

		if (page.Blocks.length < LIMITS.MAX_BLOCKS_PER_PAGE) {
			ul.appendChild(this.createAddBlockButton(page));
		}

		ul.addEventListener('dragover', (e) => {
			if (this.dragData?.type === 'block' && this.dragData.block!.PrimaryPage !== page) {
				e.preventDefault();
			}
		});
		ul.addEventListener('drop', (e) => {
			if (this.dragData?.type === 'block' && this.dragData.block!.PrimaryPage !== page) {
				e.preventDefault();
				e.stopPropagation();
				this.moveBlockToPage(this.dragData.block!, page);
			}
		});

		return ul;
	}

	private createBlockElement(block: Block, page: Page): HTMLElement {
		const badgeText = block.Device
			? DEVICE_OPTIONS.get(block.Device)?.label ?? ''
			: PLACEHOLDERS.UNSPECIFIED_BLOCK_TYPE;

		const li = document.createElement('li');
		li.className = ViewId.BLOCK_ITEM;

		if (BlockManager.SelectedBlock === block) li.classList.add('active');
		li.draggable = true;

		const handle = document.createElement('span');
		handle.className = 'drag-handle';
		handle.innerHTML = SVG.drag;

		const blockLabel = document.createElement('span');
		blockLabel.className = 'block-label';
		blockLabel.textContent = `Блок ${block.Index}`;

		const typeBadge = document.createElement('span');
		typeBadge.className = 'block-type-badge';
		typeBadge.textContent = badgeText;

		const actions = document.createElement('div');
		actions.className = 'block-actions';

		const copyBtn = this.makeActionBtn('Копировать блок', SVG.copy, async (e) => {
			e.stopPropagation();
			await this.copyBlock(block, page);
		});

		const deleteBtn = this.makeActionBtn('Удалить блок', SVG.closeSmall, async (e) => {
			e.stopPropagation();
			const ok = await showConfirm(PLACEHOLDERS.CONFIRM_DELETE);
			if (!ok) return;
			page.removeBlock(block);
			if (BlockManager.SelectedBlock === block) {
				const next = page.Blocks[0] ?? PageManager.Pages[0]?.Blocks[0] ?? null;
				BlockManager.SelectedBlock = next;
				if (!next) App.Controller.showStartPage();
			}
			App.Controller.render();
		});

		actions.append(copyBtn, deleteBtn);
		li.append(handle, blockLabel, typeBadge, actions);

		li.addEventListener('click', (e) => {
			if ((e.target as HTMLElement).closest('.block-actions')) return;
			EventManager.emit('blockSelect', block);
		});

		li.addEventListener('dragstart', (e) => {
			e.stopPropagation();
			this.dragData = { type: 'block', block };
			li.classList.add('dragging');
			e.dataTransfer!.effectAllowed = 'move';
		});
		li.addEventListener('dragend', () => {
			li.classList.remove('dragging');
			this.dragData = null;
			this.clearAllIndicators();
		});
		li.addEventListener('dragover', (e) => {
			if (this.dragData?.type === 'block' && this.dragData.block !== block) {
				e.preventDefault();
				e.stopPropagation();
				const rect = li.getBoundingClientRect();
				const mid = rect.top + rect.height / 2;
				li.classList.remove('drag-over-top', 'drag-over-bottom');
				li.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
			}
		});
		li.addEventListener('dragleave', () => li.classList.remove('drag-over-top', 'drag-over-bottom'));
		li.addEventListener('drop', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const before = li.classList.contains('drag-over-top');
			li.classList.remove('drag-over-top', 'drag-over-bottom');
			if (this.dragData?.type === 'block' && this.dragData.block !== block) {
				const src = this.dragData.block!;
				if (src.PrimaryPage === page) {
					this.reorderBlockSamePage(src, block, page, before);
				} else {
					this.moveBlockToPageAt(src, block, page, before);
				}
			}
		});

		return li;
	}

	private renderAddPageButton(): void {
		const li = document.createElement('li');
		li.className = 'add-page-btn';
		li.innerHTML = `${SVG.plus} Новая страница`;
		li.onclick = () => EventManager.emit('pageAdded', PageManager.addPage());

		li.addEventListener('dragover', (e) => {
			if (this.dragData?.type === 'block') {
				e.preventDefault();
				li.classList.add('drag-over-target');
			}
		});
		li.addEventListener('dragleave', () => li.classList.remove('drag-over-target'));
		li.addEventListener('drop', (e) => {
			e.preventDefault();
			li.classList.remove('drag-over-target');
			if (this.dragData?.type === 'block' && this.dragData.block) {
				const block = this.dragData.block;
				const newPage = PageManager.addPage(false);
				if (newPage) {
					this.doMoveBlock(block, newPage, 0);
					BlockManager.SelectedBlock = block;
					EventManager.emit('pageAdded', newPage);
				}
			}
		});

		this.view.elements.menu.appendChild(li);
	}

	private createAddBlockButton(page: Page): HTMLElement {
		const li = document.createElement('li');
		li.className = 'add-block-btn';
		li.innerHTML = `${SVG.plus} Добавить блок`;
		li.onclick = () => EventManager.emit('blockAdded', BlockManager.addBlockToPage(page));
		return li;
	}

	private reorderPage(source: Page, target: Page, insertBefore: boolean): void {
		const pages = PageManager.Pages;
		const si = pages.indexOf(source);
		if (si < 0) return;
		pages.splice(si, 1);
		const ti = pages.indexOf(target);
		if (ti < 0) return;
		pages.splice(insertBefore ? ti : ti + 1, 0, source);
		pages.forEach((p, i) => { p.Index = i + 1; });
		this.render();
	}

	private reorderBlockSamePage(source: Block, target: Block, page: Page, insertBefore: boolean): void {
		const blocks = page.Blocks;
		const si = blocks.indexOf(source);
		if (si < 0) return;
		blocks.splice(si, 1);
		const ti = blocks.indexOf(target);
		if (ti < 0) return;
		blocks.splice(insertBefore ? ti : ti + 1, 0, source);
		blocks.forEach((b, i) => { b.Index = i + 1; });
		this.render();
	}

	private moveBlockToPageAt(source: Block, target: Block, targetPage: Page, insertBefore: boolean): void {
		const ti = targetPage.Blocks.indexOf(target);
		const insertIdx = insertBefore ? ti : ti + 1;
		this.doMoveBlock(source, targetPage, insertIdx);
	}

	private moveBlockToPage(source: Block, targetPage: Page): void {
		this.doMoveBlock(source, targetPage, targetPage.Blocks.length);
	}

	private doMoveBlock(block: Block, targetPage: Page, insertIdx: number): void {
		const sourcePage = block.PrimaryPage;
		if (sourcePage === targetPage) return;

		const srcIdx = sourcePage.Blocks.indexOf(block);
		if (srcIdx >= 0) sourcePage.Blocks.splice(srcIdx, 1);
		sourcePage.Blocks.forEach((b, i) => { b.Index = i + 1; });

		targetPage.Blocks.splice(insertIdx, 0, block);
		block.PrimaryPage = targetPage;
		targetPage.Blocks.forEach((b, i) => { b.Index = i + 1; });

		this.cascadeOverflow(targetPage);

		if (sourcePage.Blocks.length === 0) {
			sourcePage.onBlockRemoved();
		}

		this.render();
	}

	private async copyBlock(block: Block, page: Page): Promise<void> {
		if (this.blockHasErrors(block)) {
			const ok = await showConfirm(
				`В блоке ${block.Index} есть незаполненные обязательные поля или ошибки. Скопировать как есть?`,
			);
			if (!ok) return;
		}

		const newBlock = this.cloneBlock(block, page);
		const idx = page.Blocks.indexOf(block);

		page.Blocks.splice(idx + 1, 0, newBlock);
		page.Blocks.forEach((b, i) => { b.Index = i + 1; });

		this.cascadeOverflow(page);

		BlockManager.SelectedBlock = newBlock;
		App.Controller.render();
	}

	/** If page has >MAX blocks, pop the last one and push to next page (recursively) */
	private cascadeOverflow(page: Page): void {
		while (page.Blocks.length > LIMITS.MAX_BLOCKS_PER_PAGE) {
			const overflow = page.Blocks.pop()!;
			page.Blocks.forEach((b, i) => { b.Index = i + 1; });

			const pages = PageManager.Pages;
			const pageIdx = pages.indexOf(page);
			let nextPage = pages[pageIdx + 1];

			if (!nextPage) {
				nextPage = PageManager.addPage(false)!;
			}

			overflow.PrimaryPage = nextPage;
			nextPage.Blocks.splice(0, 0, overflow);
			nextPage.Blocks.forEach((b, i) => { b.Index = i + 1; });

			page = nextPage;
		}
	}

	private cloneBlock(source: Block, targetPage: Page): Block {
		const newBlock = new Block(targetPage);
		newBlock.Device = source.Device;
		newBlock.DeviceVariant = source.DeviceVariant;

		if (source.Device) {
			// Безусловно сохраняем текущие значения полей в data исходного блока —
			// включая пустые и невалидные, чтобы копия отражала то, что пользователь видит.
			source.writeFieldsToData();
			const json = source.toJSON();
			for (const [key, value] of Object.entries(json.data)) {
				if (key !== 'variant_type' && key !== 'variant') {
					newBlock.setParam(key, value);
				}
			}
			if (json.data.variant) {
				for (const [key, value] of Object.entries(json.data.variant)) {
					newBlock.setParam(key, value);
				}
			}
			// Генерируем поля копии и синхронизируем их значения с data,
			// чтобы панель ошибок сразу видела корректное состояние копии.
			newBlock.UI.populateFields();
		}
		return newBlock;
	}

	private async copyPage(page: Page): Promise<void> {
		const badBlocks = page.Blocks.filter(b => this.blockHasErrors(b));
		if (badBlocks.length > 0) {
			const list = badBlocks.map(b => b.Index).join(', ');
			const ok = await showConfirm(
				`На странице ${page.Index} есть блоки с ошибками (${list}). Скопировать страницу как есть?`,
			);
			if (!ok) return;
		}

		const newPage = PageManager.addPage(false);
		if (!newPage) return;

		for (const block of page.Blocks) {
			const copy = this.cloneBlock(block, newPage);
			newPage.Blocks.push(copy);
		}
		newPage.Blocks.forEach((b, i) => { b.Index = i + 1; });

		const pages = PageManager.Pages;
		const fromIdx = pages.indexOf(newPage);
		const toIdx = pages.indexOf(page) + 1;
		if (fromIdx !== toIdx) {
			pages.splice(fromIdx, 1);
			pages.splice(toIdx, 0, newPage);
			pages.forEach((p, i) => { p.Index = i + 1; });
		}

		EventManager.emit('pageAdded', newPage);
	}

	/** Блок считается «с ошибками», если не выбран тип/подтип или есть невалидные поля. */
	private blockHasErrors(block: Block): boolean {
		if (!block.Device) return true;
		if (block.isVariantMissing()) return true;
		return !block.validate();
	}

	private makeActionBtn(title: string, svgHtml: string, onClick: (e: MouseEvent) => void): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.className = 'action-btn';
		btn.title = title;
		btn.innerHTML = svgHtml;
		btn.addEventListener('click', onClick as any);
		return btn;
	}

	private clearAllIndicators(): void {
		document.querySelectorAll('.drag-over-top, .drag-over-bottom, .dragging').forEach(el => {
			el.classList.remove('drag-over-top', 'drag-over-bottom', 'dragging');
		});
	}
}
