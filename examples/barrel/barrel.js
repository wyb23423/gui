const Barrel = (() => {
    const {Stack, Canvas2DImage, Engine, Scroll} = WsGui;

    let row = 1;
    let rowHeight = 0;
    let rowWidth = document.body.offsetWidth;
    let width = 0;

    const imgArr = [];
    let srcList = [];

    let engine = null;
    let stacks = [];

    function loadImg(src) {
        src = `./assets/${src}`;
        const img = new Canvas2DImage(`${src}_${row}`).attr({src});
        img.events.on('click', function(){
            window.open(this.style.src, 'block');
        });

        return img.style.loadImg().then(dom => {
            const ratio = dom.width / dom.height;
            return _render({
                target: img,
                width: rowHeight * ratio,
                height: rowHeight,
                ratio: ratio
            });
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
                width: rowWidth,
                left: 0
            });
            stack.isVertical = false;

            imgArr.forEach(v => {
                v.target.attr({height: height, width: height * v.ratio});
                stack.add(v.target);
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
        Promise.all(list.map(loadImg)).then(v => {
            stacks = v;
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
        const after = layer.afterRender;
        layer.afterRender = () => {
            after.call(layer);
            console.log(Date.now() - layer._time);
        }

        return scroll;
    }

    function getEngine() {
        return engine;
    }

    function dispose() {
        stacks.forEach(v => v.dispose());

        engine && engine.dispose();
        engine = null;

        row
        = srcList.length
        = stacks.length
        = width = 0;
    }

    return {
        getEngine,
        render,
        dispose
    }
})();