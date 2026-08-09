"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Layers, 
  Flame, 
  Brain, 
  Clock, 
  TrendingUp,
  Play,
  ChevronRight,
  BookOpen,
  Gamepad2,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabase";

interface OverviewProps {
  userName: string;
  user?: any;
  onNavigate: (section: string) => void;
  prefetchedDecks?: any[] | null;
  prefetchedSessions?: any[] | null;
  prefetchedVocab?: any[] | null;
}

export default function OverviewSection({ 
  userName, 
  user, 
  onNavigate,
  prefetchedDecks,
  prefetchedSessions,
  prefetchedVocab
}: OverviewProps) {
  const [metrics, setMetrics] = useState({
    vocabCount: 0,
    decksCount: 0,
    aiQueries: 0,
    sessionsCount: 0,
    flashcardsCount: 0,
    streak: 0,
    totalXP: 0,
  });
  
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);

        // Compute from prefetched values or fetch from DB
        const vocabCount = (prefetchedVocab !== undefined && prefetchedVocab !== null) ? prefetchedVocab.length : ((await supabase.from("vocabulary_vault").select("*", { count: "exact", head: true }).eq("user_id", user.id)).count || 0);
        const decksCount = (prefetchedDecks !== undefined && prefetchedDecks !== null) ? prefetchedDecks.length : ((await supabase.from("study_sets").select("*", { count: "exact", head: true }).eq("user_id", user.id)).count || 0);
        const aiCount = (await supabase.from("ai_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id)).count || 0;
        const sessionCount = (prefetchedSessions !== undefined && prefetchedSessions !== null) ? prefetchedSessions.length : ((await supabase.from("practice_sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id)).count || 0);
        const flashcardsCount = (await supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", user.id)).count || 0;
        
        const practiceSessions = (prefetchedSessions !== undefined && prefetchedSessions !== null) ? prefetchedSessions : ((await supabase.from("practice_sessions").select("created_at, xp_earned, mode").eq("user_id", user.id)).data || []);

        // Calculate unique days for streak & total XP
        let streak = 0;
        let totalXP = 0;
        if (practiceSessions && practiceSessions.length > 0) {
          const uniqueDays = new Set(practiceSessions.map(s => new Date(s.created_at).toDateString()));
          streak = uniqueDays.size;
          totalXP = practiceSessions.reduce((acc, curr) => acc + (curr.xp_earned || 0), 0);
        }

        // Calculate AI interactions based on logs + AI sessions + estimated queries
        const aiSessionsCount = practiceSessions.filter((s: any) => s.mode === "aigrader" || s.mode === "quiz").length;
        const estimatedQueries = Math.floor(totalXP / 25) + aiSessionsCount;
        const computedAiCount = Math.max(estimatedQueries, aiCount);

        setMetrics({
          vocabCount: vocabCount,
          decksCount: decksCount,
          aiQueries: computedAiCount,
          sessionsCount: sessionCount,
          flashcardsCount: flashcardsCount,
          streak: streak,
          totalXP: totalXP
        });

        // Fetch Recent Activities
        const [practiceRes, aiRes] = await Promise.all([
          supabase.from("practice_sessions").select("mode, xp_earned, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
          supabase.from("ai_logs").select("log_type, query_term, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4)
        ]);
        
        let activities: any[] = [];
        if (practiceRes.data) {
          activities = activities.concat(practiceRes.data.map(p => ({
            id: `prac-${p.created_at}`,
            type: 'practice',
            time: new Date(p.created_at),
            title: `Completed ${p.mode} practice session`,
            category: "Practice",
            xp: p.xp_earned > 0 ? `+${p.xp_earned} XP` : "No XP",
            icon: Gamepad2
          })));
        }
        if (aiRes.data) {
          activities = activities.concat(aiRes.data.map(a => ({
            id: `ai-${a.created_at}`,
            type: 'ai',
            time: new Date(a.created_at),
            title: `Generated ${a.log_type} for '${a.query_term}'`,
            category: "AI Lab",
            xp: "Intelligence",
            icon: Sparkles
          })));
        }
        
        activities.sort((a, b) => b.time.getTime() - a.time.getTime());
        setRecentActivities(activities.slice(0, 5)); // Keep top 5 most recent
        
      } catch (e) {
        console.error("Error fetching overview data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, prefetchedDecks, prefetchedSessions, prefetchedVocab]);

  const quickLaunchers = [
    {
      id: "decks",
      title: "Study Sets and Decks",
      subtitle: "Organize and create custom flashcard decks for your academic subjects.",
      icon: Layers,
      badge: `${metrics.decksCount} Decks`,
      actionText: "Manage Decks",
      section: "decks",
      color: "from-[#433075] to-[#736A86]"
    },
    {
      id: "practice",
      title: "Practice Arena",
      subtitle: "Engage in active recall, spelling bees, and speed matches to solidify memory.",
      icon: Gamepad2,
      badge: `${metrics.sessionsCount} Sessions`,
      actionText: "Start Playing",
      section: "practice",
      color: "from-[#A58CF4] to-[#433075]"
    },
    {
      id: "progress",
      title: "Analytics and Progress",
      subtitle: "Track your learning velocity, study consistency, and experience points.",
      icon: TrendingUp,
      badge: `${metrics.totalXP} Total XP`,
      actionText: "View Analytics",
      section: "progress",
      color: "from-emerald-500 to-teal-700"
    },
  ];

  const formatRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn text-[#0D0D0D] w-full max-w-full overflow-x-hidden">
      
      {/* HERO WELCOME BANNER (CREATIVE & RESPONSIVE SCALE) */}
      <div className="relative p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border border-[#A58CF4]/40 overflow-hidden shadow-xl flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[24rem] sm:w-[32rem] h-[24rem] sm:h-[32rem] bg-[#A58CF4]/10 rounded-full blur-[70px] pointer-events-none -mr-16 -mt-16" />
        
        <div className="relative z-10 flex-1 space-y-2.5 sm:space-y-3 text-center lg:text-left w-full">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Welcome back, <span className="text-[#A58CF4] bg-clip-text bg-gradient-to-r from-[#A58CF4] to-pink-300 text-transparent">{userName}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-[#C8CED6] leading-relaxed font-medium max-w-lg mx-auto lg:mx-0">
            Your learning progress is synced. You have built <strong>{metrics.flashcardsCount} flashcards</strong> so far and maintained a <strong>{metrics.streak}-day streak</strong>. Keep up the momentum!
          </p>

          <div className="pt-1.5 sm:pt-3 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 justify-center lg:justify-start">
            <button
              onClick={() => onNavigate("practice")}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white text-[#433075] hover:bg-[#F7F7F7] text-xs sm:text-sm font-black shadow-md transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer group"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>Enter Arena</span>
            </button>
            <button
              onClick={() => onNavigate("decks")}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#FAFAFA]/10 border border-[#A58CF4]/50 hover:bg-[#FAFAFA]/20 text-[#FAFAFA] text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm group backdrop-blur-sm"
            >
              <Layers className="w-4 h-4 text-[#A58CF4] group-hover:text-white" />
              <span>Create Decks</span>
            </button>
          </div>
        </div>

        {/* Dynamic Mobile & Desktop Compact Streak Badge */}
        <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-3.5 sm:p-4 rounded-2xl shadow-xl w-full lg:w-auto shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 p-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-md shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-orange-200 opacity-90">Streak</div>
              <div className="text-lg sm:text-2xl font-black text-white">{metrics.streak} <span className="text-xs sm:text-sm font-black text-orange-200">Days</span></div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-1 border-l border-white/10 pl-3 sm:pl-4">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-200 opacity-90">Total XP</div>
              <div className="text-lg sm:text-2xl font-black text-white">{metrics.totalXP}</div>
            </div>
          </div>
        </div>
      </div>

      {/* METRIC DASHBOARD GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          { label: "Total Flashcards", value: metrics.flashcardsCount.toString(), icon: BookOpen, color: "text-[#433075]", bg: "bg-[#433075]/10" },
          { label: "Study Decks", value: metrics.decksCount.toString(), icon: Layers, color: "text-[#A58CF4]", bg: "bg-[#A58CF4]/10" },
          { label: "AI Interactions", value: metrics.aiQueries.toString(), icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Practice Sessions", value: metrics.sessionsCount.toString(), icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 sm:p-5 rounded-[2rem] bg-white border border-[#C8CED6]/60 hover:border-[#A58CF4]/50 hover:shadow-xl transition-all duration-300 shadow-sm flex flex-col justify-between group cursor-default"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs sm:text-sm font-black text-[#736A86] uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color} transition-all`}>
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
                  {isLoading ? <div className="h-8 w-16 bg-gray-200 animate-pulse rounded-lg" /> : stat.value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* CORE STUDY ENGINES (QUICK LAUNCH) - Takes up 2 columns on large screens */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0D0D0D] tracking-tight flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#433075]" />
                <span>Application Modules</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#736A86] mt-0.5 font-medium">Quickly navigate to your desired workspace</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {quickLaunchers.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.section)}
                  className="group p-5 sm:p-6 rounded-[2rem] bg-white border border-[#C8CED6]/60 hover:border-[#A58CF4] hover:shadow-2xl transition-all duration-300 shadow-sm cursor-pointer flex flex-col relative overflow-hidden h-full min-h-[220px]"
                >
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#F7F7F7] border border-[#C8CED6] text-[#433075] text-xs font-black uppercase tracking-wider shadow-sm z-10">
                    {item.badge}
                  </div>
                  
                  {/* Decorative background gradient on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${item.color} transition-opacity duration-500`} />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] group-hover:border-transparent group-hover:bg-[#433075] flex items-center justify-center mb-4 text-[#433075] group-hover:text-white transition-all shadow-sm">
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] flex items-center justify-between group-hover:text-[#433075] transition-colors">
                      <span>{item.title}</span>
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mt-2 font-medium flex-1">
                      {item.subtitle}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#C8CED6]/40 flex items-center justify-between text-[#433075] font-black text-xs sm:text-sm group-hover:text-[#A58CF4] transition-colors">
                      <span>{item.actionText}</span>
                      <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* REAL-TIME ACTIVITY FEED */}
        <div className="xl:col-span-1 flex flex-col space-y-4 h-full">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0D0D0D] tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#433075]" />
                <span>Recent Activity</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#736A86] mt-0.5 font-medium">Your latest actions across the platform</p>
            </div>
            <button 
              onClick={() => onNavigate("progress")}
              className="flex text-xs text-[#433075] font-black hover:text-[#A58CF4] items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 p-5 sm:p-6 rounded-[2rem] bg-white border border-[#C8CED6]/60 shadow-md flex flex-col relative overflow-hidden min-h-[300px]">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#C8CED6] border-t-[#433075] rounded-full animate-spin" />
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-4">
                <div className="w-16 h-16 rounded-full bg-[#F0EDF7] flex items-center justify-center text-[#A58CF4]">
                  <Clock className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm font-black text-[#0D0D0D]">No Activity Yet</p>
                <p className="text-xs text-[#736A86] max-w-[200px]">Complete a practice session or use AI tools to generate logs.</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-[#F0EDF7]">
                <AnimatePresence>
                  {recentActivities.map((act, i) => {
                    const Icon = act.icon;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={act.id} 
                        className="relative flex items-start gap-4 pl-1 group"
                      >
                        <div className="w-9 h-9 rounded-full bg-white border-2 border-[#C8CED6] group-hover:border-[#433075] flex items-center justify-center z-10 shrink-0 transition-colors text-[#736A86] group-hover:text-[#433075] shadow-sm">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pt-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs sm:text-sm font-black text-[#0D0D0D] leading-tight">
                              {act.title}
                            </p>
                            <span className="text-[10px] font-bold text-[#736A86] shrink-0 whitespace-nowrap">
                              {formatRelativeTime(act.time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                              act.type === 'practice' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {act.category}
                            </span>
                            <span className="text-[10px] font-bold text-[#736A86]">{act.xp}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
            
            <button 
              onClick={() => onNavigate("progress")}
              className="sm:hidden mt-4 pt-4 border-t border-[#C8CED6]/40 w-full text-center text-xs text-[#433075] font-black flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <span>View All Activity</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
