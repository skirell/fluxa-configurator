import { clipboard } from 'electron';
import { LIMITS } from '../../../data/constants/limits';
import { PLACEHOLDERS } from '../../../data/constants/placeholders';
import { Device } from '../../../data/enums/device';
import { ViewId } from '../../../data/enums/view-id';
import { DEVICE_OPTIONS } from '../../../data/settings/options/device-options';
import { SerializedBlock } from '../../../global/types/block';
import { showConfirm, showToast } from '../../../utils/alert-utils';
import BlockManager from '../../managers/BlockManager/BlockManager';
import dirtyStateManager from '../../managers/DirtyStateManager/DirtyStateManager';
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
	json: '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 3 2.5 6.5 5 10M8 3l2.5 3.5L8 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 2.5 6 10.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',
	plus: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
};

type JsonModalAction = 'paste' | 'save';

interface JsonModalOptions {
	title: string;
	initialText: string;
	placeholder: string;
	pasteText: string;
	saveText: string;
	copySuccessText: string;
	validateText?: (text: string) => string | null;
}

interface JsonModalResult {
	action: JsonModalAction;
	text: string;
}

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

		const copyBtn = this.makeActionBtn('Дублировать страницу', SVG.copy, async (e) => {
			e.stopPropagation();
			await this.copyPage(page);
		});

		const jsonBtn = this.makeActionBtn('JSON страницы', SVG.json, async (e) => {
			e.stopPropagation();
			await this.openPageJsonModal(page);
		});

		const deleteBtn = this.makeActionBtn('Удалить страницу', SVG.close, async (e) => {
			e.stopPropagation();
			const ok = await showConfirm({
				title: 'Удалить страницу?',
				message: `Страница ${page.Index} и все ее блоки будут удалены.`,
				confirmText: 'Удалить',
				cancelText: 'Отмена',
				danger: true,
			});
			if (!ok) return;
			PageManager.removePage(page);
			dirtyStateManager.markDirty();
			if (BlockManager.SelectedBlock?.PrimaryPage === page) {
				const first = PageManager.Pages[0];
				BlockManager.SelectedBlock = first?.Blocks[0] ?? null;
				if (!BlockManager.SelectedBlock) App.Controller.showStartPage();
			}
			App.Controller.render();
		});

		actions.append(copyBtn, jsonBtn, deleteBtn);
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
				if (this.isPageFullForExternalBlock(this.dragData.block!, page)) {
					ul.closest('.page-item')?.classList.add('drag-over-bottom');
				}
			}
		});
		ul.addEventListener('dragleave', (e) => {
			const pageItem = ul.closest('.page-item');
			const related = e.relatedTarget as Node | null;
			if (!related || !pageItem?.contains(related)) {
				pageItem?.classList.remove('drag-over-bottom');
			}
		});
		ul.addEventListener('drop', (e) => {
			if (this.dragData?.type === 'block' && this.dragData.block!.PrimaryPage !== page) {
				e.preventDefault();
				e.stopPropagation();
				ul.closest('.page-item')?.classList.remove('drag-over-bottom');
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

		const copyBtn = this.makeActionBtn('Дублировать блок', SVG.copy, async (e) => {
			e.stopPropagation();
			await this.copyBlock(block, page);
		});

		const jsonBtn = this.makeActionBtn('JSON блока', SVG.json, async (e) => {
			e.stopPropagation();
			await this.openBlockJsonModal(block, page);
		});

		const deleteBtn = this.makeActionBtn('Удалить блок', SVG.closeSmall, async (e) => {
			e.stopPropagation();
			const ok = await showConfirm({
				title: 'Удалить блок?',
				message: `Блок ${block.Index} будет удален со страницы ${page.Index}.`,
				confirmText: 'Удалить',
				cancelText: 'Отмена',
				danger: true,
			});
			if (!ok) return;
			page.removeBlock(block);
			dirtyStateManager.markDirty();
			if (BlockManager.SelectedBlock === block) {
				const next = page.Blocks[0] ?? PageManager.Pages[0]?.Blocks[0] ?? null;
				BlockManager.SelectedBlock = next;
				if (!next) App.Controller.showStartPage();
			}
			App.Controller.render();
		});

		actions.append(copyBtn, jsonBtn, deleteBtn);
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

				if (this.isPageFullForExternalBlock(this.dragData.block!, page)) {
					li.classList.remove('drag-over-top', 'drag-over-bottom');
					li.closest('.page-item')?.classList.add('drag-over-bottom');
					return;
				}

				const rect = li.getBoundingClientRect();
				const mid = rect.top + rect.height / 2;
				li.classList.remove('drag-over-top', 'drag-over-bottom');
				li.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom');
			}
		});
		li.addEventListener('dragleave', (e) => {
			li.classList.remove('drag-over-top', 'drag-over-bottom');

			const pageItem = li.closest('.page-item');
			const related = e.relatedTarget as Node | null;
			if (!related || !pageItem?.contains(related)) {
				pageItem?.classList.remove('drag-over-bottom');
			}
		});
		li.addEventListener('drop', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const before = li.classList.contains('drag-over-top');
			li.classList.remove('drag-over-top', 'drag-over-bottom');
			li.closest('.page-item')?.classList.remove('drag-over-bottom');
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
		dirtyStateManager.markDirty();
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
		dirtyStateManager.markDirty();
		this.render();
	}

	private moveBlockToPageAt(source: Block, target: Block, targetPage: Page, insertBefore: boolean): void {
		if (this.isPageFullForExternalBlock(source, targetPage)) {
			this.moveBlockToNewPageAfter(source, targetPage);
			return;
		}

		const ti = targetPage.Blocks.indexOf(target);
		const insertIdx = insertBefore ? ti : ti + 1;
		this.doMoveBlock(source, targetPage, insertIdx);
	}

	private moveBlockToPage(source: Block, targetPage: Page): void {
		if (this.isPageFullForExternalBlock(source, targetPage)) {
			this.moveBlockToNewPageAfter(source, targetPage);
			return;
		}

		this.doMoveBlock(source, targetPage, targetPage.Blocks.length);
	}

	private isPageFullForExternalBlock(block: Block, targetPage: Page): boolean {
		return (
			block.PrimaryPage !== targetPage &&
			targetPage.Blocks.length >= LIMITS.MAX_BLOCKS_PER_PAGE
		);
	}

	private moveBlockToNewPageAfter(block: Block, targetPage: Page): void {
		const newPage = this.createPageAfter(targetPage);
		if (!newPage) return;

		this.doMoveBlock(block, newPage, 0);
		EventManager.emit('pageAdded', newPage);
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

		if (sourcePage.Blocks.length === 0) {
			sourcePage.onBlockRemoved();
		}

		dirtyStateManager.markDirty();
		this.render();
	}

	private async copyBlock(block: Block, page: Page): Promise<void> {
		if (this.blockHasErrors(block)) {
			const ok = await showConfirm({
				title: 'Скопировать блок с ошибками?',
				message: `В блоке ${block.Index} есть незаполненные обязательные поля или ошибки.`,
				confirmText: 'Скопировать',
				cancelText: 'Отмена',
			});
			if (!ok) return;
		}

		const newBlock = this.cloneBlock(block, page);
		const idx = page.Blocks.indexOf(block);

		if (page.Blocks.length >= LIMITS.MAX_BLOCKS_PER_PAGE) {
			const newPage = this.createPageAfter(page);
			if (!newPage) return;

			newPage.Blocks.push(newBlock);
			newPage.Blocks.forEach((b, i) => { b.Index = i + 1; });

			BlockManager.SelectedBlock = newBlock;
			dirtyStateManager.markDirty();
			EventManager.emit('pageAdded', newPage);
			return;
		}

		page.Blocks.splice(idx + 1, 0, newBlock);
		page.Blocks.forEach((b, i) => { b.Index = i + 1; });

		BlockManager.SelectedBlock = newBlock;
		dirtyStateManager.markDirty();
		App.Controller.render();
	}

	private createPageAfter(page: Page): Page | undefined {
		const newPage = PageManager.addPage(false);
		if (!newPage) return;

		const pages = PageManager.Pages;
		const fromIdx = pages.indexOf(newPage);
		const toIdx = pages.indexOf(page) + 1;

		if (fromIdx >= 0 && toIdx > 0 && fromIdx !== toIdx) {
			pages.splice(fromIdx, 1);
			pages.splice(toIdx, 0, newPage);
			pages.forEach((p, i) => { p.Index = i + 1; });
		}

		return newPage;
	}

	private async openBlockJsonModal(block: Block, page: Page): Promise<void> {
		const serializedBlock = this.serializeBlockForJson(block);
		const result = await this.promptJson({
			title: `JSON блока ${block.Index}`,
			initialText: serializedBlock ? JSON.stringify(serializedBlock, null, 2) : '',
			placeholder: '{"block":1,"type":"light","data":{...}}',
			pasteText: 'Вставить блок',
			saveText: 'Сохранить блок',
			copySuccessText: 'JSON блока скопирован в буфер обмена.',
			validateText: text => this.validateBlockJsonText(text),
		});
		if (!result) return;

		const parsed = this.parseJson(result.text);
		const normalizedBlock = parsed ? this.normalizeBlockJson(parsed) : null;
		if (!normalizedBlock) {
			showToast('Не удалось обработать JSON блока.', { type: 'error' });
			return;
		}

		if (result.action === 'paste') {
			await this.insertBlockJsonAfter(block, page, normalizedBlock);
			return;
		}

		await this.saveBlockJson(block, page, normalizedBlock);
	}

	private async openPageJsonModal(page: Page): Promise<void> {
		const serializedPage = this.serializePageForJson(page);
		const result = await this.promptJson({
			title: `JSON страницы ${page.Index}`,
			initialText: serializedPage ? JSON.stringify(serializedPage, null, 2) : '',
			placeholder: '{"page":1,"blocks":[{"block":1,"type":"light","data":{...}}]}',
			pasteText: 'Вставить страницу',
			saveText: 'Сохранить страницу',
			copySuccessText: 'JSON страницы скопирован в буфер обмена.',
			validateText: text => this.validatePageJsonText(text),
		});
		if (!result) return;

		const parsed = this.parseJson(result.text);
		const normalizedPage = parsed ? this.normalizePageJson(parsed) : null;
		if (!normalizedPage) {
			showToast('Не удалось обработать JSON страницы.', { type: 'error' });
			return;
		}
		if (normalizedPage.blocks.length > LIMITS.MAX_BLOCKS_PER_PAGE) {
			showToast(`На странице может быть не больше ${LIMITS.MAX_BLOCKS_PER_PAGE} блоков.`, { type: 'warning' });
			return;
		}

		if (result.action === 'paste') {
			await this.insertPageJsonAfter(page, normalizedPage);
			return;
		}

		await this.savePageJson(page, normalizedPage);
	}

	private validateBlockJsonText(text: string): string | null {
		if (!text) return 'Вставьте JSON блока.';

		const parsed = this.parseJson(text);
		if (!parsed || !this.normalizeBlockJson(parsed)) {
			return 'Ожидается JSON блока вида: {"block":1,"type":"light","data":{...}}';
		}

		return null;
	}

	private validatePageJsonText(text: string): string | null {
		if (!text) return 'Вставьте JSON страницы.';

		const parsed = this.parseJson(text);
		const page = parsed ? this.normalizePageJson(parsed) : null;
		if (!page) {
			return 'Ожидается JSON страницы вида: {"page":1,"blocks":[...]}';
		}
		if (page.blocks.length > LIMITS.MAX_BLOCKS_PER_PAGE) {
			return `На странице может быть не больше ${LIMITS.MAX_BLOCKS_PER_PAGE} блоков.`;
		}

		return null;
	}

	private async insertBlockJsonAfter(block: Block, page: Page, serializedBlock: SerializedBlock): Promise<void> {
		const blockIdx = page.Blocks.indexOf(block);
		if (blockIdx < 0) {
			showToast('Блок для вставки не найден.', { type: 'error' });
			return;
		}

		const targetPage = page.Blocks.length >= LIMITS.MAX_BLOCKS_PER_PAGE
			? this.createPageAfter(page)
			: page;
		if (!targetPage) return;

		const insertIdx = targetPage === page ? blockIdx + 1 : 0;
		const createdBlock = this.insertBlockFromJson(targetPage, serializedBlock, insertIdx);
		if (!createdBlock) return;

		BlockManager.SelectedBlock = createdBlock;
		dirtyStateManager.markDirty();
		if (targetPage === page) App.Controller.render();
		else EventManager.emit('pageAdded', targetPage);
		showToast('JSON блока вставлен.', { type: 'success' });
	}

	private async insertPageJsonAfter(page: Page, serializedPage: SerializedPage): Promise<void> {
		const newPage = this.createPageAfter(page);
		if (!newPage) return;

		for (const serializedBlock of serializedPage.blocks) {
			this.insertBlockFromJson(newPage, serializedBlock, newPage.Blocks.length);
		}

		BlockManager.SelectedBlock = newPage.Blocks[0] ?? null;
		dirtyStateManager.markDirty();
		EventManager.emit('pageAdded', newPage);
		showToast('JSON страницы вставлен.', { type: 'success' });
	}

	private async saveBlockJson(block: Block, page: Page, serializedBlock: SerializedBlock): Promise<void> {
		const blockIdx = page.Blocks.indexOf(block);
		if (blockIdx < 0) {
			showToast('Блок для сохранения не найден.', { type: 'error' });
			return;
		}

		page.Blocks.splice(blockIdx, 1);
		const savedBlock = this.insertBlockFromJson(page, serializedBlock, blockIdx);
		if (!savedBlock) {
			page.Blocks.splice(blockIdx, 0, block);
			page.Blocks.forEach((b, i) => { b.Index = i + 1; });
			showToast('Не удалось сохранить JSON блока.', { type: 'error' });
			return;
		}

		BlockManager.SelectedBlock = savedBlock;
		block.UI.clearFields();
		dirtyStateManager.markDirty();
		App.Controller.render();
		showToast('JSON блока сохранен.', { type: 'success' });
	}

	private async savePageJson(page: Page, serializedPage: SerializedPage): Promise<void> {
		const previousBlocks = page.Blocks.slice();
		page.Blocks.splice(0);

		for (const serializedBlock of serializedPage.blocks) {
			const savedBlock = this.insertBlockFromJson(page, serializedBlock, page.Blocks.length);
			if (!savedBlock) {
				page.Blocks.forEach(block => block.UI.clearFields());
				page.Blocks.splice(0, page.Blocks.length, ...previousBlocks);
				page.Blocks.forEach((b, i) => {
					b.PrimaryPage = page;
					b.Index = i + 1;
				});
				showToast('Не удалось сохранить JSON страницы.', { type: 'error' });
				return;
			}
		}
		previousBlocks.forEach(block => block.UI.clearFields());

		BlockManager.SelectedBlock = page.Blocks[0] ?? null;
		dirtyStateManager.markDirty();
		App.Controller.render();
		showToast('JSON страницы сохранен.', { type: 'success' });
	}

	private serializeBlockForJson(block: Block): SerializedBlock | null {
		if (!block.Device) return null;

		block.writeFieldsToData();
		return block.toJSON();
	}

	private serializePageForJson(page: Page): SerializedPage | null {
		const blocks: SerializedBlock[] = [];

		for (const block of page.Blocks) {
			const serializedBlock = this.serializeBlockForJson(block);
			if (!serializedBlock) return null;
			blocks.push(serializedBlock);
		}

		return {
			page: page.Index,
			blocks,
		};
	}

	private insertBlockFromJson(page: Page, serializedBlock: SerializedBlock, insertIdx: number): Block | undefined {
		const createdBlock = BlockManager.loadBlockToPage(page, serializedBlock);
		if (!createdBlock) return;

		const currentIdx = page.Blocks.indexOf(createdBlock);
		if (currentIdx >= 0 && insertIdx >= 0 && insertIdx < currentIdx) {
			page.Blocks.splice(currentIdx, 1);
			page.Blocks.splice(insertIdx, 0, createdBlock);
		}

		page.Blocks.forEach((b, i) => { b.Index = i + 1; });
		return createdBlock;
	}

	private parseJson(text: string): unknown | null {
		try {
			return JSON.parse(text);
		} catch {
			return null;
		}
	}

	private normalizeBlockJson(value: unknown): SerializedBlock | null {
		if (!this.isPlainObject(value)) return null;

		const block = value as Partial<SerializedBlock>;
		if (!this.isKnownDevice(block.type)) return null;
		if (!this.isPlainObject(block.data)) return null;

		return {
			block: this.normalizeIndex(block.block),
			type: block.type,
			data: block.data,
		};
	}

	private normalizePageJson(value: unknown): SerializedPage | null {
		let pageCandidate = value;
		if (this.isPlainObject(value) && Array.isArray((value as Config).screens)) {
			const screens = (value as Config).screens;
			if (screens.length !== 1) return null;
			pageCandidate = screens[0];
		}
		if (!this.isPlainObject(pageCandidate)) return null;

		const page = pageCandidate as Partial<SerializedPage>;
		if (!Array.isArray(page.blocks)) return null;

		const blocks: SerializedBlock[] = [];
		for (const blockCandidate of page.blocks) {
			const block = this.normalizeBlockJson(blockCandidate);
			if (!block) return null;
			blocks.push(block);
		}

		return {
			page: this.normalizeIndex(page.page),
			blocks,
		};
	}

	private normalizeIndex(value: unknown): number {
		return typeof value === 'number' && Number.isFinite(value) && value > 0
			? value
			: 1;
	}

	private isPlainObject(value: unknown): value is Record<string, any> {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	}

	private isKnownDevice(value: unknown): value is Device {
		return typeof value === 'string' && (Object.values(Device) as string[]).includes(value);
	}

	private async promptJson(options: JsonModalOptions): Promise<JsonModalResult | null> {
		return new Promise(resolve => {
			const overlay = document.createElement('div');
			overlay.className = 'json-modal-overlay';

			const dialog = document.createElement('div');
			dialog.className = 'json-modal';

			const heading = document.createElement('h2');
			heading.className = 'json-modal-title';
			heading.textContent = options.title;

			const textarea = document.createElement('textarea');
			textarea.className = 'json-modal-textarea';
			textarea.spellcheck = false;
			textarea.placeholder = options.placeholder;
			textarea.value = options.initialText;

			const error = document.createElement('div');
			error.className = 'json-modal-error';
			error.hidden = true;

			const actions = document.createElement('div');
			actions.className = 'json-modal-actions';

			const copyBtn = document.createElement('button');
			copyBtn.type = 'button';
			copyBtn.className = 'json-modal-btn';
			copyBtn.textContent = 'Скопировать JSON';
			copyBtn.addEventListener('click', async () => {
				const text = textarea.value.trim();
				if (!text) {
					showError('В поле нет JSON для копирования.');
					textarea.focus();
					return;
				}
				clipboard.writeText(text);
				showToast(options.copySuccessText, { type: 'success' });
				textarea.focus();
			});

			const cancelBtn = document.createElement('button');
			cancelBtn.type = 'button';
			cancelBtn.className = 'json-modal-btn';
			cancelBtn.textContent = 'Отмена';

			const pasteBtn = document.createElement('button');
			pasteBtn.type = 'button';
			pasteBtn.className = 'json-modal-btn';
			pasteBtn.textContent = options.pasteText;

			const saveBtn = document.createElement('button');
			saveBtn.type = 'button';
			saveBtn.className = 'json-modal-btn json-modal-btn-primary';
			saveBtn.textContent = options.saveText;

			const close = (value: JsonModalResult | null) => {
				document.removeEventListener('keydown', onKeyDown);
				overlay.remove();
				resolve(value);
			};
			const showError = (message: string) => {
				error.textContent = message;
				error.hidden = false;
			};
			const clearError = () => {
				error.textContent = '';
				error.hidden = true;
			};
			const attemptAction = (action: JsonModalAction) => {
				const text = textarea.value.trim();
				const validationError = options.validateText?.(text) ?? null;
				if (validationError) {
					showError(validationError);
					textarea.focus();
					return;
				}
				close({ action, text });
			};
			const onKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Escape') close(null);
				if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
					attemptAction('save');
				}
			};

			textarea.addEventListener('input', clearError);
			cancelBtn.addEventListener('click', () => close(null));
			pasteBtn.addEventListener('click', () => attemptAction('paste'));
			saveBtn.addEventListener('click', () => attemptAction('save'));
			overlay.addEventListener('mousedown', e => {
				if (e.target === overlay) close(null);
			});

			actions.append(copyBtn, pasteBtn, cancelBtn, saveBtn);
			dialog.append(heading, textarea, error, actions);
			overlay.appendChild(dialog);
			document.body.appendChild(overlay);
			document.addEventListener('keydown', onKeyDown);

			textarea.focus();
			textarea.select();
		});
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
			const ok = await showConfirm({
				title: 'Скопировать страницу с ошибками?',
				message: `На странице ${page.Index} есть блоки с ошибками: ${list}.`,
				confirmText: 'Скопировать',
				cancelText: 'Отмена',
			});
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

		dirtyStateManager.markDirty();
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
