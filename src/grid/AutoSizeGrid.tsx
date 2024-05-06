import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Grid, GridProps } from './Grid';
import { AutoSizer } from '../auto-sizer';

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
export const AutoSizeGrid = (props: AutoSizeGridProps) => {
  const classes = useStyles();
  const {
    width: widthInProps,
    height: heightInProps,
    ref,
    innerWrapperClassName,
    ...restProps
  } = props;

  return (
    <AutoSizer width={widthInProps} height={heightInProps}>
      {({ width, height }) => {
        return (
          <Grid
            {...restProps}
            width={width}
            height={height}
            ref={ref}
            innerWrapperClassName={cx(classes.wrapper, innerWrapperClassName)}
          />
        );
      }}
    </AutoSizer>
  );
};
