export enum Operator {
	// проверяет, содержит ли массив указанное значение (примитив).
	arrayIncludes = 'arrayIncludes',
	// проверяет, содержит ли массив объект с указанным ключом и значением.
	arrayIncludesObject = 'arrayIncludesObject',
	// проверяет, что все элементы массива удовлетворяют условию (для объекта).
	arrayEvery = 'arrayEvery',
	// проверяет, что хотя бы один элемент массива удовлетворяет условию.
	arraySome = 'arraySome',
	// проверяет равенство значений, реагирует, если они равны
	equals = 'equals',
	// проверяет равенство значений, и реагирует, если они отличаются
	notEquals = 'notEquals',
	// проверяет, что содержит ли value у поля указаное значение (работает только со строками)
	contains = 'contains',
	// проверяет, если поле пустое, то среагирует
	empty = 'empty',
	// проверяет, больше ли значение у поля, чем указаное
	greaterThan = 'greaterThan',
}

export enum ConditionOperator {
	and = 'and',
	or = 'or',
}
