/* eslint-disable react/destructuring-assignment */
import React, {
  ForwardRefRenderFunction,
  Ref,
  forwardRef,
  useRef,
  useImperativeHandle,
} from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Grid, GridProps } from './Grid';

import AutoSizer from '../auto-sizer';
import { ExpandAt } from './constants';

export interface PlaceholderRenderer {
  (p: {
    rowIndex: number;
    style: React.CSSProperties;
    key: React.Key;
  }): React.ReactNode;
}

export const EXPAND_STRATEGY_COVER = 'COVER';
export const EXPAND_STRATEGY_DEFAULT = 'DEFAULT';

export type Expandable = Record<
  string /* rowIndex */,
  {
    enable: boolean;
    height: number;
    expandStrategy?:
      | typeof EXPAND_STRATEGY_COVER
      | typeof EXPAND_STRATEGY_DEFAULT;
  }
>;

export type ExpandRenderer = (
  p: {
    rowIndex: number;
    style: React.CSSProperties;
    key: React.Key;
  } & (
    | {
        expandAt: ExpandAt.LEFT | ExpandAt.RIGHT | ExpandAt.COVER;
      }
    | {
        expandAt: ExpandAt.CELL;
        columnIndex: number;
      }
  )
) => React.ReactNode;

export interface AutoSizeGridProps extends Omit<GridProps, 'width' | 'height'> {
  width?: GridProps['width'];
  height?: GridProps['height'];
}
const useStyles = createUseStyles({
  wrapper: {
    minWidth: '100%',
  },
});

// wrap grid with auto-size
const InnerAutoSizeGrid: ForwardRefRenderFunction<Grid, AutoSizeGridProps> = (
  props,
  ref
) => {
  const classes = useStyles();
  const {
    width: widthInProps,
    height: heightInProps,
    innerWrapperClassName,
    ...restProps
  } = props;

  const wrapRef = useRef<Grid>(null);

  useImperativeHandle(
    ref,
    () => ({
      // TODO: move it to inner grid
      // 避免scrollTo传入超出边界的参数导致的白屏
      scrollTo(param) {
        const resetParam: typeof param = {};

        if (
          param.scrollLeft !== undefined &&
          (props?.itemData?.estimatedTotalWidth === undefined ||
            props?.itemData?.estimatedTotalWidth > widthInProps)
        ) {
          resetParam.scrollLeft = param.scrollLeft;
        }

        if (
          param.scrollTop !== undefined &&
          (props?.itemData?.estimatedTotalHeight === undefined ||
            props?.itemData?.estimatedTotalHeight > heightInProps)
        ) {
          resetParam.scrollTop = param.scrollTop;
        }

        wrapRef.current?.scrollTo(resetParam);
      },
      scrollToItem(param) {
        wrapRef.current?.scrollToItem(param);
      },
      resetAfterIndices(param) {
        wrapRef.current?.resetAfterIndices(param);
      },
      resetAfterColumnIndex(param) {
        wrapRef.current?.resetAfterColumnIndex(param);
      },
      resetAfterRowIndex(param) {
        wrapRef.current?.resetAfterRowIndex(param);
      },
    }),
    [
      props.itemData?.estimatedTotalHeight,
      props.itemData?.estimatedTotalWidth,
      widthInProps,
      heightInProps,
    ]
  );

  const mergedInnerWrapperClassName = cx([
    classes.wrapper,
    innerWrapperClassName,
  ]);

  return (
    <AutoSizer width={widthInProps} height={heightInProps}>
      {({ width, height }) => {
        return (
          <Grid
            {...restProps}
            width={width}
            height={height}
            ref={wrapRef}
            innerWrapperClassName={mergedInnerWrapperClassName}
            // innerElementType={innerElement}
          />
        );
      }}
    </AutoSizer>
  );
};

export const AutoSizeGrid = forwardRef(InnerAutoSizeGrid) as (
  props: AutoSizeGridProps & {
    ref?: Ref<Grid>;
  }
) => React.ReactElement;
