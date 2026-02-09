/**
 * FAQ Accordion Component
 * Provides accessible, keyboard-navigable FAQ accordion
 */

export class Accordion {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.items = [];
        this.init();
    }

    init() {
        if (!this.container) {
            console.warn('Accordion container not found:', this.container);
            return;
        }

        // Find all accordion items
        const items = this.container.querySelectorAll('.faq-item');

        items.forEach((item, index) => {
            const button = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');

            if (!button || !answer) return;

            // Set up ARIA attributes for accessibility
            const buttonId = `faq-button-${index}`;
            const answerId = `faq-answer-${index}`;

            button.id = buttonId;
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-controls', answerId);

            answer.id = answerId;
            answer.setAttribute('role', 'region');
            answer.setAttribute('aria-labelledby', buttonId);

            // Add click handler
            button.addEventListener('click', () => this.toggle(item));

            // Store reference
            this.items.push({ item, button, answer });
        });

        // Add keyboard navigation
        this.addKeyboardNavigation();
    }

    /**
     * Toggle accordion item open/closed
     */
    toggle(targetItem) {
        const targetData = this.items.find(i => i.item === targetItem);
        if (!targetData) return;

        const { button, answer } = targetData;
        const isOpen = answer.classList.contains('show');

        // Close all others (single-open accordion)
        // Remove this loop for multi-open behavior
        this.items.forEach(({ item, button: btn, answer: ans }) => {
            if (item !== targetItem) {
                ans.classList.remove('show');
                btn.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
            }
        });

        // Toggle current item
        if (isOpen) {
            answer.classList.remove('show');
            button.classList.remove('active');
            button.setAttribute('aria-expanded', 'false');
        } else {
            answer.classList.add('show');
            button.classList.add('active');
            button.setAttribute('aria-expanded', 'true');

            // Smooth scroll into view after animation
            setTimeout(() => {
                targetItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 100);
        }
    }

    /**
     * Add keyboard navigation support (Arrow keys, Home, End)
     */
    addKeyboardNavigation() {
        this.container.addEventListener('keydown', (e) => {
            const target = e.target;
            if (!target.classList.contains('faq-question')) return;

            const currentIndex = this.items.findIndex(i => i.button === target);
            if (currentIndex === -1) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.focusItem((currentIndex + 1) % this.items.length);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    this.focusItem((currentIndex - 1 + this.items.length) % this.items.length);
                    break;

                case 'Home':
                    e.preventDefault();
                    this.focusItem(0);
                    break;

                case 'End':
                    e.preventDefault();
                    this.focusItem(this.items.length - 1);
                    break;
            }
        });
    }

    /**
     * Focus specific accordion item
     */
    focusItem(index) {
        if (this.items[index]) {
            this.items[index].button.focus();
        }
    }

    /**
     * Open all accordion items
     */
    openAll() {
        this.items.forEach(({ answer, button }) => {
            answer.classList.add('show');
            button.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
        });
    }

    /**
     * Close all accordion items
     */
    closeAll() {
        this.items.forEach(({ answer, button }) => {
            answer.classList.remove('show');
            button.classList.remove('active');
            button.setAttribute('aria-expanded', 'false');
        });
    }
}

/**
 * Initialize FAQ accordion on DOM ready
 */
export function initFAQ() {
    const accordion = new Accordion('#faq-container');

    // Export for debugging/testing in browser console
    if (typeof window !== 'undefined') {
        window.faqAccordion = accordion;
    }

    return accordion;
}
