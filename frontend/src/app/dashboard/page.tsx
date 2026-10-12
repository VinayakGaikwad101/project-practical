"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { DocumentListSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DocItem {
  _id: string;
  title: string;
  status: string;
  tags: string[];
  updatedAt: string;
}

const ITEMS_PER_PAGE = 6;

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }

    if (user) {
      fetchDocuments();
    }
  }, [user, authLoading, router]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/documents");
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this document?")) return;

    try {
      await api.delete(`/documents/${id}`);
      toast.success("Document deleted.");
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err: any) {
      toast.error("Failed to delete document.");
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / ITEMS_PER_PAGE));
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocs, currentPage]);

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              Documents
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Authored by <span className="font-medium text-stone-800">{user?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-md text-xs text-stone-800 focus:outline-none focus:border-stone-800 placeholder:text-stone-400 shadow-2xs"
              />
            </div>

            <Link
              href="/editor/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-md transition shadow-2xs shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Document</span>
            </Link>
          </div>
        </div>

        {/* Document Grid / Skeleton / Empty State */}
        <div className="mt-6">
          {loading ? (
            <DocumentListSkeleton />
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-stone-200 p-8 space-y-3">
              <div className="w-10 h-10 bg-stone-100 text-stone-600 rounded-lg mx-auto flex items-center justify-center border border-stone-200">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">
                No documents found
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery
                  ? "No documents match your query."
                  : "You haven't authored any documents yet."}
              </p>
              {!searchQuery && (
                <Link
                  href="/editor/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-md transition shadow-2xs mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Drafting</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedDocs.map((doc) => (
                  <Link
                    key={doc._id}
                    href={`/editor/${doc._id}`}
                    className="group block border border-stone-200/90 rounded-lg p-4 bg-white hover:border-stone-400 hover:shadow-xs transition space-y-3 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-stone-100 text-stone-700 rounded border border-stone-200 group-hover:bg-stone-900 group-hover:text-white transition">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h3 className="font-medium text-stone-900 text-sm group-hover:text-stone-950 transition truncate">
                          {doc.title}
                        </h3>
                      </div>

                      <button
                        onClick={(e) => handleDelete(doc._id, e)}
                        title="Delete"
                        className="text-stone-400 hover:text-stone-700 p-1 rounded hover:bg-stone-100 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-100 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                      </div>

                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 uppercase">
                        {doc.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-stone-200 text-xs text-stone-500">
                  <p>
                    Showing <span className="font-medium text-stone-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                    <span className="font-medium text-stone-800">
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredDocs.length)}
                    </span>{" "}
                    of <span className="font-medium text-stone-800">{filteredDocs.length}</span> documents
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="px-2 font-mono text-[11px] text-stone-700 font-medium">
                      {currentPage} / {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
