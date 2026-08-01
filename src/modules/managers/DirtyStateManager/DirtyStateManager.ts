class DirtyStateManager {
	private static instance: DirtyStateManager;
	private dirty = false;

	private constructor() {}

	public static getInstance(): DirtyStateManager {
		if (!DirtyStateManager.instance) {
			DirtyStateManager.instance = new DirtyStateManager();
		}
		return DirtyStateManager.instance;
	}

	public get IsDirty(): boolean {
		return this.dirty;
	}

	public markDirty(): void {
		this.dirty = true;
	}

	public markClean(): void {
		this.dirty = false;
	}
}

export default DirtyStateManager.getInstance();
