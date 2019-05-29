/// <reference lib="es2017.object" />

/**
 * 样式
 */
import { isImg, makeCheckExist } from "../tool/util";
import { getImg, disposeImg } from "./resource";
import { parseColor, stringify, isEqual } from "../tool/color";
import { devicePixelRatio } from '../config';

/**
 * 将数据解析为有4个元素的数组
 */
function parseNumArr(data: number | number[]){
    const res = new Array(4).fill(0);
    if(Array.isArray(data)){
        switch(data.length){
            case 1: res[0] = res[1] = data[0];
            case 2: res[2] = res[0];
            case 3:
                res[3] = res[1];
                break;
            default: Object.assign(res, data);
        }
    } else if(typeof data === 'number'){
        res.fill(data)
    }

    return res;
}

const isTransformKey = makeCheckExist(
    'rotation left top bottom right' + ' ' +
    'scale scaleX scaleY width height' + ' ' +
    'origin originX originY'
)

// ====================================================
export interface Istyle {
    background?: string | CanvasGradient;
    color?: string | CanvasGradient;
    clip?: boolean;

    src?: string;

    border?: number;
    borderColor?: string | CanvasGradient;
    borderRadius?: number | number[];
    borderStyle?: number[];

    opacity?: number;

    width?: number | string;
    height?: number | string;

    rotation?: number;

    scaleX?: number;
    scaleY?: number;
    scale?: number | number[];

    left?: number | string;
    right?: number | string;
    top?: number | string;
    bottom?: number | string;

    origin?: number | number[];
    originX?: number;
    originY?: number;

    cellId?: number;
    cellWidth?: number | string;
    cellHeight?: number | string;
}

export class Style {
    background?: string | CanvasGradient;
    color: string | CanvasGradient = 'rgba(0, 0, 0, 1)';

    src?: string; // 图片路径

    border: number = 0;
    borderColor: string | CanvasGradient = 'rgba(0, 0, 0, 1)';
    borderRadius?: number[];
    borderStyle: number[] = [];

    opacity: number = 1; // bug已解决

    width: number | string = '100%';
    height: number | string = '100%';

    rotation: number = 0;

    scale: number[] = [1, 1];

    left?: number | string;
    right?: number | string;
    top?: number | string;
    bottom?: number | string;

    zIndex: number = 0;

    clip: boolean = false;

    origin: number[] = [0.5, 0.5];

    private _res: Set<string> = new Set(); // 节点已加载过的图片资源

    set(key: string | Istyle, value: any){
        if(typeof key === 'string'){
            return this.attr([key, value]);
        } else {
            return Object.entries(key).map(this.attr, this).includes(true);
        }
    }

    /**
     * 根据样式设置绘制状态
     * @param width 节点的宽
     * @param height 节点的高
     */
    async build(ctx: CanvasRenderingContext2D, width: number, height: number){
        if(this.border){
            ctx.setLineDash(this.borderStyle);
            if(!isEqual(ctx.strokeStyle, this.borderColor)) {
                ctx.strokeStyle = this.borderColor;
            }
            if(ctx.lineWidth !== this.border) {
                ctx.lineWidth = this.border;
            }
        }

        if(this.background) {
            if(isImg(this.background)) {
                const path = <string>this.background;
                const img = await this.loadImg(path);

                const pattern = ctx.createPattern(img, 'no-repeat');
                pattern.setTransform({
                    a: width / img.width, d: height / img.height,
                    b: 0, c: 0, e: 0, f: 0
                });
                ctx.fillStyle = pattern;
            } else {
                if(!isEqual(ctx.fillStyle, this.background)) {
                    ctx.fillStyle = this.background;
                }
            }
        }
    }

    /**
     * 设置全局透明度
     */
    setAlpha(ctx: CanvasRenderingContext2D){
        const alpha = Math.max(0, Math.min(1, this.opacity));
        if(ctx.globalAlpha !== alpha) {
            ctx.globalAlpha = alpha;
        }
    }

    dispose(){
        this._res.forEach(disposeImg);
        this._res.clear();
    }

    /**
     * 判断新值与旧值是否相等
     */
    equal(key: string, value: any){
        let old = Reflect.get(this, key);
        if(old == null) {
            old = Reflect.get(this, key.substr(0, key.length - 1));
        }

        if(key === 'border') {
            value *= devicePixelRatio;
        }

        if(Array.isArray(old)) {
            if(Array.isArray(value)) {
                if(key === 'borderStyle' && old.length !== value.length) {
                    return false;
                }

                return old.every((v, i) => v === value[i]);
            }

            if(key.endsWith('X')) {
                return old[0] === value;
            }

            if(key.endsWith('Y')){
                return old[1] === value;
            }

            return old.every(v => v === value);
        }

        return old === value;
    }

    /**
     * 获取Image
     * @param src 图片路径
     */
    loadImg(src:string = this.src) {
        if(!isImg(src)) {
            console.warn(`${src}不是有效的图片路径`);

            return Promise.resolve(new Image());
        }

        const isFirst = !this._res.has(src);
        this._res.add(src);

        return getImg(src, isFirst);
    }

    private attr([key, value]: [string, any]){
        let isModifyTransform = isTransformKey(key);
        if(isModifyTransform) {
            isModifyTransform = isModifyTransform && !this.equal(key, value);
        }

        if((key === 'src' || key === 'background') && typeof value === 'string' && !isImg(value)) {
            value = stringify(parseColor(value), 'rgba');
        }

        switch(key){
            case 'borderRadius':
                this[key] = parseNumArr(value);
                break;
            case 'scale': case 'origin':
                this[key] = Array.isArray(value) ? value : [value, value];
                break;
            case 'scaleX': case 'originX': case 'scaleY': case 'originY':
                const k = <'scale' | 'origin'>key.substr(0, key.length - 1);
                this[k][key.endsWith('X') ? 0 : 1] = value;
                break;
            case 'border':
                value *= devicePixelRatio;
            default:
                Reflect.set(this, key, value);
        }

        return isModifyTransform;
    }
}