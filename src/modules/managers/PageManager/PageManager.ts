import { LIMITS } from '../../../data/constants/limits';
import { PLACEHOLDERS } from '../../../data/constants/placeholders';
import { showMessage } from '../../../utils/alert-utils';
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
			showMessage(`${PLACEHOLDERS.LIMIT_REACHED} страниц!`);
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
			showMessage('Страница для удаления не найдена!');
			return;
		}

		this.Pages.splice(index, 1);
		this.renumberPages();
	}

	public clearPages(): void {
		this.Pages.splice(0);
	}

	private renumberPages(): void {
		renumberInstances(this.Pages);
	}
}

export default PageManager.getInstance();
