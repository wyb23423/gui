# 项目介绍

此项目是一个基于canvas的gui引擎, 通过此引擎可以实现保留部分dom特性的情况下创建ui界面。

# 用法

使用此引擎需要先实例化一个渲染引擎并添加最少一个渲染层(即一个canvas), 用法如下:

```js
// 实例化渲染引擎, root是DOM 容器
const engine = new Engine(root);

// 添加一个层级为0的渲染层, 并开始渲染
engine.addLayer(0).render();
```

当然仅仅这样是没有任何显示的, 因为还需要向渲染层里添加用于显示的元素。

这些元素在node文件夹下, 包括: 普通容器(Container)、图片(Canvas2DImage)、文本(TextBlock)、文本输入框(Input)、堆栈式容器(Stack), 可滚动容器(Scroll)。

如果想创建其他元素, 只需要继承Canvas2DElement或Container后并进行一定扩展即可。

这里以添加一个文本输入框为例：

```js
const layer0 = engine.getLayer(0); // 获取渲染层

// 创建文本输入框, 并设置属性
const input = new Input(0).attr({
    width: '50%',
    height: 30
});
layer0.add(input); // 将文本输入框添加至渲染层
```

如上所示, 通过attr()方法可以修改元素的属性。但此方法只用于通用属性(由Istyle接口定义的属性)的修改，对于修改文本样式(TextBlock、Input)时应该使用setTextStyle()方法:

```js
// 设置字体大小为16px
input.setTextStyle('fontSize', 16);
```

而修改文本输入框特有的属性应使用setInputAttr():

```js
// 设置文本框在未输入任何文字时显示: 请输入...
input.setInputAttr('placeholder', '请输入...');
```