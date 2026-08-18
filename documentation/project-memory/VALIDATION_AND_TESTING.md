# Валидация и тестирование

## Уровни валидации

| Уровень | Источник | Ответственность |
| --- | --- | --- |
| Full config structure | `ConfigManager/config-validations.ts` | object/screens/page/blocks/type/data/variant |
| Loaded scalar value | `utils/field-value-validation.ts` | field type и enum membership |
| Required field | `BaseField.validate()` | presence текущего runtime-значения |
| Nested feature | `feature-validation.ts`, `FeaturePanelField`, `Tab` | count, inner required/type/enum |
| Nested settings | `settings-validation.ts`, `SettingsPanelField` | item schema и specialized rules |
| Nested lameli | `LameliPanelField` | required inner fields |
| Cross-field | `data/settings/block-rules.ts` | связи нескольких полей блока |
| Save gate / UX | `AppController.collectConfigIssues()` | сводный список errors/warnings |

Не заменяй один уровень другим. Например, load-validator определяет, можно ли перенести raw value в UI, но не решает required-пустоту.

## Кросс-полевые правила

- `switch`, все light variants и все climate variants: непустые `payload_on` и `payload_off` не должны совпадать.
- `sensor`: `min <= stage_1 <= stage_2 <= max`. Внешняя legacy-документация в `documentation.ts` говорит о строгом `<`, но код допускает равенство.
- dimmer/color/temperature: `brightness_scale > 0`.
- light temperature: `max_temp > min_temp`.
- climate variants: `max_target > min_target`.
- extended climate: min/max target — целые; непустой `fan_modes` требует оба fan-topic.
- music: `volume_step > 0`, `volume_max > volume_min`.
- cover slider: четыре пары основных/вспомогательных open/close positions не должны совпадать согласно `block-rules.ts`.

Settings дополнительно проверяет:

- непустой массив;
- допустимый type и обязательные поля;
- разные switch payloads;
- минимум два полностью заполненных enum options;
- range finite, в `[-1_000_000, 1_000_000]`, до 3 знаков, `max > min`, `step > 0`, до 10 000 шагов.

Обычные number inputs получают HTML `min=0` и `max=999999999999999`, но `BaseField.validate()` не вызывает native `checkValidity()`. Не считай эти атрибуты строгой domain-validation для загрузки/сериализации.

## Errors и warnings

- Errors блокируют full-config save.
- Warnings отражают восстановимые проблемы загрузки и не блокируют save.
- Missing warning скрывается, если то же поле уже представлено required error.
- После успешной записи warnings из `loadIssues` очищаются.
- Неизвестные JSON keys сейчас игнорируются без warning.

Runtime-required может отличаться от `option.required` из-за `DependencyManager`; любые изменения dependency обязательно проверяй именно через save gate, а не только `Block.validate()`.

## Автоматические тесты

Единственный suite: `tests/settings-validation.test.js`. Он импортирует compiled CommonJS из `out/`, поэтому команда сначала запускает TypeScript compiler.

Текущие 9 тестов покрывают:

1. все 6 settings types;
2. required/nonempty settings;
3. различие switch payloads;
4. enum options;
5. range bounds, precision, positive step и step-count;
6. registries нового `device` и extended climate;
7. lexical feature order и nested type checks;
8. settings serialization в base/variant и пропуск optional fan topic;
9. conditional fan-topic rules.

Команда:

```bash
npm test
```

Она выполняет `npm run convert:ts`, затем `node --test tests/*.test.js`.

## Пробелы тестирования

Автоматически не покрыты:

- full-config structural validation и filesystem/IPC paths;
- load/edit/save/reload round-trip;
- все device/variant combinations и их defaults;
- Page/Block limits и reindex;
- dependency/dirty-state/save-gate regressions;
- sidebar drag/drop/copy/JSON modal;
- docs/errors panel, theme, icon picker;
- Electron start и packaged artifacts.

## Ручной regression checklist

Для изменения схемы:

1. новый пустой блок;
2. заполненный валидный блок;
3. missing nonoptional key;
4. missing optional key;
5. неверный scalar/nested type;
6. unknown key;
7. смена device и variant без потери base values;
8. preview/save/reload;
9. copy block/page и JSON replace/paste;
10. клик каждой error/warning.

Для UI:

1. new/load/clear и dirty confirmations;
2. add/delete/reorder/move до лимитов;
3. feature/lameli/settings add/save/delete/reorder;
4. docs open/anchor/offline retry;
5. errors current/all и scroll preservation;
6. dark/light и collapse/resize panels.

## Baseline аудита

После добавления прямой зависимости `typescript@6.0.3` команды `npm run convert` и `npm test` прошли: выполнены все 9 тестов единственного suite. Electron startup smoke-test также прошёл; packaging по-прежнему не проверялся.
