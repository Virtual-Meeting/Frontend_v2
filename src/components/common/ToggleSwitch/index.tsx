import React from 'react';
import { ToggleWrapper, Checkbox, Slider, IconWrapper } from './ToggleSwitch.styles';
import LightIcon from 'assets/icons/light.svg?react';
import DarkIcon from 'assets/icons/dark.svg?react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel = 'Toggle switch',
}) => {
  return (
    <ToggleWrapper>
      <Checkbox
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
        role="switch"
        aria-checked={checked}
      />
      <Slider $checked={checked}>
        <IconWrapper $checked={checked}>
          {checked ? <DarkIcon /> : <LightIcon />}
        </IconWrapper>
      </Slider>
    </ToggleWrapper>
  );
};

export default ToggleSwitch;
