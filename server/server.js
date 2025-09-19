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

// Gemini configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDZlHR9j5S1-6zxgT0M_21mroB_DZ0sBp0'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

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

  // Extract code blocks using enhanced patterns
  const codeBlocks = {
    html: extractCodeBlock(cleanResponse, ['html', 'HTML', 'htm', 'HTM']),
    css: extractCodeBlock(cleanResponse, ['css', 'CSS', 'style', 'STYLE']),
    js: extractCodeBlock(cleanResponse, ['javascript', 'js', 'JavaScript', 'JS', 'script', 'SCRIPT'])
  }

  result.html = validateAndCleanHTML(codeBlocks.html || '')
  result.css = validateAndCleanCSS(codeBlocks.css || '')
  result.js = validateAndCleanJS(codeBlocks.js || '')

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

// Enhanced validation and cleaning functions
function validateAndCleanHTML(html) {
  if (!html) return ''
  
  // Ensure proper HTML structure
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated App</title>\n</head>\n<body>\n${html}\n</body>\n</html>`
  }
  
  return html.trim()
}

function validateAndCleanCSS(css) {
  if (!css) return ''
  
  // Add basic reset if not present
  if (!css.includes('*') && !css.includes('body')) {
    css = `* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n    line-height: 1.6;\n    color: #333;\n}\n\n${css}`
  }
  
  return css.trim()
}

