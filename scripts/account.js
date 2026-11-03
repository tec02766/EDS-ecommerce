const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const accountProfile = {
  name: 'Alicia Johnson',
  email: 'alicia.johnson@example.com',
  memberSince: '2023-02-11',
  phone: '(999) 012-3456',
};

export const accountOrders = [
  {
    orderId: 'ORD-1048',
    date: '2025-05-12',
    status: 'Delivered',
    total: 44.9 + 29.99 + 49.5,
    itemsCount: 3,
    items: [
      { name: 'Philodendron Imperial', quantity: 1, price: 44.9 },
      { name: 'Snake Plant Laurentii', quantity: 1, price: 29.99 },
      { name: 'Monstera Deliciosa', quantity: 1, price: 49.5 },
    ],
  },
  {
    orderId: 'ORD-1032',
    date: '2025-04-07',
    status: 'Shipped',
    total: 70 + 60.5,
    itemsCount: 2,
    items: [
      { name: 'Ceramic Pots Trio', quantity: 1, price: 70 },
      { name: 'Mud Pots Duo', quantity: 1, price: 60.5 },
    ],
  },
  {
    orderId: 'ORD-991',
    date: '2025-02-18',
    status: 'Processing',
    total: 38 + 95 + 145 + 85 + 32 + 15.5,
    itemsCount: 6,
    items: [
      { name: 'Terrazzo Planter', quantity: 1, price: 38 },
      { name: 'Beginner Green Thumb Bundle', quantity: 1, price: 95 },
      { name: 'Jungle Vibes Living Room Kit', quantity: 1, price: 145 },
      { name: 'Organic Shopping Bag', quantity: 1, price: 85 },
      { name: 'Ergonomic Golden Watering Can', quantity: 1, price: 32 },
      { name: 'Premium Plant Moisture Meter', quantity: 1, price: 15.5 },
    ],
  },
];

export const formatCurrency = (value = 0) => currencyFormatter.format(Number(value || 0));

export const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getAccountData = () => ({
  profile: { ...accountProfile },
  orders: accountOrders.map((order) => ({
    ...order,
    itemsCount: order.itemsCount || order.items.length,
  })),
});

export default getAccountData;
