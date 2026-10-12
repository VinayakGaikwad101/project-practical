"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill: any = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center text-xs text-stone-400 font-mono">
      Initializing canvas...
    </div>
  ),
});

interface EditorCanvasProps {
  content: string;
  onChange: (html: string) => void;
  onSelectionChange: (selectedText: string) => void;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "blockquote",
  "code-block",
];

export function EditorCanvas({
  content,
  onChange,
  onSelectionChange,
}: EditorCanvasProps) {
  const quillRef = useRef<any>(null);

  const handleSelection = (range: any) => {
    if (range && range.length > 0 && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const text = editor.getText(range.index, range.length).trim();
      if (text.length > 0) {
        onSelectionChange(text);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-stone-200/90 shadow-sm overflow-hidden">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={onChange}
        onChangeSelection={handleSelection}
        modules={modules}
        formats={formats}
        placeholder="Begin writing your document or prompt the assistant..."
        className="h-full flex-1 flex flex-col"
      />
    </div>
  );
}
