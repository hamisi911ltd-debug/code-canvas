DELETE FROM lessons WHERE course_id = 'course-vibecoding-101';
DELETE FROM module_tests WHERE module_id IN (SELECT id FROM modules WHERE course_id = 'course-vibecoding-101');
DELETE FROM modules WHERE course_id = 'course-vibecoding-101';
INSERT INTO modules (id, course_id, title, description, position, token_cost) VALUES ('c1c9eae7ea3527d933699a0f55fbb33b', 'course-vibecoding-101', 'Vibecoding 101', 'Build Your First AI App', 1, 1);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('3ca5060f320352d7d1d7c2021cea6a9d', 'course-vibecoding-101', 'c1c9eae7ea3527d933699a0f55fbb33b', 'What You''ll Achieve', 'Build Your First AI App', '## 🎯 What You''ll Achieve
> 💡 Vibecoding = Writing apps by chatting with AI instead of memorising syntax. You describe WHAT you want. The AI writes HOW to do it.



-   Build and launch a real AI-powered web app from scratch
-   Understand how to talk to AI tools so they do what you need
-   Know the difference between frontend, backend, and AI models
-   Ship something you can show off to people!', 1, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('ff90304adc3f64dcc184c67a4c060cd8', 'course-vibecoding-101', 'c1c9eae7ea3527d933699a0f55fbb33b', 'The 3 Big Ideas of Vibecoding', 'Build Your First AI App', '## 🧠 The 3 Big Ideas of Vibecoding

### 1. Prompting Is Your New Superpower

A prompt is just a message you give to an AI. The better your prompt, the better the code you get back. Think of it like giving instructions to a really smart assistant — be clear, be specific, and give examples.

> ✍️ GOOD PROMPT: "Create a React button that calls OpenAI''s API when clicked and displays the response in a div below it. Use async/await and show a loading spinner while waiting." BAD PROMPT: "Make an AI button thing"

### 2. Your Toolkit (The AI Stack)

| **🛠️ Tool** | **📋 What it does** |
| --- | --- |
| **Cursor / VS Code** | AI code editor — write code with AI inside |
| **Claude / ChatGPT** | Chat with AI, get full code blocks back |
| **GitHub Copilot** | Autocomplete as you type in your editor |
| **v0 by Vercel** | Generate full React UI from a text prompt |

### 3. How AI Apps Work (The Simple Version)

Every AI app has 3 parts. You need all 3 to make something real:

| **🏗️ Part** | **📋 What it does** |
| --- | --- |
| **🖥️ Frontend (UI)** | What the user sees & clicks (buttons, forms, results) |
| **⚙️ Backend (API)** | Middle layer — receives requests, talks to AI, sends response |
| **🤖 AI Model** | The brain — GPT-4, Claude, Gemini. Understands & generates text |', 2, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('6df82fe654f206b01a26dc16b397de23', 'course-vibecoding-101', 'c1c9eae7ea3527d933699a0f55fbb33b', 'Your First AI App — Step by Step', 'Build Your First AI App', '## 🚀 Your First AI App — Step by Step

Here''s exactly how to build your first app using vibecoding:

1.  STEP 1 — Open Cursor (or VS Code + Copilot). Start a new project.
2.  STEP 2 — Prompt: "Create a simple HTML page with a text input, a Submit button, and an empty div for results."
3.  STEP 3 — Prompt: "Add JavaScript fetch() that sends the input value to the OpenAI Chat API and displays the reply."
4.  STEP 4 — Get a free API key from platform.openai.com and paste it in.
5.  STEP 5 — Open in your browser. Type anything. Watch the AI reply. YOU JUST BUILT AN AI APP! 🎉', 3, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('5284a8b2eba490a0c3ebb9c03b73dcf5', 'course-vibecoding-101', 'c1c9eae7ea3527d933699a0f55fbb33b', 'AI Basics You Must Know', 'Build Your First AI App', '## 🎯 AI Basics You Must Know

### What is an API?

API = Application Programming Interface. It''s how your app talks to the AI. You send a message (called a request). The AI sends back an answer (called a response). That''s literally it.

> 🔑 API KEY = Your password to access an AI model. Keep it secret! Never paste it into public code or GitHub repos.

### What is a Token?

AI models don''t read words — they read ''tokens''. A token is roughly 3/4 of a word. 1,000 tokens ≈ 750 words. You pay per token when using API services. Keep your prompts tight to save money!

### Temperature — The Creativity Dial

When you call an AI model, you can set a ''temperature'' value:

-   Temperature 0.0 → Very predictable & factual. Always the same answer.
-   Temperature 0.7 → Balanced. Great default for most apps.
-   Temperature 1.0+ → Very creative, unexpected, sometimes wild 😂', 4, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('14207df01255931cac285c90307e5a67', 'course-vibecoding-101', 'c1c9eae7ea3527d933699a0f55fbb33b', 'Mini Challenge', 'Build Your First AI App', '## 🏆 Mini Challenge

> 🎮 BUILD THIS: A ''Vibe Name Generator'' — user enters their mood (e.g. ''chill'', ''hyped'', ''tired'') and the AI responds with a funny generated username for that mood. Share it with the group!', 5, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('a5d174c60c867ef656c2e89076fb9657', 'course-vibecoding-101', 'c1c9eae7ea3527d933699a0f55fbb33b', 'Key Terms Cheatsheet', 'Build Your First AI App', '## 📚 Key Terms Cheatsheet

-   Prompt — Your instruction/message to the AI
-   Token — A chunk of text the AI processes (~3/4 of a word)
-   API — How your code talks to an external AI service
-   API Key — Your secret password to use the AI
-   Temperature — How creative/random the AI''s response is (0 to 2)
-   Completion — The AI''s generated response text
-   Model — The actual AI brain (GPT-4, Claude, Gemini etc.)

> 💬 Remember: Every senior dev was once a beginner who just started typing. Your first app doesn''t have to be perfect — it just has to exist. SHIP IT! 🚀', 6, 3);
DELETE FROM lessons WHERE course_id = 'course-react-typescript-mastery';
DELETE FROM module_tests WHERE module_id IN (SELECT id FROM modules WHERE course_id = 'course-react-typescript-mastery');
DELETE FROM modules WHERE course_id = 'course-react-typescript-mastery';
INSERT INTO modules (id, course_id, title, description, position, token_cost) VALUES ('31305ccfecb9280c185d600c5708c660', 'course-react-typescript-mastery', 'React & TypeScript Mastery', 'Frontend Dev — Build UIs That Don''t Break', 1, 1);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('8270720241a70561306032c3c053043c', 'course-react-typescript-mastery', '31305ccfecb9280c185d600c5708c660', 'What You''ll Achieve', 'Frontend Dev — Build UIs That Don''t Break', '## 🎯 What You''ll Achieve
> 💡 React = A JavaScript library for building interfaces from reusable ''components''. TypeScript = JavaScript with a spell-checker that catches your bugs BEFORE they happen.



-   Build dynamic, interactive web pages with React
-   Use TypeScript to write safer, smarter code
-   Use AI (Claude / Copilot) to generate components instantly
-   Understand hooks, state, and props without wanting to cry 😅', 1, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('98de315b5fcf3551db00a3490c503fcb', 'course-react-typescript-mastery', '31305ccfecb9280c185d600c5708c660', 'React in Plain English', 'Frontend Dev — Build UIs That Don''t Break', '## ⚛️ React in Plain English

Think of React like LEGO. You build small blocks (components) and snap them together to make a full app. Each block knows its own data and how to update itself.

### The 3 Things React is Built On:

-   COMPONENTS — Reusable UI blocks (e.g. <Button />, <Card />, <Navbar />)
-   PROPS — Data you pass INTO a component (like function arguments)
-   STATE — Data that lives INSIDE a component and can change over time

> 🤖 AI PROMPT: "Create a React functional component called UserCard that accepts props: name (string), role (string), and avatarUrl (string). Display them in a styled card using Tailwind CSS."', 2, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('8dba5e104e3cdf2685f514a300452420', 'course-react-typescript-mastery', '31305ccfecb9280c185d600c5708c660', 'Hooks — The Magic of React', 'Frontend Dev — Build UIs That Don''t Break', '## 🪝 Hooks — The Magic of React

Hooks let your components do cool things. Here are the ones you''ll use 90% of the time:

| **🪝 Hook** | **What it does** |
| --- | --- |
| **useState()** | Store data that can change (counter, input value, loading) |
| **useEffect()** | Run code when something changes (fetch data, timers) |
| **useRef()** | Point directly to a DOM element (e.g. focus an input) |
| **useContext()** | Share data across components without prop drilling |', 3, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('9186cec5e8188b61b07f556e1ac1b00b', 'course-react-typescript-mastery', '31305ccfecb9280c185d600c5708c660', 'TypeScript — Your Code''s Bodyguard', 'Frontend Dev — Build UIs That Don''t Break', '## 🔷 TypeScript — Your Code''s Bodyguard

TypeScript stops you from doing dumb things like passing a number where a name should go. It checks your code as you write and screams at you before your app breaks at 3am.

### The Basics You Need:

-   string — text: "hello", "John", "2024"
-   number — numbers: 42, 3.14, -5
-   boolean — true or false only
-   string[] — an array of strings: ["a", "b", "c"]
-   interface — a blueprint for an object''s shape

> 🔷 EXAMPLE: interface User { name: string; age: number; isPro: boolean; } Now TypeScript FORCES every User to have all three fields. No more mystery bugs!', 4, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('4c13812ebf5bfc64ac517660070ead17', 'course-react-typescript-mastery', '31305ccfecb9280c185d600c5708c660', 'AI-Powered Frontend Workflow', 'Frontend Dev — Build UIs That Don''t Break', '## 🤖 AI-Powered Frontend Workflow

This is how real vibe coders build frontends fast:

1.  Describe the screen you want to AI in plain English
2.  AI generates the React component + TypeScript types
3.  You paste it into your project and run it
4.  If it looks wrong, describe the fix and AI updates it
5.  Repeat until done. Ship. Celebrate! 🎉

> 🤖 PROMPT TEMPLATE: "Create a React + TypeScript component called [NAME]. It should [WHAT IT DOES]. Props are: [LIST THEM]. Style it with Tailwind CSS. Add hover effects on buttons."', 5, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('9080f93f5145c638a48eb96def29c285', 'course-react-typescript-mastery', '31305ccfecb9280c185d600c5708c660', 'AI Concepts That Power React Apps', 'Frontend Dev — Build UIs That Don''t Break', '## 🎯 AI Concepts That Power React Apps

### Streaming Responses

When you display an AI answer word-by-word as it arrives (like ChatGPT does), that''s streaming. It makes your app feel fast and alive. Ask AI: "Show me how to stream an OpenAI response in React using useEffect."

### Loading States

Any time your React app calls an AI API, show a spinner. Always. Users hate blank screens. Use useState(false) for an ''isLoading'' variable that you toggle before and after the API call.

### Error Boundaries

AI APIs sometimes fail. Wrap your component calls in try/catch and show a friendly error message instead of a broken white screen. Your users will thank you.', 6, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('4fe302d879f66c88fe6f9382c943494e', 'course-react-typescript-mastery', '31305ccfecb9280c185d600c5708c660', 'Mini Challenge', 'Frontend Dev — Build UIs That Don''t Break', '## 🏆 Mini Challenge

> 🎮 BUILD THIS: A ''Vibe Mood Board'' — React app with a text input. User types their current vibe (e.g. ''chaotic coder energy''). App calls an AI API and returns: a colour palette, 3 Spotify song vibes, and a motivational quote. Display in a stylish card grid.', 7, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('556f552963344d3f684c31bf794f922d', 'course-react-typescript-mastery', '31305ccfecb9280c185d600c5708c660', 'Key Terms Cheatsheet', 'Frontend Dev — Build UIs That Don''t Break', '## 📚 Key Terms Cheatsheet

-   Component — A reusable piece of UI (a function that returns HTML-like JSX)
-   JSX — HTML that lives inside your JavaScript. Weird at first, natural soon
-   Props — Data passed into a component from its parent
-   State — Data inside a component that causes re-renders when it changes
-   Hook — Special React function (starts with ''use'') that gives superpowers
-   TypeScript Interface — A contract defining what shape an object must have
-   Tailwind CSS — Utility CSS classes you add directly in JSX', 8, 3);
DELETE FROM lessons WHERE course_id = 'course-backend-apis-node-d1';
DELETE FROM module_tests WHERE module_id IN (SELECT id FROM modules WHERE course_id = 'course-backend-apis-node-d1');
DELETE FROM modules WHERE course_id = 'course-backend-apis-node-d1';
INSERT INTO modules (id, course_id, title, description, position, token_cost) VALUES ('4bb0a3c57ae11c9cc25f81494928e585', 'course-backend-apis-node-d1', 'Backend APIs with Node & D1', 'Build the Brain Behind Your App', 1, 1);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('62bedf92e7bd705518744cb429b40689', 'course-backend-apis-node-d1', '4bb0a3c57ae11c9cc25f81494928e585', 'What You''ll Achieve', 'Build the Brain Behind Your App', '## 🎯 What You''ll Achieve
> 💡 The backend is what happens when the user clicks a button and your app actually DOES something. It''s the engine room — hidden from users but running everything.



-   Build real API endpoints that your frontend can call
-   Store and retrieve data using Cloudflare D1 (serverless SQLite)
-   Understand HTTP methods: GET, POST, PUT, DELETE
-   Use Node.js + Hono (or Express) to build fast APIs', 1, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('90dc9846182ecaaed8ecdd63a7853998', 'course-backend-apis-node-d1', '4bb0a3c57ae11c9cc25f81494928e585', 'What''s an API? (For Real Though)', 'Build the Brain Behind Your App', '## 🌐 What''s an API? (For Real Though)

Think of it like a restaurant:

| **🍽️ Restaurant** | **🌐 API World** |
| --- | --- |
| **🙋 Customer** | Your Frontend / User |
| **📋 Waiter / Menu** | API Endpoint (the URL you call) |
| **👨‍🍳 Kitchen** | Your Backend Server + Database |', 2, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('a09bb9d2e76bdff3617089074e555e52', 'course-backend-apis-node-d1', '4bb0a3c57ae11c9cc25f81494928e585', 'HTTP Methods — The 4 You Need', 'Build the Brain Behind Your App', '## 📡 HTTP Methods — The 4 You Need

-   GET — Fetch data ("give me the user list")
-   POST — Create something new ("add this new post")
-   PUT / PATCH — Update something ("change this user''s name")
-   DELETE — Remove something ("delete this record")

> 🤖 AI PROMPT: "Create a Node.js Hono API with these routes: GET /users to return all users, POST /users to create a user, DELETE /users/:id to delete by ID. Use TypeScript."', 3, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('72cfe103a4033b1fed3110fd027353a1', 'course-backend-apis-node-d1', '4bb0a3c57ae11c9cc25f81494928e585', 'Cloudflare D1 — Your Database', 'Build the Brain Behind Your App', '## 🗄️ Cloudflare D1 — Your Database

D1 is Cloudflare''s serverless SQLite database. It lives right next to your Workers (serverless functions) so data retrieval is FAST with zero setup overhead.

### Why D1?

-   No server to manage — it just works
-   SQL language — same as every database you''ll ever use
-   Built into Cloudflare — deploy in seconds
-   Generous free tier — perfect for learning and small apps

### Basic SQL You''ll Use (AI Knows All of This Too!)

> 💻 SELECT * FROM users WHERE id = 1; -- get one user INSERT INTO users (name, email) VALUES (?, ?); -- add a user UPDATE users SET name = ? WHERE id = ?; -- update a user DELETE FROM users WHERE id = ?; -- remove a user', 4, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('186733d574983206b31446155a7e498f', 'course-backend-apis-node-d1', '4bb0a3c57ae11c9cc25f81494928e585', 'Environment Variables — Keep Secrets Safe', 'Build the Brain Behind Your App', '## 🔐 Environment Variables — Keep Secrets Safe

Your backend will have secrets: API keys, database URLs, passwords. NEVER hard-code them into your code. Use environment variables instead.

-   Create a .env file in your project root
-   Add it to .gitignore so it''s never pushed to GitHub
-   Access in Node with: process.env.MY_SECRET_KEY
-   On Cloudflare Workers, use: wrangler secret put MY_SECRET_KEY', 5, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('010dda5957b12081af9d60955a082c27', 'course-backend-apis-node-d1', '4bb0a3c57ae11c9cc25f81494928e585', 'Calling AI from Your Backend', 'Build the Brain Behind Your App', '## 🤖 Calling AI from Your Backend

Your backend is the PERFECT place to call AI APIs — because you never expose your API key to the user. Here''s the flow:

1.  User submits a form on your frontend
2.  Frontend sends a POST request to YOUR backend endpoint
3.  YOUR backend adds your secret API key and calls the AI service
4.  AI responds to your backend
5.  Backend sends the clean result back to the frontend

> 🔐 This pattern keeps your API key hidden from users. If you call AI directly from the frontend, anyone can steal your key from the browser. Always proxy AI calls through your backend!', 6, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('08887b02417e96d2ece98180a630ff68', 'course-backend-apis-node-d1', '4bb0a3c57ae11c9cc25f81494928e585', 'Mini Challenge', 'Build the Brain Behind Your App', '## 🏆 Mini Challenge

> 🎮 BUILD THIS: A ''Vibe Journal API'' — POST /journal saves an entry to D1. GET /journal returns all entries. POST /journal/:id/analyse fetches the entry, sends it to an AI, and returns a mood analysis + suggestions.', 7, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('793145c8bbe3ea00aa02df4ebb6381b3', 'course-backend-apis-node-d1', '4bb0a3c57ae11c9cc25f81494928e585', 'Key Terms Cheatsheet', 'Build the Brain Behind Your App', '## 📚 Key Terms Cheatsheet

-   Node.js — JavaScript that runs on a server (not in a browser)
-   Hono / Express — Frameworks that make building APIs in Node.js easy
-   Endpoint — A specific URL your API exposes (e.g. /api/users)
-   Request — A message from the frontend asking your backend for something
-   Response — Your backend''s reply to that request
-   D1 — Cloudflare''s serverless SQL database
-   SQL — Language used to query databases (SELECT, INSERT, UPDATE, DELETE)
-   Environment Variable — A secret value your code reads at runtime, not hardcoded
-   .env file — Local file that stores your secrets (NEVER commit to Git!)', 8, 3);
DELETE FROM lessons WHERE course_id = 'course-ai-integration';
DELETE FROM module_tests WHERE module_id IN (SELECT id FROM modules WHERE course_id = 'course-ai-integration');
DELETE FROM modules WHERE course_id = 'course-ai-integration';
INSERT INTO modules (id, course_id, title, description, position, token_cost) VALUES ('f5cfdb93177f62d05a0eba522c84ff42', 'course-ai-integration', 'Integrating AI into Real Products', 'AI & Machine Learning — Make It Actually Useful', 1, 1);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('fcb559cfa5f988a84359e3e5fd9db9da', 'course-ai-integration', 'f5cfdb93177f62d05a0eba522c84ff42', 'What You''ll Achieve', 'AI & Machine Learning — Make It Actually Useful', '## 🎯 What You''ll Achieve
> 💡 ML = Machine Learning. For you as a vibe coder, ML means: using pre-trained AI models through APIs to make your app smarter. You don''t need to train models — someone already did the hard part!



-   Understand the main types of AI you can use in web apps
-   Call real AI APIs (OpenAI, Anthropic, Google Gemini) from your code
-   Build features like chat, summarisation, image generation, smart search
-   Design AI features that actually improve the user experience', 1, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('749b0d23c4579e39b8d3a0b274ab8f15', 'course-ai-integration', 'f5cfdb93177f62d05a0eba522c84ff42', 'The AI Models You''ll Actually Use', 'AI & Machine Learning — Make It Actually Useful', '## 🤖 The AI Models You''ll Actually Use

| **🧠 Model / Service** | **✅ Best For** |
| --- | --- |
| **OpenAI GPT-4o** | Chat, writing, code generation, reading images (vision) |
| **Anthropic Claude** | Long documents, reasoning, nuanced instructions, safety |
| **Google Gemini** | Multimodal (text + image + audio), Google ecosystem apps |
| **DALL·E / Stability AI** | Image generation from text prompts |
| **Whisper (OpenAI)** | Speech to text — transcribe audio files accurately |', 2, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('9f78ac048ef96c61d3afd4f1019b24a8', 'course-ai-integration', 'f5cfdb93177f62d05a0eba522c84ff42', 'AI Feature Types — What You Can Build', 'AI & Machine Learning — Make It Actually Useful', '## 💬 AI Feature Types — What You Can Build

### 1. Chat / Chatbot

Send a message, get a reply. The key is ''conversation history'' — send all previous messages with each new request so the AI remembers context. Store history in a useState array.

> 🤖 PROMPT: "Build a React chat component that maintains conversation history in useState and sends the full history to OpenAI with each message. Show typing dots while waiting for response."

### 2. Text Summarisation

Paste in a long article or document. AI gives a short, clear summary. Great for productivity apps, news apps, or study tools.

### 3. Smart Search (Semantic Search)

Normal search looks for exact words. AI-powered semantic search understands MEANING. If a user searches ''something to calm my nerves'' it can return ''meditation guide'' even if those words don''t appear.

### 4. Content Generation

User fills in a form (product name, style, tone). AI writes the full marketing copy, email, product description, or social post. Saves hours of writing.

### 5. Image Generation

User types a description. Your app calls DALL·E or Stability AI and returns a generated image. Perfect for creative and design tools.', 3, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('17f2bd59cc3c4d8cf4346cb2779d7d44', 'course-ai-integration', 'f5cfdb93177f62d05a0eba522c84ff42', 'System Prompts — The Secret Weapon', 'AI & Machine Learning — Make It Actually Useful', '## 🧩 System Prompts — The Secret Weapon

A system prompt is a hidden instruction you give the AI BEFORE the user says anything. It defines the AI''s personality, rules, and expertise. This is how you make the AI behave like YOUR product''s assistant.

> ✍️ EXAMPLE SYSTEM PROMPT: "You are VibeBot, a friendly coding assistant for beginners. Explain things simply using fun analogies. Never use jargon without explaining it. Always end responses with an encouraging message. Keep answers under 150 words unless asked to go deeper."', 4, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('8083271a89bd49664873164f4da0d4dd', 'course-ai-integration', 'f5cfdb93177f62d05a0eba522c84ff42', 'Tuning the AI Response', 'AI & Machine Learning — Make It Actually Useful', '## 📊 Tuning the AI Response

### Temperature — Creativity vs Consistency

-   Temperature 0 → Use for: code generation, factual lookups, structured JSON output
-   Temperature 0.7 → Use for: copywriting, chat, creative suggestions (good default)
-   Temperature 1.0+ → Use for: brainstorming, poetry, ''surprise me!'' features

### Max Tokens — Control the Length

Set a maximum number of tokens in the AI''s response. This stops the AI from writing an essay when you just wanted a sentence. Cost control + better UX in one setting.', 5, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('834105ff0bf946a958d9b921696af862', 'course-ai-integration', 'f5cfdb93177f62d05a0eba522c84ff42', 'The Real Integration Pattern', 'AI & Machine Learning — Make It Actually Useful', '## ⚡ The Real Integration Pattern

Here''s the pattern every AI integration follows. Memorise this:

1.  User action triggers a fetch() call to your backend endpoint
2.  Backend validates the input (no empty strings, max length checks)
3.  Backend builds the message array: system prompt + history + new user message
4.  Backend calls the AI API with your secret API key (stored in env vars)
5.  Backend parses the response and sends cleaned data to frontend
6.  Frontend displays the result (stream it for better UX!)', 6, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('aaefbf1af453303f937efcb875e3fadb', 'course-ai-integration', 'f5cfdb93177f62d05a0eba522c84ff42', 'Mini Challenge', 'AI & Machine Learning — Make It Actually Useful', '## 🏆 Mini Challenge

> 🎮 BUILD THIS: A ''Vibe Coach'' app — user describes a problem (e.g. ''I can''t focus today''). Your app sends it to an AI with a system prompt making it a hype coach. AI responds with: a 3-step action plan, a power song suggestion, and one motivational quote.', 7, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('ff1eb6987045f78b3046c2094cf2001e', 'course-ai-integration', 'f5cfdb93177f62d05a0eba522c84ff42', 'Key Terms Cheatsheet', 'AI & Machine Learning — Make It Actually Useful', '## 📚 Key Terms Cheatsheet

-   LLM — Large Language Model. The tech behind GPT, Claude, Gemini
-   System Prompt — Hidden instruction that sets the AI''s personality and rules
-   Context Window — How much text the AI can ''remember'' in one conversation
-   Embeddings — Turning text into numbers for meaning-based search
-   RAG — Retrieval Augmented Generation. Giving AI your own data to reference
-   Streaming — Sending AI response word-by-word as it generates (like ChatGPT)
-   Hallucination — When AI confidently makes up wrong information 😅
-   Fine-tuning — Training an AI model further on your own data (advanced topic)', 8, 3);
DELETE FROM lessons WHERE course_id = 'course-devops-cloudflare';
DELETE FROM module_tests WHERE module_id IN (SELECT id FROM modules WHERE course_id = 'course-devops-cloudflare');
DELETE FROM modules WHERE course_id = 'course-devops-cloudflare';
INSERT INTO modules (id, course_id, title, description, position, token_cost) VALUES ('52e6ec7ad8129859bbc0b0e74a75c337', 'course-devops-cloudflare', 'Deploy & Scale on Cloudflare', 'DevOps & Cloud — Make It Live for the World', 1, 1);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('258492a6ac53e1129a1246db073936ee', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'What You''ll Achieve', 'DevOps & Cloud — Make It Live for the World', '## 🎯 What You''ll Achieve
> 💡 Deployment = making your app live on the internet so ANYONE can use it. Cloudflare makes this stupidly easy AND gives you a global network so your app is fast everywhere on earth.



-   Deploy a full-stack app to Cloudflare in under 10 minutes
-   Understand Workers, Pages, and D1 and how they connect
-   Set up CI/CD so your app auto-deploys when you push to GitHub
-   Know how to scale your app without managing any servers', 1, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('4651e4b6b7e3b57eb4181b09364711ca', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'The Cloudflare Stack — 3 Pieces', 'DevOps & Cloud — Make It Live for the World', '## ☁️ The Cloudflare Stack — 3 Pieces

| **🏗️ Service** | **✅ What it does for you** |
| --- | --- |
| **⚡ Cloudflare Workers** | Your backend / API. Runs JS at the edge close to your users worldwide |
| **📄 Cloudflare Pages** | Your frontend. Hosts React/HTML apps. Auto-deploys from GitHub. Free SSL. |
| **🗄️ Cloudflare D1** | Your database. Serverless SQLite that runs right next to your Workers. |', 2, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('1c1178ce722f9fad7580d98113d3983a', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'Deploying Your First App', 'DevOps & Cloud — Make It Live for the World', '## 🚀 Deploying Your First App

### Option A — Deploy a Frontend (Pages)

1.  Push your React app to a GitHub repo
2.  Go to cloudflare.com → Pages → Connect to Git
3.  Select your repo and set build command: npm run build
4.  Set output directory: dist (or build for Create React App)
5.  Click Deploy. Done. You get a live URL instantly. 🎉

### Option B — Deploy a Backend (Workers)

1.  Install Wrangler: npm install -g wrangler
2.  Login to Cloudflare: wrangler login
3.  Create project: wrangler init my-api
4.  Write your Worker code in src/index.ts
5.  Deploy: wrangler deploy — live in seconds!

> 🤖 AI PROMPT: "Write a wrangler.toml config file for a Cloudflare Worker project that uses a D1 database binding called DB and has environment variables for an OpenAI API key."', 3, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('e1f5af63779d4ad067bdd338b47ec282', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'CI/CD — Automatic Deployments', 'DevOps & Cloud — Make It Live for the World', '## 🔄 CI/CD — Automatic Deployments

CI/CD = Continuous Integration / Continuous Deployment. Big scary name, simple idea:

> ✨ Every time you push code to GitHub → your app automatically builds and deploys → no manual steps needed. Cloudflare Pages does this for FREE with GitHub integration. Push code, app updates. That''s the whole system.

### How It Works:

-   Connect your GitHub repo to Cloudflare Pages (one-time setup)
-   Every push to the ''main'' branch triggers a production deploy
-   Every push to other branches creates a preview URL for testing
-   If the build fails, Cloudflare keeps the old version live — zero downtime', 4, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('a067ea2134c7e111bb85208772c829e6', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'Edge Computing — Why Cloudflare is Different', 'DevOps & Cloud — Make It Live for the World', '## ⚡ Edge Computing — Why Cloudflare is Different

Most hosting puts your server in ONE location (e.g. US East). If a user is in Lagos, their request travels across the ocean and back. Slow!

Cloudflare Workers run at the EDGE — in 300+ data centres around the world. A user in Lagos hits a Cloudflare server in Lagos. A user in Tokyo hits one in Tokyo. Everyone gets a fast experience.

> 🌍 This is especially important for AI apps because AI model response time already adds latency. You don''t want to add MORE waiting because your server is on another continent!', 5, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('0f7c3f565faaf7ffd8d42f4aabee7f59', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'Environment Variables on Cloudflare', 'DevOps & Cloud — Make It Live for the World', '## 🔐 Environment Variables on Cloudflare

Never put API keys in your code. On Cloudflare:

-   Workers: wrangler secret put OPENAI_API_KEY → then type your key
-   Pages: Dashboard → Settings → Environment Variables → Add variable
-   Access in code: env.OPENAI_API_KEY (Workers) or process.env.KEY (Pages Functions)', 6, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('1c03babd7c534bdc256425e35a85bc55', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'Monitoring — Know When Things Break', 'DevOps & Cloud — Make It Live for the World', '## 📊 Monitoring — Know When Things Break

### Cloudflare Dashboard Gives You Free:

-   Request counts — how many people are using your app right now
-   Error rates — what % of requests are failing (aim for under 1%)
-   Response times — how fast your Worker responds to users
-   Logs — real console.log output from your deployed Workers', 7, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('635cba2808ba45bdf4ee2e5deaf8a207', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'Mini Challenge', 'DevOps & Cloud — Make It Live for the World', '## 🏆 Mini Challenge

> 🎮 BUILD THIS: Deploy your Module 1 or Module 4 AI app to Cloudflare. Frontend on Pages. Backend API as a Worker. Database on D1. Set up GitHub auto-deploy. Share the live link with the group. Extra points if it works on mobile!', 8, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('fc953363f4f9ea910bd56e3f369811c8', 'course-devops-cloudflare', '52e6ec7ad8129859bbc0b0e74a75c337', 'Key Terms Cheatsheet', 'DevOps & Cloud — Make It Live for the World', '## 📚 Key Terms Cheatsheet

-   Deployment — Making your app live on a real URL accessible to everyone
-   Cloudflare Workers — Serverless functions that run at the edge globally
-   Cloudflare Pages — Static/React frontend hosting with GitHub auto-deploy
-   Wrangler — Cloudflare''s CLI tool for deploying and managing Workers
-   CI/CD — Automatic build and deploy pipeline triggered by Git pushes
-   Edge Computing — Running code geographically close to your users
-   Latency — Time delay between user action and server response
-   Serverless — No servers to manage; you just write functions
-   Preview Deployment — A test URL created for every branch or pull request', 9, 3);
DELETE FROM lessons WHERE course_id = 'course-ui-design-figma';
DELETE FROM module_tests WHERE module_id IN (SELECT id FROM modules WHERE course_id = 'course-ui-design-figma');
DELETE FROM modules WHERE course_id = 'course-ui-design-figma';
INSERT INTO modules (id, course_id, title, description, position, token_cost) VALUES ('6b9f353b3a370ce426cda1838b5fe69a', 'course-ui-design-figma', 'Design Systems in Figma', 'UI Design — Make It Look So Good People Trust It', 1, 1);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('647ce1ed596e0ea0411ebdf222c2a205', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'What You''ll Achieve', 'UI Design — Make It Look So Good People Trust It', '## 🎯 What You''ll Achieve
> 💡 A Design System = A collection of reusable design decisions: colours, fonts, spacing, button styles. It keeps your whole app looking consistent and saves you from reinventing the wheel on every screen.



-   Build a complete design system in Figma for your web app
-   Understand tokens, components, layouts, and developer handoff
-   Use AI tools in Figma to design faster than ever before
-   Know how to translate your Figma design into actual React code', 1, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('32efcdfc817791c41a811e0f7afa5b46', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'Why Design Matters for Vibe Coders', 'UI Design — Make It Look So Good People Trust It', '## 🎨 Why Design Matters for Vibe Coders

Here''s the truth: two apps with the same features — the better-looking one gets used more. Users judge your app in 50 milliseconds. Good design = trust. Trust = users. Users = value.

The good news? You don''t need to be an artist. You need a SYSTEM. That''s what this module teaches.', 2, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('ce802f4224304ed0aaf4d3131b9c1d52', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'The 4 Layers of a Design System', 'UI Design — Make It Look So Good People Trust It', '## 🏗️ The 4 Layers of a Design System

### Layer 1: Tokens — The Raw Materials

Tokens are the fundamental design decisions stored as named variables:

-   Colour tokens: --primary: #00C9A7, --danger: #EF4444, --bg: #0D1B2A
-   Spacing tokens: --space-sm: 8px, --space-md: 16px, --space-lg: 32px
-   Typography tokens: --font-heading: ''Inter'', --h1-size: 40px, --weight-bold: 700

> 💡 Think of tokens like paint colours on a palette. Instead of saying ''that green-ish teal colour'', you say ''primary''. Change ''primary'' once and every button, link and badge updates automatically across the whole app.

### Layer 2: Components — The Building Blocks

Components are reusable UI elements built from tokens:

-   Button (Primary, Secondary, Danger, Ghost, Disabled, Loading states)
-   Input (Text, Password, Search — with error and focus states)
-   Card (with image, without image, clickable variant)
-   Badge / Tag (various colours for status labels)
-   Modal / Dialog (overlay window for confirmations and forms)

> 🤖 AI FIGMA TIP: Use the Figma AI plugin or ''Magician'' plugin to generate component variants. Prompt: "Create a button component with 5 states: default, hover, active, disabled, loading"

### Layer 3: Layouts — How Screens Are Structured

-   Grid System — 12-column grid. Most web content sits on a grid
-   Spacing Scale — Consistent gaps between elements (8px, 16px, 24px, 32px, 48px)
-   Breakpoints — How the layout changes on mobile, tablet, and desktop
-   Auto Layout (Figma) — Makes components resize automatically, just like CSS flexbox

### Layer 4: Handoff — From Design to Code

-   Figma Inspect panel shows exact px values, colours, fonts, spacing
-   Export assets (icons, images) directly from Figma panels
-   Write component specs: ''Button has 16px padding, 8px border radius, Inter Bold''
-   With AI tools, you can export Figma → React code directly!', 3, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('4c71514fd82f291c95e103575f75bc37', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'AI Tools for Figma Design', 'UI Design — Make It Look So Good People Trust It', '## 🤖 AI Tools for Figma Design

| **🛠️ AI Tool** | **✅ What it does** |
| --- | --- |
| **Figma AI (built-in)** | Generate layouts, rename layers, write copy, rewrite text |
| **v0 by Vercel** | Describe UI in words → get working React + Tailwind code |
| **Galileo AI** | Generate full app UI mockups from a single text prompt |
| **Anima / Locofy** | Convert Figma designs directly to React/HTML code |', 4, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('88dcff65e301cd2697a54cbc763be54d', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'Dark Mode Done Right', 'UI Design — Make It Look So Good People Trust It', '## 🌑 Dark Mode Done Right

Most modern apps need dark mode. Build it from the start using semantic tokens:

-   WRONG: background colour = #FFFFFF (hardcoded value)
-   RIGHT: background colour = var(--bg-primary) where light=#FFFFFF, dark=#0D1B2A

In Figma, create colour styles for both modes. In code, use CSS variables and toggle a ''data-theme'' attribute on the body element. Ask AI to generate both light and dark token sets for you.', 5, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('cdda9d7331564480778828c3c784ae51', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'The 8px Rule — Instant Better Design', 'UI Design — Make It Look So Good People Trust It', '## 📐 The 8px Rule — Instant Better Design

> ✨ Make EVERYTHING a multiple of 8px. Padding, margins, sizes, gaps. Use: 8, 16, 24, 32, 48, 64px. That''s it. Your designs will immediately look more polished and professional. It''s the single best design tip for developers.', 6, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('4dd222d9ae03d2a04640db7ebe978770', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'Colour Palette Formula', 'UI Design — Make It Look So Good People Trust It', '## 🎨 Colour Palette Formula

For any app, pick:

-   1 Primary colour — your brand colour (CTAs, links, highlights)
-   1 Secondary colour — supports the primary (backgrounds, subtle highlights)
-   1 Danger colour — errors and destructive actions (usually red)
-   1 Success colour — confirmations and positive states (usually green)
-   Neutral greys — 9 shades from white to dark for text and backgrounds

> 🤖 AI PROMPT: "I''m building a productivity app with a dark theme. Primary colour is #00C9A7. Generate a full colour system with: primary shades (50-900), semantic colours for success/danger/warning, and a grey scale. Output as CSS variables."', 7, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('7104761989bc2f99c40480861780e852', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'Mini Challenge', 'UI Design — Make It Look So Good People Trust It', '## 🏆 Mini Challenge

> 🎮 BUILD THIS: In Figma, create a design system for your AI app. Include: colour tokens, typography scale, a button component (5 states), a card component, and a full mobile-screen layout. Then use Anima or v0 to convert it to React code.', 8, 3);
INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES ('dc0d40638d9aa8a1473a175c905f8e55', 'course-ui-design-figma', '6b9f353b3a370ce426cda1838b5fe69a', 'Key Terms Cheatsheet', 'UI Design — Make It Look So Good People Trust It', '## 📚 Key Terms Cheatsheet

-   Design System — A collection of reusable design decisions and components
-   Design Token — A named variable for a design value (colour, spacing, font)
-   Component — A reusable UI piece with defined states and variants
-   Variant — A visual version of a component (e.g. button: primary vs secondary)
-   Auto Layout — Figma feature that mimics CSS flexbox for responsive designs
-   Breakpoint — A screen width where the layout changes (mobile / tablet / desktop)
-   Handoff — Sharing designs with developers including all specs and assets
-   Semantic Token — A token named by purpose not value (--bg-primary, not --white)

> 💬 Design and code are two sides of the same coin. The best vibe coders can do both — moving fast from idea to Figma to React without getting stuck. That''s your superpower now. Use it! 🚀', 9, 3);
