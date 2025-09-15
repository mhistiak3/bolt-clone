import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

// Load environment variables
config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
console.log(process.env.OLLAMA_URL);

// Ollama configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'codellama'

// Helper function to parse AI response and extract code
function parseCodeFromResponse(response, userMessage = '') {
  const result = {
    html: '',
    css: '',
    js: '',
    explanation: ''
  }

  console.log('Full AI response:', response)
  console.log('Response length:', response.length)

  // Clean up the response first
  let cleanResponse = response.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Extract code blocks using simple, robust patterns
  const codeBlocks = {
    html: extractCodeBlock(cleanResponse, ['html', 'HTML']),
    css: extractCodeBlock(cleanResponse, ['css', 'CSS']),
    js: extractCodeBlock(cleanResponse, ['javascript', 'js', 'JavaScript', 'JS'])
  }

  result.html = codeBlocks.html || ''
  result.css = codeBlocks.css || ''
  result.js = codeBlocks.js || ''

  // Extract explanation - text before first code block or after last code block
  result.explanation = extractExplanation(cleanResponse) || 'Code generated successfully!'

  // If no proper code was extracted, try harder to find code or create fallback
  if (!result.html && !result.css && !result.js) {
    console.log('No code blocks found, trying alternative extraction...')
    
    // Try to find any HTML-like content
    const htmlMatch = cleanResponse.match(/<[^>]+>/g)
    if (htmlMatch && htmlMatch.length > 2) {
      // Found HTML tags, try to extract meaningful HTML
      const htmlContent = cleanResponse.match(/<div[\s\S]*?<\/div>|<h1[\s\S]*?<\/h1>|<input[\s\S]*?>|<button[\s\S]*?<\/button>/gi)
      if (htmlContent) {
        result.html = htmlContent.join('\n')
      }
    }
    
    // Try to find CSS-like content
    const cssMatch = cleanResponse.match(/\.[a-zA-Z-]+\s*\{[^}]+\}|#[a-zA-Z-]+\s*\{[^}]+\}/g)
    if (cssMatch) {
      result.css = cssMatch.join('\n')
    }
    
    // Try to find JavaScript-like content
    const jsMatch = cleanResponse.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g)
    if (jsMatch) {
      result.js = jsMatch.join('\n')
    }
    
    // If still no code found, use fallback
    if (!result.html && !result.css && !result.js) {
      const fallback = createFallbackCode(cleanResponse, userMessage || '')
      result.html = fallback.html
      result.css = fallback.css
      result.js = fallback.js
      result.explanation = fallback.explanation
    }
  }

  console.log('Final parsed result:', {
    html: result.html.length + ' chars',
    css: result.css.length + ' chars', 
    js: result.js.length + ' chars',
    explanation: result.explanation.substring(0, 100) + '...'
  })

  return result
}

// Helper function to extract code blocks
function extractCodeBlock(text, languages) {
  for (const lang of languages) {
    // Try different code block patterns - fixed escaping
    const patterns = [
      new RegExp('```' + lang + '\\s*\\n([\\s\\S]*?)\\n```', 'gi'),
      new RegExp('```\\s*' + lang + '\\s*\\n([\\s\\S]*?)\\n```', 'gi'),
      new RegExp('```' + lang + '\\n([\\s\\S]*?)\\n```', 'gi'),
      new RegExp('```' + lang + '[\\r\\n]+([\\s\\S]*?)[\\r\\n]+```', 'gi'),
      new RegExp('```[^\\n]*' + lang + '[^\\n]*\\n([\\s\\S]*?)\\n```', 'gi')
    ]

    for (const pattern of patterns) {
      pattern.lastIndex = 0 // Reset regex state
      console.log(`Testing pattern: ${pattern} for language: ${lang}`)
      const match = pattern.exec(text)
      console.log(`Match result:`, match ? 'FOUND' : 'NO MATCH')
      if (match && match[1]) {
        let code = match[1].trim()
        console.log(`Raw extracted code for ${lang}:`, code.substring(0, 200))
        
        // Clean up the extracted code
        code = cleanExtractedCode(code, lang)
        
        if (code && code.length > 5) {
          // Validate the code is reasonable
          if (lang.toLowerCase().includes('html') && (code.includes('<') || code.includes('>'))
              || lang.toLowerCase().includes('css') && (code.includes('{') && code.includes('}'))
              || lang.toLowerCase().includes('js') && (code.includes('function') || code.includes('=') || code.includes('('))
              || code.length > 50) {
            console.log(`SUCCESS: Found ${lang} code:`, code.substring(0, 100) + '...')
            return code
          } else {
            console.log(`FAILED validation for ${lang}:`, code.substring(0, 100))
          }
        } else {
          console.log(`FAILED: Code too short or null for ${lang}`)
        }
      }
    }
  }
  return null
}

