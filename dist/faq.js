export class Accordion {
    constructor(containerSelector) {
        this.items = [];
        this.container = document.querySelector(containerSelector);
        this.init();
    }
    init() {
        if (!this.container) {
            console.warn('Accordion container not found:', this.container);
            return;
        }
        const items = this.container.querySelectorAll('.faq-item');
        items.forEach((item, index) => {
            const button = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            if (!button || !answer)
                return;
            const buttonId = `faq-button-${index}`;
            const answerId = `faq-answer-${index}`;
            button.id = buttonId;
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-controls', answerId);
            answer.id = answerId;
            answer.setAttribute('role', 'region');
            answer.setAttribute('aria-labelledby', buttonId);
            button.addEventListener('click', () => this.toggle(item));
            this.items.push({ item, button, answer });
        });
        this.addKeyboardNavigation();
    }
    toggle(targetItem) {
        const targetData = this.items.find(i => i.item === targetItem);
        if (!targetData)
            return;
        const { button, answer } = targetData;
        const isOpen = answer.classList.contains('show');
        this.items.forEach(({ item, button: btn, answer: ans }) => {
            if (item !== targetItem) {
                ans.classList.remove('show');
                btn.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
        if (isOpen) {
            answer.classList.remove('show');
            button.classList.remove('active');
            button.setAttribute('aria-expanded', 'false');
        }
        else {
            answer.classList.add('show');
            button.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
            setTimeout(() => {
                targetItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 100);
        }
    }
    addKeyboardNavigation() {
        if (!this.container)
            return;
        this.container.addEventListener('keydown', (e) => {
            const event = e;
            const target = event.target;
            if (!target.classList.contains('faq-question'))
                return;
            const currentIndex = this.items.findIndex(i => i.button === target);
            if (currentIndex === -1)
                return;
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    this.focusItem((currentIndex + 1) % this.items.length);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.focusItem((currentIndex - 1 + this.items.length) % this.items.length);
                    break;
                case 'Home':
                    event.preventDefault();
                    this.focusItem(0);
                    break;
                case 'End':
                    event.preventDefault();
                    this.focusItem(this.items.length - 1);
                    break;
            }
        });
    }
    focusItem(index) {
        if (this.items[index]) {
            this.items[index].button.focus();
        }
    }
    openAll() {
        this.items.forEach(({ answer, button }) => {
            answer.classList.add('show');
            button.classList.add('active');
            button.setAttribute('aria-expanded', 'true');
        });
    }
    closeAll() {
        this.items.forEach(({ answer, button }) => {
            answer.classList.remove('show');
            button.classList.remove('active');
            button.setAttribute('aria-expanded', 'false');
        });
    }
}
export function initFAQ() {
    const accordion = new Accordion('#faq-container');
    if (typeof window !== 'undefined') {
        window.faqAccordion = accordion;
    }
    return accordion;
}
//# sourceMappingURL=faq.js.map