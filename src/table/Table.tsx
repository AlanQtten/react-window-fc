/* eslint-disable no-nested-ternary */
import React, {
  CSSProperties,
  ForwardRefRenderFunction,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Checkbox, CheckboxProps } from 'antd';

import {
  AutoSizeGrid,
  AutoSizeGridProps,
  ExpandAt,
  ExpandRenderer,
  Expandable,
  Grid,
  PlaceholderRenderer,
  areEqual,
} from '../grid';

const internalClassNameSymbol = '__cellClassName__';

type RowData = {
  key: React.Key;
  [k: string]: any;
};

type HeaderRenderProps = {
  column: Column;
  rowSelection: RowSelection;
  tableData: RowData[];
};

type CellRenderProps = {
  column: Column;
  rowData: RowData;
  rowSelection: RowSelection;
  rowIndex: number;
  columnIndex: number;
};

type RowSelection = {
  selectedRowKeys: React.Key[];
  selectedRows: any[];
  onChange: ({
    selectedRowKeys,
    selectedRows,
  }: {
    selectedRowKeys: RowSelection['selectedRowKeys'];
    selectedRows: RowSelection['selectedRows'];
  }) => void;
  getCheckboxProps: (rowData: any) => Pick<CheckboxProps, 'disabled'>;
};

export type Column = {
  key: React.Key;
  cellRenderer: (p: CellRenderProps) => React.ReactNode;
  width: number;
  // partial
  headerRenderer?: (p: HeaderRenderProps) => React.ReactNode;
  title?: string;
  frozen?: boolean | 'left' | 'right';
  hidden?: boolean;
  headerClassName?: string;
  className?: string;
  // internal
  [internalClassNameSymbol]?: string;
};

const isLeft = (frozen: Column['frozen']) =>
  frozen === true || frozen === 'left';
const isRight = (frozen: Column['frozen']) => frozen === 'right';

export interface TableProps
  extends Pick<AutoSizeGridProps, 'overscanColumnCount' | 'overscanRowCount'> {
  rowHeight: number;
  rowKey: string;
  // partial
  headHeight?: number;
  columns?: Column[];
  data?: RowData[];
  rowSelection?: RowSelection;
  expandable?: Expandable;
  expandRenderer?: (
    p: Parameters<ExpandRenderer>[0],
    className?: string,
    columns?: Column[] | Column
  ) => React.ReactNode;
}

const Cell = memo<{
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  data: any;
}>(({ columnIndex, rowIndex, style, data }) => {
  const column = data.columns[columnIndex];
  const isHead = rowIndex === 0;
  const isOdd = rowIndex % 2 === 0;

  return (
    <div
      className={cx([
        data.classes.cell,
        isHead
          ? [data.classes.headCell, column.headerClassName]
          : [column.className, isOdd && data.classes.oddRow],
        column[internalClassNameSymbol],
      ])}
      style={style}
      // key={`${rowIndex}-${columnIndex}-cell`}
    >
      {isHead
        ? column.headerRenderer
          ? column.headerRenderer({
              column,
              rowSelection: data.rowSelection,
              tableData: data.tableData,
            })
          : column.title
        : column.cellRenderer({
            column,
            rowData: data.tableData[rowIndex - 1],
            rowSelection: data.rowSelection,
            rowIndex,
            columnIndex,
          })}
    </div>
  );
}, areEqual);

const useStyles = createUseStyles({
  wrapper: {
    border: '1px solid #eee',
  },
  cell: {
    borderRight: '1px solid #eee',
    borderBottom: '1px solid #969daf',
    boxSizing: 'border-box',
    verticalAlign: 'middle',
    background: '#fff',
  },
  placeholderCell: {
    borderBottom: '1px solid #969daf',
    boxSizing: 'border-box',
    verticalAlign: 'middle',
    background: '#fff',
  },
  headCell: {
    background: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
  },
  cellInLastCol: {
    borderRight: 'none',
  },
  cellInLastLeftFixedCol: {
    borderRight: 'none',
    '&::after': {
      width: 30,
      content: "''",
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: -30,
      boxShadow: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.15)',
      pointerEvents: 'none',
    },
  },
  cellInRightFixedCol: {
    borderRight: 'none',
    borderLeft: '1px solid #eee',
  },
  cellInFirstRightFixedCol: {
    borderLeft: 'none',
    '&::before': {
      width: 30,
      content: "''",
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: -30,
      boxShadow: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.15)',
      pointerEvents: 'none',
    },
  },
  selectCell: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oddRow: {
    background: '#f3f6f9',
  },
});

type TableFunc = {
  // someOtherFunc: any
};

export interface TableRef extends Grid, TableFunc {}

const defaultExpandRenderer: TableProps['expandRenderer'] = (p) => {
  return <div key={p.key} style={p.style} />;
};

