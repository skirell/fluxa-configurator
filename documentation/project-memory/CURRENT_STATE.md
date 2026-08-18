# Текущее техническое состояние

Дата полного статического аудита: 2026-08-18. HEAD на момент аудита: `fa449fb` (`v1.1.1`), ветка `main` синхронизирована с `origin/main`. До создания памяти единственным изменением был untracked `AGENTS.md`.

## Подтверждённые характеристики

- Около 10 141 строк TypeScript/JavaScript в `src` и tests; крупнейшие файлы — `AppController.ts`, `SidebarRenderer.ts`, variant/base ParamOption и `SettingsPanelField.ts`.
- Единственный automated suite — 9 `node:test` cases в одном файле.
- Нет CI, CHANGELOG, CONTRIBUTING, SECURITY, release automation или отдельного asset/license inventory.
- `documentation/README.md` до этой работы почти не содержал документации.
- `src/core/app.ts` пуст.
- В `SidebarRenderer.ts` класс называется `SiderbarRenderer`; переименование требует синхронного обновления импорта и типа в controller.
- В `src/core/html/index.html` отсутствует `<!DOCTYPE html>`; влияние quirks mode требует проверки в Electron.
- `BlockManager.Blocks` не используется; canonical state — `PageManager.Pages → Page.Blocks`.
- Renderer содержит рабочий циклический import `AppController → BlockManager → App`; startup зависит от текущего порядка инициализации.
- `src/data/constants/documentation.ts` не импортируется и отстаёт от поддерживаемой схемы.
- Системное закрытие окна не запрашивает подтверждение dirty-state.
- Неизвестные JSON keys молча теряются при повторной сериализации.
- Full preview/serialization исключает невалидные blocks через `Page.toJSON()`.

## Риски, обнаруженные трассировкой кода

Эти пункты не исправлялись в задаче создания памяти. Перед изменением поведения воспроизведи их runtime или добавь узкий тест.

1. `collectConfigIssues()` проверяет `field.option.required`, а music dependency меняет внутренний runtime-required. Динамически обязательные `pause_command_topic`/`payload_pause` могут не появиться в save-gate; затем `Page.toJSON()` способен исключить невалидный music block.
2. `lastErrorsSignature` не сбрасывается при полном redraw правой панели. Новый пустой errors DOM может не заполниться, если signature не изменилась.
3. Первый help-click при закрытой docs panel вызывает `navigateDocs()` из двух мест; повторная навигация может потерять anchor. Если docs tab уже существует, `openPanel()` не делает её активной.
4. Full config validator не проверяет 100-page/6-block limits. `applyConfig()` очищает текущий проект, затем managers могут обрезать сверхлимитные данные, после чего load помечается clean.
5. Некоторые DnD операции вызывают только sidebar render, поэтому toolbar выбранного блока может временно показывать старые индексы.
6. После удаления последнего блока страницы `BlockManager` не выбирает fallback block с другой страницы и может вернуть UI на home.
7. Add page/block events могут испускаться с `undefined` после достижения лимита и всё равно ставить dirty.
8. Collapse-state sidebar привязан к изменяемому `page.Index`; после reorder/delete состояние может перейти к другой странице.
9. Навигация из errors не для каждого composite field гарантированно находит outer DOM для highlight.
10. Runtime icon path packaged-приложения вероятно не совпадает с расположением copied icons; требуется smoke-test артефакта.

## Toolchain/release risks

- Scripts используют `tsc` и `rimraf`, но `typescript`/`rimraf` не прямые devDependencies.
- ESLint/Prettier configs есть, npm scripts и прямые executable dependencies отсутствуют.
- `.eslintrc.json` использует legacy format.
- README требует Node 22+, `package.json.engines` не задан.
- Source maps вероятно входят в package.
- Signing/notarization, publish config и auto-update отсутствуют.
- MDI и brand asset provenance/license metadata отсутствуют.

## История релизов

В Git на момент аудита было 20 commits и tags `v1.0.0`, `v1.0.1`, `v.1.0.2`, `v1.1.0`, `v1.1.1`. Последнее крупное изменение `feb839e` добавило universal `device`, extended climate и текущие тесты.

## Baseline проверки

- Полный файловый scan: выполнен.
- JSON MDI index: `jq` подтвердил 7447 валидных `{n,c}` records.
- `git diff --check`, проверка новых файлов на whitespace-ошибки, локальные Markdown-ссылки и баланс code fences: пройдены при создании этой памяти.
- `npm test`, TypeScript compile, Electron start и package smoke-test: не выполнены, потому что в окружении отсутствуют `node` и `npm`.
