// components/ListingCard.tsx

type ListingCardProps = {
  id: string
  title: string
  price: number
  category: string
  location: string
}

const CATEGORY_STYLES: Record<string, { emoji: string; color: string }> = {
  Books: { emoji: "📚", color: "#DBEAFE" },
  Shoes: { emoji: "👟", color: "#FEF3C7" },
  Electronics: { emoji: "🎧", color: "#F3E8FF" },
  Clothes: { emoji: "👕", color: "#DCFCE7" },
  Bags: { emoji: "🎒", color: "#FFEDD5" },
}

const DEFAULT_STYLE = { emoji: "🏷️", color: "#F3F4F6" }

export default function ListingCard({ title, price, category, location }: ListingCardProps) {
  const { emoji, color } = CATEGORY_STYLES[category] ?? DEFAULT_STYLE

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div
        className="h-36 flex items-center justify-center text-4xl"
        style={{ background: color }}
      >
        {emoji}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
          {category}
        </p>
        <p className="font-semibold text-gray-900 text-sm mt-1 truncate">{title}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="font-black text-gray-900">S$ {price}</p>
          <p className="text-xs text-gray-400">{location}</p>
        </div>
      </div>
    </div>
  )
}





