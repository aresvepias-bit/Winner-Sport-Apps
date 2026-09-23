import type { Transition, Variants } from "framer-motion";

/**
 * Preset animasi bersama, mengikuti gaya GLC: gerakan pendek, sekadar
 * menjelaskan apa yang muncul dan dari mana, bukan pertunjukan.
 *
 * Dipakai lewat preset agar seluruh halaman bergerak dengan durasi dan jarak
 * yang sama. Hormati `prefers-reduced-motion` lewat MotionConfig di layout;
 * jangan menonaktifkannya sendiri-sendiri di tiap komponen.
 */

export const HALUS: Transition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] };

/** Latar gelap di belakang modal. */
export const backdropModal: Variants = {
  awal: { opacity: 0 },
  masuk: { opacity: 1, transition: { duration: 0.18 } },
  keluar: { opacity: 0, transition: { duration: 0.15 } }
};

/** Panel modal / drawer proses. */
export const panelModal: Variants = {
  awal: { opacity: 0, scale: 0.96, y: 14 },
  masuk: { opacity: 1, scale: 1, y: 0, transition: HALUS },
  keluar: { opacity: 0, scale: 0.96, y: 14, transition: { duration: 0.15 } }
};

/** Isi halaman yang berganti, mis. saat pindah menu atau setelah diproses. */
export const kontenBerganti: Variants = {
  awal: { opacity: 0, y: 8 },
  masuk: { opacity: 1, y: 0, transition: HALUS },
  keluar: { opacity: 0, y: -6, transition: { duration: 0.15 } }
};

/** Pemberitahuan yang turun dari atas, mis. banner kesalahan. */
export const banner: Variants = {
  awal: { opacity: 0, y: -10 },
  masuk: { opacity: 1, y: 0, transition: HALUS },
  keluar: { opacity: 0, y: -10, transition: { duration: 0.15 } }
};

/** Kartu utama halaman masuk: naik sedikit sambil menajam. */
export const panelLogin: Variants = {
  awal: { opacity: 0, y: 18, scale: 0.98 },
  masuk: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } }
};

/** Gerak sangat lambat untuk bentuk latar; hanya memberi kesan hidup. */
export const hanyutLatar = (jarak = 14, detik = 16) => ({
  animate: { y: [0, -jarak, 0] },
  transition: { duration: detik, repeat: Infinity, ease: "easeInOut" as const }
});

/** Wadah kartu ringkasan: anaknya muncul berurutan, bukan serentak. */
export const wadahBerurutan: Variants = {
  awal: {},
  masuk: { transition: { staggerChildren: 0.05 } }
};

export const kartuNaik: Variants = {
  awal: { opacity: 0, y: 10 },
  masuk: { opacity: 1, y: 0, transition: HALUS }
};
