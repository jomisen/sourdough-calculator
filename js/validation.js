/**
 * Input validation function
 * Shows visual feedback but doesn't block calculation
 */
export function validateInputs() {
    const inputs = [
        { id: 'temperature', min: 15, max: 30, name: 'Temperatur' },
        { id: 'starter', min: 10, max: 2000, name: 'Surdegsstart' }, // Vikt i gram, inte procent
        { id: 'flour', min: 100, max: 10000, name: 'Mjöl' },
        { id: 'water', min: 50, max: 10000, name: 'Vatten' },
        { id: 'salt', min: 0, max: 500, name: 'Salt' }
    ];

    let isValid = true;
    for (const input of inputs) {
        const element = document.getElementById(input.id);
        if (!element) continue;

        const value = parseFloat(element.value);
        if (isNaN(value) || value < input.min || value > input.max) {
            element.classList.add('invalid');
            element.setAttribute('aria-invalid', 'true');
            element.setAttribute('aria-describedby', `${input.id}-error`);
            isValid = false;
        } else {
            element.classList.remove('invalid');
            element.removeAttribute('aria-invalid');
            element.removeAttribute('aria-describedby');
        }
    }
    return isValid;
}
