/**
 * 文本
 * 解析文本性能消耗较大，大段文本尽可能使用静态文本
 */
/// <reference path="./text.d.ts" />

import { Canvas2DElement } from "./element";
import { makeCheckExist } from "../tool/util";
import { getLineHeight, getWidth } from "../core/text";

// ==================================================

const isFontStyle = makeCheckExist('fontStyle fontVariant fontWeight fontSize fontFamily');
const canModifyTextMap = makeCheckExist('lineHeight letterSpacing textWarp indent strokeWidth text');

// ============================================
export class TextBlock extends Canvas2DElement {
    readonly type: string = 'text';

    private _textAlign: TextAlign = 'left'; // 文本横向对齐
    private _verticalAlign: VerticalAlign = 'top';// 文本垂直对齐

    private _strokeColor?: string | CanvasGradient = '#000'; // 描边颜色
    private _strokeWidth: number = 0; // 描边宽度
    private _lineHeight: number = 0; // 行高
    private _letterSpacing: number = 0; // 字间距
    private _textWarp: TextWarp = 'warp'; // 是否换行
    private _indent: number = 0;

    private _font: string[] = [null, null, null, '12px', 'sans-serif']; // 文本设置

    private _text: string = '';
    private _textMap: TextMap[] = [];

    private _modifyText: boolean = false;

    constructor(id: string | number, isStatic: boolean = false) {
        super(id, isStatic);

        this.style.height = 0; // 清除默认高设置
        this.style.color = ''; // 默认使用父级颜色
    }

    set fontStyle(style: FontStyle) {
        this._setFont(style, 0);
    }

    set fontVariant(style: 'normal' | 'small-caps') {
        this._setFont(style, 1);
    }

    set fontWeight(style: FontWeight) {
        if(typeof style === 'number') {
            style = <FontWeight>`${style}`;
        }

        this._setFont(<string>style, 2);
    }

    set fontSize(style: number | string) {
        if(typeof style === 'number') {
            style = style + 'px';
        }

        this._setFont(style, 3);
    }

    set fontFamily(style: string) {
        this._setFont(style, 4);
    }

    async build(ctx: CanvasRenderingContext2D) {
        await super.build(ctx);

        const last = this._textMap[this._textMap.length - 1];
        if(last) {
            ctx.textBaseline = 'top';
            const color = this.style.color || (this.parent ? this.parent.style.color : '');
            if(color) {
                ctx.fillStyle = color;
            }
            if(this._strokeWidth) {
                ctx.strokeStyle = this._strokeColor;
            }

            const font = this._font.filter(v => v != null && v !== '').join(' ');
            if(font) {
                ctx.font = font;
            }

            this._textMap.forEach(v => {
                const x = this._adjustX(last, v);
                const y = this._adjustY(last, v);
                ctx.fillText(v.char, x, y);
                if(this._strokeWidth) {
                    ctx.strokeText(v.char, x, y);
                }
            })
        }
    }

    setTextStyle(key: string | TextStyle, value?: any) {
        this._modifyText = false;
        if(typeof key === 'string') {
            this._setTextStyle([key, value]);
        } else {
            Object.entries(key).forEach(this._setTextStyle, this);
        }

        if(this._modifyText && !this.isStatic) {
            if(this.height <= 0 && this.style.top == null){
                this.needUpdate = true;
            } else if(!this.needUpdate){
                this._parseText();
            }
        }

        return this;
    }

    async update() {
        if(!this._text) {
            this.style.width = 0;
        }
        this.style.border = 0;

        super.update();
    }

    async calcSize(){
        await super.calcSize();

        this._parseText();

        // 高默认用文本高填充
        if(this.height <= 0) {
            this.height = 0;

            const last = this._textMap[this._textMap.length - 1];
            if(last) {
                this.height = last.y + last.height;
            }
        }
    }

    private _parseText() {
        this._textMap.length = 0;

        // 静态文本只解析一次
        if(this.isStatic && this._cached) {
            return;
        }

        if(this._text) {
            const font = this._font.filter(v => v != null && v !== '').join(' ');
            const lineHeight = (this._lineHeight || getLineHeight(font));
            const ellipsisWidth = getWidth('...', font);

            const lines = this._text.replace(/\n*$/, '').split('\n');
            const options = { y: 0, lineHeight, font, ellipsisWidth };

            for(const v of lines) {
                this._setTextMap(v, options);
                options.y += lineHeight;

                if(this.height > 0 && options.y > this.height) {
                    return;
                }
            }
        }
    }

    private _setTextMap(line: string, options: any) {
        let width: number = 0;
        if(!this._textMap.length) {
            width += this._indent;
        }

        for(let i=0; i<line.length; i++) {
            if(i) {
                width += this._letterSpacing;
            }

            const textWidth = getWidth(line[i], options.font) + this._strokeWidth;
            const textData = {
                char: line[i],
                x: width,
                y: options.y,
                width: textWidth,
                height: options.lineHeight
            }

            width += textWidth;

            if(width > this.width) {
                if(this._textWarp === 'warp') {
                    textData.x = 0;
                    width = textWidth;
                    textData.y += options.lineHeight;
                    options.y += options.lineHeight;

                    if(this.height > 0 && options.y > this.height){
                        return;
                    }
                } else {
                    return this._addEllipsis(textData, options.ellipsisWidth);
                }
            } else if(i < line.length - 1 && width + options.ellipsisWidt > this.width) {
                return this._addEllipsis(textData, options.ellipsisWidth);
            }

            this._textMap.push(textData);
        }
    }

    private _addEllipsis(textData: TextMap, ellipsisWidth: number) {
        if(this._textWarp === 'ellipsis') {
            textData.char = '...';
            textData.width = ellipsisWidth;
            this._textMap.push(textData);
        }
    }

    private _setFont(style: string, index: number) {
        const old = this._font[index];
        if(style !== old) {
            this._font[0] = style;

            this._modifyText = true;
            this.markDirty();
        }
    }

    private _setTextStyle([key, value]: [string, any]) {
        if(!isFontStyle(key)) {
            const k = '_' + key;
            if(Reflect.get(this, k) !== value) {
                Reflect.set(this, k, value);

                if(canModifyTextMap(key)) {
                    this._modifyText = true;
                }

                this.markDirty();
            }
        } else {
            (<any>this)[key] = value;
        }
    }

    private _adjustX(last: TextMap, data: TextMap) {
        const more = this.width - last.x - last.width;
        if(more > 0 && data.y === last.y) {
            if(this._textAlign === 'center') {
                return data.x + more / 2;
            }

            if(this._textAlign === 'right') {
                return data.x + more;
            }
        }

        return data.x;
    }

    private _adjustY(last: TextMap, data: TextMap) {
        const more = this.height - last.y - last.height;
        if(more > 0) {
            if(this._verticalAlign === 'middle') {
                return data.y + more / 2;
            }

            if(this._verticalAlign === 'bottom') {
                return data.y + more;
            }
        }

        return data.y;
    }
}