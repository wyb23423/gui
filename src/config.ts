import { getSystemInfoSync } from '@/wxat-common/utils/wxApi/overwrite-common';
import { cached } from './tool/util';

// 设备像素比
export const devicePixelRatio = cached((isRpx: boolean = true) => {
  const info = getSystemInfoSync();
  if (!isRpx) {
    return info.pixelRatio;
  }

  return (info.screenWidth / 750) * info.pixelRatio;
});
