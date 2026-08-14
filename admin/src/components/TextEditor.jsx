'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, Undo, Redo, Heading3 } from 'lucide-react';

const TextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    heading: false,
    bulletList: false,
  });

  // Sync external changes (like form reset) into the editor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
      updateActiveStates();
    }
  }, [value]);

  const updateActiveStates = () => {
    if (!editorRef.current) return;
    
    // Helper to check if selection is inside H3 element
    const checkIsHeadingActive = () => {
      try {
        const block = document.queryCommandValue('formatBlock');
        if (block === 'h3' || block === 'H3') return true;
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          let node = selection.getRangeAt(0).startContainer;
          while (node && node !== editorRef.current) {
            if (node.nodeName === 'H3') return true;
            node = node.parentNode;
          }
        }
      } catch (e) {
        // Ignore queryCommand errors if selection context is empty
      }
      return false;
    };

    setActiveStyles({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      bulletList: document.queryCommandState('insertUnorderedList'),
      heading: checkIsHeadingActive(),
    });
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If the editor is completely empty (only has empty tags/br), clean it to prevent saving garbage
      if (editorRef.current.textContent.trim() === '' && !editorRef.current.querySelector('img')) {
        onChange('');
      } else {
        onChange(html);
      }
      updateActiveStates();
    }
  };

  const handleExecuteCommand = (command, arg = null) => {
    document.execCommand(command, false, arg);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Intercept paste to clean style formatting and paste plain text/simple elements
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  const getBtnClass = (isActive) => {
    const base = "p-1.5 rounded transition-all duration-200 border flex items-center justify-center";
    if (isActive) {
      return `${base} bg-black text-white border-black shadow-sm`;
    }
    return `${base} text-gray-600 hover:text-black hover:bg-gray-200 border-transparent`;
  };

  return (
    <div className="border border-gray-300 focus-within:border-black transition-all duration-300 bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 select-none">
        <button
          type="button"
          onClick={() => handleExecuteCommand('bold')}
          title="Bold"
          className={getBtnClass(activeStyles.bold)}
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('italic')}
          title="Italic"
          className={getBtnClass(activeStyles.italic)}
        >
          <Italic size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('underline')}
          title="Underline"
          className={getBtnClass(activeStyles.underline)}
        >
          <Underline size={13} />
        </button>
        
        <div className="w-px h-5 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => handleExecuteCommand('formatBlock', '<h3>')}
          title="Heading"
          className={getBtnClass(activeStyles.heading)}
        >
          <Heading3 size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('insertUnorderedList')}
          title="Bullet List"
          className={getBtnClass(activeStyles.bulletList)}
        >
          <List size={13} />
        </button>
        
        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => handleExecuteCommand('undo')}
          title="Undo"
          className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 rounded border border-transparent transition-colors flex items-center justify-center"
        >
          <Undo size={13} />
        </button>
        <button
          type="button"
          onClick={() => handleExecuteCommand('redo')}
          title="Redo"
          className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 rounded border border-transparent transition-colors flex items-center justify-center"
        >
          <Redo size={13} />
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyUp={updateActiveStates}
        onMouseUp={updateActiveStates}
        data-placeholder={placeholder}
        className="w-full min-h-[140px] max-h-[350px] overflow-y-auto px-4 py-3 focus:outline-none text-sm rich-text-editor-content bg-white"
        style={{ outline: 'none' }}
      />
    </div>
  );
};

export default TextEditor;