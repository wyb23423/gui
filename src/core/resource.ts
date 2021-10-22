/**
 * 资源管理，主要是图片
 */
import { Canvas, getImageInfo, showToast } from '@tarojs/taro';

interface ResData {
  image: HTMLImageElement;
  count: number;
}

const res: Map<string, ResData> = new Map();

/**
 * 获取图片
 * @param isFirst 是否是节点第一次请求图片
 */
export async function getImg(canvas: Canvas, path: string, isFirst: boolean = true) {
  const data = res.get(path);
  if (data) {
    if (isFirst) {
      data.count++;
    }

    return data.image;
  }

  try {
    const info = await getImageInfo({ src: path });
    // 本地图片
    if (path.startsWith('.') || path.startsWith('/')) {
      info.path = path;
    }

    const image = canvas.createImage() as HTMLImageElement;
    image.src = info.path;
    res.set(path, { image, count: 1 });

    image.onerror = () => disposeImg(path);
    await new Promise((resolve) => (image.onload = resolve));

    return image;
  } catch (e) {
    showToast({ title: '图片加载失败', icon: 'none' });
    console.error(e, path);
  }
}

/**
 * 释放图片
 */
export function disposeImg(path: string) {
  const data = res.get(path);

  if (data) {
    data.count--;
    if (data.count <= 0 && res.size > 500) {
      res.delete(path);
    }
  }
}
