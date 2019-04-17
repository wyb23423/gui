interface IMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}

interface Canvas2DNode {
    type: 'div' | 'path' | 'img' | 'span' | 'link',
    id: string | number;
    text?: string;
    src?: string; // 资源地址
    href?: string; // 链接地址
    isVisible?: boolean; // 是否渲染
    transform?: number[][] | IMatrix; // 变换矩阵
    animation?: Animation[]; // 动画
    isStatic?: boolean; // 静态节点只有变换及isVisible的变化有效, 其余属性变化无效(包括子节点的变换及isVisible的变化也会无效)
    style?: IStyle;
    children?: Canvas2DNode[];
}

interface IStyle {
    background?: string | CanvasGradient; // 背景色或背景图(居中, 拉伸充满)
    color?: string;

    fontSize?: number;
    fontFamliy?: string;
    fontWeight?: number | string;
    textWarp?: 'warp' | 'clip' | 'ellipsis';
    stroke?: string;

    width?: number | string;
    height?: number | string;

    overflow?: 'hidden' | 'auto' | 'scroll';
    overflowX?: 'hidden' | 'auto' | 'scroll';
    overflowY?: 'hidden' | 'auto' | 'scroll';
    
    align?: 'center' | 'left' | 'right';
    verticalAlign?: 'center' | 'top' | 'bottom';

    position?: 'fixed' | 'relative' | 'absolute';
    left?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;

    rotation?: number;

    scale?: number | number[];
    scaleX?: number;
    scaleY?: number;

    origin?: (number | string)[] | number | string; // 变换中心

    border?: number;
    borderColor?: string;
    borderRadius?: number | number[];
    borderStyle?: number[];

    opctity?: number;

    padding?: number | number[];
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;

    margin?: number | number[];
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
}

interface AnimationFrame extends IStyle {
    key: number;
}
interface Animation {
    time: number;
    frames: AnimationFrame[];

    delay?: number;
    count?: number; // Infinity 无限
    direction?: boolean;
    easing?: string;
    endCall?: Function; // 动画执行完毕的回调
}

interface ILayer {
    z: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    dirty: boolean;

    roots: ICanvas2DElement[];
}

interface ICanvas2DElement extends Canvas2DNode {
    dirty: boolean;
    children?: ICanvas2DElement[];
    parent?: ICanvas2DElement;
    layer?: ILayer;
    dispose(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    removeChild?(child: Canvas2DNode): Canvas2DNode
}