# Ресурсы, ассеты и внешние зависимости

## Runtime assets

### Material Design Icons

- `src/assets/fonts/mdi_font.ttf` — TrueType font, около 1.3 MiB.
- `src/assets/icons/mdi-icons.json` — minified JSON, около 264 KiB.
- На момент аудита JSON валиден и содержит 7447 records `{n,c}`, от `ab-testing` до `zodiac-virgo`.
- `IconField` загружает JSON через relative `fetch()` и преобразует hex codepoint в Unicode glyph.
- CSS `@font-face` находится в `fields.css`.

Версия, источник и лицензия локальной копии MDI в репозитории не зафиксированы. Не перемещай и не перегенерируй эти файлы без синхронного изменения fetch/font paths и фиксации provenance.

### Иконки приложения

- `icons/png/`: 16, 24, 32, 48, 64, 128, 256, 512 и 1024 px.
- `icons/linux/icon.png`: 512×512; совпадает по содержимому с PNG 512.
- `icons/win/icon.ico`: multi-size Windows icon.
- `icons/mac/icon.icns`: macOS icon.

Brand/source/license metadata в репозитории отсутствуют. Пути packaging описаны в [BUILD_AND_RELEASE.md](BUILD_AND_RELEASE.md).

### CSS

`src/core/css/index.css` импортирует девять модулей:

| Файл | Ответственность |
| --- | --- |
| `base.css` | theme tokens, reset, typography |
| `layout.css` | activity bars, editor, right panel, docs/errors, dock/resize |
| `sidebar.css` | page tree, actions, DnD, JSON modal |
| `fields.css` | inputs, selects, colors, toggles, icon picker, MDI font binding |
| `buttons.css` | button variants |
| `alerts.css` | toasts и modal dialogs |
| `components.css` | feature/settings tabs and editors |
| `preview.css` | JSON preview |
| `index.css` | home screen |

UI SVG в основном встроены inline в HTML/TypeScript; стрелка select — data URI.

## Внешние URLs

Пользовательские ресурсы:

- продукт: `https://skirell.ru/service/fluxa/`;
- документация: `https://docs-fluxa.skirell.ru/`;
- configurator docs: `https://docs-fluxa.skirell.ru/latest/nastroiki-paneli/konfiguraciya-interfeisa/skirell-konfigurator/`;
- общий JSON: `https://docs-fluxa.skirell.ru/latest/konfiguraciya-paneli/obshaya-struktura-json/`;
- дополнительные настройки: `https://docs-fluxa.skirell.ru/latest/konfiguraciya-paneli/dopolnitelnye-nastroiki/`.

`AppController.ts` содержит фактический catalog device/variant URL и anchors. Все runtime-ссылки используют base URL `https://docs-fluxa.skirell.ru/latest`. Для элементов `settings` заданы отдельные anchors типов `pushbutton`, `switch`, `text`, `text_read_only`, `enum` и `range`.

HTML загружает Inter с `fonts.googleapis.com`/`fonts.gstatic.com`. Без сети применяется системный font fallback; docs webview показывает собственный offline fallback.

## CSP и storage

HTML CSP разрешает inline styles, Google Fonts и `frame-src *`. Тема и recent MDI icons хранятся в localStorage:

- `skirell-theme`;
- `skirell-recent-icons` (до 12 names).

## Legacy/local reference

`src/data/constants/documentation.ts` содержит 333 строки локальных описаний, но нигде не импортируется. Он неполон: нет `music`, `device`, `climate_variant_cond_extended`. Рабочая help-система использует remote URLs/anchors из `AppController.ts`; рассматривай `documentation.ts` как legacy reference, не как источник истины.

## Где обновлять ссылки

- Home external link — `src/core/html/index.html`.
- Embedded device/variant/settings URLs и field anchors — `AppController.ts`.
- Public links/installation — root `README.md`.
- CSP domains/Google Fonts — `index.html`.
- Runtime MDI paths — `IconField.ts` и `fields.css`.
