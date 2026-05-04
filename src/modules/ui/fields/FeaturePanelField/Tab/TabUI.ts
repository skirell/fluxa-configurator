import { ParamOption } from '../../../../../global/types/option';
import { createFieldInstance } from '../../../../../utils/field-utils';
import { getFeatureParams } from '../../../../../utils/option-utils';
import { FieldsManager } from '../../../../managers/FieldsManager';
import Tab from './Tab';

export default class TabUI extends FieldsManager {
	constructor(private readonly tab: Tab) {
		super(createFieldInstance);
	}

	protected getParamOptions(): ReadonlyMap<string, ParamOption> {
		return getFeatureParams(this.tab.Feature);
	}

	protected getParamValue(fieldKey: string, savePath?: string): any {
		return this.tab.getParam(fieldKey);
	}
}
