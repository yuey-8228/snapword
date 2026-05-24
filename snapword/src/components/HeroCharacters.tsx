import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Family-style hero: two big mascots flank the headline. Each mascot lives in
 * its own positioning frame, and decorative elements are placed *relative to
 * that frame* (not the hero). That way the elements stay locked to the
 * character no matter how wide the hero gets, and you always read them as
 * "stuff orbiting this character" rather than "stuff scattered around the
 * page".
 *
 * Element coordinates are in *fractions of the mascot tile* (0–1+, can be
 * negative or >1 to sit outside). The tile is sized to the character's PNG;
 * floats are clustered inside a 1.4× halo around it.
 */

interface MascotFrame {
  id: 'westy' | 'nova';
  side: 'left' | 'right';
  width: number;
  /** Mascot PNG aspect ratio (h / w). */
  aspect: number;
  /** Frame position inside the hero section. */
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number;
  idlePeriod: number;
  enterDelay: number;
  parallax: number;
  blobs: BlobDef[];
  floats: FloatDef[];
}

interface FloatDef {
  src: string;
  size: number;
  /** Fraction of mascot tile width (can be negative or >1). 0 = left edge. */
  fx: number;
  /** Fraction of mascot tile height. 0 = top edge. */
  fy: number;
  rotate: number;
  period: number;
  delay: number;
  depth: number;
  /** Stack order — true means draws above mascot. */
  inFront?: boolean;
}

/**
 * Pale background "blobs" — the soft cream/beige shapes that sit *behind* all
 * the icon decorations in the Family hero. They give the cluster body so it
 * doesn't read as a sparse halo of scattered icons. Bigger and rounder than
 * icons; they don't bob, just slowly rotate.
 */
interface BlobDef {
  /** Fraction of mascot tile width. */
  fx: number;
  fy: number;
  /** Width in px. Height derives from `ar`. */
  w: number;
  ar: number;
  /** Border-radius shape — leave blank for circle, or pass irregular like '60% 40% 55% 45%'. */
  shape?: string;
  color: string;
  rotate: number;
  delay: number;
}

/** Family-style cream / soft-tint blobs that sit behind the icon cluster. */
const WESTY_BLOBS: BlobDef[] = [
  // big cream blob behind upper-left (palm + bulb area)
  { fx: -0.05, fy: 0.05, w: 180, ar: 0.95, shape: '62% 38% 55% 45% / 50% 60% 40% 50%', color: '#EFE8DE', rotate: -6,  delay: 0.0 },
  // smaller warm blob mid-left (under cloud)
  { fx: -0.15, fy: 0.50, w: 140, ar: 1.0,  shape: '55% 45% 60% 40% / 55% 50% 50% 45%', color: '#F4EFE7', rotate: 8,  delay: 0.15 },
  // big white-ish blob under the feet (the "ground cloud")
  { fx: 0.45,  fy: 1.00, w: 220, ar: 0.55, shape: '50% 50% 50% 50%', color: '#F8F5EE', rotate: 0, delay: 0.3 },
  // small accent near right shoulder
  { fx: 0.96,  fy: 0.18, w: 70,  ar: 1.0, shape: '50%', color: '#EFE8DE', rotate: 0, delay: 0.4 },
];

const NOVA_BLOBS: BlobDef[] = [
  // upper-right cream blob (behind chat + doc)
  { fx: 0.92,  fy: 0.10, w: 170, ar: 0.95, shape: '45% 55% 60% 40% / 50% 45% 55% 50%', color: '#EFE8DE', rotate: 6,  delay: 0.0 },
  // mid-right soft blob (under music + gear)
  { fx: 1.05,  fy: 0.55, w: 160, ar: 1.0, shape: '55% 45% 45% 55% / 60% 50% 50% 40%', color: '#F4EFE7', rotate: -4, delay: 0.15 },
  // big white-ish blob under the feet
  { fx: 0.50,  fy: 1.00, w: 230, ar: 0.55, shape: '50%', color: '#F8F5EE', rotate: 0, delay: 0.3 },
  // small accent on the inner-left
  { fx: -0.05, fy: 0.20, w: 80, ar: 1.0, shape: '50%', color: '#EFE8DE', rotate: 0, delay: 0.4 },
];

