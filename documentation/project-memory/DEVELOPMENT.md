# Разработка

## Требования и установка

README заявляет Node.js 22+ и npm:

```bash
npm install
```

Проект использует TypeScript/CommonJS без bundler. `tsconfig.json`:

- target `ES2020`;
- libs `ES2020`, `DOM`, `DOM.Iterable`;
- `rootDir: src`, `outDir: out`;
- source maps включены;
- `strict: false`, `skipLibCheck: true`;
- JSON modules и `esModuleInterop` включены.

## Команды

| Команда | Действие |
| --- | --- |
| `npm run convert:ts` | компилирует `src/**/*.ts` в `out/` |
| `npm run copy-assets` | копирует assets, HTML/CSS и icons в `out/` |
| `npm run convert:assets` | alias через `copy-assets` |
| `npm run convert` | TypeScript + assets |
| `npm start` | запускает `electron .` из уже подготовленного `out/` |
| `npm test` | компилирует TS и запускает `node:test` |
| `npm run clean` | удаляет `out` и `dist` через `rimraf` |

Типичный development flow:

```bash
npm install
npm run convert
npm start
```

Hot reload/watch script отсутствует; после изменения исходников нужна повторная компиляция.

Если Electron падает на `app.whenReady()` с сообщением, что `app` равен `undefined`, проверь переменную `ELECTRON_RUN_AS_NODE`. Она переводит Electron в режим обычного Node-процесса. Для разового запуска в Linux/macOS:

```bash
env -u ELECTRON_RUN_AS_NODE npm start
```

## Стиль

`.prettierrc.json` задаёт tabs, width 85, single quotes, semicolons, trailing commas и LF. `.eslintrc.json` использует legacy config с TypeScript/Prettier plugins, но npm scripts для lint/format отсутствуют.

Перед завершением:

```bash
npm test
git diff --check
git status --short
```

## Где менять поведение

| Изменение | Первый источник |
| --- | --- |
| device/variant/field schema | `src/data/settings/` |
| field UI type | `src/modules/ui/fields/`, constructor map |
| cross-field validation | `src/data/settings/block-rules.ts` |
| loaded value validation | `src/utils/field-value-validation.ts` |
| settings rules | `setting-options.ts`, `settings-validation.ts`, `SettingsPanelField.ts` |
| feature rules | `feature-param-options.ts`, `feature-validation.ts`, FeaturePanel classes |
| structure/copy/DnD/partial JSON | `SidebarRenderer.ts` |
| full load/save | `ConfigManager`, `src/core/main.ts` |
| errors/docs/preview/workflows | `AppController.ts` |
| IPC channels | `channels.ts` + main/renderer callers |

## Добавление device

1. `Device` enum.
2. `DEVICE_OPTIONS` и `DEVICE_ORDER`.
3. `BASE_PARAM_OPTIONS`.
4. При необходимости `DEVICE_VARIANT_MAP`.
5. Block rules и load/default logic.
6. `DOCS_URLS`/`FIELD_ANCHORS`.
7. Tests: missing, invalid, default, optional, required и round-trip.

## Добавление variant

1. `DeviceVariant`.
2. `VARIANT_OPTIONS` и `VARIANT_ORDER`.
3. Membership в `DEVICE_VARIANT_MAP`.
4. `VARIANT_PARAM_OPTIONS`.
5. Cross-field rules.
6. Docs URL/anchors.
7. Tests расположения в `data.variant`, `variant_type` и смены subtype.

## Добавление FieldType

1. `FieldType`/`CustomFieldType` в global types.
2. Класс `BaseField` с правильными `render`, `getValue`, `setValue/refreshUI`, `validate`, `dispose`.
3. `FIELD_CONSTRUCTORS_MAP` или специальная factory branch.
4. `isLoadedValueValid()`.
5. `getDefaultValueForField()`.
6. При поддержке внутри feature — `isFeatureFieldValueValid()`.
7. Serialization, load и DOM lifecycle tests.

## Добавление feature/settings/dependency

Feature требует enum, nested map, родительский ParamOption, count/prefix, human labels в FeaturePanel/ButtonsHandler и lexical-order test с 10+ записями.

Settings type требует enum, type label, field schema, renderer/serializer/validator и specialized tests. Новый input type затрагивает все три части `SettingsPanelField`.

Dependency размещается на target field. Source должен находиться в том же `FieldsManager`. Проверяй новый блок, `populateFields()+evaluateAll()` и живое изменение.

## Сгенерированные файлы

Не редактировать и не коммитить:

- `node_modules/`;
- `out/`;
- `dist/`;
- `build/`, logs, coverage и временные каталоги.

Исходные icons и assets коммитятся. `package-lock.json` также должен оставаться в Git.
