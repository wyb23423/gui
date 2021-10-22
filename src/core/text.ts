/**
 * 文本相关
 */
import { cached } from '../tool/util';

const measureText = cached((ctx: CanvasRenderingContext2D, text: string, font: string) => {
  try {
    if (!ctx) {
      return 0;
    }

    if (font && ctx.font !== font) {
      ctx.font = font;
    }

    return ctx.measureText(text).width;
  } catch (e) {
    //
  }

  return 0;
});

export const getWidth = cached((ctx: CanvasRenderingContext2D, text: string, font: string) => {
  return text.split('\n').reduce((a, b) => Math.max(a, measureText(ctx, b, font)), 0);
}, 5000);

export function getLineHeight(ctx: CanvasRenderingContext2D, font: string) {
  return getWidth(ctx, '国', font);
}
