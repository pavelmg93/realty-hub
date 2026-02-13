"use client";

import dynamic from "next/dynamic";

const FeedMap = dynamic(() => import("./FeedMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-100 rounded-lg flex items-center justify-center" style={{ height: "500px" }}>
      <span className="text-sm text-slate-400">Loading map...</span>
    </div>
  ),
});

export default FeedMap;
