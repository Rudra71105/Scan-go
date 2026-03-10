export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: number;
  user_id: string;
  total: number;
  items: string; // JSON string of CartItem[]
  payment_method: string;
  created_at: string;
}
