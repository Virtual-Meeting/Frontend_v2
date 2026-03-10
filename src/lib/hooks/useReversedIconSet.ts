import { useTheme } from 'styled-components';
import * as blackIcons from 'assets/icons/black';
import * as whiteIcons from 'assets/icons/white';


export const useReversedIconSet = () => {
  const theme = useTheme();
  return theme.mode === 'dark' ? blackIcons : whiteIcons;
};