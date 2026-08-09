"use client";

import React, { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Clock, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  Flame, 
  Layers, 
  BookOpen, 
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabase";

const isSameWeek = (date: Date) => {
  const today = new Date();
  const todayNum = today.getDay() === 0 ? 7 : today.getDay();
  
  // Start of this week (Monday 00:00:00)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - todayNum + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  // End of this week (Sunday 23:59:59)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
};

const formatDuration = (seconds: number) => {
  if (seconds === 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export default function AnalyticsSection({ 
  user,
  prefetchedSessions,
  prefetchedVocab,
  prefetchedFlashcards
}: { 
  user?: any;
  prefetchedSessions?: any[] | null;
  prefetchedVocab?: any[] | null;
  prefetchedFlashcards?: any[] | null;
}) {
  const [stats, setStats] = useState({
    totalXp: 0,
    totalTime: 0,
    streak: 0,
    masteredCount: 0,
    learningCount: 0,
    reviewCount: 0,
    totalVocab: 0
  });

  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([
    { day: "Mon", totalDurationSeconds: 0, totalXp: 0, percentage: 0, modes: {} },
    { day: "Tue", totalDurationSeconds: 0, totalXp: 0, percentage: 0, modes: {} },
    { day: "Wed", totalDurationSeconds: 0, totalXp: 0, percentage: 0, modes: {} },
    { day: "Thu", totalDurationSeconds: 0, totalXp: 0, percentage: 0, modes: {} },
    { day: "Fri", totalDurationSeconds: 0, totalXp: 0, percentage: 0, modes: {} },
    { day: "Sat", totalDurationSeconds: 0, totalXp: 0, percentage: 0, modes: {} },
    { day: "Sun", totalDurationSeconds: 0, totalXp: 0, percentage: 0, modes: {} },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;
      try {
        // Use prefetched sessions or fetch if not present
        const sessions = prefetchedSessions !== null 
          ? prefetchedSessions 
          : (await supabase
              .from("practice_sessions")
              .select("mode, xp_earned, duration_seconds, created_at")
              .eq("user_id", user.id)).data;

        let totalXp = 0;
        let totalTime = 0; // in minutes

        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const modeMeta: Record<string, { label: string, color: string }> = {
          flashcards: { label: "Flashcards", color: "#4F46E5" },
          speedmatch: { label: "Speed Match", color: "#F59E0B" },
          quiz: { label: "AI Quiz", color: "#EF4444" },
          spelling: { label: "Spelling Dictation", color: "#10B981" },
          aigrader: { label: "AI Sentence Evaluator", color: "#EC4899" },
        };

        const dailyData = daysOfWeek.map(day => ({
          day,
          totalDurationSeconds: 0,
          totalXp: 0,
          modes: {
            flashcards: { label: "Flashcards", durationSeconds: 0, color: "#4F46E5" },
            speedmatch: { label: "Speed Match", durationSeconds: 0, color: "#F59E0B" },
            quiz: { label: "AI Quiz", durationSeconds: 0, color: "#EF4444" },
            spelling: { label: "Spelling Dictation", durationSeconds: 0, color: "#10B981" },
            aigrader: { label: "AI Sentence Evaluator", durationSeconds: 0, color: "#EC4899" },
          } as Record<string, { label: string, durationSeconds: number, color: string }>
        }));

        if (sessions) {
          sessions.forEach(s => {
            const xp = s.xp_earned || 0;
            const dur = s.duration_seconds || (xp > 0 ? 150 : 0); // fallback to 2.5 mins if legacy session has XP
            
            totalXp += xp;
            totalTime += dur / 60; // accumulate total learning time in minutes

            const date = new Date(s.created_at);
            if (isSameWeek(date)) {
              // 0=Sun, 1=Mon ... We want 0=Mon, 6=Sun
              const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
              const modeKey = s.mode || "flashcards";

              dailyData[dayIndex].totalXp += xp;
              dailyData[dayIndex].totalDurationSeconds += dur;

              if (dailyData[dayIndex].modes[modeKey]) {
                dailyData[dayIndex].modes[modeKey].durationSeconds += dur;
              } else {
                dailyData[dayIndex].modes[modeKey] = {
                  label: modeMeta[modeKey]?.label || modeKey,
                  durationSeconds: dur,
                  color: modeMeta[modeKey]?.color || "#8B5CF6"
                };
              }
            }
          });
        }

        const maxDailyTimeSeconds = Math.max(
          ...dailyData.map(d => d.totalDurationSeconds),
          600 // minimum 10 minutes (600s) to keep a sane baseline
        );

        const mappedWeekly = dailyData.map(d => ({
          ...d,
          percentage: (d.totalDurationSeconds / maxDailyTimeSeconds) * 100
        }));

        setWeeklyActivity(mappedWeekly);

        // Calculate Streak from practice sessions
        let computedStreak = 0;
        if (sessions && sessions.length > 0) {
          const sessionDates = Array.from(new Set(
            sessions.map(s => new Date(s.created_at).toISOString().split('T')[0])
          )).sort().reverse();

          const todayStr = new Date().toISOString().split('T')[0];
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

          if (sessionDates.includes(todayStr) || sessionDates.includes(yesterdayStr)) {
            let checkDate = sessionDates.includes(todayStr) ? new Date() : yesterdayDate;
            while (true) {
              const dateStr = checkDate.toISOString().split('T')[0];
              if (sessionDates.includes(dateStr)) {
                computedStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else {
                break;
              }
            }
          } else {
            computedStreak = sessions.length > 0 ? 1 : 0;
          }
        }

        // Fetch vocabulary stats & custom flashcards
        const vocab = (prefetchedVocab !== undefined && prefetchedVocab !== null)
          ? prefetchedVocab
          : (await supabase
              .from("vocabulary_vault")
              .select("status")
              .eq("user_id", user.id)).data;

        const flashcardsCount = (prefetchedFlashcards !== undefined && prefetchedFlashcards !== null)
          ? prefetchedFlashcards.length
          : ((await supabase
              .from("flashcards")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)).count || 0);

        const totalTerms = (flashcardsCount || 0) + (vocab ? vocab.length : 0);

        let mastered = 0, learning = 0, review = 0;
        if (vocab && vocab.length > 0) {
          vocab.forEach(v => {
            if (v.status === "Mastered") mastered++;
            else if (v.status === "Learning") learning++;
            else review++;
          });
        } else if (sessions && sessions.length > 0 && totalTerms > 0) {
          // Derive progression dynamically from sessions completed
          const totalSessions = sessions.length;
          mastered = Math.min(totalTerms, Math.floor(totalSessions * 1.5) + Math.floor(totalXp / 40));
          learning = Math.min(totalTerms - mastered, Math.floor(totalSessions * 2) + Math.floor(totalXp / 20));
          review = Math.max(0, totalTerms - (mastered + learning));
        } else {
          mastered = 0;
          learning = 0;
          review = 0;
        }

        setStats({
          totalXp,
          totalTime,
          streak: computedStreak,
          masteredCount: mastered,
          learningCount: learning,
          reviewCount: review,
          totalVocab: totalTerms
        });

      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, prefetchedSessions, prefetchedVocab, prefetchedFlashcards]);

  const badges = [
    {
      title: "Lexicon Titan",
      desc: "Mastered advanced terminology and unlocked practice achievements.",
      icon: Award,
      unlocked: stats.totalXp >= 100 || stats.masteredCount >= 5,
      date: (stats.totalXp >= 100 || stats.masteredCount >= 5) ? "Unlocked" : "In Progress",
    },
    {
      title: "Synaptic Explorer",
      desc: "Earned 50+ XP from autonomous study sessions.",
      icon: Zap,
      unlocked: stats.totalXp >= 50,
      date: stats.totalXp >= 50 ? "Unlocked" : "In Progress",
    },
    {
      title: "Iron Discipline",
      desc: "Maintained an active study streak without missing a target.",
      icon: Flame,
      unlocked: stats.streak >= 1,
      date: stats.streak >= 1 ? "Unlocked" : "In Progress",
    },
    {
      title: "Polyglot Prodigy",
      desc: "Achieve active retention score across combined study decks.",
      icon: Target,
      unlocked: stats.totalXp >= 150 || (stats.totalVocab > 0 && (stats.masteredCount / stats.totalVocab) >= 0.5),
      date: (stats.totalXp >= 150 || (stats.totalVocab > 0 && (stats.masteredCount / stats.totalVocab) >= 0.5)) ? "Unlocked" : "In Progress",
    },
  ];

  const getEfficiencyGrade = () => {
    const xp = stats.totalXp;
    const streak = stats.streak;
    const retention = stats.totalVocab > 0 ? (stats.masteredCount + stats.learningCount * 0.5) / stats.totalVocab : 0;

    if (xp >= 1000 || (xp >= 500 && retention >= 0.8)) return "Grandmaster Scholar (Apex)";
    if (xp >= 500 || (xp >= 300 && retention >= 0.7)) return "Master Lexicographer (Tier S)";
    if (xp >= 250 || (xp >= 150 && streak >= 2)) return "Gold Scholar (Tier I)";
    if (xp >= 100 || (xp >= 50 && streak >= 1)) return "Silver Scholar (Tier II)";
    if (xp >= 30) return "Bronze Scholar (Tier III)";
    return "Novice Scholar (Initiate)";
  };

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse">Calculating Neural Synaptic Data...</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn w-full max-w-full overflow-x-hidden px-1 sm:px-6 text-[#0D0D0D]">
      
      {/* HEADER BANNER (GLASSMORPHIC REDESIGN) */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-10 rounded-[1.75rem] sm:rounded-[2rem] bg-gradient-to-br from-[#433075] via-[#5F46A9] to-[#A58CF4] text-[#FAFAFA] border border-[#A58CF4]/40 shadow-xl">
        {/* Abstract Background SVG */}
        <BarChart3 className="absolute -top-12 -right-10 w-64 h-64 text-white/5 pointer-events-none rotate-12 blur-sm" />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/30 text-[#A58CF4] text-[11px] sm:text-xs font-black uppercase tracking-wider mb-2 sm:mb-3 shadow-inner"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Neural Study Analytics</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-5xl font-black text-white tracking-tight"
          >
            Retention <span className="font-sans font-light">&</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A58CF4] to-white">Cadence</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-[#C8CED6] mt-1.5 sm:mt-2 font-extrabold max-w-lg leading-relaxed"
          >
            Visualize your memory consolidation curves, track daily XP trajectory, and unlock achievement badges.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 bg-white/10 backdrop-blur-xl text-white px-4 sm:px-6 py-3.5 sm:py-4 rounded-[1.25rem] sm:rounded-[1.5rem] border border-white/20 shadow-2xl shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#433075] to-[#A58CF4] flex items-center justify-center shadow-inner shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black uppercase text-[#A58CF4] tracking-wider">Efficiency Grade</div>
              <div className="text-lg sm:text-xl font-black text-white">{getEfficiencyGrade()}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* TOP SUMMARY STAT CARDS (GLASS TILES) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: "Total XP", value: `${stats.totalXp} XP`, sub: "Earned from practice", icon: Zap, color: "from-[#433075] to-[#A58CF4]" },
          { label: "Study Streak", value: `${stats.streak} Days`, sub: "Active learning", icon: Flame, color: "from-[#433075] to-[#A58CF4]" },
          { label: "Spaced Retention", value: stats.totalVocab > 0 ? `${Math.min(100, Math.round(((stats.masteredCount + stats.learningCount * 0.5) / stats.totalVocab) * 100))}%` : "0%", sub: `${stats.masteredCount} Mastered / ${stats.totalVocab} Total`, icon: Target, color: "from-[#433075] to-[#A58CF4]" },
          { label: "Dedicated Time", value: `${Math.round(stats.totalTime / 60)} Hrs`, sub: `(${Math.round(stats.totalTime)} mins)`, icon: Clock, color: "from-[#433075] to-[#A58CF4]" },
        ].map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              key={idx}
              className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 hover:border-[#A58CF4]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle hover gradient wash */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
                <span className="text-xs sm:text-sm font-black text-[#736A86] uppercase tracking-wider leading-tight mr-1">{stat.label}</span>
                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-md transform group-hover:rotate-12 transition-transform duration-300 shrink-0`}>
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm font-extrabold mt-1 text-[#736A86] truncate">
                  {stat.sub}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* WEEKLY ACTIVITY CHART & RETENTION CURVE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Activity Bar Chart */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#A58CF4]/40 transition-all duration-300 flex flex-col justify-between relative group">
          {/* Subtle Background SVG */}
          <Calendar className="absolute -bottom-10 -left-10 w-64 h-64 text-[#433075]/5 pointer-events-none -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110 z-0" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-[#0D0D0D] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#A58CF4]" />
                  <span>Weekly Study Cadence</span>
                </h3>
                <p className="text-xs text-[#736A86] font-semibold mt-1">Daily terms mastered vs scheduled spaced repetition intervals</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#433075] text-[#FAFAFA] text-[10px] font-black uppercase shadow-sm">
                This Week
              </span>
            </div>

            {/* Hover Breakdown Overlay Badge */}
            <AnimatePresence>
              {hoveredDay && (() => {
                const dayItem = weeklyActivity.find(d => d.day === hoveredDay);
                if (!dayItem || dayItem.totalDurationSeconds === 0) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-2 right-4 z-40 w-64 bg-[#0D0D0D]/95 backdrop-blur-2xl border border-[#A58CF4]/40 text-white p-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col gap-2 text-left pointer-events-none"
                  >
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#A58CF4] border-b border-white/10 pb-1.5">
                      <span>{dayItem.day} Breakdown</span>
                      <span className="text-emerald-400 font-mono">{formatDuration(dayItem.totalDurationSeconds)}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                      {Object.entries(dayItem.modes).map(([key, modeInfo]: [string, any]) => {
                        if (modeInfo.durationSeconds === 0) return null;
                        return (
                          <div key={key} className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wide text-gray-300">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: modeInfo.color }} />
                              <span className="truncate max-w-[130px]">{modeInfo.label}</span>
                            </div>
                            <span className="text-white font-mono font-black">{formatDuration(modeInfo.durationSeconds)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2 border-b border-[#C8CED6] pb-4">
              {weeklyActivity.map((item) => {
                return (
                  <div 
                    key={item.day} 
                    className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end"
                    onMouseEnter={() => setHoveredDay(item.day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* Clean Stacked Bar (No Cylinder Outline & No Dots for empty days) */}
                    <div className="w-full max-w-[36px] flex flex-col items-center justify-end h-48 relative">
                      {item.totalDurationSeconds > 0 ? (
                        <div 
                          className={`w-full flex flex-col-reverse gap-[2px] rounded-t-2xl overflow-hidden transition-all duration-300 transform-gpu shadow-md cursor-pointer ${hoveredDay && hoveredDay !== item.day ? "opacity-35 scale-95" : "opacity-100 scale-100 hover:brightness-110"}`}
                          style={{ height: `${Math.max(item.percentage, 10)}%` }}
                        >
                          {Object.entries(item.modes).map(([modeKey, modeInfo]: [string, any]) => {
                            if (modeInfo.durationSeconds === 0) return null;
                            return (
                              <div
                                key={modeKey}
                                className="w-full transition-all duration-300 rounded-[3px]"
                                style={{ 
                                  flexGrow: modeInfo.durationSeconds,
                                  backgroundColor: modeInfo.color,
                                  minHeight: "6px"
                                }}
                              />
                            );
                          })}
                        </div>
                      ) : null}
                    </div>

                    <span className={`text-xs font-black transition-colors ${hoveredDay === item.day ? "text-[#433075]" : "text-[#736A86]"}`}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-3 flex flex-wrap items-center justify-between gap-4 text-xs text-[#736A86] font-semibold border-t border-[#C8CED6]/30">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#433075]" /> Weekly XP: <strong className="text-[#0D0D0D]">{stats.totalXp} XP</strong>
            </span>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {[
                { label: "Flashcards", color: "#4F46E5" },
                { label: "Speed Match", color: "#F59E0B" },
                { label: "AI Quiz", color: "#EF4444" },
                { label: "Spelling", color: "#10B981" },
                { label: "AI Evaluator", color: "#EC4899" },
              ].map(legend => (
                <span key={legend.label} className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-[#736A86]">
                  <span className="w-2 h-2 rounded-full border border-[#C8CED6]/30" style={{ backgroundColor: legend.color }} />
                  <span>{legend.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Neural Retention Distribution Circle Card */}
        <div className="p-6 sm:p-8 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#A58CF4]/40 transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden group">
          {/* Subtle Background SVG */}
          <Layers className="absolute -bottom-6 -right-6 w-48 h-48 text-[#433075]/5 pointer-events-none rotate-12 transition-transform duration-700 group-hover:-rotate-0 group-hover:scale-110 z-0" />
          
          <div className="relative z-10">
            <h3 className="text-lg font-black text-[#0D0D0D] mb-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#A58CF4]" />
              <span>Retention Matrix</span>
            </h3>
            <p className="text-xs text-[#736A86] font-normal">Distribution of terms across your memory stages</p>

            <div className="mt-6 space-y-4">
              {[
                { label: "Mastered (Permanent)", pct: stats.totalVocab ? Math.round((stats.masteredCount / stats.totalVocab) * 100) : 0, color: "bg-[#433075]", count: `${stats.masteredCount} Terms` },
                { label: "In Spaced Consolidation", pct: stats.totalVocab ? Math.round((stats.reviewCount / stats.totalVocab) * 100) : 0, color: "bg-[#A58CF4]", count: `${stats.reviewCount} Terms` },
                { label: "New Unseen Lexicon", pct: stats.totalVocab ? Math.round((stats.learningCount / stats.totalVocab) * 100) : 0, color: "bg-[#C8CED6]", count: `${stats.learningCount} Terms` },
              ].map((row, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#0D0D0D] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="text-[#433075] font-black">{row.pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F7F7F7] overflow-hidden border border-[#C8CED6]/40">
                    <div className={`h-full ${row.color} transition-all duration-1000`} style={{ width: `${row.pct}%` }} />
                  </div>
                  <div className="text-[10px] text-right text-[#736A86] font-semibold">{row.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#F7F7F7] border border-[#C8CED6] text-center shadow-inner">
            <span className="text-[11px] text-[#736A86] font-normal block">
              Next scheduled consolidation review opens in <strong className="text-[#433075]">3 hours 45 mins</strong>.
            </span>
          </div>
        </div>

      </div>

      {/* ACHIEVEMENT BADGES & MILESTONES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0D0D0D] tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-[#433075]" />
              <span>Scholar Milestone Trophy Case</span>
            </h2>
            <p className="text-xs text-[#736A86]">Earn prestigious academic badges as you conquer vocabulary thresholds and maintain persistence</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                key={idx}
                className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-xl ${
                  badge.unlocked
                    ? "bg-white/80 border-[#C8CED6]/60 hover:bg-gradient-to-br hover:from-[#A58CF4] hover:to-[#433075] hover:text-[#FAFAFA] hover:border-transparent hover:shadow-[0_8px_30px_rgba(165,140,244,0.3)] hover:-translate-y-1"
                    : "bg-white/40 border-[#C8CED6]/30 opacity-70 hover:opacity-100 hover:bg-white/60"
                }`}
              >
                {/* Unlocked Glow */}
                {badge.unlocked && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#A58CF4]/5 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm ${
                      badge.unlocked
                        ? "bg-gradient-to-br from-[#433075] to-[#A58CF4] text-[#FAFAFA] border-transparent group-hover:bg-white/20 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                        : "bg-[#F7F7F7] text-[#736A86] border-[#C8CED6]/60"
                    }`}>
                      <Icon className="w-5 h-5 text-current drop-shadow-sm" />
                    </div>
                    {badge.unlocked ? (
                      <span className="px-3 py-1 rounded-full bg-[#A58CF4]/10 text-[#433075] font-black text-[10px] border border-[#A58CF4]/30 uppercase tracking-widest shadow-sm group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent transition-all">
                        Unlocked
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-white/50 text-[#736A86] font-black text-[10px] border border-[#C8CED6]/60 uppercase tracking-widest">
                        Locked
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg font-black transition-colors ${badge.unlocked ? "text-[#0D0D0D] group-hover:text-[#FAFAFA]" : "text-[#736A86]"}`}>
                    {badge.title}
                  </h3>
                  <p className={`text-xs mt-2 leading-relaxed font-semibold transition-colors ${badge.unlocked ? "text-[#736A86] group-hover:text-[#E2E8F0]" : "text-[#C8CED6]"}`}>
                    {badge.desc}
                  </p>
                </div>

                <div className={`mt-6 pt-3 border-t transition-colors text-[11px] font-extrabold flex items-center justify-between relative z-10 ${
                  badge.unlocked 
                    ? "border-[#C8CED6]/60 group-hover:border-white/20 text-[#A58CF4] group-hover:text-[#FAFAFA]" 
                    : "border-[#C8CED6]/40 text-[#C8CED6]"
                }`}>
                  <span className="tracking-wide">{badge.date}</span>
                  {badge.unlocked && <CheckCircle2 className="w-4 h-4 text-current drop-shadow-md" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
