import { FileOptions } from 'buffer';
import { Feature } from '../../data/enums/feature';
import { FieldOption, FieldSettings, FieldType } from './field';

interface EnumOption {
	label: string;
	placeholder?: string;
}

interface ColorOption {
	label: string;
	color: string;
}

interface ParamOption {
	// заголовок для поля
	label: string;
	// placeholder для поля
	placeholder?: string;
	// тип поля
	fieldType: FieldType;
	// опции для выбора
	fieldOptions?: FieldOption[];
	// настройки поля
	fieldSettings?: FieldSettings;
	// тип свойства (Feature)
	feature?: Feature;
	// настройки панели со свойством
	featurePanelSettings?: FeaturePanelSettings;
	// тип ламели для поля lameli ('slider' или 'buttons')
	lameliType?: 'slider' | 'buttons';
	// обязательный ли (значение должно быть непустым)
	required?: true;
	// если true — ключ можно полностью опустить в JSON (иначе: должен быть в JSON, пусть и пустой)
	optional?: true;
	// путь сохранения в таблице относительно блока, например: 'data', 'data/variant', 'data/variant/something'
	savePath?: Path;
    // порядок поля в JSON (меньше значение — выше поле)
    order?: number;
}
