import mongoose from "mongoose";

// --- Small subdocs ---
const GoalSchema = new mongoose.Schema({
  target: { type: String, enum: ["lose_weight", "maintain", "gain"], required: true },
  calories: { type: Number, min: 600, max: 6000 }, // optional manual override
  activityLevel: { type: String, enum: ["sedentary","light","moderate","active"], default: "light" }
}, { _id: false });

const PreferenceSchema = new mongoose.Schema({
  cuisines: [{ type: String, trim: true }],     // likes: ["mexican","mediterranean"]
  exclusions: [{ type: String, trim: true }],   // avoid: ["peanuts","pork"]
  maxTimeM: { type: Number, min: 5, max: 240, default: 30 },
  mealsPerDay: { type: Number, enum: [2,3], default: 2 },
  // householdSize: { type: Number, min: 1, max: 8, default: 1 },
  unitsPref: { type: String, enum: ["metric","imperial"], default: "metric" }
}, { _id: false });

const PantryItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, lowercase: true },
  qty: { type: String, trim: true } // "2 cans", "1 lb" (optional, free text)
}, { _id: true });

// optional: thumbs-up/down memory for personalization
const PlanFeedbackSchema = new mongoose.Schema({
  liked:   [{ type: String, trim: true }],
  disliked:[{ type: String, trim: true }]
}, { _id: false });

const MealSchema = new mongoose.Schema({
  name: String,
  macros: { kcal: Number, protein: Number, carb: Number, fat: Number },
  ingredients: [String]
}, { _id: false });

const DaySchema = new mongoose.Schema({
  day: String, // "Mon".."Sun"
  meals: [MealSchema]
}, { _id: false });

const PlanSchema = new mongoose.Schema({
  period:   { type: String, enum: ["day","week"], required: true }, 
  startDate:{ type: Date, default: () => new Date() },              // works for both day/week
  days:     { type: [DaySchema], default: [] },
  toBuy:    { type: [String], default: [] },
  seed:     { type: Number, default: () => Math.floor(Math.random()*1e9) },
  mealsPerDay: { type: Number, enum: [2,3], default: 2 }
}, { _id: true });

 


const UserSchema = new mongoose.Schema({
  // auth
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /.+\@.+\..+/ },
  passwordHash: { type: String, required: true },

  // profile
  name: { type: String, trim: true },
  height: { value: Number, unit: { type: String, enum: ["cm","in"], default: "cm" } },
  weight: { value: Number, unit: { type: String, enum: ["kg","lb"], default: "kg" } },

  // onboarding state  
  profileCompleted: { type: Boolean, default: false },
  onboardingStep: { type: String, enum: ["start","goal","body","prefs","done"], default: "start" },

  // nutrition inputs
  goal: GoalSchema,
  preferences: PreferenceSchema,
  pantry: [PantryItemSchema],
  feedback: PlanFeedbackSchema,

  // generated
  plans: [PlanSchema]
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
