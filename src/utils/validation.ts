export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CodeValidationResult {
  html: ValidationResult;
  css: ValidationResult;
  js: ValidationResult;
}

export class CodeValidator {
  static validateHTML(html: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!html.trim()) {
      return { isValid: true, errors, warnings };
    }

    // Check for basic HTML structure
    if (!html.includes('<') || !html.includes('>')) {
      errors.push('Invalid HTML: No HTML tags found');
    }

    // Check for unclosed tags (basic check)
    const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (html.match(/<\/[^>]*>/g) || []).length;
    
    if (openTags !== closeTags) {
      warnings.push('Potential unclosed HTML tags detected');
    }

    // Check for script tags in HTML (should be in JS section)
    if (html.includes('<script')) {
      warnings.push('Script tags found in HTML. Consider moving JavaScript to the JS section.');
    }

    // Check for style tags in HTML (should be in CSS section)
    if (html.includes('<style')) {
      warnings.push('Style tags found in HTML. Consider moving CSS to the CSS section.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateCSS(css: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!css.trim()) {
      return { isValid: true, errors, warnings };
    }

    // Check for basic CSS structure
    if (!css.includes('{') || !css.includes('}')) {
      errors.push('Invalid CSS: No CSS rules found');
    }

    // Check for balanced braces
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced CSS braces');
    }

    // Check for common CSS issues
    if (css.includes('color:') && !css.includes(';')) {
      warnings.push('Missing semicolon in CSS color property');
    }

    // Check for HTML tags in CSS (shouldn't be there)
    if (css.match(/<[^>]*>/)) {
      errors.push('HTML tags found in CSS. CSS should only contain styling rules.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateJavaScript(js: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!js.trim()) {
      return { isValid: true, errors, warnings };
    }

    // Check for balanced braces and parentheses
    const openBraces = (js.match(/\{/g) || []).length;
    const closeBraces = (js.match(/\}/g) || []).length;
    const openParens = (js.match(/\(/g) || []).length;
    const closeParens = (js.match(/\)/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced JavaScript braces');
    }
    
    if (openParens !== closeParens) {
      errors.push('Unbalanced JavaScript parentheses');
    }

    // Check for common JavaScript issues
    if (js.includes('function') && !js.includes('{')) {
      warnings.push('Function declaration may be missing opening brace');
    }

    // Check for HTML/CSS in JavaScript (shouldn't be there)
    if (js.match(/<[^>]*>/)) {
      warnings.push('HTML tags found in JavaScript. Consider moving HTML to the HTML section.');
    }

    if (js.includes('{') && js.includes('color:') && !js.includes('function')) {
      warnings.push('CSS-like syntax found in JavaScript. Consider moving styles to the CSS section.');
    }

    // Check for potential syntax errors
    if (js.includes('===') || js.includes('!==')) {
      // Good practice
    } else if (js.includes('==') || js.includes('!=')) {
      warnings.push('Consider using strict equality (===) instead of loose equality (==)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateAllCode(code: { html: string; css: string; js: string }): CodeValidationResult {
    return {
      html: this.validateHTML(code.html),
      css: this.validateCSS(code.css),
      js: this.validateJavaScript(code.js)
    };
  }

  static hasErrors(validationResult: CodeValidationResult): boolean {
    return validationResult.html.errors.length > 0 || 
           validationResult.css.errors.length > 0 || 
           validationResult.js.errors.length > 0;
  }

  static getAllErrors(validationResult: CodeValidationResult): string[] {
    return [
      ...validationResult.html.errors.map(e => `HTML: ${e}`),
      ...validationResult.css.errors.map(e => `CSS: ${e}`),
      ...validationResult.js.errors.map(e => `JavaScript: ${e}`)
    ];
  }

  static getAllWarnings(validationResult: CodeValidationResult): string[] {
    return [
      ...validationResult.html.warnings.map(w => `HTML: ${w}`),
      ...validationResult.css.warnings.map(w => `CSS: ${w}`),
      ...validationResult.js.warnings.map(w => `JavaScript: ${w}`)
    ];
  }
}
