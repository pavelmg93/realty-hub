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
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Paste or type your listing text (Vietnamese)
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="VD: Ban nha 2 tang duong Nguyen Thi Minh Khai, phuong Loc Tho, 80m2, 3PN, gia 3.5 ty..."
        rows={8}
        className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={() => onParse()}
          disabled={isParsing || !value.trim()}
          className="px-4 py-2 bg-navy text-white text-sm rounded-lg hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isParsing ? "Parsing..." : "Parse Text"}
        </button>
        <span className="text-xs text-slate-400">
          Extracts structured data from Vietnamese listing text
        </span>
      </div>
    </div>
  );
}
