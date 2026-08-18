# Инвентаризация исходников

Этот файл фиксирует охват полного сканирования 2026-08-18. Он является картой поиска, а не заменой исходного кода.

## Корень и документация

- `package.json`, `package-lock.json` — scripts, dependencies, electron-builder.
- `tsconfig.json` — compiler contract.
- `.eslintrc.json`, `.prettierrc.json`, `.gitattributes`, `.gitignore` — quality/style/repository rules.
- `README.md` — user install и manual build.
- `documentation/README.md` — общий documentation index.
- `AGENTS.md` — автоматическая точка входа в эту память.

## Electron/bootstrap

- `src/core/main.ts` — window, lifecycle, IPC/file dialogs.
- `src/core/render/renderer.ts` — DOMContentLoaded bootstrap.
- `src/core/html/index.html` — static application shell/CSP/theme preload.
- `src/core/css/index.css` — CSS aggregator.
- `src/core/app.ts` — пустой legacy-файл.

## Components

- `src/modules/components/app/`: `App`, `AppController`, `AppView`, barrel.
- `src/modules/components/block/`: model `Block`, controller, renderer, view, `BlockUI`.
- `src/modules/components/page/Page.ts`.
- `src/modules/components/sidebar/`: controller, renderer, view.

## Managers

- `BlockManager`: current selection, block load, device/variant changes.
- `ConfigManager`: full load/apply/save/serialize и structural validation.
- `PageManager`: pages, limits, reindex.
- `FieldsManager`: dynamic field lifecycle.
- `DependencyManager`: declarative field behavior.
- `EventManager`: renderer event bus.
- `DirtyStateManager`: unsaved boolean.
- Соответствующие `index.ts` barrels.

## UI fields

- Simple: `BaseField`, `TextField`, `NumberField`, `BooleanFields`, `OptionField`, `ColorField`, `ColorFormatField`, `IconField`.
- Composite: `LameliPanelField`, `SettingsPanelField`.
- Feature panel: `FeaturePanelField`, UI base, buttons handler, `Tab`, `TabUI`, barrels.

## Declarative data

- Constants: IPC channels, limits, placeholders, path separator, legacy documentation.
- Enums: action, class names, color/format, device/variant, feature, operator, path, setting, view IDs.
- Maps: device→variant, field constructor, data paths.
- UI options: device, variant, color, color format, settings.
- Param options: base, variant, feature, lameli.
- Cross-field rules: `src/data/settings/block-rules.ts`.

## Types

- Interfaces: JSON serialization и validation result.
- Global types: block, config, page, option, field, feature panel.

## Utilities

- alerts/modals/toasts;
- DOM lookup/reindex и enum iteration;
- field factory/default/load validation;
- feature/settings validation;
- option registry lookup;
- path get/set;
- generic validation result helpers.

## Tests

- `tests/settings-validation.test.js` — 9 compiled-module regression tests.

## Assets

- 9 source CSS modules и CSS aggregator.
- HTML shell.
- MDI TrueType font и JSON index из 7447 icons.
- App icons: 9 PNG sizes, Linux PNG, Windows ICO, macOS ICNS.

Бинарные файлы были проверены по типу, размеру и назначению; растровые brand icons — также по dimensions. Minified MDI JSON проверен parser-ом, а не прочитан как сырой текст целиком.

## Размер и полнота

До добавления project-memory Git отслеживал 130 файлов. Полностью прочитаны root configs/docs/tests и все текстовые файлы `src/`; для больших декларативных maps и CSS проверены все секции, symbols и связи. Дополнительно трассированы imports, Electron API, event emit/on, external URLs, localStorage, docs anchors и package assets.

При следующем полном аудите обнови дату, число файлов, новые каталоги и [CURRENT_STATE.md](CURRENT_STATE.md).
