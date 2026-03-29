export default function ItemDetailModal({ item, onClose }) {
  if (!item) return null;

  const date = item.createdAt?.toDate
    ? item.createdAt.toDate().toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "Unknown";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="h-56 bg-gray-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              📦
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-3">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-gray-800">{item.name}</h2>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                item.type === "lost"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {item.type === "lost" ? "🔴 Lost" : "🟢 Found"}
            </span>
          </div>

          <p className="text-gray-600 text-sm">{item.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm pt-2">
            <div>
              <p className="text-gray-400 text-xs">Category</p>
              <p className="font-medium capitalize">{item.category || "General"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Location</p>
              <p className="font-medium">{item.location || "Not specified"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Date Reported</p>
              <p className="font-medium">{date}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Status</p>
              <p className="font-medium capitalize">{item.status || "pending"}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}