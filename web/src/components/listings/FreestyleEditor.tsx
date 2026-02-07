"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Paste or type your listing text (Vietnamese)
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="VD: Ban nha 2 tang duong Nguyen Thi Minh Khai, phuong Loc Tho, 80m2, 3PN, gia 3.5 ty..."
        rows={8}
        className="w-full border rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-black/20"
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={onParse}
          disabled={isParsing || !value.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isParsing ? "Parsing..." : "Parse Text"}
        </button>
        <span className="text-xs text-gray-400">
          Extracts structured data from Vietnamese listing text
        </span>
      </div>
    </div>
  );
}
