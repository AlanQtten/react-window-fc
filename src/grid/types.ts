import { memo } from 'react';

export type PropsAreEqual = NonNullable<Parameters<typeof memo>[1]>;

export type AnimationFrameID = ReturnType<typeof requestAnimationFrame>;

export type ItemType = 'column' | 'row';

export type ItemSize = (index: number) => number;

export type ItemMetadata = {
  offset: number;
  size: number;
};

export type ItemMetadataMap = { [index: number]: ItemMetadata };

export type InstanceProps = {
  columnMetadataMap: ItemMetadataMap;
  lastMeasuredColumnIndex: number;
  lastMeasuredRowIndex: number;
  rowMetadataMap: ItemMetadataMap;
};
