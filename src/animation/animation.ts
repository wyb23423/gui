/**
 * 动画
 */

import { parseColor, stringify } from "../tool/color";
import { isImg } from "../tool/util";
import { Canvas2DElement } from "../node/element";
import { getEasing } from "./easing";
import { Canvas2DImage } from "../node/image";

interface AnimationAttr {
    [key: string]: string | number | number[];
}

interface AnimationFrame {
    background?: string;
    color?: string;

    opacity?: number;

    width?: number | string;
    height?: number | string;

    rotation?: number;

    scaleX?: number;
    scaleY?: number;
    scale?: number | number[];

    left?: number | string;
    right?: number | string;
    top?: number | string;
    bottom?: number | string;

    cellId?: number;
}

const animationKey = [
    'width', 'height', 'scaleX', 'scaleY', 'rotation', 'left','right',
    'top', 'bottom', 'opacity', 'color', 'background', 'cellId'
];

export class Canvas2DAnimation {
    el: Map<Canvas2DElement, AnimationAttr> = new Map();

    private _endCall: Set<Function> = new Set();

    private _startTime: number = 0;
    private _pauseTime: number = 0;
    private _prevTime: number = 0;
    private _isStart: boolean = false;
    private _isPause: boolean = false;
    private _timer?: number;

    // ===================================可添加动画的属性
    private width: AnimationAttr = {};
    private height: AnimationAttr = {};
    private scaleX: AnimationAttr = {};
    private scaleY: AnimationAttr = {};
    private rotation: AnimationAttr = {};
    private left: AnimationAttr = {};
    private right: AnimationAttr = {};
    private top: AnimationAttr = {};
    private bottom: AnimationAttr = {};
    private opacity: AnimationAttr = {};
    private color: AnimationAttr = {};
    private background: AnimationAttr = {};
    private cellId: AnimationAttr = {};

    private errKey: Set<string> = new Set();

    constructor(
        public time: number = 0,
        public count: number = 1,
        public delay: number = 0,
        public easing: string = 'linear'
    ) {}

    addFrame(frame: number | string, value: AnimationFrame, reWrite: boolean = true) {
        this.errKey.clear();

        frame = this._parseFrame(frame);
        if(Reflect.has(value, 'scale')) {
            const scale = Array.isArray(value.scale) ? value.scale : [value.scale, value.scale];
            value.scaleX = scale[0];
            value.scaleY = scale[1];
        }

        animationKey.forEach(k => {
            let attr: any = Reflect.get(value, k);
            const thisAttr = Reflect.get(this, k);
            if(attr !== '' && (reWrite || !Reflect.has(thisAttr, frame))) {
                if(typeof attr === 'number' || typeof attr === 'string') {
                    if(k === 'color' || k === 'background') {
                        attr = parseColor(attr);
                    }

                    Reflect.set(thisAttr, frame, attr);
                } else if(attr != null){
                    console.warn('只能用number及string类型设置动画');
                }
            }
        });

        return this;
    }

    addElement(el: Canvas2DElement) {
        if(!this.el.has(el)) {
            const style = el.style;
            const attr: AnimationAttr = {
                width: style.width,
                height: style.height,
                rotation: style.rotation,
                left: style.left,
                right: style.right,
                top: style.top,
                bottom: style.bottom,
                opacity: style.opacity,
                scaleX: style.scale[0],
                scaleY: style.scale[1],
            };
            if(typeof style.color === 'string') {
                attr.color = parseColor(style.color);
            }
            if(typeof style.background === 'string' && !isImg(style.background)) {
                attr.background = parseColor(style.background);
            }
            if(el instanceof Canvas2DImage) {
                attr.cellId = 0;
            }
            this.el.set(el, attr);
            if(el.animation !== this) {
                el.animation = this;
            }
        }

        return this;
    }

