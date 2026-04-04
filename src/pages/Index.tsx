import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageView, trackStandard, trackCustom } from "../lib/metaPixel";

// ── Design Tokens ──
const T = {
  bg: "#FFFFFF",
  bgSoft: "#F7F5FF",
  bgCard: "#FFFFFF",
  purple: "#6B3FA0",
  purpleDark: "#4A2880",
  purpleLight: "#EDE8F8",
  purpleMid: "#8B5CC8",
  amber: "#C8860A",
  amberLight: "#FFF3D6",
  textDark: "#1A1030",
  textMid: "#4A4060",
  textMuted: "#8878A0",
  border: "#E4DCFA",
  white: "#FFFFFF",
};

const baseWrapper: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: T.bgSoft,
  fontFamily: "'Inter', sans-serif",
  color: T.textDark,
  maxWidth: "480px",
  margin: "0 auto",
  padding: "0 20px",
  paddingBottom: "80px",
  boxSizing: "border-box",
};

// ── Shared Components ──
const PurplePill = ({ text }: { text: string }) => (
  <div
    style={{
      display: "inline-block",
      backgroundColor: T.purpleLight,
      color: T.purple,
      fontWeight: 600,
      fontSize: "12px",
      padding: "6px 14px",
      borderRadius: "100px",
      letterSpacing: "0.02em",
    }}
  >
    {text}
  </div>
);

const CTAButton = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      padding: "18px 24px",
      backgroundColor: T.purple,
      color: T.white,
      fontSize: "17px",
      fontWeight: 600,
      fontFamily: "'Inter', sans-serif",
      border: "none",
      borderRadius: "14px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = T.purpleDark)}
    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = T.purple)}
  >
    {text}
  </button>
);

const Tile = ({
  text,
  onClick,
  selected,
}: {
  text: string;
  onClick: () => void;
  selected: boolean;
}) => (
  <div
    onClick={onClick}
    style={{
      background: selected ? T.purpleLight : T.white,
      border: selected ? `2px solid ${T.purple}` : `2px solid ${T.border}`,
      borderRadius: "12px",
      minHeight: "52px",
      padding: "14px 18px",
      marginBottom: "10px",
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
      fontWeight: 500,
      fontSize: "16px",
      color: selected ? T.purpleDark : T.textDark,
      lineHeight: 1.4,
      transition: "all 0.15s ease",
      boxShadow: selected ? "0 0 0 4px rgba(107,63,160,0.08)" : "none",
    }}
  >
    {text}
  </div>
);

