import { ItemSize, InstanceProps, ItemMetadata } from './types';

export type GetMetadata = (
  itemSize: ItemSize,
  index: number,
  instanceProps: InstanceProps
) => ItemMetadata;

export const getRowMetadata: GetMetadata = (
  rowHeight,
  index,
  instanceProps
) => {
  const itemMetadataMap = instanceProps.rowMetadataMap;
  const lastMeasuredIndex = instanceProps.lastMeasuredRowIndex;

  if (index > lastMeasuredIndex) {
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const itemMetadata = itemMetadataMap[lastMeasuredIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredIndex + 1; i <= index; i++) {
      const size = rowHeight(i);

      itemMetadataMap[i] = {
        offset,
        size,
      };

      offset += size;
    }

    instanceProps.lastMeasuredRowIndex = index;
  }

  return itemMetadataMap[index];
};

export const getColumnMetadata: GetMetadata = (
  columnWidth,
  index,
  instanceProps
) => {
  const itemMetadataMap = instanceProps.columnMetadataMap;
  const lastMeasuredIndex = instanceProps.lastMeasuredColumnIndex;

  if (index > lastMeasuredIndex) {
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const itemMetadata = itemMetadataMap[lastMeasuredIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredIndex + 1; i <= index; i++) {
      const size = columnWidth(i);

      itemMetadataMap[i] = {
        offset,
        size,
      };

      offset += size;
    }

    instanceProps.lastMeasuredColumnIndex = index;
  }

  return itemMetadataMap[index];
};
