import { ipcRenderer } from 'electron';
import { CHANNELS } from '../../../data/constants/channels';
import { PLACEHOLDERS } from '../../../data/constants/placeholders';
import { ViewId } from '../../../data/enums/view-id';
import { getBlockIssues } from '../../../data/settings/block-rules';
import { showConfirm } from '../../../utils/alert-utils';
import FeaturePanelField from '../../ui/fields/FeaturePanelField/FeaturePanelField';
import { LameliPanelField } from '../../ui/fields/LameliPanelField';
import blockManager from '../../managers/BlockManager/BlockManager';
import configManager from '../../managers/ConfigManager/ConfigManager';
import eventManager from '../../managers/EventManager/EventManager';
import pageManager from '../../managers/PageManager/PageManager';
import Block from '../block/Block';
import { Page } from '../page/Page';
import { BlockController } from '../block/BlockController';
import { SidebarController } from '../sidebar/SidebarController';
import { AppView } from './AppView';

interface PanelDef { id: string; title: string; contentHtml: string; }
const PANELS: Record<string, PanelDef> = {
	docs: { id: 'docs', title: 'Документация',
		contentHtml: `
			<webview id="docs-webview" class="panel-webview" src="https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/obshaya-struktura-json"></webview>
			<div id="docs-fallback" class="docs-fallback" style="display:none">
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
					<path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" stroke-width="1.3"/>
					<path d="M4 12h16M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
					<path d="M18 6l-12 12" stroke="var(--danger,#ef4444)" stroke-width="1.6" stroke-linecap="round"/>
				</svg>
				<div class="docs-fallback-title">Документация недоступна</div>
				<div class="docs-fallback-desc">Нет подключения к интернету. Проверьте сеть и попробуйте снова.</div>
				<button id="docs-retry" class="docs-fallback-btn">Повторить</button>
			</div>
		` },
	errors: { id: 'errors', title: 'Ошибки',
		contentHtml: '<div class="errors-panel" id="errors-panel-content"></div>' },
};

const DOCS_URLS: Record<string, string> = {
	scene: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/scene-scenarii',
	switch: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/switch-pereklyuchatel',
	sensor: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/sensor-datchik',
	light: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/light-osveshenie',
	cover: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/cover-shtory',
	climate: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/climate-klimat',
	music: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/music-muzyka',
	light_variant_OnOff: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/light-osveshenie/light_variant_onoff',
	light_variant_dimmer: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/light-osveshenie/light_variant_dimmer',
	light_variant_color: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/light-osveshenie/light_variant_color',
	light_variant_temperature: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/light-osveshenie/light_variant_temperature',
	cover_variant_slider: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/cover-shtory/cover_variant_slider',
	cover_variant_buttons: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/cover-shtory/cover_variant_buttons',
	climate_variant_cond: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/climate-klimat/climate_variant_cond',
	climate_variant_thermostat: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/climate-klimat/climate_variant_thermostat',
	_default: 'https://skirell.gitbook.io/skirell-fluxa/konfiguraciya-paneli/obshaya-struktura-json',
};

/**
 * Якоря (#slug) заголовков полей на страницах GitBook.
 * Ключ первого уровня — device или variant (как в DOCS_URLS).
 * При клике «?» у поля webview скроллит к соответствующему заголовку.
 * Заполняется по мере получения якорей от пользователя.
 */
