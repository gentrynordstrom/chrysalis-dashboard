"use client";

import { useEffect, useState } from "react";

interface ToastItem {
  id: string;
  pot: "office" | "tech";
  amount: number;
  reason: string;
}

interface ToastProps {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const color = item.pot === "office" ? "border-blue-500/50 bg-blue-500/10" : "border-amber-500/50 bg-amber-500/10";
  const textColor = item.pot === "office" ? "text-blue-400" : "text-amber-400";

  return (
    <div
      className={`transform transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } border rounded-xl px-4 py-3 backdrop-blur-sm ${color}`}
    >
      <p className={`text-sm font-bold ${textColor}`}>
        +${item.amount} {item.pot === "office" ? "Office" : "Tech"} Pot
      </p>
      <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">
        {item.reason}
      </p>
    </div>
  );
}

export default function Toasts({ items, onDismiss }: ToastProps) {
  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  );
}