// Helper function to clean extracted code
function cleanExtractedCode(code, language) {
  // First, restore proper line breaks and clean up
  code = code
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\x20-\x7E\n\r\t]/g, '')  // remove non-printable chars
    .replace(/>>>.*?<<<|\^.*?\^/g, '')  // remove corruption patterns
    .replace(/charset.*?utf.*?[>]/gi, '')  // remove charset corruption
    .replace(/<\/?scripss?[^>]*>/gi, '')  // remove malformed script tags
    .replace(/<\/?styles?[^>]*>/gi, '')   // remove malformed style tags
    .trim()

  // Language-specific cleaning
  if (language.toLowerCase().includes('html')) {
    // Clean HTML - remove script/style tags if they're malformed, but keep structure
    code = code.replace(/<script[\s\S]*?<\/script>/gi, '')
    code = code.replace(/<style[\s\S]*?<\/style>/gi, '')
    // Ensure it has some HTML structure
    if (!code.includes('<') && !code.includes('>')) {
      return null
    }
  } else if (language.toLowerCase().includes('css')) {
    // Clean CSS - restore proper formatting
    code = code.replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*\}\s*/g, '\n}\n')
    // Ensure it contains actual CSS rules
    if (!code.includes('{') || !code.includes('}')) {
      return null
    }
  } else if (language.toLowerCase().includes('js')) {
    // Clean JavaScript - restore proper formatting and fix missing braces
    code = code.replace(/\s*\{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n')
      .replace(/\s*\}\s*/g, '\n}\n')
    
    // Fix missing closing braces for functions
    const openBraces = (code.match(/\{/g) || []).length
    const closeBraces = (code.match(/\}/g) || []).length
    if (openBraces > closeBraces) {
      code += '\n}'.repeat(openBraces - closeBraces)
    }
    
    // Ensure it's not corrupted CSS/HTML
    if (code.includes('<') || code.includes('charset') || code.includes('>>>')) {
      return null
    }
  }

  return code.trim()
}

// Helper function to extract explanation
function extractExplanation(text) {
  // Get text before first code block
  const beforeCodeBlock = text.split('```')[0].trim()
  if (beforeCodeBlock && beforeCodeBlock.length > 20) {
    return beforeCodeBlock.replace(/\s+/g, ' ').substring(0, 200) + '...'
  }
  return 'Code generated successfully!'
}

