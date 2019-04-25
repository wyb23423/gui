import { cached } from "../tool/util";

/**
 * dom操作
 */

let id: number = 0;
function createId(){
    return id++;
}

/**
 * 创建canvas
 * @param w
 * @param h
 */
export function createCanvas(w: number, h: number, id?: string){
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${w}px`,
        height: `${h}px`
    })

    canvas.setAttribute('data-dom-id', id || `canvas-${createId()}`);
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;

    return canvas;
}

export const getContext = cached(() => {
    return document.createElement('canvas').getContext('2d');
})

// 画一个圆弧
export function ellipse(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    rx: number, ry: number,
    startAngle: number, endAngle: number,
    rotation: number,
    anticlockwise: number,
){
    if(Math.abs(rx - ry) > Number.EPSILON * 2 ** 10){ // 椭圆
        ctx.save();

        const scaleX = rx > ry ? 1 : rx / ry;
        const scaleY = rx > ry ? ry / rx : 1;

        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.scale(scaleX, scaleY);
        ctx.arc(0, 0, Math.max(rx, ry), startAngle, endAngle, !anticlockwise);

        ctx.restore();
    } else {
        ctx.arc(cx, cy, rx, startAngle, endAngle, !anticlockwise);
    }
}

/**
 * 解析css尺寸
 * @param size 尺寸设置
 * @param base 百分比相对值
 */
export function parseSize(size: number | string, base: number): number {
    if(typeof size === 'string'){
        if(size.endsWith('%')){
            return base * (parseFloat(size) || 0) / 100;
        } else {
            return parseFloat(size) || 0;
        }
    }

    return <number>size;
}
