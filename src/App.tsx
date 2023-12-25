import {
  Profiler,
  ProfilerProps,
  memo,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Typography, Button, Space } from 'antd';

import { createUseStyles } from 'react-jss';
import { Column, Table } from './table';
import { Expandable } from './grid';

type ExampleProps = {
  onRender: (duration: number) => void;
  resetRenderInfo: () => void;
};

const useExampleStyles = createUseStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: 24,
    boxSizing: 'border-box',
  },
  tableWrapper: {
    flex: 1,
  },
});

const Example = memo((props: ExampleProps) => {
  const { onRender, resetRenderInfo } = props;

  const classes = useExampleStyles();

  const onTableRender: ProfilerProps['onRender'] = (id, phase, bd) => {
    onRender(bd);
  };

  const [expandable, setExpandable] = useState<Expandable>({
    10: { enable: true, height: 100, expandStrategy: 'COVER' },
    // 11: { enable: true, height: 120 },
    // 12: { enable: true, height: 150 },
    // 20: { enable: false, height: 100 },
  });

  console.log(expandable);

  const columns = useMemo<Column[]>(() => {
    return [
      {
        key: 'item',
        title: 'item',
        headerRenderer: () => 'item',
        width: 100,
        cellRenderer: ({ rowIndex }) => rowIndex,
        frozen: 'left',
      },
      {
        key: 'site',
        title: 'site',
        headerRenderer: () => 'site',
        width: 100,
        cellRenderer: () => 'site',
        frozen: 'left',
      },
      {
        key: 'customer',
        title: 'customer',
        headerRenderer: () => 'customer',
        width: 100,
        cellRenderer: () => 'customer',
        frozen: 'left',
      },
      {
        key: 'process',
        title: 'process',
        headerRenderer: () => 'process',
        width: 200,
        cellRenderer: ({ rowIndex }) => (
          <>
            <button
              onClick={() => {
                setExpandable((preE) => {
                  return {
                    ...preE,
                    [rowIndex]: {
                      enable: !preE[rowIndex]?.enable,
                      height: preE[rowIndex]?.height ?? 100,
                    },
                  };
                });
              }}
            >
              toggle
            </button>
            <button
              onClick={() => {
                setExpandable((preE) => {
                  return {
                    ...preE,
                    [rowIndex]: {
                      enable: true,
                      height: (preE[rowIndex]?.height ?? 100) + 50,
                    },
                  };
                });
              }}
            >
              h+
            </button>
            <button
              onClick={() => {
                setExpandable((preE) => {
                  let reduce = (preE[rowIndex]?.height ?? 100) - 50;

                  reduce = reduce < 50 ? 50 : reduce;

                  return {
                    ...preE,
                    [rowIndex]: { enable: true, height: reduce },
                  };
                });
              }}
            >
              h-
            </button>
          </>
        ),
        // frozen: 'left',
      },
      ...Array(100)
        .fill(0)
        .map((zero, index) => ({
          key: `bucket${index}`,
          title: `bucket${index}`,
          headerRenderer: () => `bucket${index}`,
          width: 80 + index,
          cellRenderer: ({ rowIndex, columnIndex }) =>
            `${columnIndex},${rowIndex}`,
        })),
      {
        key: 'itemDesc',
        title: 'itemDesc',
        headerRenderer: () => 'itemDesc',
        width: 100,
        cellRenderer: () => 'itemDesc',
        frozen: 'right',
      },
      {
        key: 'itemState',
        title: 'itemState',
        headerRenderer: () => 'itemState',
        width: 100,
        cellRenderer: () => 'itemState',
        frozen: 'right',
      },
      {
        key: 'itemType',
        title: 'itemType',
        headerRenderer: () => 'itemType',
        width: 100,
        cellRenderer: () => 'itemType',
        frozen: 'right',
      },
    ];
  }, []);

  const data = useMemo(() => {
    return Array(100)
      .fill(0)
      .map((zero, index) => ({
        key: index,
      }));
  }, []);

  const toggleAll = (bool: boolean) => {
    resetRenderInfo();

    if (bool) {
      setExpandable(
        data.reduce<Expandable>((m, row, rowIndex) => {
          m[rowIndex + 1] = {
            enable: true,
            height: 100,
            expandStrategy: rowIndex % 2 === 0 ? 'COVER' : 'DEFAULT',
          };

          return m;
        }, {})
      );
    } else {
      setExpandable({});
    }
  };

  return (
    <div className={classes.wrapper}>
      <Space>
        <Button onClick={() => toggleAll(true)}>全部展开</Button>
        <Button onClick={() => toggleAll(false)}>全部收起</Button>
      </Space>

      <div className={classes.tableWrapper}>
        <Profiler onRender={onTableRender} id="table">
          <Table
            rowKey="id"
            columns={columns}
            // rowSelection={{
            //   selectedRowKeys: rowSelection.selectedRowKeys,
            //   selectedRows: rowSelection.selectedRows,
            //   onChange: ({
            //     selectedRowKeys,
            //     selectedRows,
            //   }) => {
            //     setRowSelection({
            //       selectedRowKeys,
            //       selectedRows,
            //     })
            //   },
            //   getCheckboxProps() {
            //     return { disabled: false }
            //   }
            // }}
            data={data}
            rowHeight={50}
            headHeight={100}
            expandable={expandable}
          />
        </Profiler>
      </div>
    </div>
  );
});

const useStyles = createUseStyles({
  full: {
    width: '100%',
    height: '100%',
  },
  fixedAtLt: {
    position: 'fixed',
    top: 0,
    left: 0,
  },
});

export default function App() {
  const classes = useStyles();

  const [totalDuration, setTotalDuration] = useState(0);
  const [renderCount, setRenderCount] = useState(0);

  const onRender = useCallback((duration: number) => {
    setTotalDuration((total) => total + duration);
    setRenderCount((count) => count + 1);
  }, []);

  const resetRenderInfo = useCallback(() => {
    setTotalDuration(0);
    setRenderCount(0);
  }, []);

  const fps = useMemo<number>(() => {
    return +Number(1000 / (totalDuration / renderCount)).toFixed(2);
  }, [totalDuration, renderCount]);

  return (
    <div className={classes.full}>
      <Typography.Text
        type={fps >= 60 ? 'success' : 'danger'}
        className={classes.fixedAtLt}
      >
        平均帧率：{fps}fps
      </Typography.Text>
      <Example onRender={onRender} resetRenderInfo={resetRenderInfo} />
    </div>
  );
}
