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

    constructor(id: string | number, isStatic?: boolean) {
        super(id, isStatic);

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
            this.needUpdate = true;
        }

        return this;
    }

    async build(ctx: CanvasRenderingContext2D) {
        const img = await this.style.loadImg();
        if(img) {
            const sw: number = Math.min(parseSize(this._cellWidth, img.width), img.width),
                sh: number = Math.min(parseSize(this._cellHeight, img.height), img.height);

            if(this._cellId >= 0 && sw > 0 && sh > 0) { // 精灵图
                const cw: number = Math.floor(this._cellId + 1) * sw;
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
    }

    update(){
        this.style.background = '';
        this.style.border = 0; // 图片没有边框，如果需要有，可使用Container的背景图

        return super.update();
    }

    async calcSize() {
        super.calcSize();

        // 图片尺寸默认为其原尺寸等比缩放
        if(this.width <= 0 || this.height <= 0) {
            const img = await this.style.loadImg();

            if(img) {
                if(this.width <= 0 && this.height <= 0) {
                    this.width = img.width;
                    this.height = img.height;
                } else if(this.width <= 0) {
                    this.width = this.height * img.width / img.height;
                } else if(this.height <= 0) {
                    this.height = this.width * img.height / img.width;
                }
            }
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