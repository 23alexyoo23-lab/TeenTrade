
// app/listings/page.tsx
import ListingCard from '@/components/ListingCard'

const LISTINGS = [
  { id: '1', title: 'IGCSE Maths Textbook', price: 12, category: 'Books', location: 'Orchard' },
  { id: '2', title: 'Nike Air Force 1 US8', price: 45, category: 'Shoes', location: 'Tampines' },
  { id: '3', title: 'Sony Headphones XM4', price: 180, category: 'Electronics', location: 'Bishan' },
  { id: '4', title: 'H&M Puffer Jacket S', price: 20, category: 'Clothes', location: 'Jurong' },
]

export default function ListingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse listings</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {LISTINGS.map((item) => (
          <ListingCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  )
}

