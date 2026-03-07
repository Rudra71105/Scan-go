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
}
