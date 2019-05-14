/**
 * 滚动文字
 */

const barrage = (() => {
    const {
        Canvas2DAnimation,
        Canvas2DImage,
        Engine,
        Stack,
        TextBlock,
        devicePixelRatio
    } = WsGui;

    const barrageId = (() =>{
        let i = 0;

        return () => i++;
    })();

    // ===============判断是否是图片
    const imgReg = /\.(jpg|png|gif|jpeg)$/i;
    function isImg(str){
        if(typeof str === 'string'){
            return imgReg.test(str);
        }

        return false;
    }

    /**
     * 创建一条弹幕
     * @param {string[]} barrage.content 弹幕内容, 可包含图片
     * @param {number} barrage.y 弹幕垂直方向位置
     * @param {string} barrage.color 弹幕颜色
     * @param {number} barrage.size 弹幕内容大小
     * @param {number} barrage.speed 弹幕速度
     * @param {string} barrage.type 弹幕类型
     */
    function createBarrage(barrage) {
        const id = barrageId();

        const el = new Stack(`barrage_${id}`, true).attr({
            color: barrage.color,
            top: barrage.y,
            height: barrage.size + 10
        });
        el.isVertical = false;

        barrage.content.forEach((v, i) => {
            el.add(
                isImg(v)
                    ? createImg(id, i, v, barrage.size)
                    : createText(id, i, v, barrage.size)
            );
        });

        return addAnimation(el, barrage.type, barrage.speed);
    }
    function createText(id, i, text, fontSize) {
        return new TextBlock(`text_${id}_${i}`)
                .setTextStyle({ fontSize, text, strokeWidth: 1 })
                .attr({ width: 0, left: 5, right: 5 });
    }
    function createImg(id, i, src, size) {
        const attr = {src};
        attr.width = attr.height = size;
        attr.left = attr.right = size / 10;

        return new Canvas2DImage(`image${id}_${i}`).attr(attr);
    }

    function addAnimation(el, type, speed) {
        switch(type) {
            case 'scroll': return addScrollAnimation(el, speed);
            default: return addDefault(el);
        }
    }
    function addDefault(el) {
        const anim = new Canvas2DAnimation(2000)
            .addEndCall(() => {
                anim.dispose();
                el.dispose();
            })
            .addElement(el);

        anim.start();

        return el;
    }
    // 添加滚动动画
    function addScrollAnimation(el, speed) {
        const calcSize = el.calcSize;
        el.calcSize = async () => {
            await calcSize.call(el);

            if(!el.animation) {
                const left = el.style.left = el.getParentSize('width') / devicePixelRatio;
                const anim = new Canvas2DAnimation(3000 / speed)
                    .addFrame(0, {left: left})
                    .addFrame(1, {left: -el.width - 10})
                    .addElement(el)
                    .addEndCall(() => {
                        anim.dispose();
                        el.dispose()
                    });

                anim.start();
            }
        }

        return el;
    }

    function init(dom, list) {
        const engine = new Engine(dom).addLayer(0);
        engine.render();

        const layer = engine.getLayer(0);
        let i=0;
        const load = () => {
            const el = createBarrage(list[i]);
            layer.add(el);
            if(++i < list.length) {
                requestAnimationFrame(load);
            }
        }
        load();
    }

    return {init};
})();

function randomInt(min, max){
    if(max === min) return Math.round(max);

    if(max < min) {
        [min, max] = [max, min];
    }

    return Math.round(Math.random() * (max - min) + min);
}

window.addEventListener('load', () => {
    const root = document.getElementById('box');
    const list = [];
    for(let i=0; i<10000; i++) {
        list.push({
            content: ['测试数据' + i],
            size: 16,
            speed: 1,
            color: `rgb(${randomInt(0, 255)}, ${randomInt(0, 255)}, ${randomInt(0, 255)})`,
            y: Math.random() * (root.offsetHeight - 30),
            type: Math.random() > 0.5 ? 'scroll' : 'static'
        });
    }
    barrage.init(root, list);
})