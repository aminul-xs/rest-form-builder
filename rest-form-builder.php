<?php
/**
 * Plugin Name: REST Form Builder
 * Description: A form builder with REST API and React editor
 * Version: 1.0.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) exit;

class REST_Form_Builder {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        add_shortcode('rest_form', [$this, 'render_form_shortcode']);
        
        register_activation_hook(__FILE__, [$this, 'activate']);
    }
    
    public function activate() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        
        // Forms table
        $forms_table = $wpdb->prefix . 'rest_forms';
        $sql = "CREATE TABLE IF NOT EXISTS $forms_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            form_data longtext NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Submissions table
        $submissions_table = $wpdb->prefix . 'rest_form_submissions';
        $sql = "CREATE TABLE IF NOT EXISTS $submissions_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            form_id mediumint(9) NOT NULL,
            submission_data longtext NOT NULL,
            submitted_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY form_id (form_id)
        ) $charset_collate;";
        
        dbDelta($sql);
    }
    
    public function register_rest_routes() {
        $namespace = 'form-builder/v1';
        
        // Get all forms
        register_rest_route($namespace, '/forms', [
            'methods' => 'GET',
            'callback' => [$this, 'get_forms'],
            'permission_callback' => [$this, 'check_admin_permission']
        ]);
        
        // Get single form
        register_rest_route($namespace, '/forms/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_form'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);
        
        // Create form
        register_rest_route($namespace, '/forms', [
            'methods' => 'POST',
            'callback' => [$this, 'create_form'],
            'permission_callback' => [$this, 'check_admin_permission']
        ]);
        
        // Update form
        register_rest_route($namespace, '/forms/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_form'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);
        
        // Delete form
        register_rest_route($namespace, '/forms/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_form'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);
        
        // Submit form (public endpoint)
        register_rest_route($namespace, '/submit', [
            'methods' => 'POST',
            'callback' => [$this, 'submit_form'],
            'permission_callback' => '__return_true'
        ]);
        
        // Get form for frontend (public endpoint)
        register_rest_route($namespace, '/forms/(?P<id>\d+)/public', [
            'methods' => 'GET',
            'callback' => [$this, 'get_form_public'],
            'permission_callback' => '__return_true',
            'args' => [
                'id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);
    }
    
    public function check_admin_permission() {
        return current_user_can('manage_options');
    }
    
    // REST API Callbacks
    
    public function get_forms($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'rest_forms';
        
        $forms = $wpdb->get_results(
            "SELECT id, name, created_at, updated_at FROM $table_name ORDER BY updated_at DESC"
        );
        
        return rest_ensure_response([
            'success' => true,
            'data' => $forms
        ]);
    }
    
    public function get_form($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'rest_forms';
        $form_id = $request['id'];
        
        $form = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $form_id
        ));
        
        if (!$form) {
            return new WP_Error('not_found', 'Form not found', ['status' => 404]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'id' => $form->id,
                'name' => $form->name,
                'form_data' => json_decode($form->form_data),
                'created_at' => $form->created_at,
                'updated_at' => $form->updated_at
            ]
        ]);
    }
    
    public function get_form_public($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'rest_forms';
        $form_id = $request['id'];
        
        $form = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $form_id
        ));
        
        if (!$form) {
            return new WP_Error('not_found', 'Form not found', ['status' => 404]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'id' => $form->id,
                'name' => $form->name,
                'form_data' => json_decode($form->form_data)
            ]
        ]);
    }
    
    public function create_form($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'rest_forms';
        
        $body = json_decode($request->get_body(), true);
        
        if (!isset($body['name']) || !isset($body['form_data'])) {
            return new WP_Error('invalid_data', 'Name and form_data are required', ['status' => 400]);
        }
        
        $form_name = sanitize_text_field($body['name']);
        $form_data = $body['form_data'];
        
        // Validate JSON structure
        if (!is_array($form_data) || !isset($form_data['fields'])) {
            return new WP_Error('invalid_json', 'Invalid form data structure', ['status' => 400]);
        }
        
        $result = $wpdb->insert(
            $table_name,
            [
                'name' => $form_name,
                'form_data' => json_encode($form_data)
            ],
            ['%s', '%s']
        );
        
        if ($result === false) {
            return new WP_Error('db_error', 'Failed to create form', ['status' => 500]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'id' => $wpdb->insert_id,
                'message' => 'Form created successfully'
            ]
        ]);
    }
    
    public function update_form($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'rest_forms';
        $form_id = $request['id'];
        
        $body = json_decode($request->get_body(), true);
        
        if (!isset($body['name']) || !isset($body['form_data'])) {
            return new WP_Error('invalid_data', 'Name and form_data are required', ['status' => 400]);
        }
        
        // Check if form exists
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE id = %d",
            $form_id
        ));
        
        if (!$exists) {
            return new WP_Error('not_found', 'Form not found', ['status' => 404]);
        }
        
        $form_name = sanitize_text_field($body['name']);
        $form_data = $body['form_data'];
        
        // Validate JSON structure
        if (!is_array($form_data) || !isset($form_data['fields'])) {
            return new WP_Error('invalid_json', 'Invalid form data structure', ['status' => 400]);
        }
        
        $result = $wpdb->update(
            $table_name,
            [
                'name' => $form_name,
                'form_data' => json_encode($form_data)
            ],
            ['id' => $form_id],
            ['%s', '%s'],
            ['%d']
        );
        
        if ($result === false) {
            return new WP_Error('db_error', 'Failed to update form', ['status' => 500]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'id' => $form_id,
                'message' => 'Form updated successfully'
            ]
        ]);
    }
    
    public function delete_form($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'rest_forms';
        $form_id = $request['id'];
        
        $result = $wpdb->delete($table_name, ['id' => $form_id], ['%d']);
        
        if ($result === false || $result === 0) {
            return new WP_Error('not_found', 'Form not found or already deleted', ['status' => 404]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => ['message' => 'Form deleted successfully']
        ]);
    }
    
    public function submit_form($request) {
        global $wpdb;
        $submissions_table = $wpdb->prefix . 'rest_form_submissions';
        
        $body = json_decode($request->get_body(), true);
        
        if (!isset($body['form_id']) || !isset($body['data'])) {
            return new WP_Error('invalid_data', 'form_id and data are required', ['status' => 400]);
        }
        
        $form_id = intval($body['form_id']);
        $submission_data = $body['data'];
        
        // Sanitize submission data
        $sanitized_data = [];
        foreach ($submission_data as $key => $value) {
            $sanitized_data[sanitize_text_field($key)] = sanitize_text_field($value);
        }
        
        $result = $wpdb->insert(
            $submissions_table,
            [
                'form_id' => $form_id,
                'submission_data' => json_encode($sanitized_data)
            ],
            ['%d', '%s']
        );
        
        if ($result === false) {
            return new WP_Error('db_error', 'Failed to submit form', ['status' => 500]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => ['message' => 'Form submitted successfully']
        ]);
    }
    
    // Admin Interface
    
    public function add_admin_menu() {
        add_menu_page(
            'REST Form Builder',
            'Form Builder',
            'manage_options',
            'rest-form-builder',
            [$this, 'render_admin_page'],
            'dashicons-feedback',
            30
        );
    }
    
    public function enqueue_admin_assets($hook) {
        if ('toplevel_page_rest-form-builder' !== $hook) {
            return;
        }
        $_assets = require_once plugin_dir_path(__FILE__) . 'build/index.asset.php';
        wp_enqueue_script(
            'rest-form-builder-react',
            plugin_dir_url(__FILE__) . 'build/index.js',
            $_assets['dependencies'],
            $_assets['version'],
            true
        );
        
        wp_enqueue_style(
            'rest-form-builder-admin',
            plugin_dir_url(__FILE__) . 'assets/admin.css',
            [],
            '1.0.0'
        );
        
        wp_localize_script('rest-form-builder-react', 'formBuilderConfig', [
            'apiUrl' => rest_url('form-builder/v1'),
            'nonce' => wp_create_nonce('wp_rest')
        ]);

        // Enqueue Tailwind CSS browser CDN
        wp_enqueue_script(
            'tailwindcss-browser',
            'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
            [],
            null,
            true
        );
    }
    
    public function render_admin_page() {
        echo '<div id="rest-form-builder-root"></div>';
    }
    
    // Frontend
    
    public function enqueue_frontend_assets() {
        wp_enqueue_style(
            'rest-form-builder-frontend',
            plugin_dir_url(__FILE__) . 'assets/frontend.css',
            [],
            '1.0.0'
        );
        
        wp_enqueue_script(
            'rest-form-builder-frontend',
            plugin_dir_url(__FILE__) . 'assets/frontend.js',
            [],
            '1.0.0',
            true
        );
        
        wp_localize_script('rest-form-builder-frontend', 'formBuilderFrontend', [
            'apiUrl' => rest_url('form-builder/v1'),
            'nonce' => wp_create_nonce('wp_rest')
        ]);

        // Enqueue Tailwind CSS browser CDN
        wp_enqueue_script(
            'tailwindcss-browser',
            'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
            [],
            null,
            true
        );
    }
    
    public function render_form_shortcode($atts) {
        $atts = shortcode_atts(['id' => 0], $atts);
        $form_id = intval($atts['id']);
        
        if ($form_id <= 0) {
            return '<p>Invalid form ID</p>';
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'rest_forms';
        
        $form = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $form_id
        ));
        
        if (!$form) {
            return '<p>Form not found</p>';
        }
        
        $form_data = json_decode($form->form_data, true);
        
        return $this->render_form_html($form_id, $form->name, $form_data);
    }
    
    private function render_form_html($form_id, $form_name, $form_data) {
        ob_start();
        ?>
        <div class="rest-form-wrapper" data-form-id="<?php echo esc_attr($form_id); ?>">
            <div class="rest-form">
                <?php foreach ($form_data['fields'] as $field): ?>
                    <div class="form-field" data-field-type="<?php echo esc_attr($field['type']); ?>">
                        <label for="field-<?php echo esc_attr($field['id']); ?>">
                            <?php echo esc_html($field['label']); ?>
                            <?php if (!empty($field['required'])): ?>
                                <span class="required">*</span>
                            <?php endif; ?>
                        </label>
                        
                        <?php
                        $field_id = 'field-' . esc_attr($field['id']);
                        $field_name = esc_attr($field['id']);
                        $placeholder = esc_attr($field['placeholder'] ?? '');
                        $required = !empty($field['required']) ? 'required' : '';
                        
                        switch ($field['type']):
                            case 'text':
                            case 'email':
                                ?>
                                <input 
                                    type="<?php echo esc_attr($field['type']); ?>" 
                                    id="<?php echo $field_id; ?>"
                                    name="<?php echo $field_name; ?>"
                                    placeholder="<?php echo $placeholder; ?>"
                                    <?php echo $required; ?>
                                />
                                <?php
                                break;
                                
                            case 'textarea':
                                ?>
                                <textarea 
                                    id="<?php echo $field_id; ?>"
                                    name="<?php echo $field_name; ?>"
                                    placeholder="<?php echo $placeholder; ?>"
                                    <?php echo $required; ?>
                                ></textarea>
                                <?php
                                break;
                                
                            case 'select':
                                ?>
                                <select 
                                    id="<?php echo $field_id; ?>"
                                    name="<?php echo $field_name; ?>"
                                    <?php echo $required; ?>
                                >
                                    <option value="">Select an option</option>
                                    <?php foreach ($field['options'] ?? [] as $option): ?>
                                        <option value="<?php echo esc_attr($option); ?>">
                                            <?php echo esc_html($option); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <?php
                                break;
                                
                            case 'radio':
                                foreach ($field['options'] ?? [] as $index => $option):
                                    $radio_id = $field_id . '-' . $index;
                                    ?>
                                    <div class="radio-option">
                                        <input 
                                            type="radio"
                                            id="<?php echo $radio_id; ?>"
                                            name="<?php echo $field_name; ?>"
                                            value="<?php echo esc_attr($option); ?>"
                                            <?php echo $required; ?>
                                        />
                                        <label for="<?php echo $radio_id; ?>">
                                            <?php echo esc_html($option); ?>
                                        </label>
                                    </div>
                                    <?php
                                endforeach;
                                break;
                                
                            case 'checkbox':
                                foreach ($field['options'] ?? [] as $index => $option):
                                    $checkbox_id = $field_id . '-' . $index;
                                    ?>
                                    <div class="checkbox-option">
                                        <input 
                                            type="checkbox"
                                            id="<?php echo $checkbox_id; ?>"
                                            name="<?php echo $field_name; ?>[]"
                                            value="<?php echo esc_attr($option); ?>"
                                        />
                                        <label for="<?php echo $checkbox_id; ?>">
                                            <?php echo esc_html($option); ?>
                                        </label>
                                    </div>
                                    <?php
                                endforeach;
                                break;
                        endswitch;
                        ?>
                    </div>
                <?php endforeach; ?>
                
                <div class="form-actions">
                    <button type="button" class="submit-btn" onclick="submitRestForm(this)">
                        Submit
                    </button>
                </div>
                
                <div class="form-message" style="display:none;"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

REST_Form_Builder::get_instance();