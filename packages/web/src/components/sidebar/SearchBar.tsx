import { Search, X } from 'lucide-react';
import type { RefObject } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  inputRef,
}: SearchBarProps): React.ReactElement {
  return (
    <div className="relative flex items-center">
      <Search className="absolute left-2 z-10 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e): void => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="h-9 w-full rounded-none border-[3px] border-black bg-[#f0f0f0] pl-7 pr-7 font-mono text-sm text-black placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus-visible:border-[5px] focus-visible:-m-[2px]"
      />
      {value && (
        <button
          onClick={(): void => {
            onChange('');
          }}
          className="absolute right-2 z-10 rounded-none p-0.5 hover:bg-black hover:text-white text-[var(--text-tertiary)]"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
