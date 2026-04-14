"use client";
import { create } from "zustand";

export const useBranchStore = create((set) => ({
  branch: null,
  branchVersion: 0, 
  setBranch: (newBranch) => set((state) => ({ 
    branch: newBranch,
    branchVersion: state.branchVersion + 1 
  })),
}));
