// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PredefinedTag } from './predefinedTags'; // Assuming PredefinedTag is exported
import { tagStringToPredefinedTag } from './TagInputField';
import { TagIcon } from 'components/atoms/Tag/Tag';

const MAX_SUGGESTION_LENGTH = 12;

interface TagSuggestionsDropdownProps {
  inputValue: string;
  ecosystemTags: PredefinedTag[];
  generalTags: PredefinedTag[];
  onSelectTag: (tagName: string) => void;
  showDropdown: boolean;
  inputRef: React.RefObject<HTMLInputElement>; // For positioning if needed, though DaisyUI might handle it
  selectedTags: string[];
  filteredSuggestions: PredefinedTag[];
  setFilteredSuggestions: (suggestions: PredefinedTag[]) => void;
}

const TagSuggestionsDropdown: React.FC<TagSuggestionsDropdownProps> = ({
  inputValue,
  ecosystemTags,
  generalTags,
  onSelectTag,
  showDropdown,
  inputRef,
  selectedTags,
  filteredSuggestions,
  setFilteredSuggestions,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const usedEcosystems = useMemo(() => new Set(ecosystemTags.map(tag => tag.name.toLowerCase())), [ecosystemTags]);

  useEffect(() => {
    if (!showDropdown) {
      setFilteredSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    const used = new Set(selectedTags.map(tag => tag.toLowerCase()));
    let hasExactMatch = false;

    const lowerInputValue = inputValue.toLowerCase().trim();
    const filteredEcosystems = ecosystemTags.filter(tag => {
      hasExactMatch = hasExactMatch || tag.name.toLowerCase() === lowerInputValue;

      return tag.name.toLowerCase().includes(lowerInputValue) &&
      !used.has(tag.name.toLowerCase())
    });
    const filteredGeneral = generalTags.filter(tag => {
      hasExactMatch = hasExactMatch || tag.name.toLowerCase() === lowerInputValue;

      return tag.name.toLowerCase().includes(lowerInputValue) &&
      !used.has(tag.name.toLowerCase()) &&
      !usedEcosystems.has(tag.name.toLowerCase()) // Avoid duplicates if a general tag is also an ecosystem
    });

    const combined = [...filteredEcosystems, ...filteredGeneral].slice(0, MAX_SUGGESTION_LENGTH);

    // If no exact match, suggest new tag
    if (!hasExactMatch) {
      const [newTag] = tagStringToPredefinedTag([inputValue]);
      combined.push(newTag);
    }

    setFilteredSuggestions(combined);
    setActiveIndex(-1); // Reset active index when suggestions change
  }, [inputValue, ecosystemTags, generalTags, showDropdown, selectedTags, usedEcosystems, setFilteredSuggestions]);

  const handleSelect = useCallback((tag: PredefinedTag) => {
    onSelectTag(tag.name);
  }, [onSelectTag]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showDropdown || filteredSuggestions.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex(prev => (prev + 1) % filteredSuggestions.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
            handleSelect(filteredSuggestions[activeIndex]);
          }
          break;
        case 'Escape':
          // Let parent handle closing dropdown (e.g., by setting showDropdown to false)
          // This component doesn't directly control showDropdown
          if (inputRef.current) inputRef.current.blur(); // Or a more direct way to signal close
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase to intercept before input
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showDropdown, filteredSuggestions, activeIndex, handleSelect, inputRef]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeItem = dropdownRef.current.children[activeIndex] as HTMLLIElement;
      if (activeItem) {
        activeItem.scrollIntoView({
          block: 'nearest',
        });
        // setActiveDescendantId(activeItem.id);
      }
    }
  }, [activeIndex]);

  // Adjust position if absolute positioning is needed
  useEffect(() => {
    if (dropdownRef.current && inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      dropdownRef.current.style.top = `${inputRect.bottom + window.scrollY}px`;
      dropdownRef.current.style.left = `${inputRect.left + window.scrollX}px`;
    }
  }, [inputRef, showDropdown]);
  
  if (!showDropdown || filteredSuggestions.length === 0) {
    return null;
  }

  return (
    <ul 
      tabIndex={-1} // Important for DaisyUI dropdown to receive focus for keyboard nav if needed
      ref={dropdownRef}
      className="dropdown menu p-2 shadow rounded-box w-full mt-1 z-50 overflow-y-auto rounded-lg simple-scrollbar-thin"
      style={{
        backgroundColor: 'var(--surface-background-2nd)',
        border: '1px solid var(--border-subtle)', // Added 1px solid assuming --border-subtle is a color
        maxHeight: '225px',
        overflowY: 'auto',
        position: 'absolute',
      }}
      // role="listbox"
      // aria-activedescendant={activeDescendantId}
    >
      {filteredSuggestions.map((tag, index) => {
        const isEcosystem = ecosystemTags.some(et => et.name.toLowerCase() === tag.name.toLowerCase());
        // const itemId = `suggestion-${index}`;
        return (
          <li 
            key={tag.name + index} 
            onClick={() => handleSelect(tag)} 
            className={`p-0 ${index === activeIndex ? 'tag-suggestion-active rounded-md' : 'tag-suggestion-hoverable rounded-md'}`}
          >
            {/* DaisyUI recommends <a> tags inside <li> for proper styling and focus */}
            <a className={`flex items-center gap-2 p-2 ${isEcosystem ? 'font-bold' : ''}`}> 
              <TagIcon tag={tag} />
              <span className="cg-text-main">{tag.name}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default TagSuggestionsDropdown; 