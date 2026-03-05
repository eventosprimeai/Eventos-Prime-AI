"use client";

import React, { useEffect, useState } from "react";
import { Download, Apple, Smartphone, LayoutDashboard, ChevronRight, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export default function DescargaPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden"
            style={{
                backgroundColor: "#0a0a0f",
                backgroundImage: "radial-gradient(ellipse at top, #1e1e2e 0%, #0a0a0f 70%)"
            }}>

            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 filter blur-[100px]" style={{ background: "radial-gradient(circle, #facc15 0%, transparent 70%)" }}></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 filter blur-[120px]" style={{ background: "radial-gradient(circle, #facc15 0%, transparent 70%)" }}></div>
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full opacity-5 filter blur-[80px]" style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}></div>
            </div>

            <div className="relative z-10 w-full max-w-5xl px-6 py-12 flex flex-col md:flex-row items-center gap-12 md:gap-20">

                {/* Left Side: Copy & Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(250,204,21,0.3)] bg-[rgba(250,204,21,0.05)] mb-6 animate-fade-in-up">
                        <Sparkles size={14} className="text-gold-400" />
                        <span className="text-xs font-bold tracking-wider text-gold-400 uppercase">Sistema Centralizado</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Bienvenido a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500">
                            EventosPrime AI
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Tu perfil ha sido creado exitosamente. Para comenzar a gestionar tus responsabilidades y coordinar operaciones en tiempo real, descarga nuestra aplicación móvil.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-400 to-gold-500 text-black font-bold rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                            <Apple size={24} />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] uppercase opacity-80">Descargar en</span>
                                <span className="text-lg">App Store</span>
                            </div>
                        </button>

                        <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#1f1f2e] border border-[#2a2a35] text-white font-bold rounded-xl transition-all hover:bg-[#2a2a35] hover:scale-105">
                            <Smartphone size={24} className="text-green-400" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] uppercase text-gray-400">Descargar en</span>
                                <span className="text-lg">Google Play</span>
                            </div>
                        </button>
                    </div>

                    <div className="mt-12 flex items-center gap-4 justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <div className="h-[1px] w-12 bg-gray-800"></div>
                        <span className="text-sm text-gray-500 font-medium">O prefiere la versión web</span>
                        <div className="h-[1px] w-12 bg-gray-800"></div>
                    </div>

                    <div className="mt-6 flex justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <a href="/login" className="group flex items-center gap-2 px-6 py-3 rounded-lg text-gray-300 hover:text-white transition-colors">
                            <LayoutDashboard size={18} className="text-gold-400" />
                            <span className="font-semibold">Ir al Panel de Control Web</span>
                            <ArrowRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-gold-400" />
                        </a>
                    </div>
                </div>

                {/* Right Side: Visual Mockup / Feature List */}
                <div className="flex-1 w-full max-w-md animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="relative rounded-2xl overflow-hidden p-1 bg-gradient-to-b from-[rgba(250,204,21,0.3)] to-[rgba(255,255,255,0.05)] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="bg-[#11111a] rounded-xl p-8 h-full flex flex-col relative z-20">

                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e1e2e] to-[#0a0a0f] border border-[#2a2a35] flex items-center justify-center mb-6 shadow-lg">
                                <ShieldCheck size={32} className="text-gold-400" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Seguridad y Control</h3>
                            <p className="text-gray-400 text-sm mb-8">
                                Tu acceso ha sido encriptado. Utiliza las credenciales que enviamos a tu correo electrónico para iniciar sesión.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { title: "Gestión en Tiempo Real", desc: "Supervisa tareas y operaciones al instante.", icon: "⚡" },
                                    { title: "Notificaciones Integradas", desc: "Alertas push directas para tu rol específico.", icon: "🔔" },
                                    { title: "Comunicación Segura", desc: "Módulo de chat interno con el equipo.", icon: "💬" }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] transition-all hover:bg-[rgba(255,255,255,0.05)]">
                                        <div className="text-2xl">{feature.icon}</div>
                                        <div>
                                            <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                                            <p className="text-gray-500 text-xs mt-1">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
