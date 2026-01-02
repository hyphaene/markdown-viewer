import { useEffect } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { SearchBar } from "./components/SearchBar";
import { useFileStore } from "./stores/fileStore";

function App() {
  const scan = useFileStore((state) => state.scan);

  useEffect(() => {
    scan(["~/Code", "~/Notes"]);
  }, [scan]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700">
        <SearchBar />
        <Sidebar />
      </div>
      <MarkdownViewer />
    </div>
  );
}

export default App;