const FIELD_ANCHORS: Record<string, Record<string, string>> = {
	scene: {
		param_1: 'param_1-malenkii-tekst',
		param_2: 'param_2-srednii-tekst',
		param_3: 'param_3-bolshoi-tekst',
		icon: 'icon-ikonka-bloka',
		command_topic: 'command_topic-topik-dlya-otpravki-komandy',
		payload: 'payload-soobshenie-komandy',
	},
	switch: {
		param_1: 'param_1-malenkii-tekst',
		param_2: 'param_2-srednii-tekst',
		icon: 'icon-ikonka-bloka',
		color: 'color-cvet-aktivnogo-sostoyaniya',
		OnOff_command_topic: 'onoff_command_topic-topik-dlya-otpravki-komandy',
		OnOff_state_topic: 'onoff_state_topic-topik-sostoyaniya',
		payload_on: 'payload_on-komanda-vklyucheniya',
		payload_off: 'payload_off-komanda-vyklyucheniya',
	},
	sensor: {
		param_1: 'param_1-nazvanie-datchika',
		measure: 'measure-edinica-izmereniya',
		min: 'min-minimum-shkaly',
		stage_1: 'stage_1-pervaya-porogovaya-granica',
		stage_2: 'stage_2-vtoraya-porogovaya-granica',
		max: 'max-maksimum-shkaly',
		color_1: 'color_1-cvet-pervogo-diapazona',
		color_2: 'color_2-cvet-vtorogo-diapazona',
		color_3: 'color_3-cvet-tretego-diapazona',
		state_topic: 'state_topic-topik-sostoyaniya',
	},
	light: {
		param_1: 'param_1-malenkii-tekst',
		param_2: 'param_2-srednii-tekst',
		setting_name: 'setting_name-zagolovok-stranicy-upravleniya',
		icon: 'icon-ikonka-bloka',
	},
	light_variant_OnOff: {
		OnOff_command_topic: 'onoff_command_topic-topik-dlya-otpravki-komandy',
		OnOff_state_topic: 'onoff_state_topic-topik-sostoyaniya',
		payload_on: 'payload_on-komanda-vklyucheniya',
		payload_off: 'payload_off-komanda-vyklyucheniya',
	},
	light_variant_dimmer: {
		OnOff_command_topic: 'onoff_command_topic-topik-dlya-otpravki-komandy-vkl-vykl',
		OnOff_state_topic: 'onoff_state_topic-topik-dlya-polucheniya-sostoyaniya-vkl-vykl',
		payload_on: 'payload_on-komanda-vklyucheniya',
		payload_off: 'payload_off-komanda-vyklyucheniya',
		brightness_command_topic: 'brightness_command_topic-topik-dlya-otpravki-znacheniya-yarkosti',
		brightness_state_topic: 'brightness_state_topic-topik-dlya-polucheniya-tekushei-yarkosti',
		brightness_scale: 'brightness_scale-maksimalnoe-znachenie-yarkosti',
	},
	light_variant_color: {
		OnOff_command_topic: 'onoff_command_topic-topik-dlya-otpravki-komandy-vkl-vykl',
		OnOff_state_topic: 'onoff_state_topic-topik-dlya-polucheniya-sostoyaniya-vkl-vykl',
		payload_on: 'payload_on-komanda-vklyucheniya',
		payload_off: 'payload_off-komanda-vyklyucheniya',
		brightness_command_topic: 'brightness_command_topic-topik-dlya-otpravki-znacheniya-yarkosti',
		brightness_state_topic: 'brightness_state_topic-topik-dlya-polucheniya-tekushei-yarkosti',
		brightness_scale: 'brightness_scale-maksimalnoe-znachenie-yarkosti',
		color_command_topic: 'color_command_topic-topik-dlya-otpravki-vybrannogo-cveta',
		color_type: 'color_type-format-peredavaemogo-cveta',
	},
	light_variant_temperature: {
		OnOff_command_topic: 'onoff_command_topic-topik-dlya-otpravki-komandy-vkl-vykl',
		OnOff_state_topic: 'onoff_state_topic-topik-dlya-polucheniya-sostoyaniya-vkl-vykl',
		payload_on: 'payload_on-komanda-vklyucheniya',
		payload_off: 'payload_off-komanda-vyklyucheniya',
		brightness_command_topic: 'brightness_command_topic-topik-dlya-otpravki-znacheniya-yarkosti',
		brightness_state_topic: 'brightness_state_topic-topik-dlya-polucheniya-tekushei-yarkosti',
		brightness_scale: 'brightness_scale-maksimalnoe-znachenie-yarkosti',
		temp_command_topic: 'temp_command_topic-topik-dlya-otpravki-znacheniya-temperatury-cveta',
		temp_state_topic: 'temp_state_topic-topik-dlya-polucheniya-tekushei-temperatury-cveta',
		// min_temp и max_temp описаны одним общим заголовком на странице
		min_temp: 'min_temp-i-max_temp-min-maks-znachenie-shkaly-temperatury',
		max_temp: 'min_temp-i-max_temp-min-maks-znachenie-shkaly-temperatury',
		temp_measure: 'temp_measure-edinica-izmereniya-temperatury',
	},
	cover: {
		param_1: 'param_1-malenkii-tekst',
		param_2: 'param_2-srednii-tekst',
		setting_name: 'setting_name-zagolovok-stranicy-upravleniya',
		icon_open: 'icon_open-ikonka-otkrytogo-sostoyaniya',
		icon_close: 'icon_close-ikonka-zakrytogo-sostoyaniya',
	},
	cover_variant_slider: {
		orientation: 'orientation-orientaciya-ustroistva',
		open_command_topic: 'open_command_topic-topik-komandy-otkrytiya',
		close_command_topic: 'close_command_topic-topik-komandy-zakrytiya',
		stop_command_topic: 'stop_command_topic-topik-komandy-ostanovki',
		payload_open: 'payload_open-komanda-otkrytiya',
		payload_close: 'payload_close-komanda-zakrytiya',
		payload_stop: 'payload_stop-komanda-ostanovki',
		position_command_topic: 'position_command_topic-topik-otpravki-pozicii',
		position_state_topic: 'position_state_topic-topik-tekushei-pozicii',
		// position_open/close + help_position_open/close — описаны общими заголовками
		position_open: 'position_open-i-position_close-diapazon-pozicii',
		position_close: 'position_open-i-position_close-diapazon-pozicii',
		help_position_open: 'help_position_open-i-help_position_close-vspomogatelnye-granicy',
		help_position_close: 'help_position_open-i-help_position_close-vspomogatelnye-granicy',
		// Ламели — все внутренние поля сводятся к одному заголовку на странице.
		lameli: 'lameli-lameli',
	},
	cover_variant_buttons: {
		orientation: 'orientation-orientaciya-ustroistva',
		open_command_topic: 'open_command_topic-topik-komandy-otkrytiya',
		close_command_topic: 'close_command_topic-topik-komandy-zakrytiya',
		stop_command_topic: 'stop_command_topic-topik-komandy-ostanovki',
		payload_open: 'payload_open-komanda-otkrytiya',
		payload_close: 'payload_close-komanda-zakrytiya',
		payload_stop: 'payload_stop-komanda-ostanovki',
		lameli: 'lameli-lameli',
	},
	climate: {
		param_1: 'param_1-malenkii-tekst',
		param_2: 'param_2-srednii-tekst',
		setting_name: 'setting_name-zagolovok-stranicy-upravleniya',
		icon: 'icon-ikonka-bloka',
		measure: 'measure-edinica-izmereniya-ustavki',
		color: 'color-cvet-aktivnogo-sostoyaniya',
	},
	climate_variant_thermostat: {
		OnOff_command_topic: 'onoff_command_topic-topik-komandy-vkl-vykl',
		OnOff_state_topic: 'onoff_state_topic-topik-sostoyaniya-vkl-vykl',
		payload_on: 'payload_on-komanda-vklyucheniya',
		payload_off: 'payload_off-komanda-vyklyucheniya',
		targetTemp_command_topic: 'targettemp_command_topic-topik-dlya-otpravki-ustavki',
		targetTemp_state_topic: 'targettemp_state_topic-topik-tekushei-ustavki',
		min_target: 'min_target-minimalnoe-znachenie-ustavki',
		max_target: 'max_target-maksimalnoe-znachenie-ustavki',
		sensors: 'datchiki-sensors',
	},
	climate_variant_cond: {
		OnOff_command_topic: 'onoff_command_topic-topik-komandy-vkl-vykl',
		OnOff_state_topic: 'onoff_state_topic-topik-sostoyaniya-vkl-vykl',
		payload_on: 'payload_on-komanda-vklyucheniya',
		payload_off: 'payload_off-komanda-vyklyucheniya',
		mode_command_topic: 'mode_command_topic-topik-dlya-otpravki-rezhima',
		mode_state_topic: 'mode_state_topic-topik-tekushego-rezhima',
		currentTemp_state_topic: 'currenttemp_state_topic-topik-tekushego-znacheniya',
		targetTemp_command_topic: 'targettemp_command_topic-topik-dlya-otpravki-ustavki',
		targetTemp_state_topic: 'targettemp_state_topic-topik-tekushei-ustavki',
		min_target: 'min_target-minimalnoe-znachenie-ustavki',
		max_target: 'max_target-maksimalnoe-znachenie-ustavki',
		fan_command_topic: 'fan_command_topic-topik-dlya-otpravki-rezhima-ventilyatora',
		fan_state_topic: 'fan_state_topic-topik-tekushego-rezhima-ventilyatora',
		modes: 'massiv-rezhimov-modes',
		fan_modes: 'massiv-rezhimov-ventilyatora-fan_modes',
	},
	music: {
		param_1: 'param_1-malenkii-tekst',
		param_2: 'channels-spisok-kanalov#param_2-srednii-tekst',
		param_3: 'channels-spisok-kanalov#param_3-krupnyi-tekst',
		icon: 'icon-ikonka-bloka',
		setting_name: 'setting_name-zagolovok-ekrana-upravleniya',
		mute_command_topic: 'mute_command_topic-topik-dlya-otpravki-komandy-mute',
		mute_state_topic: 'mute_state_topic-topik-sostoyaniya-mute',
		payload_mute_on: 'payload_mute_on-komanda-vklyucheniya-mute',
		payload_mute_off: 'payload_mute_off-komanda-vyklyucheniya-mute',
		artist_state_topic: 'artist_state_topic-topik-imeni-ispolnitelya',
		name_state_topic: 'name_state_topic-topik-nazvaniya-treka',
		channels: 'channels-spisok-kanalov',
		prev_command_topic: 'prev_command_topic-topik-komandy-predydushii-trek',
		next_command_topic: 'next_command_topic-topik-komandy-sleduyushii-trek',
		play_command_topic: 'channels-spisok-kanalov#play_command_topic-topik-komandy-vosproizvesti',
		pause_command_topic: 'pause_command_topic-topik-komandy-pauza',
		PlayPause_state_topic: 'playpause_state_topic-topik-sostoyaniya-vosproizvedeniya',
		payload_prev: 'payload_prev-soobshenie-dlya-predydushego-treka',
		payload_play: 'payload_play-soobshenie-dlya-vosproizvedeniya',
		payload_pause: 'payload_pause-soobshenie-dlya-pauzy',
		payload_next: 'payload_next-soobshenie-dlya-sleduyushego-treka',
		volume_command_topic: 'volume_command_topic-topik-dlya-otpravki-komandy-gromkosti',
		volume_state_topic: 'volume_state_topic-topik-tekushei-gromkosti',
		volume_step: 'volume_step-shag-gromkosti',
		volume_min: 'volume_min-minimalnaya-gromkost',
		volume_max: 'volume_max-maksimalnaya-gromkost',
	},
};

