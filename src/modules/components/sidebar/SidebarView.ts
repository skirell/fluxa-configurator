import { ViewId } from '../../../data/enums/view-id';
import { getElement } from '../../../utils/dom-utils';

export class SidebarView {
	public readonly elements: {
		menu: HTMLElement;
	};

	constructor() {
		this.elements = {
			menu: getElement(`${ViewId.MENU}`),
		};
	}
}
