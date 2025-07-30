/**
 * Admin New V2 - Modern Split-Screen Editor
 * ES6 Class-based Architecture with Advanced Features
 *
 * @author Claude Code
 * @version 2.0.0
 */

'use strict';

// Prevent duplicate loading
if (window.adminEditorV2Loaded) {
  console.log('[AdminEditor] Admin Editor V2 already loaded, skipping...');
} else {
  window.adminEditorV2Loaded = true;

// === Utility Classes ===

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

class NotificationManager {
    constructor() {
        this.container = document.getElementById('notification-container');
        this.notifications = new Map();
        this.idCounter = 0;

        // Handle missing container gracefully
        if (!this.container) {
            console.warn('[NotificationManager] notification-container element not found. Notifications will be disabled.');
            this.disabled = true;
        } else {
            this.disabled = false;
        }
    }

    show(type, title, message, duration = 5000) {
        // If disabled, log to console instead
        if (this.disabled || !this.container) {
            console.log(`[Notification ${type.toUpperCase()}] ${title}: ${message}`);
            return -1;
        }

        const id = ++this.idCounter;
        const notification = this.createNotification(id, type, title, message);

        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Trigger show animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-hide
        if (duration > 0) {
            setTimeout(() => this.hide(id), duration);
        }

        return id;
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 250);
        }
    }

    createNotification(id, type, title, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${this.getIcon(type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="window.adminEditor.notifications.hide(${id})">
                <i class="fas fa-times"></i>
            </button>
        `;
        return notification;
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }
}

class AutoSaveManager {
    constructor(saveCallback, interval = 30000) {
        this.saveCallback = saveCallback;
        this.interval = interval;
        this.timeoutId = null;
        this.lastSaveContent = '';
        this.isEnabled = true;
    }

    schedule(content) {
        if (!this.isEnabled || content === this.lastSaveContent) {
            return;
        }

        this.cancel();
        this.timeoutId = setTimeout(() => {
            this.save(content);
        }, this.interval);
    }

    save(content) {
        if (this.saveCallback && typeof this.saveCallback === 'function') {
            this.saveCallback(content);
            this.lastSaveContent = content;
        }
    }

    cancel() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        this.cancel();
    }
}

// === Core Editor Classes ===

class QuizParser {
    constructor() {
        this.questionRegex = /^Câu\s*(\d+)\s*:\s*(.*)/i;
        this.pointsRegex = /^\[(\s*(\d+)\s*pts?\s*)\]$/i;
        this.numberAnswerRegex = /^Answer:\s*(.*)/i;
        this.abcdOptionRegex = /^(\*?)([A-Z])\.\s*(.*)/i;
        this.trueFalseOptionRegex = /^(\*?)([a-z])\)\s*(.*)/i;
    }

    parse(text) {
        const questions = [];
        const lines = text.split('\n');
        let currentQuestion = null;
        let currentLineIndex = -1;
        let questionTypeDetermined = false;

        lines.forEach((line, index) => {
            currentLineIndex = index;
            const trimmedLine = line.trim();

            // Check for question start
            const questionMatch = line.match(this.questionRegex);
            if (questionMatch) {
                if (currentQuestion) {
                    questions.push(this.finalizeQuestion(currentQuestion, questions.length));
                }
                // Clean any existing point markings from the question text
                const cleanedQuestionText = questionMatch[2].trim().replace(/\s*\[\s*[\d.]+\s*pts?\s*\]/gi, '').replace(/\s+/g, ' ').trim();
                currentQuestion = {
                    question: cleanedQuestionText,
                    options: [],
                    correct: null,
                    points: 1,
                    type: null,
                    startLine: currentLineIndex,
                    validation: { isValid: true, warnings: [], errors: [] }
                };
                questionTypeDetermined = false;
                return;
            }

            if (!currentQuestion) return;

            // Check for points
            const pointsMatch = trimmedLine.match(this.pointsRegex);
            if (pointsMatch) {
                currentQuestion.points = parseInt(pointsMatch[2]) || 1;
                return;
            }

            // Check for number answer
            const numberMatch = trimmedLine.match(this.numberAnswerRegex);
            if (numberMatch) {
                if (!questionTypeDetermined) {
                    currentQuestion.type = 'number';
                    currentQuestion.correct = numberMatch[1].trim();
                    currentQuestion.options = [];
                    questionTypeDetermined = true;
                }
                return;
            }

            // Check for ABCD options
            const abcdMatch = line.match(this.abcdOptionRegex);
            if (abcdMatch) {
                this.handleAbcdOption(currentQuestion, abcdMatch, currentLineIndex, questionTypeDetermined);
                questionTypeDetermined = true;
                return;
            }

            // Check for true/false options
            const tfMatch = line.match(this.trueFalseOptionRegex);
            if (tfMatch) {
                this.handleTrueFalseOption(currentQuestion, tfMatch, currentLineIndex, questionTypeDetermined);
                questionTypeDetermined = true;
                return;
            }

            // Handle continuation lines
            this.handleContinuationLine(currentQuestion, line, questionTypeDetermined);
        });

        if (currentQuestion) {
            questions.push(this.finalizeQuestion(currentQuestion, questions.length));
        }

        return questions;
    }

    handleAbcdOption(question, match, lineIndex, typeDetermined) {
        const isCorrectMarker = match[1] === '*';
        const letter = match[2];
        const optionText = match[3].trim();

        if (!typeDetermined) {
            question.type = 'abcd';
            question.correct = '';
        }

        if (question.type === 'abcd') {
            question.options.push({ text: optionText, line: lineIndex });
            if (isCorrectMarker) {
                if (question.correct) {
                    question.validation.warnings.push(`Multiple correct answers marked. Using first: '${question.correct}'. Ignoring '${letter}'.`);
                } else {
                    question.correct = letter;
                }
            }
        }
    }

    handleTrueFalseOption(question, match, lineIndex, typeDetermined) {
        const isCorrectMarker = match[1] === '*';
        const letter = match[2];
        const optionText = match[3].trim();

        if (!typeDetermined) {
            question.type = 'truefalse';
            question.correct = [];
        }

        if (question.type === 'truefalse') {
            question.options.push({ text: optionText, line: lineIndex });
            if (!Array.isArray(question.correct)) {
                question.correct = [];
            }
            question.correct[question.options.length - 1] = isCorrectMarker;
        }
    }

    handleContinuationLine(question, line, typeDetermined) {
        const trimmedLine = line.trim();

        // Check if this line should be ignored (it's a special format line)
        const isSpecialLine = line.match(this.questionRegex) ||
                             trimmedLine.match(this.pointsRegex) ||
                             line.match(this.abcdOptionRegex) ||
                             line.match(this.trueFalseOptionRegex) ||
                             trimmedLine.match(this.numberAnswerRegex);

        if (trimmedLine && !isSpecialLine) {
            if (typeDetermined && question.options.length > 0) {
                // Type is determined and we have options - append to last option
                const lastOption = question.options[question.options.length - 1];
                lastOption.text += '\n' + line;
            } else if (question.question) {
                // Type not determined yet OR no options yet - append to question text
                question.question += '\n' + line;
            }
        }
    }

    finalizeQuestion(question, index) {
        question.id = `q_${index + 1}`;
        
        // Validate question
        this.validateQuestion(question, index);
        
        // Process options
        question.options = question.options.map(opt => {
            if (typeof opt === 'string') {
                return { text: opt, line: -1 };
            }
            return { text: opt.text || '', line: opt.line || -1 };
        });

        // Type-specific processing
        if (question.type === 'abcd') {
            this.finalizeAbcdQuestion(question);
        } else if (question.type === 'truefalse') {
            this.finalizeTrueFalseQuestion(question);
        } else if (question.type === 'number') {
            this.finalizeNumberQuestion(question);
        }

        return question;
    }

    validateQuestion(question, index) {
        const validation = question.validation;

        // Check if question has content
        if (!question.question || question.question.trim() === '') {
            validation.errors.push('Nội dung câu hỏi trống');
            validation.isValid = false;
        }

        // Check if type is determined
        if (!question.type || question.type === null) {
            if (question.options.length === 0 && question.correct === null) {
                validation.errors.push('Không thể xác định loại câu hỏi');
                validation.isValid = false;
                question.type = 'invalid';
            }
        }

        // Type-specific validation
        if (question.type === 'abcd') {
            if (question.options.length !== 4) {
                validation.warnings.push(`ABCD question should have 4 options, found ${question.options.length}`);
            }
            if (!question.correct) {
                validation.errors.push('Không có đáp án đúng được đánh dấu bằng *');
                validation.isValid = false;
            }
        } else if (question.type === 'truefalse') {
            if (!Array.isArray(question.correct) || question.correct.length !== question.options.length) {
                validation.errors.push('Các lựa chọn Đúng/Sai và đáp án đúng không khớp');
                validation.isValid = false;
            }
        } else if (question.type === 'number') {
            if (!question.correct || question.correct.trim() === '') {
                validation.errors.push('Câu hỏi số thiếu đáp án');
                validation.isValid = false;
            }
        }
    }

    finalizeAbcdQuestion(question) {
        // Ensure 4 options
        while (question.options.length < 4) {
            question.options.push({ text: '', line: -1 });
        }
        question.options = question.options.slice(0, 4);
        question.correct = question.correct ? String(question.correct).toUpperCase() : '';
    }

    finalizeTrueFalseQuestion(question) {
        if (!Array.isArray(question.correct)) {
            question.correct = new Array(question.options.length).fill(false);
        } else if (question.correct.length !== question.options.length) {
            const correctedArray = new Array(question.options.length).fill(false);
            for (let i = 0; i < Math.min(question.options.length, question.correct.length); i++) {
                correctedArray[i] = question.correct[i];
            }
            question.correct = correctedArray;
        }
        question.correct = question.correct.map(c => !!c);
    }

    finalizeNumberQuestion(question) {
        question.correct = String(question.correct || '');
    }
}

class CodeMirrorManager {
    constructor(textareaId, options = {}) {
        this.textareaId = textareaId;
        this.editor = null;
        this.options = {
            lineNumbers: true,
            mode: null,
            theme: 'material-white',
            lineWrapping: true,
            autofocus: true,
            indentUnit: 2,
            tabSize: 2,
            autoCloseBrackets: true,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            styleActiveLine: true,
            ...options
        };
        this.eventEmitter = new EventEmitter();
        this.debounceTimer = null;
    }

    initialize(initialContent = '') {
        const textarea = document.getElementById(this.textareaId);
        if (!textarea) {
            const error = new Error(`Textarea with id "${this.textareaId}" not found`);
            console.error('[CodeMirrorManager]', error.message);
            throw error;
        }

        if (typeof CodeMirror === 'undefined') {
            const error = new Error('CodeMirror library not loaded');
            console.error('[CodeMirrorManager]', error.message);
            throw error;
        }

        // Setup custom key bindings
        this.options.extraKeys = {
            'Enter': this.handleEnterKey.bind(this),
            'Shift-Enter': this.handleShiftEnterKey.bind(this),
            'Tab': this.handleTabKey.bind(this),
            'Ctrl-S': this.handleSaveKey.bind(this),
            'Cmd-S': this.handleSaveKey.bind(this),
            'Ctrl-Z': 'undo',
            'Cmd-Z': 'undo',
            'Ctrl-Y': 'redo',
            'Cmd-Y': 'redo',
            'Ctrl-F': 'findPersistent',
            'Cmd-F': 'findPersistent'
        };

        this.editor = CodeMirror.fromTextArea(textarea, this.options);
        this.editor.setValue(initialContent);

        this.setupEventHandlers();
        this.setupCursorTracking();

        // Make editor globally accessible
        window.editor = this.editor;
        
        return this.editor;
    }

    setupEventHandlers() {
        // Change event with debouncing
        this.editor.on('change', (cm, change) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                const content = cm.getValue();
                this.eventEmitter.emit('content-change', {
                    content,
                    change,
                    editor: cm
                });
            }, 300);
        });

        // Cursor activity
        this.editor.on('cursorActivity', (cm) => {
            this.updateCursorPosition(cm);
        });

        // Focus events
        this.editor.on('focus', () => {
            this.eventEmitter.emit('focus');
        });

        this.editor.on('blur', () => {
            this.eventEmitter.emit('blur');
        });
    }

    setupCursorTracking() {
        const cursorElement = document.querySelector('.cursor-position');
        if (cursorElement) {
            this.editor.on('cursorActivity', (cm) => {
                const cursor = cm.getCursor();
                cursorElement.textContent = `Dòng ${cursor.line + 1}, Cột ${cursor.ch + 1}`;
            });
        }
    }

    handleEnterKey(cm) {
        const cursor = cm.getCursor();
        const lineContent = cm.getLine(cursor.line);
        const trimmedLine = lineContent.trim();

        let nextLinePrefix = this.getNextLinePrefix(trimmedLine, cm, cursor);
        cm.replaceSelection('\n' + nextLinePrefix);
    }

    handleShiftEnterKey(cm) {
        cm.replaceSelection('\n');
    }

    handleTabKey(cm) {
        if (cm.getSelection()) {
            cm.indentSelection('add');
        } else {
            cm.replaceSelection('  ');
        }
    }

    handleSaveKey(cm) {
        this.eventEmitter.emit('save-requested');
        return false; // Prevent default browser save
    }

    getNextLinePrefix(trimmedLine, cm, cursor) {
        // ABCD option pattern
        const abcdMatch = trimmedLine.match(/^(\*?)([A-Z])\./i);
        if (abcdMatch) {
            const currentLetter = abcdMatch[2].toUpperCase();
            if (currentLetter < 'D') {
                return String.fromCharCode(currentLetter.charCodeAt(0) + 1) + '. ';
            } else {
                return '\n';
            }
        }

        // True/False option pattern
        const tfMatch = trimmedLine.match(/^(\*?)([a-z])\)/i);
        if (tfMatch) {
            const currentLetter = tfMatch[2].toLowerCase();
            return String.fromCharCode(currentLetter.charCodeAt(0) + 1) + ') ';
        }

        // Question pattern
        const questionMatch = trimmedLine.match(/^Câu\s*\d+\s*:/i);
        if (questionMatch) {
            return 'A. ';
        }

        // Check previous line context
        if (cursor.line > 0) {
            const prevLine = cm.getLine(cursor.line - 1)?.trim();
            if (prevLine) {
                const prevAbcdMatch = prevLine.match(/^(\*?)([A-Z])\./i);
                const prevTfMatch = prevLine.match(/^(\*?)([a-z])\)/i);
                const prevQuestionMatch = prevLine.match(/^Câu\s*\d+\s*:|^\[\d+\s*pts?\s*\]$/i);

                if (prevAbcdMatch) {
                    const prevLetter = prevAbcdMatch[2].toUpperCase();
                    if (prevLetter < 'D') {
                        return String.fromCharCode(prevLetter.charCodeAt(0) + 1) + '. ';
                    }
                } else if (prevTfMatch) {
                    const prevLetter = prevTfMatch[2].toLowerCase();
                    return String.fromCharCode(prevLetter.charCodeAt(0) + 1) + ') ';
                } else if (prevQuestionMatch) {
                    return 'A. ';
                }
            }
        }

        return '';
    }

    updateCursorPosition(cm) {
        const cursor = cm.getCursor();
        this.eventEmitter.emit('cursor-change', {
            line: cursor.line + 1,
            column: cursor.ch + 1,
            cursor
        });
    }

    applySyntaxHighlighting() {
        if (!this.editor) return;

        this.editor.operation(() => {
            for (let i = 0; i < this.editor.lineCount(); i++) {
                this.highlightLine(i);
            }
        });
    }

    highlightLine(lineNumber) {
        const line = this.editor.getLine(lineNumber);
        if (!line) return;

        // Clear existing marks
        const marks = this.editor.findMarks(
            { line: lineNumber, ch: 0 },
            { line: lineNumber, ch: line.length }
        );
        marks.forEach(mark => mark.clear());

        // Apply new highlighting
        this.applyQuestionHighlighting(lineNumber, line);
        this.applyOptionHighlighting(lineNumber, line);
        this.applySpecialHighlighting(lineNumber, line);
    }

    applyQuestionHighlighting(lineNumber, line) {
        const questionMatch = line.match(/^(Câu\s*\d+)(:)/i);
        if (questionMatch) {
            this.editor.markText(
                { line: lineNumber, ch: 0 },
                { line: lineNumber, ch: questionMatch[1].length },
                { className: 'cm-question-number' }
            );
            this.editor.markText(
                { line: lineNumber, ch: questionMatch[1].length },
                { line: lineNumber, ch: questionMatch[1].length + 1 },
                { className: 'cm-question-colon' }
            );
        }
    }

    applyOptionHighlighting(lineNumber, line) {
        // ABCD options
        const abcdMatch = line.match(/^(\s*)(\*?)([A-Z])(\.)/i);
        if (abcdMatch) {
            const leadingSpace = abcdMatch[1].length;
            let start = leadingSpace;
            
            if (abcdMatch[2]) {
                this.editor.markText(
                    { line: lineNumber, ch: start },
                    { line: lineNumber, ch: start + 1 },
                    { className: 'cm-correct-marker' }
                );
                start += 1;
            }
            
            this.editor.markText(
                { line: lineNumber, ch: start },
                { line: lineNumber, ch: start + 1 },
                { className: 'cm-option-letter' }
            );
            this.editor.markText(
                { line: lineNumber, ch: start + 1 },
                { line: lineNumber, ch: start + 2 },
                { className: 'cm-option-dot' }
            );
            return;
        }

        // True/False options
        const tfMatch = line.match(/^(\s*)(\*?)([a-z])(\))/i);
        if (tfMatch) {
            const leadingSpace = tfMatch[1].length;
            let start = leadingSpace;
            
            if (tfMatch[2]) {
                this.editor.markText(
                    { line: lineNumber, ch: start },
                    { line: lineNumber, ch: start + 1 },
                    { className: 'cm-correct-marker' }
                );
                start += 1;
            }
            
            this.editor.markText(
                { line: lineNumber, ch: start },
                { line: lineNumber, ch: start + 1 },
                { className: 'cm-tf-option-letter' }
            );
            this.editor.markText(
                { line: lineNumber, ch: start + 1 },
                { line: lineNumber, ch: start + 2 },
                { className: 'cm-tf-option-paren' }
            );
        }
    }

    applySpecialHighlighting(lineNumber, line) {
        // Points marker
        const pointsMatch = line.match(/(\[\s*\d+\s*pts?\s*\])/i);
        if (pointsMatch && line.trim().match(/^\[\s*\d+\s*pts?\s*\]$/i)) {
            const startPos = line.indexOf(pointsMatch[1]);
            this.editor.markText(
                { line: lineNumber, ch: startPos },
                { line: lineNumber, ch: startPos + pointsMatch[1].length },
                { className: 'cm-points-marker' }
            );
        }

        // Answer prefix
        const answerMatch = line.match(/^(\s*)(Answer:)/i);
        if (answerMatch) {
            const leadingSpace = answerMatch[1].length;
            this.editor.markText(
                { line: lineNumber, ch: leadingSpace },
                { line: lineNumber, ch: leadingSpace + answerMatch[2].length },
                { className: 'cm-answer-prefix' }
            );
        }
    }

    scrollToQuestion(questionIndex, questions) {
        if (!questions || questionIndex >= questions.length) return;
        
        const question = questions[questionIndex];
        const lineNumber = question.startLine || 0;
        
        this.editor.scrollIntoView({ line: lineNumber, ch: 0 }, 50);
        this.editor.setCursor({ line: lineNumber, ch: 0 });
        this.editor.focus();
    }

    insertText(text, position = null) {
        if (position) {
            this.editor.replaceRange(text, position);
        } else {
            this.editor.replaceSelection(text);
        }
        this.editor.focus();
    }

    markCorrectAnswer(questionIndex, optionIndex, questions) {
        if (!questions || questionIndex >= questions.length) return;

        const question = questions[questionIndex];
        if (question.type !== 'abcd' || optionIndex >= question.options.length) return;

        const targetOptionLine = question.options[optionIndex].line;
        if (targetOptionLine === -1) return;

        this.editor.operation(() => {
            // Remove existing correct markers from all options
            question.options.forEach(opt => {
                if (opt.line !== -1) {
                    const lineContent = this.editor.getLine(opt.line);
                    if (lineContent?.trim().startsWith('*')) {
                        const starPos = lineContent.indexOf('*');
                        this.editor.replaceRange('', 
                            { line: opt.line, ch: starPos }, 
                            { line: opt.line, ch: starPos + 1 }
                        );
                    }
                }
            });

            // Add correct marker to selected option
            const currentLine = this.editor.getLine(targetOptionLine);
            if (currentLine && !currentLine.trim().startsWith('*')) {
                const insertPos = currentLine.search(/\S|$/);
                this.editor.replaceRange('*', { line: targetOptionLine, ch: insertPos });
            }
        });

        // Trigger content change to update preview
        this.eventEmitter.emit('content-change', {
            content: this.editor.getValue(),
            editor: this.editor
        });
    }

    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }

    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }

    refresh() {
        if (this.editor) {
            this.editor.refresh();
        }
    }

    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }

    destroy() {
        if (this.editor) {
            this.editor.toTextArea();
            this.editor = null;
        }
    }
}

class PreviewManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.eventEmitter = new EventEmitter();
        this.currentQuestions = [];
        this.currentMode = 'normal';
        this.zoomLevel = 100;
        this.validationStats = {
            valid: 0,
            warnings: 0,
            errors: 0
        };

        // Handle missing container gracefully
        if (!this.container) {
            console.warn(`[PreviewManager] Container element with id "${containerId}" not found. Preview will be disabled.`);
            this.disabled = true;
        } else {
            this.disabled = false;
        }
    }

    initialize() {
        this.setupEventHandlers();
        this.showPlaceholder();
    }

    setupEventHandlers() {
        // Mode switching
        document.getElementById('preview-mode-normal')?.addEventListener('click', () => {
            this.setMode('normal');
        });

        document.getElementById('preview-mode-card')?.addEventListener('click', () => {
            this.setMode('card');
        });

        document.getElementById('preview-mode-exam')?.addEventListener('click', () => {
            this.setMode('exam');
        });

        // Zoom controls
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
            this.zoom(-10);
        });

        document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
            this.zoom(10);
        });

        // Validation
        document.getElementById('validate-btn')?.addEventListener('click', () => {
            this.validateQuestions();
        });

        // Refresh
        document.getElementById('refresh-preview-btn')?.addEventListener('click', () => {
            this.updatePreview(this.currentQuestions);
        });
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        document.querySelectorAll('[id^="preview-mode-"]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`preview-mode-${mode}`)?.classList.add('active');

        // Re-render with new mode
        this.updatePreview(this.currentQuestions);
    }

    zoom(delta) {
        this.zoomLevel = Math.max(50, Math.min(200, this.zoomLevel + delta));
        
        const zoomElement = document.querySelector('.zoom-level');
        if (zoomElement) {
            zoomElement.textContent = `${this.zoomLevel}%`;
        }

        this.container.style.fontSize = `${this.zoomLevel}%`;
    }

    updatePreview(questions) {
        this.currentQuestions = questions || [];

        // If disabled, just log and return
        if (this.disabled || !this.container) {
            console.log('[PreviewManager] Preview disabled, skipping update');
            return;
        }

        if (!questions || questions.length === 0) {
            this.showPlaceholder();
            return;
        }

        this.container.innerHTML = '';
        this.renderQuestions(questions);
        this.renderMath();
    }

    showPlaceholder() {
        if (this.disabled || !this.container) {
            console.log('[PreviewManager] Preview disabled, skipping placeholder');
            return;
        }

        this.container.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <h3>Xem trước câu hỏi</h3>
                <p>Nhập câu hỏi bên trái để xem kết quả hiển thị</p>
                <div class="placeholder-tips">
                    <h4>Mẹo sử dụng:</h4>
                    <ul>
                        <li>Sử dụng * để đánh dấu đáp án đúng</li>
                        <li>Định dạng: Câu X: [nội dung câu hỏi]</li>
                        <li>Tùy chọn: A. B. C. D. cho trắc nghiệm</li>
                        <li>Hỗ trợ LaTeX với cú pháp $...$ hoặc $$...$$</li>
                    </ul>
                </div>
            </div>
        `;
    }

    renderQuestions(questions) {
        questions.forEach((question, index) => {
            const questionElement = this.createQuestionElement(question, index);
            this.container.appendChild(questionElement);
        });
    }

    createQuestionElement(question, index) {
        const element = document.createElement('div');
        element.className = `question-card ${this.getQuestionClass(question)}`;
        element.setAttribute('data-question-index', index);
        
        element.innerHTML = this.getQuestionHTML(question, index);
        
        // Add click handlers
        this.addQuestionEventHandlers(element, question, index);
        
        return element;
    }

    getQuestionClass(question) {
        if (!question.validation.isValid) {
            return 'invalid';
        } else if (question.validation.warnings.length > 0) {
            return 'warning';
        }
        return '';
    }

    getQuestionHTML(question, index) {
        const questionNumber = index + 1;
        const questionText = this.processContent(question.question);
        
        let html = `
            <div class="question-metadata">
                <div class="question-label">Câu ${questionNumber}.</div>
                <div class="question-controls">
                    <button class="audio-button">
                        Nhập điểm
                    </button>
                    <button class="audio-button">
                        <i class="fas fa-volume-up"></i> Audio
                    </button>
                    <select class="question-dropdown">
                        <option value="trac-nghiem">Trắc nghiệm</option>
                        <option value="dung-sai">Đúng/Sai</option>
                        <option value="dien-vao">Điền vào</option>
                    </select>
                    <button class="audio-button">
                        <i class="fas fa-tag"></i>
                    </button>
                    <button class="audio-button">
                        <i class="fas fa-exchange-alt"></i> Đổi câu khác
                    </button>
                    <button class="audio-button">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
            <div class="question-content">
                <div class="question-text">${questionText}</div>
            </div>
        `;

        // Add question content based on type
        if (question.type === 'abcd') {
            html += this.renderAbcdOptions(question, index);
        } else if (question.type === 'truefalse') {
            html += this.renderTrueFalseOptions(question, index);
        } else if (question.type === 'number') {
            html += this.renderNumberAnswer(question);
        } else if (question.type === 'invalid') {
            html += '<div class="invalid-question">Invalid Question Format</div>';
        }

        // Add points if not default
        if (question.points > 1) {
            html += `<div class="question-points">[${question.points} pts]</div>`;
        }

        // Add validation info
        if (question.validation.warnings.length > 0 || question.validation.errors.length > 0) {
            html += this.renderValidationInfo(question.validation);
        }

        return html;
    }

    renderAbcdOptions(question, questionIndex) {
        let html = '<ul class="options-list abcd">';
        
        question.options.forEach((option, optionIndex) => {
            const letter = String.fromCharCode(65 + optionIndex);
            const isCorrect = String(question.correct).toUpperCase() === letter;
            const optionText = this.processContent(option.text || '');
            
            html += `
                <li class="option-item ${isCorrect ? 'correct' : ''}" 
                    data-option-index="${optionIndex}"
                    onclick="window.adminEditor.markAnswerCorrect(${questionIndex}, ${optionIndex})">
                    <span class="option-letter">${letter}.</span>
                    <span class="option-text">${optionText}</span>
                </li>
            `;
        });
        
        html += '</ul>';
        return html;
    }

    renderTrueFalseOptions(question, questionIndex) {
        let html = '<ul class="options-list truefalse">';
        
        if (Array.isArray(question.correct) && question.options.length === question.correct.length) {
            question.options.forEach((option, optionIndex) => {
                const letter = String.fromCharCode(97 + optionIndex);
                const isCorrect = question.correct[optionIndex] === true;
                const optionText = this.processContent(option.text || '');
                
                html += `
                    <li class="option-item ${isCorrect ? 'correct' : ''}" 
                        data-option-index="${optionIndex}"
                        onclick="window.adminEditor.markTrueFalseCorrect(${questionIndex}, ${optionIndex})">
                        <span class="option-letter">${letter})</span>
                        <span class="option-text">${optionText}</span>
                    </li>
                `;
            });
        } else {
            html += '<li class="option-item invalid">Error: Options and correct answers mismatch</li>';
        }
        
        html += '</ul>';
        return html;
    }

    renderNumberAnswer(question) {
        const answer = this.processContent(String(question.correct || ''));
        return `<div class="number-answer">Đáp án: <span class="answer-value">${answer}</span></div>`;
    }

    renderValidationInfo(validation) {
        let html = '<div class="validation-info">';
        
        if (validation.errors.length > 0) {
            html += '<div class="validation-errors">';
            validation.errors.forEach(error => {
                html += `<div class="validation-item error"><i class="fas fa-times-circle"></i> ${error}</div>`;
            });
            html += '</div>';
        }
        
        if (validation.warnings.length > 0) {
            html += '<div class="validation-warnings">';
            validation.warnings.forEach(warning => {
                html += `<div class="validation-item warning"><i class="fas fa-exclamation-triangle"></i> ${warning}</div>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    processContent(content) {
        if (!content) return '';
        
        // Process images
        content = content.replace(/\[img\s+src="([^"]*)"\]/gi, '<img src="$1" alt="Question Image" class="preview-image">');
        
        // Process line breaks
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    addQuestionEventHandlers(element, question, index) {
        // Click to focus editor on question
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.question-actions') && !e.target.closest('.option-item')) {
                this.eventEmitter.emit('question-clicked', { question, index });
            }
        });

        // Action buttons
        const actionButtons = element.querySelectorAll('.question-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                this.eventEmitter.emit('question-action', { action, question, index });
            });
        });
    }

    calculateValidationStats(questions) {
        const stats = { valid: 0, warnings: 0, errors: 0 };
        
        questions.forEach(question => {
            if (!question.validation.isValid) {
                stats.errors++;
            } else if (question.validation.warnings.length > 0) {
                stats.warnings++;
            } else {
                stats.valid++;
            }
        });
        
        return stats;
    }

    validateQuestions() {
        if (this.currentQuestions.length === 0) {
            window.adminEditor.notifications.show('info', 'Kiểm tra', 'Không có câu hỏi nào để kiểm tra');
            return;
        }

        const stats = this.calculateValidationStats(this.currentQuestions);
        
        if (stats.errors > 0) {
            window.adminEditor.notifications.show('error', 'Có lỗi', `Tìm thấy ${stats.errors} lỗi cần sửa`);
        } else if (stats.warnings > 0) {
            window.adminEditor.notifications.show('warning', 'Cảnh báo', `Có ${stats.warnings} cảnh báo`);
        } else {
            window.adminEditor.notifications.show('success', 'Hoàn hảo', 'Tất cả câu hỏi đều hợp lệ');
        }
    }

    renderMath() {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(this.container, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\(", right: "\\)", display: false },
                    { left: "\\[", right: "\\]", display: true }
                ],
                throwOnError: false
            });
        }
    }

    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
}

class ResizeManager {
    constructor(handleId, leftPanelSelector, rightPanelSelector) {
        this.handle = document.getElementById(handleId);
        this.leftPanel = document.querySelector(leftPanelSelector);
        this.rightPanel = document.querySelector(rightPanelSelector);
        this.container = this.handle?.parentElement;
        this.isResizing = false;
        this.startX = 0;
        this.startLeftWidth = 0;
        
        this.initialize();
    }

    initialize() {
        if (!this.handle || !this.leftPanel || !this.rightPanel) {
            console.warn('ResizeManager: Required elements not found');
            return;
        }

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.handle.addEventListener('mousedown', this.startResize.bind(this));
        document.addEventListener('mousemove', this.doResize.bind(this));
        document.addEventListener('mouseup', this.stopResize.bind(this));
        
        // Touch events for mobile
        this.handle.addEventListener('touchstart', this.startResize.bind(this));
        document.addEventListener('touchmove', this.doResize.bind(this));
        document.addEventListener('touchend', this.stopResize.bind(this));
    }

    startResize(e) {
        this.isResizing = true;
        this.startX = e.clientX || e.touches[0].clientX;
        this.startLeftWidth = this.leftPanel.offsetWidth;
        
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    }

    doResize(e) {
        if (!this.isResizing) return;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const deltaX = clientX - this.startX;
        const containerWidth = this.container.offsetWidth;
        const handleWidth = this.handle.offsetWidth;
        
        const newLeftWidth = this.startLeftWidth + deltaX;
        const minWidth = 300; // Minimum panel width
        const maxWidth = containerWidth - handleWidth - minWidth;
        
        if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
            const leftPercentage = (newLeftWidth / containerWidth) * 100;
            const rightPercentage = ((containerWidth - newLeftWidth - handleWidth) / containerWidth) * 100;
            
            this.container.style.gridTemplateColumns = `${leftPercentage}% ${handleWidth}px ${rightPercentage}%`;
        }
        
        e.preventDefault();
    }

    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
}

// === Main Application Class ===

class AdminEditorV2 {
    constructor() {
        this.editor = null;
        this.preview = null;
        this.resizer = null;
        this.parser = null;
        this.notifications = null;
        this.autoSave = null;
        
        this.currentQuestions = [];
        this.editingId = null;
        this.isInitialized = false;
        this.wordCount = 0;
        this.questionCount = 0;
    }

    async initialize() {
        try {
            this.showLoading(true);
            
            // Initialize core components
            this.notifications = new NotificationManager();
            this.parser = new QuizParser();
            
            // Initialize UI components
            this.initializeEditor();
            this.initializePreview();
            this.initializeResizer();
            this.initializeAutoSave();
            
            // Setup event handlers
            this.setupEventHandlers();
            this.setupKeyboardShortcuts();
            this.setupModalHandlers();
            
            // Load existing content if editing
            await this.loadExistingContent();
            
            this.isInitialized = true;
            this.showLoading(false);
            
            this.notifications.show('success', 'Khởi tạo thành công', 'Trình soạn thảo đã sẵn sàng');
            
        } catch (error) {
            console.error('Failed to initialize AdminEditorV2:', error);
            this.showLoading(false);
            this.notifications.show('error', 'Lỗi khởi tạo', 'Không thể khởi tạo trình soạn thảo');
        }
    }

    initializeEditor() {
        this.editor = new CodeMirrorManager('lesson-editor', {
            theme: 'material-white',
            lineNumbers: true,
            lineWrapping: true,
            autofocus: true
        });

        const initialContent = this.getInitialContent();
        this.editor.initialize(initialContent);

        // Setup editor event handlers
        this.editor.on('content-change', this.handleContentChange.bind(this));
        this.editor.on('cursor-change', this.handleCursorChange.bind(this));
        this.editor.on('save-requested', this.handleSaveRequested.bind(this));
    }

    initializePreview() {
        this.preview = new PreviewManager('preview-content');
        this.preview.initialize();

        // Setup preview event handlers
        this.preview.on('question-clicked', this.handleQuestionClicked.bind(this));
        this.preview.on('question-action', this.handleQuestionAction.bind(this));
    }

    initializeResizer() {
        this.resizer = new ResizeManager('resize-handle', '.editor-panel', '.preview-panel');
    }

    initializeAutoSave() {
        this.autoSave = new AutoSaveManager(this.saveContent.bind(this), 30000);
    }

    setupEventHandlers() {
        // Header actions
        document.getElementById('save-draft-btn')?.addEventListener('click', () => {
            this.saveContent();
        });

        document.getElementById('continue-btn')?.addEventListener('click', () => {
            this.proceedToConfiguration();
        });

        document.getElementById('preview-btn')?.addEventListener('click', () => {
            this.showFullscreenPreview();
        });

        // Toolbar actions
        document.getElementById('upload-file-btn')?.addEventListener('click', () => {
            this.showDocumentUploadModal();
        });

        document.getElementById('upload-image-btn')?.addEventListener('click', () => {
            this.showImageUploadModal();
        });

        document.getElementById('add-latex-btn')?.addEventListener('click', () => {
            this.showLatexModal();
        });

        document.getElementById('undo-btn')?.addEventListener('click', () => {
            this.editor.editor?.undo();
        });

        document.getElementById('redo-btn')?.addEventListener('click', () => {
            this.editor.editor?.redo();
        });

        document.getElementById('clear-btn')?.addEventListener('click', () => {
            this.clearContent();
        });

        document.getElementById('format-btn')?.addEventListener('click', () => {
            this.formatContent();
        });

        // Question type selector
        document.getElementById('question-type-select')?.addEventListener('change', (e) => {
            this.insertQuestionTemplate(e.target.value);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveContent();
            }
            
            // Ctrl/Cmd + Enter: Continue to configuration
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.proceedToConfiguration();
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async loadExistingContent() {
        const pathParts = window.location.pathname.split('/');
        console.log('🔍 URL pathname:', window.location.pathname);
        console.log('🔍 Path parts:', pathParts);
        console.log('🔍 Contains edit:', pathParts.includes('edit'));

        if (pathParts.includes('edit')) {
            const idIndex = pathParts.indexOf('edit') + 1;
            console.log('🔍 Edit index:', pathParts.indexOf('edit'), 'ID index:', idIndex);

            if (idIndex < pathParts.length) {
                this.editingId = pathParts[idIndex];
                console.log('🔍 Extracted lesson ID:', this.editingId);
                await this.loadLessonContent(this.editingId);
            } else {
                console.log('❌ No lesson ID found in URL');
            }
        } else {
            console.log('ℹ️ Not an edit URL, skipping content loading');
        }
    }

    async loadLessonContent(lessonId) {
        try {
            console.log('🔍 Loading lesson content for ID:', lessonId);
            const response = await fetch(`http://localhost:3003/api/lessons/${lessonId}`, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to load lesson content');
            }

            const responseData = await response.json();
            console.log('📦 Raw API response:', responseData);

            // Extract the actual lesson data from the API response
            const lessonData = responseData.lesson || responseData;
            console.log('📦 Actual lesson data:', lessonData);
            console.log('🔍 All lesson data keys:', Object.keys(lessonData));
            console.log('❓ Questions data:', lessonData.questions);
            console.log('🎯 Quiz data:', lessonData.quiz_data);
            console.log('📝 Content data:', lessonData.content);
            console.log('📊 Questions type:', typeof lessonData.questions);
            console.log('📏 Questions length:', Array.isArray(lessonData.questions) ? lessonData.questions.length : 'Not an array');

            // Check if questions are in quiz_data
            if (lessonData.quiz_data && lessonData.quiz_data.questions) {
                console.log('✅ Found questions in quiz_data.questions:', lessonData.quiz_data.questions);
            }

            // Try to find questions in different possible locations
            let questionsData = lessonData.questions || [];

            // Check if questions are in quiz_data.questions
            if ((!questionsData || questionsData.length === 0) && lessonData.quiz_data && lessonData.quiz_data.questions) {
                console.log('🔄 Using questions from quiz_data.questions');
                questionsData = lessonData.quiz_data.questions;
            }

            // Check if questions are in content field
            if ((!questionsData || questionsData.length === 0) && lessonData.content) {
                console.log('🔄 Checking content field for questions');
                if (Array.isArray(lessonData.content)) {
                    questionsData = lessonData.content;
                } else if (lessonData.content.questions) {
                    questionsData = lessonData.content.questions;
                }
            }

            console.log('🎯 Final questions data to use:', questionsData);

            const textContent = this.generateTextFromQuestions(questionsData);
            console.log('📝 Generated text content:', textContent);
            console.log('📏 Text content length:', textContent.length);

            this.editor.setValue(textContent);
            this.updateLessonTitle(lessonData.title || 'Chỉnh sửa bài học');

            this.notifications.show('success', 'Tải thành công', 'Đã tải nội dung bài học');

        } catch (error) {
            console.error('❌ Error loading lesson content:', error);
            this.notifications.show('error', 'Lỗi tải', 'Không thể tải nội dung bài học');
        }
    }

    // Helper function to clean existing point markings from question text
    cleanQuestionText(questionText) {
        if (!questionText) return '';
        // Remove existing point markings like [0.6 pts], [1 pts], etc.
        // Use a more precise regex that preserves spacing
        return questionText.replace(/\s*\[\s*[\d.]+\s*pts?\s*\]/gi, '').replace(/\s+/g, ' ').trim();
    }

    generateTextFromQuestions(questions) {
        console.log('🔧 generateTextFromQuestions called with:', questions);
        console.log('🔧 Questions is array:', Array.isArray(questions));
        console.log('🔧 Questions length:', Array.isArray(questions) ? questions.length : 'N/A');

        let text = '';
        if (!Array.isArray(questions)) {
            console.log('❌ Questions is not an array, returning empty string');
            return '';
        }

        if (questions.length === 0) {
            console.log('⚠️ Questions array is empty');
            return '';
        }

        questions.forEach((q, index) => {
            console.log(`🔧 Processing question ${index + 1}:`, q);
            console.log(`🔧 Question type: ${q.type}, Question text: "${q.question}"`);

            // Clean existing point markings from question text before adding new ones
            const cleanedQuestionText = this.cleanQuestionText(q.question || '');
            text += `Câu ${index + 1}: ${cleanedQuestionText}\n`;

            if (q.points && q.points !== 1) {
                text += `[${q.points} pts]\n`;
            }

            if (q.type === 'abcd') {
                console.log(`🔧 Processing ABCD question - options:`, q.options, 'correct:', q.correct);
                (q.options || []).forEach((opt, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    const optText = typeof opt === 'string' ? opt : (opt.text || '');
                    const isCorrect = String(q.correct || '').toLowerCase() === letter.toLowerCase();
                    const prefix = isCorrect ? '*' : '';
                    text += `${prefix}${letter}. ${optText}\n`;
                });
            } else if (q.type === 'number') {
                console.log(`🔧 Processing number question - correct:`, q.correct);
                text += `Answer: ${q.correct || ''}\n`;
            } else if (q.type === 'truefalse') {
                console.log(`🔧 Processing true/false - options:`, q.options, 'correct:', q.correct);
                if (Array.isArray(q.correct)) {
                    (q.options || []).forEach((opt, optIndex) => {
                        const letter = String.fromCharCode(97 + optIndex);
                        const optText = typeof opt === 'string' ? opt : (opt.text || '');
                        const isCorrect = q.correct[optIndex] === true;
                        const prefix = isCorrect ? '*' : '';
                        text += `${prefix}${letter}) ${optText}\n`;
                    });
                }
            }
            text += '\n';
        });

        const finalText = text.trim();
        console.log('🔧 Final generated text:', finalText);
        console.log('🔧 Final text length:', finalText.length);
        return finalText;
    }

    getInitialContent() {
        return `Câu 1: Trong cuộc khai thác thuộc địa lần thứ hai ở Đông Dương 1919-1929, thực dân Pháp tập trung đầu tư vào
*A. Ngành chế tạo máy.
B. Công nghiệp luyện kim.
C. Đồn điền cao su.
D. Công nghiệp hóa chất.

Câu 2: Nội dung nào sau đây phản ánh đúng tình hình Việt Nam sau Hiệp định Gionevo năm 1954 về Đông Dương?
A. Đất nước tạm thời bị chia cắt làm hai miền Nam, Bắc.
*B. Miền Bắc chưa được giải phóng.
C. Miền Nam đã được giải phóng.
D. Cả nước được giải phóng và tiến lên xây dựng chủ nghĩa xã hội.`;
    }

    handleContentChange(data) {
        const { content } = data;
        
        // Parse questions
        this.currentQuestions = this.parser.parse(content);
        
        // Update preview
        this.preview.updatePreview(this.currentQuestions);
        
        // Update syntax highlighting
        this.editor.applySyntaxHighlighting();
        
        // Update counters
        this.updateCounters(content, this.currentQuestions);
        
        // Schedule auto-save
        this.autoSave.schedule(content);
        
        // Update save status
        this.updateSaveStatus('saving');
    }

    handleCursorChange(data) {
        // Update cursor position display is handled by CodeMirrorManager
    }

    handleSaveRequested() {
        this.saveContent();
    }

    handleQuestionClicked(data) {
        const { index } = data;
        this.editor.scrollToQuestion(index, this.currentQuestions);
    }

    handleQuestionAction(data) {
        const { action, question, index } = data;
        
        switch (action) {
            case 'edit':
                this.editor.scrollToQuestion(index, this.currentQuestions);
                break;
            case 'copy':
                this.copyQuestion(question);
                break;
            case 'delete':
                this.deleteQuestion(index);
                break;
        }
    }

    markAnswerCorrect(questionIndex, optionIndex) {
        this.editor.markCorrectAnswer(questionIndex, optionIndex, this.currentQuestions);
    }

    markTrueFalseCorrect(questionIndex, optionIndex) {
        // Similar to markAnswerCorrect but for true/false questions
        if (!this.currentQuestions || questionIndex >= this.currentQuestions.length) return;

        const question = this.currentQuestions[questionIndex];
        if (question.type !== 'truefalse' || optionIndex >= question.options.length) return;

        const targetOptionLine = question.options[optionIndex].line;
        if (targetOptionLine === -1) return;

        this.editor.editor.operation(() => {
            const currentLine = this.editor.editor.getLine(targetOptionLine);
            if (!currentLine) return;

            const trimmedLine = currentLine.trim();
            const insertPos = currentLine.search(/\S|$/);

            if (trimmedLine.startsWith('*')) {
                const starPos = currentLine.indexOf('*');
                this.editor.editor.replaceRange('', 
                    { line: targetOptionLine, ch: starPos }, 
                    { line: targetOptionLine, ch: starPos + 1 }
                );
            } else {
                this.editor.editor.replaceRange('*', { line: targetOptionLine, ch: insertPos });
            }
        });

        // Trigger content change
        this.handleContentChange({ content: this.editor.getValue() });
    }

    updateCounters(content, questions) {
        // Update word count
        this.wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
        const wordCountElement = document.getElementById('word-counter');
        if (wordCountElement) {
            wordCountElement.textContent = `${this.wordCount} từ`;
        }

        // Update question count
        this.questionCount = questions.length;
        const questionCountElement = document.getElementById('question-counter');
        if (questionCountElement) {
            questionCountElement.textContent = `${this.questionCount} câu hỏi`;
        }
    }

    updateSaveStatus(status) {
        const saveStatusElement = document.getElementById('save-status');
        if (!saveStatusElement) return;

        const statusIcon = saveStatusElement.querySelector('i');
        const statusText = saveStatusElement.querySelector('span');

        saveStatusElement.className = `status-indicator ${status}`;

        switch (status) {
            case 'saved':
                statusText.textContent = 'Đã lưu';
                break;
            case 'saving':
                statusText.textContent = 'Đang lưu...';
                break;
            case 'error':
                statusText.textContent = 'Lỗi lưu';
                break;
            default:
                statusText.textContent = 'Chưa lưu';
        }
    }

    updateLessonTitle(title) {
        const titleElement = document.getElementById('lesson-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        document.title = `${title} - Giao diện nâng cao`;
    }

    async saveContent() {
        try {
            this.updateSaveStatus('saving');
            
            const content = this.editor.getValue();
            const questions = this.parser.parse(content);
            
            const saveData = {
                questions: questions,
                editingId: this.editingId,
                rawText: content
            };
            
            // Save to sessionStorage for configuration stage
            sessionStorage.setItem('lessonStage1Data', JSON.stringify(saveData));
            
            // Also save backup to localStorage
            localStorage.setItem('lessonStage1Data_backup', JSON.stringify(saveData));
            
            this.updateSaveStatus('saved');
            this.notifications.show('success', 'Đã lưu', 'Nội dung đã được lưu thành công');
            
        } catch (error) {
            console.error('Save error:', error);
            this.updateSaveStatus('error');
            this.notifications.show('error', 'Lỗi lưu', 'Không thể lưu nội dung');
        }
    }

    async proceedToConfiguration() {
        try {
            // Validate questions first
            if (this.currentQuestions.length === 0) {
                const confirm = await this.showConfirmDialog(
                    'Không có câu hỏi',
                    'Bạn chưa tạo câu hỏi nào. Bạn có muốn tiếp tục?'
                );
                if (!confirm) return;
            }

            // Check for invalid questions
            const invalidQuestions = this.currentQuestions.filter(q => !q.validation.isValid);
            if (invalidQuestions.length > 0) {
                const confirm = await this.showConfirmDialog(
                    'Có lỗi cần sửa',
                    `Có ${invalidQuestions.length} câu hỏi chưa hợp lệ. Bạn có muốn tiếp tục?`
                );
                if (!confirm) return;
            }

            // Save current content
            await this.saveContent();
            
            // Navigate to configuration
            const configureUrl = this.editingId ? `/admin/configure/${this.editingId}` : '/admin/configure';
            
            setTimeout(() => {
                window.location.href = configureUrl;
            }, 100);
            
        } catch (error) {
            console.error('Error proceeding to configuration:', error);
            this.notifications.show('error', 'Lỗi', 'Không thể chuyển đến trang cấu hình');
        }
    }

    insertQuestionTemplate(type) {
        let template = '';
        const questionNumber = this.currentQuestions.length + 1;
        
        switch (type) {
            case 'abcd':
                template = `\n\nCâu ${questionNumber}: [Nội dung câu hỏi]\n*A. [Đáp án đúng]\nB. [Đáp án sai]\nC. [Đáp án sai]\nD. [Đáp án sai]`;
                break;
            case 'truefalse':
                template = `\n\nCâu ${questionNumber}: [Nội dung câu hỏi]\n*a) [Phát biểu đúng]\nb) [Phát biểu sai]`;
                break;
            case 'number':
                template = `\n\nCâu ${questionNumber}: [Nội dung câu hỏi]\nAnswer: [Đáp án số]`;
                break;
        }
        
        this.editor.insertText(template);
        
        // Reset selector
        const selector = document.getElementById('question-type-select');
        if (selector) {
            selector.selectedIndex = 0;
        }
    }

    formatContent() {
        const content = this.editor.getValue();
        const questions = this.parser.parse(content);
        const formattedContent = this.generateTextFromQuestions(questions);
        
        this.editor.setValue(formattedContent);
        this.notifications.show('success', 'Định dạng', 'Đã định dạng lại nội dung');
    }

    clearContent() {
        if (this.editor.getValue().trim() === '') {
            this.notifications.show('info', 'Thông tin', 'Nội dung đã trống');
            return;
        }

        this.showConfirmDialog(
            'Xóa tất cả',
            'Bạn có chắc chắn muốn xóa toàn bộ nội dung?'
        ).then(confirmed => {
            if (confirmed) {
                this.editor.setValue('');
                this.notifications.show('success', 'Đã xóa', 'Đã xóa toàn bộ nội dung');
            }
        });
    }

    copyQuestion(question) {
        const questionText = this.generateTextFromQuestions([question]);
        navigator.clipboard.writeText(questionText).then(() => {
            this.notifications.show('success', 'Đã sao chép', 'Câu hỏi đã được sao chép');
        }).catch(() => {
            this.notifications.show('error', 'Lỗi', 'Không thể sao chép câu hỏi');
        });
    }

    deleteQuestion(questionIndex) {
        this.showConfirmDialog(
            'Xóa câu hỏi',
            'Bạn có chắc chắn muốn xóa câu hỏi này?'
        ).then(confirmed => {
            if (confirmed) {
                // Implementation would remove the question from editor content
                this.notifications.show('success', 'Đã xóa', 'Câu hỏi đã được xóa');
            }
        });
    }

    showDocumentUploadModal() {
        const modal = document.getElementById('document-upload-modal');
        if (modal) {
            modal.classList.add('active');
            this.initializeDocumentUpload();
        }
    }

    initializeDocumentUpload() {
        // Initialize upload options
        const manualOption = document.getElementById('manual-option');
        const fileOption = document.getElementById('file-option');
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        if (manualOption) {
            manualOption.onclick = () => {
                this.closeAllModals();
                this.editor.focus();
                this.notifications.show('info', 'Tạo thủ công', 'Bắt đầu nhập nội dung bài học');
            };
        }

        if (fileOption) {
            fileOption.onclick = () => {
                uploadArea.style.display = 'block';
                manualOption.style.display = 'none';
                fileOption.style.display = 'none';
            };
        }

        // Setup drag and drop
        if (uploadArea) {
            this.setupDragAndDrop(uploadArea, fileInput);
        }

        // Setup file input
        if (fileInput) {
            fileInput.onchange = (e) => {
                const files = Array.from(e.target.files);
                this.handleFileUpload(files);
            };
        }
    }

    setupDragAndDrop(dropzone, fileInput) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFileUpload(files);
        }, false);

        dropzone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileUpload(files) {
        if (files.length === 0) return;

        // Validate files
        const validFiles = files.filter(file => {
            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!validTypes.includes(file.type)) {
                this.notifications.show('error', 'File không hỗ trợ', `File ${file.name} không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, TXT.`);
                return false;
            }

            if (file.size > maxSize) {
                this.notifications.show('error', 'File quá lớn', `File ${file.name} vượt quá giới hạn 10MB.`);
                return false;
            }

            return true;
        });

        if (validFiles.length === 0) return;

        // Process files
        for (const file of validFiles) {
            await this.processDocumentFile(file);
        }
    }

    async processDocumentFile(file) {
        const formData = new FormData();
        formData.append('document', file);

        try {
            this.notifications.show('info', 'Đang xử lý', `Đang xử lý file ${file.name}...`);

            // Show processing overlay in modal
            this.showProcessingOverlay(file.name);

            // Get CSRF token before making the request
            const csrfToken = await getCSRFToken();

            const response = await fetch('http://localhost:3003/api/admin/upload-document', {
                method: 'POST',
                headers: {
                    'x-csrf-token': csrfToken
                },
                body: formData,
                credentials: 'include' // Include session cookies
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Insert processed content into editor
                const content = result.formattedContent || result.content || result.data?.content || '';
                if (content) {
                    this.editor.setValue(content);
                    this.closeAllModals();
                    this.notifications.show('success', 'Thành công', `Đã xử lý file ${file.name} thành công`);
                } else {
                    this.notifications.show('warning', 'Cảnh báo', 'File được xử lý nhưng không có nội dung');
                }
            } else {
                throw new Error(result.message || 'Lỗi xử lý file');
            }

        } catch (error) {
            console.error('Document upload error:', error);
            this.notifications.show('error', 'Lỗi xử lý', `Không thể xử lý file ${file.name}: ${error.message}`);
        } finally {
            this.hideProcessingOverlay();
        }
    }

    showProcessingOverlay(fileName) {
        const modal = document.getElementById('document-upload-modal');
        const modalBody = modal?.querySelector('.modal-body');

        if (modalBody) {
            // Add processing-active class to ensure visibility
            modalBody.classList.add('processing-active');

            modalBody.innerHTML = `
                <div class="processing-overlay">
                    <div class="processing-content">
                        <div class="processing-spinner">
                            <div class="spinner"></div>
                        </div>
                        <h3>Đang xử lý tài liệu</h3>
                        <p>File: ${fileName}</p>
                        <div class="processing-steps">
                            <div class="step active">
                                <i class="fas fa-upload"></i>
                                <span>Tải lên</span>
                            </div>
                            <div class="step">
                                <i class="fas fa-cog fa-spin"></i>
                                <span>Xử lý AI</span>
                            </div>
                            <div class="step">
                                <i class="fas fa-check"></i>
                                <span>Hoàn thành</span>
                            </div>
                        </div>
                        <p class="processing-note">Vui lòng đợi, quá trình này có thể mất vài giây...</p>
                    </div>
                </div>
            `;
        }
    }

    hideProcessingOverlay() {
        // Remove processing-active class and close modal
        const modal = document.getElementById('document-upload-modal');
        const modalBody = modal?.querySelector('.modal-body');

        if (modalBody) {
            modalBody.classList.remove('processing-active');
        }

        // The modal will be closed by closeAllModals(), so no need to restore content
    }

    showImageUploadModal() {
        const modal = document.getElementById('image-upload-modal');
        if (modal) {
            modal.classList.add('active');
            this.initializeImageUpload();
        }
    }

    initializeImageUpload() {
        // Setup tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.onclick = () => {
                const tab = btn.getAttribute('data-tab');
                
                // Update button states
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update content visibility
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tab}-tab`) {
                        content.classList.add('active');
                    }
                });
            };
        });

        // Setup image upload
        const imageInput = document.getElementById('image-input');
        const imageDropzone = document.querySelector('.image-dropzone');
        
        if (imageDropzone && imageInput) {
            this.setupImageDragAndDrop(imageDropzone, imageInput);
        }

        // Setup URL upload
        const addUrlBtn = document.getElementById('add-url-image');
        const imageUrlInput = document.getElementById('image-url');
        
        if (addUrlBtn && imageUrlInput) {
            addUrlBtn.onclick = () => {
                const url = imageUrlInput.value.trim();
                if (url) {
                    this.insertImageFromUrl(url);
                } else {
                    this.notifications.show('warning', 'URL trống', 'Vui lòng nhập URL hình ảnh');
                }
            };
        }

        // Load gallery if needed
        this.loadImageGallery();
    }

    setupImageDragAndDrop(dropzone, fileInput) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleImageUpload(files);
        }, false);

        dropzone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.handleImageUpload(files);
        };
    }

    async handleImageUpload(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.notifications.show('warning', 'File không hợp lệ', 'Vui lòng chọn file hình ảnh');
            return;
        }

        for (const file of imageFiles) {
            await this.uploadImage(file);
        }
    }

    async uploadImage(file, url = null) {
        const formData = new FormData();
        
        if (file) {
            formData.append('imageFile', file);
        } else if (url) {
            formData.append('imageUrl', url);
        } else {
            return;
        }

        try {
            // Check if getCSRFToken function is available
            if (typeof getCSRFToken !== 'function') {
                console.error('getCSRFToken function not available! CSRF utils may not be loaded.');
                this.notifications?.show('error', 'Error', 'CSRF utilities not loaded. Please refresh the page.');
                return;
            }

            // Get CSRF token before making the request
            console.log('Getting CSRF token for image upload...');
            const csrfToken = await getCSRFToken();
            console.log('CSRF token obtained:', csrfToken ? 'Yes' : 'No', csrfToken?.substring(0, 8) + '...');

            const response = await fetch('http://localhost:3003/api/admin/upload-image', {
                method: 'POST',
                headers: {
                    'x-csrf-token': csrfToken
                },
                body: formData,
                credentials: 'include' // Include session cookies
            });

            const result = await response.json();

            if (response.ok && result.success && result.imageUrl) {
                const imageTag = `[img src="${result.imageUrl}"]`;
                this.editor.insertText(imageTag);
                this.closeAllModals();
                this.notifications.show('success', 'Thành công', 'Hình ảnh đã được thêm');
            } else {
                throw new Error(result.error || 'Lỗi tải hình ảnh');
            }
        } catch (error) {
            console.error('Image upload error:', error);
            this.notifications.show('error', 'Lỗi', `Không thể tải hình ảnh: ${error.message}`);
        }
    }

    insertImageFromUrl(url) {
        this.uploadImage(null, url);
    }

    async loadImageGallery() {
        try {
            const response = await fetch('http://localhost:3003/api/gallery/');
            const result = await response.json();
            
            const galleryContainer = document.querySelector('.image-gallery');
            if (galleryContainer && result.success && result.images) {
                galleryContainer.innerHTML = result.images.map(image => `
                    <div class="gallery-item" onclick="window.adminEditor.insertImageFromGallery('${image.url}')">
                        <img src="${image.url}" alt="${image.name}" loading="lazy">
                        <div class="gallery-item-name">${image.name}</div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
        }
    }

    insertImageFromGallery(url) {
        const imageTag = `[img src="${url}"]`;
        this.editor.insertText(imageTag);
        this.closeAllModals();
        this.notifications.show('success', 'Thành công', 'Hình ảnh đã được thêm từ thư viện');
    }

    showLatexModal() {
        const modal = document.getElementById('latex-modal');
        if (modal) {
            modal.classList.add('active');
            this.initializeLatexEditor();
        }
    }

    initializeLatexEditor() {
        const latexInput = document.getElementById('latex-input');
        const latexPreview = document.getElementById('latex-preview-content');
        const insertBtn = document.getElementById('insert-latex');
        const cancelBtn = document.getElementById('cancel-latex');
        const shortcutBtns = document.querySelectorAll('.shortcut-btn');

        // Clear previous content
        if (latexInput) latexInput.value = '';
        if (latexPreview) latexPreview.innerHTML = '';

        // Setup input handler for live preview
        if (latexInput && latexPreview) {
            latexInput.oninput = () => {
                this.updateLatexPreview(latexInput.value, latexPreview);
            };
        }

        // Setup shortcut buttons
        shortcutBtns.forEach(btn => {
            btn.onclick = () => {
                const latex = btn.getAttribute('data-latex');
                if (latexInput && latex) {
                    const start = latexInput.selectionStart;
                    const end = latexInput.selectionEnd;
                    const text = latexInput.value;
                    
                    latexInput.value = text.substring(0, start) + latex + text.substring(end);
                    latexInput.selectionStart = latexInput.selectionEnd = start + latex.length;
                    latexInput.focus();
                    
                    this.updateLatexPreview(latexInput.value, latexPreview);
                }
            };
        });

        // Setup buttons
        if (insertBtn && latexInput) {
            insertBtn.onclick = () => {
                const latex = latexInput.value.trim();
                if (latex) {
                    this.insertLatex(latex);
                } else {
                    this.notifications.show('warning', 'LaTeX trống', 'Vui lòng nhập công thức LaTeX');
                }
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.closeAllModals();
            };
        }
    }

    updateLatexPreview(latex, previewElement) {
        if (!latex.trim()) {
            previewElement.innerHTML = '<em>Nhập công thức để xem trước</em>';
            return;
        }

        try {
            // Wrap in display math for preview
            const wrappedLatex = `$$${latex}$$`;
            previewElement.innerHTML = wrappedLatex;
            
            // Render with KaTeX if available
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(previewElement, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false }
                    ],
                    throwOnError: false
                });
            }
        } catch (error) {
            previewElement.innerHTML = '<em style="color: red;">Lỗi cú pháp LaTeX</em>';
        }
    }

    insertLatex(latex) {
        // Determine if it should be inline or block
        const isBlock = latex.includes('\\sum') || latex.includes('\\int') || latex.includes('\\frac') || latex.length > 20;
        const delimiters = isBlock ? '$$' : '$';
        const latexTag = `${delimiters}${latex}${delimiters}`;
        
        this.editor.insertText(latexTag);
        this.closeAllModals();
        this.notifications.show('success', 'Thành công', 'Công thức LaTeX đã được thêm');
    }

    showFullscreenPreview() {
        const modal = document.getElementById('fullscreen-preview-modal');
        const content = document.getElementById('fullscreen-preview-content');
        
        if (modal && content) {
            content.innerHTML = document.getElementById('preview-content').innerHTML;
            modal.classList.add('active');
            
            // Re-render math in fullscreen
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(content, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false }
                    ],
                    throwOnError: false
                });
            }
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    setupModalHandlers() {
        // Setup close button handlers for all modals
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.onclick = () => {
                this.closeAllModals();
            };
        });

        // Setup click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            };
        });

        // Prevent modal content clicks from closing modal
        document.querySelectorAll('.modal-content').forEach(content => {
            content.onclick = (e) => {
                e.stopPropagation();
            };
        });
    }

    showConfirmDialog(title, message) {
        return new Promise(resolve => {
            // Simple confirm for now - could be enhanced with custom modal
            resolve(confirm(`${title}\n\n${message}`));
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    destroy() {
        if (this.editor) {
            this.editor.destroy();
        }
        if (this.autoSave) {
            this.autoSave.disable();
        }
    }
}

// === Initialize Application ===

// Global instance
window.adminEditor = null;

// Make AdminEditorV2 globally available for manual initialization
window.AdminEditorV2 = AdminEditorV2;

// Auto-initialization is disabled to prevent conflicts with manual initialization
// Use: window.adminEditor = new window.AdminEditorV2(); window.adminEditor.initialize();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminEditor) {
        window.adminEditor.destroy();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AdminEditorV2,
        CodeMirrorManager,
        PreviewManager,
        QuizParser,
        NotificationManager,
        AutoSaveManager,
        ResizeManager
    };
}

} // End of duplicate loading prevention