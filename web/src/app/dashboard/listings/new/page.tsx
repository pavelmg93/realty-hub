"use client";

import ListingForm from "@/components/listings/ListingForm";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NewListingPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4">
        {t("addListing")}
      </h1>
      <ListingForm />
    </div>
  );
}