type Dir = 'col' | 'row';
interface Section { tabs: string[]; activeTab: string; }

export class AppController {
	public readonly BlockController: BlockController;
	public readonly SidebarController: SidebarController;

	private sections: Section[] = [];
	private layoutDir: Dir = 'col';
	private draggingPanelId: string | null = null;
	// Кэш сигнатуры последнего рендера списка ошибок — чтобы не перерисовывать
	// DOM (и не сбрасывать scroll) при опросах, когда ничего не изменилось.
	private lastErrorsSignature: string | null = null;
	// Область отображения ошибок: 'all' — по всем блокам, 'current' — только по выбранному блоку.
	private errorsScope: 'all' | 'current' = 'current';
	// Ключ поля, для которого только что открыли документацию (через «?»).
	// navigateDocs использует его для подстановки #anchor к URL; после применения сбрасывается.
	private pendingDocsFieldKey: string | null = null;

	constructor(private readonly view: AppView) {
		this.BlockController = new BlockController();
		this.SidebarController = new SidebarController();
	}

	public init(): void {
		this.BlockController.init();
		this.SidebarController.init();
		void this.initAppVersion();
		this.setupEventListeners();
		this.view.elements.rightActivityBar.querySelectorAll('.r-activity-btn').forEach(btn => {
			const panelId = (btn as HTMLElement).dataset.panel;
			if (!panelId) return;
			btn.addEventListener('click', () => this.togglePanel(panelId));
		});
		this.initBarToggles();
		this.initThemeToggle();

		setInterval(() => {
			const errorsVisible = this.sections.some(s => s.activeTab === 'errors');
			if (errorsVisible) this.refreshErrors();
		}, 2000);
	}

	private async initAppVersion(): Promise<void> {
		try {
			const version = await ipcRenderer.invoke(CHANNELS.GET_APP_VERSION_CHANNEL);
			if (typeof version === 'string' && version.trim()) {
				this.view.elements.homeVersion.textContent = `v${version}`;
			}
		} catch (err) {
			console.error('Не удалось получить версию приложения:', err);
		}
	}

