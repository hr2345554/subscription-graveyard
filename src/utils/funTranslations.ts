export function getRealWorldComparison(amount: number) {
  if (!amount || amount <= 0) return "Nothing yet. Keep it up!";

  // Humne list ko bada aur interesting kar diya hai
  const items = [
    { name: 'cups of coffee ☕', cost: 5 },
    { name: 'fast food meals 🍔', cost: 10 },
    { name: 'months of Spotify 🎵', cost: 11 },
    { name: 'movie tickets 🎟️', cost: 15 },
    { name: 'months of Netflix 🍿', cost: 15.49 },
    { name: 'gym memberships 🏋️', cost: 40 },
    { name: 'new video games 🎮', cost: 70 },
    { name: 'pairs of Nike Air Jordans 👟', cost: 150 },
    { name: 'PlayStation 5 consoles 🎮', cost: 500 },
    { name: 'round-trip flights to Bali ✈️', cost: 900 },
    { name: 'iPhone 15 Pros 📱', cost: 1000 },
    { name: 'MacBook Airs 💻', cost: 1200 },
  ];

  // 1. Pehle woh saari cheezein dhoondho jo user afford kar sakta hai
  const affordableItems = items.filter(item => amount >= item.cost);

  // Agar amount bohot chota hai (jaise $2)
  if (affordableItems.length === 0) {
    const cheapest = items[0];
    return `${(amount / cheapest.cost).toFixed(1)} ${cheapest.name}`;
  }

  // 2. SMART RANDOMIZER: 
  // Taake bar bar same message na aaye, hum amount ko use karke ek unique item pick karenge.
  // Isse amount change hote hi item bhi change hoga, lekin bar bar page refresh karne par same rahega.
  const seed = Math.floor(amount); 
  const selectedItem = affordableItems[seed % affordableItems.length];

  const quantity = amount / selectedItem.cost;
  
  // 3. Formatting: Agar 2.0 hai toh 2 dikhao, warna 1.5 jaisa dikhao
  let formattedQty: string;
  if (Math.abs(quantity - Math.round(quantity)) < 0.1) {
      formattedQty = Math.round(quantity).toString();
  } else {
      formattedQty = quantity.toFixed(1);
  }

  return `${formattedQty} ${selectedItem.name}`;
}