/**
 * 文本输入框
 */
import { Container } from "./container";
import { TextBlock } from "./text";
import { addHandler, removeHandler } from "../core/dom";
import { IGuiEvent } from "../core/event";
import { findIndexByBinary } from "../tool/util";
import { Vector2 } from "../lib/vector";
import { Canvas2DAnimation } from "../animation/animation";


interface InputAttr {
    isPassWord?: boolean;
    maxLength?: number;
    padding?: number;
    focusColor?: string | CanvasGradient;
    focusBorderColor?: string | CanvasGradient;
    placeholder?: string;
    isCenter?: boolean;
}

export class Input extends Container {
    readonly type: string = 'input';

    // ====================================输入框可设置属性
    private isPassWord: boolean = false;
    private maxLength: number = 1000;
    private padding: number = 5;
    private focusColor?: string | CanvasGradient;
    private focusBorderColor?: string | CanvasGradient;
    private placeholder: string = '';
    private isCenter: boolean = false;
    // ===========================================

    private dom: HTMLInputElement = document.createElement('input');
    private isIn: boolean = false;
    private isFocus: boolean = false;
    private isIME: boolean = false; // 是否处于中文输入环境
    private _move: number = 0;
    private _selectIndex: number = 0; // 光标前一个字的索引

    private _cursor: Container = null;
    private _textEl: TextBlock = null;
    private _text: string = '';

    constructor(id: number | string) {
        super(id, false);

        this._initChildren(id); // 创建子节点以构成一个文本输入框

        this._initDom(); // 绑定相关dom事件
        this.events.on('mouseout', () => this.isIn = false);
        this.events.on('mouseover', () => this.isIn = true);
        this.events.on('click', this._click);

        this.style.border = 1;
    }

    get text(){
        return this._text;
    }

    /**
     * 设置文本样式
     */
    setTextStyle(key: string | TextStyle, value?: any) {
        if(this._textEl) {
            this._textEl.setTextStyle(key, value);
        }

        return this;
    }

    /**
     * 设置输入框属性
     */
    setInputAttr(key: string | InputAttr, value?: any) {
        if(typeof key === 'string') {
            Reflect.set(this, key, value);
        } else {
            Object.entries(key).forEach(v => Reflect.set(this, v[0], v[1]));
        }

        this.markDirty();
    }

    getTarget(ctx: CanvasRenderingContext2D, x: number, y: number){
        return this._contain(ctx, x, y) ? this : false;
    }

    remove() {
        console.warn('input不能移除任何子节点');

        return this;
    }

    add() {
        console.warn('input不能额外添加任何子节点');

        return this;
    }

    dispose() {
        super.dispose();
        this._textEl = this._cursor = null;

        document.body.removeChild(this.dom);
        removeHandler(document, 'click', this._domClick);
    }

    beforeBuild() {
        super.beforeBuild();

        Object.assign(this.children[0].style, {
            width: this.width - (this.style.border + this.padding) * 2,
            height: this.height - (this.style.border + this.padding) * 2,
            clip: true,
            left: this.padding
        });

        const textEl: TextBlock = this._textEl;
        if(textEl) {
            this.setTextStyle('textWarp', 'no-warp');
            Object.assign(textEl.style, {color: '', width: 0, height: 0, top: null });
            if(this.isPassWord) {
                textEl.text = textEl.text.replace(/[^]/g, '●');
            }

            if(this._cursor) {
                textEl.needUpdate || this.setCursorPosition(textEl);
                this._cursor.isVisible = this.isFocus;
            }
        }

        this.style.border = Math.max(1, this.style.border);
        this.style.clip = true;
    }

    async build(ctx: CanvasRenderingContext2D) {
        const textEl: TextBlock = this._textEl;

        // ============================获取焦点时样式
        let borderColor: string | CanvasGradient;
        let color: string | CanvasGradient;
        if(this.isFocus) {
            if(this.focusBorderColor) {
                borderColor = this.style.borderColor;
                this.style.borderColor = this.focusBorderColor;
            }

            if(this.focusColor && textEl && textEl.text) {
                color = this.style.color;
                this.style.color = this.focusColor;
            }
        }

        // ==============================placeholder
        let notText: boolean = false;
        if(textEl && !textEl.text) {
            color = this.style.color;
            this.style.color = '#ccc';
            textEl.text = this.placeholder;
            notText = true;
        }

        await super.build(ctx);

        if(borderColor) {
            this.style.borderColor = borderColor;
        }
        if(color) {
            this.style.color = color;
        }
        if(notText) {
            textEl.text = '';
        }
    }