	private initBarToggles(): void {
		const leftToggle = document.getElementById('left-bar-toggle');
		const rightToggle = document.getElementById('right-bar-toggle');
		leftToggle?.addEventListener('click', () => {
			document.body.classList.toggle('left-bar-collapsed');
			this.clampRightPanelWidth();
		});
		rightToggle?.addEventListener('click', () => {
			document.body.classList.toggle('right-bar-collapsed');
			this.clampRightPanelWidth();
		});
	}

	private initThemeToggle(): void {
		const btn = document.getElementById('theme-toggle-button');
		if (!btn) return;
		this.renderThemeButton(btn);
		btn.addEventListener('click', () => {
			const root = document.documentElement;
			const isLight = root.classList.toggle('theme-light');
			try { localStorage.setItem('skirell-theme', isLight ? 'light' : 'dark'); } catch {}
			this.renderThemeButton(btn);
		});
	}

	private renderThemeButton(btn: HTMLElement): void {
		const isLight = document.documentElement.classList.contains('theme-light');
		const sun = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.4"/><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
		const moon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8 8 0 119.5 4a7 7 0 0010.5 10.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
		btn.innerHTML = `${isLight ? moon : sun}<span class="activity-label">${isLight ? 'Тёмная тема' : 'Светлая тема'}</span>`;
		btn.setAttribute('data-tooltip', isLight ? 'Переключить на тёмную тему' : 'Переключить на светлую тему');
	}

	private setupEventListeners(): void {
		eventManager.on('blockSelect', (block: Block) => { blockManager.SelectedBlock = block; this.SidebarController.Renderer.render(); this.refreshErrors(); });
		eventManager.on('blockAdded', (block: Block) => { if (block) blockManager.SelectedBlock = block; this.SidebarController.Renderer.render(); this.refreshErrors(); });
		eventManager.on('pageAdded', () => this.render());
		eventManager.on('deviceChanged', () => { this.SidebarController.Renderer.render(); this.refreshErrors(); });
		eventManager.on('deviceVariantChanged', () => { this.SidebarController.Renderer.render(); this.refreshErrors(); });
		eventManager.on('fieldChanged', () => this.refreshErrors());
		eventManager.on('showFieldDocs', (fieldKey: string) => {
			this.pendingDocsFieldKey = fieldKey;
			this.openPanel('docs');
			this.navigateDocs();
		});
		this.view.elements.saveConfigButton.addEventListener('click', () => this.handleSave());
		this.view.elements.loadConfigButton.addEventListener('click', async () => await this.loadConfigWithConfirm());
		this.view.elements.showJsonPreviewButton.addEventListener('click', () => { this.toggleConfig(false); this.togglePreviewJson(true); });
		this.view.elements.showStartPageButton.addEventListener('click', () => this.showStartPage());
		this.view.elements.closePreviewButton.addEventListener('click', () => { this.togglePreviewJson(false); blockManager.SelectedBlock ? this.toggleConfig(true) : this.showStartPage(); });
		this.view.elements.newConfigButton.addEventListener('click', async () => await this.newProject());
		this.view.elements.homeLoadButton.addEventListener('click', async () => await this.loadConfigWithConfirm());
		this.view.elements.homeDocsLink.addEventListener('click', (e) => {
			// В Electron target="_blank" сам по себе не открывает браузер —
			// принудительно передаём URL во внешнюю систему через shell.openExternal.
			e.preventDefault();
			const url = this.view.elements.homeDocsLink.href;
			const { shell } = require('electron');
			shell.openExternal(url);
		});
		this.view.elements.newProjectButton.addEventListener('click', async () => await this.newProject());
		this.view.elements.clearProjectButton.addEventListener('click', async () => await this.clearCurrentProject());
		this.initResize();
	}

	private findSection(panelId: string): number {
		return this.sections.findIndex(s => s.tabs.includes(panelId));
	}

	private togglePanel(id: string): void {
		const si = this.findSection(id);
		si >= 0 ? this.closeTab(id) : this.openPanel(id);
	}

	private openPanel(id: string): void {
		if (this.findSection(id) >= 0) return;
		if (this.sections.length === 0) {
			this.sections.push({ tabs: [id], activeTab: id });
		} else {
			this.sections[0].tabs.push(id);
			this.sections[0].activeTab = id;
		}
		this.redraw();
		this.clampRightPanelWidth();
		if (id === 'docs') this.navigateDocs();
		if (id === 'errors') setTimeout(() => this.refreshErrors(), 50);
	}

	private closeTab(panelId: string): void {
		const si = this.findSection(panelId);
		if (si < 0) return;
		const sec = this.sections[si];
		sec.tabs = sec.tabs.filter(t => t !== panelId);
		if (sec.tabs.length === 0) {
			this.sections.splice(si, 1);
		} else if (sec.activeTab === panelId) {
			sec.activeTab = sec.tabs[0];
		}
		this.cleanup();
		this.redraw();
	}

	private detachTab(panelId: string): void {
		const si = this.findSection(panelId);
		if (si < 0) return;
		const sec = this.sections[si];
		sec.tabs = sec.tabs.filter(t => t !== panelId);
		if (sec.activeTab === panelId) sec.activeTab = sec.tabs[0] ?? '';
	}

	private cleanup(): void {
		this.sections = this.sections.filter(s => s.tabs.length > 0);
		if (this.sections.length <= 1) this.layoutDir = 'col';
	}

	private mergeInto(panelId: string, targetSecIdx: number): void {
		this.detachTab(panelId);
		this.cleanup();
		const target = this.sections[Math.min(targetSecIdx, this.sections.length - 1)];
		if (target) {
			if (!target.tabs.includes(panelId)) target.tabs.push(panelId);
			target.activeTab = panelId;
		}
		this.cleanup();
		this.redraw();
	}

