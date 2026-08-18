# Архитектура

## Общая схема

```text
Electron main process (src/core/main.ts)
        │ IPC: load / save / app version
        ▼
Renderer bootstrap → App singleton → AppController
        │                    │
        │                    ├─ BlockController / BlockRenderer / BlockView
        │                    ├─ SidebarController / SidebarRenderer / SidebarView
        │                    └─ docs + errors + preview + theme + layout
        ▼
Singleton managers
ConfigManager · PageManager · BlockManager · EventManager · DirtyStateManager
        │
        ▼
Models and dynamic form
Page → Block → BlockUI/FieldsManager → BaseField subclasses
                                  └→ DependencyManager
        │
        ▼
Declarative schema and validation
src/data/settings/* + src/utils/*
```

## Запуск приложения

1. Electron запускает скомпилированный `out/core/main.js`.
2. `src/core/main.ts` создаёт максимизированное окно с минимумом 1230×620 и загружает `core/html/index.html`.
3. `src/core/render/renderer.ts` ждёт `DOMContentLoaded` и вызывает singleton `App.init()`.
4. `AppController.init()` инициализирует block/sidebar controllers, версию приложения, theme/layout listeners и глобальные события.
5. Пока блок не выбран, показывается стартовый экран. Новый проект создаёт страницу и первый блок.

`src/core/app.ts` сейчас пуст и не участвует в lifecycle.

`App` создаётся singleton-ом уже при импорте renderer-модуля. Конструкторы `AppView`, `BlockView` и `SidebarView` сразу ищут обязательные DOM ID через `getElement()` и бросают ошибку, если оболочка HTML не совпадает с View. `App.init()` рассчитан на один вызов: повторная инициализация продублирует listeners и двухсекундный polling errors.

## Electron main process и IPC

`src/core/main.ts` владеет файловыми диалогами и filesystem API:

| Channel | Направление | Результат |
| --- | --- | --- |
| `get-app-version` | renderer → main | `app.getVersion()` |
| `save-config` | renderer → main | save dialog, запись UTF-8, boolean |
| `load-config` | renderer → main | open dialog, `{status,data?}` |

Файл по умолчанию сохраняется как `DATA.json` в Documents. Ошибки чтения/записи логируются в main process и превращаются в безопасный статус для renderer.

## Состояние и модели

- `PageManager.Pages` — канонический массив страниц.
- `Page.Blocks` — канонический массив блоков страницы.
- `BlockManager.SelectedBlock` — текущий блок; setter связывает его с `BlockController`.
- `Block` хранит выбранные `Device`, `DeviceVariant`, внутренний `data`, `BlockUI` и восстановимые `loadIssues`.
- `DirtyStateManager` хранит один boolean. Он очищается после нового проекта, успешной загрузки, очистки или успешного сохранения.
- `BlockManager.Blocks` объявлен, но текущий код его не использует; не считай его источником списка блоков.

`Page` и `Block` реализуют глобальный `IJsonSerializable`. Глобальные `.d.ts` подключаются TypeScript без импортов.

## Динамические поля

`BlockUI` наследуется от `FieldsManager`. Он объединяет base и variant ParamOption через `getAllParams(block)`. `FieldsManager`:

- удаляет поля, которых больше нет в схеме;
- создаёт недостающие поля через `createFieldInstance()`;
- регистрирует поля в `DependencyManager`;
- при загрузке переносит значения модели в UI и вызывает `evaluateAll()`;
- вызывает `dispose()` при очистке.

`FIELD_CONSTRUCTORS_MAP` связывает `FieldType` с классом. `feature` создаётся отдельной веткой в `createFieldInstance()`.

## События renderer

`EventManager` — синхронная string-based шина без типизированного event map. Фактически используются:

| Event | Основной источник | Эффект в `AppController` |
| --- | --- | --- |
| `blockSelect` | Page/sidebar/errors | выбор блока, sidebar render, errors refresh |
| `blockAdded` | sidebar | dirty, выбор блока, sidebar/errors refresh |
| `pageAdded` | PageManager/sidebar/load | dirty и общий render |
| `deviceChanged` | BlockRenderer | dirty, sidebar/errors refresh |
| `deviceVariantChanged` | BlockRenderer | dirty, sidebar/errors refresh |
| `fieldChanged` | BaseField/SettingsPanelField | dirty и errors refresh |
| `showFieldDocs` | help-кнопки полей | открыть docs panel и перейти к URL/anchor |

Слушатель `pageAdded` помечает dirty, поэтому после `ConfigManager.applyConfig()` менеджер явно вызывает `markClean()`.

## Главные компоненты

- `AppController.ts` — глобальные workflows, правая панель, ошибки, документация, preview, theme, resize и discard-confirmation.
- `SidebarRenderer.ts` — дерево, drag-and-drop, copy, delete, JSON modal и перемещение между страницами. Экспортируемый класс сейчас намеренно ищется как `SiderbarRenderer` (историческая опечатка).
- `BlockRenderer.ts` — select типа/подтипа, заголовок и форма текущего блока.
- `ConfigManager.ts` — full-config load/apply/serialize/save.
- `BlockManager.ts` — загрузка одного блока, выбор и смена device/variant.
- `DependencyManager.ts` — декларативные реакции полей.

## Зависимости и cleanup

Поведение поля описывается через `fieldSettings.behavior`: dependencies объединяются `and`/`or`, затем выполняются actions `setState`, `setValue` или `custom`. Реализованы операторы для равенства, строк, пустоты и массивов.

Поля могут устанавливать глобальные DOM-listeners. Например, color/icon dropdown удаляет их в `dispose()`. Любой новый field должен поддерживать тот же lifecycle, иначе повторная смена device/variant будет накапливать обработчики.

В renderer есть рабочий циклический import `AppController → BlockManager → App`; он опирается на текущий порядок singleton-инициализации. При рефакторинге этой цепочки нужен отдельный startup smoke-test.