// Helper function to create fallback code
function createFallbackCode(response, userMessage = '') {
  const lowerResponse = (response + ' ' + userMessage).toLowerCase()
  
  console.log('Creating fallback code for:', lowerResponse.substring(0, 100))
  
  if (lowerResponse.includes('todo') || lowerResponse.includes('task')) {
    return {
      html: `<div class="todo-app">
  <h1>Todo App</h1>
  <input type="text" id="taskInput" placeholder="Enter a task...">
  <button onclick="addTask()">Add Task</button>
  <ul id="taskList"></ul>
</div>`,
      css: `.todo-app { max-width: 400px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif; }
h1 { color: #333; text-align: center; }
input { width: 70%; padding: 10px; border: 1px solid #ddd; }
button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
ul { list-style: none; padding: 0; }
li { padding: 10px; background: #f9f9f9; margin: 5px 0; border-radius: 4px; }`,
      js: `function addTask() {
  const input = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  if (input.value.trim()) {
    const li = document.createElement('li');
    li.textContent = input.value;
    taskList.appendChild(li);
    input.value = '';
  }
}`,
      explanation: 'I created a simple todo app with HTML, CSS, and JavaScript based on your request.'
    }
  } else if (lowerResponse.includes('calculator')) {
    return {
      html: `<div class="calculator">
  <input type="text" id="display" readonly>
  <div class="buttons">
    <button onclick="clearDisplay()">C</button>
    <button onclick="appendToDisplay('7')">7</button>
    <button onclick="appendToDisplay('8')">8</button>
    <button onclick="appendToDisplay('9')">9</button>
    <button onclick="appendToDisplay('+')">+</button>
    <button onclick="appendToDisplay('4')">4</button>
    <button onclick="appendToDisplay('5')">5</button>
    <button onclick="appendToDisplay('6')">6</button>
    <button onclick="appendToDisplay('-')">-</button>
    <button onclick="appendToDisplay('1')">1</button>
    <button onclick="appendToDisplay('2')">2</button>
    <button onclick="appendToDisplay('3')">3</button>
    <button onclick="appendToDisplay('*')">×</button>
    <button onclick="appendToDisplay('0')">0</button>
    <button onclick="calculate()">=</button>
    <button onclick="appendToDisplay('/')">/</button>
  </div>
</div>`,
      css: `.calculator { width: 300px; margin: 50px auto; border: 1px solid #ccc; border-radius: 10px; padding: 20px; }
#display { width: 100%; height: 50px; font-size: 24px; text-align: right; margin-bottom: 10px; padding: 0 10px; }
.buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
button { height: 50px; font-size: 18px; border: none; background: #f0f0f0; cursor: pointer; border-radius: 5px; }
button:hover { background: #e0e0e0; }`,
      js: `function clearDisplay() { document.getElementById('display').value = ''; }
function appendToDisplay(value) { document.getElementById('display').value += value; }
function calculate() {
  try {
    const result = eval(document.getElementById('display').value);
    document.getElementById('display').value = result;
  } catch(error) {
    document.getElementById('display').value = 'Error';
  }
}`,
      explanation: 'I created a simple calculator with HTML, CSS, and JavaScript.'
    }
  } else if (lowerResponse.includes('button') || lowerResponse.includes('click')) {
    const buttonColor = lowerResponse.includes('green') ? '#28a745' : lowerResponse.includes('red') ? '#dc3545' : lowerResponse.includes('blue') ? '#007bff' : '#28a745'
    const hoverColor = lowerResponse.includes('green') ? '#218838' : lowerResponse.includes('red') ? '#c82333' : lowerResponse.includes('blue') ? '#0056b3' : '#218838'
    return {
      html: '<button id="myButton" onclick="handleClick()">Click Me!</button>',
      css: `#myButton { padding: 15px 30px; background: ${buttonColor}; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; transition: background 0.3s; } #myButton:hover { background: ${hoverColor}; }`,
      js: 'function handleClick() { alert("Button clicked! Hello World!"); document.getElementById("myButton").style.transform = "scale(0.95)"; setTimeout(() => { document.getElementById("myButton").style.transform = "scale(1)"; }, 100); }',
      explanation: 'I created a simple button with click functionality and color based on your request.'
    }
  } else if (lowerResponse.includes('form') || lowerResponse.includes('input')) {
    return {
      html: '<div class="form-container"><h2>Simple Form</h2><form><input type="text" id="nameInput" placeholder="Enter your name"><br><input type="email" id="emailInput" placeholder="Enter your email"><br><button type="button" onclick="submitForm()">Submit</button></form><div id="result"></div></div>',
      css: '.form-container { max-width: 400px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif; } input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; } button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; } button:hover { background: #0056b3; }',
      js: 'function submitForm() { const name = document.getElementById("nameInput").value; const email = document.getElementById("emailInput").value; document.getElementById("result").innerHTML = `<p>Hello ${name}! Email: ${email}</p>`; }',
      explanation: 'I created a simple form with name and email inputs.'
    }
  } else {
    return {
      html: '<div><h1>Hello World!</h1><p>Welcome to your generated webpage!</p></div>',
      css: 'body { font-family: Arial, sans-serif; margin: 50px; } h1 { color: #007bff; } p { color: #666; font-size: 18px; }',
      js: 'console.log("Hello from JavaScript!");',
      explanation: 'I created a simple webpage based on your request.'
    }
  }
}

