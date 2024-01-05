import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createElement,
  CSSProperties,
  forwardRef,
  memo,
  SyntheticEvent,
  useImperativeHandle,
  Ref,
  ForwardRefRenderFunction,
} from 'react';

import { getRTLOffsetType, getScrollbarSize } from './domHelpers';
import { ExpandAt } from './constants';
import { ItemSize, InstanceProps, ItemMetadataMap } from './types';
import { GetMetadata, getColumnMetadata, getRowMetadata } from './utils';
import { useInitialRef } from './hooks/useInitialRef';
import { useForceUpdate } from './hooks/useForceUpdate';

type Direction = 'ltr' | 'rtl';
export type ScrollToAlign = 'auto' | 'smart' | 'center' | 'start' | 'end';

export type RenderCellProps = {
  columnIndex: number;
  data: any;
  isScrolling?: boolean;
  rowIndex: number;
  style: CSSProperties;
  key: React.Key;
};

export type RenderCell = (p: RenderCellProps) => React.ReactNode;

type ScrollDirection = 'forward' | 'backward';

type OnScrollCallback = (p: {
  horizontalScrollDirection: ScrollDirection;
  scrollLeft: number;
  scrollTop: number;
  scrollUpdateWasRequested: boolean;
  verticalScrollDirection: ScrollDirection;
}) => void;

type ScrollEvent = SyntheticEvent<HTMLDivElement>;

export type GridProps = {
  // required
  children: RenderCell;
  columnCount: number;
  columnWidth: ItemSize;
  rowCount: number;
  rowHeight: ItemSize;
  height: number;
  width: number;
  estimatedTotalHeight: number;
  estimatedTotalWidth: number;
  // partial
  itemData?: any;
  useIsScrolling?: boolean;
  direction?: Direction;
  className?: string;
  innerWrapperClassName?: string;
  initialScrollLeft?: number;
  initialScrollTop?: number;
  innerRef?: any;
  onScroll?: OnScrollCallback;
  outerRef?: any;
  overscanColumnCount?: number;
  overscanRowCount?: number;
  style?: CSSProperties;
  fixedTopCount?: number;
  fixedLeftCount?: number;
  fixedRightCount?: number;
  // fixedBottomCount?: number,
  placeholderRenderer?: PlaceholderRenderer;
  expandable?: Expandable;
  expandRenderer?: ExpandRenderer;
  itemHeight?: ItemSize; // TODO: move it to internal
};

export type Grid = {
  scrollTo: (p: { scrollLeft?: number; scrollTop?: number }) => void;
  scrollToItem: (p: {
    columnIndex?: number;
    rowIndex?: number;
    align?: ScrollToAlign;
  }) => void;
  resetAfterIndices: (p: {
    columnIndex?: number;
    rowIndex?: number;
    shouldForceUpdate?: boolean;
  }) => void;
  resetAfterRowIndex: (rowIndex?: number, shouldForceUpdate?: boolean) => void;
  resetAfterColumnIndex: (
    columnIndex?: number,
    shouldForceUpdate?: boolean
  ) => void;
};

// 管理grid内各个区域的层级
enum Level {
  leftFixedHead = 5, // 左冻结区域 头
  leftFixedCell = 2, // 左冻结区域 列
  rightFixedHead = 4, // 右冻结 头
  rightFixedCell = 1, // 右冻结区域 列
  topFixedRow = 3, // 顶部冻结行
  // placeholderHead = 3, // 占位区域头
  placeholderCell = -2, // 占位区域cell
}

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

const findNearestItemBinarySearch = (
  itemSize: ItemSize,
  getMetadata: GetMetadata,
  instanceProps: InstanceProps,
  high: number,
  low: number,
  offset: number
): number => {
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getMetadata(itemSize, middle, instanceProps).offset;

    if (currentOffset === offset) {
      return middle;
    }
    if (currentOffset < offset) {
      low = middle + 1;
    } else if (currentOffset > offset) {
      high = middle - 1;
    }
  }

  if (low > 0) {
    return low - 1;
  }
  return 0;
};

