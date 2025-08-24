/* eslint-disable react-refresh/only-export-components */
export interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  id?: string;
}
import {
  Body,
  BodyLarge,
  BodySmall,
  Caption,
  Code,
  Display,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Label,
  Quote,
} from './typography.components';

export {
  Body,
  BodyLarge,
  BodySmall,
  Caption,
  Code,
  Display,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Label,
  Quote,
};

export const Typography = {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  BodyLarge,
  Body,
  BodySmall,
  Caption,
  Label,
  Display,
  Code,
  Quote,
};

export default Typography;
