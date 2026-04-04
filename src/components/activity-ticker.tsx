"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

interface TickerItem {
  text: string;
  key: string;
}

const TOKEN_NAMES = [
  "TEST", "GOLD", "PLS", "T-BILL", "eDAI", "MV", "WBTC", "ETH", "USDC", "LINK",
  "UNI", "AAVE", "COMP", "MKR", "CRV", "SUSHI", "YFI", "BAL", "SNX", "DYDX",
];

function generateTickerItems(): TickerItem[] {
  const items: TickerItem[] = [];
  const templates = [
    () => {
      const token = TOKEN_NAMES[Math.floor(Math.random() * TOKEN_NAMES.length)];
      const amount = (Math.random() * 5 + 0.1).toFixed(1);
      const version = Math.random() > 0.4 ? "V4" : "V3";
      return `Someone minted ${amount}M ${token} on ${version}`;
    },
    () => {
      const price = (Math.random() * 0.001 + 0.00001).toFixed(6);
      return `T-BILL price: $${price}`;
    },
    () => {
      const block = Math.floor(Math.random() * 500000 + 18000000);
      return `Block #${block.toLocaleString()}`;
    },
    () => {
      const token = TOKEN_NAMES[Math.floor(Math.random() * TOKEN_NAMES.length)];
      return `New V4 token created: ${token}`;
    },
    () => {
      const token = TOKEN_NAMES[Math.floor(Math.random() * TOKEN_NAMES.length)];
      const mult = (Math.random() * 3 + 1.0).toFixed(1);
      return `Multiplier increased to ${mult}x on ${token}`;
    },
    () => {
      const token = TOKEN_NAMES[Math.floor(Math.random() * TOKEN_NAMES.length)];
      const amount = (Math.random() * 10 + 0.5).toFixed(1);
      return `${amount}M ${token} tokens swapped via MultiHop`;
    },
    () => {
      const gas = (Math.random() * 50 + 10).toFixed(0);
      return `Gas price: ${gas} Gwei`;
    },
    () => {
      const token = TOKEN_NAMES[Math.floor(Math.random() * TOKEN_NAMES.length)];
      const ratio = (Math.random() * 3 + 0.5).toFixed(2);
      return `${token} profit ratio reached ${ratio}x`;
    },
  ];

  const timeAgoOptions = ["just now", "1m ago", "2m ago", "3m ago", "5m ago", "8m ago", "12m ago"];

  for (let i = 0; i < 10; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const text = template();
    const timeAgo = timeAgoOptions[Math.min(i, timeAgoOptions.length - 1)];
    items.push({
      text: `${text} · ${timeAgo}`,
      key: `ticker-${i}`,
    });
  }

  return items;
}

export function ActivityTicker() {
  const { connected } = useAppStore();
  const [items, setItems] = useState<TickerItem[]>([]);

  // Refresh ticker items periodically (callback avoids sync setState in effect body)
  useEffect(() => {
    const refresh = () => setItems(generateTickerItems());
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  // Don't show when wallet is connected or during SSR
  if (connected || items.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className="ticker-container bg-gray-900/80 border-b border-gray-800/50 overflow-hidden py-1.5">
      <div className="animate-marquee flex items-center whitespace-nowrap">
        {duplicatedItems.map((item, idx) => (
          <span
            key={`${item.key}-${idx}`}
            className="inline-flex items-center mx-4 text-[11px] font-mono text-emerald-400/70"
          >
            <span className="w-1 h-1 rounded-full bg-emerald-500/50 mr-2 flex-shrink-0" />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
