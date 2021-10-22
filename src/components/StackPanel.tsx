import { View } from '@tarojs/components';
import { Children, cloneElement, isValidElement, PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import Canvas2DElement from '../node/element';
import Stack from '../node/stack';
import { ContainerProps } from './Container';

/** 堆栈式容器 */
export default function StackPanel({ id, style, isVisible, ...props }: PropsWithChildren<ContainerProps>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stack = useMemo(() => new Stack(id), []);

  useEffect(() => {
    props.onInit?.(stack);
    return () => stack.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    style && stack.attr(style);
    stack.isVisible = isVisible ?? true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, isVisible]);

  const onInit = useCallback((el: Canvas2DElement) => stack.add(el), [stack]);

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
