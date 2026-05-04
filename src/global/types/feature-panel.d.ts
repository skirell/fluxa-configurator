interface TabData {
	[key: string]: any;
}

interface SerializedTab {
	[key: string]: any;
}

interface FeaturePanelSettings {
	// максимальное количество вкладок
	maxCount: number;
	// минимальное количество вкладок
	minCount: number;
	// если true, то при создании блока будет создано минимальное количество вкладок (minCount)
	minOrEmpty?: true;
	// префикс для ключа в таблице с режимами
	keyPrefix?: string;
}
