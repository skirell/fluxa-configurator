# Сборка и выпуск

## Pipeline

`npm run convert` компилирует TypeScript и копирует:

- `src/assets/**/*` → `out/assets/`;
- `src/core/html/**/*` → `out/core/html/`;
- `src/core/css/**/*` → `out/core/css/`;
- `icons/**/*` → `out/icons/`.

Electron entry — `out/core/main.js`. `electron-builder` упаковывает `out/**/*` и `package.json` в `asar`; TypeScript source и root `icons/` исключены.

## Targets

| Platform | Команда | Target |
| --- | --- | --- |
| Windows | `npm run build:win` | NSIS |
| Linux | `npm run build:linux` | AppImage |
| Linux fallback | `npm run build:linux:tar` | `tar.gz` |
| macOS | `npm run build:mac` | DMG |
| Default host | `npm run build` | electron-builder default |

App ID: `com.skirell.skirell-panel-fluxa-configurator`. Windows installer не one-click и разрешает выбрать каталог.

README предупреждает:

- Linux AppImage на Windows может упасть из-за symlink permissions; использовать tar.gz или Linux host;
- DMG собирать на macOS.

## Release checklist

1. Обновить version в `package.json` и lockfile.
2. Проверить release notes/изменения формата JSON.
3. `npm ci` в чистом окружении.
4. `npm test`.
5. `npm run convert` и development smoke-test.
6. Собрать target на подходящей ОС.
7. Установить/запустить реальный артефакт.
8. Проверить окно/иконку, new/load/edit/preview/save/reload, docs offline fallback.
9. Проверить содержимое package и отсутствие лишних source/secrets.
10. Создать согласованный tag/release вручную.

CI, release workflow, signing/notarization, publish config и auto-update сейчас отсутствуют.

## Требующие внимания детали

- `typescript` объявлен прямой `devDependency`. `rimraf` всё ещё вызывается скриптом `clean`, но присутствует только транзитивно; то же относится к executable ESLint/Prettier. Чистая воспроизводимость этих команд требует отдельной проверки.
- `package.json.engines` отсутствует, хотя README требует Node 22+.
- Source maps включены, а `out/**/*` упаковывается целиком; `.js.map` вероятно попадут в `asar`.
- В `main.ts` runtime icon base вычисляется как `../../icons` относительно `out/core/main.js`, тогда как copied icons находятся в `out/icons`. Development checkout может скрывать проблему наличием root `icons`; packaged runtime нужно проверить и при необходимости исправить путь.
- `productName`, signing/notarization и asset licensing metadata не заданы.