const WESTY_FLOATS: FloatDef[] = [
  // ── top arc — palm is hero-sized, the rest punctuate ──────────────
  { src: '/elements/palm.png',         size: 130, fx: -0.10, fy: -0.22, rotate: -10, period: 5.5, delay: 0.0, depth: 12 },
  { src: '/elements/star-yellow.png',  size: 44,  fx: 0.20,  fy: -0.10, rotate: 14,  period: 4.2, delay: 0.5, depth: 6 },
  { src: '/elements/bulb.png',         size: 80,  fx: 0.55,  fy: -0.20, rotate: 8,   period: 4.6, delay: 0.3, depth: 8 },
  { src: '/elements/sparkle.png',      size: 22,  fx: 0.85,  fy: -0.04, rotate: -6,  period: 4.8, delay: 0.7, depth: 5 },

  // ── right shoulder (between Westy and headline) — keep airy ───────
  { src: '/elements/bolt.png',         size: 64,  fx: 1.00,  fy: 0.10, rotate: 14,  period: 4.4, delay: 0.2, depth: 9 },
  { src: '/elements/arrow-up.png',     size: 60,  fx: 1.06,  fy: 0.40, rotate: -8,  period: 4.6, delay: 0.5, depth: 8 },
  { src: '/elements/music-orange.png', size: 68,  fx: 0.96,  fy: 0.62, rotate: 6,   period: 5.0, delay: 0.7, depth: 9 },

  // ── left flank — denser, includes big icons over blobs ────────────
  { src: '/elements/cloud-blue.png',   size: 100, fx: -0.20, fy: 0.42, rotate: -4,  period: 6.0, delay: 0.4, depth: 11 },
  { src: '/elements/star-orange.png',  size: 30,  fx: -0.18, fy: 0.22, rotate: 12,  period: 4.4, delay: 0.6, depth: 6 },

  // ── bottom arc — anchor the cluster with big pieces ───────────────
  { src: '/elements/padlock.png',      size: 70,  fx: -0.05, fy: 0.92, rotate: -8,  period: 4.8, delay: 0.9, depth: 7 },
  { src: '/elements/dots.png',         size: 90,  fx: 0.35,  fy: 1.08, rotate: 0,   period: 5.2, delay: 0.4, depth: 6 },
  { src: '/elements/flower-blue.png',  size: 48,  fx: 0.78,  fy: 0.98, rotate: 10,  period: 5.0, delay: 0.6, depth: 6 },
  { src: '/elements/star-yellow.png',  size: 24,  fx: 0.62,  fy: 0.94, rotate: -10, period: 4.2, delay: 0.5, depth: 5 },

  // ── in-front depth element ────────────────────────────────────────
  { src: '/elements/sparkles.png',     size: 56,  fx: 0.55,  fy: 0.30, rotate: 0,   period: 3.8, delay: 0.1, depth: 4, inFront: true },
];

