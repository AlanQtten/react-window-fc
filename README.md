# Why

let react-window support sticky rows and cols

# Difference with react-window

- refactor react-window 
  - refactor as function component
  - remove deprecated api
  - replace createElement with render props and remove `onItemsRendered`
  - remove FixedSizeGrid、FixedSizeList and VariableSizeList
  - support fixed top row(one row) and fixed left/right col
  - support expandable
  - support `onRow` api
- add `Table` component

# Grid

[Grid doc](src/grid/README.md)

# Table

[Table doc](src/table/README.md)

# TODO
- [ ] unit test and perf test
- [ ] support `fixedTopCount`
- [ ] support `fixedBottomCount`
- [ ] support `onCol`