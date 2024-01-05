# Why

let react-window support sticky rows

# Difference with react-window

- refactor react-window 
  - refactor as function component
  - remove deprecated api
  - replace createElement with render props and remove `onItemsRendered`
  - remove FixedSizeGrid、FixedSizeList and VariableSizeList
  - add `fixedTopCount`、`fixedLeftCount`、`fixedRightCount` and `expandable`
- add `table` component

# TODO
- [ ] remove `itemHeight` from props
- [ ] support `isScrolling` and `scrollUpdateWasRequested`
- [ ] support `initialScrollLeft` and `initialScrollTop`
- [ ] unit test and perf test