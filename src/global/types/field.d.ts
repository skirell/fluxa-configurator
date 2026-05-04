import { Action } from '../../data/enums/action';
import { ConditionOperator, Operator } from '../../data/enums/operator';
import { BaseField } from '../../modules/ui/fields';

type FieldType = 'text' | 'number' | CustomFieldType;

type CustomFieldType = 'color' | 'boolean' | 'options' | 'feature' | icon | 'color_type' | 'lameli';

interface FieldOption {
	label: string;
	value: any;
}

interface FieldSettings {
	// максимальная длина для text
	maxLength?: number;
	// минимальная длина для text
	minLength?: number;
	// максимальное значение для number
	maxNumber?: number;
	// минимальное значение для number
	minNumber?: number;
	// шаг для числа
	step?: number | 'any';
	// поведение поля
	behavior?: FieldBehavior;
}

interface FieldBehavior {
	// зависимости для поля
	dependencies: FieldDependency[];
	// оператор который будет стоять между зависимостями: либо все, либо одно из
	operator?: ConditionOperator;
	// действия для true и для false (если условия зависимости не соблюдены)
	actions?: {
		true: FieldAction[];
		false: FieldAction[];
	};
}

interface FieldDependency {
	// ключ поля, по которому будет зависимость
	fieldKey: string;
	// оператор для выявления сходства
	operator: Operator;
	// ключ поля, если зависимое поле возвращает массив в методе getValue()
	key?: string;
	// значение для сравнения, если поле возвращает не массив
	value?: any;
	// состояние для сравнения значения по ключу в массиве (работает только совместно с key),
	condition?: {
		operator: Operator;
		value: any;
	};
}

interface FieldAction {
	// тип действия
	type: Action;
	// ключ значения, которое нужно установить для поля
	key?: string;
	// значение, если нужно установить его полю
	value?: any;
	// кастомная функция, принимает поле от которого идет зависимость, и значение зависимого поля
	custom?: (field: BaseField, targetFieldValue: any) => void;
}
