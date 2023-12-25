import shallowDiffers from './shallowDiffers';
import { PropsAreEqual } from './types';

const areEqual: PropsAreEqual = (prevProps, nextProps) => {
  const { style: prevStyle, ...prevRest } = prevProps;
  const { style: nextStyle, ...nextRest } = nextProps;

  return (
    !shallowDiffers(prevStyle, nextStyle) && !shallowDiffers(prevRest, nextRest)
  );
};

export default areEqual;
