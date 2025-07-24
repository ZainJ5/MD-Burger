"use client";
import { create } from "zustand";

export const useOrderTypeStore = create((set) => ({
  orderType: "",
  setOrderType: (type) => set({ orderType: type }),
}));
