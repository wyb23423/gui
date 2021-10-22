import { useEffect, useMemo } from 'react';
import { IStyle } from '../core/style';
import TextBlock from '../node/text';

interface CTextProps {
  id: number | string;
  /** 是否显示, 默认true */
  isVisible?: boolean;
  text?: string;
  style?: IStyle;
  textStyle?: Omit<TextStyle, 'text'>;
  onInit?(el: TextBlock): unknown;
}

export default function CText({ id, onInit, style, textStyle, text, isVisible }: CTextProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const textNode = useMemo(() => new TextBlock(id), []);

  useEffect(() => {
    onInit?.(textNode);
    return () => textNode.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    style && textNode.attr(style);
    textStyle && textNode.setTextStyle(textStyle);
    textNode.setTextStyle('text', text);
    textNode.isVisible = isVisible ?? true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, isVisible]);

  return null;
}
