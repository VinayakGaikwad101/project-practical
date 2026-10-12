"use client";

import React, { useMemo } from "react";
import * as Diff from "diff";
import { Check, X } from "lucide-react";

interface DiffPreviewProps {
  originalHtml: string;
  proposedHtml: string;
  onAccept: () => void;
  onReject: () => void;
}

export function DiffPreview({
  originalHtml,
  proposedHtml,
  onAccept,
  onReject,
}: DiffPreviewProps) {
  const cleanHtmlToText = (html: string) => {
    return html
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  };

  const originalPlain = useMemo(
    () => cleanHtmlToText(originalHtml),
    [originalHtml]
  );
  const proposedPlain = useMemo(
    () => cleanHtmlToText(proposedHtml),
    [proposedHtml]
  );

  const diffParts = useMemo(() => {
    return Diff.diffLines(originalPlain, proposedPlain);
  }, [originalPlain, proposedPlain]);

  return (
    <div className="border border-stone-300 rounded-lg bg-stone-50/80 p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-stone-700" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-700 font-mono">
            Proposed Amendments
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-stone-700 hover:bg-stone-100 border border-stone-300 rounded text-xs font-medium transition"
          >
            <X className="w-3.5 h-3.5 text-stone-500" />
            Discard
          </button>
          <button
            onClick={onAccept}
            className="inline-flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium transition"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Changes
          </button>
        </div>
      </div>

      <div className="text-xs font-mono max-h-56 overflow-y-auto space-y-1 bg-white p-3 rounded border border-stone-200">
        {diffParts.map((part, index) => {
          if (part.added) {
            return (
              <div
                key={index}
                className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded border-l-2 border-emerald-600 whitespace-pre-wrap"
              >
                + {part.value}
              </div>
            );
          }
          if (part.removed) {
            return (
              <div
                key={index}
                className="bg-rose-50 text-rose-900 px-2 py-0.5 rounded border-l-2 border-rose-500 line-through whitespace-pre-wrap opacity-75"
              >
                - {part.value}
              </div>
            );
          }
          return (
            <div key={index} className="text-stone-600 px-2 py-0.5 whitespace-pre-wrap">
              {part.value}
            </div>
          );
        })}
      </div>
    </div>
  );
}
