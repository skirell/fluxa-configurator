# Skirell Fluxa Configurator — agent entry point

Постоянная база знаний проекта находится в [`documentation/project-memory/`](documentation/project-memory/README.md).

Перед любой задачей:

1. Полностью прочитай [`AI_INSTRUCTIONS.md`](documentation/project-memory/AI_INSTRUCTIONS.md).
2. По таблице маршрутизации в [`README.md`](documentation/project-memory/README.md) выбери относящиеся к задаче документы.
3. Перед изменением перепроверь затрагиваемые исходники: документация помогает найти их, но код и тесты остаются источником истины.

Критические правила:

- не редактируй вручную генерируемые `out/` и `dist/`;
- сохраняй различие между `required` и `optional` в `ParamOption`;
- не меняй лексикографический порядок feature-ключей: он совместим с прошивкой панели;
- изменения JSON-формата проверяй загрузкой, сериализацией и round-trip;
- минимум проверки после изменения кода — `npm test`;
- если меняется архитектура, формат, workflow, команда, внешний ресурс или важный инвариант, обнови соответствующий документ в `documentation/project-memory/` в той же задаче.
