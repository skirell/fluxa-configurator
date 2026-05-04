import { ViewId } from '../../../data/enums/view-id';
import { getElement } from '../../../utils/dom-utils';

export class BlockView {
	public readonly elements: {
		deviceType: HTMLSelectElement;
		deviceVariant: HTMLSelectElement;
		blockFields: HTMLDivElement;
		saveBlockButton: HTMLButtonElement;
		removeBlockButton: HTMLButtonElement;
	};

	constructor() {
		this.elements = {
			deviceType: getElement<HTMLSelectElement>(ViewId.BLOCK_TYPE),
			deviceVariant: getElement<HTMLSelectElement>(ViewId.BLOCK_SUBTYPE),
			blockFields: getElement<HTMLDivElement>(ViewId.BLOCK_FIELDS),
			saveBlockButton: getElement<HTMLButtonElement>(
				ViewId.SAVE_BLOCK_BUTTON,
			),
			removeBlockButton: getElement<HTMLButtonElement>(
				ViewId.REMOVE_BLOCK_BUTTON,
			),
		};
	}
}