// ── Transition Variants ──
const slideVariants = {
  enter: { x: "100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
};

const Index = () => {
  const [screen, setScreen] = useState(0);
  const [currentQ, setCurrentQ] = useState(1);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [manifestGoal, setManifestGoal] = useState<string | null>(null);
  const [primaryBlock, setPrimaryBlock] = useState<string | null>(null);
  const [desiredOutcome, setDesiredOutcome] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profession: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showContinue, setShowContinue] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [batchDate, setBatchDate] = useState("");

  const totalQuestions = 13;

  // -- Tracking Refs --
  const sessionStartTime = useRef<number>(Date.now());
  const stepStartTime = useRef<number>(Date.now());
  const hasTrackedFormStart = useRef<boolean>(false);
  const trackedMilestones = useRef<Set<number>>(new Set());

  // Track page views and drops based on screen changes
  useEffect(() => {
    if (screen === 0) {
      pageView();
      trackStandard("ViewContent", { page_type: "quiz_intro" });
    } else if (screen >= 1 && screen <= 16) {
      if (screen === 4 && !trackedMilestones.current.has(25)) {
        trackCustom("QuizReached25Percent");
        trackedMilestones.current.add(25);
      }
      if (screen === 8 && !trackedMilestones.current.has(50)) {
        trackCustom("QuizReached50Percent");
        trackedMilestones.current.add(50);
      }
      if (screen === 12 && !trackedMilestones.current.has(75)) {
        trackCustom("QuizReached75Percent");
        trackedMilestones.current.add(75);
      }
    } else if (screen === 17) {
      trackCustom("QuizCompleted");
    } else if (screen === 18) {
      trackStandard("ViewContent", { page_type: "diagnosis_result" });
    } else if (screen === 19) {
      trackStandard("ViewContent", { page_type: "offer_page" });
    } else if (screen === 20) {
      trackStandard("ViewContent", { page_type: "lead_form" });
      trackCustom("FormViewed");
    }
  }, [screen, currentQ]);

  // Track session exit
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionDuration = Math.round((Date.now() - sessionStartTime.current) / 1000);
      trackCustom("SessionDuration", { session_duration_seconds: sessionDuration, last_screen: screen });
      if (screen < 20) {
        trackCustom("FunnelAbandoned", { last_screen: screen });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [screen]);

  useEffect(() => {
    if ([5, 10, 15].includes(screen)) {
      setShowContinue(false);
      const t = setTimeout(() => setShowContinue(true), 5000);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 17) {
      const t = setTimeout(() => setScreen(18), 3000);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    const SHEET_CSV_URL =
      'https://docs.google.com/spreadsheets/d/1Mo8GOAd5q0g5a4PCG7u8QKNKaDUPwAe11y6An2vWWR4/export?format=csv&gid=43987342';
    fetch(SHEET_CSV_URL)
      .then(res => res.text())
      .then(csv => {
        const rows = csv.split('\n');
        if (rows.length >= 2) {
          const cols = rows[1].split(',');
          const raw = (cols[3] || '').replace(/"/g, '').trim();
          if (raw) setBatchDate(raw);
        }
      })
      .catch(() => {});
  }, []);

  // ── Scoring Logic ──
  const rawScore = answers.reduce((sum, s) => sum + s, 0);
  const displayScore = Math.round((1 - rawScore / 33) * 100);

  const getArchetype = (raw: number) => {
    if (raw <= 8) return "NATURAL_ATTRACTOR";
    if (raw <= 16) return "ACCIDENTAL_MANIFESTOR";
    if (raw <= 24) return "FRUSTRATED_SEEKER";
    return "SCIENTIFIC_SKEPTIC";
  };
  const archetype = getArchetype(rawScore);

  const goalLabel = ({ A: "money", B: "career growth", C: "relationship", D: "health and inner peace" } as Record<string, string>)[manifestGoal || ""] || "goals";
  const goalEmoji = ({ A: "💰", B: "📈", C: "❤️", D: "🌱" } as Record<string, string>)[manifestGoal || ""] || "✨";

  const threeReasons = ({
    A: ["You don't have a system — you're manifesting randomly, not deliberately.", "Without structure, results are inconsistent and hard to replicate.", "You mistake intention for execution — wanting isn't the same as attracting."],
    B: ["A deep belief that you don't fully deserve what you want is blocking the signal.", "Your affirmations say 'yes' while your subconscious says 'not for me.'", "Until the belief changes, the frequency stays blocked."],
    C: ["You understand manifestation intellectually but can't access the feeling on demand.", "The universe reads emotion, not information — knowing isn't enough.", "Without the felt state, even the best techniques produce nothing."],
    D: ["A part of you still doubts whether this actually works for someone like you.", "That doubt is the loudest signal you're sending to the universe right now.", "The belief 'it won't work for me' has been proven — by itself."],
  } as Record<string, string[]>)[primaryBlock || ""] || ["Your method has been incomplete, not your intention.", "The universe reads emotional frequency, not words or effort.", "You've been manifesting — just not deliberately."];

  const threeFixes = ({
    A: ["Learn to manifest on purpose, not by accident — with a system that runs automatically.", "Build consistent belief using an advanced vision method that makes goals feel inevitable.", "Use the only visualization technique Ankit still practices himself — to break through your current ceiling."],
    B: ["Replace the money beliefs that are blocking you — live, using NLP, in real time.", "Use a 4-step actualization process to feel the truth of what you want to believe.", "Feel the future state before it arrives — so your frequency matches what you're asking for."],
    C: ["Learn to access the right emotional frequency on demand — not just when you happen to feel good.", "Use actualization techniques to create the felt sense of your goal — not just imagine it.", "Step into the future state of your goal before it arrives — through guided dissociative visualization."],
    D: ["The science behind manifestation is shown first — so your doubt dissolves before you even start.", "Do Jim Carrey's exact task live — the one that breaks the 'it won't work for me' belief in real time.", "Create undeniable evidence that your subconscious cannot argue with — using actualization."],
  } as Record<string, string[]>)[primaryBlock || ""] || ["Learn to manifest on purpose, not by accident — with a system that runs automatically.", "Build consistent belief using an advanced vision method that makes goals feel inevitable.", "Use the only visualization technique Ankit still practices himself — to break through your current ceiling."];

  const personalisedPlan = ({
    A: [
      { day: 'Day 1', fix: 'Teaches you the 3 principles of the Universal Language — so you manifest on purpose, not by accident.' },
      { day: 'Day 3', fix: 'The Continuum Method gives you the vision system that makes your goal feel inevitable.' },
      { day: 'Day 5', fix: 'Dissociative Hypnotic Visualization — the only method Ankit still uses himself to break through ceilings.' }
    ],
    B: [
      { day: 'Day 2', fix: 'Money Manifestation — replaces limiting money beliefs live using NLP, in real time.' },
      { day: 'Day 4', fix: 'DVAR Framework — a 4-step actualization process to make what you want to believe feel real.' },
      { day: 'Day 5', fix: 'Dissociative Hypnotic Visualization — so your frequency matches what you\'re asking for.' }
    ],
    C: [
      { day: 'Day 1', fix: 'Universal Language — teaches you to access the right emotional frequency on demand, not just when you happen to feel good.' },
      { day: 'Day 4', fix: 'Actualization techniques — creates the felt sense of your goal. Nikita got her 3-year transfer in 2 weeks using this.' },
      { day: 'Day 5', fix: 'Dissociative Hypnotic Visualization — step into the future state of your goal before it arrives.' }
    ],
    D: [
      { day: 'Day 1', fix: 'Universal Language — the science dissolves your doubt first, before anything else is asked of you.' },
      { day: 'Day 2', fix: 'Money Manifestation — Jim Carrey\'s exact task done live breaks the "it won\'t work for me" belief in real time.' },
      { day: 'Day 4', fix: 'DVAR + Actualization — creates evidence your subconscious cannot argue with.' }
    ]
  } as Record<string, { day: string; fix: string }[]>)[primaryBlock || ""] || [
    { day: 'Day 1', fix: 'Universal Language — the 3 principles the universe actually responds to.' },
    { day: 'Day 3', fix: 'Continuum Method — the advanced vision system that makes results consistent.' },
    { day: 'Day 5', fix: 'Dissociative Hypnotic Visualization — the only method Ankit still uses himself.' }
  ];

  const outcomeLabel = ({ A: "your income starts to shift", B: "you feel confident and in control", C: "your most important relationship starts to change", D: "you finally feel forward momentum" } as Record<string, string>)[desiredOutcome || ""] || "everything starts to change";
  const highlightDay = ({ A: 1, B: 2, C: 1, D: 4 } as Record<string, number>)[primaryBlock || ""] || 1;

  const handleAnswer = (
    score: number,
    letter: string | null = null,
    goalSetter: ((val: string) => void) | null = null,
    idx: number = -1
  ) => {
    const key = idx >= 0 ? `idx_${idx}` : score + "_" + letter;
    setSelectedTile(key);

    setTimeout(() => {
      setSelectedTile(null);
      const newAnswers = [...answers, score];
      setAnswers(newAnswers);
      if (letter && goalSetter) goalSetter(letter);
      setCurrentQ((q) => q + 1);
      setScreen((s) => s + 1);
    }, 100);
  };

  // Question screen wrapper
  const QuestionScreen = ({
    pill,
    question,
    children,
  }: {
    pill: string;
    question: string;
    children: React.ReactNode;
  }) => (
    <div style={{ paddingTop: "56px" }}>
      <PurplePill text={pill} />
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: "24px",
          color: T.textDark,
          lineHeight: 1.3,
          marginTop: "4px",
          marginBottom: 0,
        }}
      >
        {question}
      </h2>
      <div style={{ marginTop: "20px" }}>{children}</div>
    </div>
  );

  return (
    <div style={baseWrapper}>
      {/* Progress Bar — screens 1–16 */}
      {screen >= 1 && screen <= 16 && ![5, 10, 15].includes(screen) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "480px",
            zIndex: 100,
            backgroundColor: T.white,
            padding: "16px 20px 10px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              height: "4px",
              backgroundColor: T.purpleLight,
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(currentQ / totalQuestions) * 100}%`,
                backgroundColor: T.purple,
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: T.textMuted,
              marginTop: "6px",
              fontWeight: 500,
            }}
          >
            Q{currentQ} of {totalQuestions}
          </div>
        </div>
      )}

      {/* Screen Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* SCREEN 0 — INTRO */}
          {screen === 0 && (
            <div style={{ paddingTop: "64px" }}>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: T.textMuted,
                }}
              >
                Ankit Neerav &nbsp;·&nbsp; Scientific Manifestation
              </div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 900,
                  fontSize: "34px",
                  color: T.textDark,
                  lineHeight: 1.2,
                  marginTop: "20px",
                  marginBottom: 0,
                }}
              >
                Why are you not able to manifest your goals?
              </h1>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: "18px",
                  color: T.purple,
                  marginTop: "12px",
                }}
              >
                Find out in 2 minutes.
              </div>
              <p
                style={{
                  fontWeight: 400,
                  fontSize: "16px",
                  color: T.textMid,
                  lineHeight: 1.6,
                  marginTop: "16px",
                }}
              >
                13 questions. A diagnosis personalised to your exact block.
                <br />
                Three changes that will make manifestation work for you.
              </p>
              <div
                style={{
                  fontWeight: 400,
                  fontSize: "13px",
                  color: T.textMuted,
                  marginTop: "12px",
                }}
              >
                Free &nbsp;·&nbsp; 13 questions &nbsp;·&nbsp; No email needed to start
              </div>
              <div style={{ marginTop: "32px" }}>
                <CTAButton
                  text="Start My Diagnosis →"
                  onClick={() => {
                    trackCustom("CTA_Clicked", { cta_name: "Start My Diagnosis" });
                    setScreen(1);
                    setCurrentQ(1);
                  }}
                />
              </div>
            </div>
          )}

          {/* SCREEN 1 — Q1: PERSONALISATION */}
          {screen === 1 && (
            <QuestionScreen
              pill="YOUR GOAL"
              question="What do you most want to manifest right now?"
            >
              {[
                { emoji: "💰", label: "More money or income", letter: "A" },
                { emoji: "📈", label: "Career or business growth", letter: "B" },
                { emoji: "❤️", label: "A better relationship", letter: "C" },
                { emoji: "🌱", label: "Health or inner peace", letter: "D" },
              ].map((opt) => (
                <Tile
                  key={opt.letter}
                  text={`${opt.emoji} ${opt.label}`}
                  selected={selectedTile === `0_${opt.letter}`}
                  onClick={() => handleAnswer(0, opt.letter, setManifestGoal)}
                />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 2 — Q2 */}
          {screen === 2 && (
            <QuestionScreen
              pill="YOUR BELIEF"
              question="When you hear 'just believe and you'll attract it' — your reaction is:"
            >
              {[
                { text: "I believe it. I've seen it work.", score: 0 },
                { text: "I want to believe, but my mind asks 'how?'", score: 1 },
                { text: "I've tried it before and it didn't work.", score: 2 },
                { text: "Show me the science first.", score: 3 },
              ].map((opt, i) => (
                <Tile
                  key={i}
                  text={opt.text}
                  selected={selectedTile === `idx_${i}`}
                  onClick={() => handleAnswer(opt.score, null, null, i)}
                />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 3 — Q3 */}
          {screen === 3 && (
            <QuestionScreen
              pill="YOUR BELIEF"
              question="Have you ever attracted something you really wanted?"
            >
              {[
                { text: "Yes — and I know exactly why.", score: 0 },
                { text: "Sometimes yes, sometimes no — no idea why.", score: 2 },
                { text: "Rarely. It seems to work for others, not me.", score: 3 },
              ].map((opt, i) => (
                <Tile
                  key={i}
                  text={opt.text}
                  selected={selectedTile === `idx_${i}`}
                  onClick={() => handleAnswer(opt.score, null, null, i)}
                />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 4 — Q4 */}
          {screen === 4 && (
            <QuestionScreen
              pill="YOUR FREQUENCY"
              question="When you think about what you want — what feeling lives underneath?"
            >
              {[
                { text: "Excitement. It feels like it's coming.", score: 0 },
                { text: "Hope, with a quiet worry underneath.", score: 1 },
                { text: "Frustration that it's not here yet.", score: 2 },
                { text: "Numbness. I've wanted this so long it feels pointless.", score: 3 },
              ].map((opt, i) => (
                <Tile
                  key={i}
                  text={opt.text}
                  selected={selectedTile === `idx_${i}`}
                  onClick={() => handleAnswer(opt.score, null, null, i)}
                />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 5 — REINFORCEMENT 1 */}
          {screen === 5 && (
            <div style={{ paddingTop: "48px" }}>
              <div
                style={{
                  background: T.white,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 2px 20px rgba(107,63,160,0.10)",
                }}
              >
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0, duration: 0.5 }} style={{ textAlign: "center", fontSize: "48px" }}>📡</motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    fontSize: "24px",
                    color: T.textDark,
                    textAlign: "center",
                    marginTop: "12px",
                    marginBottom: 0,
                  }}
                >
                  The universe doesn't read your words.
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  style={{
                    fontWeight: 400,
                    fontSize: "16px",
                    color: T.textMid,
                    textAlign: "center",
                    lineHeight: 1.6,
                    marginTop: "12px",
                  }}
                >
                  It reads the emotion underneath them.
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.4 }} style={{ height: "1px", background: T.border, margin: "20px 0" }} />
                {/* Comparison rows */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6, duration: 0.5 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#FFF0F0",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>😟</span>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: "15px", color: T.textMid }}>
                    Saying 'I want money' while feeling anxious
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#D94040" }}>→ LACK</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.2, duration: 0.5 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#F0FFF4",
                    marginTop: "8px",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>✨</span>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: "15px", color: T.textMid }}>
                    Feeling abundant before it arrives
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#2A8A50" }}>→ ABUNDANCE</span>
                </motion.div>
                {/* Highlight box */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.8, duration: 0.5 }}
                  style={{
                    background: T.purpleLight,
                    borderRadius: "10px",
                    padding: "14px",
                    marginTop: "20px",
                    textAlign: "center",
                    fontWeight: 500,
                    fontSize: "15px",
                    color: T.purpleDark,
                    lineHeight: 1.6,
                  }}
                >
                  Princeton University proved this with a random number generator. Human emotion changed a physical machine.
                </motion.div>
              </div>
              <button
                onClick={() => { trackCustom("CTA_Clicked", { cta_name: "I understand - Continue" }); setScreen(6); setCurrentQ(5); }}
                style={{
                  background: "linear-gradient(135deg, #7B4FBA 0%, #4A2880 100%)",
                  color: T.white,
                  border: "none",
                  borderRadius: "14px",
                  padding: "16px 24px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  opacity: showContinue ? 1 : 0,
                  pointerEvents: showContinue ? "auto" : "none",
                  transition: "opacity 0.5s ease",
                  marginTop: "28px",
                }}
              >
                I understand — Continue →
              </button>
            </div>
          )}

          {/* SCREEN 6 — Q5 */}
          {screen === 6 && (
            <QuestionScreen pill="YOUR HABITS" question="On a bad day — one thing goes wrong, then another. Do you recognise that pattern?">
              {[
                { text: "Yes, and I can stop it quickly.", score: 0 },
                { text: "Yes, but once it starts I can't stop it.", score: 2 },
                { text: "Yes, it happens a lot and I don't know why.", score: 3 },
                { text: "I thought it was just bad luck.", score: 2 },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(opt.score, null, null, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 7 — Q6 */}
          {screen === 7 && (
            <QuestionScreen pill="YOUR HABITS" question="When you want more money, your inner voice says:">
              {[
                { text: '"Money comes to me easily."', score: 0 },
                { text: '"I\'m working hard — I hope it comes."', score: 1 },
                { text: '"Why is this so hard for me?"', score: 3 },
                { text: '"It works for others, not for me."', score: 3 },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(opt.score, null, null, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 8 — Q7 */}
          {screen === 8 && (
            <QuestionScreen pill="YOUR HABITS" question="Have you tried affirmations or visualizations and felt they weren't working?">
              {[
                { text: "Never tried them seriously.", score: 1 },
                { text: "Tried them — saw some results.", score: 0 },
                { text: "Tried them consistently — nothing changed.", score: 3 },
                { text: "Tried them but stopped — didn't believe they'd work.", score: 2 },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(opt.score, null, null, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 9 — Q8 */}
          {screen === 9 && (
            <QuestionScreen pill="YOUR HABITS" question="On a great day — good things keep happening one after another. Has that happened?">
              {[
                { text: "Yes, and I know it was my energy doing it.", score: 0 },
                { text: "Yes, but I assumed it was luck.", score: 2 },
                { text: "Occasionally — but it feels random.", score: 2 },
                { text: "Rarely. My good days feel random too.", score: 3 },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(opt.score, null, null, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 10 — REINFORCEMENT 2 */}
          {screen === 10 && (
            <div style={{ paddingTop: "48px" }}>
              <div
                style={{
                  background: T.white,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 2px 20px rgba(107,63,160,0.10)",
                }}
              >
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0, duration: 0.5 }}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    fontSize: "26px",
                    color: T.textDark,
                    textAlign: "center",
                    marginTop: 0,
                    marginBottom: 0,
                  }}
                >
                  Do not think of an elephant.
                </motion.h2>
                {/* Elephant with X */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 2.0, duration: 0.4, ease: "easeOut" }}
                  style={{ textAlign: "center", marginTop: "20px", position: "relative", display: "inline-block", width: "100%" }}
                >
                  <span style={{ fontSize: "56px" }}>🐘</span>
                  <span
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "50%",
                      transform: "translateX(12px)",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#D94040",
                    }}
                  >
                    ✕
                  </span>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.6, duration: 0.5 }}
                  style={{
                    fontWeight: 400,
                    fontSize: "16px",
                    color: T.textMid,
                    textAlign: "center",
                    lineHeight: 1.6,
                    marginTop: "16px",
                    marginBottom: 0,
                  }}
                >
                  Too late.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.1, duration: 0.5 }}
                  style={{
                    fontWeight: 400,
                    fontSize: "16px",
                    color: T.textMid,
                    textAlign: "center",
                    lineHeight: 1.6,
                    marginTop: "8px",
                  }}
                >
                  Your brain skips 'not' and 'don't.'
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5, duration: 0.4 }} style={{ height: "1px", background: T.border, margin: "20px 0" }} />
                {/* Comparison rows */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3.9, duration: 0.5 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#FFF0F0",
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 500, fontSize: "15px", color: T.textMid }}>
                    "I don't want to be poor"
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#D94040" }}>Brain reads "POOR"</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 4.4, duration: 0.5 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#F0FFF4",
                    marginTop: "8px",
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 500, fontSize: "15px", color: T.textMid }}>
                    "Money flows to me easily"
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#2A8A50" }}>Brain reads "WEALTHY"</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4.9, duration: 0.5 }}
                  style={{
                    background: T.purpleLight,
                    borderRadius: "10px",
                    padding: "14px",
                    marginTop: "20px",
                    textAlign: "center",
                    fontWeight: 500,
                    fontSize: "15px",
                    color: T.purpleDark,
                    lineHeight: 1.6,
                  }}
                >
                  Every affirmation with 'not' or 'don't' was training your brain wrong. It's fixable. In 5 days.
                </motion.div>
              </div>
              <button
                onClick={() => { trackCustom("CTA_Clicked", { cta_name: "Got it - Continue" }); setScreen(11); setCurrentQ(9); }}
                style={{
                  background: "linear-gradient(135deg, #7B4FBA 0%, #4A2880 100%)",
                  color: T.white,
                  border: "none",
                  borderRadius: "14px",
                  padding: "16px 24px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  opacity: showContinue ? 1 : 0,
                  pointerEvents: showContinue ? "auto" : "none",
                  transition: "opacity 0.5s ease",
                  marginTop: "28px",
                }}
              >
                Got it — Continue →
              </button>
            </div>
          )}

          {/* SCREEN 11 — Q9 */}
          {screen === 11 && (
            <QuestionScreen pill="YOUR EVIDENCE" question="Have you ever set an intention and then noticed the exact opportunity appear?">
              {[
                { text: "Yes, many times. I trust it now.", score: 0 },
                { text: "Once or twice — wasn't sure if it was real.", score: 1 },
                { text: "Maybe — I dismissed it as coincidence.", score: 2 },
                { text: "I don't recall this ever happening.", score: 3 },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(opt.score, null, null, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 12 — Q10 */}
          {screen === 12 && (
            <QuestionScreen pill="YOUR EVIDENCE" question="In the last year, have you attracted something you genuinely wanted?">
              {[
                { text: "Yes — several things happened naturally.", score: 0 },
                { text: "One or two things — I'm not sure how.", score: 1 },
                { text: "Not sure. I don't notice these things.", score: 2 },
                { text: "No. Things feel like they happen to me.", score: 3 },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(opt.score, null, null, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 13 — Q11 */}
          {screen === 13 && (
            <QuestionScreen pill="YOUR EVIDENCE" question="What best describes why manifestation hasn't fully worked for you?">
              {[
                { text: "I have no consistent system to follow.", score: 0, letter: "A" },
                { text: "My beliefs about what I deserve are limited.", score: 2, letter: "B" },
                { text: "I don't know how to feel the emotions on demand.", score: 1, letter: "C" },
                { text: "Part of me doesn't believe it will work for me.", score: 3, letter: "D" },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(opt.score, opt.letter, setPrimaryBlock, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 14 — Q12 */}
          {screen === 14 && (
            <QuestionScreen pill="YOUR EVIDENCE" question="Right now, what is your emotional state most of the day?">
              {[
                { text: "Mostly positive — grateful and expectant.", score: 0 },
                { text: "Mixed — hopeful in some moments, worried in others.", score: 1 },
                { text: "More anxious and uncertain than I'd like.", score: 2 },
                { text: "Stuck in frustration most of the time.", score: 3 },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(opt.score, null, null, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 15 — REINFORCEMENT 3 */}
          {screen === 15 && (
            <div style={{ paddingTop: "48px" }}>
              <div
                style={{
                  background: T.white,
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 2px 20px rgba(107,63,160,0.10)",
                }}
              >
                {/* Stars */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0, duration: 0.5 }} style={{ textAlign: "center", fontSize: "24px", letterSpacing: "8px" }}>⭐⭐⭐⭐⭐</motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 900,
                    fontSize: "28px",
                    color: T.textDark,
                    textAlign: "center",
                    marginTop: "16px",
                    marginBottom: 0,
                    lineHeight: 1.3,
                  }}
                >
                  Every atom in your body was forged in a star.
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  style={{
                    fontWeight: 400,
                    fontSize: "16px",
                    color: T.textMid,
                    textAlign: "center",
                    lineHeight: 1.6,
                    marginTop: "12px",
                  }}
                >
                  The same elements that make up the universe
                  <br />
                  make up you.
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.4 }} style={{ height: "1px", background: T.border, margin: "20px 0" }} />
                {/* Delayed statements */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0, duration: 0.6 }}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    color: T.purple,
                    textAlign: "center",
                  }}
                >
                  You are not asking a power outside you.
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.8, duration: 0.6 }}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 900,
                    fontSize: "26px",
                    color: T.textDark,
                    textAlign: "center",
                    marginTop: "8px",
                  }}
                >
                  You ARE the universe.
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.5, duration: 0.5 }}
                  style={{
                    background: T.purpleLight,
                    borderRadius: "10px",
                    padding: "14px",
                    marginTop: "20px",
                    textAlign: "center",
                    fontWeight: 400,
                    fontSize: "15px",
                    color: T.purpleDark,
                    lineHeight: 1.6,
                  }}
                >
                  This is not philosophy. The Global Consciousness Project has been running this experiment in 50+ cities for 20+ years. The data is unexplained. But it is real.
                </motion.div>
              </div>
              <button
                onClick={() => { trackCustom("CTA_Clicked", { cta_name: "This changes everything - Continue" }); setScreen(16); setCurrentQ(13); }}
                style={{
                  background: "linear-gradient(135deg, #7B4FBA 0%, #4A2880 100%)",
                  color: T.white,
                  border: "none",
                  borderRadius: "14px",
                  padding: "16px 24px",
                  width: "100%",
                  fontSize: "16px",
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  opacity: showContinue ? 1 : 0,
                  pointerEvents: showContinue ? "auto" : "none",
                  transition: "opacity 0.5s ease",
                  marginTop: "28px",
                }}
              >
                This changes everything — Continue →
              </button>
            </div>
          )}
          {/* SCREEN 16 — Q13: VISION */}
          {screen === 16 && (
            <QuestionScreen pill="YOUR FUTURE" question="If manifestation worked fully for you — what would be different in 12 months?">
              {[
                { text: "My income would look completely different.", letter: "A" },
                { text: "I'd feel confident and in control of my life.", letter: "B" },
                { text: "My most important relationship would be better.", letter: "C" },
                { text: "I'd finally feel like I'm moving forward.", letter: "D" },
              ].map((opt, i) => (
                <Tile key={i} text={opt.text} selected={selectedTile === `idx_${i}`} onClick={() => handleAnswer(0, opt.letter, setDesiredOutcome, i)} />
              ))}
            </QuestionScreen>
          )}

          {/* SCREEN 17 — LOADING */}
          {screen === 17 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
              <div style={{ width: "48px", height: "48px", border: `3px solid ${T.border}`, borderTop: `3px solid ${T.purple}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: "20px", fontWeight: 400, fontSize: "16px", color: T.textMuted }}>Building your manifestation diagnosis...</p>
            </div>
          )}

          {/* SCREEN 18 — RESULT */}
          {screen === 18 && (
            <div style={{ paddingTop: "56px" }}>
              <PurplePill text="YOUR MANIFESTATION DIAGNOSIS" />

              {/* Archetype Name */}
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "30px", color: T.textDark, marginTop: "8px", marginBottom: 0, lineHeight: 1.2 }}>
                {archetype === "NATURAL_ATTRACTOR" && "The Natural Attractor"}
                {archetype === "ACCIDENTAL_MANIFESTOR" && "The Accidental Manifestor"}
                {archetype === "FRUSTRATED_SEEKER" && "The Frustrated Seeker"}
                {archetype === "SCIENTIFIC_SKEPTIC" && "The Scientific Skeptic"}
              </h1>

              <p style={{ fontWeight: 500, fontSize: "16px", color: T.purple, marginTop: "6px", lineHeight: 1.4 }}>
                {archetype === "NATURAL_ATTRACTOR" && `You're already manifesting ${goalLabel}. The advanced system will multiply it.`}
                {archetype === "ACCIDENTAL_MANIFESTOR" && `You've been manifesting ${goalLabel} without knowing how. Now you can do it on purpose.`}
                {archetype === "FRUSTRATED_SEEKER" && `You've been trying to manifest ${goalLabel} with an incomplete method. Here's what's missing.`}
                {archetype === "SCIENTIFIC_SKEPTIC" && `Your science training is the only thing blocking ${goalLabel} from coming to you.`}
              </p>

              {/* Score bar */}
              <div style={{ marginTop: "20px" }}>
                <div style={{ fontWeight: 400, fontSize: "13px", color: T.textMuted }}>
                  Manifestation Alignment: {displayScore} / 100
                </div>
                <div style={{ width: "100%", height: "8px", backgroundColor: T.purpleLight, borderRadius: "4px", marginTop: "8px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${displayScore}%` }}
                    transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ background: "linear-gradient(90deg, #8B5CC8, #6B3FA0)", borderRadius: "4px", height: "8px" }}
                  />
                </div>
              </div>

              {/* Diagnosis Card — 3 Reasons */}
              <div style={{ background: T.white, borderRadius: "14px", padding: "20px", marginTop: "20px", boxShadow: "0 2px 16px rgba(107,63,160,0.10)" }}>
                <div style={{ borderLeft: `4px solid ${T.purple}`, paddingLeft: "12px" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: T.purple, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    WHY IT HASN'T WORKED FOR YOU
                  </span>
                </div>
                <div style={{ marginTop: "16px" }}>
                  {threeReasons.map((reason, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ width: "28px", height: "28px", minWidth: "28px", backgroundColor: T.purpleLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", color: T.purple }}>
                        {i + 1}
                      </div>
                      <span style={{ fontWeight: 400, fontSize: "15px", color: T.textDark, lineHeight: 1.5, flex: 1 }}>
                        {reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fix Card — 3 Changes */}
              <div style={{ background: T.bgSoft, border: "1.5px solid #D4C5F0", borderRadius: "14px", padding: "20px", marginTop: "14px" }}>
                <div style={{ borderLeft: `4px solid ${T.amber}`, paddingLeft: "12px" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: T.amber, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    THE 3 CHANGES THAT WILL FIX THIS
                  </span>
                </div>
                <div style={{ marginTop: "16px" }}>
                  {threeFixes.map((fix, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ width: "28px", height: "28px", minWidth: "28px", backgroundColor: T.amberLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", color: T.amber }}>
                        {i + 1}
                      </div>
                      <span style={{ fontWeight: 400, fontSize: "15px", color: T.textDark, lineHeight: 1.5, flex: 1 }}>
                        {fix}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ fontWeight: 400, fontStyle: "italic", fontSize: "14px", color: T.textMuted, marginTop: "12px", marginBottom: 0 }}>
                  All 3 of these are covered in Ankit's 5-Day Bootcamp.
                </p>
              </div>

              {/* CTA */}
              <div style={{ marginTop: "24px" }}>
                <CTAButton text="Get The Fix — 5 Day Bootcamp →" onClick={() => { trackCustom("CTA_Clicked", { cta_name: "Get The Fix" }); setScreen(19); }} />
              </div>
              <div style={{ textAlign: "center", marginTop: "14px" }}>
                <span style={{ fontWeight: 400, fontSize: "14px", color: T.textMuted }}>Want to understand the science first? </span>
                <a href="https://manifestation.ankitneerav.in/fb13" onClick={() => trackCustom("CTA_Clicked", { cta_name: "Join Free Masterclass (1)" })} style={{ fontWeight: 400, fontSize: "14px", color: T.purple, textDecoration: "underline" }}>Join the free masterclass →</a>
              </div>
            </div>
          )}

          {/* SCREEN 19 — CONVERSION PAGE */}
          {screen === 19 && (() => {
            const openFaq = faqOpen;

            const testimonials = [
              { quote: "I manifested ₹3 lakh recovery in just two days.", attr: "Bootcamp attendee" },
              { quote: "My contract got extended — it happened on Day 2.", attr: "Bootcamp attendee" },
              { quote: "I'd been trying for a transfer for 3 years. Two weeks after Day 4, it happened.", attr: "Nikita" },
              { quote: "3 job interviews in one week. The contacts just appeared.", attr: "Bootcamp attendee" },
              { quote: "My anxiety is gone. I came in wanting to manifest better mental health.", attr: "Bootcamp attendee" },
              { quote: "My IELTS improved by 2–3 bands in 3 days.", attr: "Bootcamp attendee" },
            ];

            const days = [
              { num: 1, title: "THE UNIVERSAL LANGUAGE", value: "₹5,000", body: "The 3 principles of the language the universe actually speaks.\nYou leave Day 1 able to shift your frequency on demand." },
              { num: 2, title: "MONEY MANIFESTATION MASTERY", value: "₹5,000", body: "The 3 laws of money. Jim Carrey's exact manifestation task done live.\nLive NLP to replace money beliefs you've carried since your first salary." },
              { num: 3, title: "THE CONTINUUM METHOD", value: "₹4,000", body: "Ankit's original vision board system — not available anywhere else.\nPeople paid ₹15,000 at offline workshops for this one technique alone." },
              { num: 4, title: "THE D.V.A.R FRAMEWORK", value: "₹4,000", body: "Visualization + Actualization. Nikita got her transfer in 2 weeks after\n3 years of trying — using just one of these 3 actualization techniques." },
              { num: 5, title: "DISSOCIATIVE HYPNOTIC VISUALIZATION", value: "₹5,000", body: "Ankit's original NLP + hypnosis technique. Previously only for\n1-on-1 clients paying 6–10 lakhs. The only method Ankit still uses himself." },
            ];

            const checklistItems = [
              { name: "The Universal Language", sub: "Day 1", val: "₹5,000" },
              { name: "Money Manifestation Mastery", sub: "Day 2", val: "₹5,000" },
              { name: "The Continuum Method — Vision Board 2.0", sub: "Day 3", val: "₹4,000" },
              { name: "The D.V.A.R Framework — Beyond Visualization", sub: "Day 4", val: "₹4,000" },
              { name: "Dissociative Hypnotic Visualization", sub: "Day 5", val: "₹5,000" },
            ];

            const bonusItems = [
              { name: "Perfect Day Visualisation Audio", sub: "Bonus 1 · 7-Min Guided Audio", val: "₹2,000" },
              { name: "Delete Procrastination Audio", sub: "Bonus 2 · Affirmation Audio", val: "₹3,000" },
              { name: "Delete Money Blocks Audio", sub: "Bonus 3 · Subconscious Reprogramming", val: "₹2,000" },
              { name: "22-Min Hypnotic Visualisation Audio", sub: "Bonus 4 · NLP Abundance Practice", val: "₹3,000" },
            ];

            const faqs = [
              { q: "I've tried manifestation before and it didn't work.", a: "The Secret told you what to do. Tonight you saw why it didn't work. The universe reads emotional frequency — not English. Your method was incomplete. This is the complete method." },
              { q: "My family will think this is woo-woo.", a: "That's why it's called Scientific. Princeton University. Global Consciousness Project. Physics. Chemistry. Biology. Evidence-based. And at ₹1,499 you don't need anyone's approval." },
              { q: "I don't have time for 5 days.", a: "Each session is 90 minutes. If 90 minutes for 5 days could increase your income by 10% — would you not spend it? Recordings are yours for lifetime." },
            ];

            const CheckCircle = () => (
              <div style={{ width: "28px", height: "28px", minWidth: "28px", backgroundColor: T.purpleLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: T.purple, fontWeight: 700 }}>✓</div>
            );

            return (
              <div style={{ paddingTop: "40px" }}>
                {/* SECTION A — THE REFRAME */}
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "26px", color: T.textDark, lineHeight: 1.2, marginTop: 0, marginBottom: 0 }}>
                  You haven't been failing at manifestation.
                </h2>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "26px", color: T.purple, lineHeight: 1.2, marginTop: "4px", marginBottom: 0 }}>
                  You've been using an incomplete method.
                </h2>
                <p style={{ fontWeight: 400, fontSize: "16px", color: T.textMid, lineHeight: 1.6, marginTop: "14px" }}>
                  The universe reads emotional frequency — not affirmations.<br />
                  The 5-Day Bootcamp installs the complete method, in the right order.
                </p>

                {/* SECTION B — VIDEO EMBED */}
                <div style={{ marginTop: "28px" }}>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    WATCH: WHAT'S INSIDE THE 5 DAYS
                  </div>
                  <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: "14px", overflow: "hidden", marginTop: "10px", background: "#000000" }}>
                    <iframe
                      src="https://player.vimeo.com/video/1174789597?autoplay=0&title=0&byline=0&portrait=0"
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* DATE ROW */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: T.textMuted, fontFamily: "'Inter', sans-serif" }}>
                      Date & Time :
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: T.textDark, fontFamily: "'Inter', sans-serif" }}>
                      {batchDate || 'Loading...'}
                    </span>
                  </div>

                  {/* CTA BELOW VIDEO */}
                  <button
                    onClick={() => { trackCustom("CTA_Clicked", { cta_name: "Sign up for Bootcamp" }); setScreen(20); }}
                    style={{
                      background: 'linear-gradient(135deg, #7B4FBA 0%, #4A2880 100%)',
                      color: '#FFFFFF',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: '17px',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '20px 24px',
                      width: '100%',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(107,63,160,0.35)',
                      marginTop: '14px',
                      lineHeight: 1.3,
                    }}
                  >
                    YES, Sign up for the Bootcamp →
                  </button>

                  {/* 1-on-1 Call Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', background: '#FFFFFF', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 8px rgba(107,63,160,0.08)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EDE8F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#6B3FA0', fontSize: '14px', fontWeight: 700 }}>✓</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1030', fontFamily: "'Inter', sans-serif" }}>
                        1-on-1 Call with a Success Advisor
                        <span style={{ marginLeft: '8px', fontWeight: 700, fontSize: '11px', color: '#FFFFFF', backgroundColor: '#C8860A', padding: '3px 8px', borderRadius: '10px', verticalAlign: 'middle' }}>LIMITED SLOTS</span>
                      </div>
                      <div style={{ fontWeight: 400, fontSize: '12px', color: '#C8860A', fontFamily: "'Inter', sans-serif", marginTop: '2px' }}>From Ankit's Team</div>
                    </div>
                  </div>
                </div>

                {/* PERSONALISED BOOTCAMP PLAN */}
                <div style={{
                  background: '#FFFFFF',
                  border: '2px solid #6B3FA0',
                  borderRadius: '14px',
                  padding: '20px',
                  marginTop: '16px',
                  boxShadow: '0 2px 16px rgba(107,63,160,0.10)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '36px',
                      background: '#6B3FA0',
                      borderRadius: '2px',
                      flexShrink: 0
                    }} />
                    <div style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#6B3FA0',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.08em'
                    }}>
                      YOUR PERSONALISED BOOTCAMP PLAN
                    </div>
                  </div>
