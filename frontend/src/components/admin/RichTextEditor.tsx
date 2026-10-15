'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Compose content here...',
  minHeight = 'min-h-96',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const [isCodeView, setIsCodeView] = useState(false);

  // Link dialog modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(true);
  const [isEditingExistingLink, setIsEditingExistingLink] = useState(false);

  const savedRangeRef = useRef<Range | null>(null);
  const existingAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. initial fetch or reset) when not actively editing
  useEffect(() => {
    if (!isCodeView && editorRef.current && !isFocusedRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isCodeView]);

  // Focus link input when link modal opens
  useEffect(() => {
    if (isLinkModalOpen) {
      const timer = setTimeout(() => {
        linkInputRef.current?.focus();
        linkInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLinkModalOpen]);

  // Handle Escape key to close link modal
  useEffect(() => {
    if (!isLinkModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLinkModalOpen(false);
        existingAnchorRef.current = null;
        savedRangeRef.current = null;
        editorRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLinkModalOpen]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = (command: string, arg?: string) => {
    if (isCodeView) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  const openLinkModal = () => {
    if (isCodeView) return;

    if (editorRef.current && !isFocusedRef.current) {
      editorRef.current.focus();
    }

    const selection = window.getSelection();
    let range: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0).cloneRange();
    }
    savedRangeRef.current = range;

    // Check if selection or cursor is inside an existing anchor element
    let anchor: HTMLAnchorElement | null = null;
    if (range) {
      let node: Node | null = range.commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeName === 'A') {
          anchor = node as HTMLAnchorElement;
          break;
        }
        node = node.parentNode;
      }
    }

    existingAnchorRef.current = anchor;

    if (anchor) {
      setIsEditingExistingLink(true);
      setLinkUrl(anchor.getAttribute('href') || '');
      setLinkText(anchor.textContent || '');
      setLinkOpenInNewTab(anchor.target === '_blank');
    } else {
      setIsEditingExistingLink(false);
      setLinkUrl('');
      const selectedStr = range ? range.toString().trim() : '';
      setLinkText(selectedStr);
      setLinkOpenInNewTab(true);
    }

    setIsLinkModalOpen(true);
  };

  const handleApplyLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawUrl = linkUrl.trim();
    if (!rawUrl) {
      handleRemoveLink();
      return;
    }

    // Normalize URL
    const finalUrl =
      rawUrl.startsWith('http://') ||
      rawUrl.startsWith('https://') ||
      rawUrl.startsWith('mailto:') ||
      rawUrl.startsWith('tel:') ||
      rawUrl.startsWith('/') ||
      rawUrl.startsWith('#')
        ? rawUrl
        : `https://${rawUrl}`;

    const textToDisplay = linkText.trim() || rawUrl;

    if (existingAnchorRef.current) {
      // Update existing anchor element
      existingAnchorRef.current.href = finalUrl;
      existingAnchorRef.current.textContent = textToDisplay;
      if (linkOpenInNewTab) {
        existingAnchorRef.current.target = '_blank';
        existingAnchorRef.current.rel = 'noopener noreferrer';
      } else {
        existingAnchorRef.current.removeAttribute('target');
        existingAnchorRef.current.removeAttribute('rel');
      }
    } else {
      // Restore range
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRangeRef.current);
      }

      // Create new anchor element
      const a = document.createElement('a');
      a.href = finalUrl;
      a.textContent = textToDisplay;
      if (linkOpenInNewTab) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      if (savedRangeRef.current) {
        savedRangeRef.current.deleteContents();
        savedRangeRef.current.insertNode(a);

        // Position cursor right after the newly inserted link
        const newRange = document.createRange();
        newRange.setStartAfter(a);
        newRange.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(newRange);
      } else if (editorRef.current) {
        editorRef.current.appendChild(a);
      }
    }

    handleInput();
    setIsLinkModalOpen(false);
    existingAnchorRef.current = null;
    savedRangeRef.current = null;

    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleRemoveLink = () => {
    if (existingAnchorRef.current) {
      const parent = existingAnchorRef.current.parentNode;
      while (existingAnchorRef.current.firstChild) {
        parent?.insertBefore(existingAnchorRef.current.firstChild, existingAnchorRef.current);
      }
      parent?.removeChild(existingAnchorRef.current);
    } else if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
      document.execCommand('unlink');
    }

    handleInput();
    setIsLinkModalOpen(false);
    existingAnchorRef.current = null;
    savedRangeRef.current = null;

    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleCloseLinkModal = () => {
    setIsLinkModalOpen(false);
    existingAnchorRef.current = null;
    savedRangeRef.current = null;
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleHeading = (tag: string) => {
    if (isCodeView) return;
    exec('formatBlock', `<${tag}>`);
  };

  // Word & character stats
  const cleanText = (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = cleanText ? cleanText.split(' ').length : 0;
  const charCount = cleanText.length;

  return (
    <div className="relative border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-blue-500 transition-colors">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2.5 bg-slate-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-1">
          {/* Paragraph / Headings */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleHeading('p');
            }}
            disabled={isCodeView}
            title="Normal Paragraph"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg text-gray-700 hover:bg-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Normal
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleHeading('h2');
            }}
            disabled={isCodeView}
            title="Heading 2"
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-navy hover:bg-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
          >
            H2
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleHeading('h3');
            }}
            disabled={isCodeView}
            title="Heading 3"
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-navy hover:bg-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
          >
            H3
          </button>

          <span className="w-px h-5 bg-gray-300 mx-1" />

          {/* Inline Styles */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('bold');
            }}
            disabled={isCodeView}
            title="Bold (Ctrl+B)"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">format_bold</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('italic');
            }}
            disabled={isCodeView}
            title="Italic (Ctrl+I)"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">format_italic</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('underline');
            }}
            disabled={isCodeView}
            title="Underline (Ctrl+U)"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">format_underlined</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('strikeThrough');
            }}
            disabled={isCodeView}
            title="Strikethrough"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">strikethrough_s</span>
          </button>

          <span className="w-px h-5 bg-gray-300 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('insertUnorderedList');
            }}
            disabled={isCodeView}
            title="Bulleted List"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">format_list_bulleted</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('insertOrderedList');
            }}
            disabled={isCodeView}
            title="Numbered List"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">format_list_numbered</span>
          </button>

          <span className="w-px h-5 bg-gray-300 mx-1" />

          {/* Links & Quotes */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              openLinkModal();
            }}
            disabled={isCodeView}
            title="Insert or Edit Link"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">link</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleHeading('blockquote');
            }}
            disabled={isCodeView}
            title="Quote"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">format_quote</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('insertHorizontalRule');
            }}
            disabled={isCodeView}
            title="Horizontal Divider"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">horizontal_rule</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('removeFormat');
            }}
            disabled={isCodeView}
            title="Clear Formatting"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">format_clear</span>
          </button>

          <span className="w-px h-5 bg-gray-300 mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('undo');
            }}
            disabled={isCodeView}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">undo</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              exec('redo');
            }}
            disabled={isCodeView}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-gray-700 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg! leading-none">redo</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (isCodeView && editorRef.current) {
                editorRef.current.innerHTML = value || '';
              }
              setIsCodeView(!isCodeView);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCodeView
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-slate-200 border border-gray-200'
            }`}
            title={isCodeView ? 'Switch to Visual Editor' : 'Switch to HTML Code View'}
          >
            <span className="material-symbols-outlined text-base! leading-none">
              {isCodeView ? 'visibility' : 'code'}
            </span>
            <span>{isCodeView ? 'Visual Mode' : 'HTML Code'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {isCodeView ? (
        <textarea
          rows={16}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter or paste raw HTML markup..."
          className={`w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 focus:outline-none resize-y ${minHeight}`}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            handleInput();
          }}
          onInput={handleInput}
          data-placeholder={placeholder}
          className={`w-full p-5 focus:outline-none text-slate-800 text-sm leading-relaxed overflow-y-auto ${minHeight} max-h-160 prose prose-slate max-w-none prose-headings:text-navy prose-h2:text-lg prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-p:mb-3 prose-ul:list-disc prose-ul:ml-6 prose-ol:list-decimal prose-ol:ml-6 prose-a:text-blue-600 prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic`}
        />
      )}

      {/* Bottom Status / Stats Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-gray-100 text-[11px] text-gray-400 font-medium">
        <div>
          {isCodeView ? (
            <span>Editing raw HTML markup directly</span>
          ) : (
            <span>Rich Text Mode &bull; Toolbar formats apply directly</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>&bull;</span>
          <span>{charCount} characters</span>
        </div>
      </div>

      {/* Link Dialog Modal */}
      {isLinkModalOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs animate-fade-in"
          onClick={handleCloseLinkModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg!">link</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">
                    {isEditingExistingLink ? 'Edit Link' : 'Insert Link'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Add a web hyperlink, page link, or email address.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseLinkModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg!">close</span>
              </button>
            </div>

            <form onSubmit={handleApplyLink} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Destination URL or Path <span className="text-red-500">*</span>
                </label>
                <input
                  ref={linkInputRef}
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com, /contact, or mailto:info@..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Display Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Text to display (defaults to URL if blank)"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={linkOpenInNewTab}
                  onChange={(e) => setLinkOpenInNewTab(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-gray-700 font-medium">Open in new tab</span>
              </label>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                {isEditingExistingLink ? (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm!">link_off</span>
                    Remove Link
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseLinkModal}
                    className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-slate-100 text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs font-semibold px-4 py-2 rounded-xl bg-navy text-white hover:bg-navy-light transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm!">check</span>
                    <span>{isEditingExistingLink ? 'Update Link' : 'Insert Link'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
