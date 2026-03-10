import * as whiteIcons from "assets/icons/white";
import * as blaskIcons from "assets/icons/black";
import { useTheme } from 'styled-components';

export const useIconSet = () => {
  const theme = useTheme();
  const isDarkMode = theme.mode === 'dark';

  return isDarkMode ? whiteIcons : blaskIcons;
};