# Plan: "What to do this weekend" web app (portfolio project #1)

## Context
This is your first coding project and a resume piece. You type in a city and the app shows:
- the Friday–Sunday weather (from Open-Meteo, which needs no key)
- local events (from Ticketmaster, which needs a secret key)
- a warning on outdoor events when the weather looks bad.

Your machine already has everything needed: Node 24, npm 11, Git (set up with your name and email) and VS Code. The project folder `C:\Documentsweekend-planner` is empty for now. We'll build in small steps, and you can see each one working before we move on.

---

## 1. Tech stack (what we'll use and why)

| Piece | Choice | Plain-language reason |
|---|---|---|
| Language | **JavaScript** (no TypeScript yet) | The language every website uses. Having one fewer thing to learn helps on a first project. |
| UI library | **React** | The front-end library employers ask for most. It lets you build the page from reusable "components", like LEGO bricks. |
| Build tool | **Vite** | Starts your app with one command and refreshes the browser right away when you save a file. It's the modern standard way to start a React app. |
| Styling | **Plain CSS** (one file, mobile-first) | Teaches real CSS skills and adds no extra library. |
| Secret-keeping server | **Vercel Serverless Function** (one small file, `api/events.js`) | A tiny piece of code that runs on Vercel's computers, not in the visitor's browser. That's where the Ticketmaster key will live. |
| Hosting | **Vercel** (free Hobby plan) | Connects to GitHub and re-publishes your site every time you push your code. You get a free `something.vercel.app` link to put on your resume. |
| Code storage | **Git + GitHub** | Employers will look at your GitHub, so a clean history of commits is part of the portfolio. |
| Tests | **Vitest** (for the "logic" files only) | Being able to say "I wrote unit tests" looks good on a resume, and these tests catch mistakes in the tricky date and weather rules. |

---

## 2. Keeping the Ticketmaster key secret

**The problem:** Anything that runs in the browser can be seen by anyone who visits the site. They just open DevTools and look at the network requests. If the key were in your React code, it would be public.

**The fix is a "middleman" function:**

```
Browser (React)  --asks-->  /api/events?lat=..&lon=..   (your Vercel function, key lives here)
                                     |
                                     +--adds the secret key--> Ticketmaster
                                     <--gets events back-------+
Browser  <--only the event info, never the key--
```

The specific safeguards:
1. **`.env.local`**: This file lives only on your computer and holds `TICKETMASTER_API_KEY=your-key`.
2. **`.gitignore`**: This file lists `.env.local`, so Git never uploads it to GitHub. We'll check this with `git status` before the first commit.
3. **No `VITE_` prefix.** This is an important Vite rule: any setting whose name starts with `VITE_` gets copied into the browser code. Our key name won't start with `VITE_`, so only the server function can read it.
4. **`.env.example`** goes on GitHub with a placeholder value (`TICKETMASTER_API_KEY=paste-your-key-here`), so other people can see what's needed without seeing your real key.
5. **On Vercel**, you'll paste the key into Project → Settings → Environment Variables. That's how the live site gets it.
6. **Check:** On the live site, open DevTools → Network and search for the key. It should not appear anywhere.

Open-Meteo needs no key, so the browser can call it directly.

---

## 3. What each file will do

```
weekend-planner/
├─ index.html              The one HTML page. React fills it in.
├─ package.json            The project's "ID card": its name, the packages it uses, and shortcut commands (npm run dev, npm test).
├─ vite.config.js          Settings for Vite (and for Vitest).
├─ .gitignore              Files Git should never upload (node_modules, .env.local).
├─ .env.example            A safe template that shows which secret is needed.
├─ .env.local              YOUR real key. Stays on your computer only.
├─ README.md               The project's front page on GitHub: screenshot, live link, how to run it, what you learned.
├─ api/
│  └─ events.js            The secret-keeping middleman. Gets a location from the browser, calls Ticketmaster with the key,
│                          and sends back a simplified event list (name, image, date, time, venue, ticket link).
└─ src/
   ├─ main.jsx             Starts React and attaches it to index.html.
   ├─ App.jsx              The "boss" component. It holds the current city, weather, events, loading and error state,
   │                       and decides what's shown on screen.
   ├─ App.css              All the styling, written mobile-first.
   ├─ components/          The visual LEGO bricks
   │  ├─ SearchBar.jsx       Text box and Search button for the city.
   │  ├─ WeatherForecast.jsx Row of 3 day cards.
   │  ├─ DayCard.jsx         One day: icon, high/low temperature, rain chance.
   │  ├─ EventList.jsx       Groups events by day.
   │  ├─ EventCard.jsx       One event: image, name, date/time, venue, Indoor/Outdoor tag, warning, ticket link.
   │  ├─ Loading.jsx         Spinner shown while waiting for data.
   │  └─ ErrorMessage.jsx    Friendly "Something went wrong, try again" box.
   └─ lib/                 The "brains": plain logic with no visuals, which makes it easy to test
      ├─ weekend.js          Works out which dates count as "this weekend".
      ├─ weather.js          Calls Open-Meteo: city name → map coordinates → 3-day forecast.
      ├─ weatherCodes.js     Turns Open-Meteo's number codes (e.g. 61 = rain) into an emoji icon and a label.
      ├─ events.js           Calls our own /api/events (never Ticketmaster directly).
      ├─ classify.js         Guesses Indoor/Outdoor and decides whether to show a weather warning.
      └─ *.test.js           Tests for weekend.js, weatherCodes.js, classify.js.
```

