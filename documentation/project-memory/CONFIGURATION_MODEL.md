# Формат конфигурации и декларативная схема

## Корневой JSON

```json
{
  "screens": [
    {
      "page": 1,
      "blocks": [
        {
          "block": 1,
          "type": "light",
          "data": {
            "variant": {
              "OnOff_command_topic": "home/light/set"
            },
            "variant_type": "light_variant_OnOff"
          }
        }
      ]
    }
  ]
}
```

Типы описаны в `src/global/types`, но `BlockData` остаётся открытым `[key: string]: any`. Строгая фактическая схема задаётся картами `src/data/settings/param-options/`.

Нумерация `page` и `block` начинается с 1 и нормализуется после операций со структурой. Ограничения UI: до 100 страниц, до 6 блоков на страницу.

## Пути и владение полями

- Base field → `data/<field>`.
- Variant field → `data/variant/<field>`.
- `variant_type` → `data.variant_type`.
- `PATH_MAP` и `Block.resolvePath()` используются при чтении/записи модели.
- `ParamOption.savePath` может переопределить путь. Текущие overrides относятся к `lameli` и совпадают с `data/variant`.

`getAllParams()` объединяет base map и variant map. Если ключ совпадёт, позднее variant-значение Map заменит base-поле; добавление дублирующихся имён требует отдельной проверки маршрутизации.

Enum определяет допустимые IDs, `DEVICE_VARIANT_MAP` — membership, а `DEVICE_ORDER`/`VARIANT_ORDER` — порядок select. Для light порядок membership-map (`OnOff`, color, dimmer, temperature) отличается от отображаемого (`OnOff`, dimmer, color, temperature); UI следует именно `VARIANT_ORDER`.

## Семантика ParamOption

| Свойство | Смысл |
| --- | --- |
| `fieldType` | класс UI и типовой дефолт |
| `required: true` | значение должно быть непустым в текущем UI-state |
| `optional: true` | ключ может отсутствовать в загруженном и сохранённом JSON |
| `fieldOptions` | допустимые значения для select |
| `fieldSettings` | ограничения HTML и декларативные dependencies |
| `feature` / `featurePanelSettings` | схема и число вложенных вкладок |
| `lameliType` | вложенная схема ламелей |
| `savePath` | путь в модели |
| `order` | приоритет ключа при сериализации |

Без `required` поле можно оставить пустым в форме. Без `optional` его ключ всё равно ожидается при загрузке и создаётся при выгрузке.

## Дефолты и optional

`getDefaultValueForField()` возвращает:

| Field type | Default |
| --- | --- |
| `number` | `0` |
| `boolean` | `false` |
| `feature`, `lameli` | `null` |
| `settings` | `[]` |
| остальные | `""` |

При сериализации optional scalar с `""`, `null` или `undefined` пропускается. Optional `lameli` — специальное исключение: выключенное значение сериализуется как `"lameli": null`. Пустые `{}` и `[]` не считаются отсутствием автоматически.

Поля сортируются по `order`, затем стабильным порядком Map. Сейчас `order` нигде не задан, поэтому фактический порядок — порядок деклараций. `variant` добавляется после base-полей, затем `variant_type`.

## Типы полей

Поддержаны `text`, `number`, `boolean`, `color`, `color_type`, `options`, `feature`, `icon`, `lameli`, `settings`. Constructor map покрывает все объявленные типы; `feature` создаётся специальной factory-веткой.

- Colors ограничены 13 enum-значениями `color_red`…`color_white`.
- Color formats: `rgb`, `hex`, `hsv`, `hsl`.
- Required `OptionField` и `ColorFormatField` не добавляют пустой option, поэтому при пустом initial value браузер выбирает первое значение.
- `IconField` сохраняет Unicode glyph, а не MDI name.
- `BaseField.validate()` проверяет presence; строгие типы загруженных значений и domain rules находятся в других слоях.

## Базовые поля

Обозначения: **R** — `required`; **O** — `optional`; **D** — required меняется dependency. Поле без отметки можно оставить пустым, но его ключ не optional.

| Device | Поля |
| --- | --- |
| `scene` | `param_1`, `param_2`, `param_3`; `icon` R; `command_topic` R; `payload` R |
| `sensor` | `param_1`, `measure`; `min`, `stage_1`, `stage_2`, `max` R; `color_1..3` R; `state_topic` R |
| `light` | `param_1`, `param_2`; `setting_name`, `icon` R |
| `cover` | `param_1`, `param_2`; `setting_name`, `icon_open`, `icon_close` R |
| `climate` | `param_1`, `param_2`, `measure`; `setting_name`, `icon`, `color` R |
| `switch` | `param_1`, `param_2`; `icon`, `color`, `OnOff_command_topic`, `OnOff_state_topic`, `payload_on`, `payload_off` R |
| `device` | `param_1`, `param_2`, `param_3`, `state_topic` O; `setting_name`, `icon`, `color`, `settings` R |
| `music` | `param_1..3`; `icon`, `setting_name`, mute topics/payloads, artist/name topics R; `channels` O; `prev/play/next_command_topic` R; `PlayPause_state_topic`; `pause_command_topic` D; `payload_prev/play/next` R; `payload_pause` D; volume topics/step/min/max R |

В `music` непустой `PlayPause_state_topic` динамически делает `pause_command_topic` и `payload_pause` обязательными. Эти два ключа остаются неoptional даже когда runtime-required выключен.

## Поля вариантов