<div style={{
  fontFamily: "'Inter', sans-serif",
  fontSize: '13px',
  color: '#4A4060',
  lineHeight: 1.5,
  marginBottom: '16px',
  fontWeight: 500
}}>
  This is a 5 day bootcamp — and you must attend all days, and these specific days will help you the most:
</div>

                  {personalisedPlan.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      marginBottom: i < 2 ? '14px' : '0',
                      paddingBottom: i < 2 ? '14px' : '0',
                      borderBottom: i < 2 ? '1px solid #F0ECF8' : 'none'
                    }}>
                      <div style={{
                        background: '#EDE8F8',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        fontSize: '12px',
                        color: '#6B3FA0',
                        whiteSpace: 'nowrap' as const,
                        flexShrink: 0
                      }}>
                        {item.day}
                      </div>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '15px',
                        color: '#1A1030',
                        lineHeight: 1.5,
                        fontWeight: 400
                      }}>
                        {item.fix}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SECTION D — THE 5 DAYS */}
                <div style={{ marginTop: "36px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: T.textMuted, textTransform: "uppercase" }}>WHAT YOU GET</div>
                  <div style={{ marginTop: "12px" }}>
                    {days.map((d) => {
                      const isHighlight = d.num === highlightDay;
                      return (
                        <div key={d.num} style={{
                          background: isHighlight ? T.bgSoft : T.white,
                          borderRadius: "12px",
                          padding: "18px",
                          marginBottom: "10px",
                          boxShadow: "0 1px 8px rgba(107,63,160,0.08)",
                          border: isHighlight ? `2px solid ${T.purple}` : "none",
                        }}>
                          {isHighlight && (
                            <div style={{ marginBottom: "8px" }}>
                              <PurplePill text="Your most important day →" />
                            </div>
                          )}
                          <div style={{ fontWeight: 700, fontSize: "15px", color: T.textDark }}>DAY {d.num} — {d.title}</div>
                          <div style={{ fontWeight: 400, fontSize: "12px", color: T.amber, marginTop: "4px" }}>Value {d.value}</div>
                          <p style={{ fontWeight: 400, fontSize: "15px", color: T.textMid, lineHeight: 1.5, marginTop: "8px", marginBottom: 0, whiteSpace: "pre-line" }}>{d.body}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION E — EVERYTHING INCLUDED */}
                <div style={{ marginTop: "36px" }}>
                  <div style={{ fontWeight: 700, fontSize: "12px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    EVERYTHING INCLUDED IN YOUR UPGRADE
                  </div>
                  <div style={{ background: T.white, borderRadius: "16px", padding: "20px", marginTop: "12px", boxShadow: "0 2px 16px rgba(107,63,160,0.10)" }}>
                    {checklistItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0", borderBottom: "1px solid #F0ECF8" }}>
                        <CheckCircle />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", color: T.textDark }}>{item.name}</div>
                          <div style={{ fontWeight: 400, fontSize: "12px", color: T.amber }}>{item.sub}</div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: T.purple }}>{item.val}</div>
                      </div>
                    ))}

                    {/* Bonus separator */}
                    <div style={{ textAlign: "center", padding: "16px 0 8px", fontWeight: 600, fontSize: "12px", color: T.textMuted, textTransform: "uppercase" }}>
                      4 POWERFUL AUDIO BONUSES — FREE
                    </div>

                    {bonusItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0", borderBottom: "1px solid #F0ECF8" }}>
                        <CheckCircle />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", color: T.textDark }}>{item.name}</div>
                          <div style={{ fontWeight: 400, fontSize: "12px", color: T.amber }}>{item.sub}</div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: T.purple }}>{item.val}</div>
                      </div>
                    ))}

                    {/* 1-on-1 Call */}
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0", borderBottom: "1px solid #F0ECF8" }}>
                      <CheckCircle />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "15px", color: T.textDark }}>
                          1-on-1 Call with a Success Advisor
                          <span style={{ marginLeft: "8px", fontWeight: 700, fontSize: "11px", color: T.white, backgroundColor: T.amber, padding: "3px 8px", borderRadius: "10px", verticalAlign: "middle" }}>LIMITED SLOTS</span>
                        </div>
                        <div style={{ fontWeight: 400, fontSize: "12px", color: T.amber }}>From Ankit's Team</div>
                      </div>
                      
                    </div>

                    {/* Lifetime Access */}
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0" }}>
                      <CheckCircle />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "15px", color: T.textDark }}>Lifetime Access to All Recordings</div>
                        <div style={{ fontWeight: 400, fontSize: "12px", color: T.amber }}>Re-watch anytime</div>
                      </div>
                      
                    </div>

                    {/* Pricing block */}
                    <div style={{ marginTop: "20px", textAlign: "center", borderTop: "1px solid #F0ECF8", paddingTop: "20px" }}>
                      <div style={{ fontWeight: 400, fontSize: "13px", color: T.textMuted }}>TOTAL VALUE</div>
                      <div style={{ fontWeight: 600, fontSize: "16px", color: T.textMuted }}>₹33,000+</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "52px", color: T.textDark, marginTop: "12px" }}>₹1,499</div>
                      <div style={{ display: "inline-block", backgroundColor: T.amberLight, borderRadius: "20px", padding: "6px 16px", marginTop: "4px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: T.amber }}>YOU SAVE: ₹31,501 (95% OFF)</span>
                      </div>

                      <div style={{ marginTop: "20px" }}>
                        <button
                          onClick={() => { trackCustom("CTA_Clicked", { cta_name: "Sign up for Bootcamp" }); setScreen(20); }}
                          style={{
                            width: "100%",
                            minHeight: "60px",
                            background: 'linear-gradient(135deg, #7B4FBA 0%, #4A2880 100%)',
                            color: T.white,
                            fontSize: "17px",
                            fontWeight: 700,
                            fontFamily: "'Inter', sans-serif",
                            border: "none",
                            borderRadius: "50px",
                            padding: "20px 24px",
                            cursor: "pointer",
                            boxShadow: '0 6px 20px rgba(107,63,160,0.35)',
                            lineHeight: 1.3,
                          }}
                        >
                          YES, Sign up for the Bootcamp →
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "12px" }}>
                        <span style={{ fontWeight: 400, fontSize: "13px", color: T.textMuted }}>🔒 Secure Checkout</span>
                        <span style={{ fontWeight: 400, fontSize: "13px", color: T.textMuted }}>⚡ Instant Access</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION F — OBJECTIONS (accordion) */}
                <div style={{ marginTop: "36px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: T.textMuted, textTransform: "uppercase" }}>COMMON QUESTIONS</div>
                  <div style={{ marginTop: "12px" }}>
                    {faqs.map((faq, i) => (
                      <div key={i} style={{ background: T.white, borderRadius: "12px", padding: "16px", marginBottom: "8px", cursor: "pointer" }}
                        onClick={() => setFaqOpen(openFaq === i ? null : i)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: "15px", color: T.textDark, flex: 1 }}>{faq.q}</span>
                          <motion.span
                            animate={{ rotate: openFaq === i ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ fontSize: "16px", color: T.textMuted, marginLeft: "8px" }}
                          >▼</motion.span>
                        </div>
                        <AnimatePresence>
                          {openFaq === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              style={{ overflow: "hidden" }}
                            >
                              <p style={{ fontWeight: 400, fontSize: "15px", color: T.textMid, lineHeight: 1.5, marginTop: "12px", marginBottom: 0 }}>{faq.a}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION G — TWO PATHS */}
                <div style={{ marginTop: "36px" }}>
                  <div style={{ background: T.white, borderRadius: "16px", padding: "22px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 700, fontSize: "17px", color: T.textDark }}>Two paths. One choice.</div>

                    {/* Path A */}
                    <div style={{ paddingBottom: "16px", borderBottom: `1px solid ${T.border}`, marginTop: "16px" }}>
                      <div style={{ fontWeight: 700, fontSize: "11px", color: "#D94040", textTransform: "uppercase" }}>PATH A — DO NOTHING</div>
                      <p style={{ fontWeight: 400, fontSize: "14px", color: T.textMuted, lineHeight: 1.5, marginTop: "8px", marginBottom: 0 }}>
                        Same thoughts. Same frequency. Same results.<br />
                        Six months from now — still asking why {goalLabel} hasn't arrived.
                      </p>
                    </div>

                    {/* Path B */}
                    <div style={{ paddingTop: "16px" }}>
                      <div style={{ fontWeight: 700, fontSize: "11px", color: T.purple, textTransform: "uppercase" }}>PATH B — CHANGE IT</div>
                      <p style={{ fontWeight: 400, fontSize: "14px", color: T.textDark, lineHeight: 1.5, marginTop: "8px", marginBottom: 0 }}>
                        5 days with Ankit. In 30 days, {outcomeLabel}.<br />
                        The calls you weren't expecting. The money moving differently.
                      </p>
                    </div>

                    <p style={{ fontWeight: 400, fontStyle: "italic", fontSize: "13px", color: T.textMuted, marginTop: "14px", marginBottom: 0 }}>
                      Both paths are yours. Not choosing is also a choice.
                    </p>

                    <div style={{ marginTop: "16px" }}>
                      <button
                        onClick={() => { trackCustom("CTA_Clicked", { cta_name: "Sign up for Bootcamp" }); setScreen(20); }}
                        style={{
                          width: "100%",
                          minHeight: "60px",
                          background: 'linear-gradient(135deg, #7B4FBA 0%, #4A2880 100%)',
                          color: T.white,
                          fontSize: "17px",
                          fontWeight: 700,
                          fontFamily: "'Inter', sans-serif",
                          border: "none",
                          borderRadius: "50px",
                          padding: "20px 24px",
                          cursor: "pointer",
                          boxShadow: '0 6px 20px rgba(107,63,160,0.35)',
                          lineHeight: 1.3,
                        }}
                      >
                        YES, Sign up for the Bootcamp →
                      </button>
                    </div>
                  </div>
                </div>

                {/* SECTION H — SAFETY NET CTA */}
                <div style={{ fontWeight: 400, fontSize: "14px", color: T.textMuted }}>
  Not ready for the bootcamp yet?
</div>

<a
  href="https://manifestation.ankitneerav.in/fb13"
  style={{
    fontWeight: 500,
    fontSize: "14px",
    color: T.purple,
    textDecoration: "underline",
    marginTop: "6px",
    display: "block"
  }}
>
  No Thanks, I'll attend only the free masterclass
</a>
                {/* <div style={{ borderTop: `1px solid ${T.border}`, marginTop: "28px", paddingTop: "24px", textAlign: "center" }}>
                  <div style={{ fontWeight: 400, fontSize: "14px", color: T.textMuted }}>Not ready for the bootcamp yet?</div>
                  <a href="#free-class" style={{ fontWeight: 500, fontSize: "14px", color: T.purple, textDecoration: "underline", marginTop: "6px", display: "block" }}>
                    No Thanks, I'll attend only the free masterclass
                  </a>
                </div> */}
              </div>
            );
          })()}

          {/* SCREEN 20 — REGISTRATION FORM */}
          {screen === 20 && (() => {
            const inputStyle: React.CSSProperties = {
              width: '100%',
              background: '#FFFFFF',
              border: '2px solid #E4DCFA',
              borderRadius: '10px',
              padding: '14px 16px',
              color: '#1A1030',
              fontSize: '16px',
              fontFamily: "'Inter', sans-serif",
              outline: 'none',
              boxSizing: 'border-box' as const,
              transition: 'border 0.2s',
            };
            const labelStyle: React.CSSProperties = {
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#4A4060',
              marginBottom: '6px',
              fontFamily: "'Inter', sans-serif",
            };
            const errorStyle: React.CSSProperties = {
              fontSize: '12px',
              color: '#D94040',
              marginTop: '4px',
              fontFamily: "'Inter', sans-serif",
            };

            const handleFieldFocus = (fieldName: string, e: any) => {
              e.currentTarget.style.border = '2px solid #6B3FA0';
              if (!hasTrackedFormStart.current) {
                trackCustom("FormStarted");
                hasTrackedFormStart.current = true;
              }
              trackCustom("FormFieldStarted", { field_name: fieldName });
            };

            const handleSubmit = async () => {
  trackCustom("FormSubmitted");
  let valid = true;
  const errors: Record<string, string> = {};

  const cleanName = formData.name.trim();
  const cleanEmail = formData.email.trim();
  const cleanPhone = formData.phone.replace(/\D/g, "").trim();
  const cleanProfession = formData.profession.trim();

  if (!cleanName) {
    errors.name = "Please enter your full name.";
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail) {
    errors.email = "Please enter your email address.";
    valid = false;
  } else if (!emailRegex.test(cleanEmail)) {
    errors.email = "Please enter a valid email address.";
    valid = false;
  }

  if (!cleanPhone) {
    errors.phone = "Please enter your phone number.";
    valid = false;
  } else if (!/^\d{10}$/.test(cleanPhone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
    valid = false;
  }

  if (!cleanProfession) {
    errors.profession = "Please select your profession.";
    valid = false;
  }

  setFormErrors(errors);
  if (!valid) return;

  try {
    const leadWebhookUrl =
      "https://offbeatn8n.coachswastik.com/webhook/smm-quiz-leads";

    const payload = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      profession: cleanProfession,
      batchDate,
      goalLabel,
      submittedAt: new Date().toISOString(),
      source: "bootcamp-registration-page",
    };

    // 1) save lead first
    const leadResponse = await fetch(leadWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });


    console.log("Lead response status:", leadResponse.status);
console.log("Lead response body:", await leadResponse.text());

    if (!leadResponse.ok) {
      throw new Error("Failed to save lead");
    }

    trackStandard("Lead", {
      content_category: "Bootcamp",
      content_name: goalLabel || "Goals",
      currency: "INR",
      value: 1499,
    });

    trackCustom("Lead-Quiz-smm", {
      content_category: "Bootcamp",
      content_name: goalLabel || "Goals",
    });

    // 2) then redirect to Razorpay page
    const razorpayBase = "https://pages.razorpay.com/quiz-smm-fb1";

    const razorpayParams = new URLSearchParams({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      profession: cleanProfession,
    });

    window.location.href = `${razorpayBase}?${razorpayParams.toString()}`;
  } catch (error) {
    console.error("Webhook submission failed:", error);
    setFormErrors({
      submit: "Something went wrong while submitting your details. Please try again.",
    });
  }
};

            return (
              <div style={{ paddingTop: '56px' }}>
                <PurplePill text="ALMOST THERE" />
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '26px', color: T.textDark, lineHeight: 1.2, marginTop: '8px', marginBottom: 0 }}>
                  Your 5-Day {goalLabel} Breakthrough Starts Here
                </h2>
                <p style={{ fontWeight: 400, fontSize: '15px', color: T.textMid, lineHeight: 1.5, marginTop: '8px' }}>
                  ₹1,499  ·  5 Days  ·  Lifetime Access  ·  3-Day Money-Back Guarantee
                </p>

                {/* Full Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onFocus={(e) => handleFieldFocus('name', e)}
                    onBlur={(e) => (e.currentTarget.style.border = '2px solid #E4DCFA')}
                    style={inputStyle}
                  />
                  {formErrors.name && <div style={errorStyle}>{formErrors.name}</div>}
                </div>

                {/* Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={(e) => handleFieldFocus('email', e)}
                    onBlur={(e) => (e.currentTarget.style.border = '2px solid #E4DCFA')}
                    style={inputStyle}
                  />
                  {formErrors.email && <div style={errorStyle}>{formErrors.email}</div>}
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onFocus={(e) => handleFieldFocus('phone', e)}
                    onBlur={(e) => (e.currentTarget.style.border = '2px solid #E4DCFA')}
                    style={inputStyle}
                  />
                  {formErrors.phone && <div style={errorStyle}>{formErrors.phone}</div>}
                </div>

                {/* Profession */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Profession</label>
                  <select
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    onFocus={(e) => handleFieldFocus('profession', e)}
                    onBlur={(e) => (e.currentTarget.style.border = '2px solid #E4DCFA')}
                    style={{ ...inputStyle, appearance: 'none' as const }}
                  >
                    <option value="" disabled>Select your profession</option>
                    <option value="Student">Student</option>
                    <option value="Salaried Professional">Salaried Professional</option>
                    <option value="Entrepreneur">Entrepreneur</option>
                    <option value="Business Owner">Business Owner</option>
                    <option value="Homemaker">Homemaker</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date display */}
                {batchDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: T.textMuted, fontFamily: "'Inter', sans-serif" }}>
                      Date & Time :
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: T.textDark, fontFamily: "'Inter', sans-serif" }}>
                      {batchDate}
                    </span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  style={{
                    background: 'linear-gradient(135deg, #7B4FBA 0%, #4A2880 100%)',
                    color: '#FFFFFF',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: '17px',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '20px 24px',
                    width: '100%',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(107,63,160,0.35)',
                    lineHeight: 1.3,
                  }}
                >
                  {/* Get — ₹1,499 */}
                  Sign Up Now
                </button>

                {/* Safety net */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <div style={{ fontWeight: 400, fontSize: '14px', color: T.textMuted }}>Don't want the bootcamp yet?</div>
                  <a href="https://manifestation.ankitneerav.in/fb13" onClick={() => trackCustom("CTA_Clicked", { cta_name: "Join Free Masterclass (2)" })} style={{ fontWeight: 500, fontSize: '14px', color: T.purple, textDecoration: 'underline', marginTop: '6px', display: 'block' }}>
                    Join the free masterclass instead →
                  </a>
                </div>
              </div>
            );
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Index;
