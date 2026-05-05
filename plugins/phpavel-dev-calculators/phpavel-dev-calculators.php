<?php
/**
 * Plugin Name:       Calculators for developers and agencies
 * Description:       Plugin for creating calculators for developers and agencies.
 * Version:           0.1.0
 * Requires at least: 6.8
 * Requires PHP:      7.4
 * Author:            Philippov Pavel
 * Author URI:        https://philippovpavel.ru
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       phpavel-dev-calculators
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PHPAVEL_DEV_CALCULATORS_VERSION', '0.1.0' );
define( 'PHPAVEL_DEV_CALCULATORS_PATH', plugin_dir_path( __FILE__ ) );

require_once PHPAVEL_DEV_CALCULATORS_PATH . 'includes/class-phpavel-dev-calculators-db.php';
require_once PHPAVEL_DEV_CALCULATORS_PATH . 'includes/class-phpavel-dev-calculators-works-repository.php';
require_once PHPAVEL_DEV_CALCULATORS_PATH . 'includes/class-phpavel-dev-calculators-additional-costs-repository.php';
require_once PHPAVEL_DEV_CALCULATORS_PATH . 'includes/class-phpavel-dev-calculators-calculators-repository.php';
require_once PHPAVEL_DEV_CALCULATORS_PATH . 'includes/class-phpavel-dev-calculators-service.php';
require_once PHPAVEL_DEV_CALCULATORS_PATH . 'includes/class-phpavel-dev-calculators-rest-controller.php';
require_once PHPAVEL_DEV_CALCULATORS_PATH . 'includes/class-phpavel-dev-calculators-admin-page.php';

/**
 * Create plugin tables on activation (if missing).
 */
function phpavel_dev_calculators_activate() {
	PHPavel_Dev_Calculators_DB::create_tables();
}
register_activation_hook( __FILE__, 'phpavel_dev_calculators_activate' );

/**
 * Load plugin translations.
 */
function phpavel_dev_calculators_load_textdomain() {
	load_plugin_textdomain(
		'phpavel-dev-calculators',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
}
add_action( 'plugins_loaded', 'phpavel_dev_calculators_load_textdomain' );

/**
 * Register plugin REST routes.
 */
function phpavel_dev_calculators_register_rest_routes() {
	PHPavel_Dev_Calculators_REST_Controller::register_routes();
}
add_action( 'rest_api_init', 'phpavel_dev_calculators_register_rest_routes' );

/**
 * Initialize calculators admin page.
 */
PHPavel_Dev_Calculators_Admin_Page::init();
