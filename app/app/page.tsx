"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { extractFrames } from '@/lib/extractFrames';

type AnalysisResult = {
  intent: string;
  element: string;
  duration_ms: number;
  delay_ms: number;
  easing: string;
  loops: boolean;
  description: string;
  keyframes_detected: number;
  performance_score: number;
  gpu_accelerated: boolean;
  accessibility_note: string;
  css: string;
  gsap: string;
  framer_motion: string;
  react_spring: string;
};

type TabType = "CSS" | "GSAP" | "Framer Motion" | "React Spring";

const intentColors: Record<string, string> = {
  morph: "#00ff88",
  hover: "#f59e0b",
  entrance: "#3b82f6",
  exit: "#ef4444",
  loading: "#8b5cf6",
  loop: "#10b981",
};

export default function AnimationConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState<number>(8);
  const [frames, setFrames] = useState<string[]>([]);
  const [frameThumbs, setFrameThumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stage, setStage] = useState<"idle" | "extracting" | "analyzing" | "done" | "error">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("CSS");
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [scannerIndex, setScannerIndex] = useState<number>(0);
  const [statusBarMsgIndex, setStatusBarMsgIndex] = useState<number>(0);
  const [progressWidth, setProgressWidth] = useState<number>(0);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stepsList = [
    `Extracting ${frames.length || 8} frames from video...`,
    "Sending frames to AI vision model...",
    "Detecting motion vectors...",
    "Analyzing easing curves...",
    "Identifying animation intent...",
    "Generating CSS keyframes...",
    "Generating GSAP timeline...",
    "Generating Framer Motion variants...",
    "Running performance audit...",
    "Checking accessibility compliance...",
    "Compiling output..."
  ];

  const statusMessages = [
    "Analyzing motion patterns...",
    "Reading easing curves...",
    "Detecting transform paths...",
    "Almost there..."
  ];

  useEffect(() => {
    if (stage === "analyzing") {
      setActiveStep(0);
      setScannerIndex(0);
      setStatusBarMsgIndex(0);
      setProgressWidth(0);

      const runSteps = (currentStep: number) => {
        setActiveStep(currentStep);
        if (currentStep < 10) {
          stepTimerRef.current = setTimeout(() => runSteps(currentStep + 1), 600);
        }
      };

      setTimeout(() => setProgressWidth(85), 100);
      
      stepTimerRef.current = setTimeout(() => runSteps(1), 600);

      scannerTimerRef.current = setInterval(() => {
        setScannerIndex(prev => (prev + 1) % (frames.length || 1));
      }, 300);

      statusTimerRef.current = setInterval(() => {
        setStatusBarMsgIndex(prev => (prev + 1) % 4);
      }, 3000);

    } else {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (scannerTimerRef.current) clearInterval(scannerTimerRef.current);
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      
      if (stage !== "done") {
        setProgressWidth(0);
      }
    }

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (scannerTimerRef.current) clearInterval(scannerTimerRef.current);
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, frames.length]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileWithCount = async (selectedFile: File, count: number) => {
    const isVideo = selectedFile.type.startsWith("video/");
    const isGif = selectedFile.type === "image/gif";
    
    if (!isVideo && !isGif) {
      setStage("error");
      setError("Please upload an MP4, WebM, MOV, or GIF file.");
      return;
    }

    setFile(selectedFile);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(selectedFile);
    setFileUrl(url);
    setStage("extracting");
    setError(null);
    setResult(null);
    setFrames([]);
    setFrameThumbs([]);

    try {
      const extracted = await extractFrames(selectedFile, count);
      setFrames(extracted);
      setFrameThumbs(extracted.map(b => "data:image/jpeg;base64," + b));
      setStage("idle");
    } catch (err: unknown) {
      setStage("error");
      setError((err as Error).message || "Failed to extract frames.");
    }
  };

  const handleFile = (selectedFile: File) => {
    handleFileWithCount(selectedFile, frameCount);
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFile(null);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    setFrames([]);
    setFrameThumbs([]);
    setStage("idle");
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateFrameCount = (count: number) => {
    setFrameCount(count);
    if (file) {
      handleFileWithCount(file, count);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!frames.length) return
    setLoading(true)
    setStage("analyzing")
    setResult(null)
    setError(null)

    try {
      // Build the message with frames as images
      // Puter.js supports passing images via base64
      const imageMessages = frames.map((b64) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: b64
        }
      }))

      const prompt = `You are a world-class frontend animation engineer.
I am giving you ${frames.length} sequential frames extracted from a UI animation video.

Carefully analyze the motion: transforms (translateX/Y, scale, rotate), 
opacity changes, color transitions, border-radius morphing, easing curves,
total duration, and the animation's intent.

Respond ONLY with a single valid JSON object. No markdown. No backticks. Just JSON:
{
  "intent": "morph",
  "element": "button",
  "duration_ms": 400,
  "delay_ms": 0,
  "easing": "cubic-bezier(0.4, 0, 0.2, 1)",
  "loops": false,
  "description": "A button morphs into a loading spinner",
  "keyframes_detected": 8,
  "performance_score": 92,
  "gpu_accelerated": true,
  "accessibility_note": "Add prefers-reduced-motion fallback",
  "css": "/* Complete production CSS keyframe code */",
  "gsap": "// Complete GSAP code",
  "framer_motion": "// Complete Framer Motion code",
  "react_spring": "// Complete React Spring code"
}`

      // Call Puter.js Claude API — no API key needed
      const response = await window.puter.ai.chat(
        [
          {
            role: "user",
            content: [
              ...imageMessages,
              { type: "text", text: prompt }
            ]
          }
        ],
        { model: "claude-sonnet-4-6" }
      )

      // Parse response
      const text = response?.message?.content
        ?.filter((c: { type: string; text?: string }) => c.type === "text")
        ?.map((c: { type: string; text?: string }) => c.text)
        ?.join("") ?? ""

      const clean = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)

      setResult(parsed)
      setActiveTab("CSS")
      setStage("done")

    } catch (err: unknown) {
      console.error("Puter analyze error:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage || "Analysis failed. Try again.")
      setStage("error")
    }

    setLoading(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const intentColor = result ? (intentColors[result.intent.toLowerCase()] || "#00ff88") : "#00ff88";

  const getCodeContent = () => {
    if (!result) return "";
    switch (activeTab) {
      case "CSS": return result.css;
      case "GSAP": return result.gsap;
      case "Framer Motion": return result.framer_motion;
      case "React Spring": return result.react_spring;
      default: return "";
    }
  };

  const handleCopy = () => {
    const code = getCodeContent();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightCode = (code: string) => {
    if (!code) return "";
    const tokens: { type: string; value: string }[] = [];
    const regex = /(".*?"|'.*?'|\/\/.*|\/\*[\s\S]*?\*\/|\b(?:\d+\.?\d*(?:ms|s|px|%|vw|vh|rem)?)\b|\b(?:const|let|var|return|import|from|export|function|async|await|new|true|false)\b|\b(?:duration|ease|transform|opacity|scale)\b)/g;

    let match;
    let lastIndex = 0;
    while ((match = regex.exec(code)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', value: code.slice(lastIndex, match.index) });
      }
      
      const val = match[0];
      let type = 'text';
      if (val.startsWith('"') || val.startsWith("'")) type = 'string';
      else if (val.startsWith('//') || val.startsWith('/*')) type = 'comment';
      else if (/^\d/.test(val)) type = 'number';
      else if (/^(const|let|var|return|import|from|export|function|async|await|new|true|false)$/.test(val)) type = 'keyword';
      else if (/^(duration|ease|transform|opacity|scale)$/.test(val)) type = 'property';

      tokens.push({ type, value: val });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < code.length) {
      tokens.push({ type: 'text', value: code.slice(lastIndex) });
    }

    return tokens.map((t) => {
      const escaped = t.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      switch(t.type) {
        case 'string': return `<span style="color: #a3e635">${escaped}</span>`;
        case 'comment': return `<span style="color: #3a3a4a">${escaped}</span>`;
        case 'number': return `<span style="color: #fb923c">${escaped}</span>`;
        case 'keyword': return `<span style="color: #c084fc">${escaped}</span>`;
        case 'property': return `<span style="color: #38bdf8">${escaped}</span>`;
        default: return escaped;
      }
    }).join("");
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', 
      overflow: 'hidden', backgroundColor: '#080808', color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        .copy-btn:hover {
          box-shadow: 0 0 12px #00ff8860;
          border-color: #00ff88 !important;
          color: #00ff88 !important;
        }
      `}} />

      {/* NAVBAR */}
      <nav style={{ 
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 24px', borderBottom: '1px solid #1a1a1a', backgroundColor: '#080808',
        flexShrink: 0
      }}>
        <Link href="/" style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: '#e2e8f0', textDecoration: 'none', fontWeight: 'bold' }}>⟨/⟩ MotionCode</Link>
        <Link href="/" style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: '#3a3a4a', textDecoration: 'none' }}>← Back to home</Link>
      </nav>

      {/* MAIN AREA */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANEL */}
        <div style={{ 
          width: 400, flexShrink: 0, borderRight: '1px solid #1a1a1a', 
          backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {/* PANEL HEADER */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid #1a1a1a' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 3, color: '#3a3a4a', fontWeight: 'bold' }}>INPUT</span>
          </div>

          {/* UPLOAD ZONE */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{ 
              margin: 20, padding: '36px 20px', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              border: `1.5px dashed ${dragActive ? '#00ff88' : file ? '#00ff8840' : '#1a1a1a'}`, 
              backgroundColor: dragActive ? '#00ff8808' : 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="video/*,.gif"
              onChange={(e) => e.target.files && e.target.files.length > 0 && handleFile(e.target.files[0])}
            />
            
            {!file ? (
              <React.Fragment>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 28, color: '#1a1a1a' }}>⬆</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: '#e2e8f0', marginTop: 12 }}>Drop animation here</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#3a3a4a', marginTop: 6 }}>MP4 · WebM · MOV · GIF</div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#00ff88', wordBreak: 'break-all', textAlign: 'center' }}>{file?.name}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#3a3a4a', marginTop: 6 }}>{file ? formatFileSize(file.size) : ''}</div>
                
                <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    style={{
                      fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#e2e8f0',
                      backgroundColor: '#1a1a1a', border: 'none', padding: '4px 10px',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                  >
                    CHANGE
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    style={{
                      fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#ef4444',
                      backgroundColor: '#ef444415', border: 'none', padding: '4px 10px',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ef444425'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef444415'}
                  >
                    DELETE
                  </button>
                </div>
              </React.Fragment>
            )}
          </div>

          {/* VIDEO PREVIEW */}
          {fileUrl && (
            <div style={{ margin: '0 20px', border: '1px solid #1a1a1a', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {file?.type?.startsWith('video/') ? (
                <video src={fileUrl} controls muted loop style={{ maxHeight: 200, width: '100%', objectFit: 'contain' }} />
              ) : (
                <img src={fileUrl} alt="preview" style={{ maxHeight: 200, width: '100%', objectFit: 'contain' }} />
              )}
            </div>
          )}

          {/* FRAME STRIP */}
          {frameThumbs.length > 0 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a1a', marginTop: 20 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 2, color: '#3a3a4a', marginBottom: 10 }}>EXTRACTED FRAMES ({frames.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {frameThumbs.map((thumb, i) => (
                  <img key={i} src={thumb} alt={`Frame ${i}`} style={{ width: 54, height: 38, objectFit: 'cover', border: '1px solid #1a1a1a' }} />
                ))}
              </div>
            </div>
          )}

          {/* FRAME COUNT SELECTOR */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #1a1a1a', marginTop: 'auto' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#3a3a4a', marginBottom: 10 }}>FRAME COUNT</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[4, 6, 8, 12].map(num => (
                <button
                  key={num}
                  onClick={() => updateFrameCount(num)}
                  style={{
                    fontFamily: 'Space Mono, monospace', fontSize: 12, padding: '4px 12px',
                    backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                    border: `1px solid ${frameCount === num ? '#00ff88' : '#1a1a1a'}`,
                    color: frameCount === num ? '#00ff88' : '#e2e8f0'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* PROGRESS BAR */}
          {loading && (
            <div style={{ margin: '0 20px 16px', height: 2, backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', background: 'linear-gradient(90deg, #00ff88, #00cc6e)',
                animation: 'progress 20s cubic-bezier(0.1, 0.7, 0.1, 1) forwards'
              }} />
            </div>
          )}

          {/* PUTER LOGO NOTICE */}
          <div style={{
            border: '1px solid #1a1a1a', padding: '10px 14px', 
            background: '#0a0a0a', margin: '0 20px 20px'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#3a3a4a' }}>ℹ</span>
              <div style={{ 
                fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#3a3a4a', 
                lineHeight: 1.6 
              }}>
                Powered by Puter.js — users sign in with a free Puter account 
                to run analysis. No API key required.{" "}
                <a 
                  href="https://developer.puter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#3a3a4a', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#00ff88'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#3a3a4a'}
                >
                  Learn more ↗
                </a>
              </div>
            </div>
          </div>

          {/* ANALYZE BUTTON */}
          <button
            onClick={handleAnalyze}
            disabled={!file || frames.length === 0 || loading || stage === "extracting"}
            style={{
              margin: '0 20px 20px 20px', padding: 14, cursor: (!file || frames.length === 0 || loading || stage === "extracting") ? 'not-allowed' : 'pointer',
              border: loading ? '1px solid #00ff88' : 'none',
              backgroundColor: (!file || frames.length === 0 || stage === "extracting") ? '#1a1a1a' : loading ? 'transparent' : '#00ff88',
              color: (!file || frames.length === 0 || stage === "extracting") ? '#3a3a4a' : loading ? '#00ff88' : '#080808',
              fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 'bold', transition: 'all 0.2s'
            }}
          >
            {loading ? "Analyzing..." : stage === "extracting" ? "Extracting..." : "Analyze"}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#080808', overflow: 'hidden', position: 'relative' }}>
          
          {/* TOP PROGRESS BAR */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#1a1a1a', zIndex: 10,
            opacity: stage === "done" ? 0 : (stage === "analyzing" ? 1 : 0),
            transition: stage === "done" ? 'opacity 0.4s ease 0.4s' : 'none',
            pointerEvents: 'none'
          }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #00ff88, #00cc6e)',
              width: stage === "done" ? '100%' : (stage === "analyzing" ? `${progressWidth}%` : '0%'),
              transition: stage === "done" ? 'width 0.1s ease-out' : 'width 20s cubic-bezier(0.1, 0, 0.3, 1)'
            }} />
          </div>

          {!result ? (
            stage === "analyzing" ? (
              <div style={{ flex: 1, padding: '48px 60px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* 1. ANIMATED STEPS LIST */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {stepsList.map((step, i) => {
                    if (i > activeStep) return null;
                    const isActive = i === activeStep;
                    return (
                      <div key={i} style={{ 
                        display: 'flex', alignItems: 'center', gap: 12, 
                        animation: 'fadeSlideIn 0.3s ease forwards',
                        opacity: 0
                      }}>
                        {isActive ? (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00ff88', animation: 'blink 0.8s infinite', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 6, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#3a3a4a', flexShrink: 0 }}>✓</div>
                        )}
                        <div style={{ 
                          fontFamily: 'Space Mono, monospace', fontSize: 12, 
                          color: isActive ? '#e2e8f0' : '#3a3a4a'
                        }}>
                          [{i + 1}] {step}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 2. SCANNING FRAME STRIP */}
                <div style={{ marginTop: 40, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#3a3a4a', letterSpacing: 2, marginBottom: 8 }}>SCANNING FRAMES</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {frameThumbs.map((thumb, i) => (
                      <div key={i} style={{
                        width: 64, height: 44,
                        border: i === scannerIndex ? '1px solid #00ff88' : '1px solid #1a1a1a',
                        boxShadow: i === scannerIndex ? '0 0 8px #00ff8840' : 'none',
                        transition: 'all 0.1s ease',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', overflow: 'hidden'
                      }}>
                        <img src={thumb} alt={`Frame ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
            /* EMPTY STATE */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 48, color: '#1a1a1a' }}>◈</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: '#3a3a4a', marginTop: 16 }}>Upload an animation and click Analyze</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#1a1a1a', marginTop: 8 }}>CSS · GSAP · Framer Motion · React Spring</div>
            </div>
            )
          ) : (
            /* RESULT STATE */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* TOP INFO BAR */}
              <div style={{ borderBottom: '1px solid #1a1a1a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    fontFamily: 'Space Mono, monospace', fontSize: 11, padding: '3px 10px', 
                    color: intentColor, border: `1px solid ${intentColor}`, backgroundColor: `${intentColor}26`
                  }}>
                    {result.intent.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', color: '#1a1a1a' }}>·</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#3a3a4a' }}>{result.element}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', color: '#1a1a1a' }}>·</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#3a3a4a' }}>{result.duration_ms}ms</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', color: '#1a1a1a' }}>·</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#3a3a4a' }}>{result.easing}</div>
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#3a3a4a', maxWidth: 300, textAlign: 'right' }}>
                  {result.description}
                </div>
              </div>

              {/* FRAMEWORK TABS */}
              <div style={{ borderBottom: '1px solid #1a1a1a', padding: '0 24px', display: 'flex', gap: 4 }}>
                {(["CSS", "GSAP", "Framer Motion", "React Spring"] as TabType[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      fontFamily: 'Space Mono, monospace', fontSize: 12, padding: '12px 16px',
                      backgroundColor: 'transparent', cursor: 'pointer', border: 'none',
                      borderBottom: `2px solid ${activeTab === tab ? '#00ff88' : 'transparent'}`,
                      color: activeTab === tab ? '#00ff88' : '#3a3a4a',
                      transition: 'color 0.2s'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* CODE OUTPUT AREA */}
              <div style={{ flex: 1, overflow: 'auto', position: 'relative', backgroundColor: '#050505', padding: 24 }}>
                <button
                  className="copy-btn"
                  onClick={handleCopy}
                  style={{
                    position: 'absolute', top: 16, right: 16, fontFamily: 'Space Mono, monospace', fontSize: 10,
                    color: copied ? '#47bbedff' : '#fcfcffff', border: '1px solid #1a1a1a', padding: '5px 12px',
                    backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {copied ? "✓ Copied" : "Copy Code"}
                </button>
                <pre style={{ 
                  margin: 0, fontFamily: 'Space Mono, monospace', fontSize: 12.5, lineHeight: 1.9, 
                  color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                }} dangerouslySetInnerHTML={{ __html: highlightCode(getCodeContent()) }} />
              </div>

              {/* SCORECARD ROW */}
              <div style={{ borderTop: '1px solid #1a1a1a', padding: '16px 24px', display: 'flex', gap: 16 }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 16, borderRight: '1px solid #1a1a1a' }}>
                  <div style={{ 
                    fontFamily: 'Space Mono, monospace', fontSize: 16, fontWeight: 'bold',
                    color: result.performance_score >= 85 ? '#00ff88' : result.performance_score >= 65 ? '#f59e0b' : '#ef4444'
                  }}>
                    {result.performance_score}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, color: '#3a3a4a' }}>PERF SCORE</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 16, borderRight: '1px solid #1a1a1a' }}>
                  <div style={{ 
                    fontFamily: 'Space Mono, monospace', fontSize: 16, fontWeight: 'bold',
                    color: result.gpu_accelerated ? '#00ff88' : '#f59e0b'
                  }}>
                    {result.gpu_accelerated ? "✓ GPU" : "✗ CPU"}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, color: '#3a3a4a' }}>ACCELERATION</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 16, borderRight: '1px solid #1a1a1a' }} title={result.accessibility_note}>
                  <div style={{ 
                    fontFamily: 'Space Mono, monospace', fontSize: 16, fontWeight: 'bold',
                    color: (result.accessibility_note.toLowerCase().includes("add") || result.accessibility_note.toLowerCase().includes("missing")) ? '#f59e0b' : '#00ff88'
                  }}>
                    {(result.accessibility_note.toLowerCase().includes("add") || result.accessibility_note.toLowerCase().includes("missing")) ? "⚠ Fix" : "✓ Pass"}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, color: '#3a3a4a' }}>ACCESSIBILITY</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, fontWeight: 'bold', color: '#e2e8f0' }}>
                    {result.easing.split('(')[0].split('-')[0]} 
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: 1, color: '#3a3a4a' }}>EASING TYPE</div>
                </div>

              </div>

            </div>
          )}

          {/* STATUS BAR */}
          <div style={{ borderTop: '1px solid #1a1a1a', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#080808' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#3a3a4a' }}>
              
              {stage === "idle" && ( <span>Ready to analyze animations</span> )}
              
              {stage === "extracting" && (
                <React.Fragment>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00ff88', animation: 'blink 1s ease infinite' }} />
                  <span>Extracting frames...</span>
                </React.Fragment>
              )}
              
              {stage === "analyzing" && (
                <React.Fragment>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00ff88', animation: 'blink 0.8s infinite' }} />
                  <span>{statusMessages[statusBarMsgIndex]}</span>
                </React.Fragment>
              )}
              
              {stage === "done" && result && (
                <span style={{ color: '#00ff88' }}>✓ Analysis complete · {frames.length} frames · {result.intent} detected</span>
              )}

              {stage === "error" && (
                <span style={{ color: '#ef4444' }}>⚠ {error}</span>
              )}

            </div>
            
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#1a1a1a' }}>
              powered by Puter.js
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
