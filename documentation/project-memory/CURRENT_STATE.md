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

Перед изменением поведения воспроизведи эти пункты runtime или добавь узкий тест.

1. `collectConfigIssues()` проверяет `field.option.required`, а music dependency меняет внутренний runtime-required. Динамически обязательные `pause_command_topic`/`payload_pause` могут не появиться в save-gate; затем `Page.toJSON()` способен исключить невалидный music block.
2. `lastErrorsSignature` не сбрасывается при полном redraw правой панели. Новый пустой errors DOM может не заполниться, если signature не изменилась.
3. Full config validator не проверяет 100-page/6-block limits. `applyConfig()` очищает текущий проект, затем managers могут обрезать сверхлимитные данные, после чего load помечается clean.
4. Некоторые DnD операции вызывают только sidebar render, поэтому toolbar выбранного блока может временно показывать старые индексы.
5. После удаления последнего блока страницы `BlockManager` не выбирает fallback block с другой страницы и может вернуть UI на home.
6. Add page/block events могут испускаться с `undefined` после достижения лимита и всё равно ставить dirty.
7. Collapse-state sidebar привязан к изменяемому `page.Index`; после reorder/delete состояние может перейти к другой странице.
8. Навигация из errors не для каждого composite field гарантированно находит outer DOM для highlight.
9. Runtime icon path packaged-приложения вероятно не совпадает с расположением copied icons; требуется smoke-test артефакта.

## Изменения после полного аудита

- 2026-08-18: runtime-ссылки документации переведены с `/beta` на `/latest`; редактор дополнительных настроек получил одну контекстную ссылку на раздел выбранного типа, help-click активирует существующую docs-вкладку без двойной навигации, а anchors `music`/`cover_variant_slider` сверены с фактическими заголовками сайта.
- 2026-08-18: ошибочный пакет `tsc` удалён, `typescript@6.0.3` добавлен как прямой `devDependency`; `npm run convert`, `npm test` и Electron startup smoke-test прошли.

## Toolchain/release risks

- Скрипт `clean` использует `rimraf`, но пакет не объявлен прямой devDependency. `typescript` после полного аудита добавлен напрямую.
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
- `npm run convert` и `npm test`: пройдены после установки прямой зависимости TypeScript; 9 тестов в одном suite успешны.
- Electron startup smoke-test: пройден с `electron@36.9.5`; служебную переменную окружения `ELECTRON_RUN_AS_NODE=1` потребовалось снять перед GUI-запуском.
- Packaging smoke-test: не выполнялся.
