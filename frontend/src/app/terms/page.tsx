"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, HelpCircle } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-[#DFE3E8] to-[#C8CED6] text-[#0D0D0D] p-6 sm:p-12 md:p-16 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-xl border-2 border-[#C8CED6] rounded-[2.5rem] p-8 sm:p-12 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C8CED6]/60 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#433075] uppercase tracking-tight">Terms of Service</h1>
            <p className="text-xs text-[#736A86] font-bold">Last Updated: August 9, 2026</p>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F7F7F7] hover:bg-[#E2E8F0] text-[#433075] text-xs font-black transition-all border border-[#C8CED6]/60 shadow-sm shrink-0 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to WordNest</span>
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-[#374151] leading-relaxed font-semibold">
          
          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#0D0D0D] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#A58CF4]" />
              <span>1. Agreement to Terms</span>
            </h2>
            <p>
              By accessing or using the <strong>WordNest</strong> educational platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#0D0D0D] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#A58CF4]" />
              <span>2. Use of AI Evaluation Services</span>
            </h2>
            <p>
              WordNest provides automated AI evaluations for English written responses. You understand that AI scoring is for educational practice purposes and we strive to keep assessments accurate and context-aware.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
