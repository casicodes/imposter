import type { CategoryId, WordEntry } from "./categories";

const food: WordEntry[] = [
  {
    word: "Pizza",
    hints: {
      easy: "Cheese and crust",
      medium: "Often delivered in a box",
      hard: "Italian-American staple",
    },
  },
  {
    word: "Sushi",
    hints: {
      easy: "Raw fish rolls",
      medium: "Soy sauce companion",
      hard: "Edomae tradition",
    },
  },
  {
    word: "Candy",
    hints: {
      easy: "Cotton",
      medium: "Wrapped sweetness",
      hard: "Trick-or-treat loot",
    },
  },
];

const movies: WordEntry[] = [
  {
    word: "Oscars",
    hints: {
      easy: "Gold statuette",
      medium: "Hollywood’s big night",
      hard: "Academy recognition",
    },
  },
  {
    word: "Sequel",
    hints: {
      easy: "Part two",
      medium: "Franchise continuation",
      hard: "Roman numeral on the poster",
    },
  },
];

const animals: WordEntry[] = [
  {
    word: "Penguin",
    hints: {
      easy: "Black and white bird",
      medium: "Loves the cold",
      hard: "Waddles on ice",
    },
  },
  {
    word: "Octopus",
    hints: {
      easy: "Eight arms",
      medium: "Under the sea",
      hard: "Clever cephalopod",
    },
  },
];

const places: WordEntry[] = [
  {
    word: "Airport",
    hints: {
      easy: "Planes land here",
      medium: "Security lines",
      hard: "Gate changes",
    },
  },
  {
    word: "Library",
    hints: {
      easy: "Quiet books",
      medium: "Dewey decimals",
      hard: "Whisper zone",
    },
  },
];

const sports: WordEntry[] = [
  {
    word: "Marathon",
    hints: {
      easy: "26.2 miles",
      medium: "Finish line tape",
      hard: "Pheidippides energy",
    },
  },
  {
    word: "Penalty kick",
    hints: {
      easy: "Soccer shot",
      medium: "One vs keeper",
      hard: "From the spot",
    },
  },
];

const science: WordEntry[] = [
  {
    word: "Gravity",
    hints: {
      easy: "Keeps you on the ground",
      medium: "Newton’s apple",
      hard: "Spacetime curvature",
    },
  },
  {
    word: "DNA",
    hints: {
      easy: "Genetic spiral",
      medium: "Double helix",
      hard: "Base pairs",
    },
  },
];

const everyday: WordEntry[] = [
  {
    word: "Umbrella",
    hints: {
      easy: "Rain shield",
      medium: "Opens with a click",
      hard: "Dry walk home",
    },
  },
  {
    word: "Backpack",
    hints: {
      easy: "Carries school stuff",
      medium: "Two straps",
      hard: "Commuter staple",
    },
  },
];

export const WORDS_BY_CATEGORY: Record<CategoryId, WordEntry[]> = {
  food,
  movies,
  animals,
  places,
  sports,
  science,
  everyday,
  mix: [...food, ...movies, ...animals, ...places, ...sports, ...science, ...everyday],
};
