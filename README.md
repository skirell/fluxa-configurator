# Skirell Fluxa Configurator

Приложение для создания, редактирования, проверки и сохранения JSON-конфигураций панелей [Skirell-Fluxa](https://skirell.ru/service/fluxa/)

Документация панелей [docs-fluxa.skirell.ru](https://docs-fluxa.skirell.ru/)

Документация конфигуратора [ссылка](https://docs-fluxa.skirell.ru/latest/nastroiki-paneli/konfiguraciya-interfeisa/skirell-konfigurator/)

## Для пользователей

### Установка

1. Откройте страницу **Releases** в этом репозитории.
2. Скачайте установщик из последнего релиза.
3. Запустите установщик и следуйте инструкциям.
4. Откройте приложение **Skirell Fluxa Configurator**.

Для Windows используйте файл вида:

```text
skirell-panel-fluxa-configurator Setup 1.0.0.exe
```

Для Linux может быть доступен архив вида:

```text
skirell-panel-fluxa-configurator-1.0.0.tar.gz
```

### Что можно делать в приложении

- создавать новую конфигурацию панели;
- добавлять страницы и блоки;
- выбирать типы блоков и подтипы;
- заполнять параметры через форму;
- видеть ошибки и предупреждения по обязательным полям;
- открывать предпросмотр JSON;
- сохранять готовый JSON-файл;
- загружать существующий JSON и редактировать его.

## Для ручной сборки

### Требования

- Node.js 22 или новее;
- npm;
- macOS, если нужно собрать `.dmg` для macOS.

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run convert
npm start
```

### Проверка TypeScript

```bash
npm run convert:ts
```

### Сборка production-версии

Windows:

```bash
npm run build:win
```

Linux AppImage:

```bash
npm run build:linux
```

Linux tar.gz:

```bash
npm run build:linux:tar
```

macOS:

```bash
npm run build:mac
```

Готовые файлы появляются в папке `dist/`.

### Важные замечания по сборке

- На Windows сборка Windows-установщика работает штатно.
- На Windows Linux AppImage может упасть из-за прав на создание symlink. В таком случае используйте `npm run build:linux:tar` или собирайте AppImage на Linux.
- Сборку macOS нужно запускать на macOS. Electron Builder не собирает `.dmg` на Windows.

## Структура проекта

- `src/` - исходный код приложения;
- `src/core/` - Electron main/renderer и базовые HTML/CSS файлы;
- `src/modules/` - UI-компоненты, поля, менеджеры и логика приложения;
- `src/data/` - настройки полей, enum-значения и константы;
- `documentation/project-memory/` - архитектура, формат JSON, инструкции разработки и карта ресурсов;
- `icons/` - иконки приложения для сборки;
- `out/` - скомпилированные файлы, не хранится в git;
- `dist/` - production-артефакты сборки, не хранится в git.

## Git

В репозиторий должны попадать исходники, конфиги и lock-файл. Сгенерированные папки `node_modules/`, `out/` и `dist/` игнорируются.
