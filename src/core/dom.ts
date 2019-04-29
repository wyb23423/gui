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
            return (parseFloat(size) || 0) * devicePixelRatio;
        }
    }

    return (size || 0) * devicePixelRatio;
}

/**
 * 获取鼠标相对于canvas的位置
 */
export function getPosition(el: HTMLElement, e: any) {
    if(e.offsetX != null && e.offsetY != null) {
        return {x: e.offsetX, y: e.offsetY};
    }

    if(el.getBoundingClientRect) {
        const rect = el.getBoundingClientRect();
        let clientX = e.clientX, clientY = e.clientY;
        if(e.touches) {
            if(!e.touches.length) {
                return {x: 0, y: 0};
            }
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    return {x: 0, y: 0};
}

export function addHandler(element: any, type: string, handler: Function) {
    if(element.addEventListener){
        element.addEventListener(type, handler, false);
    }else if(element.attachEvent){
        element.attachEvent('on' + type, handler);
    }else{
        element['on' + type] = handler;
    }
}

export function removeHandler(element: any, type: string, handler: Function){
    if(element.removeEventListener){
        element.removeEventListener(type, handler, false);
    }else if(element.detachEvent){
        element.detachEvent('on' + type, handler);
    }else{
        element['on' + type] = null;
    }
}