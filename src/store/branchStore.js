"use client";
import { create } from "zustand";

export const useBranchStore = create((set) => ({
  branch: null,
  setBranch: (newBranch) => set({ branch: newBranch }),
}));
