
(function seedSampleSurvey() {
  const STORAGE_KEY = "survey_builder_surveys_v1";
  const SEED_SURVEY_ID = "seed-all-question-types";

  function uid() {
    return window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function question(overrides) {
    return { id: uid(), required: false, helpText: "", ...overrides };
  }

  const now = new Date().toISOString();

  const questions = [
    question({ order: 0, type: "short_text", label: "What is your full name?", required: true }),
    question({ order: 1, type: "long_text", label: "Tell us a bit about yourself", helpText: "A couple of sentences is plenty." }),
    question({ order: 2, type: "email", label: "What is your email address?", required: true }),
    question({ order: 3, type: "phone", label: "What is your phone number?" }),
    question({ order: 4, type: "url", label: "Link to your portfolio or website" }),
    question({ order: 5, type: "search", label: "Search for a topic you're interested in" }),
    question({ order: 6, type: "password", label: "Set a temporary access code", helpText: "At least 6 characters." }),
    question({ order: 7, type: "number", label: "How many years of experience do you have?", min: 0, max: 50, step: 1 }),
    question({ order: 8, type: "date", label: "What is your date of birth?" }),
    question({ order: 9, type: "time", label: "Preferred contact time" }),
    question({ order: 10, type: "datetime", label: "When did the issue occur?" }),
    question({ order: 11, type: "month", label: "Which month did you start?" }),
    question({ order: 12, type: "week", label: "Which week works best for a follow-up call?" }),
    question({
      order: 13,
      type: "single_choice",
      label: "What is your preferred contact method?",
      required: true,
      options: ["Email", "Phone", "SMS"],
    }),
    question({
      order: 14,
      type: "multi_choice",
      label: "Which services are you interested in?",
      options: ["Consulting", "Support", "Training", "Custom development"],
    }),
    question({
      order: 15,
      type: "dropdown_single",
      label: "Select your country",
      options: ["Kenya", "Uganda", "Tanzania", "Rwanda"],
    }),
    question({
      order: 16,
      type: "dropdown_multi",
      label: "Select the tools you work with",
      options: ["Java", "Spring Boot", "PostgreSQL", "React", "Docker"],
    }),
    question({ order: 17, type: "boolean", label: "Have you used our product before?" }),
    question({ order: 18, type: "rating", label: "Rate your overall satisfaction", min: 1, max: 5, step: 1 }),
    question({ order: 19, type: "opinion_scale", label: "How likely are you to recommend us?", min: 1, max: 10, step: 1 }),
    question({ order: 20, type: "file_upload", label: "Upload a supporting document", accept: ".pdf,.docx" }),
    question({ order: 21, type: "color", label: "Pick a color you'd associate with our brand" }),
  ];

  const sampleSurvey = {
    id: SEED_SURVEY_ID,
    title: "Sample Survey — All Question Types",
    description: "Auto-generated survey covering every supported question type, for testing the builder and the preview.",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    questions,
  };

  let existing = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    existing = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(existing)) existing = [];
  } catch (err) {
    console.error("Couldn't read existing surveys, starting fresh:", err);
    existing = [];
  }

  // Idempotent: replace a previous run of this seed rather than duplicating it.
  const withoutOldSeed = existing.filter((s) => s.id !== SEED_SURVEY_ID);
  const updated = [sampleSurvey, ...withoutOldSeed];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  console.log(`Seeded "${sampleSurvey.title}" with ${questions.length} questions. Reload the app to see it.`);
})();