	private splitInto(panelId: string, targetSecIdx: number, pos: 'before' | 'after', dir: Dir): void {
		if (this.sections.length >= 3 && this.findSection(panelId) < 0) return;
		this.detachTab(panelId);
		this.cleanup();
		this.layoutDir = dir;
		const insertAt = pos === 'before'
			? Math.min(targetSecIdx, this.sections.length)
			: Math.min(targetSecIdx + 1, this.sections.length);
		this.sections.splice(insertAt, 0, { tabs: [panelId], activeTab: panelId });
		if (this.sections.length > 3) this.sections.splice(3);
		this.cleanup();
		this.redraw();
	}

	private redraw(): void {
		const c = this.view.elements.rightSections;
		const panel = this.view.elements.rightPanel;
		panel.classList.toggle('content-open', this.sections.length > 0);

		const allTabs = this.sections.flatMap(s => s.tabs);
		this.view.elements.rightActivityBar.querySelectorAll('.r-activity-btn').forEach(btn =>
			btn.classList.toggle('active', allTabs.includes((btn as HTMLElement).dataset.panel!)));

		c.className = `right-sections layout-${this.layoutDir}`;
		c.innerHTML = '';
		this.sections.forEach((sec, i) => c.appendChild(this.mkSection(sec, i)));

		this.wireDocsFallback();
	}

	/**
	 * Подключает обработчики к webview документации: при ошибке сети
	 * показываем человекочитаемый плейсхолдер вместо страницы Chromium.
	 * Вызывается после каждого redraw — webview пересоздаётся, слушатели тоже.
	 */
	private wireDocsFallback(): void {
		const wv = document.getElementById('docs-webview') as any;
		const fallback = document.getElementById('docs-fallback') as HTMLDivElement | null;
		const retry = document.getElementById('docs-retry') as HTMLButtonElement | null;
		if (!wv || !fallback) return;

		const showFallback = () => {
			wv.style.display = 'none';
			fallback.style.display = 'flex';
		};
		const hideFallback = () => {
			wv.style.display = '';
			fallback.style.display = 'none';
		};

		wv.addEventListener('did-start-loading', hideFallback);
		wv.addEventListener('did-finish-load', hideFallback);
		wv.addEventListener('did-fail-load', (e: any) => {
			// errorCode -3 = ERR_ABORTED (пользователь сам перешёл на др. URL), игнорируем
			if (e?.errorCode === -3) return;
			if (e?.isMainFrame === false) return;
			showFallback();
		});

		retry?.addEventListener('click', () => {
			hideFallback();
			try { wv.reload(); } catch { wv.src = wv.src; }
		});
	}

	private mkSection(sec: Section, secIdx: number): HTMLElement {
		const wrap = document.createElement('div');
		wrap.className = 'right-section';

		const tabs = document.createElement('div');
		tabs.className = 'section-tabs';
		sec.tabs.forEach(tid => tabs.appendChild(this.mkTab(tid, sec, secIdx)));

		tabs.addEventListener('dragover', (e) => {
			if (!this.draggingPanelId) return;
			if (this.findSection(this.draggingPanelId) === secIdx) return;
			e.preventDefault();
			tabs.classList.add('tabs-drop-target');
		});
		tabs.addEventListener('dragleave', () => tabs.classList.remove('tabs-drop-target'));
		tabs.addEventListener('drop', (e) => {
			e.preventDefault(); tabs.classList.remove('tabs-drop-target');
			if (!this.draggingPanelId) return;
			if (this.findSection(this.draggingPanelId) === secIdx) return;
			this.mergeInto(this.draggingPanelId, secIdx);
			this.draggingPanelId = null;
		});

		wrap.appendChild(tabs);

		const content = document.createElement('div');
		content.className = 'section-content';
		content.innerHTML = PANELS[sec.activeTab]?.contentHtml ?? '';

		const overlay = document.createElement('div');
		overlay.className = 'content-drop-overlay';
		['top', 'bottom', 'left', 'right', 'center'].forEach(zone => {
			const z = document.createElement('div');
			z.className = 'cdrop-zone';
			z.dataset.zone = zone;

			z.addEventListener('dragover', (e) => {
				if (!this.draggingPanelId) return;
				const fromSec = this.findSection(this.draggingPanelId);
				if (fromSec === secIdx && sec.tabs.length <= 1) return;
				e.preventDefault(); e.stopPropagation();
				overlay.querySelectorAll('.cdrop-zone').forEach(zz => zz.classList.remove('zone-hover'));
				z.classList.add('zone-hover');
			});
			z.addEventListener('dragleave', () => z.classList.remove('zone-hover'));
			z.addEventListener('drop', (e) => {
				e.preventDefault(); e.stopPropagation();
				z.classList.remove('zone-hover');
				if (!this.draggingPanelId) return;
				const pid = this.draggingPanelId;
				this.draggingPanelId = null;
				this.clearOverlays();
				if (zone === 'center') {
					this.mergeInto(pid, secIdx);
				} else {
					const dir: Dir = (zone === 'left' || zone === 'right') ? 'row' : 'col';
					const pos = (zone === 'left' || zone === 'top') ? 'before' : 'after';
					this.splitInto(pid, secIdx, pos as 'before' | 'after', dir);
				}
			});

			overlay.appendChild(z);
		});
		content.appendChild(overlay);

		content.addEventListener('dragover', (e) => {
			if (!this.draggingPanelId) return;
			const fromSec = this.findSection(this.draggingPanelId);
			if (fromSec === secIdx && sec.tabs.length <= 1) return;
			e.preventDefault();
			overlay.classList.add('visible');
		});
		content.addEventListener('dragleave', (e) => {
			if (!content.contains(e.relatedTarget as Node)) overlay.classList.remove('visible');
		});

		wrap.appendChild(content);
		return wrap;
	}

