<?php
/**
 * CRUD operations for calculators table.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PHPavel_Dev_Calculators_Calculators_Repository {

	/**
	 * Create a calculator row.
	 *
	 * @param array $data Calculator data.
	 * @return int|false
	 */
	public static function create( $data ) {
		global $wpdb;

		$table = PHPavel_Dev_Calculators_DB::get_calculators_table_name();

		$payload = array(
			'title'       => isset( $data['title'] ) ? sanitize_text_field( $data['title'] ) : '',
			'status'      => isset( $data['status'] ) ? sanitize_key( $data['status'] ) : 'draft',
			'settings'    => self::normalize_settings( isset( $data['settings'] ) ? $data['settings'] : null ),
			'note'        => isset( $data['note'] ) ? wp_kses_post( $data['note'] ) : '',
			'total_price' => isset( $data['total_price'] ) ? (float) $data['total_price'] : 0,
			'total_days'  => isset( $data['total_days'] ) ? max( 0, (int) $data['total_days'] ) : 0,
		);

		$inserted = $wpdb->insert(
			$table,
			$payload,
			array( '%s', '%s', '%s', '%s', '%f', '%d' )
		);

		if ( false === $inserted ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Update calculator row.
	 *
	 * @param int   $id   Calculator ID.
	 * @param array $data New data.
	 * @return bool
	 */
	public static function update( $id, $data ) {
		global $wpdb;

		$allowed = array(
			'title'       => '%s',
			'status'      => '%s',
			'settings'    => '%s',
			'note'        => '%s',
			'total_price' => '%f',
			'total_days'  => '%d',
		);

		$update_data = array();
		$formats     = array();

		foreach ( $allowed as $field => $format ) {
			if ( ! array_key_exists( $field, $data ) ) {
				continue;
			}

			if ( 'title' === $field ) {
				$update_data[ $field ] = sanitize_text_field( $data[ $field ] );
			} elseif ( 'status' === $field ) {
				$update_data[ $field ] = sanitize_key( $data[ $field ] );
			} elseif ( 'settings' === $field ) {
				$update_data[ $field ] = self::normalize_settings( $data[ $field ] );
			} elseif ( 'note' === $field ) {
				$update_data[ $field ] = wp_kses_post( $data[ $field ] );
			} elseif ( 'total_price' === $field ) {
				$update_data[ $field ] = (float) $data[ $field ];
			} elseif ( 'total_days' === $field ) {
				$update_data[ $field ] = max( 0, (int) $data[ $field ] );
			}

			$formats[] = $format;
		}

		if ( empty( $update_data ) ) {
			return false;
		}

		$result = $wpdb->update(
			PHPavel_Dev_Calculators_DB::get_calculators_table_name(),
			$update_data,
			array( 'id' => (int) $id ),
			$formats,
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Delete calculator and related child rows.
	 *
	 * @param int $id Calculator ID.
	 * @return bool
	 */
	public static function delete( $id ) {
		global $wpdb;

		$calculator_id = (int) $id;

		PHPavel_Dev_Calculators_Works_Repository::delete_by_calculator( $calculator_id );
		PHPavel_Dev_Calculators_Additional_Costs_Repository::delete_by_calculator( $calculator_id );

		$deleted = $wpdb->delete(
			PHPavel_Dev_Calculators_DB::get_calculators_table_name(),
			array( 'id' => $calculator_id ),
			array( '%d' )
		);

		return false !== $deleted;
	}

	/**
	 * Get calculator by ID.
	 *
	 * @param int $id Calculator ID.
	 * @return array|null
	 */
	public static function get( $id ) {
		global $wpdb;

		$table  = PHPavel_Dev_Calculators_DB::get_calculators_table_name();
		$result = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", (int) $id ),
			ARRAY_A
		);

		if ( ! $result ) {
			return null;
		}

		$result['id']         = (int) $result['id'];
		$result['total_days'] = (int) $result['total_days'];
		$result['settings']   = self::decode_settings( $result['settings'] );

		return $result;
	}

	/**
	 * Get calculators list.
	 *
	 * @param array $args Query args.
	 * @return array
	 */
	public static function get_list( $args = array() ) {
		global $wpdb;

		$table  = PHPavel_Dev_Calculators_DB::get_calculators_table_name();
		$limit  = isset( $args['limit'] ) ? max( 1, (int) $args['limit'] ) : 50;
		$offset = isset( $args['offset'] ) ? max( 0, (int) $args['offset'] ) : 0;

		$sql      = "SELECT * FROM {$table}";
		$where    = array();
		$bindings = array();

		if ( ! empty( $args['status'] ) ) {
			$where[]    = 'status = %s';
			$bindings[] = sanitize_key( $args['status'] );
		}

		if ( ! empty( $args['search'] ) ) {
			$where[]    = 'title LIKE %s';
			$bindings[] = '%' . $wpdb->esc_like( $args['search'] ) . '%';
		}

		if ( ! empty( $where ) ) {
			$sql .= ' WHERE ' . implode( ' AND ', $where );
		}

		$sql       .= ' ORDER BY id DESC LIMIT %d OFFSET %d';
		$bindings[] = $limit;
		$bindings[] = $offset;

		$prepared = $wpdb->prepare( $sql, $bindings );
		$rows     = $wpdb->get_results( $prepared, ARRAY_A );

		if ( ! $rows ) {
			return array();
		}

		foreach ( $rows as &$row ) {
			$row['id']         = (int) $row['id'];
			$row['total_days'] = (int) $row['total_days'];
			$row['settings']   = self::decode_settings( $row['settings'] );
		}

		return $rows;
	}

	/**
	 * Convert settings value to JSON string.
	 *
	 * @param mixed $settings Settings payload.
	 * @return string
	 */
	private static function normalize_settings( $settings ) {
		if ( is_array( $settings ) || is_object( $settings ) ) {
			$encoded = wp_json_encode( $settings );
			return false === $encoded ? '{}' : $encoded;
		}

		if ( is_string( $settings ) && '' !== $settings ) {
			return $settings;
		}

		return '{}';
	}

	/**
	 * Decode JSON settings string.
	 *
	 * @param string $settings_json Raw JSON.
	 * @return array
	 */
	private static function decode_settings( $settings_json ) {
		if ( ! is_string( $settings_json ) || '' === $settings_json ) {
			return array();
		}

		$decoded = json_decode( $settings_json, true );

		return is_array( $decoded ) ? $decoded : array();
	}
}
