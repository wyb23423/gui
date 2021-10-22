import { View } from '@tarojs/components';
import {
  canvasToTempFilePath,
  openSetting,
  saveImageToPhotosAlbum,
  showModal,
  showToast,
  Canvas,
  createSelectorQuery,
  General,
} from '@tarojs/taro';
import { CanvasProps } from '@tarojs/components/types/Canvas';
import { Children, cloneElement, isValidElement, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import Container from './Container';
import CImage from './Image';
import CText from './Text';
import Canvas2dRenderer from '../renderer';
import Canvas2DElement from '../node/element';

interface RendererProps {
  canvas: Nullable<Canvas>;
}

export default function Renderer({ children, canvas }: PropsWithChildren<RendererProps>) {
  const [nodes, setNodes] = useState<Canvas2DElement[]>([]);

  useEffect(() => {
    let timer: number;
    let renderer: Canvas2dRenderer;
    if (canvas) {
      renderer = new Canvas2dRenderer(canvas);
      nodes.forEach(renderer.add, renderer);

      const fn = () => {
        renderer.render();
        timer = canvas.requestAnimationFrame(fn);
      };
      fn();
    }

    return () => {
      renderer?.dispose();
      timer && canvas?.cancelAnimationFrame(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  const onChildInit = useCallback((el: Canvas2DElement) => setNodes((val) => [...val, el]), []);

  return (
    <View style={{ display: 'none' }}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) {
          return null;
        }

        return cloneElement(child, { ...child.props, onInit: onChildInit });
      })}
    </View>
  );
}

Renderer.View = Container;
Renderer.Image = CImage;
Renderer.Text = CText;

Renderer.download = (canvas: Canvas, fileType: keyof canvasToTempFilePath.fileType = 'jpg') => {
  return new Promise<void>((resolve, reject) => {
    const save = (filePath: string) => {
      saveImageToPhotosAlbum({
        filePath: filePath,
        success: () => {
          showToast({ title: '图片保存成功' });
          resolve();
        },
        async fail(e) {
          if (e.errMsg === 'saveImageToPhotosAlbum:fail auth deny') {
            const { confirm } = await showModal({ content: '检测到您没有图片保存权限, 是否去设置打开' });
            if (!(confirm && (await openSetting()).authSetting['scope.writePhotosAlbum'])) {
              return reject(new Error('没有图片保存权限'));
            }

            save(filePath);
          } else {
            reject(e);
          }
        },
      });
    };

    canvasToTempFilePath({
      x: 0,
      y: 0,
      fileType,
      quality: 1,
      canvas: canvas as CanvasProps,
      success: (res) => save(res.tempFilePath),
      fail: reject,
    });
  });
};

function isCanvas(node: General.IAnyObject): node is Canvas {
  return node && Reflect.has(node, 'getContext');
}
Renderer.selectCanvas = (selector: string) => {
  return new Promise<Canvas>((resolve, reject) => {
    createSelectorQuery()
      .select(selector)
      .fields({ node: true, size: true })
      .exec(([res]) => {
        const _canvas = res.node;
        if (isCanvas(_canvas)) {
          _canvas.width = res.width;
          _canvas.height = res.height;

          return resolve(_canvas);
        }

        reject(new Error(`未查询到canvas2d元素: ${selector}`));
      });
  });
};
