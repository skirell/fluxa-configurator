# Постоянная база знаний проекта

Этот каталог хранит долговременный контекст Skirell Fluxa Configurator: инструкции, архитектуру, формат данных, рабочие сценарии, проверки и карту ресурсов. Он предназначен и для разработчиков, и для AI-ассистентов.

Снимок создан после полного повторного сканирования репозитория 2026-08-18:

- ветка `main`;
- HEAD `fa449fb`, тег `v1.1.1`;
- package version `1.1.1`;
- 130 отслеживаемых файлов до добавления этой базы знаний.

## Что читать

| Задача | Документы |
| --- | --- |
| Любое изменение | [AI_INSTRUCTIONS.md](AI_INSTRUCTIONS.md), затем профильный документ |
| Понять продукт и границы проекта | [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) |
| Изменить lifecycle, контроллер, менеджер или IPC | [ARCHITECTURE.md](ARCHITECTURE.md), [UI_WORKFLOWS.md](UI_WORKFLOWS.md) |
| Добавить device, variant, field, feature, lameli или settings | [CONFIGURATION_MODEL.md](CONFIGURATION_MODEL.md), [VALIDATION_AND_TESTING.md](VALIDATION_AND_TESTING.md) |
| Изменить UI, sidebar, docs/errors panel, тему или иконки | [UI_WORKFLOWS.md](UI_WORKFLOWS.md), [RESOURCES.md](RESOURCES.md) |
| Запустить, собрать или выпустить приложение | [DEVELOPMENT.md](DEVELOPMENT.md), [BUILD_AND_RELEASE.md](BUILD_AND_RELEASE.md) |
| Узнать текущее техническое состояние и риски | [CURRENT_STATE.md](CURRENT_STATE.md) |
| Найти исходник или убедиться в охвате сканирования | [SOURCE_INVENTORY.md](SOURCE_INVENTORY.md) |

## Правило актуальности

Исходный код, `package.json`, тесты и фактические ассеты имеют приоритет над этой документацией. Если обнаружено расхождение, исправь документацию вместе с кодом. Не добавляй в память предположения как установленные факты: помечай их как «требует проверки».

После существенного изменения обновляй:

- профильный документ;
- [CURRENT_STATE.md](CURRENT_STATE.md), если изменился риск, ограничение или baseline;
- дату снимка только после нового полного аудита, а не после локального изменения одного файла.
