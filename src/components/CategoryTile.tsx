import Link from "next/link";
import { CategoryIcon } from "./CategoryIcon";
import type { Category } from "@/lib/types";

/** 7.3 Category tile — 110 x 100, icon 32px, caption label. */
export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link href={`/buy?category=${category.slug}`} className="tt-category-tile">
      <CategoryIcon slug={category.slug} />
      <span className="t-caption">{category.name}</span>
    </Link>
  );
}
