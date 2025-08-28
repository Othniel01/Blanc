"use client";
import { useState } from "react";

type NotebookPage = {
  title: string; // Tab title
  content: React.ReactNode; // What to render when active
};

type NotebookProps = {
  pages: NotebookPage[

  ];
};

export default function Notebook({ pages }: NotebookProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="w-full mt-10">
      {/* Navbar */}
      <div className="notebook pl-5 navbar">
        <ul className="text-sm  flex  items-center">
          {pages.map((page, idx) => (
            <li
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`cursor-pointer pt-2 pb-2 px-4 transition-colors 
                ${activeIndex === idx 
                  ? "border-t border-l border-r active-note-page border-gray-200 border-b-0 bg-white" 
                  : "text-gray-600 hover:text-teal-700"}`}
            >
              {page.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Content */}
      <div className="notebook-content-1 border-t-1 border-gray-200 w-full h-1/2">
        <div className="p-3 w-full h-full">
          {pages[activeIndex].content}
        </div>
      </div>
    </div>
  );
}
