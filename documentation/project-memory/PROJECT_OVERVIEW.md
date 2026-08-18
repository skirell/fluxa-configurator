# Обзор продукта

## Назначение

Skirell Fluxa Configurator — desktop-приложение для работы с JSON-конфигурациями панелей управления Skirell Fluxa. Пользователь может:

- создать проект с нуля;
- добавлять, удалять, копировать и переставлять страницы и блоки;
- выбирать тип блока и допустимый подтип;
- заполнять обычные и вложенные параметры через форму;
- импортировать и редактировать весь config JSON, JSON страницы или JSON блока;
- видеть errors и warnings с переходом к проблемному полю;
- открыть связанную онлайн-документацию;
- просмотреть и сохранить итоговый JSON.

Интерфейс и сообщения преимущественно русскоязычные. Основной домен документации панели — `https://docs-fluxa.skirell.ru/`.

## Технологический профиль

- Electron 36.7.x.
- TypeScript, target ES2020, CommonJS.
- Нативный DOM и CSS без frontend-фреймворка.
- Node.js 22+ заявлен в README.
- `node:test` для текущего автоматического suite.
- `electron-builder` для Windows, Linux и macOS.
- Локальный шрифт и индекс Material Design Icons для выбора пиктограмм.

Renderer имеет прямой доступ к Node/Electron API: `nodeIntegration: true`, `contextIsolation: false`, `webviewTag: true`. Это часть текущей архитектуры, а не рекомендуемый универсальный шаблон безопасности.

## Поддерживаемые блоки

| Device | Назначение | Требует variant |
| --- | --- | --- |
| `scene` | сценарий/команда | нет |
| `switch` | бинарный переключатель | нет |
| `sensor` | датчик с диапазонами и цветами | нет |
| `light` | освещение | да |
| `cover` | шторы/жалюзи | да |
| `climate` | климат | да |
| `music` | медиаплеер | нет |
| `device` | универсальное устройство с `settings` | нет |

Подтипы:

- light: `light_variant_OnOff`, `light_variant_dimmer`, `light_variant_color`, `light_variant_temperature`;
- cover: `cover_variant_slider`, `cover_variant_buttons`;
- climate: `climate_variant_cond`, `climate_variant_cond_extended`, `climate_variant_thermostat`.

## Границы проекта

Приложение не управляет MQTT и не подключается к панели. Оно редактирует и сохраняет конфигурационные файлы. Онлайн-сеть используется для Google Fonts и встроенной документации; сам редактор и локальные MDI-ассеты находятся в приложении.

В репозитории нет backend, базы данных, telemetry, аккаунтов, CI workflow или автоматического updater. Сборка и релиз сейчас выполняются локальными npm-командами.
