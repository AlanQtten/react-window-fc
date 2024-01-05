/* eslint-disable react/destructuring-assignment */
import React, { ForwardRefRenderFunction, Ref, forwardRef } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Grid, GridProps } from './Grid';

import AutoSizer from '../auto-sizer';

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
            ref={ref}
            innerWrapperClassName={mergedInnerWrapperClassName}
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
