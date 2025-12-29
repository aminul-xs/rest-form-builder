import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, Eye, GripVertical, Loader } from 'lucide-react';

// API Service
const API = {
  baseUrl: window.formBuilderConfig?.apiUrl || '/wp-json/form-builder/v1',
  nonce: window.formBuilderConfig?.nonce || '',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-WP-Nonce': this.nonce,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  },

  getForms() {
    return this.request('/forms');
  },

  getForm(id) {
    return this.request(`/forms/${id}`);
  },

  createForm(data) {
    return this.request('/forms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateForm(id, data) {
    return this.request(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteForm(id) {
    return this.request(`/forms/${id}`, {
      method: 'DELETE'
    });
  }
};

const FormBuilder = () => {
  const [forms, setForms] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState([]);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      loadForms();
    }
  }, [view]);

  const loadForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.getForms();
      setForms(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewForm = () => {
    setCurrentForm(null);
    setFormName('New Form');
    setFields([]);
    setView('editor');
  };

  const editForm = async (form) => {
    setLoading(true);
    try {
      const response = await API.getForm(form.id);
      const formData = response.data;
      
      setCurrentForm({ id: formData.id });
      setFormName(formData.name);
      setFields(formData.form_data.fields || []);
      setView('editor');
    } catch (err) {
      setError(err.message);
      console.error('Error loading form:', err);
    } finally {
      setLoading(false);
    }
  };

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, updates) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < fields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const saveForm = async () => {
    if (!formName.trim()) {
      alert('Please enter a form name');
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = {
        name: formName,
        form_data: { fields }
      };

      if (currentForm?.id) {
        await API.updateForm(currentForm.id, formData);
      } else {
        await API.createForm(formData);
      }

      alert('Form saved successfully!');
      setView('list');
    } catch (err) {
      setError(err.message);
      alert('Failed to save form: ' + err.message);
      console.error('Error saving form:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (id) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    setLoading(true);
    try {
      await API.deleteForm(id);
      setForms(forms.filter(f => f.id !== id));
    } catch (err) {
      setError(err.message);
      alert('Failed to delete form: ' + err.message);
      console.error('Error deleting form:', err);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'list') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Form Builder (REST API)</h1>
          <button
            onClick={createNewForm}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Plus size={20} /> Create New Form
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 flex items-center justify-center gap-2">
            <Loader className="animate-spin" size={24} />
            <span>Loading...</span>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No forms yet. Create your first form!
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Updated</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Shortcode</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map(form => (
                  <tr key={form.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{form.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{form.created_at}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{form.updated_at}</td>
                    <td className="px-6 py-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        [rest_form id="{form.id}"]
                      </code>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => editForm(form)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        disabled={loading}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteForm(form.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (view === 'editor') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setView('list')}
            className="text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            ← Back to Forms
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setView('preview')}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              <Eye size={18} /> Preview
            </button>
            <button
              onClick={saveForm}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
              {loading ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <h3 className="font-semibold mb-4 text-gray-800">Form Settings</h3>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                placeholder="Form Name"
              />
              
              <h3 className="font-semibold mb-4 text-gray-800 mt-6">Add Fields</h3>
              <div className="space-y-2">
                {['text', 'email', 'textarea', 'select', 'radio', 'checkbox'].map(type => (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition capitalize"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">{formName}</h2>
              
              {fields.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  Add fields from the sidebar to start building your form
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      index={index}
                      totalFields={fields.length}
                      onUpdate={(updates) => updateField(field.id, updates)}
                      onDelete={() => deleteField(field.id)}
                      onMove={(direction) => moveField(index, direction)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => setView('editor')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Editor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">{formName}</h2>
        <div className="space-y-6">
          {fields.map(field => (
            <FieldPreview key={field.id} field={field} />
          ))}
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const FieldEditor = ({ field, index, totalFields, onUpdate, onDelete, onMove }) => {
  const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 pt-2">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <GripVertical size={16} />
          </button>
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Field Label"
            />
            <select
              value={field.type}
              onChange={(e) => onUpdate({ type: e.target.value })}
              className="px-3 py-2 border rounded"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="textarea">Textarea</option>
              <option value="select">Select</option>
              <option value="radio">Radio</option>
              <option value="checkbox">Checkbox</option>
            </select>
          </div>

          {!needsOptions && (
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Placeholder text"
            />
          )}

          {needsOptions && (
            <textarea
              value={field.options?.join('\n') || ''}
              onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(o => o.trim()) })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
              placeholder="Options (one per line)"
            />
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded"
            />
            Required field
          </label>
        </div>

        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 p-2"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const FieldPreview = ({ field }) => {
  const needsOptions = ['select', 'radio', 'checkbox'].includes(field.type);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {field.label} {field.required && <span className="text-red-600">*</span>}
      </label>
      
      {field.type === 'textarea' ? (
        <textarea
          className="w-full px-4 py-2 border rounded-lg"
          placeholder={field.placeholder}
          rows={4}
        />
      ) : field.type === 'select' ? (
        <select className="w-full px-4 py-2 border rounded-lg">
          <option value="">Select an option</option>
          {field.options?.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === 'radio' ? (
        <div className="space-y-2">
          {field.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="radio" name={field.id} value={opt} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : field.type === 'checkbox' ? (
        <div className="space-y-2">
          {field.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="checkbox" value={opt} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          type={field.type}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder={field.placeholder}
        />
      )}
    </div>
  );
};

export default FormBuilder;