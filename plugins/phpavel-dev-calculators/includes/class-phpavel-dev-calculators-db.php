<?php
/**
 * Database setup helpers for plugin custom tables.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PHPavel_Dev_Calculators_DB {

	/**
	 * Get calculators table name with proper WP prefix.
	 *
	 * @return string
	 */
	public static function get_calculators_table_name() {
		global $wpdb;

		return $wpdb->prefix . 'phpavel_calculators';
	}

	/**
	 * Get calculator works table name with proper WP prefix.
	 *
	 * @return string
	 */
	public static function get_calculator_works_table_name() {
		global $wpdb;

		return $wpdb->prefix . 'phpavel_calculator_works';
	}

	/**
	 * Get additional costs table name with proper WP prefix.
	 *
	 * @return string
	 */
	public static function get_calculator_additional_costs_table_name() {
		global $wpdb;

		return $wpdb->prefix . 'phpavel_calculator_additional_costs';
	}

	/**
	 * Create plugin tables if they do not exist.
	 *
	 * @return void
	 */
	public static function create_tables() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate                = $wpdb->get_charset_collate();
		$calculators_table              = self::get_calculators_table_name();
		$calculator_works_table         = self::get_calculator_works_table_name();
		$calculator_additional_costs    = self::get_calculator_additional_costs_table_name();

		$sql_calculators = "CREATE TABLE {$calculators_table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			title VARCHAR(255) NOT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'draft',
			settings LONGTEXT NULL,
			note LONGTEXT NULL,
			total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
			total_days INT(10) UNSIGNED NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY status (status)
		) {$charset_collate};";

		$sql_calculator_works = "CREATE TABLE {$calculator_works_table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			calculator_id BIGINT(20) UNSIGNED NOT NULL,
			sort_order INT(10) UNSIGNED NOT NULL DEFAULT 0,
			title VARCHAR(255) NOT NULL,
			calc_type VARCHAR(20) NOT NULL DEFAULT 'fix',
			fix_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
			hour_counter DECIMAL(10,2) NOT NULL DEFAULT 0.00,
			work_period_days INT(10) UNSIGNED NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY calculator_id (calculator_id),
			KEY sort_order (sort_order)
		) {$charset_collate};";

		$sql_calculator_additional_costs = "CREATE TABLE {$calculator_additional_costs} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			calculator_id BIGINT(20) UNSIGNED NOT NULL,
			sort_order INT(10) UNSIGNED NOT NULL DEFAULT 0,
			title VARCHAR(255) NOT NULL,
			price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY calculator_id (calculator_id),
			KEY sort_order (sort_order)
		) {$charset_collate};";

		dbDelta( $sql_calculators );
		dbDelta( $sql_calculator_works );
		dbDelta( $sql_calculator_additional_costs );
	}
}
