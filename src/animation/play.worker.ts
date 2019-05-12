/**
 * 动画播放时计算各属性的worker脚本
 */
import { stringify } from "../tool/color";
import { getEasing } from "./easing";

self.addEventListener('message', arg => {
    const {animation, now} = arg.data;
    const msg = play(animation, now);
    Reflect.deleteProperty(animation, 'el');

    (<any>self).postMessage(msg);
});

// ==============================================================
const animationKey = [
    'width', 'height', 'scaleX', 'scaleY', 'rotation', 'left','right',
    'top', 'bottom', 'opacity', 'color', 'background', 'cellId'
];

function play(animation:any, now: number) {
    const msg = {
        animation: animation,
        isEnd: false,
        attrs: new Map()
    };

    const progress = Math.min(1, (now - animation._startTime - animation._pauseTime) / animation.time);

    if(!animation._isPause) {
        for(const [e, v] of animation.el.entries()) {
            msg.attrs.set(e, getAttr(progress, v, animation));
        }
    } else {
        animation._pauseTime += now - animation._prevTime;
    }
    if(now - animation._startTime - animation._pauseTime > animation.time) {
        msg.isEnd = true;

        return msg;
    }
    animation._prevTime = now;

    return msg;
}

function getAttr(progress: number, zeroFrame: any, animation: any) {
    const attr = {};
    const easing = getEasing(animation.easing);

    animationKey.forEach(k => {
        const thisAttr = {...Reflect.get(animation, k)};
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
                rate = easing(rate);

                if(Array.isArray(value)) { // color、background
                    value = value.map((v, i) => (v - prev[i]) * rate +  prev[i]);
                } else if(type1 === 'number'){
                    value = (value - prev) * rate + prev;
                } else if(type1 === 'string') {
                    let reg = /^([\+-]?\d+)(.*)$/;
                    if(reg.test(value)) {
                        value = value.replace(reg, (_, v, s) => {
                            let prevValue = +parseFloat(prev);

                            reg = new RegExp(`^[\\+-]?\\d+${s}$`);
                            if(!reg.test(prev)) {
                                warnOnce(k, animation);
                                prevValue = 0;
                            }

                            return (+v - prevValue) * rate + prevValue + s;
                        });
                    } else {
                        value = 0;
                    }
                }
            } else if(type2 !== 'undefined'){
                warnOnce(k, animation);
            }

            if(Array.isArray(value)) {
                value = stringify(value, 'rgba');
            }
            Reflect.set(attr, k, value);
        }
    });

    return attr;
}

function warnOnce(key, animation) {
    if(!animation.errKey.has(key)) {
        console.error(`对属性${key}的设置存在类型不一样的设置`);
        animation.errKey.add(key);
    }
}