const NOVA_FLOATS: FloatDef[] = [
  // ── top arc — heart is hero-sized accent ──────────────────────────
  { src: '/elements/heart-orange.png', size: 84,  fx: 0.18, fy: -0.20, rotate: -10, period: 4.6, delay: 0.0, depth: 9 },
  { src: '/elements/sparkle.png',      size: 22,  fx: 0.42, fy: -0.05, rotate: 0,   period: 4.2, delay: 0.5, depth: 5 },
  { src: '/elements/doc.png',          size: 92,  fx: 0.68, fy: -0.22, rotate: 8,   period: 5.0, delay: 0.3, depth: 8 },
  { src: '/elements/star-yellow.png',  size: 30,  fx: 0.94, fy: -0.02, rotate: 14,  period: 4.4, delay: 0.6, depth: 6 },

  // ── right shoulder — big chat + music + gear stacked ──────────────
  { src: '/elements/chat-green.png',   size: 100, fx: 1.02, fy: 0.18, rotate: 6,   period: 5.2, delay: 0.2, depth: 8 },
  { src: '/elements/music-blue.png',   size: 76,  fx: 1.08, fy: 0.50, rotate: -6,  period: 4.6, delay: 0.5, depth: 9 },
  { src: '/elements/gear.png',         size: 64,  fx: 1.00, fy: 0.78, rotate: 8,   period: 5.4, delay: 0.7, depth: 7 },

  // ── left flank (between Nova and headline) — keep airy ────────────
  { src: '/elements/chat-white.png',   size: 88,  fx: -0.18, fy: 0.12, rotate: -8, period: 5.0, delay: 0.4, depth: 9 },
  { src: '/elements/plane.png',        size: 56,  fx: -0.15, fy: 0.42, rotate: 16, period: 4.4, delay: 0.6, depth: 8 },

  // ── bottom arc — anchor the cluster with big pieces ───────────────
  { src: '/elements/cloud-blue.png',   size: 96,  fx: 0.10, fy: 0.96, rotate: -4,  period: 6.2, delay: 0.8, depth: 11 },
  { src: '/elements/check.png',        size: 62,  fx: 0.48, fy: 1.06, rotate: 4,   period: 5.0, delay: 0.5, depth: 7 },
  { src: '/elements/star-orange.png',  size: 28,  fx: 0.34, fy: 0.95, rotate: -8,  period: 4.8, delay: 0.3, depth: 5 },
  { src: '/elements/star-yellow.png',  size: 24,  fx: 0.80, fy: 0.92, rotate: 12,  period: 4.6, delay: 0.4, depth: 5 },

  // ── in-front depth element ────────────────────────────────────────
  { src: '/elements/sparkles.png',     size: 56,  fx: 0.30, fy: 0.42, rotate: 0,   period: 3.8, delay: 0.1, depth: 4, inFront: true },
];

const FRAMES: MascotFrame[] = [
  {
    id: 'westy',
    side: 'left',
    width: 360,
    aspect: 1.10,
    top: '12%',
    left: '4%',
    rotate: -3,
    idlePeriod: 4.2,
    enterDelay: 0.05,
    parallax: 6,
    blobs: WESTY_BLOBS,
    floats: WESTY_FLOATS,
  },
  {
    id: 'nova',
    side: 'right',
    width: 340,
    aspect: 1.10,
    top: '14%',
    right: '4%',
    rotate: 3,
    idlePeriod: 3.6,
    enterDelay: 0.18,
    parallax: 6,
    blobs: NOVA_BLOBS,
    floats: NOVA_FLOATS,
  },
];

