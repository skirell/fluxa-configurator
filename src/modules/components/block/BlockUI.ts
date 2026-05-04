import { ParamOption } from '../../../global/types/option';
import { createFieldInstance } from '../../../utils/field-utils';
import { getAllParams } from '../../../utils/option-utils';
import { FieldsManager } from '../../managers/FieldsManager';
import Block from './Block';

export default class BlockUI extends FieldsManager {
	constructor(private readonly block: Block) {
		super(createFieldInstance);
	}

	protected getParamOptions(): ReadonlyMap<string, ParamOption> {
		return getAllParams(this.block);
	}

	protected getParamValue(fieldKey: string, savePath?: string): any {
		return this.block.getParam(fieldKey, savePath);
	}
}