    addEndCall(fn: Function) {
        this._endCall.add(fn);

        return this;
    }
    removeEndCall(fn: Function) {
        this._endCall.delete(fn);

        return this;
    }
    dispose(){
        if(this._timer) {
            cancelAnimationFrame(this._timer);
        }
        this._endCall.clear();

        this.el.forEach(v => v.animation = null);
        this.el.clear();
    }

    start(now: number = Date.now()) {
        if(!this._isStart) {
            this.stop();

            this._startTime = now + this.delay;
            this._isStart = true;
            this._pauseTime = this._prevTime = 0;

            this._play();
        }

        this._isPause = false;
    }

    pause() {
        this._isPause = true;
    }

    stop() {
        this._isStart = this._isPause = false;

        if(this._timer) {
            cancelAnimationFrame(this._timer);
        }
    }

    private _end() {
        this.stop();
        this._endCall.forEach(fn => fn());

        if(--this.count > 0) {
            this.start();
        }
    }

    private _play() {
        if(this._isStart && this.el.size) {
            const now = Date.now();

            if(now >= this._startTime) {
                const progress = Math.min(1, (now - this._startTime - this._pauseTime) / this.time);

                if(!this._isPause) {
                    for(const [e, v] of this.el.entries()) {
                        if(e.animation === this) {
                            e.attr(this._getAttr(progress, v))
                        } else {
                            this.el.delete(e);
                        }
                    }
                } else {
                    this._pauseTime += now - this._prevTime;
                }
                if(now - this._startTime - this._pauseTime > this.time) {
                    return this._end();
                }
                this._prevTime = now;
            }

            this._timer = requestAnimationFrame(() => this._play());
        }
    }

    private _getAttr(progress: number, zeroFrame: AnimationAttr) {
        const attr: AnimationFrame = {};

        animationKey.forEach(k => {
            const thisAttr: any = {...Reflect.get(this, k)};
            thisAttr[0] = thisAttr[0] == null ? Reflect.get(zeroFrame, k) : thisAttr[0];

            const frames = Object.keys(thisAttr).sort((a, b) => +a - +b);
            const frame = frames.findIndex(v => +v >= progress);

            let value = thisAttr[frames[frame]];
            if(value != null) {
                let prev = thisAttr[frames[frame - 1]];
                const type1 = typeof value;
                const type2 = typeof prev;
                if(type1 === type2) {
                    let rate = 1 - (+frames[frame] - progress) / (+frames[frame] - +frames[frame - 1]);
                    rate = getEasing(this.easing)(rate);

                    if(Array.isArray(value)) {
                        value = value.map((v, i) => (v - prev[i]) * rate +  prev[i]);
                    } else if(type1 === 'number'){
                        value = (value - prev) * rate + prev;
                    } else if(type1 === 'string') {
                        let reg = /^([\+-]?\d+)(.*)$/;
                        if(reg.test(value)) {
                            value = value.replace(reg, (_: string, v: string, s: string) => {
                                let prevValue = +parseFloat(prev);

                                reg = new RegExp(`^[\\+-]?\\d+${s}$`);
                                if(!reg.test(prev) && prevValue !== 0) {
                                    this._warnOnce(k);
                                    prevValue = 0;
                                }

                                return (+v - prevValue) * rate + prevValue + s;
                            });
                        } else {
                            value = 0;
                        }
                    }
                } else if(type2 !== 'undefined'){
                    this._warnOnce(k);
                }

                if(Array.isArray(value)) {
                    value = stringify(value, 'rgba');
                }
                Reflect.set(attr, k, value);
            }
        });

        return attr;
    }

    private _parseFrame(frame: number | string) {
        let res: number;
        if(typeof frame === 'string') {
            res = parseFloat(frame) || 0;
            if(frame.endsWith('%')) {
                res /= 100;
            }
        } else {
            res = frame;
        }

        return Math.max(0, Math.min(res, 1));
    }

    private _warnOnce(key: string) {
        if(!this.errKey.has(key)) {
            console.error(`对属性${key}的设置存在类型不一样的设置`);
            this.errKey.add(key);
        }
    }
}