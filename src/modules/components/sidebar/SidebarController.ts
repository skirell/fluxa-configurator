import { SiderbarRenderer } from './SidebarRenderer';
import { SidebarView } from './SidebarView';

export class SidebarController {
	public readonly View: SidebarView;
	public readonly Renderer: SiderbarRenderer;

	constructor() {
		this.View = new SidebarView();
		this.Renderer = new SiderbarRenderer(this.View);
	}

	public init(): void {
		this.render();
	}

	public render(): void {
		this.Renderer.render();
	}
}
