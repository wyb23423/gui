import { useEffect, useMemo } from 'react';
import { IStyle } from '../core/style';
import Canvas2DImage from '../node/image';

interface CImageProps {
  id: number | string;
  /** 是否显示, 默认true */
  isVisible?: boolean;
  src?: string;
  style?: Omit<IStyle, 'src'>;
  onInit?(el: Canvas2DImage): unknown;
}

export default function CImage({ id, style, onInit, src, isVisible }: CImageProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const image = useMemo(() => new Canvas2DImage(id), []);

  useEffect(() => {
    onInit?.(image);
    return () => image.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    style && image.attr(style);
    src && image.attr('src', src);
    image.isVisible = isVisible ?? true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, src, isVisible]);

  return null;
}