const findNearestItemExponentialSearch = (
  itemCount: number,
  itemSize: ItemSize,
  getMetadata: GetMetadata,
  instanceProps: InstanceProps,
  index: number,
  offset: number
): number => {
  let interval = 1;

  while (
    index < itemCount &&
    getMetadata(itemSize, index, instanceProps).offset < offset
  ) {
    index += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch(
    itemSize,
    getMetadata,
    instanceProps,
    Math.min(index, itemCount - 1),
    Math.floor(index / 2),
    offset
  );
};

const findNearestItem = (
  itemSize: ItemSize,
  itemCount: number,
  getMetadata: GetMetadata,
  itemMetadataMap: ItemMetadataMap,
  lastMeasuredIndex: number,
  instanceProps: InstanceProps,
  offset: number
): number => {
  const lastMeasuredItemOffset =
    lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0;

  if (lastMeasuredItemOffset >= offset) {
    // 已测高度 > 需测高度，用二分查找
    return findNearestItemBinarySearch(
      itemSize,
      getMetadata,
      instanceProps,
      lastMeasuredIndex,
      0,
      offset
    );
  }
  // 已测高度 < 需测高度，用指数查找
  return findNearestItemExponentialSearch(
    itemCount,
    itemSize,
    getMetadata,
    instanceProps,
    Math.max(0, lastMeasuredIndex),
    offset
  );
};

const getOffsetForIndexAndAlignment = (
  size: number,
  itemSize: ItemSize,
  getMetadata: GetMetadata,
  estimatedTotalSize: number,
  index: number,
  align: ScrollToAlign,
  scrollOffset: number,
  instanceProps: InstanceProps,
  scrollbarSize: number
) => {
  const itemMetadata = getMetadata(itemSize, index, instanceProps);

  const maxOffset = Math.max(
    0,
    Math.min(estimatedTotalSize - size, itemMetadata.offset)
  );
  const minOffset = Math.max(
    0,
    itemMetadata.offset - size + scrollbarSize + itemMetadata.size
  );

  if (align === 'smart') {
    if (scrollOffset >= minOffset - size && scrollOffset <= maxOffset + size) {
      align = 'auto';
    } else {
      align = 'center';
    }
  }

  switch (align) {
    case 'start':
      return maxOffset;
    case 'end':
      return minOffset;
    case 'center':
      return Math.round(minOffset + (maxOffset - minOffset) / 2);
    case 'auto':
    default:
      if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
        return scrollOffset;
      }
      if (minOffset > maxOffset) {
        return minOffset;
      }
      if (scrollOffset < minOffset) {
        return minOffset;
      }
      return maxOffset;
  }
};

function initInstanceProps() {
  return {
    columnMetadataMap: {},
    lastMeasuredColumnIndex: -1,
    lastMeasuredRowIndex: -1,
    rowMetadataMap: {},
  };
}

function getAnObj(): any {
  return {};
}

const defaultExpandable: Expandable = {};

