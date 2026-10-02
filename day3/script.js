// Starting data (replace with the exact array from your assignment if it differs)
const notes = [
  { id: 1, text: "Buy groceries and cook dinner", category: "personal" },
  { id: 2, text: "Finish the quarterly report", category: "work" },
  { id: 3, text: "Revise JavaScript arrays", category: "study" },
  { id: 4, text: "Call mum on Sunday", category: "personal" },
  { id: 5, text: "Practice CSS Grid layouts", category: "study" }
];

const VALID_CATEGORIES = ["personal", "work", "study"];

// Helper: trim, lower-case and collapse extra spaces
function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// 1. Returns notes whose text contains the word (ignoring case)
function searchNotes(word) {
  const term = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(term));
}

// 2. Returns the note with the most characters, or null if no notes
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

// 3. Returns an object counting notes per category
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }
  return counts;
}

// 4. Returns a sentence such as "5 notes: 2 personal, 1 work, 2 study."
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";
  if (total === 0) {
    return `0 ${word}.`;
  }
  const parts = Object.entries(counts).map(
    ([category, count]) => `${count} ${category}`
  );
  return `${total} ${word}: ${parts.join(", ")}.`;
}

// 5. True if a note with the same text already exists
function isDuplicate(text) {
  const target = normalize(text);
  return notes.some(note => normalize(note.text) === target);
}

// 6. Adds a note if valid; returns true when added, false otherwise
function addNote(text, category) {
  if (typeof text !== "string" || text.trim().length < 1 || text.trim().length > 200) {
    console.log("Not added: text must be 1-200 characters.");
    return false;
  }
  if (!VALID_CATEGORIES.includes(category)) {
    console.log(`Not added: "${category}" is not a valid category.`);
    return false;
  }
  if (isDuplicate(text)) {
    console.log("Not added: this note already exists.");
    return false;
  }
  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: text.trim(), category: category });
  console.log(`Added: "${text.trim()}" (${category}).`);
  return true;
}

// ---------- TESTS ----------

// searchNotes
console.log(searchNotes("css"));
// Expected: array with 1 note: "Practice CSS Grid layouts"
console.log(searchNotes("xyz"));
// Expected: [] (no results)

// longestNote
console.log(longestNote());
// Expected: { id: 1, text: "Buy groceries and cook dinner", category: "personal" }

// countByCategory
console.log(countByCategory());
// Expected: { personal: 2, work: 1, study: 2 }

// getSummary
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

// isDuplicate
console.log(isDuplicate("  buy GROCERIES   and cook dinner "));
// Expected: true (ignores case and extra spaces)
console.log(isDuplicate("Something completely new"));
// Expected: false

// addNote
console.log(addNote("Read chapter three", "study"));
// Expected: logs "Added: ..." then prints true
console.log(addNote("read chapter THREE", "study"));
// Expected: logs "Not added: this note already exists." then prints false
console.log(addNote("", "work"));
// Expected: logs "Not added: text must be 1-200 characters." then prints false
console.log(addNote("Plan a trip", "fun"));
// Expected: logs "Not added: "fun" is not a valid category." then prints false

// Summary after adding
console.log(getSummary());
// Expected: "6 notes: 2 personal, 1 work, 3 study."
