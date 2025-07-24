import { create } from 'zustand';

export const useMenuStore = create((set) => ({
  activeCategory: null,
  activeCategoryName: null,
  activeSubcategory: null,
  setActiveCategory: (category) => set({ activeCategory: category }),
  setActiveCategoryName: (name) => set({ activeCategoryName: name }), 
  setActiveSubcategory: (subcategory) => set({ activeSubcategory: subcategory }),
}));
