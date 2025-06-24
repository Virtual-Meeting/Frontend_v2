import React, { useState, useRef } from "react";
import { DropdownContainer, Selected, OptionsList, Option } from "./Dropdown.styles";

interface DropdownOption {
  [key: string]: any;
}

interface DropdownProps {
  options: DropdownOption[];
  onChange: (option: DropdownOption) => void;
  value?: DropdownOption | null;  // <-- 추가
  placeholder?: string;
  labelKey?: string;
  valueKey?: string;
  title?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  onChange,
  value,
  placeholder = "선택하세요",
  labelKey = "label",
  valueKey = "value",
  title = "선택 항목",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const getLabel = (option: DropdownOption | null | undefined) => {
    if (!option) return placeholder;
    return option[labelKey] ?? String(option);
  };

  const isSelected = (option: DropdownOption) =>
    value && value[valueKey] === option[valueKey];

  return (
    <DropdownContainer
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Selected $isHovered={isHovered}>
        {title} <br/>
        <span>{getLabel(value)}</span>
      </Selected>
      <OptionsList $isVisible={isHovered}>
        {options.map(option => (
          <Option
            key={option[valueKey] ?? option[labelKey] ?? option}
            onClick={() => onChange(option)}
          >
            <input
              type="radio"
              checked={isSelected(option)}
              readOnly
            />
            <span>{option[labelKey] ?? String(option)}</span>
          </Option>
        ))}
      </OptionsList>
    </DropdownContainer>
  );
};

export default Dropdown;
