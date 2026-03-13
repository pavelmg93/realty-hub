"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onParse: () => Promise<void> | void;
  isParsing: boolean;
}

export default function FreestyleEditor({
  value,
  onChange,
  onParse,
  isParsing,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
        Paste or type your listing text (Vietnamese)
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="VD: Ban nha 2 tang duong Nguyen Thi Minh Khai, phuong Loc Tho, 80m2, 3PN, gia 3.5 ty..."
        rows={8}
        className="w-full rounded-xl p-4 text-sm resize-y min-h-[180px]"
      />
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => onParse()}
          disabled={isParsing || !value.trim()}
          className="px-4 py-2.5 text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          style={{ backgroundColor: "var(--orange)" }}
        >
          {isParsing ? "Parsing..." : "Parse Text"}
        </button>
        <span className="text-xs text-[var(--text-muted)]">
          Extracts structured data from Vietnamese listing text
        </span>
      </div>
    </div>
  );
}
