import { PropsAreEqual } from './types';

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

export default shallowDiffers;
