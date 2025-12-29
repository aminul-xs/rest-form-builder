# WordPress Form Builder with REST API

A modern form builder plugin using WordPress REST API for all data communication between React frontend and PHP backend.

## 🏗️ Architecture

```
┌─────────────────┐         REST API          ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  React Editor   │    JSON Communication      │  PHP Backend    │
│  (Admin Panel)  │                            │  (WordPress)    │
│                 │◄──────────────────────────►│                 │
└─────────────────┘                            └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  MySQL Database │
                                                │  - Forms        │
                                                │  - Submissions  │
                                                └─────────────────┘
```

## 📁 Plugin Structure

```
rest-form-builder/
├── rest-form-builder.php            (Main plugin file)
├── build/
│   └── index.js                     (Compiled React app)
├── src/
│   └── FormBuilder.jsx              (React components)
├── assets/
│   ├── admin.css                    (Admin styling)
│   ├── frontend.css                 (Frontend form styling)
│   └── frontend.js                  (Form submission handler)
└── README.md
```

## 🚀 Installation

1. Create plugin directory:
```bash
mkdir wp-content/plugins/rest-form-builder
cd wp-content/plugins/rest-form-builder
```

2. Copy all plugin files to this directory

3. Install dependencies and build React app:
```bash
npm init -y
npm install --save-dev @wordpress/scripts
npm install react react-dom lucide-react
```

4. Add build script to `package.json`:
```json
{
  "scripts": {
    "build": "wp-scripts build",
    "start": "wp-scripts start"
  }
}
```

5. Build the React app:
```bash
npm run build
```

6. Activate plugin in WordPress admin

## 🔌 REST API Endpoints

### Admin Endpoints (Require `manage_options` capability)

#### Get All Forms
```
GET /wp-json/form-builder/v1/forms
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Contact Form",
      "created_at": "2024-01-15 10:00:00",
      "updated_at": "2024-01-20 15:30:00"
    }
  ]
}
```

#### Get Single Form
```
GET /wp-json/form-builder/v1/forms/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Contact Form",
    "form_data": {
      "fields": [
        {
          "id": "field_1",
          "type": "text",
          "label": "Full Name",
          "placeholder": "Enter your name",
          "required": true
        }
      ]
    },
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-20 15:30:00"
  }
}
```

#### Create Form
```
POST /wp-json/form-builder/v1/forms
Content-Type: application/json
X-WP-Nonce: {nonce}
```

**Body:**
```json
{
  "name": "Contact Form",
  "form_data": {
    "fields": [
      {
        "id": "field_1",
        "type": "text",
        "label": "Full Name",
        "placeholder": "Enter your name",
        "required": true
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "Form created successfully"
  }
}
```

#### Update Form
```
PUT /wp-json/form-builder/v1/forms/{id}
Content-Type: application/json
X-WP-Nonce: {nonce}
```

**Body:** Same as Create Form

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "Form updated successfully"
  }
}
```

#### Delete Form
```
DELETE /wp-json/form-builder/v1/forms/{id}
X-WP-Nonce: {nonce}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Form deleted successfully"
  }
}
```

### Public Endpoints

#### Get Form (Public)
```
GET /wp-json/form-builder/v1/forms/{id}/public
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Contact Form",
    "form_data": {
      "fields": [...]
    }
  }
}
```

#### Submit Form
```
POST /wp-json/form-builder/v1/submit
Content-Type: application/json
X-WP-Nonce: {nonce}
```

**Body:**
```json
{
  "form_id": 1,
  "data": {
    "field_1": "John Doe",
    "field_2": "john@example.com",
    "field_3": "Hello World"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Form submitted successfully"
  }
}
```

## 📝 JSON Structure

### Form Data Structure
```json
{
  "fields": [
    {
      "id": "field_unique_id",
      "type": "text|email|textarea|select|radio|checkbox",
      "label": "Field Label",
      "placeholder": "Placeholder text (optional)",
      "required": true|false,
      "options": ["Option 1", "Option 2"] // Only for select, radio, checkbox
    }
  ]
}
```

### Field Types

1. **Text Input**
```json
{
  "id": "field_1",
  "type": "text",
  "label": "Full Name",
  "placeholder": "Enter your name",
  "required": true
}
```

2. **Email Input**
```json
{
  "id": "field_2",
  "type": "email",
  "label": "Email Address",
  "placeholder": "your@email.com",
  "required": true
}
```

3. **Textarea**
```json
{
  "id": "field_3",
  "type": "textarea",
  "label": "Message",
  "placeholder": "Your message here...",
  "required": false
}
```

4. **Select Dropdown**
```json
{
  "id": "field_4",
  "type": "select",
  "label": "Country",
  "required": true,
  "options": ["USA", "Canada", "UK", "Australia"]
}
```

5. **Radio Buttons**
```json
{
  "id": "field_5",
  "type": "radio",
  "label": "Gender",
  "required": true,
  "options": ["Male", "Female", "Other"]
}
```

6. **Checkboxes**
```json
{
  "id": "field_6",
  "type": "checkbox",
  "label": "Interests",
  "required": false,
  "options": ["Sports", "Music", "Reading", "Travel"]
}
```

## 🎨 Usage

### Admin Interface

1. Navigate to **Form Builder** in WordPress admin
2. Click **Create New Form**
3. Add fields using the sidebar
4. Configure each field's properties
5. Click **Save Form**
6. Copy the shortcode

### Shortcode

```php
[rest_form id="1"]
```

### Template Usage

```php
<?php echo do_shortcode('[rest_form id="1"]'); ?>
```

## 🔧 React API Service

The React app includes a reusable API service:

```javascript
// Example usage in your component
import { API } from './api-service';