const InnerGrid: ForwardRefRenderFunction<Grid, GridProps> = (props, ref) => {
  const {
    initialScrollLeft,
    initialScrollTop,
    width,
    height,
    className,
    innerWrapperClassName,
    direction = 'ltr',
    style,
    estimatedTotalHeight,
    estimatedTotalWidth,
    columnCount,
    overscanColumnCount,
    rowCount,
    overscanRowCount,
    children,
    itemData,
    useIsScrolling = false,
    rowHeight,
    columnWidth,
    onScroll,

    fixedTopCount = 0,
    fixedLeftCount = 0,
    fixedRightCount = 0,
    // fixedBottomCount = 0
    placeholderRenderer,
    expandable: customizeExpandable,
    expandRenderer,
    itemHeight: customizeItemHeight,
  } = props;

  const [isScrolling, setIsScrolling] = useState(false);
  const [horizontalScrollDirection, setHorizontalScrollDirection] =
    useState<ScrollDirection>('forward');
  const [verticalScrollDirection, setVerticalScrollDirection] =
    useState<ScrollDirection>('forward');
  const [scrollLeft, setScrollLeft] = useState(
    typeof initialScrollLeft === 'number' ? initialScrollLeft : 0
  );
  const [scrollTop, setScrollTop] = useState(
    typeof initialScrollTop === 'number' ? initialScrollTop : 0
  );
  const [scrollUpdateWasRequested, setScrollUpdateWasRequested] =
    useState(false);

  const forceUpdate = useForceUpdate();

  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const instanceProps = useInitialRef<InstanceProps>(initInstanceProps);

  // 第一个右冻结列的下标
  const indexOfFirstRightFixedCol = columnCount - fixedRightCount;

  const hasVerticalScrollbar = height < estimatedTotalHeight;
  const adjustmentWidth =
    (hasVerticalScrollbar ? Math.max(getScrollbarSize(), 0) : 0) +
    2; /** borderedGrid ? 2 : 0 */
  const adjustmentForRightFixed = adjustmentWidth - 1;

  const enableExpandable = !!customizeExpandable && expandRenderer;
  const expandable = customizeExpandable ?? defaultExpandable;
  const itemHeight = customizeItemHeight ?? rowHeight;

  const [yieldAtTop, yieldAtLeft, yieldAtRight] = useMemo(() => {
    let _yieldAtTop = 0;
    let _yieldAtLeft = 0;
    let _yieldAtRight = 0;

    for (let i = 0; i < fixedTopCount; i++) {
      _yieldAtTop += rowHeight(i);
    }

    for (let i = 0; i < fixedLeftCount; i++) {
      _yieldAtLeft += columnWidth(i);
    }

    for (let i = indexOfFirstRightFixedCol; i < columnCount; i++) {
      _yieldAtRight += columnWidth(i);
    }

    return [_yieldAtTop, _yieldAtLeft, _yieldAtRight];
  }, [
    fixedTopCount,
    fixedLeftCount,
    columnCount,
    columnWidth,
    rowHeight,
    indexOfFirstRightFixedCol,
  ]);

  const getColumnStopIndexForStartIndex = useCallback(
    (startIndex: number): number => {
      const itemMetadata = getColumnMetadata(
        columnWidth,
        startIndex,
        instanceProps.current
      );
      const maxOffset = scrollLeft + width - yieldAtRight;
      let offset = itemMetadata.offset + itemMetadata.size;
      let stopIndex = startIndex;

      while (stopIndex < columnCount - 1 && offset < maxOffset) {
        stopIndex++;
        offset += getColumnMetadata(
          columnWidth,
          stopIndex,
          instanceProps.current
        ).size;
      }

      return stopIndex;
    },
    [rowHeight, scrollLeft, width, columnCount, yieldAtRight]
  );

  // 获取列开始~结束
  const _getHorizontalRangeToRender = useCallback((): [number, number] => {
    const overscanCountResolved = overscanColumnCount || 1;

    if (columnCount === 0 || rowCount === 0) {
      return [0, 0];
    }

    const startIndex = findNearestItem(
      columnWidth,
      columnCount,
      getColumnMetadata,
      instanceProps.current.columnMetadataMap,
      instanceProps.current.lastMeasuredColumnIndex,
      instanceProps.current,
      scrollLeft + yieldAtLeft
    );
    const stopIndex = getColumnStopIndexForStartIndex(startIndex);

    const overscanBackward =
      !isScrolling || horizontalScrollDirection === 'backward'
        ? Math.max(1, overscanCountResolved)
        : 1;

    const overscanForward =
      !isScrolling || horizontalScrollDirection === 'forward'
        ? Math.max(1, overscanCountResolved)
        : 1;

    return [
      Math.max(fixedLeftCount, startIndex - overscanBackward),
      Math.max(
        0,
        Math.min(
          columnCount - 1,
          stopIndex + overscanForward,
          indexOfFirstRightFixedCol - 1
        )
      ),
    ];
  }, [
    fixedLeftCount,
    getColumnStopIndexForStartIndex,
    overscanColumnCount,
    horizontalScrollDirection,
    isScrolling,
    indexOfFirstRightFixedCol,
    yieldAtLeft,
  ]);

  const getRowStopIndexForStartIndex = useCallback(
    (startIndex: number) => {
      const itemMetadata = getRowMetadata(
        rowHeight,
        startIndex,
        instanceProps.current
      );
      const maxOffset = scrollTop + height;

      let offset = itemMetadata.offset + itemMetadata.size;
      let stopIndex = startIndex;

      while (stopIndex < rowCount - 1 && offset < maxOffset) {
        stopIndex++;
        offset += getRowMetadata(
          rowHeight,
          stopIndex,
          instanceProps.current
        ).size;
      }

      return stopIndex;
    },
    [rowHeight, scrollTop, height, rowCount]
  );

  // 获取行开始~结束
  const _getVerticalRangeToRender = useCallback((): [number, number] => {
    const overscanCountResolved = overscanRowCount || 1;

    if (columnCount === 0 || rowCount === 0) {
      return [0, 0];
    }

    const startIndex = findNearestItem(
      rowHeight,
      rowCount,
      getRowMetadata,
      instanceProps.current.rowMetadataMap,
      instanceProps.current.lastMeasuredRowIndex,
      instanceProps.current,
      scrollTop + yieldAtTop
    );
    const stopIndex = getRowStopIndexForStartIndex(startIndex);

    const overscanBackward =
      !isScrolling || verticalScrollDirection === 'backward'
        ? Math.max(1, overscanCountResolved)
        : 1;
    const overscanForward =
      !isScrolling || verticalScrollDirection === 'forward'
        ? Math.max(1, overscanCountResolved)
        : 1;

    return [
      Math.max(fixedTopCount, startIndex - overscanBackward),
      Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
    ];
  }, [
    getRowStopIndexForStartIndex,
    overscanRowCount,
    verticalScrollDirection,
    isScrolling,
    fixedTopCount,
    yieldAtTop,
  ]);

  // 累加[start, end]的行高
  const sumRowsHeights = useCallback(
    (end: number, start = 0) => {
      let sum = 0;
      let i = start;

      while (end >= i) {
        sum += rowHeight(i);

        i++;
      }

      return sum;
    },
    [rowHeight]
  );

  const scrollTo: Grid['scrollTo'] = useCallback(
    ({ scrollLeft: toScrollLeft, scrollTop: toScrollTop }) => {
      if (toScrollLeft !== undefined) {
        toScrollLeft = Math.max(0, toScrollLeft);
      }
      if (toScrollTop !== undefined) {
        toScrollTop = Math.max(0, toScrollTop);
      }

      setScrollLeft((prevScrollLeft) => {
        if (toScrollLeft === undefined) {
          toScrollLeft = prevScrollLeft;
        }

        if (toScrollLeft === prevScrollLeft) {
          return prevScrollLeft;
        }

        setHorizontalScrollDirection(
          prevScrollLeft < toScrollLeft ? 'forward' : 'backward'
        );
        return toScrollLeft;
      });
      setScrollTop((prevScrollTop) => {
        if (toScrollTop === undefined) {
          toScrollTop = prevScrollTop;
        }

        if (toScrollTop === prevScrollTop) {
          return prevScrollTop;
        }

        setVerticalScrollDirection(
          prevScrollTop < toScrollTop ? 'forward' : 'backward'
        );
        return toScrollTop;
      });
    },
    []
  );

  const itemStyleCache = useInitialRef<Record<string, CSSProperties>>(getAnObj);

  const _getItemStyle = useCallback(
    (rowIndex: number, columnIndex: number): CSSProperties => {
      const key = `${rowIndex}:${columnIndex}`;

      let _style: CSSProperties;
      if (itemStyleCache.current[key]) {
        _style = itemStyleCache.current[key];
      } else {
        const { offset } = getColumnMetadata(
          columnWidth,
          columnIndex,
          instanceProps.current
        );
        const isRtl = direction === 'rtl';
        itemStyleCache.current[key] = _style = {
          position: 'absolute',
          left: isRtl ? undefined : offset,
          right: isRtl ? offset : undefined,
          top: getRowMetadata(rowHeight, rowIndex, instanceProps.current)
            .offset,
          height: instanceProps.current.rowMetadataMap[rowIndex].size,
          width: instanceProps.current.columnMetadataMap[columnIndex].size,
        };
      }

      if (enableExpandable) {
        _style = {
          position: 'absolute',
          left: _style.left,
          right: _style.right,
          top: _style.top,
          height:
            (_style.height as number) -
            (expandable[rowIndex]?.enable
              ? expandable[rowIndex].height
              : 0 ?? 0),
          width: _style.width,
        };
      }

      return _style;
    },
    [
      direction,
      columnWidth,
      rowHeight,
      enableExpandable,
      itemHeight,
      expandable,
    ]
  );

  const resetAfterIndices: Grid['resetAfterIndices'] = useCallback(
    ({ columnIndex, rowIndex, shouldForceUpdate = true }) => {
      if (typeof columnIndex === 'number') {
        instanceProps.current.lastMeasuredColumnIndex = Math.min(
          instanceProps.current.lastMeasuredColumnIndex,
          columnIndex - 1
        );
      }

      if (typeof columnIndex === 'number') {
        instanceProps.current.lastMeasuredRowIndex = Math.min(
          instanceProps.current.lastMeasuredRowIndex,
          rowIndex - 1
        );
      }

      itemStyleCache.current = {};

      if (shouldForceUpdate) {
        forceUpdate();
      }
    },
    [forceUpdate]
  );

  useImperativeHandle(
    ref,
    () =>
      ({
        scrollTo,
        scrollToItem: ({ align = 'auto', columnIndex, rowIndex }) => {
          const scrollbarSize = getScrollbarSize();

          if (columnIndex !== undefined) {
            columnIndex = Math.max(0, Math.min(columnIndex, columnCount - 1));
          }
          if (rowIndex !== undefined) {
            rowIndex = Math.max(0, Math.min(rowIndex, rowCount - 1));
          }

          const horizontalScrollbarSize =
            estimatedTotalWidth > width ? scrollbarSize : 0;

          const verticalScrollbarSize =
            estimatedTotalHeight > height ? scrollbarSize : 0;

          scrollTo({
            scrollLeft:
              columnIndex !== undefined
                ? getOffsetForIndexAndAlignment(
                    width,
                    columnWidth,
                    getColumnMetadata,
                    estimatedTotalWidth,
                    columnIndex,
                    align,
                    scrollLeft,
                    instanceProps.current,
                    verticalScrollbarSize
                  )
                : undefined,
            scrollTop:
              rowIndex !== undefined
                ? getOffsetForIndexAndAlignment(
                    height,
                    rowHeight,
                    getRowMetadata,
                    estimatedTotalHeight,
                    rowIndex,
                    align,
                    scrollTop,
                    instanceProps.current,
                    horizontalScrollbarSize
                  )
                : undefined,
          });
        },
        resetAfterIndices,
        resetAfterRowIndex(rowIndex, shouldForceUpdate = true) {
          resetAfterIndices({ rowIndex, shouldForceUpdate });
        },
        resetAfterColumnIndex(columnIndex, shouldForceUpdate = true) {
          resetAfterIndices({ columnIndex, shouldForceUpdate });
        },
      }) as Grid,
    [
      scrollTo,
      resetAfterIndices,
      columnCount,
      rowCount,
      scrollLeft,
      scrollTop,
      rowHeight,
      columnWidth,
      estimatedTotalHeight,
      estimatedTotalWidth,
      width,
      height,
    ]
  );

  const [columnStartIndex, columnStopIndex] = _getHorizontalRangeToRender();
  const [rowStartIndex, rowStopIndex] = _getVerticalRangeToRender();

  // const _callPropsCallbacks = () => {
  //   // TODO: call onScroll
  // }

  useEffect(() => {
    onScroll?.({
      scrollLeft,
      scrollTop,
      verticalScrollDirection,
      horizontalScrollDirection,
      scrollUpdateWasRequested: false,
    });
  }, [
    scrollLeft,
    scrollTop,
    verticalScrollDirection,
    horizontalScrollDirection,
  ]);

  const _onScroll = useCallback(
    (event: ScrollEvent) => {
      const {
        clientHeight,
        clientWidth,
        scrollLeft: latestScrollLeft,
        scrollTop: latestScrollTop,
        scrollHeight,
        scrollWidth,
      } = event.currentTarget;

      // setIsScrolling(true) // TODO: is scrolling debounce
      // setScrollUpdateWasRequested(false) // TODO: scrollUpdateWasRequested
      setScrollLeft((prevScrollLeft) => {
        if (prevScrollLeft === latestScrollLeft) {
          // 避免造成冗余的render
          return prevScrollLeft;
        }

        let calculatedScrollLeft = latestScrollLeft;
        if (direction === 'rtl') {
          switch (getRTLOffsetType()) {
            case 'negative':
              calculatedScrollLeft = -latestScrollLeft;
              break;
            case 'positive-ascending':
              calculatedScrollLeft =
                scrollWidth - clientWidth - latestScrollLeft;
              break;
            default:
              break;
          }
        }

        calculatedScrollLeft = Math.max(
          0,
          Math.min(calculatedScrollLeft, scrollWidth - clientWidth)
        );

        setHorizontalScrollDirection(
          prevScrollLeft < latestScrollLeft ? 'forward' : 'backward'
        );
        return calculatedScrollLeft;
      });

      setScrollTop((prevScrollTop) => {
        if (prevScrollTop === latestScrollTop) {
          // 避免造成冗余的render
          return prevScrollTop;
        }

        const calculatedScrollTop = Math.max(
          0,
          Math.min(latestScrollTop, scrollHeight - clientHeight)
        );

        setVerticalScrollDirection(
          prevScrollTop < latestScrollTop ? 'forward' : 'backward'
        );

        return calculatedScrollTop;
      });
    },
    [direction]
  );

  useEffect(() => {
    if (outerRef.current !== null) {
      // TODO: set initialScrollLeft、initialScrollTop for outerRef
    }

    // _callPropsCallbacks()
  }, []);

  // ============================== render ==============================
  // ============================== 普通单元格 ==============================
  const items = [];
  if (columnCount > 0 && rowCount) {
    for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
      for (
        let columnIndex = columnStartIndex;
        columnIndex <= columnStopIndex;
        columnIndex++
      ) {
        items.push(
          children({
            columnIndex,
            data: itemData,
            isScrolling: useIsScrolling ? isScrolling : undefined,
            key: `${rowIndex}:${columnIndex}`,
            rowIndex,
            style: _getItemStyle(rowIndex, columnIndex),
          })
        );
      }

      // ============================== 行展开(!==EXPAND_STRATEGY_COVER) ==============================
      if (enableExpandable) {
        if (
          expandable[rowIndex]?.enable &&
          expandable[rowIndex].expandStrategy !== EXPAND_STRATEGY_COVER
        ) {
          const { top, height: targetHeight } =
            items[items.length - 1].props.style;

          let indexOfColStart =
            items.length - (columnStopIndex - columnStartIndex + 1);
          for (let j = columnStartIndex; j <= columnStopIndex; j++) {
            items.push(
              expandRenderer({
                key: `__expand:${rowIndex}:${j}`,
                style: {
                  position: 'absolute',
                  left: items[indexOfColStart].props.style.left,
                  top: top + targetHeight,
                  width: columnWidth(j),
                  background: 'rgba(0, 0, 255, .1)',
                  height: expandable[rowIndex].height,
                },
                expandAt: ExpandAt.CELL,
                rowIndex,
                columnIndex: j,
              })
            );
            indexOfColStart++;
          }
        }
      }
    }
  }

  const topFromWrapper = items[0].props.style.top;

  // ============================== 左上冻结cell ==============================
  let sumLeftFixedWidth = 0;
  for (let i = 0; i < fixedLeftCount; i++) {
    const currentColumnWidth = columnWidth(i);
    items.push(
      children({
        key: `0:${i}`,
        rowIndex: 0,
        columnIndex: i,
        style: {
          display: 'inline-flex',
          width: currentColumnWidth,
          height: rowHeight(0),
          position: 'sticky',
          top: 0,
          left: sumLeftFixedWidth,
          zIndex: Level.leftFixedHead,
          // background: 'red',
        },
        data: itemData,
      })
    );
    sumLeftFixedWidth += currentColumnWidth;
  }

  // ============================== 右上冻结cell ==============================
  if (fixedRightCount) {
    let sumRightFixedWidth = yieldAtRight;

    for (let i = indexOfFirstRightFixedCol; i < columnCount; i++) {
      const currentColumnWidth = columnWidth(i);
      items.push(
        children({
          key: `0:${i}`,
          rowIndex: 0,
          columnIndex: i,
          style: {
            display: 'inline-flex',
            width: currentColumnWidth,
            height: rowHeight(0),
            position: 'sticky',
            top: 0,
            left: width - sumRightFixedWidth - adjustmentForRightFixed,
            zIndex: Level.rightFixedHead,
            // background: 'orange',
          },
          data: itemData,
        })
      );
      sumRightFixedWidth -= currentColumnWidth;
    }
  }

  // ============================== 顶部冻结cell ==============================
  for (let i = columnStartIndex; i <= columnStopIndex; i += 1) {
    const marginLeft =
      i === columnStartIndex
        ? items[0].props.style.left - yieldAtLeft - yieldAtRight
        : undefined;

    items.push(
      children({
        key: `${0}:${i}`,
        rowIndex: 0,
        columnIndex: i,
        style: {
          marginLeft,
          display: 'inline-flex',
          width: columnWidth(i),
          height: rowHeight(0),
          position: 'sticky',
          top: 0,
          zIndex: Level.topFixedRow,
          // background: 'green'
        },
        data: itemData,
      })
    );
  }

  // ============================== 行展开(===EXPAND_STRATEGY_COVER && 左右冻结都不存在) ==============================
  if (enableExpandable && !fixedLeftCount && !fixedRightCount) {
    const heightOfHead = itemHeight(0);

    let sumHeight = 0;
    let loopIndex = 0;

    for (let i = rowStartIndex; i <= rowStopIndex; i++) {
      if (
        expandable[i]?.enable &&
        expandable[i].expandStrategy === EXPAND_STRATEGY_COVER
      ) {
        const { top, height: targetHeight } = items.find(
          (child) => child.props.rowIndex === i
        ).props.style;

        const mt =
          loopIndex === 0
            ? top + targetHeight - heightOfHead
            : top + targetHeight - heightOfHead - sumHeight;

        items.push(
          expandRenderer({
            key: `__expand:cover:${i}`,
            style: {
              position: 'sticky',
              left: 0,
              // top: top + height,
              width,
              background: 'rgba(255, 0, 0, .1)',
              height: expandable[i].height,
              marginTop: mt,
            },
            expandAt: ExpandAt.COVER,
            rowIndex: i,
          })
        );

        sumHeight += mt + expandable[i].height;
        loopIndex++;
      }
    }
  }

  // ============================== 列宽<容器宽时的占位 ==============================
  const restOfWidth = width - estimatedTotalWidth - adjustmentWidth;
  const generatePlaceholder = restOfWidth > 0 && placeholderRenderer;

  if (generatePlaceholder) {
    items.push(
      placeholderRenderer({
        key: `__grid_placeholder:head__`,
        rowIndex: 0,
        style: {
          display: 'inline-flex',
          width: `calc(100% - ${estimatedTotalWidth}px)`,
          height: rowHeight(0),
          position: 'sticky',
          top: 0,
          zIndex: Level.topFixedRow,
          // background: 'green'
        },
      })
    );

    let sumBefore = topFromWrapper;
    for (let i = rowStartIndex; i <= rowStopIndex; i++) {
      const currentRowHeight = rowHeight(i);
      items.push(
        placeholderRenderer({
          key: `__grid_placeholder:${i}__`,
          rowIndex: i,
          style: {
            width: '100%',
            height: currentRowHeight,
            position: 'absolute',
            top: sumBefore,
            left: 0,
            zIndex: Level.placeholderCell,
            // background: 'green'
          },
        })
      );
      sumBefore += currentRowHeight;
    }
  }

  const sumRwoRenderHeight = sumRowsHeights(rowStopIndex, rowStartIndex);

  // ============================== 左冻结cell ==============================
  sumLeftFixedWidth = 0;
  for (let j = 0; j < fixedLeftCount; j++) {
    const columnIndex = j;
    const currentColumnWidth = columnWidth(columnIndex);

    for (let i = rowStartIndex; i <= rowStopIndex; i++) {
      const currentRowHeight = itemHeight(i);

      const marginTop =
        i === rowStartIndex
          ? j === 0
            ? topFromWrapper - yieldAtTop
            : -1 * sumRwoRenderHeight
          : undefined;

      items.push(
        children({
          key: `${i}:${columnIndex}`,
          rowIndex: i,
          columnIndex,
          style: {
            marginTop,
            width: currentColumnWidth,
            height: currentRowHeight,
            position: 'sticky',
            left: sumLeftFixedWidth,
            zIndex: Level.leftFixedCell,
            marginBottom:
              j !== 0 && expandable[i]?.enable ? expandable[i].height : 0,
            // background: 'blue',
          },
          data: itemData,
        })
      );

      // 行展开
      if (enableExpandable && expandable[i]?.enable && j === 0) {
        const isCover = expandable[i].expandStrategy === EXPAND_STRATEGY_COVER;

        if (isCover) {
          // 左冻结列存在时cover的行展开由左冻结渲染
          items.push(
            expandRenderer({
              key: `__expand:cover:${i}`,
              style: {
                position: 'sticky',
                left: 0,
                width,
                background: 'rgba(255, 0, 0, .1)',
                height: expandable[i].height,
              },
              expandAt: ExpandAt.COVER,
              rowIndex: i,
            })
          );
        } else {
          // 非cover的行展开
          items.push(
            expandRenderer({
              key: `__expand:left:${i}`,
              style: {
                position: 'sticky',
                left: 0,
                width: yieldAtLeft,
                background: 'rgba(255, 0, 0, .1)',
                height: expandable[i].height,
              },
              expandAt: ExpandAt.LEFT,
              rowIndex: i,
            })
          );
        }
      }
    }
    sumLeftFixedWidth += currentColumnWidth;
  }

  // ============================== 右冻结cell ==============================
  let sumRightFixedWidth = yieldAtRight;
  for (let j = indexOfFirstRightFixedCol; j < columnCount; j++) {
    const currentColumnWidth = columnWidth(j);
    for (let i = rowStartIndex; i <= rowStopIndex; i += 1) {
      const currentRowHeight = itemHeight(i);

      const marginTop =
        i === rowStartIndex
          ? j === indexOfFirstRightFixedCol && !fixedLeftCount
            ? topFromWrapper - yieldAtTop
            : sumRwoRenderHeight * -1
          : undefined;

      items.push(
        children({
          key: `${i}:${j}`,
          rowIndex: i,
          columnIndex: j,
          style: {
            marginTop,
            width: currentColumnWidth,
            height: currentRowHeight,
            position: 'sticky',
            left: width - sumRightFixedWidth - adjustmentForRightFixed,
            // transform: `translateX(-${sumRightFixedWidth}px)`,
            zIndex: Level.rightFixedCell,
            marginBottom:
              j !== indexOfFirstRightFixedCol && expandable[i]?.enable
                ? expandable[i].height
                : 0,
          },
          data: itemData,
        })
      );

      if (
        enableExpandable &&
        j === indexOfFirstRightFixedCol &&
        expandable[i]?.enable
      ) {
        const isCover = expandable[i].expandStrategy === EXPAND_STRATEGY_COVER;

        if (!isCover) {
          // 非cover的行展开
          items.push(
            expandRenderer({
              key: `__expand:right:${i}`,
              style: {
                position: 'sticky',
                left: width - sumRightFixedWidth - adjustmentForRightFixed,
                width: yieldAtRight,
                background: 'rgba(0, 255, 0, .1)',
                height: expandable[i].height,
              },
              expandAt: ExpandAt.RIGHT,
              rowIndex: i,
            })
          );
        } else if (!fixedLeftCount) {
          // cover + 左冻结不存在时右冻结渲染cover的行展开
          items.push(
            expandRenderer({
              key: `__expand:cover:${i}`,
              style: {
                position: 'sticky',
                left: 0,
                width,
                background: 'rgba(255, 0, 0, .1)',
                height: expandable[i].height,
              },
              expandAt: ExpandAt.COVER,
              rowIndex: i,
            })
          );
        } else {
          // cover + 左冻结存在时右冻结渲染一个占位保证右冻结列的位置
          items.push(
            createElement('div', {
              key: `__expand:shadow:${i}`,
              style: {
                position: 'sticky',
                left: width - sumRightFixedWidth - adjustmentForRightFixed,
                width: yieldAtRight,
                height: expandable[i].height,
                opacity: 0,
                pointerEvents: 'none',
              },
            })
          );
        }
      }
    }

    sumRightFixedWidth -= currentColumnWidth;
  }

  return (
    <div
      className={className}
      onScroll={_onScroll}
      ref={outerRef}
      style={{
        position: 'relative',
        height,
        width,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        willChange: 'transform',
        direction,
        ...style,
      }}
    >
      <div
        ref={innerRef}
        className={innerWrapperClassName}
        style={{
          height: estimatedTotalHeight,
          pointerEvents: isScrolling ? 'none' : undefined,
          // pointerEvents: 'none',
          width: estimatedTotalWidth,
        }}
      >
        {items}
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Grid = memo(forwardRef(InnerGrid)) as (
  props: GridProps & {
    ref?: Ref<Grid>;
  }
) => React.ReactElement;
