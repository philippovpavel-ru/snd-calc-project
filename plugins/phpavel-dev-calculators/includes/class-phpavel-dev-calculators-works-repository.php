<?php
/**
 * CRUD operations for calculator works table.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PHPavel_Dev_Calculators_Works_Repository {

	/**
	 * Create work row.
	 *
	 * @param int   $calculator_id Parent calculator ID.
	 * @param array $data Work data.
	 * @return int|false
	 */
	public static function create( $calculator_id, $data ) {
		global $wpdb;

		$inserted = $wpdb->insert(
			PHPavel_Dev_Calculators_DB::get_calculator_works_table_name(),
			array(
				'calculator_id'   => (int) $calculator_id,
				'sort_order'      => isset( $data['sort_order'] ) ? max( 0, (int) $data['sort_order'] ) : 0,
				'title'           => isset( $data['title'] ) ? sanitize_text_field( $data['title'] ) : '',
				'calc_type'       => self::normalize_calc_type( isset( $data['calc_type'] ) ? $data['calc_type'] : 'fix' ),
				'fix_price'       => isset( $data['fix_price'] ) ? (float) $data['fix_price'] : 0,
				'hour_counter'    => isset( $data['hour_counter'] ) ? (float) $data['hour_counter'] : 0,
				'work_period_days'=> isset( $data['work_period_days'] ) ? max( 0, (int) $data['work_period_days'] ) : 0,
			),
			array( '%d', '%d', '%s', '%s', '%f', '%f', '%d' )
		);

		if ( false === $inserted ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Update work row by ID.
	 *
	 * @param int   $id   Work ID.
	 * @param array $data New data.
	 * @return bool
	 */
	public static function update( $id, $data ) {
		global $wpdb;

		$allowed = array(
			'sort_order'       => '%d',
			'title'            => '%s',
			'calc_type'        => '%s',
			'fix_price'        => '%f',
			'hour_counter'     => '%f',
			'work_period_days' => '%d',
		);

		$update_data = array();
		$formats     = array();

		foreach ( $allowed as $field => $format ) {
			if ( ! array_key_exists( $field, $data ) ) {
				continue;
			}

			if ( 'sort_order' === $field || 'work_period_days' === $field ) {
				$update_data[ $field ] = max( 0, (int) $data[ $field ] );
			} elseif ( 'title' === $field ) {
				$update_data[ $field ] = sanitize_text_field( $data[ $field ] );
			} elseif ( 'calc_type' === $field ) {
				$update_data[ $field ] = self::normalize_calc_type( $data[ $field ] );
			} elseif ( 'fix_price' === $field || 'hour_counter' === $field ) {
				$update_data[ $field ] = (float) $data[ $field ];
			}

			$formats[] = $format;
		}

		if ( empty( $update_data ) ) {
			return false;
		}

		$result = $wpdb->update(
			PHPavel_Dev_Calculators_DB::get_calculator_works_table_name(),
			$update_data,
			array( 'id' => (int) $id ),
			$formats,
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Delete work row by ID.
	 *
	 * @param int $id Work ID.
	 * @return bool
	 */
	public static function delete( $id ) {
		global $wpdb;

		$deleted = $wpdb->delete(
			PHPavel_Dev_Calculators_DB::get_calculator_works_table_name(),
			array( 'id' => (int) $id ),
			array( '%d' )
		);

		return false !== $deleted;
	}

	/**
	 * Delete works by calculator ID.
	 *
	 * @param int $calculator_id Parent calculator ID.
	 * @return bool
	 */
	public static function delete_by_calculator( $calculator_id ) {
		global $wpdb;

		$deleted = $wpdb->delete(
			PHPavel_Dev_Calculators_DB::get_calculator_works_table_name(),
			array( 'calculator_id' => (int) $calculator_id ),
			array( '%d' )
		);

		return false !== $deleted;
	}

	/**
	 * Get work row by ID.
	 *
	 * @param int $id Work ID.
	 * @return array|null
	 */
	public static function get( $id ) {
		global $wpdb;

		$table  = PHPavel_Dev_Calculators_DB::get_calculator_works_table_name();
		$result = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", (int) $id ),
			ARRAY_A
		);

		return $result ? $result : null;
	}

	/**
	 * Get works by calculator ID ordered by sort_order.
	 *
	 * @param int $calculator_id Parent calculator ID.
	 * @return array
	 */
	public static function get_by_calculator( $calculator_id ) {
		global $wpdb;

		$table = PHPavel_Dev_Calculators_DB::get_calculator_works_table_name();

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE calculator_id = %d ORDER BY sort_order ASC, id ASC",
				(int) $calculator_id
			),
			ARRAY_A
		);

		return $rows ? $rows : array();
	}

	/**
	 * Normalize calc type value.
	 *
	 * @param string $calc_type Input type.
	 * @return string
	 */
	private static function normalize_calc_type( $calc_type ) {
		$type = sanitize_key( $calc_type );

		if ( ! in_array( $type, array( 'fix', 'hourly' ), true ) ) {
			return 'fix';
		}

		return $type;
	}
}
