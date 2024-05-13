# Why

let react-window support sticky rows and cols

# Difference with react-window

- refactor react-window 
  - refactor as function component
  - remove deprecated api
  - replace createElement with render props and remove `onItemsRendered`
  - remove FixedSizeGrid、FixedSizeList and VariableSizeList
  - `fixedLeftCount`、`fixedRightCount` and `expandable`
- add `table` component

# Grid

[Grid doc](src/grid/README.md)

# Table

[Table doc](src/table/README.md)

# TODO
- [ ] unit test and perf test
- [ ] support `fixedTopCount`
- [ ] support `fixedBottomCount`