### Rules we'll use
- **Which days count as "the weekend":** From Monday to Thursday, it's the coming Friday, Saturday and Sunday. On Friday, Saturday or Sunday, it's the days of the current weekend that are left. All dates use the searched city's time zone (Open-Meteo provides it).
- **Weather icons:** Emoji (☀️ ⛅ 🌧️ ⛈️ ❄️). There are no image files to manage, and they look fine on phones.
- **Indoor/Outdoor:** Ticketmaster doesn't say whether an event is indoors, so we'll guess from words in the event, venue and genre names. Words like "festival", "park", "amphitheater", "fair", "garden", "outdoor" or "beach" mean **Outdoor**. Everything else is **Indoor**. The README will say honestly that this is a guess. That's a good thing to talk about in interviews.
- **"Bad weather":** A day counts as bad if there's a 50% or higher chance of rain, a thunderstorm or snow code, or strong wind. An **Outdoor** event on a bad day gets a ⚠️ banner such as "Rain likely (70%). Bring a jacket or check for updates."
- **Ticketmaster request:** Events within about 25 miles of the city's coordinates, from Friday 00:00 to Sunday 23:59, sorted by date, up to about 50 results. We'll double-check the exact settings against Ticketmaster's documentation in that step.

---

## 4. Build steps (each one ends with something you can see working)

**Step 0: Accounts (you do these yourself; I can't create accounts for you)**
- GitHub account (free)
- Vercel account: choose "Continue with GitHub"
- Ticketmaster developer account at developer.ticketmaster.com. Create an app and copy its "Consumer Key". That's your API key.
- ✅ Test: You have the key saved somewhere private, like a password manager. Don't save it in a chat or a document.

**Step 1: Create the project and save it**
Start a Vite + React project, run `npm run dev`, then make the first Git commit and push to a new GitHub repository.
✅ Test: The Vite starter page opens at `http://localhost:5173`, and the repository shows up on GitHub.

**Step 2: Basic layout and search bar**
Replace the starter page with a title and a `SearchBar`. For now, pressing Search just shows "You searched: Austin".
✅ Test: Typing a city and pressing Enter or Search updates the text. Pressing Search with an empty box shows a gentle hint.

**Step 3: Deploy early to Vercel**
Import the GitHub repository into Vercel.
✅ Test: A public link works on your phone. From now on, every push updates the live site automatically.

**Step 4: Find the city (geocoding)**
`lib/weather.js` turns the city name into a place: name, country, coordinates and time zone. We add `Loading` and `ErrorMessage` here too.
✅ Test: "Paris" shows "Paris, France". "asdfgh" shows "We couldn't find that city."

**Step 5: Weekend dates and the first tests**
Write `lib/weekend.js` and `weekend.test.js`, and set up Vitest.
✅ Test: `npm test` passes, with checks for a Monday, a Friday, a Saturday and a Sunday.

**Step 6: 3-day forecast with icons**
Fetch the daily forecast, then build `weatherCodes.js` (with tests), `WeatherForecast` and `DayCard`.
✅ Test: Searching a city shows 3 cards with the right day names, temperatures, rain chance and icons. A spinner shows while it loads.

**Step 7: The secret-keeping function**
Create `.env.local`, check that `.gitignore` lists it, write `api/events.js`, and run the app locally with `vercel dev` so the function works on your computer.
✅ Test: Visiting `http://localhost:3000/api/events?lat=30.27&lon=-97.74&...` in the browser shows a simple list of events. `git status` does **not** list `.env.local`.

**Step 8: Event list**
Write `lib/events.js`, `EventList` and `EventCard`, grouped by day.
✅ Test: Searching a city shows events with an image, name, date and time, venue, and a working "Get tickets" link. A city with no events shows "No events found this weekend."

**Step 9: Indoor/Outdoor tags**
Write `lib/classify.js` (with tests) and add the tags to each card.
✅ Test: The tests pass, and real events show sensible tags.

**Step 10: Weather warnings**
Add the bad-weather rule to `classify.js` (with tests) and show the ⚠️ banner on Outdoor events.
✅ Test: The tests cover rain, storms, wind, and an outdoor event on a sunny day (no warning). Searching a city where it's raining shows the warnings.

**Step 11: Polish**
Mobile-first layout (one column on phones, a grid on wider screens), friendly messages for every failure (no internet, Ticketmaster down, no events), keyboard and screen-reader basics (labels, alt text), and loading states for the weather and the events separately.
✅ Test: Use the browser's phone view (DevTools device toolbar) and a real phone. Turn off Wi-Fi to see the error messages.

**Step 12: Go live and write it up**
Add `TICKETMASTER_API_KEY` in Vercel's settings, redeploy, and write the README (screenshot, live link, tech stack, how the key is protected, limitations, what you learned).
✅ Test: The live site works from end to end, and the key doesn't appear in DevTools → Network or on GitHub.

After each step, we make one Git commit with a clear message, such as "Add 3-day forecast cards". A tidy commit history impresses employers too.

---

## Verification (whole app)
- `npm test`: all logic tests pass.
- `vercel dev` locally: search 3 cities (one large city, one small town, one misspelled name) and check the weather, events, tags, warnings and error messages.
- Live Vercel link on a phone: same checks.
- Security check: search the GitHub repository and the browser network traffic for the key. It must not appear in either.
