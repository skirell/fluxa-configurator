import { PLACEHOLDERS } from '../../../data/constants/placeholders';
import { Device, DeviceVariant } from '../../../data/enums/device';
import { ViewId } from '../../../data/enums/view-id';
import { DEVICE_VARIANT_MAP } from '../../../data/settings/maps/device-variant-map';
import { DEVICE_OPTIONS } from '../../../data/settings/options/device-options';
import { DEVICE_ORDER } from '../../../data/settings/options/device-options';
import { VARIANT_OPTIONS } from '../../../data/settings/options/variant-options';
import { VARIANT_ORDER } from '../../../data/settings/options/variant-options';
import { forEachEnum } from '../../../utils/enum-utils';
import blockManager from '../../managers/BlockManager/BlockManager';
import eventManager from '../../managers/EventManager/EventManager';
import App from '../app';
import { AppController } from '../app/AppController';
import { BlockView } from './BlockView';

export class BlockRenderer {
	constructor(private readonly view: BlockView) {
		this.initDeviceListener();
		this.initDeviceVariantListener();
	}

	private initDeviceListener(): void {
		const selectElement = this.view.elements.deviceType;
		selectElement.addEventListener('change', () => {
			const deviceType = selectElement.value as Device;
			blockManager.setDevice(deviceType);

			this.refillDeviceVariantOptions();
			this.refreshFields();
			this.refreshHeader();

			eventManager.emit('deviceChanged', undefined);
		});
	}

	private initDeviceVariantListener(): void {
		const selectElement = this.view.elements.deviceVariant;
		selectElement.addEventListener('change', () => {
			const deviceVariant = selectElement.value as DeviceVariant;
			blockManager.setDeviceVariant(deviceVariant);

			this.refreshFields();
			this.refreshHeader();

			eventManager.emit('deviceVariantChanged', undefined);
		});
	}

	render() {
		if (!blockManager.SelectedBlock) return App.Controller.showStartPage();

		this.refreshHeader();
		this.refreshFields();
	}

	public refillDeviceOptions(): void {
        const selectElement = this.view.elements.deviceType;
        selectElement.innerHTML = `<option value="" disabled>Выберите тип</option>`;
    
        for (const deviceType of DEVICE_ORDER) {
            const label = DEVICE_OPTIONS.get(deviceType)?.label ?? deviceType;
            selectElement.insertAdjacentHTML(
                'beforeend',
                `<option value="${deviceType}">${label}</option>`,
            );
        }
    
        selectElement.selectedIndex = 0;

        selectElement.addEventListener('change', (event) => {
            const select = event.target as HTMLSelectElement;
            if (select.value === '') {
                select.selectedIndex = -1;
                select.blur();
            }
        });
    }

	public refillDeviceVariantOptions(): void {
        const { deviceType, deviceVariant } = this.view.elements;
        const container = deviceVariant.closest(`#${ViewId.SUBTYPE_CONTAINER}`);
    
        const type = deviceType.value as Device;
        const variants = DEVICE_VARIANT_MAP.get(type);
    
        if (!variants || !variants.length) {
            container?.classList.add('hidden');
            return;
        }
    
        container?.classList.remove('hidden');
        deviceVariant.innerHTML = `<option value="" disabled>Выберите подтип</option>`;
    
        for (const variant of VARIANT_ORDER) {
            if (variants.includes(variant)) {
                const optionData = VARIANT_OPTIONS.get(variant);
                if (optionData) {
                    const label = optionData.label ?? variant;
                    deviceVariant.innerHTML += `<option value="${variant}">${label}</option>`;
                }
            }
        }
    
        deviceVariant.selectedIndex = 0;
    
        deviceVariant.addEventListener('change', (event) => {
            const select = event.target as HTMLSelectElement;
            if (select.value === '') {
                select.selectedIndex = -1;
                select.blur();
            }
        });
    }

	public refreshHeader(): void {
		const block = blockManager.SelectedBlock;
		if (!block) return;

		const deviceOptions = block.Device
			? DEVICE_OPTIONS.get(block.Device)
			: undefined;
		const variantParams = block.DeviceVariant
			? VARIANT_OPTIONS.get(block.DeviceVariant)
			: undefined;

		App.Controller.setHeader(
			`Страница ${block.PrimaryPage.Index} · ` +
				`Блок ${block.Index} · ` +
				`\n${deviceOptions?.label ?? PLACEHOLDERS.UNSPECIFIED_BLOCK_TYPE}` +
				`${block.DeviceVariant ? ' ~ ' + variantParams?.label : ''}`,
		);
	}

	public refreshFields(): void {
		const { blockFields } = this.view.elements;
		blockFields.innerHTML = '';

		const block = blockManager.SelectedBlock;
		if (!block) return;

		// Всегда синхронизируем карту полей с текущим Device/DeviceVariant,
		// даже если подтип ещё не выбран — иначе в UI.fields остаются старые
		// поля от предыдущего Device, и панель ошибок показывает их как «зависшие».
		block.UI.generateFields();

		if (block.isVariantMissing()) return;

		block.UI.getFields().forEach(field => {
			blockFields.appendChild(field.getRootElement());
		});
	}
}
