const Barrel = (() => {
    const {Stack, Canvas2DImage, Engine, Scroll} = WsGui;

    let row = 1;
    let rowHeight = 0;
    let rowWidth = document.body.offsetWidth;
    let width = 0;

    const imgArr = [];
    let srcList = [];

    let engine = null;

    function loadImg(src) {
        src = `./assets/${src}`;
        const img = new Image();
        img.src = src;

        return new Promise(resolve=> {
            img.onload = () => {
                const ratio = img.width / img.height;
                const stack = _render({
                    target: src,
                    width: rowHeight * ratio,
                    height: rowHeight,
                    ratio: ratio
                });

                resolve(stack);
            };
        });
    }

    function _render(imgInfo) {
        width += imgInfo.width;
        imgArr.push(imgInfo);

        let stack = null;
        if(width > rowWidth) {
            let last = null;
            if(imgArr.length > 1) {
                last = imgArr.pop();
                width -= last.width;
            } else {
                width = rowWidth;
            }

            const height = rowHeight * rowWidth / width;
            stack = layout(height);

            if(last) {
                width = last.width;
                imgArr.push(last);
            } else {
                width = 0;
            }
        }

        return stack;
    }

    function layout(height) {
        if(imgArr.length) {
            const stack = new Stack(row, true).attr({
                height: height,
                left: 0,
                width: rowWidth
            });
            stack.isVertical = false;

            imgArr.forEach((v, i) => {
                const img = new Canvas2DImage(`${v.target.substr(0, 20)}_${i}_${row}`)
                            .attr({
                                height,
                                src: v.target
                            });
                img.events.on('click', console.log);

                stack.add(img);
            })

            row++;
            imgArr.length = 0;

            return stack;
        }
    }

    function _init(root, height) {
        rowHeight = height;
        rowWidth = root.offsetWidth;

        engine = new Engine(root);
        engine.render();
    }

    function render(list, root, height = 200) {
        srcList = list;
        _init(root, height);
        root.style.pointerEvents = 'none';

        const layer = engine.addLayer(0).getLayer(0);
        const scroll = new Scroll('box');
        Promise.all(list.map(loadImg)).then(stacks => {
            stacks.push(layout(height));
            stacks = stacks.filter(v => !!v);

            function load(count) {
                let i=0;
                while(i < count && stacks.length) {
                    scroll.add(stacks.shift());
                    i++;
                }
            }

            load(Math.ceil(root.offsetHeight / height));
            root.style.pointerEvents = 'all';

            function scrollCall() {
                if(!stacks.length) {
                    return scroll.events.off('scroll', scrollCall)
                }
                if(Math.abs(this.move) >= Math.abs(this.maxMove)) {
                    load(1);
                }
            }
            scroll.events.on('scroll', scrollCall);
        });
        layer.add(scroll);

        return scroll;
    }

    function getEngine() {
        return engine;
    }

    return {
        getEngine,
        render
    }
})();