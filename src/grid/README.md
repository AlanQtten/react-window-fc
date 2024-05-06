# API

## Grid

#### Grid props
| 参数 | 说明 | 类型 | 是否必须 | 默认值 |
| ---- | ---- | ---- | ---- | ---- |
| children | 渲染函数 | (p: RenderCellProps) => React.ReactNode | true | - |
| columnCount | 列数 | number | true | - |
| columnWidth | 列宽 | (colIndex: number) => number | true | - |
| rowCount | 行数 | number | true | - |
| rowHeight | 行高 | (rowIndex: number) => number | true | - |
| width | 容器宽 | number | true | - |
| height | 容器高 | number | true | - |
| estimatedTotalWidth | 总宽，why: 见Question1 | number | true | - |
| estimatedTotalHeight | 总高 | number | true | - |
| direction | 滚动方向 | 'ltr' \|'rtl' | false | 'ltr' |
| className | 外层包裹容器类名 | string | false | - |
| innerWrapperClassName | 内层包裹容器类名 | string | false | - |
| initialScrollLeft | 初始化横向滚动距离 | number | false | - |
| initialScrollTop | 初始化纵向滚动距离 | number | false | - |
| onScroll | 滚动回调 | (p: OnScrollOptions) => void | false | - |
| overscanColumnCount | 预渲染列数，不传会处理为1 | number | false | - |
| overscanRowCount | 预渲染行数，不传会处理为1 | number | false | - |
| style | 外层包裹容器样式 | React.CSSProperities | false | - |
| fixedTopCount | 顶部冻结行数 | number | false | 0 |
| fixedLeftCount | 左侧冻结列数 | number | false | 0 |
| fixedRightCount | 右侧冻结列数 | number | false | 0 |
| placeholderRenderer | 占位符渲染，总列宽<容器宽时调用 | PlaceholderRenderer | false | - |
| expandable | 行展开信息 | Expandable | false | - |
| expandRenderer | 行展开渲染 | ExpandRenderer | false | - |
| itemHeight | 单元格高，why: Question2 | (rowIndex: number) => number | false | - |
| extraNodeRenderer | 额外节点的渲染函数，节点会被渲染到与内侧容器平级的位置 | () => React.ReactNode | false | - |
| onRow | 行级的计算函数，每行只会调用一次 | (rowIndex: any) => any | false | - |

#### Grid api
| 名称 | 说明 | 类型 |
| ---- | ---- | ---- |
| scrollTo | 使Grid滚动到x,y | (p: { scrollLeft?: number, scrollTop?: number }) => void |
| scrollToItem | 使Grid滚动到某个单元格 | ScrollToItem |
| resetAfterIndices | 重置缓存 | (p: { rowIndex?: number, columnIndex?: number, shouldForceUpdate?: boolean }) => void |
| resetAfterRowIndex | 重置>=x行的缓存 | (x?: number, shouldForceUpdate?: boolean) => void |
| resetAfterColumnIndex | 重置>=x列的缓存 | (x?: number, shouldForceUpdate?: boolean) => void |

ScrollToItem

```typescript
type ScrollToItem = (p: {
  columnIndex?: number;  // 要滚动到的列序号
  rowIndex?: number;     // 要滚动到的行序号
  
  // 滚动后的吸附行为, 默认为auto
  align?: 'auto' | 'smart' | 'center' | 'start' | 'end';   
}) => void;
```

#### RenderCellProps

| 参数        | 说明                                   | 类型           |
| ----------- | -------------------------------------- | -------------- |
| columnIndex | 列序号                                 | number         |
| rowIndex    | 序号                                   | number         |
| style       | 单元格样式                             | CSSProperities |
| key         | key                                    | React.Key      |
| rowData     | 行级计算的结果，配合  `onRow`  api使用 | any            |

#### OnScrollOptions

| 参数                      | 说明                       | 类型                    |
| ------------------------- | -------------------------- | ----------------------- |
| horizontalScrollDirection | 横向滚动的方向             | 'forward' \| 'backward' |
| verticalScrollDirection   | 纵向滚动的方向             | 'forward' \| 'backward' |
| scrollLeft                | 横向偏移量                 | number                  |
| scrollTop                 | 纵向偏移量                 | number                  |
| scrollUpdateWasRequested  | 滚动行为是否是被代码触发的 | boolean                 |

#### PlaceholderRenderer

```typescript
interface PlaceholderRenderer {
  (p: {
    rowIndex: number;           // 行序号
    style: React.CSSProperties; // 样式
    key: React.Key; 						// key
  }): React.ReactNode;
}
```

#### Expandable

