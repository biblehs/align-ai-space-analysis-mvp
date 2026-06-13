export const uploadFlowCopy = {
  step1: {
    title: "Which room would you like to",
    highlight: "start with today?",
    body:
      "Choose the room and the kind of support you want most right now. We'll tailor the snapshot to this space, your intention, and the emotional tone you're trying to improve.",
    supportEyebrow: "Desired Support",
    supportTitle: "What would you like more of from this room?",
    cta: "Continue to photo upload",
  },
  step2: {
    title: "Upload one clear room photo",
    body:
      "A single well-lit photo is enough to begin. We read layout, light, density, and emotional tone from the image, then combine that with your notes to generate the first snapshot.",
    uploadTitleIdle: "Upload your room photo",
    uploadTitleBusy: "Preparing your photo...",
    uploadBody: "Drag and drop or browse your files",
    helperBullets: [
      "One clear photo is enough for the first reading.",
      "Natural light or a straight-on angle usually gives the strongest result.",
    ],
    readinessHint: "One photo is enough to begin",
    localHint: "Local preview can continue without a photo",
    optionalDetails:
      "Refine your snapshot with a few extra preferences. These details are optional, but they help us tune the recommendations.",
    cta: "Generate my room snapshot",
  },
  step3: {
    snapshotDescription:
      "Your reading is ready. Start with the free snapshot below, then unlock the full report for deeper analysis, practical next steps, and your personalized room plan.",
  },
} as const;