	private mkTab(tabId: string, sec: Section, secIdx: number): HTMLElement {
		const def = PANELS[tabId];
		const btn = document.createElement('button');
		btn.className = `section-tab${tabId === sec.activeTab ? ' active' : ''}`;
		btn.draggable = true;

		btn.addEventListener('dragstart', (e) => {
			this.draggingPanelId = tabId;
			e.dataTransfer!.effectAllowed = 'move';
			btn.classList.add('dragging');
		});
		btn.addEventListener('dragend', () => {
			btn.classList.remove('dragging');
			this.draggingPanelId = null;
			this.clearOverlays();
		});

		btn.addEventListener('dragover', (e) => {
			if (!this.draggingPanelId || this.draggingPanelId === tabId) return;
			if (this.findSection(this.draggingPanelId) !== secIdx) return;
			e.preventDefault(); e.stopPropagation();
			btn.classList.remove('tab-insert-left', 'tab-insert-right');
			const mid = btn.getBoundingClientRect().left + btn.getBoundingClientRect().width / 2;
			btn.classList.add(e.clientX < mid ? 'tab-insert-left' : 'tab-insert-right');
		});
		btn.addEventListener('dragleave', () => btn.classList.remove('tab-insert-left', 'tab-insert-right'));
		btn.addEventListener('drop', (e) => {
			e.preventDefault(); e.stopPropagation();
			btn.classList.remove('tab-insert-left', 'tab-insert-right');
			if (!this.draggingPanelId || this.draggingPanelId === tabId) return;
			if (this.findSection(this.draggingPanelId) !== secIdx) return;
			const arr = sec.tabs;
			const fi = arr.indexOf(this.draggingPanelId);
			if (fi < 0) return;
			arr.splice(fi, 1);
			const ti = arr.indexOf(tabId);
			const mid = btn.getBoundingClientRect().left + btn.getBoundingClientRect().width / 2;
			arr.splice(e.clientX < mid ? ti : ti + 1, 0, this.draggingPanelId);
			this.draggingPanelId = null;
			this.redraw();
		});

		const label = document.createElement('span');
		label.className = 'tab-label';
		label.textContent = def?.title ?? tabId;

		const close = document.createElement('button');
		close.className = 'tab-close';
		close.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
		close.addEventListener('click', (e) => { e.stopPropagation(); this.closeTab(tabId); });

		btn.append(label, close);
		btn.addEventListener('click', () => { sec.activeTab = tabId; this.redraw(); if (tabId === 'docs') this.navigateDocs(); if (tabId === 'errors') setTimeout(() => this.refreshErrors(), 50); });
		return btn;
	}

	private clearOverlays(): void {
		document.querySelectorAll('.tabs-drop-target').forEach(e => e.classList.remove('tabs-drop-target'));
		document.querySelectorAll('.content-drop-overlay.visible').forEach(e => e.classList.remove('visible'));
		document.querySelectorAll('.zone-hover').forEach(e => e.classList.remove('zone-hover'));
	}

