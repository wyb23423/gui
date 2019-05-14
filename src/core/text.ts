/**
 * 文本相关
 */
import { cached } from "../tool/util";
import { getContext } from "./dom";

export const getWidth = cached((text: string, font: string) => {
    return text.split('\n').reduce((a, b) => Math.max(a, measureText(b, font)), 0);
}, 5000);

export function getLineHeight(font: string){
    return getWidth('国', font);
}

const measureText = cached((text: string, font: string) => {
    const ctx = getContext(null);
    if(font && ctx.font !== font) {
        ctx.font = font;
    }

    return ctx.measureText(text).width;
})