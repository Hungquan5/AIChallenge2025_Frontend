import React from 'react';
import { containerClass, labelClass, inputClass } from './styles';

interface TextInputBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TextInputBox: React.FC<TextInputBoxProps> = ({ value, onChange, placeholder }) => {
  return (
    <div className={containerClass}>
      <label className={labelClass}>Search Text</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Enter a description...'}
        className={`${inputClass} h-20 resize-none`} // h-16 = 4rem, disable resizing
      />
    </div>
  );
};

export default TextInputBox;