const InnerTable: ForwardRefRenderFunction<TableRef, TableProps> = (
  props,
  ref
) => {
  const {
    columns: customizeColumns,
    data,
    headHeight = 32,
    rowHeight: customizeRowHeight,
    rowKey,
    overscanColumnCount,
    overscanRowCount,
    rowSelection,
    expandable,
    expandRenderer: customizeExpandRenderer = defaultExpandRenderer,
  } = props;

  const classes = useStyles();

  const grid = useRef<Grid>(null);

  const total = data?.length ?? 0;

  const showSelection = !!rowSelection;

  const selectCol = useMemo<Column | null>(() => {
    if (!showSelection) {
      return null;
    }

    return {
      width: 40,
      headerRenderer({ rowSelection: latestRowSelection, tableData }) {
        return (
          <Checkbox
            indeterminate={
              latestRowSelection.selectedRowKeys.length > 0 &&
              latestRowSelection.selectedRowKeys.length !== total
            }
            checked={
              tableData.length === latestRowSelection.selectedRowKeys.length &&
              tableData.length !== 0
            }
            onChange={(e) => {
              if (e.target.checked) {
                latestRowSelection.onChange({
                  selectedRowKeys: tableData.map((row) => row[rowKey]),
                  selectedRows: tableData,
                });
              } else {
                latestRowSelection.onChange({
                  selectedRowKeys: [],
                  selectedRows: [],
                });
              }
            }}
            disabled={
              tableData.length === 0 ||
              latestRowSelection.getCheckboxProps(null).disabled
            }
          />
        );
      },
      cellRenderer({ rowData, rowSelection: latestRowSelection }) {
        return (
          <Checkbox
            checked={latestRowSelection.selectedRowKeys.includes(
              rowData[rowKey]
            )}
            onChange={(e) => {
              if (e.target.checked) {
                latestRowSelection.onChange({
                  selectedRowKeys: [
                    ...latestRowSelection.selectedRowKeys,
                    rowData[rowKey],
                  ],
                  selectedRows: [...latestRowSelection.selectedRows, rowData],
                });
              } else {
                latestRowSelection.onChange({
                  selectedRowKeys: latestRowSelection.selectedRowKeys.filter(
                    (k) => k !== rowData[rowKey]
                  ),
                  selectedRows: latestRowSelection.selectedRows.filter(
                    (row) => row[rowKey] !== rowData[rowKey]
                  ),
                });
              }
            }}
            disabled={latestRowSelection.getCheckboxProps(rowData).disabled}
          />
        );
      },
      key: '__selection__',
      frozen: 'left',
      className: classes.selectCell,
    };
  }, [rowKey, total, showSelection, classes]);

  const [
    columns,
    fixedLeftColumns,
    fixedRightColumns,
    fixedLeftCount,
    fixedRightCount,
  ] = useMemo(() => {
    const cols = customizeColumns?.filter((col) => !col.hidden) ?? [];
    if (!cols.length) {
      return [[], [], [], 0, 0];
    }

    const [leftFixedColumns, normalColumns, rightFixedColumns] = cols.reduce<
      [Column[], Column[], Column[]]
    >(
      ([lfCols, normalCols, rfCols], col) => {
        if (isRight(col.frozen)) {
          rfCols.push(col);
        } else if (isLeft(col.frozen)) {
          lfCols.push(col);
        } else {
          normalCols.push(col);
        }

        return [lfCols, normalCols, rfCols];
      },
      [[], [], []]
    );
    if (selectCol) {
      leftFixedColumns.unshift(selectCol);
    }

    const flc = leftFixedColumns.length;
    const frc = rightFixedColumns.length;
    const countOfCol =
      leftFixedColumns.length + normalColumns.length + rightFixedColumns.length;
    const startOfRightFixed = countOfCol - frc;

    return [
      [...leftFixedColumns, ...normalColumns, ...rightFixedColumns].map(
        (col, colIndex) =>
          ({
            ...col,
            [internalClassNameSymbol]: cx({
              [classes.cellInLastCol]: colIndex === countOfCol - 1,
              [classes.cellInLastLeftFixedCol]: flc && colIndex === flc - 1,
              [classes.cellInRightFixedCol]:
                frc && colIndex >= startOfRightFixed,
              [classes.cellInFirstRightFixedCol]:
                frc && colIndex === startOfRightFixed,
            }),
          }) as Column
      ),
      leftFixedColumns,
      rightFixedColumns,
      flc,
      frc,
    ];
  }, [selectCol, customizeColumns, classes]);

  const ready = useMemo(() => {
    return !!columns?.length;
  }, [columns]);

  const columnWidthGetter = useMemo(() => {
    if (columns?.length) {
      return (index: number) => {
        return columns?.[index]?.width ?? 32;
      };
    }
    return () => 32;
  }, [columns]);

  const rowHeightGetter = useMemo(() => {
    return expandable
      ? (index: number) => {
          return index === 0
            ? headHeight
            : expandable?.[index]?.enable
              ? customizeRowHeight + expandable[index].height
              : customizeRowHeight;
        }
      : (index: number) => {
          return index === 0 ? headHeight : customizeRowHeight;
        };
  }, [customizeRowHeight, headHeight, expandable]);

  const itemHeightGetter = useMemo(() => {
    return expandable
      ? (index: number) => {
          return index === 0 ? headHeight : customizeRowHeight;
        }
      : undefined;
  }, [customizeRowHeight, headHeight, expandable]);

  const estimatedTotalWidth = useMemo(() => {
    return columns.reduce((totalWidth, col) => totalWidth + col.width, 0);
  }, [columns]);

  const estimatedTotalHeight = useMemo(() => {
    return (
      headHeight +
      (data?.length ?? 0) * customizeRowHeight +
      (expandable
        ? Object.keys(expandable).reduce((totalHeight, key) => {
            return (
              totalHeight +
              (expandable[key].enable ? expandable[key].height : 0)
            );
          }, 0)
        : 0)
    );
  }, [headHeight, data, customizeRowHeight, expandable]);

  const placeholderRenderer: PlaceholderRenderer = ({
    rowIndex,
    style,
    key,
  }) => {
    const isHead = rowIndex === 0;
    const isOdd = rowIndex % 2 === 0;

    return (
      <div
        className={cx([
          classes.placeholderCell,
          {
            [classes.headCell]: isHead,
            [classes.oddRow]: isOdd,
          },
        ])}
        style={style}
        key={key}
      />
    );
  };

  const expandRenderer: ExpandRenderer = (param) => {
    if (param.expandAt === ExpandAt.LEFT) {
      return customizeExpandRenderer(
        param,
        classes.cellInLastLeftFixedCol,
        fixedLeftColumns
      );
    }
    if (param.expandAt === ExpandAt.RIGHT) {
      return customizeExpandRenderer(
        param,
        classes.cellInFirstRightFixedCol,
        fixedRightColumns
      );
    }
    if (param.expandAt === ExpandAt.COVER) {
      return customizeExpandRenderer(param);
    }
    if (param.expandAt === ExpandAt.CELL) {
      return customizeExpandRenderer(param, '', columns[param.columnIndex]);
    }

    return defaultExpandRenderer(param);
  };

  useEffect(() => {
    if (columns?.length && grid.current) {
      grid.current.resetAfterIndices({
        rowIndex: 0,
        columnIndex: 0,
      });
    }
  }, [columns, expandable]);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo(...param) {
        grid.current?.scrollTo(...param);
      },
      scrollToItem(...param) {
        grid.current?.scrollToItem(...param);
      },
      resetAfterColumnIndex(...param) {
        grid.current?.resetAfterColumnIndex(...param);
      },
      resetAfterRowIndex(...param) {
        grid.current?.resetAfterRowIndex(...param);
      },
      resetAfterIndices(...param) {
        grid.current?.resetAfterIndices(...param);
      },
    }),
    []
  );

  const itemData = useMemo(() => {
    return {
      columns,
      classes,
      tableData: data,
      rowSelection,
    };
  }, [columns, classes, data, rowSelection]);

  if (!ready) {
    return null;
  }

  // console.log(customizeColumns);

  return (
    <AutoSizeGrid
      className={classes.wrapper}
      columnCount={columns.length}
      rowCount={(data?.length ?? 0) + 1}
      rowHeight={rowHeightGetter}
      itemHeight={itemHeightGetter}
      placeholderRenderer={placeholderRenderer}
      expandable={expandable}
      expandRenderer={expandRenderer}
      columnWidth={columnWidthGetter}
      ref={grid}
      // itemData={{
      //   columns,
      //   classes,
      //   tableData: data,
      //   rowSelection,
      // }}
      overscanColumnCount={overscanColumnCount}
      overscanRowCount={overscanRowCount}
      estimatedTotalWidth={estimatedTotalWidth}
      estimatedTotalHeight={estimatedTotalHeight}
      fixedLeftCount={fixedLeftCount}
      fixedRightCount={fixedRightCount}
      fixedTopCount={1}
    >
      {({ style, key, rowIndex, columnIndex }) => {
        return (
          <Cell
            key={key}
            style={style}
            rowIndex={rowIndex}
            columnIndex={columnIndex}
            data={itemData}
          />
        );
      }}
    </AutoSizeGrid>
  );
};

export const Table = forwardRef(InnerTable) as unknown as (
  props: TableProps & {
    ref?: TableRef;
  }
) => React.ReactElement;
