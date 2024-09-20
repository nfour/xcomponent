import xcomponent from '../../XComponent';
import { useRootState } from './root/hooks';

export { css } from '@emotion/react';

export const X = xcomponent.extend({
  useRootState,
});
