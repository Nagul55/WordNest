"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-[#DFE3E8] to-[#C8CED6] text-[#0D0D0D] p-6 sm:p-12 md:p-16 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-xl border-2 border-[#C8CED6] rounded-[2.5rem] p-8 sm:p-12 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C8CED6]/60 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#433075] uppercase tracking-tight">Privacy Policy</h1>
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
              <span>1. Information We Collect</span>
            </h2>
            <p>
              When you authenticate using Google Sign-In, <strong>WordNest</strong> collects your email address, full name, and profile picture. We use this information solely to create your unique scholar profile, securely log you in, and synchronize your learning progress.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#0D0D0D] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#A58CF4]" />
              <span>2. How We Protect Your Data</span>
            </h2>
            <p>
              Your credentials are secured using industry-standard cryptography. We secure all communication via HTTPS/SSL protocols and never sell, trade, or distribute your personal profile details to any third-party marketing networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black text-[#0D0D0D] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#A58CF4]" />
              <span>3. Contact Support</span>
            </h2>
            <p>
              If you have any questions regarding your account data, deletion requests, or privacy settings, contact our privacy compliance officer at <a href="mailto:nagulworkspace@gmail.com" className="text-[#433075] underline">nagulworkspace@gmail.com</a>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
