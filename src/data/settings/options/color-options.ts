import { ColorOption } from '../../../global/types/option';
import { Color } from '../../enums/color';

export const COLOR_OPTIONS = new Map<Color, ColorOption>([
    [
        Color.color_red,
        {
            label: 'Красный',
            color: '#FF4D4D',
        },
    ],
    [
        Color.color_pink,
        {
            label: 'Розовый',
            color: '#FF3D5E',
        },
    ],
    [
        Color.color_orange,
        {
            label: 'Оранжевый',
            color: '#FF974D',
        },
    ],
    [
        Color.color_yellow,
        {
            label: 'Жёлтый',
            color: '#FFE14D',
        },
    ],
    [
        Color.color_mint,
        {
            label: 'Мятный',
            color: '#4DFFA6',
        },
    ],
    [
        Color.color_green,
        {
            label: 'Зелёный',
            color: '#4DFF5B',
        },
    ],
    [
        Color.color_cyan,
        {
            label: 'Циановый',
            color: '#4DFFF0',
        },
    ],
    [
        Color.color_blue,
        {
            label: 'Голубой',
            color: '#4DC3FF',
        },
    ],
    [
        Color.color_dark_blue,
        {
            label: 'Синий',
            color: '#3D6EFF',
        },
    ],
    [
        Color.color_indigo,
        {
            label: 'Индиго',
            color: '#5D3DFF',
        },
    ],
    [
        Color.color_purple,
        {
            label: 'Фиолетовый',
            color: '#AE3DFF',
        },
    ],
    [
        Color.color_brown,
        {
            label: 'Коричневый',
            color: '#B34A00',
        },
    ],
    [
        Color.color_white,
        {
            label: 'Белый',
            color: '#FFFFFF',
        },
    ],
]) as ReadonlyMap<Color, ColorOption>;