	private refreshErrors(): void {
		const container = document.getElementById('errors-panel-content');
		if (!container) return;

		type Issue = { pageIdx: number; blockIdx: number; fieldKey: string; label: string };
		const errors: Issue[] = [];
		const warnings: Issue[] = [];

		for (const page of pageManager.Pages) {
			for (const block of page.Blocks) {
				if (!block.Device) {
					errors.push({ pageIdx: page.Index, blockIdx: block.Index, fieldKey: '', label: 'Тип блока не выбран' });
					continue;
				}
				if (block.isVariantMissing()) {
					errors.push({ pageIdx: page.Index, blockIdx: block.Index, fieldKey: '', label: 'Подтип блока не выбран' });
				}
				const fields = block.UI.getFields();
				const reportedAsError = new Set<string>();
				fields.forEach(field => {
					// Для feature / lameli панелей — разворачиваем каждое невалидное вложенное поле
					// отдельной строкой, чтобы пользователь сразу видел, в какой вкладке и какое поле.
					const innerErrors =
						field instanceof FeaturePanelField || field instanceof LameliPanelField
							? field.getInnerInvalidFields()
							: null;

					if (innerErrors && innerErrors.length > 0) {
						for (const inner of innerErrors) {
							errors.push({
								pageIdx: page.Index,
								blockIdx: block.Index,
								fieldKey: field.key,
								label: inner.label,
							});
						}
						reportedAsError.add(field.key);
					} else if (field.option.required && !field.validate()) {
						// Обычный required-чек: либо это простое поле, либо пустая required-панель без вкладок.
						errors.push({
							pageIdx: page.Index,
							blockIdx: block.Index,
							fieldKey: field.key,
							label: `Обязательное поле «${field.option.label}» не заполнено`,
						});
						reportedAsError.add(field.key);
					}
				});
				for (const issue of getBlockIssues(block)) {
					errors.push({
						pageIdx: page.Index,
						blockIdx: block.Index,
						fieldKey: issue.fieldKeys[0] ?? '',
						label: issue.message,
					});
				}
				for (const issue of block.loadIssues) {
					// Не дублируем: если поле уже помечено ошибкой «обязательное не заполнено»,
					// предупреждение об отсутствии в JSON избыточно.
					if (issue.kind === 'missing' && reportedAsError.has(issue.fieldKey)) continue;
					warnings.push({
						pageIdx: page.Index,
						blockIdx: block.Index,
						fieldKey: issue.fieldKey,
						label: issue.message.charAt(0).toUpperCase() + issue.message.slice(1),
					});
				}
			}
		}

		// Фильтруем по области отображения: «все» или «только текущий блок».
		const selected = blockManager.SelectedBlock;
		const matchesCurrent = (issue: Issue) =>
			!!selected &&
			issue.pageIdx === selected.PrimaryPage.Index &&
			issue.blockIdx === selected.Index;
		const filteredErrors = this.errorsScope === 'current' ? errors.filter(matchesCurrent) : errors;
		const filteredWarnings = this.errorsScope === 'current' ? warnings.filter(matchesCurrent) : warnings;

		// Если список не изменился с прошлого рендера — ничего не трогаем,
		// чтобы не сбрасывать scroll и не мигать DOM.
		// В сигнатуру включаем выбранный блок и scope, чтобы переключение
		// корректно триггерило перерисовку.
		const signature = JSON.stringify({
			scope: this.errorsScope,
			selectedPage: selected?.PrimaryPage.Index ?? null,
			selectedBlock: selected?.Index ?? null,
			errors: filteredErrors,
			warnings: filteredWarnings,
			totalErrors: errors.length,
			totalWarnings: warnings.length,
		});
		if (signature === this.lastErrorsSignature) return;
		this.lastErrorsSignature = signature;

		// Сохраняем текущую позицию скролла перед перестройкой списка.
		const prevList = container.querySelector('.errors-list') as HTMLDivElement | null;
		const savedScrollTop = prevList ? prevList.scrollTop : 0;

		const pluralize = (n: number, one: string, few: string, many: string) =>
			n === 1 ? one : n >= 2 && n <= 4 ? few : many;

		const countsHtml: string[] = [];
		if (filteredErrors.length > 0) {
			countsHtml.push(`<span class="errors-header-count--error">${filteredErrors.length} ${pluralize(filteredErrors.length, 'ошибка', 'ошибки', 'ошибок')}</span>`);
		}
		if (filteredWarnings.length > 0) {
			countsHtml.push(`<span class="errors-header-count--warning">${filteredWarnings.length} ${pluralize(filteredWarnings.length, 'предупреждение', 'предупреждения', 'предупреждений')}</span>`);
		}

		const scopeTabsHtml = `
			<div class="errors-scope-tabs">
				<button type="button" class="errors-scope-btn${this.errorsScope === 'current' ? ' active' : ''}" data-scope="current">Текущий блок</button>
				<button type="button" class="errors-scope-btn${this.errorsScope === 'all' ? ' active' : ''}" data-scope="all">Все блоки</button>
			</div>
		`;

		container.innerHTML = `
			<div class="errors-header">
				${scopeTabsHtml}
				${countsHtml.length > 0 ? `<div class="errors-header-counts">${countsHtml.join('')}</div>` : ''}
			</div>
		`;

		container.querySelectorAll<HTMLButtonElement>('.errors-scope-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				const scope = btn.dataset.scope as 'all' | 'current';
				if (scope === this.errorsScope) return;
				this.errorsScope = scope;
				this.refreshErrors();
			});
		});

		if (filteredErrors.length === 0 && filteredWarnings.length === 0) {
			const placeholder = document.createElement('div');
			placeholder.className = 'panel-placeholder';
			let title = 'Нет ошибок';
			let desc = 'Все обязательные поля заполнены';
			if (this.errorsScope === 'current') {
				if (!selected) {
					title = 'Блок не выбран';
					desc = 'Выберите блок слева, чтобы увидеть его ошибки';
				} else if (errors.length > 0 || warnings.length > 0) {
					title = 'В этом блоке нет ошибок';
					desc = `В других блоках: ${errors.length} ошибок, ${warnings.length} предупреждений`;
				} else {
					title = 'В этом блоке нет ошибок';
					desc = 'Все обязательные поля заполнены';
				}
			}
			placeholder.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.3"/><path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="panel-placeholder-title">${title}</span><span class="panel-placeholder-desc">${desc}</span>`;
			container.appendChild(placeholder);
			return;
		}

		const list = document.createElement('div');
		list.className = 'errors-list';

		const warningIcon = '<svg class="error-warning-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 20h20L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="currentColor" fill-opacity="0.15"/><path d="M12 10v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="17.5" r="0.8" fill="currentColor"/></svg>';

		const appendItem = (issue: Issue, isWarning: boolean) => {
			const item = document.createElement('div');
			item.className = isWarning ? 'error-item error-item--warning' : 'error-item';
			const messageHtml = isWarning ? `${warningIcon}<span>${issue.label}</span>` : issue.label;
			item.innerHTML = `
				<span class="error-location">Стр. ${issue.pageIdx} · Блок ${issue.blockIdx}</span>
				<span class="error-message">${messageHtml}</span>
			`;
			item.addEventListener('click', () => {
				const page = pageManager.Pages.find(p => p.Index === issue.pageIdx);
				const block = page?.Blocks.find(b => b.Index === issue.blockIdx);
				if (block) {
					eventManager.emit('blockSelect', block);
					if (issue.fieldKey) {
						setTimeout(() => {
							const fieldEl = document.querySelector(`[data-key="${issue.fieldKey}"]`) as HTMLElement
								?? document.getElementById(issue.fieldKey) as HTMLElement;
							if (fieldEl) {
								fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
								fieldEl.classList.add('field--highlight');
								setTimeout(() => fieldEl.classList.remove('field--highlight'), 2000);
							}
						}, 100);
					}
				}
			});
			list.appendChild(item);
		};

		for (const e of filteredErrors) appendItem(e, false);
		for (const w of filteredWarnings) appendItem(w, true);

		container.appendChild(list);
		// Восстанавливаем scroll после перестройки (чтобы пользователя не выбрасывало в начало).
		list.scrollTop = savedScrollTop;
	}

	private navigateDocs(): void {
		const fieldKey = this.pendingDocsFieldKey;
		this.pendingDocsFieldKey = null;
		setTimeout(() => {
			const wv = document.getElementById('docs-webview') as any;
			if (!wv) return;
			const b = blockManager.SelectedBlock;

			// Выбираем страницу + якорь. Поле ищем сперва в варианте (если выбран),
			// потом в устройстве — базовое поле документируется на странице блока.
			let url = DOCS_URLS._default;
			let anchor: string | undefined;
			const candidates: (string | undefined)[] = [b?.DeviceVariant ?? undefined, b?.Device ?? undefined];
			if (fieldKey) {
				for (const key of candidates) {
					if (!key) continue;
					const pageAnchors = FIELD_ANCHORS[key];
					if (pageAnchors && pageAnchors[fieldKey] && DOCS_URLS[key]) {
						url = DOCS_URLS[key];
						anchor = pageAnchors[fieldKey];
						break;
					}
				}
			}
			if (!anchor) {
				// Якорь не нашёлся — открываем обычную страницу блока/варианта.
				if (b?.DeviceVariant && DOCS_URLS[b.DeviceVariant]) url = DOCS_URLS[b.DeviceVariant];
				else if (b?.Device && DOCS_URLS[b.Device]) url = DOCS_URLS[b.Device];
			}

			const fullUrl = anchor ? `${url}#${anchor}` : url;
			try { if (wv.src !== fullUrl) wv.src = fullUrl; } catch { wv.setAttribute('src', fullUrl); }
		}, 100);
	}

	private initResize(): void {
		const h = document.getElementById('right-resize-handle');
		if (!h) return;
		const panel = this.view.elements.rightPanel;
		const sections = this.view.elements.rightSections;

		const CENTER_MIN = 410;
		const MIN_W = 260;
		const ABS_MAX = 700;

		const getSidebarWidth = () => document.getElementById('sidebar')?.offsetWidth ?? 240;
		const getLeftBarWidth = () => document.getElementById('activity-bar')?.offsetWidth ?? 48;
		const getRightBarWidth = () => this.view.elements.rightActivityBar?.offsetWidth ?? 48;
		const clamp = (desired: number) => {
			const avail = window.innerWidth - getLeftBarWidth() - getRightBarWidth() - getSidebarWidth() - CENTER_MIN;
			const maxW = Math.min(ABS_MAX, Math.max(MIN_W, avail));
			return Math.max(MIN_W, Math.min(maxW, desired));
		};
		const applyWidth = (w: number) => {
			document.body.style.setProperty('--right-panel-width', `${clamp(w)}px`);
		};
		this.clampRightPanelWidth = () => {
			if (!panel.classList.contains('content-open')) return;
			const current = sections.offsetWidth || parseInt(getComputedStyle(document.body).getPropertyValue('--right-panel-width')) || MIN_W;
			applyWidth(current);
		};

		let on = false;
		const ov = document.createElement('div');
		ov.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:col-resize;display:none;';
		document.body.appendChild(ov);
		h.addEventListener('mousedown', (e) => { if (!panel.classList.contains('content-open')) return; on = true; ov.style.display = 'block'; h.classList.add('active'); e.preventDefault(); });
		const mv = (e: MouseEvent) => { if (!on) return; applyWidth(window.innerWidth - e.clientX - getRightBarWidth()); };
		const up = () => { if (!on) return; on = false; ov.style.display = 'none'; h.classList.remove('active'); };
		ov.addEventListener('mousemove', mv); document.addEventListener('mousemove', mv);
		ov.addEventListener('mouseup', up); document.addEventListener('mouseup', up);

		window.addEventListener('resize', () => this.clampRightPanelWidth());
	}

	private clampRightPanelWidth: () => void = () => {};

	public render(): void { this.SidebarController.render(); this.BlockController.render(); }
	public setHeader(t: string): void { this.view.elements.header.textContent = t; }
	public updateJsonPreview(): void { this.view.elements.jsonOutput.textContent = configManager.toJSON(); }
	public showStartPage(): void { this.setHeader(PLACEHOLDERS.START_PAGE_TITLE); this.toggleConfig(false); this.togglePreviewJson(false); this.view.elements.startPage.classList.remove('hidden'); }
	public toggleConfig(s: boolean): void { if (s) this.view.elements.startPage.classList.add('hidden'); document.getElementById(ViewId.BLOCK_CONFIG)?.classList.toggle('hidden', !s); }
	public togglePreviewJson(s: boolean): void {
		const j = this.view.elements.jsonPreview;
		if (s) { this.view.elements.startPage.classList.add('hidden'); document.getElementById(ViewId.BLOCK_CONFIG)?.classList.add('hidden'); j.classList.remove('hidden'); this.updateJsonPreview(); }
		else j.classList.add('hidden');
	}

	public async newProject(): Promise<void> {
		if (!(await this.confirmDiscardCurrent())) return;
		this.clearProject();
		const p = pageManager.addPage();
		if (p) { eventManager.emit('pageAdded', p); const b = p.Blocks[0]; if (b) blockManager.SelectedBlock = b; }
	}

	public async loadConfigWithConfirm(): Promise<void> {
		if (!(await this.confirmDiscardCurrent())) return;
		await configManager.loadConfig();
	}

	public async clearCurrentProject(): Promise<void> {
		if (!pageManager.Pages.length) return;
		if (!(await showConfirm('Очистить конфигурацию? Все данные будут удалены.'))) return;
		this.clearProject(); this.render(); this.showStartPage();
	}

	public async handleSave(): Promise<void> {
		await configManager.saveConfig();
		this.refreshErrors();
	}

	public async confirmDiscardCurrent(): Promise<boolean> {
		if (!pageManager.Pages.length) return true;

		const wantSave = await showConfirm('Сохранить текущую конфигурацию перед продолжением?');
		if (wantSave) {
			const result = await configManager.saveConfig();
			if (result === 'cancelled') return false;
			return true;
		} else {
			const discard = await showConfirm('Все несохранённые данные будут потеряны. Продолжить?');
			return discard;
		}
	}

	private clearProject(): void { pageManager.clearPages(); blockManager.SelectedBlock = null; }
}
