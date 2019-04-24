
type TextAlign = 'center' | 'left' | 'right';
type VerticalAlign = 'top' | 'middle' | 'bottom';
type FontStyle = 'normal' | 'italic' | 'oblique';
type FontVariant = 'normal' | 'small-caps';
type TextWarp = 'no-warp' | 'warp' | 'ellipsis';

type FontWeight = 'normal' | 'bold' | 'bolder' | 'lighter'
                    | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
                    | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';


interface TextStyle {
    color?: string | CanvasGradient;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;

    strokeColor?: string | CanvasGradient;
    strokeWidth?: number;
    lineHeight?: number;
    letterSpacing?: number;

    textWarp?: TextWarp;

    fontStyle?: FontStyle;
    fontVariant?: FontVariant;
    fontWeight?: FontWeight;
    fontSize?: number | string;
    fontFamily?: string;

    text?: string;

    indent?: number; // 首行缩进, 单位px
}

interface TextMap {
    char: string;
    x: number;
    y: number;
    width: number;
    height: number;
}