// Get all forms
const forms = await API.getForms();

// Get single form
const form = await API.getForm(1);

// Create form
const newForm = await API.createForm({
  name: 'My Form',
  form_data: { fields: [...] }
});

// Update form
await API.updateForm(1, {
  name: 'Updated Form',
  form_data: { fields: [...] }
});

// Delete form
await API.deleteForm(1);
```

## 🔐 Security Features

### Authentication
- All admin endpoints require `manage_options` capability
- WordPress nonce verification via `X-WP-Nonce` header
- REST API authentication built-in

### Data Validation
- JSON structure validation
- Field type validation
- Required field checking
- SQL injection protection via prepared statements
- XSS protection via sanitization

### Example: Making Authenticated Request
```javascript
fetch('/wp-json/form-builder/v1/forms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': window.formBuilderConfig.nonce
  },
  body: JSON.stringify({
    name: 'My Form',
    form_data: { fields: [] }
  })
});
```

## 🎯 Frontend Form Submission

The frontend uses vanilla JavaScript with REST API:

```javascript
async function submitRestForm(button) {
  const formData = {
    form_id: 1,
    data: {
      field_1: "John Doe",
      field_2: "john@example.com"
    }
  };
  
  const response = await fetch('/wp-json/form-builder/v1/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': window.formBuilderFrontend.nonce
    },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  console.log(result);
}
```

## 📊 Database Tables

### wp_rest_forms
```sql
CREATE TABLE wp_rest_forms (
  id mediumint(9) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  form_data longtext NOT NULL,  -- JSON string
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

### wp_rest_form_submissions
```sql
CREATE TABLE wp_rest_form_submissions (
  id mediumint(9) NOT NULL AUTO_INCREMENT,
  form_id mediumint(9) NOT NULL,
  submission_data longtext NOT NULL,  -- JSON string
  submitted_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY form_id (form_id)
);
```

## 🧪 Testing REST API

### Using cURL

```bash
# Get all forms
curl -X GET "http://yoursite.com/wp-json/form-builder/v1/forms" \
  -H "X-WP-Nonce: your-nonce"

# Create form
curl -X POST "http://yoursite.com/wp-json/form-builder/v1/forms" \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: your-nonce" \
  -d '{
    "name": "Test Form",
    "form_data": {
      "fields": [
        {
          "id": "field_1",
          "type": "text",
          "label": "Name",
          "required": true
        }
      ]
    }
  }'

# Submit form
curl -X POST "http://yoursite.com/wp-json/form-builder/v1/submit" \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: your-nonce" \
  -d '{
    "form_id": 1,
    "data": {
      "field_1": "John Doe"
    }
  }'
```

### Using Postman

1. Set request URL: `http://yoursite.com/wp-json/form-builder/v1/forms`
2. Set method: POST
3. Add headers:
   - `Content-Type: application/json`
   - `X-WP-Nonce: {your-nonce}`
4. Add JSON body
5. Send request

## 🚀 Advanced Features

### View Submissions via REST API

Add this endpoint to your plugin:

```php
register_rest_route($namespace, '/submissions/(?P<form_id>\d+)', [
    'methods' => 'GET',
    'callback' => [$this, 'get_submissions'],
    'permission_callback' => [$this, 'check_admin_permission']
]);

public function get_submissions($request) {
    global $wpdb;
    $table = $wpdb->prefix . 'rest_form_submissions';
    $form_id = $request['form_id'];
    
    $submissions = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM $table WHERE form_id = %d ORDER BY submitted_at DESC",
        $form_id
    ));
    
    $formatted = array_map(function($sub) {
        return [
            'id' => $sub->id,
            'data' => json_decode($sub->submission_data),
            'submitted_at' => $sub->submitted_at
        ];
    }, $submissions);
    
    return rest_ensure_response([
        'success' => true,
        'data' => $formatted
    ]);
}
```

### Export Submissions as CSV

```php
register_rest_route($namespace, '/export/(?P<form_id>\d+)', [
    'methods' => 'GET',
    'callback' => [$this, 'export_submissions'],
    'permission_callback' => [$this, 'check_admin_permission']
]);
```

## 🎓 Best Practices

1. **Always validate nonce** for authenticated requests
2. **Sanitize all input data** before saving
3. **Use prepared statements** for database queries
4. **Handle errors gracefully** with proper HTTP status codes
5. **Cache GET requests** when possible
6. **Use loading states** in React for better UX
7. **Implement rate limiting** for public endpoints

## 📝 License

This is a custom plugin. Modify as needed for your project.
