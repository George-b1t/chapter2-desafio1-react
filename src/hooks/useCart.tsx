import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    };

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let itemToAdd = cart.find(item => item.id === productId);

      if ( !itemToAdd ) {
        const newProductOnCart = (await api.get(`products/${productId}`)).data;
        const toCart = [...cart, {
          ...newProductOnCart,
          amount: 1
        }];
        setCart(toCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(toCart));
      } else {
        updateProductAmount({ productId, amount: itemToAdd.amount+1 });
      };
    } catch {
      toast.error('Erro na adição do produto');
    };
  };

  const removeProduct = (productId: number) => {
    try {
      const itemExists = cart.find(item=>item.id === productId);
      
      if ( itemExists ) {
        const toCart = cart.filter(item => item.id !== productId);
        setCart(toCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(toCart));
      } else {
        throw new Error('Produto não existente')
      };
    } catch {
      toast.error('Erro na remoção do produto');
    };
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockItemQuantity: Stock = (await api.get(`/stock/${productId}`)).data;

      if ( amount < 1 ) {
        throw new Error('Quantidade inválida!')
      };

      if ( amount > stockItemQuantity.amount ) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const toCart = cart.map(item => {
          if ( item.id === productId ) {
            return {
              ...item,
              amount
            };
          };

          return item;
        });
        setCart(toCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(toCart));
      };
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
