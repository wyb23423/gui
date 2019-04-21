/// <reference lib="es2017.object" />

/**
 * 样式
 */
import { isImg, makeCheckExist } from "../tool/util";

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

export interface Istyle {
    background?: string | CanvasGradient;
    color?: string | CanvasGradient;
    clip?: boolean;

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

    left?: number;
    right?: number;
    top?: number;
    bottom?: number;

    origin?: number | number[];
    originX?: number;
    originY?: number;
}

export const isTransformKey = makeCheckExist(
    'rotation left top bottom right ' +
    'scale scaleX scaleY width height ' +
    'origin originX originY'
)

export class Style {
    background?: string | CanvasGradient;
    color?: string | CanvasGradient;

    border?: number;
    borderColor: string = '#000';
    borderRadius?: number[];
    borderStyle: number[] = [];

    opacity: number = 1;

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

    set(key: string | Istyle, value: any){
        if(typeof key === 'string'){
            this.attr([key, value]);

            return isTransformKey(key);
        } else {
            return Object.entries(key).map(this.attr, this).includes(true);
        }
    }

    build(ctx: CanvasRenderingContext2D, width: number, height: number){
        if(this.border){
            ctx.setLineDash(this.borderStyle);
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = this.border;
        }
        ctx.globalAlpha *= this.opacity;

        return new Promise(resolve => {
            if(isImg(this.background)){
                const img = new Image();
                img.src = <string>this.background;
                img.onload = () => {
                    const pattern = ctx.createPattern(img, 'no-repeat');
                    pattern.setTransform({
                        a: width / img.width, d: height / img.height,
                        b: 0, c: 0, e: 0, f: 0
                    });
                    ctx.fillStyle = pattern;

                    img.src = '';
                    resolve();
                }
            } else {
                if(this.background) {
                    ctx.fillStyle = this.background;
                }

                resolve();
            }
        })
    }

    /**
     * 设置继承样式
     */
    inherit(ctx: CanvasRenderingContext2D, width: number, height: number){
        ctx.globalAlpha *= this.opacity;
        if(this.clip){
            if(this.border){
                ctx.beginPath();
                ctx.rect(this.border / 2, this.border / 2, width - this.border, height - this.border);
                ctx.closePath();
            }

            ctx.clip();
        }
    }

    private attr([key, value]: [string, any]){
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
            default: Reflect.set(this, key, value);
        }

        return isTransformKey(key);
    }
}