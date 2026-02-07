/**
 * Input validation function
 * Shows visual feedback and error messages
 */
export function validateInputs() {
    const inputs = [
        { id: 'temperature', min: 15, max: 30, name: 'Temperatur', unit: '°C' },
        { id: 'starter', min: 10, max: 2000, name: 'Surdegsstart', unit: 'g' },
        { id: 'flour', min: 100, max: 10000, name: 'Mjöl', unit: 'g' },
        { id: 'water', min: 50, max: 10000, name: 'Vatten', unit: 'g' },
        { id: 'salt', min: 0, max: 500, name: 'Salt', unit: 'g' }
    ];

    let isValid = true;
    for (const input of inputs) {
        const element = document.getElementById(input.id);
        if (!element) continue;

        const value = parseFloat(element.value);
        const errorId = `${input.id}-error`;
        let errorElement = document.getElementById(errorId);

        if (isNaN(value) || value < input.min || value > input.max) {
            // Add invalid styling
            element.classList.add('invalid');
            element.setAttribute('aria-invalid', 'true');
            element.setAttribute('aria-describedby', errorId);

            // Create or update error message
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.id = errorId;
                errorElement.className = 'error-message';
                errorElement.setAttribute('role', 'alert');
                element.parentElement.appendChild(errorElement);
            }

            // Set error message
            if (isNaN(value)) {
                errorElement.textContent = `${input.name} måste vara ett tal`;
            } else if (value < input.min) {
                errorElement.textContent = `Minst ${input.min}${input.unit}`;
            } else {
                errorElement.textContent = `Max ${input.max}${input.unit}`;
            }

            isValid = false;
        } else {
            // Remove invalid styling
            element.classList.remove('invalid');
            element.removeAttribute('aria-invalid');
            element.removeAttribute('aria-describedby');

            // Remove error message
            if (errorElement) {
                errorElement.remove();
            }
        }
    }
    return isValid;
}
