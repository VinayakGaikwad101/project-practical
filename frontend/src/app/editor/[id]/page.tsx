"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { EditorCanvas } from "@/components/EditorCanvas";
import { AIChatPanel, ChatMsg } from "@/components/AIChatPanel";
import { DiffPreview } from "@/components/DiffPreview";
import { EditorSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Download,
  Clock,
} from "lucide-react";

function DocumentEditorContent() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const docId = params.id as string;
  const isNew = docId === "new";

  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Selection & AI state
  const [selectedText, setSelectedText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<string | null>(null);
  const originalContentBeforeAi = useRef<string>("");

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: "ai",
      content:
        "Hello. I am your drafting assistant. Highlight any text or ask to generate, revise, or format your document.",
    },
  ]);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load document
  useEffect(() => {
    if (isNew) {
      setTitle("Untitled Document");
      setContent("");
      setLoading(false);
      return;
    }

    const fetchDoc = async () => {
      try {
        const res = await api.get(`/documents/${docId}`);
        if (res.data.success && res.data.document) {
          setTitle(res.data.document.title || "Untitled Document");
          setContent(res.data.document.content || "");
          setLastSaved(new Date(res.data.document.updatedAt));
        }
      } catch (err: any) {
        toast.error("Failed to load document.");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (user && !isNew) {
      fetchDoc();
    }
  }, [docId, isNew, user, router]);

  // Save document handler
  const handleSave = async (silent = false) => {
    if (saving) return;
    if (!silent) setSaving(true);

    try {
      if (isNew) {
        const res = await api.post("/documents", {
          title,
          content,
        });
        if (res.data.success) {
          toast.success("Document created.");
          // Update URL silently without full page remount/flicker
          window.history.replaceState(null, "", `/editor/${res.data.document._id}`);
          setLastSaved(new Date());
        }
      } else {
        await api.put(`/documents/${docId}`, {
          title,
          content,
        });
        setLastSaved(new Date());
        if (!silent) toast.success("Saved.");
      }
    } catch (err: any) {
      if (!silent) toast.error("Failed to save document.");
    } finally {
      if (!silent) setSaving(false);
    }
  };

  // Auto-save debounced every 30 seconds
  useEffect(() => {
    if (loading || isNew) return;
    const interval = setInterval(() => {
      handleSave(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [title, content, loading, isNew]);

  // Send AI Chat Message
  const handleSendAiMessage = async (promptText: string) => {
    if (aiLoading) return;

    if (pendingProposal) {
      setContent(originalContentBeforeAi.current);
      setPendingProposal(null);
    }

    const userMsg: ChatMsg = { role: "user", content: promptText };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setAiLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        messages: updatedMessages,
        documentTitle: title,
        documentContent: content,
        selectedText: selectedText || undefined,
        documentId: !isNew ? docId : undefined,
      });

      if (res.data.success) {
        const aiMsg: ChatMsg = {
          role: "ai",
          content: res.data.message,
          proposedContent: res.data.proposedContent,
          retryAttempt: res.data.retryAttempt,
          activeKeyMasked: res.data.activeKeyMasked,
        };

        setChatMessages((prev) => [...prev, aiMsg]);

        if (res.data.proposedContent) {
          originalContentBeforeAi.current = content;
          setPendingProposal(res.data.proposedContent);
          toast.info("Proposed changes ready for review.");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "AI service error.");
    } finally {
      setAiLoading(false);
      setSelectedText("");
    }
  };

  // Accept AI Diff
  const handleAcceptProposal = () => {
    if (!pendingProposal) return;
    setContent(pendingProposal);
    setPendingProposal(null);
    toast.success("Changes applied.");
  };

  // Reject AI Diff
  const handleRejectProposal = () => {
    if (!pendingProposal) return;
    setContent(originalContentBeforeAi.current);
    setPendingProposal(null);
    toast.info("Changes discarded.");
  };

  // Export to PDF
  const handleExportPdf = async () => {
    if (isNew) {
      toast.error("Please save your document first.");
      return;
    }

    setExportingPdf(true);
    try {
      const res = await api.post(
        "/export/pdf",
        { documentId: docId },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF downloaded.");
    } catch (err: any) {
      toast.error("Failed to generate PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex flex-col">
        <div className="h-14 border-b border-stone-200 bg-white" />
        <EditorSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col h-screen overflow-hidden">
      {/* Top Editor Toolbar */}
      <header className="h-14 border-b border-stone-200/80 bg-white px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link
            href="/dashboard"
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-md hover:bg-stone-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-semibold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-800 focus:outline-none px-1 py-0.5 max-w-sm truncate"
            placeholder="Untitled Document"
          />

          {lastSaved && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-stone-400 font-mono">
              <Clock className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf || isNew}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-md shadow-2xs transition disabled:opacity-40"
          >
            {exportingPdf ? <Spinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Export PDF</span>
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-md shadow-2xs transition disabled:opacity-40"
          >
            {saving ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Editor Canvas Pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-4 flex-1 flex flex-col">
            {pendingProposal && (
              <DiffPreview
                originalHtml={content}
                proposedHtml={pendingProposal}
                onAccept={handleAcceptProposal}
                onReject={handleRejectProposal}
              />
            )}

            <div className="flex-1 min-h-[500px]">
              <EditorCanvas
                content={pendingProposal || content}
                onChange={setContent}
                onSelectionChange={setSelectedText}
              />
            </div>
          </div>
        </main>

        {/* AI Assistant Side Panel */}
        <AIChatPanel
          messages={chatMessages}
          isLoading={aiLoading}
          selectedText={selectedText}
          onSendMessage={handleSendAiMessage}
          onQuickAction={handleSendAiMessage}
          onClearSelection={() => setSelectedText("")}
        />
      </div>
    </div>
  );
}

export default function DocumentEditorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#fbfbfd] flex flex-col">
          <div className="h-14 border-b border-stone-200 bg-white" />
          <EditorSkeleton />
        </div>
      }
    >
      <DocumentEditorContent />
    </React.Suspense>
  );
}
