import { memo } from 'react';

type PropsAreEqual = NonNullable<Parameters<typeof memo>[1]>;

const shallowDiffers: PropsAreEqual = (prev, next) => {
  for (const attribute in prev) {
    if (!(attribute in next)) {
      return true;
    }
  }

  for (const attribute in prev) {
    if (prev[attribute] !== next[attribute]) {
      return true;
    }
  }

  return false;
};

const areEqual: PropsAreEqual = (prevProps, nextProps) => {
  const { style: prevStyle, ...prevRest } = prevProps;
  const { style: nextStyle, ...nextRest } = nextProps;

  return (
    !shallowDiffers(prevStyle, nextStyle) && !shallowDiffers(prevRest, nextRest)
  );
};

export default areEqual;
