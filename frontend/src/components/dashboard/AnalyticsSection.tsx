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
import { motion } from "framer-motion";

import { supabase } from "@/lib/supabase";

export default function AnalyticsSection({ user }: { user?: any }) {
  const [stats, setStats] = useState({
    totalXp: 0,
    totalTime: 0,
    streak: 0,
    masteredCount: 0,
    learningCount: 0,
    reviewCount: 0,
    totalVocab: 0
  });

  const [weeklyActivity, setWeeklyActivity] = useState([
    { day: "Mon", words: 0, xp: 0, percentage: 0 },
    { day: "Tue", words: 0, xp: 0, percentage: 0 },
    { day: "Wed", words: 0, xp: 0, percentage: 0 },
    { day: "Thu", words: 0, xp: 0, percentage: 0 },
    { day: "Fri", words: 0, xp: 0, percentage: 0 },
    { day: "Sat", words: 0, xp: 0, percentage: 0 },
    { day: "Sun", words: 0, xp: 0, percentage: 0 },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;
      try {
        // Fetch practice sessions
        const { data: sessions } = await supabase
          .from("practice_sessions")
          .select("xp_earned, created_at")
          .eq("user_id", user.id);

        let totalXp = 0;
        let totalTime = 0;
        const weekData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
        const weekWords = [0, 0, 0, 0, 0, 0, 0];

        if (sessions) {
          totalTime = sessions.length * 2.5; // Approx 2.5 mins per session
          sessions.forEach(s => {
            totalXp += s.xp_earned || 0;
            const date = new Date(s.created_at);
            // JS getDay() is 0=Sun, 1=Mon. We want 0=Mon ... 6=Sun
            const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
            weekData[dayIndex] += s.xp_earned || 0;
            weekWords[dayIndex] += 5; // Approx 5 words per session
          });
        }

        const maxXp = Math.max(...weekData, 100);
        const mappedWeekly = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
          day,
          words: weekWords[i],
          xp: weekData[i],
          percentage: (weekData[i] / maxXp) * 100
        }));

        setWeeklyActivity(mappedWeekly);

        // Fetch vocabulary stats
        const { data: vocab } = await supabase
          .from("vocabulary_vault")
          .select("status")
          .eq("user_id", user.id);

        let mastered = 0, learning = 0, review = 0, total = 0;
        if (vocab) {
          total = vocab.length;
          vocab.forEach(v => {
            if (v.status === "Mastered") mastered++;
            else if (v.status === "Learning") learning++;
            else review++;
          });
        }

        setStats({
          totalXp,
          totalTime,
          streak: total > 0 ? 1 : 0, // placeholder streak logic
          masteredCount: mastered,
          learningCount: learning,
          reviewCount: review,
          totalVocab: total
        });

      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);


  const badges = [
    {
      title: "Lexicon Titan",
      desc: "Mastered 500+ advanced collegiate academic terminology terms.",
      icon: Award,
      unlocked: true,
      date: "Unlocked Jul 14",
    },
    {
      title: "Synaptic Explorer",
      desc: "Conducted 50 autonomous Socratic dialogues inside the Neural AI Lab.",
      icon: Zap,
      unlocked: true,
      date: "Unlocked Jul 28",
    },
    {
      title: "Iron Discipline",
      desc: "Maintained a continuous 14-day study streak without missing a target.",
      icon: Flame,
      unlocked: true,
      date: "Unlocked Yesterday",
    },
    {
      title: "Polyglot Prodigy",
      desc: "Achieve 95% retention score across all combined study decks.",
      icon: Target,
      unlocked: stats.totalVocab > 0 && (stats.masteredCount / stats.totalVocab) > 0.9,
      date: "In Progress",
    },
  ];

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse">Calculating Neural Synaptic Data...</div>;
  }

  return (
    <div className="space-y-8 pb-12 animate-fadeIn righteous-regular max-w-6xl mx-auto text-[#0D0D0D]">
      
      {/* HEADER BANNER (DEEP PURPLE TO SLATE GRADIENT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4] shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/50 text-[#FAFAFA] text-xs font-black uppercase tracking-wider mb-2 shadow-inner">
            <BarChart3 className="w-3.5 h-3.5 text-[#A58CF4]" />
            <span>Real-time Neural Study Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Retention & Cadence Metrics
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F7F7] mt-1 font-normal">
            Visualize your memory consolidation curves, track daily XP trajectory, and unlock achievement badges.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white text-[#0D0D0D] px-5 py-3 rounded-2xl border-2 border-[#433075] shadow-lg shrink-0">
          <TrendingUp className="w-6 h-6 text-[#433075]" />
          <div>
            <div className="text-[10px] font-bold uppercase text-[#736A86]">Efficiency Grade</div>
            <div className="text-sm font-black text-[#0D0D0D]">Tier A+ Scholar</div>
          </div>
        </div>
      </div>

      {/* TOP SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Total Vocabulary XP", value: `${stats.totalXp} XP`, sub: "Earned from practice", icon: Zap },
          { label: "Current Study Streak", value: `${stats.streak} Days`, sub: "Active learning", icon: Flame },
          { label: "Spaced Retention Rate", value: stats.totalVocab ? `${Math.round((stats.masteredCount / stats.totalVocab) * 100)}%` : "0%", sub: "Words Mastered", icon: TrendingUp },
          { label: "Total Dedicated Time", value: `${Math.round(stats.totalTime / 60)} Hrs`, sub: `(${Math.round(stats.totalTime)} mins total)`, icon: Clock },
        ].map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white border border-[#C8CED6] hover:border-[#433075] hover:shadow-xl transition-all duration-300 shadow-sm flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold text-[#736A86] uppercase tracking-wider group-hover:text-[#433075] transition-colors">{stat.label}</span>
                <div className="p-2.5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] text-[#433075] group-hover:bg-[#433075] group-hover:text-[#FAFAFA] transition-all">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-[#0D0D0D]">{stat.value}</div>
                <div className="text-[11px] font-bold mt-1 text-[#433075]">
                  {stat.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* WEEKLY ACTIVITY CHART & RETENTION CURVE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Activity Bar Chart */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-[#C8CED6] shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-[#0D0D0D] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#433075]" />
                  <span>Weekly Study Cadence (Words Processed)</span>
                </h3>
                <p className="text-xs text-[#736A86] font-normal">Daily terms mastered vs scheduled spaced repetition intervals</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#433075] text-[#FAFAFA] text-[10px] font-black uppercase shadow-sm">
                This Week
              </span>
            </div>

            <div className="h-60 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2 border-b border-[#C8CED6] pb-4">
              {weeklyActivity.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-black text-[#433075] opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.words}
                  </span>
                  <div className="w-full max-w-[44px] bg-[#F7F7F7] rounded-2xl h-44 flex items-end p-1 border border-[#C8CED6] group-hover:border-[#433075] transition-all overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${item.percentage}%` }}
                      transition={{ duration: 0.8 }}
                      className="w-full bg-gradient-to-t from-[#433075] to-[#A58CF4] rounded-xl transition-all group-hover:from-[#A58CF4] group-hover:to-[#433075]"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#736A86] group-hover:text-[#0D0D0D] transition-colors">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-2 flex flex-wrap items-center justify-between text-xs text-[#736A86] font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#433075]" /> Weekly Total: <strong className="text-[#0D0D0D]">{stats.totalXp} XP</strong>
            </span>
          </div>
        </div>

        {/* Neural Retention Distribution Circle Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#C8CED6] shadow-md flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-black text-[#0D0D0D] mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#433075]" />
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
              <div
                key={idx}
                className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-md group ${
                  badge.unlocked
                    ? "bg-white border-[#C8CED6] hover:bg-gradient-to-br hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-transparent hover:shadow-xl"
                    : "bg-[#F7F7F7] border-[#C8CED6]/60 opacity-60 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${
                      badge.unlocked
                        ? "bg-[#433075] text-[#FAFAFA] border-[#433075] group-hover:border-transparent group-hover:bg-white/20"
                        : "bg-white text-[#736A86] border-[#C8CED6]"
                    }`}>
                      <Icon className="w-6 h-6 text-current" />
                    </div>
                    {badge.unlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F7F7F7] text-[#433075] font-black text-[10px] border border-[#C8CED6] uppercase tracking-wider shadow-sm group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent transition-all">
                        Unlocked
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[#736A86] font-black text-[10px] border border-[#C8CED6] uppercase tracking-wider">
                        Locked
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-[#0D0D0D] group-hover:text-[#FAFAFA] transition-colors">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-[#736A86] group-hover:text-[#C8CED6] transition-colors mt-2 leading-relaxed font-normal">
                    {badge.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#C8CED6]/60 group-hover:border-white/20 transition-colors text-[11px] font-extrabold text-[#433075] group-hover:text-[#FAFAFA] flex items-center justify-between">
                  <span>{badge.date}</span>
                  {badge.unlocked && <CheckCircle2 className="w-4 h-4 text-current" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
