"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  className = "",
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative min-w-[160px] ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-3.5 rounded-2xl bg-white/80 backdrop-blur-md border hover:border-[#A58CF4] focus:border-[#A58CF4] text-xs font-black text-[#0D0D0D] flex items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(165,140,244,0.15)] transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group ${
          isOpen ? "border-[#A58CF4] ring-4 ring-[#A58CF4]/10 bg-white" : "border-[#E5E7EB]"
        }`}
      >
        <span className="truncate relative z-10">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`p-1 rounded-full transition-colors duration-300 relative z-10 ${isOpen ? "bg-[#F0EDF7] text-[#433075]" : "bg-transparent text-[#736A86] group-hover:text-[#433075]"}`}>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
        {/* Subtle hover gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F0EDF7]/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      </button>

      {/* Dropdown Options Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 8, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 z-[100] p-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#E5E7EB] shadow-[0_20px_40px_-15px_rgba(67,48,117,0.2)] overflow-hidden max-h-64 overflow-y-auto space-y-1 scrollbar-hide"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-between cursor-pointer group/item relative overflow-hidden ${
                    isSelected
                      ? "bg-gradient-to-r from-[#433075] to-[#272A3B] text-white shadow-md"
                      : "text-[#0D0D0D] hover:bg-[#F0EDF7]"
                  }`}
                >
                  <span className="truncate relative z-10">{option.label}</span>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-[#A58CF4] shrink-0 relative z-10" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#A58CF4] opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 relative z-10" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
