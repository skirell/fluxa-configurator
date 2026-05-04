export function getElement<T extends HTMLElement>(id: string): T {
	const element = document.getElementById(id);
	if (!element) throw new Error(`Элемент #${id} не найден`);
	if (!(element instanceof HTMLElement))
		throw new Error(`Элемент #${id} не является HTMLElement`);
	return element as T;
}

export function renumberInstances(instances: any[]): void {
	instances.forEach((instance, index) => {
		instance.Index = index + 1;
	});
}
