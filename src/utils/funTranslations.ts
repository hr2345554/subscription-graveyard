export function getRealWorldComparison(amount: number) {
  if (!amount || amount <= 0) return "Nothing yet. Keep it up!";

  // Items list with approximate costs (USD base)
  const items = [
    { name: 'cups of coffee ☕', cost: 5 },
    { name: 'movie tickets 🎟️', cost: 12 },
    { name: 'months of Netflix 🍿', cost: 15.49 },
    { name: 'gym memberships 🏋️', cost: 40 },
    { name: 'PlayStation 5 consoles 🎮', cost: 500 },
    { name: 'iPhone 15 Pros 📱', cost: 1000 },
  ];

  // Sort items from most expensive to cheapest to find the best fit
  const sortedItems = [...items].sort((a, b) => b.cost - a.cost);

  for (let item of sortedItems) {
    const quantity = amount / item.cost;
    
    // Agar amount item ki cost se zyada hai, toh comparison banao
    if (quantity >= 1) {
      // FIX: Math.round ke baad .toString() lagaya hai taake TypeScript ko error na aaye
      const formattedQty = quantity < 10 ? quantity.toFixed(1) : Math.round(quantity).toString();
      
      // Agar .0 hai toh hata do (e.g. "2.0 iPhones" -> "2 iPhones")
      const cleanQty = formattedQty.endsWith('.0') ? formattedQty.slice(0, -2) : formattedQty;
      
      return `${cleanQty} ${item.name}`;
    }
  }

  // Agar amount bohot chota hai (jaise $2)
  const smallest = items[0];
  return `${(amount / smallest.cost).toFixed(1)} ${smallest.name}`;
}