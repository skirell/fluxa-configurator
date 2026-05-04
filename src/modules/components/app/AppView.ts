import { ViewId } from '../../../data/enums/view-id';
import { getElement } from '../../../utils/dom-utils';

export class AppView {
	public readonly elements: {
		startPage: HTMLElement;
		header: HTMLElement;
		blockConfig: HTMLElement;
		jsonOutput: HTMLElement;
		jsonPreview: HTMLElement;
		saveConfigButton: HTMLButtonElement;
		loadConfigButton: HTMLButtonElement;
		showJsonPreviewButton: HTMLButtonElement;
		showStartPageButton: HTMLElement;
		newConfigButton: HTMLButtonElement;
		homeLoadButton: HTMLButtonElement;
		homeDocsLink: HTMLAnchorElement;
		homeVersion: HTMLElement;
		closePreviewButton: HTMLButtonElement;
		sidebarFooter: HTMLElement;
		newProjectButton: HTMLButtonElement;
		clearProjectButton: HTMLButtonElement;
		rightPanel: HTMLElement;
		rightSections: HTMLElement;
		rightActivityBar: HTMLElement;
	};

	constructor() {
		this.elements = {
			startPage: getElement(ViewId.START_PAGE),
			header: getElement(ViewId.TOOLBAR_TITLE),
			blockConfig: getElement(ViewId.BLOCK_CONFIG),
			jsonOutput: getElement(ViewId.FULL_JSON_OUTPUT),
			jsonPreview: getElement(ViewId.FULL_JSON_PREVIEW),
			saveConfigButton: getElement(ViewId.SAVE_CONFIG_BUTTON),
			loadConfigButton: getElement(ViewId.LOAD_CONFIG_BUTTON),
			showJsonPreviewButton: getElement(ViewId.SHOW_JSON_PREVIEW_BUTTON),
			showStartPageButton: getElement(ViewId.SHOW_START_PAGE_BUTTON),
			newConfigButton: getElement(ViewId.NEW_CONFIG_BUTTON),
			homeLoadButton: getElement(ViewId.HOME_LOAD_BUTTON),
			homeDocsLink: getElement(ViewId.HOME_DOCS_LINK),
			homeVersion: getElement(ViewId.HOME_VERSION),
			closePreviewButton: getElement(ViewId.CLOSE_PREVIEW_BUTTON),
			sidebarFooter: getElement(ViewId.SIDEBAR_FOOTER),
			newProjectButton: getElement(ViewId.NEW_PROJECT_BUTTON),
			clearProjectButton: getElement(ViewId.CLEAR_PROJECT_BUTTON),
			rightPanel: getElement(ViewId.RIGHT_PANEL),
			rightSections: getElement('right-sections'),
			rightActivityBar: getElement(ViewId.RIGHT_ACTIVITY_BAR),
		};
	}
}