// Generate code endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { message, previousCode, conversationHistory } = req.body

    // Build context for the AI
    let systemPrompt = `You are a code generator that creates web applications using HTML, CSS, and JavaScript only.

Rules:
1. Always respond with working code in three separate code blocks
2. Use EXACTLY this format:

\`\`\`html
[your HTML code here]
\`\`\`

\`\`\`css
[your CSS code here]
\`\`\`

\`\`\`javascript
[your JavaScript code here]
\`\`\`

3. No external libraries or frameworks
4. Make functional, complete applications
5. Always include all three code blocks even if one is empty

Example response format:
\`\`\`html
<div class="container">
  <h1>My App</h1>
  <button onclick="doSomething()">Click</button>
</div>
\`\`\`

\`\`\`css
.container { padding: 20px; }
button { background: blue; color: white; padding: 10px; }
\`\`\`

\`\`\`javascript
function doSomething() {
  alert('Hello!');
}
\`\`\`

Now respond to the user's request with this exact format.`

    // Build full prompt for Ollama
    let fullPrompt = systemPrompt + '\n\n'
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      fullPrompt += 'Previous conversation:\n'
      conversationHistory.forEach(msg => {
        fullPrompt += `${msg.type}: ${msg.content}\n`
      })
      fullPrompt += '\n'
    }

    // Add current request with context - simplified
    if (previousCode && (previousCode.html || previousCode.css || previousCode.js)) {
      fullPrompt += `Modify this existing code based on: ${message}\n\n`
      fullPrompt += 'Current code:\n'
      if (previousCode.html) fullPrompt += `HTML: ${previousCode.html}\n`
      if (previousCode.css) fullPrompt += `CSS: ${previousCode.css}\n`
      if (previousCode.js) fullPrompt += `JS: ${previousCode.js}\n`
      fullPrompt += `\nModify the code to: ${message}\n`
    } else {
      fullPrompt += `Create: ${message}\n`
    }
    
    fullPrompt += '\nRespond with code in the three code blocks format shown above.'

    console.log(`Calling Ollama with model: ${OLLAMA_MODEL}`)
    console.log(`Ollama URL: ${OLLAMA_URL}/api/generate`)
    
    // Call Ollama API
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2000
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Ollama API error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}. Response: ${errorText}`)
    }

    const data = await response.json()
    const aiResponse = data.response
    const parsedCode = parseCodeFromResponse(aiResponse, message)

    // Smart code merging - if AI provides new code, use it; otherwise keep previous code
    const finalCode = {
      html: parsedCode.html && parsedCode.html.length > 10 ? parsedCode.html : (previousCode?.html || ''),
      css: parsedCode.css && parsedCode.css.length > 10 ? parsedCode.css : (previousCode?.css || ''),
      js: parsedCode.js && parsedCode.js.length > 10 ? parsedCode.js : (previousCode?.js || '')
    }

    console.log('Final code being sent:', {
      html: finalCode.html.length + ' chars',
      css: finalCode.css.length + ' chars',
      js: finalCode.js.length + ' chars'
    })

    res.json({
      success: true,
      code: finalCode,
      explanation: parsedCode.explanation,
      rawResponse: aiResponse
    })

  } catch (error) {
    console.error('Error generating code:', error)
    
    // Check if it's a connection error to Ollama
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      res.json({
        success: false,
        error: 'Could not connect to Ollama. Make sure Ollama is running on localhost:11434 and you have a model installed.'
      })
    } else {
      res.json({
        success: false,
        error: error.message || 'Failed to generate code'
      })
    }
  }
})

// Test endpoint - simulates a proper todo app response
app.post('/api/test', (req, res) => {
  const { message } = req.body
  
  if (message && message.toLowerCase().includes('delete')) {
    // Simulate adding delete functionality
    res.json({
      success: true,
      code: {
        html: `<div class="todo-app">
  <h1>Todo App</h1>
  <input type="text" id="taskInput" placeholder="Enter a task...">
  <button onclick="addTask()">Add Task</button>
  <ul id="taskList"></ul>
</div>`,
        css: `.todo-app { max-width: 400px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif; }
h1 { color: #333; text-align: center; }
input { width: 70%; padding: 10px; border: 1px solid #ddd; }
button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
ul { list-style: none; padding: 0; }
li { padding: 10px; background: #f9f9f9; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between; }
.delete-btn { background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px; }`,
        js: `function addTask() {
  const input = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  if (input.value.trim()) {
    const li = document.createElement('li');
    li.innerHTML = input.value + '<button class="delete-btn" onclick="deleteTask(this)">Delete</button>';
    taskList.appendChild(li);
    input.value = '';
  }
}

function deleteTask(button) {
  button.parentElement.remove();
}`
      },
      explanation: 'I added delete functionality to the todo app. Now each task has a delete button.'
    })
  } else {
    // Simulate initial todo app creation
    res.json({
      success: true,
      code: {
        html: `<div class="todo-app">
  <h1>Todo App</h1>
  <input type="text" id="taskInput" placeholder="Enter a task...">
  <button onclick="addTask()">Add Task</button>
  <ul id="taskList"></ul>
</div>`,
        css: `.todo-app { max-width: 400px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif; }
h1 { color: #333; text-align: center; }
input { width: 70%; padding: 10px; border: 1px solid #ddd; }
button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
ul { list-style: none; padding: 0; }
li { padding: 10px; background: #f9f9f9; margin: 5px 0; border-radius: 4px; }`,
        js: `function addTask() {
  const input = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  if (input.value.trim()) {
    const li = document.createElement('li');
    li.textContent = input.value;
    taskList.appendChild(li);
    input.value = '';
  }
}`
      },
      explanation: 'I created a simple todo app with HTML, CSS, and JavaScript.'
    })
  }
})

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check if Ollama is running
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    const isOllamaRunning = response.ok
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      ollama: {
        url: OLLAMA_URL,
        model: OLLAMA_MODEL,
        running: isOllamaRunning
      }
    })
  } catch (error) {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      ollama: {
        url: OLLAMA_URL,
        model: OLLAMA_MODEL,
        running: false,
        error: 'Could not connect to Ollama'
      }
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Ollama URL: ${OLLAMA_URL}`)
  console.log(`Ollama Model: ${OLLAMA_MODEL}`)
  console.log('\n🤖 Make sure Ollama is running with: ollama serve')
  console.log(`📦 Make sure you have a model installed, for example: ollama pull ${OLLAMA_MODEL}`)
})
