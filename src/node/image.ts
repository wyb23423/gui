/**
 * 图片节点
 */
import { Canvas2DElement } from "./element";
import { isImg } from "../tool/util";

export class Canvas2DImage extends Canvas2DElement {
    readonly type: string = 'image';

    constructor(id: string | number) {
        super(id, false);

        this.style.width = this.style.height = 0; // 清除默认宽高设置
    }

    async build(ctx: CanvasRenderingContext2D){
        ctx.drawImage(await this.style.loadImg(), 0, 0, this.width, this.height);
    }

    async update(){
        const style = this.style;
        if(!isImg(style.src)) {
            return console.warn(`${style.src}不是有效的图片路径`);
        }

        // 图片尺寸默认为其原尺寸
        let img: HTMLImageElement;
        if(!style.width) {
            img = await style.loadImg();
            style.width = img.width;
        }
        if(!style.height) {
            img = img || await style.loadImg();
            style.height = img.height;
        }

        style.border = 0; // 图片没有边框，如果需要有，可使用Container的背景图
        this.isStatic = false; // 图片本就有缓存，不需要再次缓存

        super.update();
    }
}