| Variant | Поля |
| --- | --- |
| `light_variant_OnOff` | `OnOff_command_topic`, `OnOff_state_topic`, `payload_on`, `payload_off` R |
| `light_variant_dimmer` | поля OnOff + `brightness_command_topic`, `brightness_state_topic`, `brightness_scale` R |
| `light_variant_color` | поля dimmer + `color_command_topic`, `color_type` R |
| `light_variant_temperature` | поля dimmer + `temp_command_topic`, `temp_state_topic`, `max_temp`, `min_temp` R; `temp_measure` |
| `cover_variant_slider` | `orientation` R; open/close topics R; stop topic; open/close payloads R; stop payload; position command/state/open/close/help-open/help-close R; `lameli` O |
| `cover_variant_buttons` | `orientation` R; open/close topics R; stop topic; open/close payloads R; stop payload; `lameli` O |
| `climate_variant_cond` | OnOff R; `modes` R; mode/current/target topics R; min/max target R; fan topics R; `fan_modes` O |
| `climate_variant_cond_extended` | OnOff R; mode/current/target topics R; `modes` R; integer min/max target R; fan topics O; `fan_modes` O; `settings` R |
| `climate_variant_thermostat` | OnOff R; target topics и min/max target R; `sensors` O |

`orientation` допускает только `Horizontal` и `Vertical`. Оба текущих cover-варианта задают `lameliType: 'buttons'`; декларативная `slider`-схема ламелей сейчас ни к одному полю не подключена.

## Feature-объекты

| Feature | Внутренние поля | Count / keys |
| --- | --- | --- |
| `modes` | `title`, `color`, `icon`, `payload` R | 2–5, `mode_1...` |
| `fan_mode` | `icon`, `payload` R | 0 или 2–5, `mode_1...` |
| `fan_mode_extended` | `title`, `payload` R | 0 или ≥2, `mode_1...` |
| `sensors` | `icon`, `state_topic` R; `measure` | 0–3, `sensor_1...` |
| `channels` | `icon`, `title`, `command_topic`, `state_topic`, `payload` R | 0–5, ключи `"1"...` |

Входные feature-ключи сортируются лексикографически, затем записи становятся вкладками. Имена входных ключей не сохраняются: при выгрузке генерируется последовательный набор ключей через `buildOrderedFeatureKeys()`, тоже в лексикографическом порядке. Поэтому `mode_10` расположен раньше `mode_2`, как ожидает прошивка.

Неизвестные nested-ключи отбрасываются. Primitive/array вместо record превращается в пустую вкладку. Полностью пустая вкладка не сериализуется; отсутствие записей даёт `null`.

Required feature нового блока создаёт `minCount` вкладок. Если required feature отсутствовал в загруженном JSON, автосоздание не выполняется, чтобы missing/error оставался видимым. Optional feature с `minCount > 0` допускает либо 0, либо минимум `minCount` вкладок.

## Lameli

- `slider` registry: open/close topics и payloads, position command/state/open/close — все required.
- `buttons` registry: open/close topics и payloads required; stop topic/payload допускают пустое значение.
- Выключенная панель имеет `null`; включённая — объект.
- Верхний уровень загруженного значения проверяется только как non-array object; строгой type-проверки каждого nested-value при load нет.

## Settings

`settings` — непустой упорядоченный массив heterogeneous records:

| Type | Поля |
| --- | --- |
| `pushbutton` | `title`, `command_topic`, `payload` |
| `switch` | `title`, `state_topic`, `command_topic`, `payload_on`, `payload_off` |
| `text` | `title`, `state_topic`, `command_topic` |
| `text_read_only` | `title`, `state_topic` |
| `enum` | `title`, `state_topic`, `command_topic`, `options` |
| `range` | `title`, `state_topic`, `command_topic`, `min`, `max`, `step`, optional `measure` |

Все поля таблицы, кроме `measure`, обязательны. `enum.options` содержит минимум два `{title,payload}`. Смена setting type сохраняет только `title`; для enum создаются два пустых варианта. Неизвестные ключи settings отбрасываются при сериализации.

Required settings нового блока создаёт один пустой item. При загрузке отсутствующего required settings editor не скрывает проблему автосозданием заполнителя: остаётся явная ошибка.

## Загрузка

`ConfigManager/config-validations.ts` проверяет форму `screens/page/blocks/type/data` и что `variant`, если truthy, является object. Затем `BlockManager.loadBlockToPage()`:

- принимает только известный и допустимый для device `variant_type`;
- для каждого известного поля читает его путь;
- при `undefined` создаёт default, а для неoptional добавляет missing warning;
- при недопустимом типе/enum сбрасывает default и добавляет invalid warning;
- сохраняет корректную часть блока и строит поля;
- игнорирует неизвестные ключи без warning — после сохранения они исчезнут.

`null` load-validator считает допустимым отсутствующим значением для всех field types; последующая UI/nested validation решает, является ли поле ошибкой. Пустая строка допустима для scalar, но не для `feature`, `lameli` и `settings`.

## Сериализация

Живое значение сначала находится в field instance, а `Block.data` может отставать. `writeFieldsToData()` переносит все текущие значения без требования валидности. `Block.toJSON()` читает значения модели, маршрутизирует поля и применяет optional/default rules.

`Page.toJSON()` имеет side effects: валидирует каждый блок, вызывает `save()` и полностью исключает невалидные блоки. `ConfigManager.toJSON()` после этого исключает страницы без сериализованных блоков. Поэтому preview полного проекта тоже не показывает невалидные блоки; основной save-gate обязан обнаружить ошибки до записи.
