<?php
/**
 * Service layer for aggregate calculator operations.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PHPavel_Dev_Calculators_Service {

	/**
	 * Create or update calculator with child rows in one operation.
	 *
	 * @param array $payload Full calculator payload.
	 * @return int|WP_Error Calculator ID or error.
	 */
	public static function save_calculator( $payload ) {
		global $wpdb;

		$calculator_data = self::extract_calculator_data( $payload );
		$works           = self::normalize_rows( isset( $payload['works'] ) ? $payload['works'] : array() );
		$additional_costs = self::normalize_rows( isset( $payload['additional_costs'] ) ? $payload['additional_costs'] : array() );

		$is_update     = ! empty( $payload['id'] );
		$calculator_id = $is_update ? (int) $payload['id'] : 0;

		if ( $is_update ) {
			$exists = PHPavel_Dev_Calculators_Calculators_Repository::get( $calculator_id );
			if ( ! $exists ) {
				return new WP_Error(
					'calculator_not_found',
					__( 'Calculator not found for update.', 'phpavel-dev-calculators' )
				);
			}
		}

		$wpdb->query( 'START TRANSACTION' );

		try {
			if ( $is_update ) {
				$updated = PHPavel_Dev_Calculators_Calculators_Repository::update( $calculator_id, $calculator_data );
				if ( ! $updated ) {
					throw new Exception( __( 'Failed to update calculator row.', 'phpavel-dev-calculators' ) );
				}
			} else {
				$calculator_id = PHPavel_Dev_Calculators_Calculators_Repository::create( $calculator_data );
				if ( false === $calculator_id ) {
					throw new Exception( __( 'Failed to create calculator row.', 'phpavel-dev-calculators' ) );
				}
			}

			$works_reset = PHPavel_Dev_Calculators_Works_Repository::delete_by_calculator( $calculator_id );
			if ( false === $works_reset ) {
				throw new Exception( __( 'Failed to reset works rows.', 'phpavel-dev-calculators' ) );
			}

			$costs_reset = PHPavel_Dev_Calculators_Additional_Costs_Repository::delete_by_calculator( $calculator_id );
			if ( false === $costs_reset ) {
				throw new Exception( __( 'Failed to reset additional costs rows.', 'phpavel-dev-calculators' ) );
			}

			foreach ( $works as $index => $work ) {
				$work['sort_order'] = isset( $work['sort_order'] ) ? (int) $work['sort_order'] : $index;
				$created_work_id    = PHPavel_Dev_Calculators_Works_Repository::create( $calculator_id, $work );
				if ( false === $created_work_id ) {
					throw new Exception( __( 'Failed to create work row.', 'phpavel-dev-calculators' ) );
				}
			}

			foreach ( $additional_costs as $index => $cost ) {
				$cost['sort_order'] = isset( $cost['sort_order'] ) ? (int) $cost['sort_order'] : $index;
				$created_cost_id    = PHPavel_Dev_Calculators_Additional_Costs_Repository::create( $calculator_id, $cost );
				if ( false === $created_cost_id ) {
					throw new Exception( __( 'Failed to create additional cost row.', 'phpavel-dev-calculators' ) );
				}
			}

			$wpdb->query( 'COMMIT' );

			return (int) $calculator_id;
		} catch ( Exception $exception ) {
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error( 'calculator_save_failed', $exception->getMessage() );
		}
	}

	/**
	 * Read calculator aggregate as one payload.
	 *
	 * @param int $calculator_id Calculator ID.
	 * @return array|WP_Error
	 */
	public static function get_calculator( $calculator_id ) {
		$calculator_id = (int) $calculator_id;
		$calculator    = PHPavel_Dev_Calculators_Calculators_Repository::get( $calculator_id );

		if ( ! $calculator ) {
			return new WP_Error( 'calculator_not_found', __( 'Calculator not found.', 'phpavel-dev-calculators' ) );
		}

		$calculator['works']            = PHPavel_Dev_Calculators_Works_Repository::get_by_calculator( $calculator_id );
		$calculator['additional_costs'] = PHPavel_Dev_Calculators_Additional_Costs_Repository::get_by_calculator( $calculator_id );

		return $calculator;
	}

	/**
	 * Delete calculator with linked rows.
	 *
	 * @param int $calculator_id Calculator ID.
	 * @return bool
	 */
	public static function delete_calculator( $calculator_id ) {
		return PHPavel_Dev_Calculators_Calculators_Repository::delete( (int) $calculator_id );
	}

	/**
	 * Keep only fields that belong to calculators table.
	 *
	 * @param array $payload Full input payload.
	 * @return array
	 */
	private static function extract_calculator_data( $payload ) {
		$data = array(
			'title'       => isset( $payload['title'] ) ? $payload['title'] : '',
			'status'      => isset( $payload['status'] ) ? $payload['status'] : 'draft',
			'settings'    => isset( $payload['settings'] ) ? $payload['settings'] : array(),
			'note'        => isset( $payload['note'] ) ? $payload['note'] : '',
			'total_price' => isset( $payload['total_price'] ) ? $payload['total_price'] : 0,
			'total_days'  => isset( $payload['total_days'] ) ? $payload['total_days'] : 0,
		);

		return $data;
	}

	/**
	 * Ensure list shape is always an array of arrays.
	 *
	 * @param mixed $rows Candidate list.
	 * @return array
	 */
	private static function normalize_rows( $rows ) {
		if ( ! is_array( $rows ) ) {
			return array();
		}

		$normalized = array();
		foreach ( $rows as $row ) {
			if ( is_array( $row ) ) {
				$normalized[] = $row;
			}
		}

		return $normalized;
	}
}
