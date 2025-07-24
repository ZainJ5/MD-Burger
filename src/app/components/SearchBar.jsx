import React from 'react'
import { FaSearch } from 'react-icons/fa'

function SearchBar({ searchQuery, onSearchChange }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 my-6">
      <div className="flex items-center w-full border-2 border-red-500 rounded-full px-4 py-2 bg-white">
        <input
          type="text"
          className="flex-1 outline-none border-none text-base px-2"
          placeholder="Search Menu Items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button
          type="button"
          className="bg-transparent border-none text-red-500 text-xl ml-2 cursor-pointer"
        >
          <FaSearch />
        </button>
      </div>
    </div>
  )
}

export default SearchBar
