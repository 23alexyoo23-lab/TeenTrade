// app/sell/page.tsx
export default function SellPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">List an item</h1>
      <div className="flex flex-col gap-4">
        <input type="text" placeholder="Item title" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <input type="number" placeholder="Price (S$)" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <select className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
          <option value="">Select category</option>
          <option value="books">Books</option>
          <option value="shoes">Shoes</option>
          <option value="clothes">Clothes</option>
          <option value="electronics">Electronics</option>
        </select>
        <textarea placeholder="Description" rows={4} className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <input type="text" placeholder="Location (e.g. Orchard)" className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl">
          Post listing
        </button>
      </div>
    </div>
  )
}

