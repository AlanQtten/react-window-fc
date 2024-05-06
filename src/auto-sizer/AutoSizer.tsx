import RVAutoSizer, {
  HeightOnlyProps,
  Props,
  WidthOnlyProps,
} from 'react-virtualized-auto-sizer';

type Size = {
  width?: number;
  height?: number;
};

type AutoSizerProps = Omit<Props, 'children'> & {
  width?: number;
  height?: number;
  className?: string;
  children: (size: Required<Size>) => React.ReactNode;
};

// in case NaN
const formatter = (num: number | undefined) => num || 0;

function AutoSizer(props: AutoSizerProps) {
  const { className, width, height, children, onResize } = props;

  const disableWidth = typeof width === 'number';
  const disableHeight = typeof height === 'number';

  if (disableWidth && disableHeight) {
    return (
      <div
        className={className}
        style={{ width, height, position: 'relative' }}
      >
        {children({ width: formatter(width), height: formatter(height) })}
      </div>
    );
  }

  // for type safe
  if (!disableWidth && !disableHeight) {
    return (
      <RVAutoSizer
        className={className}
        disableWidth={false}
        disableHeight={false}
        onResize={onResize}
      >
        {(size: Size) =>
          children({
            width: formatter(disableWidth ? width : size.width),
            height: formatter(disableHeight ? height : size.height),
          })
        }
      </RVAutoSizer>
    );
  }

  if (disableWidth) {
    return (
      <RVAutoSizer
        className={className}
        disableWidth
        disableHeight={false}
        onResize={onResize as HeightOnlyProps['onResize']}
      >
        {(size: Size) =>
          children({
            width: formatter(width),
            height: formatter(disableHeight ? height : size.height),
          })
        }
      </RVAutoSizer>
    );
  }

  // if(disableHeight) {...
  return (
    <RVAutoSizer
      className={className}
      disableWidth={false}
      disableHeight
      onResize={onResize as WidthOnlyProps['onResize']}
    >
      {(size: Size) =>
        children({
          width: formatter(disableWidth ? width : size.width),
          height: formatter(height!),
        })
      }
    </RVAutoSizer>
  );
}

export default AutoSizer;
