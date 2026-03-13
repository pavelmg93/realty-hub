"use client";

import { useState } from "react";
import ListingForm from "@/components/listings/ListingForm";
import { formatPrice } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";

type AIResult = {
  fields: Record<string, unknown>;
  confidence: Record<string, number>;
  duplicate_warning: { found: boolean; listing_id: number | null; similarity: number };
  description_draft: string;
  follow_up_questions: Array<{ field: string; question_vi: string; question_en: string }>;
  geo_from_exif: { lat: number; lng: number } | null;
};

export default function NewListingPage() {
  const { t, lang } = useLanguage();
  const [userText, setUserText] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, unknown>>({});
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParseWithAI = async () => {
    const text = userText.trim();
    if (!text) return;
    setParsing(true);
    setParseError(null);
    try {
      const res = await fetch("/api/ai/parse-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, existingListings: [] }),
      });
      if (!res.ok) {
        setParseError("Parse failed");
        return;
      }
      const data = await res.json();
      setAiResult(data);
      setFollowUpAnswers({});
    } catch {
      setParseError("Request failed");
    } finally {
      setParsing(false);
    }
  };

  const initialFormData = aiResult
    ? {
        ...Object.fromEntries(
          Object.entries(aiResult.fields).filter(
            ([_, v]) => v !== null && v !== undefined
          )
        ) as Record<string, unknown>,
        ...followUpAnswers,
        description: aiResult.description_draft || undefined,
      }
    : undefined;

  const handleFollowUpAnswer = (field: string, value: unknown) => {
    setFollowUpAnswers((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {t("addListing")}
      </h1>

      {/* Chat-centric entry: describe in your words, then AI extracts */}
      <section
        className="mb-6 rounded-xl border border-[var(--border)] p-4"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          {lang === "vi"
            ? "Nhập hoặc dán mô tả BĐS (tiếng Việt). Nhấn \"Phân tích bằng AI\" để điền sẵn các trường."
            : "Type or paste your listing description (Vietnamese). Tap \"Parse with AI\" to prefill fields."}
        </p>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder={
            lang === "vi"
              ? "VD: Bán nhà 2 tầng đường Nguyễn Thị Minh Khai, phường Lộc Thọ, 80m², 3 PN, giá 3.5 tỷ..."
              : "e.g. Bán nhà 2 tầng đường Nguyễn Thị Minh Khai, phường Lộc Thọ, 80m², 3 PN, giá 3.5 tỷ..."
          }
          rows={5}
          className="w-full rounded-xl p-3 text-sm resize-y border border-[var(--border)]"
          style={{ backgroundColor: "var(--bg-input)" }}
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={handleParseWithAI}
            disabled={parsing || !userText.trim()}
            className="px-4 py-2.5 text-white text-sm rounded-lg disabled:opacity-50 font-medium transition-colors"
            style={{ backgroundColor: "var(--orange)" }}
          >
            {parsing
              ? (lang === "vi" ? "Đang phân tích..." : "Analyzing...")
              : lang === "vi"
                ? "Phân tích bằng AI"
                : "Parse with AI"}
          </button>
          {parseError && (
            <span className="text-sm text-[var(--error)]">{parseError}</span>
          )}
        </div>

        {aiResult && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              {lang === "vi" ? "Kết quả phân tích" : "AI extracted"}
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              {aiResult.fields.price_vnd != null && (
                <span className="px-2 py-1 rounded bg-[var(--orange)]/20 text-[var(--orange)]">
                  {formatPrice(Number(aiResult.fields.price_vnd))}
                </span>
              )}
              {aiResult.fields.area_m2 != null && (
                <span className="px-2 py-1 rounded bg-[var(--info)]/20 text-[var(--info)]">
                  {Number(aiResult.fields.area_m2)} m²
                </span>
              )}
              {aiResult.fields.ward != null && String(aiResult.fields.ward) !== "" && (
                <span className="px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)]">
                  {String(aiResult.fields.ward)}
                </span>
              )}
              {Object.entries(aiResult.fields)
                .filter(
                  ([k]) =>
                    !["price_vnd", "area_m2", "ward"].includes(k) &&
                    aiResult.fields[k] != null
                )
                .map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)]"
                  >
                    {k}: {String(v)}
                  </span>
                ))}
            </div>
            {aiResult.duplicate_warning?.found && (
              <p className="text-sm text-amber-500 mt-2">
                {lang === "vi"
                  ? "Có thể trùng với BĐS đã có."
                  : "Possible duplicate listing."}
              </p>
            )}
            {aiResult.follow_up_questions?.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  {lang === "vi" ? "Câu hỏi bổ sung (chọn hoặc điền form bên dưới)" : "Follow-up (choose or fill form below)"}
                </p>
                {aiResult.follow_up_questions.map((q) => (
                  <div key={q.field} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {lang === "vi" ? q.question_vi : q.question_en}
                    </span>
                    {q.field === "has_elevator" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleFollowUpAnswer("has_elevator", true)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            followUpAnswers.has_elevator === true
                              ? "bg-[var(--info)]/20 border-[var(--info)] text-[var(--info)]"
                              : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          {lang === "vi" ? "Có" : "Yes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFollowUpAnswer("has_elevator", false)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            followUpAnswers.has_elevator === false
                              ? "bg-[var(--info)]/20 border-[var(--info)] text-[var(--info)]"
                              : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                          }`}
                        >
                          {lang === "vi" ? "Không" : "No"}
                        </button>
                      </>
                    )}
                    {q.field === "legal_status" && (
                      <>
                        {["so_do", "so_hong", "so_chung_nhan"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleFollowUpAnswer("legal_status", opt)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              followUpAnswers.legal_status === opt
                                ? "bg-[var(--info)]/20 border-[var(--info)] text-[var(--info)]"
                                : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                            }`}
                          >
                            {opt === "so_do" ? (lang === "vi" ? "Sổ đỏ" : "Red book") : opt === "so_hong" ? (lang === "vi" ? "Sổ hồng" : "Pink book") : (lang === "vi" ? "Sổ chung nhận" : "Certificate")}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Review & edit: full form (prefilled when AI was used) */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          {lang === "vi" ? "Xem lại và xuất bản" : "Review & publish"}
        </h2>
        <ListingForm
          key={aiResult ? "prefill" : "new"}
          initialData={initialFormData}
        />
      </section>

      <p className="text-xs text-[var(--text-muted)] mt-6">
        {lang === "vi"
          ? "Để bật AI thật (Gemini): thêm GEMINI_API_KEY vào .env và cập nhật /api/ai/parse-listing. Xem ROADMAP-v2.md Phase 2."
          : "To enable real AI (Gemini): add GEMINI_API_KEY to .env and update /api/ai/parse-listing. See ROADMAP-v2.md Phase 2."}
      </p>
    </div>
  );
}
