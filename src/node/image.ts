/**
 * 图片节点
 */
import { Canvas2DElement } from "./element";
import { Istyle } from "../core/style";
import { parseSize } from "../core/dom";
import { isZero } from "../tool/util";

export class Canvas2DImage extends Canvas2DElement {
    readonly type: string = 'image';

    private _cellId: number = -1;
    private _cellWidth?: number | string;
    private _cellHeight?: number | string;

    constructor(id: string | number) {
        super(id, false);

        this.style.width = this.style.height = 0; // 清除默认宽高设置
    }

    attr(key: string | Istyle, value?: any) {
        if(typeof key === 'string') {
            key = {[key]: value};
        }
        this._setCell(key);
        const modyfySrc = Reflect.has(key, 'src') && key.src !== this.style.src;

        super.attr(key, value);
        if(modyfySrc && !(this.style.width && this.style.height)) {
            this.rect = null;
        }

        return this;
    }

    async build(ctx: CanvasRenderingContext2D) {
        await this.style.build(ctx, this.width, this.height);

        const img = await this.style.loadImg();
        const sw: number = Math.min(parseSize(this._cellWidth, img.width), img.width),
              sh: number = Math.min(parseSize(this._cellHeight, img.height), img.height);

        if(this._cellId >= 0 && sw > 0 && sh > 0) { // 精灵图
            const cw: number = (this._cellId + 1) * sw;
            let sx: number = (cw % img.width) - sw,
                sy: number = Math.floor(cw / img.width) * sh;
            if(isZero(cw % img.width)) {
                sx = img.width - sw;
                sy -= sh;
            }
            sx = Math.max(Math.min(sx, img.width - sw), 0);
            sy = Math.max(Math.min(sy, img.height - sh), 0);

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, this.width, this.height);
        } else { // 整图
            ctx.drawImage(img, 0, 0, this.width, this.height);
        }
    }

    async update(){
        this.style.background = '';
        this.style.border = 0; // 图片没有边框，如果需要有，可使用Container的背景图
        this.isStatic = false; // 图片本就有缓存，不需要再次缓存

        return super.update();
    }

    async calcSize() {
        await super.calcSize();

        // 图片尺寸默认为其原尺寸
        let img: HTMLImageElement;
        if(this.width <= 0) {
            img = await this.style.loadImg();
            this.width = img.width;
        }
        if(this.height <= 0) {
            img = img || await this.style.loadImg();
            this.height = img.height;
        }
    }

    private _setCell(data: Istyle) {
        ['cellId', 'cellWidth', 'cellHeight'].forEach(k => {
            if(Reflect.has(data, k)) {
                Reflect.set(this, `_${k}`, Reflect.get(data, k));
                Reflect.deleteProperty(data, k);
            }
        });
    }
}