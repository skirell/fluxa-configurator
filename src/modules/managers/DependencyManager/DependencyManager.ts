import { Action } from '../../../data/enums/action';
import { ConditionOperator, Operator } from '../../../data/enums/operator';
import { FieldAction, FieldDependency } from '../../../global/types/field';
import BaseField from '../../ui/fields/BaseField';

export default class DependencyManager {
	private fieldMap = new Map<string, BaseField>();

	/** Регистрирует поле в менеджере и подписывается на его изменения */
	public registerField(field: BaseField): void {
		this.fieldMap.set(field.key, field);
		field.onChange(newValue => this.handleFieldChange(field.key, newValue));
	}

	/** Оценивает зависимости у всех зарегистрированных полей (например, после загрузки конфига) */
	public evaluateAll(): void {
		for (const targetField of this.fieldMap.values()) {
			if (!targetField.settings.behavior) continue;
			this.evaluateBehavior(targetField, targetField.key);
		}
	}

	/** Обрабатывает изменение значения поля */
	private handleFieldChange(changedKey: string, newValue: any): void {
		for (const targetField of this.fieldMap.values()) {
			const behavior = targetField.settings.behavior;
			if (!behavior) continue;

			// Есть ли у targetField зависимости от changedKey?
			const hasDependency = behavior.dependencies.some(
				dep => dep.fieldKey === changedKey,
			);
			if (!hasDependency) continue;

			this.evaluateBehavior(targetField, changedKey);
		}
	}

	/** Оценивает поведение одного поля и выполняет соответствующие действия */
	private evaluateBehavior(targetField: BaseField, sourceKey: string): void {
		const behavior = targetField.settings.behavior;
		if (!behavior) return;

		const dependencyResults = behavior.dependencies.map(dep =>
			this.evaluateDependency(dep),
		);

		const conditionOp = behavior.operator ?? ConditionOperator.and;
		const isConditionMet =
			conditionOp === ConditionOperator.and
				? dependencyResults.every(result => result)
				: dependencyResults.some(result => result);

		const actionsToExecute = isConditionMet
			? (behavior.actions?.true ?? [])
			: (behavior.actions?.false ?? []);

		actionsToExecute.forEach(action =>
			this.executeAction(action, targetField, sourceKey),
		);
	}

	/** Оценивает одно условие зависимости */
	private evaluateDependency(dependency: FieldDependency): boolean {
		const sourceField = this.fieldMap.get(dependency.fieldKey);
		if (!sourceField) return false;

		const sourceValue = sourceField.getValue();
		const operator = dependency.operator ?? Operator.equals;

		// Пустое поле
		if (operator === Operator.empty) {
			if (typeof sourceValue === 'string') return sourceValue.trim() === '';
			return sourceValue == null;
		}

		// Работа с массивом и объектом
		if (Array.isArray(sourceValue)) {
			switch (operator) {
				case Operator.arrayIncludes:
					return sourceValue.includes(dependency.value);
				case Operator.arrayIncludesObject:
					return sourceValue.some(
						item => item[dependency.key!] === dependency.value,
					);
				case Operator.arrayEvery:
					return sourceValue.every(item =>
						this.compareValue(
							item[dependency.key!],
							dependency.condition!,
						),
					);
				case Operator.arraySome:
					return sourceValue.some(item =>
						this.compareValue(
							item[dependency.key!],
							dependency.condition!,
						),
					);
				default:
					break;
			}
		}

		// Строка содержит
		if (operator === Operator.contains && typeof sourceValue === 'string') {
			return sourceValue.includes(dependency.value);
		}

		// Прочие сравнения
		switch (operator) {
			case Operator.equals:
				return sourceValue === dependency.value;
			case Operator.notEquals:
				return sourceValue !== dependency.value;
			case Operator.greaterThan:
				return sourceValue > dependency.value;
			default:
				return false;
		}
	}

	/** Сравнивает примитивы по условию (для arrayEvery/arraySome) */
	private compareValue(
		actual: any,
		condition: NonNullable<FieldDependency['condition']>,
	): boolean {
		switch (condition.operator) {
			case Operator.equals:
				return actual === condition.value;
			case Operator.notEquals:
				return actual !== condition.value;
			case Operator.greaterThan:
				return actual > condition.value;
			default:
				return false;
		}
	}

	/** Выполняет действие над целевым полем */
	private executeAction(
		action: FieldAction,
		targetField: BaseField,
		sourceFieldKey: string,
	): void {
		switch (action.type) {
			case Action.setState:
				if (targetField.setState && action.key && action.value !== undefined)
					targetField.setState?.(action.key, action.value);
				break;

			case Action.setValue:
				if (targetField.setValue && action.value !== undefined)
					targetField.setValue(action.value);
				break;

			case Action.custom:
				const sourceField = this.fieldMap.get(sourceFieldKey)!;
				action.custom?.(sourceField, sourceField.getValue());
				break;

			default:
				console.warn(`Неизвестный тип действия: ${action.type}`);
		}
	}
}
