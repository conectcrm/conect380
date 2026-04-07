import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AtSign,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { htmlToMarkdown, markdownToHtml } from '../../utils/richTextMarkdown';

type RichTextToolbarFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  helperText?: string;
  className?: string;
};

type ToolbarButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const TOOLBAR_BUTTON_CLASS =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-[#4B6272] transition-colors hover:bg-[#F3F6F8] hover:text-[#1E3A4B] disabled:cursor-not-allowed disabled:opacity-50';

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ label, disabled, onClick, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className={TOOLBAR_BUTTON_CLASS}
  >
    {children}
  </button>
);

const RichTextToolbarField: React.FC<RichTextToolbarFieldProps> = ({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  helperText,
  className,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastMarkdownSyncRef = useRef<string>(String(value || ''));
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!String(value || '').trim());

  const minHeightPx = useMemo(() => Math.max(rows, 3) * 22, [rows]);

  useEffect(() => {
    const incomingValue = String(value || '');
    if (incomingValue === lastMarkdownSyncRef.current) return;

    const editor = editorRef.current;
    if (!editor) {
      lastMarkdownSyncRef.current = incomingValue;
      return;
    }

    const nextHtml = markdownToHtml(incomingValue);
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }

    setIsEmpty(!incomingValue.trim());
    lastMarkdownSyncRef.current = incomingValue;
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!String(value || '').trim() && !editor.innerHTML.trim()) {
      editor.innerHTML = '';
    }
  }, []);

  const emitMarkdownFromEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const markdown = htmlToMarkdown(editor.innerHTML);
    lastMarkdownSyncRef.current = markdown;
    setIsEmpty(!markdown.trim());
    onChange(markdown);
  }, [onChange]);

  const execCommand = useCallback(
    (command: string, commandValue?: string) => {
      if (disabled) return;
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      document.execCommand(command, false, commandValue);
      emitMarkdownFromEditor();
    },
    [disabled, emitMarkdownFromEditor],
  );

  const handleInsertLink = () => {
    if (disabled) return;
    const selection = window.getSelection();
    if (!selection) return;

    if (!selection.rangeCount || selection.isCollapsed) {
      execCommand(
        'insertHTML',
        '<a href="https://" target="_blank" rel="noopener noreferrer">link</a>',
      );
      return;
    }

    execCommand('createLink', 'https://');
  };

  const handleMention = () => execCommand('insertText', '@');

  const handlePastePlainText = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData('text/plain');
    if (!plainText) return;
    execCommand('insertText', plainText);
  };

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-lg border border-[#D8CFAB] bg-white transition-colors">
        <div className="relative">
          {isEmpty && !isFocused && placeholder ? (
            <p className="pointer-events-none absolute left-3 top-2 text-sm text-[#6C7A84]">
              {placeholder}
            </p>
          ) : null}
          <div
            id={id}
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-disabled={disabled}
            onInput={emitMarkdownFromEditor}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              emitMarkdownFromEditor();
            }}
            onPaste={handlePastePlainText}
            className="w-full overflow-y-auto bg-white px-3 py-2 text-sm text-[#1E3A4B] outline-none disabled:cursor-not-allowed [&_a]:text-[#0F7B7D] [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:my-0 [&_ul]:ml-5 [&_ul]:list-disc"
            style={{ minHeight: `${minHeightPx}px`, whiteSpace: 'pre-wrap' }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 border-t border-[#D8CFAB] bg-white px-2 py-1.5">
          <ToolbarButton label="Negrito" disabled={disabled} onClick={() => execCommand('bold')}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Italico" disabled={disabled} onClick={() => execCommand('italic')}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Sublinhado"
            disabled={disabled}
            onClick={() => execCommand('underline')}
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Tachado"
            disabled={disabled}
            onClick={() => execCommand('strikeThrough')}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Lista numerada"
            disabled={disabled}
            onClick={() => execCommand('insertOrderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Lista com marcadores"
            disabled={disabled}
            onClick={() => execCommand('insertUnorderedList')}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Inserir link" disabled={disabled} onClick={handleInsertLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Inserir mencao" disabled={disabled} onClick={handleMention}>
            <AtSign className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>
      {helperText ? <p className="mt-1 text-xs text-[#5E707C]">{helperText}</p> : null}
    </div>
  );
};

export default RichTextToolbarField;
