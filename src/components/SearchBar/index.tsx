export function SearchBar() {
  return (
    <div className="p-2">
      <input
        type="text"
        placeholder="Search..."
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
      />
    </div>
  );
}
