import { LIMITS } from '../../../data/constants/limits';
import { showToast } from '../../../utils/alert-utils';
import { renumberInstances } from '../../../utils/dom-utils';
import EventManager from '../../managers/EventManager/EventManager';
import Block from '../block/Block';

export class Page implements IJsonSerializable {
	public Index: number;
	public readonly Blocks: Block[];

	constructor(addFirstBlock: boolean = true) {
		this.Index = 1;
		this.Blocks = [];

		if (addFirstBlock) this.init();
	}

	public toJSON(): SerializedPage {
		return {
			page: this.Index,
			blocks: this.Blocks.filter(block => {
				return block.validate();
			}).map(block => {
				block.save();
				return block.toJSON();
			}),
		};
	}

	private init() {
		EventManager.emit('blockSelect', this.addBlock());
	}

	public onBlockRemoved(): void {
	}

	public addBlock(): Block | undefined {
		if (this.Blocks.length >= LIMITS.MAX_BLOCKS_PER_PAGE) {
			showToast(`На странице может быть не больше ${LIMITS.MAX_BLOCKS_PER_PAGE} блоков.`, { type: 'warning' });
			return;
		}

		const block = new Block(this);
		this.Blocks.push(block);
		this.renumberBlocks();
		return block;
	}

	public insertBlock(block: Block, atIndex?: number): void {
		block.PrimaryPage = this;
		if (atIndex !== undefined && atIndex >= 0 && atIndex <= this.Blocks.length) {
			this.Blocks.splice(atIndex, 0, block);
		} else {
			this.Blocks.push(block);
		}
		this.renumberBlocks();
	}

	public removeBlock(block: Block): void {
		const index = this.Blocks.indexOf(block);
		if (index < 0) {
			showToast('Блок для удаления не найден.', { type: 'error' });
			return;
		}

		this.Blocks.splice(index, 1);
		block.UI.clearFields();
		this.renumberBlocks();
		this.onBlockRemoved();
	}

	private renumberBlocks(): void {
		renumberInstances(this.Blocks);
	}
}
