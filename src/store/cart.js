import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,

  addToCart: (deal) =>
    set((state) => {
      const index = state.items.findIndex(
        (item) => item.cartItemId && item.cartItemId === deal.cartItemId
      );
      
      if (index === -1) {
        return {
          items: [
            ...state.items,
            { ...deal, quantity: 1, title: `${deal.title} x1` }
          ],
          total: state.total + Number(deal.price),
          itemCount: state.itemCount + 1,
        };
      }
      
      const newItems = [...state.items];
      const currentQuantity = newItems[index].quantity || 1;
      const newQuantity = currentQuantity + 1;
      const baseTitle = newItems[index].title.split(" x")[0];
      newItems[index] = {
        ...newItems[index],
        quantity: newQuantity,
        title: `${baseTitle} x${newQuantity}`,
      };
      
      return {
        items: newItems,
        total: state.total + Number(deal.price),
        itemCount: state.itemCount + 1,
      };
    }),

  updateItemQuantity: (index, newQuantity) => {
    if (newQuantity < 1) {
      return get().removeFromCart(index);
    }
    set((state) => {
      const newItems = [...state.items];
      const oldQuantity = newItems[index].quantity || 1;
      const priceDifference = (newQuantity - oldQuantity) * Number(newItems[index].price);
      const baseTitle = newItems[index].title.split(" x")[0];
      newItems[index] = {
        ...newItems[index],
        quantity: newQuantity,
        title: `${baseTitle} x${newQuantity}`,
      };
      
      return {
        items: newItems,
        total: state.total + priceDifference,
        itemCount: state.itemCount + (newQuantity - oldQuantity),
      };
    });
  },

  removeFromCart: (index) =>
    set((state) => {
      const newItems = [...state.items];
      const removedItem = newItems.splice(index, 1)[0];
      return {
        items: newItems,
        total: state.total - Number(removedItem.price) * removedItem.quantity,
        itemCount: state.itemCount - removedItem.quantity,
      };
    }),

  clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
}));
