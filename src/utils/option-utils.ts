import { Device, DeviceVariant } from '../data/enums/device';
import { Feature } from '../data/enums/feature';
import { BASE_PARAM_OPTIONS } from '../data/settings/param-options/base-param-options';
import { FEATURE_PARAM_OPTIONS } from '../data/settings/param-options/feature-param-options';
import { VARIANT_PARAM_OPTIONS } from '../data/settings/param-options/variant-param-options';
import { ParamOption } from '../global/types/option';
import Block from '../modules/components/block/Block';

export function getAllParams(block: Block): ReadonlyMap<string, ParamOption> {
	return new Map<string, ParamOption>([
		...(block.Device ? getBaseParams(block.Device) : []),
		...(block.DeviceVariant ? getVariantParams(block.DeviceVariant) : []),
	]);
}

export function getBaseParams(device: Device): ReadonlyMap<string, ParamOption> {
	return BASE_PARAM_OPTIONS.get(device)!;
}

export function getVariantParams(
	deviceVariant: DeviceVariant,
): ReadonlyMap<string, ParamOption> {
	return VARIANT_PARAM_OPTIONS.get(deviceVariant)!;
}

export function getFeatureParams(
	feature: Feature,
): ReadonlyMap<string, ParamOption> {
	return FEATURE_PARAM_OPTIONS.get(feature)!;
}

export function isFieldInBase(
	device: Device | undefined | null,
	fieldKey: string,
): boolean {
	if (!device) return false;
	const baseParams = BASE_PARAM_OPTIONS.get(device);
	return baseParams?.has(fieldKey) ?? false;
}

export function isFieldInVariant(
	variant: DeviceVariant | undefined | null,
	fieldKey: string,
): boolean {
	if (!variant) return false;
	const variantParams = VARIANT_PARAM_OPTIONS.get(variant);
	return variantParams?.has(fieldKey) ?? false;
}

export function isFieldInFeature(
	feature: Feature | undefined | null,
	fieldKey: string,
): boolean {
	if (!feature) return false;
	const featureParams = FEATURE_PARAM_OPTIONS.get(feature);
	return featureParams?.has(fieldKey) ?? false;
}
