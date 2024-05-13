# API

## Table

#### Table props
| 参数 | 说明 | 类型 | 是否必须 | 默认值 |
| ---- | ---- | ---- | ---- | ---- |
| rowHeight | 行高 | number | true | - |
| rowKey | 行唯一键 | string | true | - |
| headHeight | 表头高 | number | false | - |
| columns | 列配置 | Column[] | false | - |
| data | 表格数据 | any[] | false | - |
| rowSelection | 表格选择配置 | RowSelection | false | - |
| emptyRenderer | 空表时的占位符渲染 | EmptyRenderer | false | - |
| expandable | 见Grid文档 | - | - | - |
| expandRenderer | 行展开渲染函数 | ExpandRenderer | false | - |
| stripe | 是否开启斑马条纹 | boolean | false | false |
| overscanColumnCount | 见Grid文档 | - | - | - |
| overscanRowCount | 见Grid文档 | - | - | - |
| onRow | 见Grid文档 | - | - | - |

#### Table api

见[Grid文档](../grid/README.md)

#### Column

| 参数 | 说明 | 类型 | 是否必须 | 默认值 |
| ---- | ---- | ---- | ---- | ---- |
| key | - | React.Key | true | - |
| cellRenderer | 单元格自定义渲染 | (p: CellRenderProps) **=>** React.ReactNode | true | - |
| width | 列宽 | number | true | - |
| title | 列头 | string | false | - |
| headerRenderer | 列头自定义渲染那 | (p: HeaderRendererProps) **=>** React.ReactNode | false | () => title |
| frozen | 是否冻结，true='left' | boolean \| 'left' \| 'right' | false | false |
| hidden | 是否隐藏列 | boolean | false | false |
| headerClassName | 列头自定义类名 | string | false | - |
| className | 单元格自定义类目 | string | false | - |

CellRenderProps

```typescript
type CellRenderProps = {
  column: Column;             // 列配置信息
  rowData: RowData;           // 行数据
  rowIndex: number;           // 行序号
  columnIndex: number;        // 列序号
  rowCalculationCache: any;   // 行计算缓存结果
};
```

HeaderRendererProps

```typescript
type HeaderRenderProps = {
  column: Column;             // 列配置信息
};
```

#### RowSelection

| 参数 | 说明 | 类型 | 是否必须 | 默认值 |
| ---- | ---- | ---- | ---- | ---- |
| hidden | 是否隐藏选择列 | boolean | false | false |
| selectedRowKeys | 选中的数据key数组 | any[] | true | - |
| selectedRows | 选中的数据数组 | any[] | false | - |
| getCheckboxProps | 为Checkbox添加更多属性，暂时只支持disabled | (rowData: any) => Pick<CheckboxProps, 'disabled'> | false | - |
| onChange | 触发回调 | ({ selectedRowKeys, selectedRows }) => void | false | - |