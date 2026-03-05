"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface AvatarCropperProps {
    imageSrc: string;
    onConfirm: (croppedBase64: string) => void;
    onCancel: () => void;
}

export default function AvatarCropper({ imageSrc, onConfirm, onCancel }: AvatarCropperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [posStart, setPosStart] = useState({ x: 0, y: 0 });

    const VIEWPORT = 280; // Visible circle size
    const OUTPUT = 400; // Final output resolution

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImgNaturalSize({ w: img.width, h: img.height });
            // Scale so smallest dimension fills the viewport
            const s = VIEWPORT / Math.min(img.width, img.height);
            setScale(s);
            // Center the image
            setPosition({
                x: (VIEWPORT - img.width * s) / 2,
                y: (VIEWPORT - img.height * s) / 2,
            });
        };
        img.src = imageSrc;
    }, [imageSrc]);

    const clampPosition = useCallback((x: number, y: number, s: number) => {
        const scaledW = imgNaturalSize.w * s;
        const scaledH = imgNaturalSize.h * s;
        // Don't let edges come inside the viewport
        const maxX = 0;
        const maxY = 0;
        const minX = VIEWPORT - scaledW;
        const minY = VIEWPORT - scaledH;
        return {
            x: Math.min(maxX, Math.max(minX, x)),
            y: Math.min(maxY, Math.max(minY, y)),
        };
    }, [imgNaturalSize]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        setDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setPosStart({ ...position });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        const newPos = clampPosition(posStart.x + dx, posStart.y + dy, scale);
        setPosition(newPos);
    };

    const handlePointerUp = () => {
        setDragging(false);
    };

    const handleZoom = (delta: number) => {
        const minScale = VIEWPORT / Math.min(imgNaturalSize.w, imgNaturalSize.h);
        const maxScale = minScale * 4;
        const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));
        // Adjust position to zoom toward center
        const centerX = VIEWPORT / 2;
        const centerY = VIEWPORT / 2;
        const imgCenterX = (centerX - position.x) / scale;
        const imgCenterY = (centerY - position.y) / scale;
        const newX = centerX - imgCenterX * newScale;
        const newY = centerY - imgCenterY * newScale;
        const clamped = clampPosition(newX, newY, newScale);
        setScale(newScale);
        setPosition(clamped);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        handleZoom(e.deltaY < 0 ? 0.05 : -0.05);
    };

    const handleConfirm = () => {
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT;
        canvas.height = OUTPUT;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Calculate source rectangle from position/scale
            const srcX = -position.x / scale;
            const srcY = -position.y / scale;
            const srcSize = VIEWPORT / scale;
            ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
            const base64 = canvas.toDataURL("image/jpeg", 0.85);
            onConfirm(base64);
        };
        img.src = imageSrc;
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "var(--space-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-6)", maxWidth: 400 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-xl)", color: "var(--color-gold-400)" }}>
                    Ajustar Fotografía
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", textAlign: "center" }}>
                    Arrastra la imagen para encuadrarla. Usa la rueda del mouse o los botones para acercar/alejar.
                </p>

                {/* Crop viewport */}
                <div
                    ref={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onWheel={handleWheel}
                    style={{
                        width: VIEWPORT,
                        height: VIEWPORT,
                        borderRadius: "50%",
                        overflow: "hidden",
                        position: "relative",
                        cursor: dragging ? "grabbing" : "grab",
                        border: "3px solid var(--color-gold-400)",
                        boxShadow: "0 0 40px rgba(250, 204, 21, 0.3)",
                        touchAction: "none",
                        userSelect: "none",
                    }}
                >
                    {imgNaturalSize.w > 0 && (
                        <img
                            src={imageSrc}
                            alt="Crop preview"
                            draggable={false}
                            style={{
                                position: "absolute",
                                left: position.x,
                                top: position.y,
                                width: imgNaturalSize.w * scale,
                                height: imgNaturalSize.h * scale,
                                pointerEvents: "none",
                                userSelect: "none",
                            }}
                        />
                    )}
                </div>

                {/* Zoom controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                    <button
                        type="button"
                        onClick={() => handleZoom(-0.08)}
                        style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontSize: "var(--text-xl)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >−</button>
                    <div style={{ width: 120, height: 4, background: "var(--color-bg-elevated)", borderRadius: 2, position: "relative" }}>
                        <div style={{ position: "absolute", top: -4, left: `${Math.min(100, Math.max(0, ((scale - (VIEWPORT / Math.min(imgNaturalSize.w || 1, imgNaturalSize.h || 1))) / ((VIEWPORT / Math.min(imgNaturalSize.w || 1, imgNaturalSize.h || 1)) * 3)) * 100))}%`, width: 12, height: 12, borderRadius: "50%", background: "var(--color-gold-400)", transform: "translateX(-50%)" }} />
                    </div>
                    <button
                        type="button"
                        onClick={() => handleZoom(0.08)}
                        style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontSize: "var(--text-xl)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >+</button>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "var(--space-4)", width: "100%" }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{ flex: 1, padding: "var(--space-3)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-secondary)", fontWeight: 700, cursor: "pointer" }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        style={{ flex: 1, padding: "var(--space-3)", background: "var(--gradient-gold)", color: "var(--color-bg-primary)", border: "none", borderRadius: "var(--radius-lg)", fontWeight: 700, cursor: "pointer" }}
                    >
                        ✅ Confirmar Recorte
                    </button>
                </div>
            </div>
        </div>
    );
}
