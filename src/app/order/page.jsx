export default function OrderPage({ searchParams }) {
    return (
      <OrderClient searchParams={searchParams} />
    );
  }
  
  import OrderClient from './OrderClient';