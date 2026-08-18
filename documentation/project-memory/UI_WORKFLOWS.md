# UI и пользовательские сценарии

## Основной layout

Статическая оболочка находится в `src/core/html/index.html`:

- левая activity bar: home/new/load/preview/clear/theme/save;
- sidebar: дерево страниц и блоков;
- центральный editor: home, block form или JSON preview;
- правая activity bar и dockable panel: online docs и errors.

Тёмная тема используется по умолчанию. Выбор light/dark хранится в `localStorage` под ключом `skirell-theme`.

## Новый проект, загрузка и очистка

- New перед заменой dirty-проекта предлагает Save / Не сохранять / Отмена.
- Новый проект очищает состояние, создаёт страницу с первым пустым блоком, выбирает его и затем помечает проект clean.
- Load использует то же discard-confirmation, Electron open dialog, JSON parse и structural validation. После применения выбирается первый блок и проект помечается clean.
- Clear имеет отдельное подтверждение, удаляет страницы и возвращает home.
- Системное закрытие окна сейчас не проверяет dirty-state.

## Редактирование блока

`BlockRenderer` строит selects по `DEVICE_ORDER`, `VARIANT_ORDER` и `DEVICE_VARIANT_MAP`. При выборе:

- новый device очищает все данные и старые поля;
- новый variant сначала записывает живые base-поля в модель, затем очищает старый variant;
- UI синхронизирует map полей и отображает форму только после выбора обязательного variant.

Каждый input вызывает `fieldChanged`, dirty и refresh ошибок. NumberField возвращает `number|null`; icon сохраняет Unicode glyph, не имя MDI.

## Sidebar

`SidebarRenderer.ts` поддерживает:

- collapse страницы;
- add/delete page и block;
- drag-and-drop для reorder страниц, reorder блоков и переноса между страницами;
- создание следующей страницы, если block переносится/копируется в заполненную;
- duplicate block/page, в том числе после подтверждения при невалидных данных;
- JSON modal для блока и страницы;
- индикацию ошибок блока.

После любой структурной операции индексы пересчитываются с 1. Пустая страница удаляется callback-ом `Page.onBlockRemoved`.

### JSON modal

Для блока и страницы доступны copy, «вставить после» и «заменить текущий». Валидация modal проверяет общую форму, известный device и object `data`; детальная нормализация происходит через `BlockManager.loadBlockToPage()`.

Page modal принимает:

- raw `{page, blocks}`;
- полный `{screens:[...]}`, только если `screens` содержит ровно одну страницу.

Исходные `page`/`block` индексы нормализуются и после вставки пересчитываются. Page с более чем 6 блоками отклоняется в modal.

## Feature, lameli и settings editors

- Feature использует вкладки, add/save/delete, min/max counts и отдельную nested validation.
- Для `minOrEmpty` первое Add создаёт сразу минимальное число записей, а удаление у нижней границы очищает весь optional набор.
- Lameli можно включить и удалить с подтверждением; nested fields зависят от `lameliType`.
- Settings — упорядоченный список разных типов с переключением, reorder, enum-options и переходом к конкретной nested error.
- Help-кнопки nested feature/lameli ведут к документации родительского поля, потому что отдельных anchors нет.

## Preview и сохранение

Preview вызывает `ConfigManager.toJSON()` и отображает результат. Из-за поведения `Page.toJSON()` невалидные блоки в preview исключаются.

Save:

1. проверяет наличие блоков;
2. собирает errors/warnings;
3. при errors открывает правую панель в scope «Все блоки» и блокирует dialog;
4. при отсутствии errors сериализует и вызывает IPC save dialog;
5. после успешной записи очищает `loadIssues` и dirty-state.

## Панель errors

Ошибки собираются из:

- отсутствующего device/variant;
- required и nested field validation;
- `block-rules.ts`;
- `block.loadIssues` как warnings.

Есть scopes «Текущий блок» и «Все блоки». Клик выбирает блок, прокручивает и подсвечивает поле; settings умеет открыть конкретный item/option. Список обновляется по событиям и каждые 2 секунды, пока errors-panel активна. DOM refresh кэшируется по signature, чтобы не сбрасывать scroll.

## Панель документации

Docs и errors можно объединять во вкладки или разделять drag-and-drop вертикально/горизонтально; инфраструктура допускает до трёх секций, хотя сейчас существует только два panel ID. Ширина docs/errors области регулируется от 260 до 700 px с резервом минимум 410 px для центра. Layout и ширина не сохраняются между запусками.

Docs загружается через Electron `<webview>`:

- обычные devices/variants — `/latest`;
- `device`, `climate_variant_cond_extended`, `settings` — `/beta`;
- help-кнопка выбирает URL и `#anchor` по hard-coded maps в `AppController.ts`;
- при network fail показывается fallback и Retry.

Ссылка документации на home открывается во внешнем браузере через `shell.openExternal()`.

## Иконки

`IconField` лениво загружает локальный `mdi-icons.json`, показывает виртуализированную сетку и ищет по английскому имени. Ввод/выбор хранит glyph из `mdi_font.ttf`. Последние 12 имён хранятся в `localStorage` под ключом `skirell-recent-icons`.