```typescript
Record<
  string /* String(行序号) */,
  {
    enable: boolean;                     // 该行是否启用行展开
    height: number;                      // 该行展开的高度
    expandStrategy?: 'COVER' | 'DEFAULT' // 该行展开的规则，默认 => DEFAULT, why: Question2
  }
>
```

#### ExpandRenderer

```typescript
enum ExpandAt {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  CELL = 'CELL',
  COVER = 'COVER',
}

type ExpandRenderer = (
  p: {
    rowIndex: number;            // 行序号
    style: React.CSSProperties;  // 样式
    key: React.Key;              // key
    expandAt: ExpandAt;          // 这次渲染在什么位置发生，why: 见Question2
    columnIndex: number;         // 列序号，只有expandAt === ExpandAt.CELL时候才会回传，其他情况为undefined
  }
) => React.ReactNode;
```

## AutoSizeGrid

#### AutoSizeGrid props
| 参数 | 说明 | 类型 | 是否必须 | 默认值 |
| ---- | ---- | ---- | ---- | ---- |
| width | 容器宽, 不传入时=父容器宽度 | number | false | - |
| height | 容器高, 不传入时=父容器高度 | number | false | - |

> 其他参数同Grid



# Question

## 1. 为什么要传入estimatedTotalWidth和estimatedTotalHeight，如何计算？

由于Grid内部无法得知总高和总宽，如果不传入这两个值或传入错误的值，会导致Grid在滚动过程中滚动条发生抖动

estimatedTotalWidth应等于**所有列宽总和**，即如下代码

```javascript
const { columnCount, columnWidth } = props

let estimatedTotalWidth = 0

for(let i = 0; i < columnCount; i ++) {
  estimatedTotalWidth += columnWidth(i)
}
```

estimatedTotalWidth应等于**所有行高总和**，即如下代码

```javascript
const { rowCount, rowHeight } = props

let estimatedTotalHeight = 0

for(let i = 0; i < rowCount; i ++) {
  estimatedTotalHeight += rowHeight(i) // 如果有行展开，这里还应该加上对应的展开高度
}
```

## 2. 行展开如何使用？

- 基本使用

```jsx
// 确认要展开的行及其展开的高度和行为
const expandable = {
  "1": {
    height: 20,
    enable: true,
    expandStrategy: "COVER"
  }
}

const expandRenderer = ({ key, style }) => <div key={key} style={style} />

<Grid expandable={expandable} expandRenderer={expandRenderer} />
```

- 行展开的行为有何不同

DEFAULT

```jsx
const expandable = {
  "1": {
    height: 20,
    enable: true,
    expandStrategy: "DEFAULT"
  }
}

const expandRenderer = ({ key, style, expandAt, columnIndex }) => {
  if(expandAt === ExpandAt.LEFT) {
    // 整个左冻结区域会被调用一次
    return <div style={style} key={key}>left</div>
  }
  
  if(expandAt === ExpandAt.RIGHT) {
    // 整个右冻结区域会被调用一次
    return <div style={style} key={key}>right</div>
  }
  
  // if(expandAt === ExpandAt.CELL) 
  // 普通的单元格会根据虚拟滚动当前渲染的列数渲染n次
  return <div style={style} key={key}>col {columnIndex}</div>
}

<Grid expandable={expandable} expandRenderer={expandRenderer} /> 
```

COVER表示展开的行会跟容器同宽，且不会随着横向滚动而滚动

```jsx
const expandable = {
  "1": {
    height: 20,
    enable: true,
    expandStrategy: "COVER"
  }
}

const expandRenderer = ({ key, style, expandAt }) => {
  // if(expandAt === ExpandAt.COVER) 
  // 只会被调用一次
  return <div style={style} key={key}>cover</div>
}

<Grid expandable={expandable} expandRenderer={expandRenderer} /> 
```

COVER和DEFAULT也可以同时存在

```jsx
const expandable = {
  "1": {
    height: 20,
    enable: true,
    expandStrategy: "DEFAULT"
  },
  "10": {
    height: 20,
    enable: true,
    expandStrategy: "COVER"
  }
}

const expandRenderer = ({ key, style, expandAt, columnIndex }) => {
  if(expandAt === ExpandAt.LEFT) {
    // 左冻结区域
    return <div style={style} key={key}>left</div>
  }
  
  if(expandAt === ExpandAt.RIGHT) {
    // 右冻结区域
    return <div style={style} key={key}>right</div>
  }
  
  if(expandAt === ExpandAt.COVER) {
    // cover行
    return <div style={style} key={key}>cover</div>
  }
  
  // if(expandAt === ExpandAt.CELL) 
  // 普通的单元格
  return <div style={style} key={key}>col {columnIndex}</div>
}

<Grid expandable={expandable} expandRenderer={expandRenderer} /> 
```