function validateAndCleanJS(js) {
  if (!js) return ''
  
  // Wrap in DOMContentLoaded if not already wrapped
  if (!js.includes('DOMContentLoaded') && !js.includes('window.onload')) {
    js = `document.addEventListener('DOMContentLoaded', function() {\n${js}\n});`
  }
  
  return js.trim()
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

    // Build context for the AI with enhanced prompt engineering
    let systemPrompt = `You are an expert web developer specializing in creating modern, responsive web applications using vanilla HTML, CSS, and JavaScript.

## CRITICAL RULES:
1. ALWAYS respond with EXACTLY three code blocks in this precise format:
   - \`\`\`html (complete HTML structure)
   - \`\`\`css (all styling)
   - \`\`\`javascript (all functionality)

2. CODE QUALITY STANDARDS:
   - Write clean, semantic HTML5
   - Use modern CSS with flexbox/grid
   - Write efficient, readable JavaScript
   - Include proper accessibility attributes
   - Make responsive designs (mobile-first)
   - Use meaningful class names and IDs

3. FUNCTIONALITY REQUIREMENTS:
   - Create complete, working applications
   - Include all necessary event handlers
   - Handle edge cases and user input validation
   - Use modern JavaScript (ES6+ features)
   - No external libraries or frameworks
   - Ensure cross-browser compatibility

4. RESPONSE FORMAT (MANDATORY):
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Title</title>
</head>
<body>
    <!-- Your HTML content -->
</body>
</html>
\`\`\`

\`\`\`css
/* Reset and base styles */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

/* Your CSS styles */
\`\`\`

\`\`\`javascript
// Your JavaScript code
document.addEventListener('DOMContentLoaded', function() {
    // Initialize your app
});
\`\`\`

## CONTEXT AWARENESS:
- If modifying existing code, preserve working functionality
- If creating new code, make it production-ready
- Always include proper error handling
- Use modern web standards and best practices

Respond with the exact three-block format above.`

    // Build full prompt for Ollama
    let fullPrompt = systemPrompt + '\n\n'
    
    // Add conversation history with better context
    if (conversationHistory && conversationHistory.length > 0) {
      fullPrompt += '## CONVERSATION HISTORY:\n'
      conversationHistory.slice(-5).forEach((msg, index) => {
        const role = msg.type === 'user' ? 'USER' : 'ASSISTANT'
        fullPrompt += `${role}: ${msg.content}\n`
      })
      fullPrompt += '\n'
    }

    // Add current request with enhanced context
    if (previousCode && (previousCode.html || previousCode.css || previousCode.js)) {
      fullPrompt += `## MODIFICATION REQUEST:\n`
      fullPrompt += `User wants to modify existing code: "${message}"\n\n`
      
      fullPrompt += `## CURRENT CODE TO MODIFY:\n`
      if (previousCode.html) {
        fullPrompt += `HTML (${previousCode.html.length} chars):\n${previousCode.html}\n\n`
      }
      if (previousCode.css) {
        fullPrompt += `CSS (${previousCode.css.length} chars):\n${previousCode.css}\n\n`
      }
      if (previousCode.js) {
        fullPrompt += `JavaScript (${previousCode.js.length} chars):\n${previousCode.js}\n\n`
      }
      
      fullPrompt += `## INSTRUCTIONS:\n`
      fullPrompt += `- Preserve all working functionality\n`
      fullPrompt += `- Make the requested changes: "${message}"\n`
      fullPrompt += `- Ensure the code remains complete and functional\n`
      fullPrompt += `- Update all three code blocks as needed\n\n`
    } else {
      fullPrompt += `## NEW PROJECT REQUEST:\n`
      fullPrompt += `User wants to create: "${message}"\n\n`
      fullPrompt += `## REQUIREMENTS:\n`
      fullPrompt += `- Create a complete, functional web application\n`
      fullPrompt += `- Make it responsive and accessible\n`
      fullPrompt += `- Use modern web standards\n`
      fullPrompt += `- Include proper error handling\n\n`
    }
    
    fullPrompt += `## RESPONSE FORMAT:\n`
    fullPrompt += `Respond with EXACTLY three code blocks as specified in the rules above.`

    console.log(`Calling Gemini with model: ${GEMINI_MODEL}`)
    console.log(`Gemini URL: ${GEMINI_API_URL}`)
    
    // Retry logic for Gemini API
    let response, data, aiResponse
    let retries = 3
    let lastError
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
              topP: 0.8,
              topK: 10
            }
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Gemini API error (attempt ${attempt}): ${response.status} ${response.statusText}`, errorText)
          
          // If it's a 503 or 429 error and we have retries left, wait and try again
          if ((response.status === 503 || response.status === 429) && attempt < retries) {
            const waitTime = response.status === 429 ? 30 : (attempt * 2) // Wait longer for quota issues
            console.log(`Retrying in ${waitTime} seconds...`)
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
            continue
          }
          
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Response: ${errorText}`)
        }

        data = await response.json()
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        break // Success, exit retry loop
        
      } catch (error) {
        lastError = error
        if (attempt < retries) {
          console.log(`Attempt ${attempt} failed, retrying in ${attempt * 2} seconds...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 2000))
        }
      }
    }
    
    if (!aiResponse) {
      throw lastError || new Error('Failed to get response from Gemini API after all retries')
    }
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
    
    // Check for specific error types
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      res.json({
        success: false,
        error: 'Could not connect to Gemini API. Please check your internet connection and API key.'
      })
    } else if (error.message.includes('429') || error.message.includes('quota')) {
      res.json({
        success: false,
        error: 'Gemini API quota exceeded. Please check your API key limits or try again later.'
      })
    } else if (error.message.includes('503')) {
      res.json({
        success: false,
        error: 'Gemini API is temporarily unavailable. Please try again in a few minutes.'
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
    // Check if Gemini API is accessible
    const testResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    })
    const isGeminiRunning = testResponse.ok
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      gemini: {
        model: GEMINI_MODEL,
        running: isGeminiRunning,
        apiKey: GEMINI_API_KEY ? 'configured' : 'missing'
      }
    })
  } catch (error) {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      gemini: {
        model: GEMINI_MODEL,
        running: false,
        apiKey: GEMINI_API_KEY ? 'configured' : 'missing',
        error: 'Could not connect to Gemini API'
      }
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Gemini Model: ${GEMINI_MODEL}`)
  console.log(`Gemini API Key: ${GEMINI_API_KEY ? 'configured' : 'missing'}`)
  console.log('\n🤖 Using Google Gemini API for code generation')
  console.log(`📦 Model: ${GEMINI_MODEL}`)
})
