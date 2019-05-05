/**
 * 文本输入框
 */
import { Container } from "./container";
import { TextBlock } from "./text";
import { addHandler, removeHandler } from "../core/dom";
import { IGuiEvent } from "../core/event";
import { buildPath } from "../tool/paint";
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
    private _maxIndex: number = 0;

    constructor(id: number | string) {
        super(id, false);

        this.init(id);

        this._initDom();
        this.event.on('mouseout', () => this.isIn = false);
        this.event.on('mouseover', () => this.isIn = true);
        this.event.on('click', this._click);

        this.style.border = 1;
    }

    get text(){
        return (<any>this.children[0]).children[1].text;
    }

    /**
     * 设置文本样式
     */
    setTextStyle(key: string | TextStyle, value?: any) {
        (<any>this.children[0]).children[1].setTextStyle(key, value);

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

    dispose() {
        super.dispose();

        document.body.removeChild(this.dom);
        removeHandler(document, 'click', this._domClick);
    }

    beforeBuild() {
        Object.assign(this.children[0].style, {
            width: this.width - (this.style.border + this.padding) * 2,
            height: this.height - (this.style.border + this.padding) * 2,
            clip: true,
            left: this.padding
        });

        const textEl: TextBlock = (<any>this.children[0]).children[1];
        Reflect.set(textEl, '_textWarp', 'no-warp');
        Object.assign(textEl.style, {color: '', width: 0, height: 0, top: null });

        if(this.isPassWord) {
            textEl.text = textEl.text.replace(/[^]/g, '●');
        }

        this.style.border = Math.max(1, this.style.border);
        this.style.clip = true;

        (<any>this.children[0]).children[0].isVisible = this.isFocus;
        this.setCursor(textEl);
    }

    async build(ctx: CanvasRenderingContext2D) {
        const textEl: TextBlock = (<any>this.children[0]).children[1];

        let borderColor: string | CanvasGradient;
        let color: string | CanvasGradient;
        if(this.isFocus) {
            if(this.focusBorderColor) {
                borderColor = this.style.borderColor;
                this.style.borderColor = this.focusBorderColor;
            }

            if(this.focusColor && textEl.text) {
                color = this.style.color;
                this.style.color = this.focusColor;
            }
        }

        let notText: boolean = false;
        if(!textEl.text) {
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

    private setCursor(textEl: TextBlock) {
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

        box.children[0].left = left;
        box.children[0].needUpdate = true;
    }

    private init(id: number | string) {
        const cursor = new Container(`__input__cursor__${id}`, true)
                        .attr({
                            background: '#000',
                            width: 1
                        });
        const animation = new Canvas2DAnimation(1500, Infinity, 0, 'sinusoidalInOut')
                    .addFrame(0.5, {opacity: 0})
                    .addFrame(1, {opacity: 1});
        animation.addElement(cursor).start();

        const text = new TextBlock(`__input__text__${id}`, false);
        const calcSize = text.calcSize;
        text.calcSize = async () => {
            await calcSize.call(text);

            text.style.left = this.isCenter && text.width < text.getParentSize('width') ? null : 0;
        }

        this.add(new Container(`__input__${id}`).add(text).add(cursor));
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
            const text = e.target.value.substr(0, this.maxLength);
            if(text !== this.text) {
                this.setTextStyle('text', text);
            }
            this._maxIndex = text.length - 1;
        }
    }

    private _focus(e: FocusEvent) {
        this.notifyEvent('focus', e, {target: this});
        this.modifyFocus(true);
    }

    private _moveCursor = (e: KeyboardEvent) => {
        if(e.keyCode === 37 && this._selectIndex > -1){
            this._selectIndex--;
            this.markDirty();
        } else if(e.keyCode === 39 && this._selectIndex < this._maxIndex) {
            this._selectIndex++;
            this.markDirty();
        }
    }

    private _click(e: IGuiEvent) {
        const textMap = (<any>this.children[0]).children[1].textMap;
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