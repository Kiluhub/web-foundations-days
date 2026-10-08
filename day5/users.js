// ---------- Element references ----------
const loadBtn = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusEl = document.getElementById("status");
const usersList = document.getElementById("users-list");

const API_URL = "https://jsonplaceholder.typicode.com/users";

// Stores the loaded users so filtering never needs a new request
let allUsers = [];

// ---------- Step 3: renderUsers(list) ----------
// Draws ANY array of users into the list. It is reused for the full list
// and for the filtered list. createElement + textContent keep it safe
// (no HTML injection from API data).
function renderUsers(list) {
  usersList.innerHTML = ""; // clear old results first

  // Step 4: message when the filter matches nobody
  if (list.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No users match your filter.";
    usersList.appendChild(li);
    return;
  }

  list.forEach((user) => {
    const li = document.createElement("li");
    // Show name, email, city and company name
    li.textContent = `${user.name} | ${user.email} | ${user.address.city} | ${user.company.name}`;
    usersList.appendChild(li);
  });
}

// ---------- Step 2: loadUsers() with async/await and try/catch/finally ----------
async function loadUsers() {
  statusEl.textContent = "Loading users...";  // loading message
  loadBtn.disabled = true;                    // disabled while loading

  try {
    const response = await fetch(API_URL);

    // fetch only rejects on network failure, so check response.ok for
    // HTTP errors such as 404 or 500
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    allUsers = await response.json(); // store users for filtering
    renderUsers(allUsers);
    statusEl.textContent = `Loaded ${allUsers.length} users successfully.`; // success message
  } catch (error) {
    // Error message shown to the user
    statusEl.textContent = `Error: could not load users. (${error.message})`;
  } finally {
    // Runs on success AND failure, so the button always becomes usable again
    loadBtn.disabled = false;
  }
}

// ---------- Step 4: filter on every keystroke ----------
// Filters the STORED array (no new network request), not case-sensitive.
filterInput.addEventListener("input", () => {
  const term = filterInput.value.trim().toLowerCase();
  const filtered = allUsers.filter((user) =>
    user.name.toLowerCase().includes(term)
  );
  renderUsers(filtered);
});

// Load users when the button is clicked
loadBtn.addEventListener("click", loadUsers);

// ---------- Step 5: Testing the error path ----------
// To test, temporarily change API_URL to
// "https://jsonplaceholder.typicode.com/userz", click Load users, and check
// that the error message appears and the button is enabled again.
// Then change it back to the correct URL before committing.
