"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  BookOpen, 
  Layers, 
  Flame, 
  ArrowUpRight, 
  Brain, 
  Clock, 
  CheckCircle2, 
  Award, 
  TrendingUp,
  Zap,
  GraduationCap,
  Play,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

interface OverviewProps {
  userName: string;
  onNavigate: (section: string) => void;
}

export default function OverviewSection({ userName, onNavigate }: OverviewProps) {
  const [activeChallenge, setActiveChallenge] = useState<number>(1);

  const quickLaunchers = [
    {
      id: "vocabulary",
      title: "AI Lexicon Vault",
      subtitle: "Explore 1,240 advanced TOEFL & GRE lexical terms with contextual examples.",
      icon: BookOpen,
      badge: "6 New Today",
      actionText: "Open Vault",
      section: "vocabulary",
      progress: 74,
    },
    {
      id: "flashcards",
      title: "3D Smart Flashcards",
      subtitle: "Spaced-repetition card decks tailored to your memory retention curves.",
      icon: Layers,
      badge: "Due: 18 Cards",
      actionText: "Start Session",
      section: "flashcards",
      progress: 45,
    },
    {
      id: "ailabs",
      title: "AI Study Lab & Tutoring",
      subtitle: "Generate mnemonics, Socratic concept dissections, and paragraph polishes.",
      icon: Sparkles,
      badge: "GPT-Powered",
      actionText: "Launch AI Lab",
      section: "ailabs",
      progress: 92,
    },
  ];

  const recentActivities = [
    {
      time: "2 hours ago",
      title: "Mastered 'Perspicacious' & 12 related academic adjectives",
      category: "Vocabulary Hub",
      xp: "+45 XP",
      icon: BookOpen,
    },
    {
      time: "Yesterday",
      title: "Completed Spaced Review: Advanced Business Rhetoric (Deck 3)",
      category: "Flashcard Arena",
      xp: "+120 XP",
      icon: Layers,
    },
    {
      time: "2 days ago",
      title: "Generated Socratic conceptual breakdown for 'Epistemology'",
      category: "AI Study Lab",
      xp: "+80 XP",
      icon: Sparkles,
    },
    {
      time: "3 days ago",
      title: "Achieved 14-Day Consecutive Study Streak milestone!",
      category: "Milestone Attained",
      xp: "+250 XP",
      icon: Flame,
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fadeIn righteous-regular text-[#0D0D0D]">
      
      {/* HERO WELCOME BANNER (DEEP PURPLE TO SLATE ACCENT) */}
      <div className="relative p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-r from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4] overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#A58CF4]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/50 text-[#FAFAFA] text-xs font-black tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#A58CF4] animate-pulse" />
            <span>AI Study Assistant Active</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Welcome back, <span className="text-[#A58CF4] underline decoration-white/40">{userName}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F7F7] leading-relaxed font-normal">
            Your personalized neural study engine is ready. You have <strong>18 flashcards</strong> lined up for optimal retention today and a hot <strong>14-day study streak</strong> to defend. Let's elevate your knowledge!
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate("flashcards")}
              className="px-6 py-3.5 rounded-2xl bg-white text-[#433075] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] text-xs font-black shadow-md transition-all duration-300 flex items-center gap-2 active:scale-95 cursor-pointer group border border-transparent hover:border-[#736A86]"
            >
              <Play className="w-4 h-4 fill-current text-current group-hover:scale-110 transition-transform" />
              <span>Resume Study Session</span>
            </button>
            <button
              onClick={() => onNavigate("ailabs")}
              className="px-5 py-3.5 rounded-2xl bg-[#0D0D0D]/60 border border-[#A58CF4] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] text-[#FAFAFA] text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm group"
            >
              <Brain className="w-4 h-4 text-[#A58CF4] group-hover:text-[#FAFAFA]" />
              <span>Explore AI Lab</span>
            </button>
          </div>
        </div>

        {/* Floating Streak Badge on Right */}
        <div className="mt-6 md:mt-0 md:absolute md:right-8 md:top-1/2 md:-translate-y-1/2 flex items-center gap-4 p-5 rounded-3xl bg-white text-[#0D0D0D] border-2 border-[#433075] shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[#433075] border border-[#A58CF4] flex items-center justify-center text-[#FAFAFA] font-extrabold text-xl shadow-inner">
            <Flame className="w-7 h-7 fill-[#A58CF4] text-[#A58CF4] animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#736A86]">Current Streak</div>
            <div className="text-2xl font-black text-[#0D0D0D]">14 Days</div>
            <div className="text-[11px] text-[#433075] font-bold flex items-center gap-1">
              <span>Top 5% Learner</span>
              <TrendingUp className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* METRIC DASHBOARD GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Vocabulary Mastery", value: "88%", sub: "+4% from last week", icon: BookOpen },
          { label: "Active Flashcard Decks", value: "12", sub: "340 total mastered", icon: Layers },
          { label: "AI Socratic Queries", value: "48", sub: "1,420 tokens processed", icon: Sparkles },
          { label: "Total Study Hours", value: "34.5", sub: "Average 2.2 hrs/day", icon: Clock },
        ].map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-5 rounded-3xl bg-white border border-[#C8CED6] hover:bg-gradient-to-br hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-[#736A86] hover:shadow-xl transition-all duration-300 shadow-sm flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black text-[#736A86] group-hover:text-[#F7F7F7] uppercase tracking-wider transition-colors">{stat.label}</span>
                <div className="p-2.5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] text-[#433075] group-hover:bg-[#FAFAFA]/20 group-hover:text-[#FAFAFA] group-hover:border-transparent transition-all">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-[#0D0D0D] group-hover:text-white transition-colors">{stat.value}</div>
                <div className="text-[11px] font-bold mt-1 text-[#433075] group-hover:text-[#A58CF4] transition-colors flex items-center gap-1">
                  <span>{stat.sub}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CORE STUDY ENGINES (QUICK LAUNCH) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0D0D0D] tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#433075]" />
              <span>Core Learning Modules</span>
            </h2>
            <p className="text-xs text-[#736A86]">Select a specialized WordNest engine to proceed with your studies</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickLaunchers.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.section)}
                className="group p-6 rounded-3xl bg-white border border-[#C8CED6] hover:bg-gradient-to-br hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-[#736A86] hover:shadow-2xl transition-all duration-300 shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#F7F7F7] border border-[#C8CED6] text-[#433075] text-[10px] font-black uppercase tracking-wider group-hover:bg-[#FAFAFA]/20 group-hover:text-[#FAFAFA] group-hover:border-transparent transition-all shadow-sm">
                  {item.badge}
                </div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] group-hover:border-transparent group-hover:bg-[#FAFAFA]/20 flex items-center justify-center mb-5 text-[#433075] group-hover:text-[#FAFAFA] transition-all">
                    <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-base font-black text-[#0D0D0D] group-hover:text-white transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowUpRight className="w-4 h-4 text-[#433075] group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-[#736A86] group-hover:text-[#F7F7F7] leading-relaxed mt-2 font-semibold transition-colors">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#C8CED6]/60 group-hover:border-[#FAFAFA]/20 space-y-2 transition-colors">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#736A86] group-hover:text-[#C8CED6]">Module Mastery</span>
                    <span className="text-[#0D0D0D] group-hover:text-white font-black">{item.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F7F7F7] group-hover:bg-[#FAFAFA]/20 overflow-hidden border border-[#C8CED6] group-hover:border-transparent transition-colors">
                    <div 
                      className="h-full bg-[#433075] group-hover:bg-[#A58CF4] transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAILY CHALLENGE & RECENT TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Challenge Card */}
        <div className="lg:col-span-1 p-6 sm:p-8 rounded-3xl bg-white border border-[#C8CED6] flex flex-col justify-between space-y-6 shadow-md">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F7F7] border border-[#C8CED6] text-[#0D0D0D] text-xs font-black uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-[#433075]" /> Daily Quests
              </span>
              <span className="text-[11px] font-black text-[#433075]">2 of 3 Done</span>
            </div>
            <h3 className="text-base font-black text-[#0D0D0D]">Today's Retention Goals</h3>
            <p className="text-xs text-[#736A86] mt-1 font-medium">Complete daily tasks to maximize neural pathway consolidation and earn XP rewards.</p>

            <div className="mt-5 space-y-3">
              {[
                { id: 1, text: "Review 15 Spaced Flashcards", done: true, reward: "50 XP" },
                { id: 2, text: "Explore 5 Advanced Words", done: true, reward: "35 XP" },
                { id: 3, text: "Run 1 AI Socratic Tutoring session", done: false, reward: "80 XP" },
              ].map((task) => (
                <div 
                  key={task.id}
                  onClick={() => !task.done && onNavigate("ailabs")}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                    task.done 
                      ? "bg-[#F7F7F7] border-[#C8CED6]/60 text-[#736A86] line-through" 
                      : "bg-[#433075] border-[#433075] text-[#FAFAFA] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      task.done ? "bg-[#433075] border-[#A58CF4] text-[#FAFAFA]" : "border-white/60 text-transparent"
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-extrabold">{task.text}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${
                    task.done ? "bg-white text-[#433075] border-[#C8CED6]" : "bg-white text-[#433075] border-white"
                  }`}>
                    {task.reward}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#F7F7F7] border border-[#C8CED6] text-center">
            <div className="text-xs font-black text-[#0D0D0D] mb-2">Weekly Streak Progress</div>
            <div className="flex justify-between items-center px-2 py-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center border transition-transform hover:scale-110 ${
                    i <= 4 ? "bg-[#433075] text-[#FAFAFA] border-[#A58CF4] shadow-sm" : "bg-white text-[#736A86] border-[#C8CED6]"
                  }`}>
                    {i <= 4 ? "✓" : day}
                  </div>
                  <span className="text-[10px] font-black text-[#736A86]">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-[#C8CED6] flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-[#0D0D0D] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#433075]" />
                  <span>Recent Activity & Insights</span>
                </h3>
                <p className="text-xs text-[#736A86] font-medium">Your real-time study timeline across all WordNest modules</p>
              </div>
              <button 
                onClick={() => onNavigate("analytics")}
                className="text-xs text-[#433075] font-black hover:text-[#0D0D0D] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View All Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4 relative before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-[#C8CED6]">
              {recentActivities.map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="relative flex items-start gap-4 pl-1 group">
                    <div className="w-9 h-9 rounded-2xl bg-white border-2 border-[#C8CED6] group-hover:border-transparent group-hover:bg-[#433075] flex items-center justify-center z-10 shrink-0 transition-all text-[#433075] group-hover:text-[#FAFAFA] shadow-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] group-hover:border-transparent transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm group-hover:bg-gradient-to-r group-hover:from-[#736A86] group-hover:to-[#272A3B] group-hover:text-[#FAFAFA]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-[#433075] text-[#FAFAFA]">
                            {act.category}
                          </span>
                          <span className="text-[11px] font-bold text-[#736A86] group-hover:text-[#C8CED6]">{act.time}</span>
                        </div>
                        <p className="text-xs font-black text-[#0D0D0D] group-hover:text-[#FAFAFA] transition-colors">
                          {act.title}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xs font-black text-[#433075] bg-white px-3 py-1.5 rounded-xl border border-[#C8CED6] shadow-sm group-hover:bg-[#FAFAFA]/20 group-hover:text-[#FAFAFA] group-hover:border-transparent transition-all">
                          {act.xp}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#C8CED6] flex items-center justify-between text-xs text-[#736A86]">
            <span className="font-bold">Neural sync rate: <strong className="text-[#433075]">Optimal (99.8%)</strong></span>
            <span className="text-[11px] font-black text-[#0D0D0D]">WordNest v3.0 AI Engine</span>
          </div>
        </div>

      </div>
    </div>
  );
}
