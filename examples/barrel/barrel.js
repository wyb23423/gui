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
    let isScroll = false;

    function loadImg(src) {
        src = `./assets/${src}`;
        const img = new Canvas2DImage(`${src}_${row}`).attr({src});
        img.events.on('click', function(){
            if(!isScroll) {
                window.open(this.style.src, 'block');
            }

            isScroll = false;
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

        engine = new Engine(root).addLayer(0);

        const scroll = new Scroll('box');
        scroll.events.on('touchend', () => isScroll = false);
        scroll.events.on('scroll', _scroll);

        engine.getLayer(0).add(scroll);

        return scroll;
    }
    function _scroll() {
        isScroll = true;

        if(stacks.length && Math.abs(this.move) >= Math.abs(this.maxMove)) {
            _load(this, 1);
        }
    }
    function _load(scroll, count) {
        let i=0;
        while(i < count && stacks.length) {
            scroll.add(stacks.shift());
            i++;
        }
    }

    function render(list, root, height = 200) {
        root.style.pointerEvents = 'none';
        srcList = list;

        const scroll = _init(root, height);
        Promise.all(list.map(loadImg)).then(v => {
            v.push(layout(height));
            stacks = v.filter(v => !!v);

            _load(scroll, Math.ceil(root.offsetHeight / rowHeight));
            root.style.pointerEvents = 'all';
        });

        engine.render();

        return scroll;
    }

    function getEngine() {
        return engine;
    }

    function dispose() {
        stacks.forEach(v => v.dispose());

        engine && engine.dispose();
        engine = target = null;

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