import { LIMITS } from '../../../data/constants/limits';
import { showToast } from '../../../utils/alert-utils';
import { renumberInstances } from '../../../utils/dom-utils';
import { Page } from '../../components/page/Page';

class PageManager {
	private static instance: PageManager;
	public readonly Pages: Page[] = [];

	private constructor() {}

	public static getInstance(): PageManager {
		if (!PageManager.instance) PageManager.instance = new PageManager();
		return PageManager.instance;
	}

	public addPage(addFirstBlock: boolean = true): Page | undefined {
		if (this.Pages.length >= LIMITS.MAX_PAGES) {
			showToast(`Можно добавить не больше ${LIMITS.MAX_PAGES} страниц.`, { type: 'warning' });
			return;
		}

		const page = new Page(addFirstBlock);
		page.onBlockRemoved = () => {
			if (page.Blocks.length <= 0) this.removePage(page);
		};

		this.Pages.push(page);
		this.renumberPages();

		return page;
	}

	public removePage(page: Page): void {
		const index = this.Pages.indexOf(page);
		if (index < 0) {
			showToast('Страница для удаления не найдена.', { type: 'error' });
			return;
		}

		this.Pages.splice(index, 1);
		page.Blocks.forEach(block => block.UI.clearFields());
		this.renumberPages();
	}

	public clearPages(): void {
		this.Pages.forEach(page =>
			page.Blocks.forEach(block => block.UI.clearFields()),
		);
		this.Pages.splice(0);
	}

	private renumberPages(): void {
		renumberInstances(this.Pages);
	}
}

export default PageManager.getInstance();
