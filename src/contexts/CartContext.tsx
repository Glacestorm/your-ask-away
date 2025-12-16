import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
  moduleKey: string;
  moduleName: string;
  moduleIcon?: string;
  price: number;
  quantity: number;
  licenseType: 'annual' | 'perpetual' | 'monthly';
  category?: string;
  isPremium?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (moduleKey: string) => void;
  updateQuantity: (moduleKey: string, quantity: number) => void;
  updateLicenseType: (moduleKey: string, licenseType: CartItem['licenseType']) => void;
  clearCart: () => void;
  isInCart: (moduleKey: string) => boolean;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
  promoCode: string | null;
  setPromoCode: (code: string | null) => void;
  applyPromoCode: (code: string) => Promise<boolean>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'obelixia_cart';
const SESSION_ID_KEY = 'obelixia_session_id';

const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem(SESSION_ID_KEY);
    if (stored) return stored;
    const newId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, newId);
    return newId;
  });

  // Load cart from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.moduleKey === item.moduleKey);
      if (existing) {
        return prev.map(i => 
          i.moduleKey === item.moduleKey 
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, id: Math.random().toString(36).substring(2) }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((moduleKey: string) => {
    setItems(prev => prev.filter(i => i.moduleKey !== moduleKey));
  }, []);

  const updateQuantity = useCallback((moduleKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(moduleKey);
      return;
    }
    setItems(prev => prev.map(i => 
      i.moduleKey === moduleKey ? { ...i, quantity } : i
    ));
  }, [removeItem]);

  const updateLicenseType = useCallback((moduleKey: string, licenseType: CartItem['licenseType']) => {
    setItems(prev => prev.map(i => 
      i.moduleKey === moduleKey ? { ...i, licenseType } : i
    ));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode(null);
    setDiscountPercent(0);
  }, []);

  const isInCart = useCallback((moduleKey: string) => {
    return items.some(i => i.moduleKey === moduleKey);
  }, [items]);

  const applyPromoCode = useCallback(async (code: string): Promise<boolean> => {
    // Simple promo codes for demo
    const promoCodes: Record<string, number> = {
      'WELCOME10': 10,
      'ENTERPRISE50': 15,
      'BANKING20': 20,
    };
    
    const upperCode = code.toUpperCase();
    if (promoCodes[upperCode]) {
      setPromoCode(upperCode);
      setDiscountPercent(promoCodes[upperCode]);
      return true;
    }
    return false;
  }, []);

  const subtotal = items.reduce((sum, item) => {
    let price = item.price;
    if (item.licenseType === 'perpetual') {
      price = price * 5; // 5x for perpetual
    } else if (item.licenseType === 'monthly') {
      price = price / 10; // Monthly is 1/10 of annual
    }
    return sum + (price * item.quantity);
  }, 0);

  const discount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * 0.21; // 21% IVA
  const total = taxableAmount + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateLicenseType,
      clearCart,
      isInCart,
      subtotal,
      discount,
      tax,
      total,
      itemCount,
      promoCode,
      setPromoCode,
      applyPromoCode,
      isCartOpen,
      setIsCartOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