    // 计算光标位置及文本向左移动的距离
    private setCursorPosition(textEl: TextBlock) {
        let left = 0;
        if(this._selectIndex >= 0) {
            const text = textEl.textMap[Math.min(textEl.textMap.length - 1, this._selectIndex)];
            if(text) {
                left = text.x + text.width;
            }
        }

        const box = <Container>this.children[0];
        const width: number = +box.style.width - 1;
        if(left > width) {
            textEl.left = this._move = width - left;
            textEl.needUpdate = true;
            left = width;
        } else if(textEl.left != null) {
            this._move = 0;
            textEl.left = null;
            textEl.needUpdate = true;
        } else if(this.isCenter && textEl.width < width) {
            left += (width + 1 - textEl.width) / 2;
        }

        this._cursor.left = left;
        this._cursor.needUpdate = true;
    }

    private _initChildren(id: number | string) {
        // ======================================光标
        this._cursor = new Container(`__input__cursor__${id}`, true).attr({ background: '#000', width: 1 });
        new Canvas2DAnimation(1500, Infinity, 0, 'sinusoidalInOut')
            .addFrame(0.5, {opacity: 0})
            .addFrame(1, {opacity: 1})
            .addElement(this._cursor)
            .start();

        // ======================================文本
        const text = this._textEl = new TextBlock(`__input__text__${id}`, false);
        const calcSize = text.calcSize;
        text.calcSize = () => {
            calcSize.call(text);

            this.setCursorPosition(text);

            text.style.left = this.isCenter && text.width < text.getParentSize('width') ? null : 0;
        }

        super.add(new Container(`__input__${id}`).add(text).add(this._cursor));
    }

    private _initDom() {
        const dom = this.dom;
        dom.setAttribute('data-id', `__input__${this.id}`);
        Object.assign(dom.style, {
            opacity: 0,
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: -Number.MAX_VALUE
        })
        addHandler(dom, 'focus', this._focus.bind(this));
        addHandler(dom, 'input', this._inputCall.bind(this));
        addHandler(dom, 'keydown', this._moveCursor.bind(this));
        addHandler(dom, 'keyup', () => this._cursor && this._cursor.animation.start());
        addHandler(dom, 'compositionstart', () => this.isIME = true);
        addHandler(dom, 'compositionend', (e: any) => {
            this.isIME = false;
            this._inputCall(e);
        });
        document.body.appendChild(this.dom);

        addHandler(document, 'click', this._domClick);
    }

    private _inputCall(e: any) {
        if(!this.isIME) {
            this._selectIndex = (<HTMLInputElement>e.target).selectionStart - 1;
            const text = this._text = e.target.value.substr(0, this.maxLength);
            this.setTextStyle('text', text);
        }

        this.notifyEvent('input', e, {target: this});
    }

    private _focus(e: FocusEvent) {
        this.notifyEvent('focus', e, {target: this});
        this.modifyFocus(true);
    }

    private _moveCursor = (e: KeyboardEvent) => {
        const fn = () => {
            if(this._cursor) {
                this._cursor.animation.stop();
                this._cursor.attr('opacity', 1);
            }
            this.markDirty();
        }

        if(e.keyCode === 37 && this._selectIndex > -1){
            this._selectIndex--;
            fn();
        } else if(e.keyCode === 39 && this._selectIndex < this._text.length - 1) {
            this._selectIndex++;
            fn();
        }
    }

    private _click(e: IGuiEvent) {
        if(this._textEl) {
            const textMap = this._textEl.textMap;
            const point = new Vector2(e.x, e.y).transform(this.transform.invert());
            const x = point.x - this.style.border - this.padding - this._move;
            if(x <= 0) {
                this._selectIndex = -1;
            } else {
                this._selectIndex = findIndexByBinary((mid: number) => {
                    const midMap = textMap[mid];
                    return x - midMap.x - midMap.width;
                }, textMap.length);
            }

            this.dom.focus();
            this.dom.setSelectionRange(this._selectIndex + 1, this._selectIndex + 1);

            this.markDirty();
        }
    }

    private modifyFocus(isFocus: boolean) {
        this.isFocus = isFocus;
        this.markDirty();
    }

    private _domClick = () => {
        if(!this.isIn) {
            this.modifyFocus(false);
            this.notifyEvent('change', null, {target: this});
            this.notifyEvent('blur', null, {target: this});
        }
    }
}