import type { Variants } from "framer-motion";

export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeOutQuint = [0.22, 1, 0.36, 1] as const;

export const heroContentVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.14,
    },
  },
};

export const heroItemVariants: Variants = {
  hidden: {
    opacity: 1,
    y: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.02,
      ease: easeOutExpo,
    },
  },
};

export const heroActionVariants: Variants = {
  hidden: {
    opacity: 1,
    y: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.92,
      delay: 0.08,
      ease: easeOutExpo,
    },
  },
};

export const revealStaggerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

export const revealUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      delay: index * 0.06,
      ease: easeOutQuint,
    },
  }),
};

export const pricingCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 34,
    scale: 0.985,
  },
  visible: (custom: { index: number; featured: boolean }) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: custom.featured ? 0.86 : 0.74,
      delay: custom.index * 0.06 + (custom.featured ? 0.08 : 0),
      ease: easeOutQuint,
    },
  }),
};

export const finalCtaVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.12,
    },
  },
};

export const finalCtaItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.88,
      ease: easeOutExpo,
    },
  },
};
