<?php
/**
 * Cleanup plugin tables on uninstall.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

$calculators_table              = $wpdb->prefix . 'phpavel_calculators';
$calculator_works_table         = $wpdb->prefix . 'phpavel_calculator_works';
$calculator_additional_costs    = $wpdb->prefix . 'phpavel_calculator_additional_costs';

$wpdb->query( "DROP TABLE IF EXISTS {$calculator_additional_costs}" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
$wpdb->query( "DROP TABLE IF EXISTS {$calculator_works_table}" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
$wpdb->query( "DROP TABLE IF EXISTS {$calculators_table}" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
