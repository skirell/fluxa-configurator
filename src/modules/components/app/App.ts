import { AppController } from './AppController';
import { AppView } from './AppView';

export class App {
	private static instance: App;
	public readonly View: AppView;
	public readonly Controller: AppController;

	private constructor() {
		this.View = new AppView();
		this.Controller = new AppController(this.View);
	}

	public static getInstance(): App {
		if (!App.instance) App.instance = new App();
		return App.instance;
	}

	public init() {
		this.Controller.init();
	}
}