export function HeroCharacters() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 2);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 2);
    }
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {FRAMES.map((f) => (
        <MascotFrameView key={f.id} frame={f} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
}

function MascotFrameView({
  frame,
  mouseX,
  mouseY,
}: {
  frame: MascotFrame;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const parallaxXRaw = useTransform(mouseX, [-1, 1], [-frame.parallax, frame.parallax]);
  const parallaxYRaw = useTransform(mouseY, [-1, 1], [-frame.parallax * 0.6, frame.parallax * 0.6]);
  const parallaxX = useSpring(parallaxXRaw, { stiffness: 60, damping: 18 });
  const parallaxY = useSpring(parallaxYRaw, { stiffness: 60, damping: 18 });

  const enterX = frame.side === 'left' ? -120 : 120;
  const tileHeight = frame.width * frame.aspect;
  // Reserve space for floats around the tile — generous halo since
  // decorations and pale blobs now extend ~35% out on every side
  const haloX = frame.width * 0.36;
  const haloTop = tileHeight * 0.28;
  const haloBottom = tileHeight * 0.24;

  const behind = frame.floats.filter((f) => !f.inFront);
  const front = frame.floats.filter((f) => f.inFront);

  return (
    <motion.div
      className="absolute"
      style={{
        top: frame.top,
        bottom: frame.bottom,
        left: frame.left,
        right: frame.right,
        width: frame.width + haloX * 2,
        height: tileHeight + haloTop + haloBottom,
        paddingLeft: haloX,
        paddingRight: haloX,
        paddingTop: haloTop,
        paddingBottom: haloBottom,
        zIndex: 2,
        pointerEvents: 'auto',
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={
        reduced
          ? { opacity: 0 }
          : { opacity: 0, x: enterX, y: 30, rotate: frame.rotate + (frame.side === 'left' ? -10 : 10), scale: 0.7 }
      }
      animate={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, x: 0, y: 0, rotate: frame.rotate, scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 70, damping: 12, mass: 0.9, delay: frame.enterDelay }}
    >
      <motion.div
        className="relative"
        style={{ width: frame.width, height: tileHeight, x: parallaxX, y: parallaxY }}
      >
        {frame.blobs.map((b, i) => (
          <BgBlob key={`bg${i}`} blob={b} tileW={frame.width} tileH={tileHeight} reduced={!!reduced} />
        ))}

        {behind.map((f, i) => (
          <Float key={`b${i}`} float={f} tileW={frame.width} tileH={tileHeight} reduced={!!reduced} />
        ))}

        <motion.img
          src={`/characters/${frame.id}.png`}
          alt=""
          draggable={false}
          className="absolute select-none pointer-events-none block"
          style={{
            top: 0,
            left: 0,
            width: frame.width,
            height: tileHeight,
            zIndex: 5,
            originX: 0.5,
            originY: 0.95,
          }}
          animate={
            reduced
              ? undefined
              : hovered
                ? { y: -8, scale: 1.04, rotate: frame.side === 'left' ? -5 : 5 }
                : { y: [0, -8, 0], scale: 1, rotate: 0 }
          }
          transition={
            hovered
              ? { duration: 0.3, ease: [0.19, 1, 0.22, 1] }
              : { duration: frame.idlePeriod, ease: 'easeInOut', repeat: Infinity }
          }
        />

        {front.map((f, i) => (
          <Float key={`f${i}`} float={f} tileW={frame.width} tileH={tileHeight} reduced={!!reduced} zIndex={6} />
        ))}

        {hovered && !reduced && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute text-lg"
                style={{
                  top: 12 + i * 6,
                  left: frame.side === 'left' ? 'auto' : 14 + i * 16,
                  right: frame.side === 'left' ? 14 + i * 16 : 'auto',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
                initial={{ opacity: 0, scale: 0.4, y: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 0.9], y: -24 - i * 6 }}
                transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1], delay: i * 0.07 }}
              >
                ✨
              </motion.span>
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function BgBlob({
  blob,
  tileW,
  tileH,
  reduced,
}: {
  blob: BlobDef;
  tileW: number;
  tileH: number;
  reduced: boolean;
}) {
  const w = blob.w;
  const h = blob.w * blob.ar;
  const centerLeft = blob.fx * tileW - w / 2;
  const centerTop = blob.fy * tileH - h / 2;

  return (
    <motion.div
      className="absolute select-none pointer-events-none"
      style={{
        width: w,
        height: h,
        left: centerLeft,
        top: centerTop,
        background: blob.color,
        borderRadius: blob.shape ?? '50%',
        zIndex: 0,
      }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: blob.rotate - 6 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: blob.rotate }}
      transition={{ type: 'spring', stiffness: 50, damping: 18, delay: 0.2 + blob.delay }}
    />
  );
}

function Float({
  float,
  tileW,
  tileH,
  reduced,
  zIndex = 1,
}: {
  float: FloatDef;
  tileW: number;
  tileH: number;
  reduced: boolean;
  zIndex?: number;
}) {
  const centerLeft = float.fx * tileW - float.size / 2;
  const centerTop = float.fy * tileH - float.size / 2;

  return (
    <motion.div
      className="absolute select-none pointer-events-none"
      style={{
        width: float.size,
        height: float.size,
        left: centerLeft,
        top: centerTop,
        zIndex,
      }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: float.rotate - 20 }}
      animate={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, scale: 1, rotate: float.rotate }
      }
      transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.3 + float.delay }}
    >
      <motion.img
        src={float.src}
        alt=""
        draggable={false}
        className="w-full h-full block"
        animate={
          reduced
            ? undefined
            : { y: [0, -6, 0], rotate: [0, 4, 0] }
        }
        transition={{ duration: float.period, ease: 'easeInOut', repeat: Infinity, delay: float.delay }}
      />
    </motion.div>
  );
}
