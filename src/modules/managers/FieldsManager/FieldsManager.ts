import { ParamOption } from '../../../global/types/option';
import BaseField from '../../ui/fields/BaseField';
import { DependencyManager } from '../DependencyManager';

type CreateFieldFunc = (
	fieldKey: string,
	option: ParamOption,
	initialValue: any,
) => BaseField | undefined;

export default abstract class FieldsManager {
	private readonly dependencyManager = new DependencyManager();
	protected readonly fields = new Map<string, BaseField>();

	protected constructor(private readonly createFieldFunc: CreateFieldFunc) {}

	/** Вернуть текущие поля */
	public getFields(): ReadonlyMap<string, BaseField> {
		return this.fields;
	}

	/** Очищает все поля */
	public clearFields(): void {
		this.fields.clear();
	}

	/** Синхронизировать набор полей с новыми опциями */
	public generateFields(doInit?: boolean): ReadonlyMap<string, BaseField> {
		const paramOptions = this.getParamOptions();
		const desiredKeys = new Set(paramOptions.keys());

		this.removeUnwantedFields(desiredKeys);
		this.generateMissingFields(paramOptions, doInit);

		return this.getFields();
	}

	/**
	 * Пробегает по всем текущим полям и «заполняет» их значениями из модели.
	 */
	public populateFields(): void {
		const paramOptions = this.getParamOptions();
		this.generateFields(false);
		this.fields.forEach((field, key) => {
			const option = paramOptions.get(key);
			if (!option) return;

			const value = this.getParamValue(key, option.savePath);
			field.setValue(value);
		});
		this.dependencyManager.evaluateAll();
	}

	/** Удаляем «лишние» поля, которых больше нет в опциях */
	private removeUnwantedFields(desired: Set<string>) {
		for (const key of this.fields.keys()) {
			if (!desired.has(key)) this.fields.delete(key);
		}
	}

	/** Добавляем те поля, которых ещё нет */
	private generateMissingFields(
		paramOptions: ReadonlyMap<string, ParamOption>,
		doInit = true,
	) {
		paramOptions.forEach((opt, key) => {
			if (this.fields.has(key)) {
                const field = this.fields.get(key)!;
                field.setOption(opt);
                return;
            }

			const initialValue = this.getParamValue(key, opt.savePath);
			const field = this.createFieldFunc(key, opt, initialValue);
			if (field) {
				if (doInit) field.init();
				field.render();

				this.fields.set(key, field);
				this.dependencyManager.registerField(field);
			}
		});
	}

	/** Этот метод реализуют наследники, чтобы вернуть map<String,ParamOption> */
	protected abstract getParamOptions(): ReadonlyMap<string, ParamOption>;

	/** Этот метод реализуют наследники, чтобы вернуть текущее значение параметра */
	protected abstract getParamValue(fieldKey: string, savePath?: string): any;
}
