import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import {
    Trophy,
    Target,
    CheckCircle2,
    Calendar,
    LogOut,
    ChevronRight,
    Star,
    Zap
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
    const [student, setStudent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStudent();
    }, []);

    const loadStudent = async () => {
        // Note: In React app, we follow the same code-based logic if user wants.
        // However, usually React users are logged in via Auth.
        // For simplicity, we'll check if the logged in user has confirmed registrations.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('academy_students')
            .select(`
        *,
        academy_registrations!inner (
          child_name,
          child_age,
          academies (
            name,
            programs
          )
        )
      `)
            .eq('academy_registrations.user_id', user.id)
            .single();

        if (error) {
            console.error('Error loading student:', error);
            setIsLoading(false);
            return;
        }

        setStudent(data);
        setIsLoading(false);
    };

    if (isLoading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (!student) return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-900 border border-app-border rounded-3xl flex items-center justify-center mb-6">
                <Star className="text-slate-700 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Active Enrollment</h2>
            <p className="text-slate-500 text-sm max-w-xs mb-8">Join an academy today to start your professional training journey!</p>
            <button
                onClick={() => window.location.href = '#/academies'}
                className="bg-primary text-slate-950 px-8 py-4 rounded-2xl font-bold"
            >
                Discover Academies
            </button>
        </div>
    );

    const reg = student.academy_registrations;
    const academy = reg.academies;
    const programName = student.additional_details?.program || 'Elite';
    const program = (academy.programs || []).find((p: any) => p.name === programName);

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Profile Header */}
            <div className="p-8 pb-12 bg-gradient-to-b from-primary/10 to-transparent">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border-4 border-slate-950 shadow-2xl overflow-hidden relative">
                        {student.photo_url ? (
                            <img src={student.photo_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-800 text-4xl font-bold">{reg.child_name[0]}</div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[8px] font-black uppercase rounded tracking-widest">{student.student_code}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">{reg.child_name}</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{academy.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/80 p-5 rounded-3xl border border-app-border">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="text-amber-400 w-3 h-3" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rank XP</span>
                        </div>
                        <p className="text-2xl font-bold text-white">1,250</p>
                    </div>
                    <div className="bg-slate-900/80 p-5 rounded-3xl border border-app-border">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="text-green-400 w-3 h-3" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attendance</span>
                        </div>
                        <p className="text-2xl font-bold text-white">92%</p>
                    </div>
                </div>
            </div>

            <div className="px-8 space-y-8">
                {/* Badges Section */}
                <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                        Your Badges
                        <ChevronRight className="w-4 h-4" />
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                        {[
                            { icon: <Trophy className="text-amber-400" />, label: 'Champion' },
                            { icon: <Zap className="text-primary" />, label: 'Speed' },
                            { icon: <Target className="text-secondary" />, label: 'Sniper' }
                        ].map((b, i) => (
                            <div key={i} className="flex-shrink-0 w-20 h-20 bg-slate-900 border border-app-border rounded-2xl flex flex-col items-center justify-center gap-2">
                                {b.icon}
                                <span className="text-[8px] font-black uppercase text-slate-500">{b.label}</span>
                            </div>
                        ))}
                        <div className="flex-shrink-0 w-20 h-20 bg-slate-900/30 border border-dashed border-app-border rounded-2xl flex items-center justify-center text-slate-800">
                            <span className="text-xs font-bold font-mono">?</span>
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-app-border">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Weekly Schedule</h3>
                    {program ? (
                        <div className="bg-black/20 p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{program.schedule}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{program.name} Squad</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-xs text-center py-4">No schedule available.</p>
                    )}
                </div>

                {/* Coach Feedback Overlay-style */}
                <div className="p-8 bg-primary text-slate-950 rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-app-surface-2 rounded-full blur-3xl -mr-16 -mt-16" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Latest Feedback</h3>
                    <p className="text-sm font-bold leading-relaxed mb-6">"Fantastic focus during today's technical drills. Keep working on that weak foot!"</p>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-bold">S</div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Coach Salim</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
