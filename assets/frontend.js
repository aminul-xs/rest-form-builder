// Frontend form submission handler using REST API
async function submitRestForm(button) {
    const formWrapper = button.closest('.rest-form-wrapper');
    const formElement = formWrapper.querySelector('.rest-form');
    const formId = formWrapper.getAttribute('data-form-id');
    const messageDiv = formWrapper.querySelector('.form-message');
    const submitBtn = button;
    
    // Collect form data
    const formData = {};
    const inputs = formElement.querySelectorAll('input, textarea, select');
    
    let isValid = true;
    
    inputs.forEach(input => {
        const name = input.getAttribute('name');
        if (!name) return;
        
        // Check required fields
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
        
        // Handle different input types
        if (input.type === 'checkbox') {
            if (!formData[name]) {
                formData[name] = [];
            }
            if (input.checked) {
                formData[name].push(input.value);
            }
        } else if (input.type === 'radio') {
            if (input.checked) {
                formData[name] = input.value;
            }
        } else {
            formData[name] = input.value;
        }
    });
    
    if (!isValid) {
        showMessage(messageDiv, 'error', 'Please fill in all required fields');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    messageDiv.style.display = 'none';
    
    try {
        const response = await fetch(formBuilderFrontend.apiUrl + '/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': formBuilderFrontend.nonce
            },
            body: JSON.stringify({
                form_id: parseInt(formId),
                data: formData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(messageDiv, 'success', result.data.message || 'Form submitted successfully!');
            
            // Reset form
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        } else {
            showMessage(messageDiv, 'error', result.message || 'An error occurred. Please try again.');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showMessage(messageDiv, 'error', 'An error occurred. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
}

function showMessage(messageDiv, type, text) {
    messageDiv.className = 'form-message ' + type;
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Add error styling for required fields
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .rest-form input.error,
        .rest-form textarea.error,
        .rest-form select.error {
            border-color: #ef4444 !important;
        }
    `;
    document.head.appendChild(style);
});