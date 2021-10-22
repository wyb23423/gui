import { View } from '@tarojs/components';
import { Children, cloneElement, isValidElement, PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { IStyle } from '../core/style';
import Canvas2DContainer from '../node/container';
import Canvas2DElement from '../node/element';
import CImage from './Image';
import CText from './Text';

export interface ContainerProps {
  id: number | string;
  /** 是否显示, 默认true */
  isVisible?: boolean;
  style?: IStyle;
  onInit?(el: Canvas2DContainer): unknown;
}

export default function Container({ id, style, isVisible, ...props }: PropsWithChildren<ContainerProps>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const container = useMemo(() => new Canvas2DContainer(id), []);

  useEffect(() => {
    props.onInit?.(container);
    return () => container.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    style && container.attr(style);
    container.isVisible = isVisible ?? true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, isVisible]);

  const onInit = useCallback((el: Canvas2DElement) => container.add(el), [container]);

  return (
    <View style={{ display: 'none' }}>
      {Children.map(props.children, (child) => {
        if (!isValidElement(child)) {
          return null;
        }

        return cloneElement(child, { ...child.props, onInit });
      })}
    </View>
  );
}

Container.Image = CImage;
Container.Text = CText;
